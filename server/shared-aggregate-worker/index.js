const PRODUCT_MINIMUM = 10
const REGION_MINIMUM = 25
const STAGING_WINDOW_MS = 72 * 60 * 60 * 1000
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000
const MAX_SUBMISSIONS_PER_24_HOURS = 20
const QUARANTINE_RETENTION_DAYS = 30

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function cleanString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeProductKey(value = '') {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ')
}

function cleanTags(value) {
  let tags = value
  if (typeof tags === 'string') {
    try { tags = JSON.parse(tags) } catch { tags = [] }
  }
  if (!Array.isArray(tags)) return []
  return [...new Set(
    tags
      .filter((tag) => typeof tag === 'string')
      .map((tag) => tag.trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b))
}

function combinedEffectTags(row = {}) {
  return [...new Set([
    ...cleanTags(row.body_tags_json ?? row.body_tags),
    ...cleanTags(row.mind_tags_json ?? row.mind_tags),
    ...cleanTags(row.mood_tags_json ?? row.mood_tags),
  ])].sort((a, b) => a.localeCompare(b))
}

function normalizeContribution(body = {}) {
  const productName = cleanString(body.product_name_normalized || body.product_name)
  const productKey = normalizeProductKey(body.product_key || productName || '')
  return {
    product_key: productKey,
    product_name_normalized: productName || productKey,
    brand_name: cleanString(body.brand_name || body.brand),
    product_category: cleanString(body.product_category || body.category),
    strain_type: cleanString(body.strain_type),
    region_bucket: cleanString(body.region_bucket),
    body_tags: cleanTags(body.body_tags ?? body.body_tags_json),
    mind_tags: cleanTags(body.mind_tags ?? body.mind_tags_json),
    mood_tags: cleanTags(body.mood_tags ?? body.mood_tags_json),
    mood_face: cleanString(body.mood_face),
    amount_bucket: cleanString(body.amount_bucket),
    time_bucket: cleanString(body.time_bucket || body.entry_logged_at_bucket),
    app_version: cleanString(body.app_version || body.source_app_version),
  }
}

function buildCombinationKey(value) {
  const row = normalizeContribution(value)
  return JSON.stringify({
    scope: 'combination',
    product_key: row.product_key,
    product_name_normalized: row.product_name_normalized,
    brand_name: row.brand_name,
    product_category: row.product_category,
    strain_type: row.strain_type,
    region_bucket: row.region_bucket,
    body_tags_json: JSON.stringify(row.body_tags),
    mind_tags_json: JSON.stringify(row.mind_tags),
    mood_tags_json: JSON.stringify(row.mood_tags),
    mood_face: row.mood_face,
    amount_bucket: row.amount_bucket,
    time_bucket: row.time_bucket,
    app_version: row.app_version,
  })
}

function buildPoolKey(scope, productKey, regionBucket = null) {
  const base = { scope, product_key: normalizeProductKey(productKey) }
  if (scope === 'product') return JSON.stringify(base)
  if (scope === 'product_region') {
    return JSON.stringify({ ...base, region_bucket: cleanString(regionBucket) })
  }
  throw new Error(`Unsupported aggregate scope: ${scope}`)
}

function buildFoldGroups(rows = []) {
  const groups = new Map()
  const add = (key, row, scope) => {
    const group = groups.get(key) || {
      combination_key: key,
      aggregate_scope: scope,
      product_key: row.product_key,
      total_count: 0,
      contributor_ids: new Set(),
    }
    group.total_count += 1
    group.contributor_ids.add(row.contributor_id)
    groups.set(key, group)
  }

  for (const row of rows) {
    if (!row?.contributor_id || !row?.product_key || !row?.combination_key) continue
    add(row.combination_key, row, 'combination')
    add(buildPoolKey('product', row.product_key), row, 'product')
    if (row.region_bucket) {
      add(buildPoolKey('product_region', row.product_key, row.region_bucket), row, 'product_region')
    }
  }

  return [...groups.values()].map(({ contributor_ids, ...group }) => ({
    ...group,
    distinct_contributor_count: contributor_ids.size,
  }))
}

function fullEligibilityStatements(env, eligibleAt) {
  return [
    env.DB.prepare(`
      INSERT OR IGNORE INTO shared_pool_eligibility (
        eligibility_scope, product_key, region_bucket, combination_key, eligible_at
      )
      SELECT 'product', product_key, '', '', ?
      FROM shared_contribution_staging
      GROUP BY product_key
      HAVING COUNT(DISTINCT contributor_id) >= ?
    `).bind(eligibleAt, PRODUCT_MINIMUM),
    env.DB.prepare(`
      INSERT OR IGNORE INTO shared_pool_eligibility (
        eligibility_scope, product_key, region_bucket, combination_key, eligible_at
      )
      SELECT 'product_region', product_key, region_bucket, '', ?
      FROM shared_contribution_staging
      WHERE region_bucket IS NOT NULL AND trim(region_bucket) <> ''
      GROUP BY product_key, region_bucket
      HAVING COUNT(DISTINCT contributor_id) >= ?
    `).bind(eligibleAt, REGION_MINIMUM),
    env.DB.prepare(`
      INSERT OR IGNORE INTO shared_pool_eligibility (
        eligibility_scope, product_key, region_bucket, combination_key, eligible_at
      )
      SELECT 'combination_product', product_key, '', combination_key, ?
      FROM shared_contribution_staging
      GROUP BY product_key, combination_key
      HAVING COUNT(DISTINCT contributor_id) >= ?
    `).bind(eligibleAt, PRODUCT_MINIMUM),
    env.DB.prepare(`
      INSERT OR IGNORE INTO shared_pool_eligibility (
        eligibility_scope, product_key, region_bucket, combination_key, eligible_at
      )
      SELECT 'combination_region', product_key, region_bucket, combination_key, ?
      FROM shared_contribution_staging
      WHERE region_bucket IS NOT NULL AND trim(region_bucket) <> ''
      GROUP BY product_key, region_bucket, combination_key
      HAVING COUNT(DISTINCT contributor_id) >= ?
    `).bind(eligibleAt, REGION_MINIMUM),
  ]
}

function contributionEligibilityStatements(env, row, eligibleAt) {
  const statements = [
    env.DB.prepare(`
      INSERT OR IGNORE INTO shared_pool_eligibility (
        eligibility_scope, product_key, region_bucket, combination_key, eligible_at
      )
      SELECT 'product', ?, '', '', ?
      WHERE (
        SELECT COUNT(DISTINCT contributor_id)
        FROM shared_contribution_staging
        WHERE product_key = ?
      ) >= ?
    `).bind(row.product_key, eligibleAt, row.product_key, PRODUCT_MINIMUM),
    env.DB.prepare(`
      INSERT OR IGNORE INTO shared_pool_eligibility (
        eligibility_scope, product_key, region_bucket, combination_key, eligible_at
      )
      SELECT 'combination_product', ?, '', ?, ?
      WHERE (
        SELECT COUNT(DISTINCT contributor_id)
        FROM shared_contribution_staging
        WHERE product_key = ? AND combination_key = ?
      ) >= ?
    `).bind(
      row.product_key,
      row.combination_key,
      eligibleAt,
      row.product_key,
      row.combination_key,
      PRODUCT_MINIMUM
    ),
  ]

  if (row.region_bucket) {
    statements.push(
      env.DB.prepare(`
        INSERT OR IGNORE INTO shared_pool_eligibility (
          eligibility_scope, product_key, region_bucket, combination_key, eligible_at
        )
        SELECT 'product_region', ?, ?, '', ?
        WHERE (
          SELECT COUNT(DISTINCT contributor_id)
          FROM shared_contribution_staging
          WHERE product_key = ? AND region_bucket = ?
        ) >= ?
      `).bind(
        row.product_key,
        row.region_bucket,
        eligibleAt,
        row.product_key,
        row.region_bucket,
        REGION_MINIMUM
      ),
      env.DB.prepare(`
        INSERT OR IGNORE INTO shared_pool_eligibility (
          eligibility_scope, product_key, region_bucket, combination_key, eligible_at
        )
        SELECT 'combination_region', ?, ?, ?, ?
        WHERE (
          SELECT COUNT(DISTINCT contributor_id)
          FROM shared_contribution_staging
          WHERE product_key = ? AND region_bucket = ? AND combination_key = ?
        ) >= ?
      `).bind(
        row.product_key,
        row.region_bucket,
        row.combination_key,
        eligibleAt,
        row.product_key,
        row.region_bucket,
        row.combination_key,
        REGION_MINIMUM
      )
    )
  }

  return statements
}

function requestEligibilityStatements(env, productKey, regionBucket, eligibleAt) {
  if (regionBucket) {
    return [
      env.DB.prepare(`
        INSERT OR IGNORE INTO shared_pool_eligibility (
          eligibility_scope, product_key, region_bucket, combination_key, eligible_at
        )
        SELECT 'product_region', ?, ?, '', ?
        WHERE (
          SELECT COUNT(DISTINCT contributor_id)
          FROM shared_contribution_staging
          WHERE product_key = ? AND region_bucket = ?
        ) >= ?
      `).bind(productKey, regionBucket, eligibleAt, productKey, regionBucket, REGION_MINIMUM),
      env.DB.prepare(`
        INSERT OR IGNORE INTO shared_pool_eligibility (
          eligibility_scope, product_key, region_bucket, combination_key, eligible_at
        )
        SELECT 'combination_region', product_key, region_bucket, combination_key, ?
        FROM shared_contribution_staging
        WHERE product_key = ? AND region_bucket = ?
        GROUP BY product_key, region_bucket, combination_key
        HAVING COUNT(DISTINCT contributor_id) >= ?
      `).bind(eligibleAt, productKey, regionBucket, REGION_MINIMUM),
    ]
  }

  return [
    env.DB.prepare(`
      INSERT OR IGNORE INTO shared_pool_eligibility (
        eligibility_scope, product_key, region_bucket, combination_key, eligible_at
      )
      SELECT 'product', ?, '', '', ?
      WHERE (
        SELECT COUNT(DISTINCT contributor_id)
        FROM shared_contribution_staging
        WHERE product_key = ?
      ) >= ?
    `).bind(productKey, eligibleAt, productKey, PRODUCT_MINIMUM),
    env.DB.prepare(`
      INSERT OR IGNORE INTO shared_pool_eligibility (
        eligibility_scope, product_key, region_bucket, combination_key, eligible_at
      )
      SELECT 'combination_product', product_key, '', combination_key, ?
      FROM shared_contribution_staging
      WHERE product_key = ?
      GROUP BY product_key, combination_key
      HAVING COUNT(DISTINCT contributor_id) >= ?
    `).bind(eligibleAt, productKey, PRODUCT_MINIMUM),
  ]
}

async function readJson(request) {
  try { return await request.json() } catch { return null }
}

function changes(result) {
  return Number(result?.meta?.changes || result?.changes || 0)
}

async function upsertContributor(env, body) {
  const id = cleanString(body?.anonymous_contributor_id)
  if (!id) return json({ ok: false, error: 'anonymous_contributor_id is required' }, 400)

  const suppressed = await env.DB.prepare(`
    SELECT contributor_id FROM shared_contributor_suppressions WHERE contributor_id = ?
  `).bind(id).first()
  if (suppressed) {
    return json({
      ok: false,
      suppressed: true,
      error: 'This contributor ID previously opted out and cannot submit future shared contributions.',
    }, 409)
  }

  const now = new Date().toISOString()
  await env.DB.prepare(`
    INSERT INTO shared_contributors (
      anonymous_contributor_id, is_active, opted_in_at, opted_out_at,
      delete_requested_at, delete_completed_at, app_version, updated_at
    ) VALUES (?, 1, COALESCE(?, ?), NULL, NULL, NULL, ?, ?)
    ON CONFLICT(anonymous_contributor_id) DO UPDATE SET
      is_active = 1,
      opted_in_at = COALESCE(shared_contributors.opted_in_at, excluded.opted_in_at),
      opted_out_at = NULL,
      delete_requested_at = NULL,
      delete_completed_at = NULL,
      app_version = excluded.app_version,
      updated_at = excluded.updated_at
  `).bind(id, body?.shared_opt_in_at || null, now, body?.app_version || null, now).run()

  return json({ ok: true, anonymous_contributor_id: id })
}

async function requestOptOut(env, body) {
  const id = cleanString(body?.anonymous_contributor_id)
  if (!id) return json({ ok: false, error: 'anonymous_contributor_id is required' }, 400)

  const now = new Date().toISOString()
  const results = await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO shared_contributor_suppressions (contributor_id, suppressed_at, reason)
      VALUES (?, ?, 'user_opt_out')
      ON CONFLICT(contributor_id) DO UPDATE SET suppressed_at = excluded.suppressed_at
    `).bind(id, now),
    env.DB.prepare(`
      DELETE FROM shared_contribution_staging WHERE contributor_id = ?
    `).bind(id),
    env.DB.prepare(`
      DELETE FROM shared_contributors WHERE anonymous_contributor_id = ?
    `).bind(id),
  ])

  return json({
    ok: true,
    opted_out_at: now,
    pending_staging_rows_deleted: changes(results[1]),
    future_contributions_blocked: true,
    permanent_eligibility_flags_changed: false,
    historical_aggregate_counts_changed: false,
  })
}

async function createContribution(env, body) {
  const contributorId = cleanString(body?.anonymous_contributor_id)
  const row = normalizeContribution(body)
  if (!contributorId) return json({ ok: false, error: 'anonymous_contributor_id is required' }, 400)
  if (!row.product_key) return json({ ok: false, error: 'product_key or product_name is required' }, 400)

  const active = await env.DB.prepare(`
    SELECT sc.anonymous_contributor_id
    FROM shared_contributors sc
    LEFT JOIN shared_contributor_suppressions ss
      ON ss.contributor_id = sc.anonymous_contributor_id
    WHERE sc.anonymous_contributor_id = ? AND sc.is_active = 1 AND ss.contributor_id IS NULL
  `).bind(contributorId).first()
  if (!active) return json({ ok: false, error: 'Contributor is not opted in or is suppressed.' }, 403)

  const combinationKey = buildCombinationKey(row)
  const duplicate = await env.DB.prepare(`
    SELECT submitted_at FROM shared_contribution_staging
    WHERE contributor_id = ? AND combination_key = ?
    ORDER BY submitted_at DESC
    LIMIT 1
  `).bind(contributorId, combinationKey).first()
  if (duplicate) {
    return json({
      ok: true,
      duplicate: true,
      stored: false,
      combination_key: combinationKey,
      submitted_at: duplicate.submitted_at,
    })
  }

  const now = new Date()
  const nowIso = now.toISOString()
  const rateCutoff = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS).toISOString()
  const pending = await env.DB.prepare(`
    SELECT COUNT(*) AS pending_count FROM shared_contribution_staging
    WHERE contributor_id = ? AND submitted_at >= ?
  `).bind(contributorId, rateCutoff).first()
  if (Number(pending?.pending_count || 0) >= MAX_SUBMISSIONS_PER_24_HOURS) {
    return json({ ok: false, error: 'Shared contribution rate limit reached.', limit: MAX_SUBMISSIONS_PER_24_HOURS }, 429)
  }

  const stagedRow = {
    ...row,
    contributor_id: contributorId,
    combination_key: combinationKey,
  }

  const statements = [
    env.DB.prepare(`
      INSERT OR IGNORE INTO shared_contribution_staging (
        contributor_id, combination_key, product_key, product_name_normalized,
        brand_name, product_category, strain_type, region_bucket,
        body_tags_json, mind_tags_json, mood_tags_json, mood_face,
        amount_bucket, time_bucket, app_version, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      contributorId,
      combinationKey,
      row.product_key,
      row.product_name_normalized,
      row.brand_name,
      row.product_category,
      row.strain_type,
      row.region_bucket,
      JSON.stringify(row.body_tags),
      JSON.stringify(row.mind_tags),
      JSON.stringify(row.mood_tags),
      row.mood_face,
      row.amount_bucket,
      row.time_bucket,
      row.app_version,
      nowIso
    ),
    ...contributionEligibilityStatements(env, stagedRow, nowIso),
  ]

  const results = await env.DB.batch(statements)
  if (changes(results[0]) === 0) {
    return json({ ok: true, duplicate: true, stored: false, combination_key: combinationKey })
  }

  return json({
    ok: true,
    stored: true,
    staged: true,
    combination_key: combinationKey,
    submitted_at: nowIso,
    eligible_for_aggregation_at: new Date(now.getTime() + STAGING_WINDOW_MS).toISOString(),
  })
}

async function retractContribution(env, body) {
  const contributorId = cleanString(body?.anonymous_contributor_id)
  if (!contributorId) return json({ ok: false, error: 'anonymous_contributor_id is required' }, 400)

  let combinationKey = cleanString(body?.combination_key)
  if (!combinationKey) {
    const row = normalizeContribution(body)
    if (!row.product_key) return json({ ok: false, error: 'combination_key or contribution fields are required' }, 400)
    combinationKey = buildCombinationKey(row)
  }

  const result = await env.DB.prepare(`
    DELETE FROM shared_contribution_staging
    WHERE contributor_id = ? AND combination_key = ?
  `).bind(contributorId, combinationKey).run()

  return json({
    ok: true,
    retracted: changes(result) > 0,
    staging_rows_deleted: changes(result),
  })
}

const UPSERT_TOTALS_AND_APPROXIMATE_CONTRIBUTORS = `
  ON CONFLICT(combination_key) DO UPDATE SET
    total_count = shared_product_aggregates.total_count + excluded.total_count,
    distinct_contributor_count = shared_product_aggregates.distinct_contributor_count + excluded.distinct_contributor_count,
    last_updated = excluded.last_updated
`

async function foldEligibleStaging(env, now = new Date()) {
  const cutoff = new Date(now.getTime() - STAGING_WINDOW_MS).toISOString()
  const nowIso = now.toISOString()
  const eligible = await env.DB.prepare(`
    SELECT COUNT(*) AS eligible_count
    FROM shared_contribution_staging
    WHERE submitted_at <= ?
  `).bind(cutoff).first()
  const eligibleCount = Number(eligible?.eligible_count || 0)

  const statements = [...fullEligibilityStatements(env, nowIso)]

  if (eligibleCount > 0) {
    statements.push(
      env.DB.prepare(`
        INSERT INTO shared_product_aggregates (
          combination_key, aggregate_scope, product_key, product_name_normalized,
          brand_name, product_category, strain_type, region_bucket,
          body_tags_json, mind_tags_json, mood_tags_json, mood_face,
          amount_bucket, time_bucket, app_version,
          total_count, distinct_contributor_count, last_updated
        )
        SELECT combination_key, 'combination', product_key, MAX(product_name_normalized),
          MAX(brand_name), MAX(product_category), MAX(strain_type), MAX(region_bucket),
          MAX(body_tags_json), MAX(mind_tags_json), MAX(mood_tags_json), MAX(mood_face),
          MAX(amount_bucket), MAX(time_bucket), MAX(app_version),
          COUNT(*), COUNT(DISTINCT contributor_id), ?
        FROM shared_contribution_staging
        WHERE submitted_at <= ?
        GROUP BY combination_key
        ${UPSERT_TOTALS_AND_APPROXIMATE_CONTRIBUTORS}
      `).bind(nowIso, cutoff),
      env.DB.prepare(`
        INSERT INTO shared_product_aggregates (
          combination_key, aggregate_scope, product_key, product_name_normalized,
          total_count, distinct_contributor_count, last_updated
        )
        SELECT json_object('scope', 'product', 'product_key', product_key),
          'product', product_key, MAX(product_name_normalized),
          COUNT(*), COUNT(DISTINCT contributor_id), ?
        FROM shared_contribution_staging
        WHERE submitted_at <= ?
        GROUP BY product_key
        ${UPSERT_TOTALS_AND_APPROXIMATE_CONTRIBUTORS}
      `).bind(nowIso, cutoff),
      env.DB.prepare(`
        INSERT INTO shared_product_aggregates (
          combination_key, aggregate_scope, product_key, product_name_normalized,
          region_bucket, total_count, distinct_contributor_count, last_updated
        )
        SELECT json_object('scope', 'product_region', 'product_key', product_key, 'region_bucket', region_bucket),
          'product_region', product_key, MAX(product_name_normalized), region_bucket,
          COUNT(*), COUNT(DISTINCT contributor_id), ?
        FROM shared_contribution_staging
        WHERE submitted_at <= ? AND region_bucket IS NOT NULL
        GROUP BY product_key, region_bucket
        ${UPSERT_TOTALS_AND_APPROXIMATE_CONTRIBUTORS}
      `).bind(nowIso, cutoff),
      env.DB.prepare(`DELETE FROM shared_contribution_staging WHERE submitted_at <= ?`).bind(cutoff)
    )
  }

  const results = await env.DB.batch(statements)
  const deleteResult = eligibleCount > 0 ? results[results.length - 1] : null

  return {
    ok: true,
    cutoff,
    staged_rows_folded: deleteResult ? changes(deleteResult) : 0,
    distinct_counts_are_approximate: true,
  }
}

async function currentStagingContributorCount(env, productKey, regionBucket) {
  const row = regionBucket
    ? await env.DB.prepare(`
        SELECT COUNT(DISTINCT contributor_id) AS contributor_count
        FROM shared_contribution_staging
        WHERE product_key = ? AND region_bucket = ?
      `).bind(productKey, regionBucket).first()
    : await env.DB.prepare(`
        SELECT COUNT(DISTINCT contributor_id) AS contributor_count
        FROM shared_contribution_staging
        WHERE product_key = ?
      `).bind(productKey).first()
  return Number(row?.contributor_count || 0)
}

async function getAggregate(env, url) {
  const productKey = normalizeProductKey(url.searchParams.get('product_key') || '')
  const regionBucket = cleanString(url.searchParams.get('region_bucket'))
  if (!productKey) return json({ ok: false, error: 'product_key is required' }, 400)

  const nowIso = new Date().toISOString()
  await env.DB.batch(requestEligibilityStatements(env, productKey, regionBucket, nowIso))

  const minimum = regionBucket ? REGION_MINIMUM : PRODUCT_MINIMUM
  const eligibilityScope = regionBucket ? 'product_region' : 'product'
  const eligibility = await env.DB.prepare(`
    SELECT eligible_at
    FROM shared_pool_eligibility
    WHERE eligibility_scope = ?
      AND product_key = ?
      AND region_bucket = ?
      AND combination_key = ''
  `).bind(eligibilityScope, productKey, regionBucket || '').first()

  if (!eligibility) {
    const stagedContributorCount = await currentStagingContributorCount(env, productKey, regionBucket)
    return json({
      ok: true,
      product_key: productKey,
      region_bucket: regionBucket,
      minimum_pool_met: false,
      pool_eligible: false,
      sample_size: stagedContributorCount,
      total_contributions: 0,
      minimum_required: minimum,
      distinct_contributor_count_is_approximate: false,
      effects: [],
    })
  }

  const pool = regionBucket
    ? await env.DB.prepare(`
        SELECT total_count, distinct_contributor_count, last_updated
        FROM shared_product_aggregates
        WHERE aggregate_scope = 'product_region' AND product_key = ? AND region_bucket = ?
      `).bind(productKey, regionBucket).first()
    : await env.DB.prepare(`
        SELECT total_count, distinct_contributor_count, last_updated
        FROM shared_product_aggregates
        WHERE aggregate_scope = 'product' AND product_key = ? AND region_bucket IS NULL
      `).bind(productKey).first()

  const contributorCount = Number(pool?.distinct_contributor_count || 0)
  const totalContributions = Number(pool?.total_count || 0)
  const rows = regionBucket
    ? await env.DB.prepare(`
        SELECT aggregate_row.body_tags_json, aggregate_row.mind_tags_json,
          aggregate_row.mood_tags_json, aggregate_row.total_count
        FROM shared_product_aggregates aggregate_row
        INNER JOIN shared_pool_eligibility eligibility
          ON eligibility.eligibility_scope = 'combination_region'
          AND eligibility.product_key = aggregate_row.product_key
          AND eligibility.region_bucket = aggregate_row.region_bucket
          AND eligibility.combination_key = aggregate_row.combination_key
        WHERE aggregate_row.aggregate_scope = 'combination'
          AND aggregate_row.product_key = ?
          AND aggregate_row.region_bucket = ?
      `).bind(productKey, regionBucket).all()
    : await env.DB.prepare(`
        SELECT aggregate_row.body_tags_json, aggregate_row.mind_tags_json,
          aggregate_row.mood_tags_json, aggregate_row.total_count
        FROM shared_product_aggregates aggregate_row
        INNER JOIN shared_pool_eligibility eligibility
          ON eligibility.eligibility_scope = 'combination_product'
          AND eligibility.product_key = aggregate_row.product_key
          AND eligibility.region_bucket = ''
          AND eligibility.combination_key = aggregate_row.combination_key
        WHERE aggregate_row.aggregate_scope = 'combination'
          AND aggregate_row.product_key = ?
      `).bind(productKey).all()

  const counts = new Map()
  for (const row of rows.results || []) {
    const weight = Number(row.total_count || 0)
    for (const tag of combinedEffectTags(row)) {
      counts.set(tag, (counts.get(tag) || 0) + weight)
    }
  }

  const effects = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([label, count]) => ({
      label,
      count,
      percent: totalContributions > 0
        ? Math.min(100, (count / totalContributions) * 100)
        : 0,
    }))

  return json({
    ok: true,
    product_key: productKey,
    region_bucket: regionBucket,
    minimum_pool_met: true,
    pool_eligible: true,
    eligible_at: eligibility.eligible_at,
    sample_size: contributorCount,
    total_contributions: totalContributions,
    minimum_required: minimum,
    distinct_contributor_count_is_approximate: true,
    last_updated: pool?.last_updated || null,
    effects,
  })
}

async function purgeExpiredQuarantine(env, now = new Date()) {
  const cutoff = now.toISOString()
  const result = await env.DB.prepare(`
    DELETE FROM shared_layer2_migration_quarantine
    WHERE expires_at <= ?
  `).bind(cutoff).run()
  return {
    ok: true,
    cutoff,
    quarantine_rows_deleted: changes(result),
    retention_days: QUARANTINE_RETENTION_DAYS,
  }
}

function isAdminAuthorized(request, env) {
  const token = cleanString(env.ADMIN_TOKEN)
  return Boolean(token) && request.headers.get('Authorization') === `Bearer ${token}`
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
    if (!env.DB) return json({ ok: false, error: 'D1 binding DB is not configured' }, 500)

    const url = new URL(request.url)
    if (request.method === 'POST' && url.pathname === '/contributors/opt-in') return upsertContributor(env, await readJson(request))
    if (request.method === 'POST' && url.pathname === '/contributors/opt-out') return requestOptOut(env, await readJson(request))
    if (request.method === 'POST' && url.pathname === '/contributions') return createContribution(env, await readJson(request))
    if (request.method === 'POST' && url.pathname === '/contributions/retract') return retractContribution(env, await readJson(request))
    if (request.method === 'GET' && url.pathname === '/aggregates') return getAggregate(env, url)
    if (request.method === 'POST' && url.pathname === '/admin/fold-staging') {
      if (!isAdminAuthorized(request, env)) return json({ ok: false, error: 'Unauthorized' }, 401)
      return json(await foldEligibleStaging(env))
    }
    if (request.method === 'POST' && url.pathname === '/admin/purge-quarantine') {
      if (!isAdminAuthorized(request, env)) return json({ ok: false, error: 'Unauthorized' }, 401)
      return json(await purgeExpiredQuarantine(env))
    }
    return json({ ok: false, error: 'Not found' }, 404)
  },

  async scheduled(event, env, ctx) {
    if (!env.DB) return
    ctx.waitUntil((async () => {
      await foldEligibleStaging(env)
      await purgeExpiredQuarantine(env)
    })())
  },
}

export {
  buildCombinationKey,
  buildFoldGroups,
  buildPoolKey,
  combinedEffectTags,
  foldEligibleStaging,
  getAggregate,
  normalizeContribution,
  purgeExpiredQuarantine,
  requestOptOut,
}
