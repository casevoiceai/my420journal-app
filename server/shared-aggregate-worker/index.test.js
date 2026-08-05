import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

import worker, {
  buildCombinationKey,
  buildFoldGroups,
  buildPoolKey,
  combinedEffectTags,
  evaluateAllEligibility,
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

function makeEnv(overrides = {}) {
  const db = new DatabaseSync(':memory:')
  const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')
  db.exec(schema)
  return {
    db,
    env: {
      DB: new D1Database(db),
      ADMIN_TOKEN: 'test-admin',
      CONTRIBUTOR_RATE_LIMIT_SALT: 'test-salt',
      ...overrides,
    },
  }
}

async function post(env, path, body, headers = {}) {
  return worker.fetch(new Request(`https://example.test${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CF-Connecting-IP': '203.0.113.10',
      ...headers,
    },
    body: JSON.stringify(body),
  }), env)
}

async function optIn(env, contributorId, ip = '203.0.113.10') {
  return post(env, '/contributors/opt-in', {
    anonymous_contributor_id: contributorId,
  }, { 'CF-Connecting-IP': ip })
}

async function optInAndSubmit(env, contributorId, contribution = {}, ip = '203.0.113.10') {
  let response = await optIn(env, contributorId, ip)
  assert.equal(response.status, 200)

  response = await post(env, '/contributions', {
    anonymous_contributor_id: contributorId,
    product_key: 'red berry',
    product_name_normalized: 'Red Berry',
    region_bucket: 'pa-ne',
    body_tags: ['Relaxed'],
    ...contribution,
  }, { 'CF-Connecting-IP': ip })
  assert.equal(response.status, 200)
}

function insertStagedContributors(db, count, options = {}) {
  const productKey = options.productKey || 'red berry'
  const regionBucket = options.regionBucket || 'pa-ne'
  const combinationKey = options.combinationKey || 'combo-red'
  const submittedAt = options.submittedAt || '2026-08-05T00:00:00.000Z'

  const insert = db.prepare(`
    INSERT INTO shared_contribution_staging (
      contributor_id, combination_key, product_key, product_name_normalized,
      region_bucket, body_tags_json, mind_tags_json, mood_tags_json, submitted_at
    ) VALUES (?, ?, ?, ?, ?, '[]', '[]', '[]', ?)
  `)
  for (let index = 1; index <= count; index += 1) {
    insert.run(
      `device-${index}`,
      combinationKey,
      productKey,
      'Red Berry',
      regionBucket,
      submittedAt
    )
  }
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

test('querying an ineligible pool never returns an exact or approximate contributor count', async () => {
  const { db, env } = makeEnv()
  insertStagedContributors(db, 9)

  for (const url of [
    'https://example.test/aggregates?product_key=red%20berry',
    'https://example.test/aggregates?product_key=red%20berry&region_bucket=pa-ne',
  ]) {
    const response = await worker.fetch(new Request(url), env)
    assert.equal(response.status, 200)
    const body = await response.json()

    assert.equal(body.pool_eligible, false)
    assert.equal(body.minimum_pool_met, false)
    assert.deepEqual(body.effects, [])
    for (const forbiddenField of [
      'sample_size',
      'total_contributions',
      'minimum_required',
      'distinct_contributor_count',
      'distinct_contributor_count_is_approximate',
    ]) {
      assert.equal(Object.hasOwn(body, forbiddenField), false, forbiddenField)
    }
  }
})

test('rapid creation of many contributor IDs from one source is throttled with retry-later', async () => {
  const { db, env } = makeEnv({
    CONTRIBUTOR_CREATION_LIMIT: '3',
    CONTRIBUTOR_CREATION_WINDOW_HOURS: '1',
  })

  for (let index = 1; index <= 3; index += 1) {
    const response = await optIn(env, `device-${index}`, '198.51.100.40')
    assert.equal(response.status, 200)
  }

  const blocked = await optIn(env, 'device-4', '198.51.100.40')
  assert.equal(blocked.status, 429)
  assert.ok(Number(blocked.headers.get('Retry-After')) >= 60)
  const body = await blocked.json()
  assert.equal(body.retry_later, true)
  assert.ok(body.retry_after_seconds >= 60)

  const contributorCount = db.prepare(`
    SELECT COUNT(*) AS count FROM shared_contributors
  `).get().count
  assert.equal(contributorCount, 3)
})

test('a brief threshold crossing that drops before 24 hours does not become eligible', async () => {
  const { db, env } = makeEnv()
  insertStagedContributors(db, 10)

  const t0 = new Date('2026-08-05T00:00:00.000Z')
  await evaluateAllEligibility(env, t0)

  let pending = db.prepare(`
    SELECT pending_since FROM shared_pool_eligibility_pending
    WHERE eligibility_scope = 'product' AND product_key = 'red berry'
  `).get()
  assert.equal(pending.pending_since, t0.toISOString())

  db.prepare(`
    DELETE FROM shared_contribution_staging WHERE contributor_id = 'device-10'
  `).run()
  await evaluateAllEligibility(env, new Date('2026-08-05T12:00:00.000Z'))

  pending = db.prepare(`
    SELECT pending_since FROM shared_pool_eligibility_pending
    WHERE eligibility_scope = 'product' AND product_key = 'red berry'
  `).get()
  const eligible = db.prepare(`
    SELECT eligible_at FROM shared_pool_eligibility
    WHERE eligibility_scope = 'product' AND product_key = 'red berry'
  `).get()
  assert.equal(pending, undefined)
  assert.equal(eligible, undefined)
})

test('a pool that stays above threshold through a fresh check after 24 hours becomes eligible', async () => {
  const { db, env } = makeEnv()
  insertStagedContributors(db, 10)

  const t0 = new Date('2026-08-05T00:00:00.000Z')
  await evaluateAllEligibility(env, t0)

  let eligible = db.prepare(`
    SELECT eligible_at FROM shared_pool_eligibility
    WHERE eligibility_scope = 'product' AND product_key = 'red berry'
  `).get()
  assert.equal(eligible, undefined)

  const confirmation = new Date('2026-08-06T00:00:01.000Z')
  await evaluateAllEligibility(env, confirmation)

  eligible = db.prepare(`
    SELECT eligible_at FROM shared_pool_eligibility
    WHERE eligibility_scope = 'product' AND product_key = 'red berry'
  `).get()
  const pending = db.prepare(`
    SELECT pending_since FROM shared_pool_eligibility_pending
    WHERE eligibility_scope = 'product' AND product_key = 'red berry'
  `).get()
  assert.equal(eligible.eligible_at, confirmation.toISOString())
  assert.equal(pending, undefined)
})

test('a permanent eligibility flag remains after a later opt-out', async () => {
  const { db, env } = makeEnv({ CONTRIBUTOR_CREATION_LIMIT: '20' })
  insertStagedContributors(db, 10)
  db.prepare(`
    INSERT INTO shared_contributors (anonymous_contributor_id, is_active)
    VALUES ('device-1', 1)
  `).run()

  const t0 = new Date('2026-08-05T00:00:00.000Z')
  await evaluateAllEligibility(env, t0)
  await evaluateAllEligibility(env, new Date('2026-08-06T00:00:01.000Z'))

  const response = await post(env, '/contributors/opt-out', {
    anonymous_contributor_id: 'device-1',
  })
  assert.equal(response.status, 200)

  const eligible = db.prepare(`
    SELECT eligible_at FROM shared_pool_eligibility
    WHERE eligibility_scope = 'product' AND product_key = 'red berry'
  `).get()
  assert.ok(eligible)
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
