import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

import worker, {
  buildCombinationKey,
  buildFoldGroups,
  buildPoolKey,
  combinedEffectTags,
  normalizeContribution,
} from './index.js'

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

function makeEnv() {
  const db = new DatabaseSync(':memory:')
  const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')
  db.exec(schema)
  return { db, env: { DB: new D1Database(db), ADMIN_TOKEN: 'test-admin' } }
}

async function post(env, path, body, headers = {}) {
  return worker.fetch(new Request(`https://example.test${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  }), env)
}

async function optInAndSubmit(env, contributorId, contribution = {}) {
  let response = await post(env, '/contributors/opt-in', {
    anonymous_contributor_id: contributorId,
  })
  assert.equal(response.status, 200)

  response = await post(env, '/contributions', {
    anonymous_contributor_id: contributorId,
    product_key: 'red berry',
    product_name_normalized: 'Red Berry',
    region_bucket: 'pa-ne',
    body_tags: ['Relaxed'],
    ...contribution,
  })
  assert.equal(response.status, 200)
}

test('normalizes existing app payloads without adding personal fields', () => {
  const contribution = normalizeContribution({
    product_key: '  Red Berry  ',
    product_name_normalized: 'Red Berry',
    category: 'flower',
    entry_logged_at_bucket: 'night',
    source_app_version: 'my420journal-web',
    body_tags: ['Relaxed', '', 42],
  })

  assert.equal(contribution.product_key, 'red berry')
  assert.equal(contribution.product_category, 'flower')
  assert.equal(contribution.time_bucket, 'night')
  assert.equal(contribution.app_version, 'my420journal-web')
  assert.deepEqual(contribution.body_tags, ['Relaxed'])
  assert.equal(Object.hasOwn(contribution, 'anonymous_contributor_id'), false)
})

test('combination and pool keys remain deterministic', () => {
  const contribution = normalizeContribution({
    product_key: 'red berry',
    product_name_normalized: 'Red Berry',
    body_tags: ['Relaxed'],
    mood_tags: ['Happy'],
  })

  assert.equal(buildCombinationKey(contribution), buildCombinationKey({ ...contribution }))
  assert.equal(
    buildPoolKey('product', 'red berry'),
    '{"scope":"product","product_key":"red berry"}'
  )
})

test('fold grouping counts distinct contributors only inside one batch', () => {
  const rows = [
    { contributor_id: 'a', product_key: 'red berry', region_bucket: 'pa-ne', combination_key: 'combo-a' },
    { contributor_id: 'a', product_key: 'red berry', region_bucket: 'pa-ne', combination_key: 'combo-b' },
    { contributor_id: 'b', product_key: 'red berry', region_bucket: 'pa-ne', combination_key: 'combo-c' },
  ]
  const groups = buildFoldGroups(rows)
  const productPool = groups.find((group) => group.aggregate_scope === 'product')
  assert.equal(productPool.total_count, 3)
  assert.equal(productPool.distinct_contributor_count, 2)
})

test('effect tags are deduplicated across body, mind, and mood arrays', () => {
  assert.deepEqual(combinedEffectTags({
    body_tags_json: '["Relaxed","Sleepy"]',
    mind_tags_json: '["Relaxed"]',
    mood_tags_json: '["Relaxed","Happy"]',
  }), ['Happy', 'Relaxed', 'Sleepy'])
})

test('a pool becomes eligible at ten staged contributors and stays eligible after opt-out', async () => {
  const { db, env } = makeEnv()

  for (let index = 1; index <= 9; index += 1) {
    await optInAndSubmit(env, `device-${index}`)
  }

  let eligibilityCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM shared_pool_eligibility
    WHERE eligibility_scope = 'product' AND product_key = 'red berry'
  `).get().count
  assert.equal(eligibilityCount, 0)

  await optInAndSubmit(env, 'device-10')

  eligibilityCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM shared_pool_eligibility
    WHERE eligibility_scope = 'product' AND product_key = 'red berry'
  `).get().count
  assert.equal(eligibilityCount, 1)

  const combinationEligibility = db.prepare(`
    SELECT COUNT(*) AS count
    FROM shared_pool_eligibility
    WHERE eligibility_scope = 'combination_product'
      AND product_key = 'red berry'
  `).get().count
  assert.equal(combinationEligibility, 1)

  const response = await post(env, '/contributors/opt-out', {
    anonymous_contributor_id: 'device-1',
  })
  assert.equal(response.status, 200)

  const stagedContributors = db.prepare(`
    SELECT COUNT(DISTINCT contributor_id) AS count
    FROM shared_contribution_staging
    WHERE product_key = 'red berry'
  `).get().count
  assert.equal(stagedContributors, 9)

  eligibilityCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM shared_pool_eligibility
    WHERE eligibility_scope = 'product' AND product_key = 'red berry'
  `).get().count
  assert.equal(eligibilityCount, 1)

  const membershipTable = db.prepare(`
    SELECT COUNT(*) AS count
    FROM sqlite_master
    WHERE type = 'table' AND name = 'shared_aggregate_memberships'
  `).get().count
  assert.equal(membershipTable, 0)
})

test('aggregate reads suppress unqualified combinations and never double-count one tag across categories', async () => {
  const { db, env } = makeEnv()
  const combination = buildCombinationKey({
    product_key: 'red berry',
    product_name_normalized: 'Red Berry',
    region_bucket: 'pa-ne',
    body_tags: ['Relaxed'],
    mind_tags: ['Relaxed'],
    mood_tags: ['Relaxed'],
  })

  db.prepare(`
    INSERT INTO shared_pool_eligibility (
      eligibility_scope, product_key, region_bucket, combination_key, eligible_at
    ) VALUES ('product', 'red berry', '', '', CURRENT_TIMESTAMP)
  `).run()
  db.prepare(`
    INSERT INTO shared_product_aggregates (
      combination_key, aggregate_scope, product_key, product_name_normalized,
      total_count, distinct_contributor_count
    ) VALUES (?, 'product', 'red berry', 'Red Berry', 5, 5)
  `).run(buildPoolKey('product', 'red berry'))
  db.prepare(`
    INSERT INTO shared_product_aggregates (
      combination_key, aggregate_scope, product_key, product_name_normalized,
      region_bucket, body_tags_json, mind_tags_json, mood_tags_json,
      total_count, distinct_contributor_count
    ) VALUES (?, 'combination', 'red berry', 'Red Berry', 'pa-ne', ?, ?, ?, 5, 5)
  `).run(combination, '["Relaxed"]', '["Relaxed"]', '["Relaxed"]')

  let response = await worker.fetch(new Request('https://example.test/aggregates?product_key=red%20berry'), env)
  let body = await response.json()
  assert.deepEqual(body.effects, [])

  db.prepare(`
    INSERT INTO shared_pool_eligibility (
      eligibility_scope, product_key, region_bucket, combination_key, eligible_at
    ) VALUES ('combination_product', 'red berry', '', ?, CURRENT_TIMESTAMP)
  `).run(combination)

  response = await worker.fetch(new Request('https://example.test/aggregates?product_key=red%20berry'), env)
  body = await response.json()
  assert.equal(body.effects.length, 1)
  assert.equal(body.effects[0].label, 'Relaxed')
  assert.equal(body.effects[0].count, 5)
  assert.equal(body.effects[0].percent, 100)
  assert.equal(body.distinct_contributor_count_is_approximate, true)
})

test('expired quarantine rows are deleted while unexpired rows remain', async () => {
  const { db, env } = makeEnv()
  db.prepare(`
    INSERT INTO shared_layer2_migration_quarantine (
      source_contribution_id, quarantine_reason, expires_at
    ) VALUES
      ('expired', 'test', '2000-01-01T00:00:00.000Z'),
      ('future', 'test', '2999-01-01T00:00:00.000Z')
  `).run()

  const response = await post(
    env,
    '/admin/purge-quarantine',
    {},
    { Authorization: 'Bearer test-admin' }
  )
  assert.equal(response.status, 200)

  const remaining = db.prepare(`
    SELECT source_contribution_id
    FROM shared_layer2_migration_quarantine
    ORDER BY source_contribution_id
  `).all().map((row) => row.source_contribution_id)
  assert.deepEqual(remaining, ['future'])
})
