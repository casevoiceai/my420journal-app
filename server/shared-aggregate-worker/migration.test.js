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

    CREATE TABLE shared_product_aggregates (
      product_key TEXT PRIMARY KEY,
      total_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE shared_product_contributions (
      contribution_id TEXT PRIMARY KEY,
      anonymous_contributor_id TEXT,
      product_key TEXT,
      product_name_normalized TEXT,
      brand_name TEXT,
      category TEXT,
      strain_type TEXT,
      region_bucket TEXT,
      body_tags_json TEXT,
      mind_tags_json TEXT,
      mood_tags_json TEXT,
      mood_face TEXT,
      amount_bucket TEXT,
      entry_logged_at_bucket TEXT,
      source_app_version TEXT,
      created_at TEXT
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

function insertContribution(db, values) {
  db.prepare(`
    INSERT INTO shared_product_contributions (
      contribution_id, anonymous_contributor_id, product_key,
      product_name_normalized, brand_name, category, strain_type,
      region_bucket, body_tags_json, mind_tags_json, mood_tags_json,
      mood_face, amount_bucket, entry_logged_at_bucket,
      source_app_version, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    values.id,
    values.contributorId,
    values.productKey ?? 'red berry',
    values.productName ?? 'Red Berry',
    values.brandName ?? 'Example Brand',
    values.category ?? 'flower',
    values.strainType ?? 'indica',
    values.regionBucket ?? 'pa-ne',
    values.bodyTags ?? '["Relaxed"]',
    values.mindTags ?? '[]',
    values.moodTags ?? '[]',
    values.moodFace ?? 'good',
    values.amountBucket ?? 'small',
    values.timeBucket ?? 'night',
    values.appVersion ?? 'my420journal-web',
    values.createdAt
  )
}

test('migration reconciles pending eligibility, mixed-type quarantine, and aggregate totals without exposing counts', () => {
  const db = new DatabaseSync(':memory:')
  createLegacySchema(db)

  const recentTimestamp = isoHoursAgo(12)

  for (let index = 1; index <= 10; index += 1) {
    insertContributor(db, `device-${index}`, 1)
    insertContribution(db, {
      id: `recent-${index}`,
      contributorId: `device-${index}`,
      createdAt: recentTimestamp,
    })
  }

  insertContribution(db, {
    id: 'recent-duplicate',
    contributorId: 'device-1',
    createdAt: recentTimestamp,
  })
  insertContribution(db, {
    id: 'old-valid',
    contributorId: 'device-1',
    createdAt: isoHoursAgo(100),
  })

  insertContributor(db, 'opted-out', 0)
  insertContribution(db, {
    id: 'opted-out-row',
    contributorId: 'opted-out',
    createdAt: isoHoursAgo(10),
  })
  insertContribution(db, {
    id: 'orphan-row',
    contributorId: 'missing-device',
    createdAt: isoHoursAgo(10),
  })
  insertContribution(db, {
    id: 'mixed-tag-row',
    contributorId: 'device-2',
    bodyTags: '["Relaxed",42]',
    createdAt: isoHoursAgo(10),
  })

  const migration = readFileSync(
    new URL('./migrations/0002_layer2_aggregate_redesign.sql', import.meta.url),
    'utf8'
  )
  db.exec(migration)

  const audit = db.prepare(`
    SELECT * FROM shared_layer2_migration_audit
    WHERE migration_key = 'layer2_aggregate_redesign_v4'
  `).get()

  assert.equal(audit.source_row_count, 15)
  assert.equal(audit.opted_out_rows_deleted, 1)
  assert.equal(audit.duplicate_rows_merged, 1)
  assert.equal(audit.quarantined_rows, 2)
  assert.equal(audit.quarantine_orphaned_rows, 1)
  assert.equal(audit.quarantine_malformed_effect_rows, 1)
  assert.equal(audit.valid_unique_rows, 11)
  assert.equal(audit.expected_staging_rows, 10)
  assert.equal(audit.actual_staging_rows, 10)
  assert.equal(audit.expected_folded_rows, 1)
  assert.equal(audit.combination_total, 1)
  assert.equal(audit.product_total, 1)
  assert.equal(audit.product_region_total, 1)
  assert.equal(audit.expected_product_pending, 1)
  assert.equal(audit.actual_product_pending, 1)
  assert.equal(audit.expected_combination_product_pending, 1)
  assert.equal(audit.actual_combination_product_pending, 1)
  assert.equal(audit.actual_product_region_pending, 0)
  assert.equal(audit.actual_combination_region_pending, 0)
  assert.equal(audit.unexpected_eligibility_rows, 0)
  assert.equal(audit.approximate_count_mismatches, 0)
  assert.equal(audit.quarantine_expiry_mismatches, 0)
  assert.equal(audit.old_table_dropped, 1)
  assert.ok(audit.completed_at)

  const permanentEligibility = db.prepare(`
    SELECT COUNT(*) AS count FROM shared_pool_eligibility
  `).get().count
  assert.equal(permanentEligibility, 0)

  const pending = db.prepare(`
    SELECT eligibility_scope, product_key, pending_since
    FROM shared_pool_eligibility_pending
    ORDER BY eligibility_scope
  `).all()
  assert.deepEqual(
    pending.map((row) => row.eligibility_scope),
    ['combination_product', 'product']
  )
  assert.ok(pending.every((row) => row.product_key === 'red berry' && row.pending_since))

  const quarantineReasons = db.prepare(`
    SELECT quarantine_reason
    FROM shared_layer2_migration_quarantine
    ORDER BY source_contribution_id
  `).all().map((row) => row.quarantine_reason)
  assert.ok(quarantineReasons.some((reason) => reason.includes('malformed_effect_tags')))
  assert.ok(quarantineReasons.some((reason) => reason.includes('orphaned_contributor')))

  const membershipTable = db.prepare(`
    SELECT COUNT(*) AS count
    FROM sqlite_master
    WHERE type = 'table' AND name = 'shared_aggregate_memberships'
  `).get().count
  assert.equal(membershipTable, 0)

  const oldContributionTable = db.prepare(`
    SELECT COUNT(*) AS count
    FROM sqlite_master
    WHERE type = 'table' AND name = 'shared_product_contributions'
  `).get().count
  assert.equal(oldContributionTable, 0)
})
