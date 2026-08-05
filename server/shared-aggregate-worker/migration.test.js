import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

function isoHoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

function createLegacySchema(db) {
  db.exec(`
    CREATE TABLE shared_contributors (
      anonymous_contributor_id TEXT PRIMARY KEY,
      is_active INTEGER NOT NULL DEFAULT 0,
      opted_in_at TEXT,
      opted_out_at TEXT,
      delete_requested_at TEXT,
      delete_completed_at TEXT,
      jurisdiction_or_region_optional TEXT,
      app_version TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE shared_product_contributions (
      contribution_id TEXT PRIMARY KEY,
      anonymous_contributor_id TEXT NOT NULL,
      product_key TEXT NOT NULL,
      product_name_normalized TEXT NOT NULL,
      brand_name TEXT,
      category TEXT,
      strain_type TEXT,
      dispensary_place_id TEXT,
      dispensary_name_normalized TEXT,
      region_bucket TEXT,
      body_tags_json TEXT NOT NULL DEFAULT '[]',
      mind_tags_json TEXT NOT NULL DEFAULT '[]',
      mood_tags_json TEXT NOT NULL DEFAULT '[]',
      mood_face TEXT,
      amount_bucket TEXT,
      entry_logged_at_bucket TEXT,
      source_app_version TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE shared_product_aggregates (
      aggregate_id TEXT PRIMARY KEY,
      product_key TEXT NOT NULL,
      product_name_normalized TEXT,
      region_bucket TEXT,
      sample_size INTEGER NOT NULL DEFAULT 0,
      effect_counts_json TEXT NOT NULL DEFAULT '{}',
      effect_percentages_json TEXT NOT NULL DEFAULT '{}',
      mood_face_counts_json TEXT NOT NULL DEFAULT '{}',
      category_counts_json TEXT NOT NULL DEFAULT '{}',
      minimum_pool_met INTEGER NOT NULL DEFAULT 0,
      last_calculated_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

function insertContributor(db, id, active = 1) {
  db.prepare(`
    INSERT INTO shared_contributors (
      anonymous_contributor_id, is_active, opted_in_at, opted_out_at
    ) VALUES (?, ?, CURRENT_TIMESTAMP, ?)
  `).run(id, active, active ? null : new Date().toISOString())
}

function insertContribution(db, {
  id,
  contributorId,
  productKey = 'red berry',
  regionBucket = 'pa-ne',
  bodyTags = '["Relaxed"]',
  mindTags = '[]',
  moodTags = '[]',
  createdAt = isoHoursAgo(24),
}) {
  db.prepare(`
    INSERT INTO shared_product_contributions (
      contribution_id, anonymous_contributor_id, product_key,
      product_name_normalized, category, strain_type, region_bucket,
      body_tags_json, mind_tags_json, mood_tags_json,
      entry_logged_at_bucket, source_app_version, created_at
    ) VALUES (?, ?, ?, 'Red Berry', 'flower', 'indica', ?, ?, ?, ?, 'night', 'test', ?)
  `).run(
    id,
    contributorId,
    productKey,
    regionBucket,
    bodyTags,
    mindTags,
    moodTags,
    createdAt
  )
}

test('migration reconciles staging eligibility, mixed-type quarantine, and aggregate totals without membership tokens', () => {
  const db = new DatabaseSync(':memory:')
  createLegacySchema(db)

  for (let index = 1; index <= 25; index += 1) {
    const contributorId = `recent-${index}`
    insertContributor(db, contributorId)
    insertContribution(db, {
      id: `recent-row-${index}`,
      contributorId,
      createdAt: isoHoursAgo(24),
    })
  }

  insertContributor(db, 'old-1')
  insertContribution(db, {
    id: 'old-row-1',
    contributorId: 'old-1',
    createdAt: isoHoursAgo(100),
  })
  insertContribution(db, {
    id: 'old-row-duplicate',
    contributorId: 'old-1',
    createdAt: isoHoursAgo(100),
  })

  insertContributor(db, 'malformed-json')
  insertContribution(db, {
    id: 'malformed-json-row',
    contributorId: 'malformed-json',
    bodyTags: '[not-json',
  })

  insertContributor(db, 'mixed-tags')
  insertContribution(db, {
    id: 'mixed-tags-row',
    contributorId: 'mixed-tags',
    bodyTags: '["Relaxed",42]',
  })

  insertContribution(db, {
    id: 'orphan-row',
    contributorId: 'missing-contributor',
  })

  insertContributor(db, 'opted-out', 0)
  insertContribution(db, {
    id: 'opted-out-row',
    contributorId: 'opted-out',
  })

  const migration = readFileSync(
    new URL('./migrations/0002_layer2_aggregate_redesign.sql', import.meta.url),
    'utf8'
  )

  db.exec('BEGIN IMMEDIATE')
  try {
    db.exec(migration)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  const audit = db.prepare(`
    SELECT * FROM shared_layer2_migration_audit
    WHERE migration_key = 'layer2_aggregate_redesign_v3'
  `).get()

  assert.equal(audit.old_table_dropped, 1)
  assert.ok(audit.completed_at)
  assert.equal(audit.actual_staging_rows, audit.expected_staging_rows)
  assert.equal(audit.combination_total, audit.expected_folded_rows)
  assert.equal(audit.product_total, audit.expected_folded_rows)
  assert.equal(audit.product_region_total, audit.expected_product_region_total)
  assert.equal(audit.actual_product_eligibility, audit.expected_product_eligibility)
  assert.equal(audit.actual_product_region_eligibility, audit.expected_product_region_eligibility)
  assert.equal(audit.actual_combination_product_eligibility, audit.expected_combination_product_eligibility)
  assert.equal(audit.actual_combination_region_eligibility, audit.expected_combination_region_eligibility)
  assert.equal(audit.approximate_count_mismatches, 0)
  assert.equal(audit.quarantine_expiry_mismatches, 0)
  assert.equal(audit.quarantine_malformed_effect_rows, 2)
  assert.equal(audit.quarantine_orphaned_rows, 1)
  assert.equal(audit.duplicate_rows_merged, 1)

  const mixed = db.prepare(`
    SELECT quarantine_reason, quarantined_at, expires_at
    FROM shared_layer2_migration_quarantine
    WHERE source_contribution_id = 'mixed-tags-row'
  `).get()
  assert.match(mixed.quarantine_reason, /malformed_effect_tags/)
  assert.ok(new Date(mixed.expires_at) > new Date(mixed.quarantined_at))

  const productEligible = db.prepare(`
    SELECT COUNT(*) AS count
    FROM shared_pool_eligibility
    WHERE eligibility_scope = 'product' AND product_key = 'red berry'
  `).get().count
  const regionEligible = db.prepare(`
    SELECT COUNT(*) AS count
    FROM shared_pool_eligibility
    WHERE eligibility_scope = 'product_region'
      AND product_key = 'red berry' AND region_bucket = 'pa-ne'
  `).get().count
  const combinationProductEligible = db.prepare(`
    SELECT COUNT(*) AS count
    FROM shared_pool_eligibility
    WHERE eligibility_scope = 'combination_product'
      AND product_key = 'red berry'
  `).get().count
  const combinationRegionEligible = db.prepare(`
    SELECT COUNT(*) AS count
    FROM shared_pool_eligibility
    WHERE eligibility_scope = 'combination_region'
      AND product_key = 'red berry' AND region_bucket = 'pa-ne'
  `).get().count

  assert.equal(productEligible, 1)
  assert.equal(regionEligible, 1)
  assert.equal(combinationProductEligible, 1)
  assert.equal(combinationRegionEligible, 1)

  const membershipTable = db.prepare(`
    SELECT COUNT(*) AS count
    FROM sqlite_master
    WHERE type = 'table' AND name = 'shared_aggregate_memberships'
  `).get().count
  assert.equal(membershipTable, 0)
})
