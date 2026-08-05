import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

import { evaluateAllEligibility } from './index.js'

class D1Statement {
  constructor(db, sql, bindings = []) {
    this.db = db
    this.sql = sql
    this.bindings = bindings
  }

  bind(...bindings) {
    return new D1Statement(this.db, this.sql, bindings)
  }

  async first() {
    return this.db.prepare(this.sql).get(...this.bindings) || null
  }

  async all() {
    return { results: this.db.prepare(this.sql).all(...this.bindings) }
  }

  async run() {
    const result = this.db.prepare(this.sql).run(...this.bindings)
    return { meta: { changes: Number(result.changes || 0) } }
  }
}

class D1Database {
  constructor(db) {
    this.db = db
  }

  prepare(sql) {
    return new D1Statement(this.db, sql)
  }

  async batch(statements) {
    this.db.exec('BEGIN IMMEDIATE')
    try {
      const results = []
      for (const statement of statements) results.push(await statement.run())
      this.db.exec('COMMIT')
      return results
    } catch (error) {
      this.db.exec('ROLLBACK')
      throw error
    }
  }
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

function insertLegacyContribution(db, contributorId, timestamp) {
  db.prepare(`
    INSERT INTO shared_contributors (
      anonymous_contributor_id, is_active, opted_in_at
    ) VALUES (?, 1, CURRENT_TIMESTAMP)
  `).run(contributorId)

  db.prepare(`
    INSERT INTO shared_product_contributions (
      contribution_id, anonymous_contributor_id, product_key,
      product_name_normalized, brand_name, category, strain_type,
      region_bucket, body_tags_json, mind_tags_json, mood_tags_json,
      mood_face, amount_bucket, entry_logged_at_bucket,
      source_app_version, created_at
    ) VALUES (?, ?, 'red berry', 'Red Berry', 'Example Brand', 'flower',
      'indica', 'pa-ne', '["Relaxed"]', '[]', '[]', 'good', 'small',
      'night', 'my420journal-web', ?)
  `).run(`legacy-${contributorId}`, contributorId, timestamp)
}

test('migrated ISO staging rows are not counted as new activity against SQLite pending timestamps', async () => {
  const db = new DatabaseSync(':memory:')
  createLegacySchema(db)

  const legacyTimestamp = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  for (let index = 1; index <= 10; index += 1) {
    insertLegacyContribution(db, `device-${index}`, legacyTimestamp)
  }

  const redesignMigration = readFileSync(
    new URL('./migrations/0002_layer2_aggregate_redesign.sql', import.meta.url),
    'utf8'
  )
  db.exec(redesignMigration)

  const beforeNormalization = db.prepare(`
    SELECT pending_since
    FROM shared_pool_eligibility_pending
    WHERE eligibility_scope = 'product' AND product_key = 'red berry'
  `).get()
  assert.match(beforeNormalization.pending_since, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)

  const timestampMigration = readFileSync(
    new URL('./migrations/0003_normalize_pending_timestamps.sql', import.meta.url),
    'utf8'
  )
  db.exec(timestampMigration)

  const normalizedPending = db.prepare(`
    SELECT pending_since
    FROM shared_pool_eligibility_pending
    WHERE eligibility_scope = 'product' AND product_key = 'red berry'
  `).get().pending_since
  assert.match(normalizedPending, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)

  const env = {
    DB: new D1Database(db),
    ELIGIBILITY_CONFIRMATION_HOURS: '24',
    ELIGIBILITY_NEW_ACTIVITY_CONTRIBUTOR_MINIMUM: '2',
  }
  const afterWaitingPeriod = new Date(Date.parse(normalizedPending) + 24 * 60 * 60 * 1000 + 1000)
  await evaluateAllEligibility(env, afterWaitingPeriod)

  let eligible = db.prepare(`
    SELECT eligible_at FROM shared_pool_eligibility
    WHERE eligibility_scope = 'product' AND product_key = 'red berry'
  `).get()
  let pending = db.prepare(`
    SELECT pending_since FROM shared_pool_eligibility_pending
    WHERE eligibility_scope = 'product' AND product_key = 'red berry'
  `).get()
  assert.equal(eligible, undefined)
  assert.equal(pending, undefined)

  const restartedPending = new Date(afterWaitingPeriod.getTime() + 60 * 60 * 1000)
  db.prepare(`
    INSERT INTO shared_pool_eligibility_pending (
      eligibility_scope, product_key, region_bucket, combination_key, pending_since
    ) VALUES ('product', 'red berry', '', '', ?)
  `).run(restartedPending.toISOString().replace('T', ' ').replace('.000Z', ''))

  pending = db.prepare(`
    SELECT pending_since FROM shared_pool_eligibility_pending
    WHERE eligibility_scope = 'product' AND product_key = 'red berry'
  `).get()
  assert.equal(pending.pending_since, restartedPending.toISOString())

  const newActivityTimestamp = new Date(restartedPending.getTime() + 60 * 60 * 1000).toISOString()
  db.prepare(`
    INSERT INTO shared_contribution_staging (
      contributor_id, combination_key, product_key, product_name_normalized,
      region_bucket, body_tags_json, mind_tags_json, mood_tags_json, submitted_at
    ) VALUES
      ('device-1', 'post-migration-1', 'red berry', 'Red Berry', 'pa-ne', '[]', '[]', '[]', ?),
      ('device-2', 'post-migration-2', 'red berry', 'Red Berry', 'pa-ne', '[]', '[]', '[]', ?)
  `).run(newActivityTimestamp, newActivityTimestamp)

  const confirmationTime = new Date(restartedPending.getTime() + 24 * 60 * 60 * 1000 + 1000)
  await evaluateAllEligibility(env, confirmationTime)

  eligible = db.prepare(`
    SELECT eligible_at FROM shared_pool_eligibility
    WHERE eligibility_scope = 'product' AND product_key = 'red berry'
  `).get()
  assert.equal(eligible.eligible_at, confirmationTime.toISOString())
})
