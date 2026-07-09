const PRODUCT_MINIMUM = 10
const REGION_MINIMUM = 25

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
  })
}

function normalizeProductKey(value = '') {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ')
}

async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

async function upsertContributor(env, body) {
  const id = body?.anonymous_contributor_id
  if (!id) return json({ ok: false, error: 'anonymous_contributor_id is required' }, 400)

  const now = new Date().toISOString()
  await env.DB.prepare(`
    INSERT INTO shared_contributors (
      anonymous_contributor_id,
      is_active,
      opted_in_at,
      opted_out_at,
      delete_requested_at,
      delete_completed_at,
      app_version,
      updated_at
    ) VALUES (?, 1, COALESCE(?, ?), NULL, NULL, NULL, ?, ?)
    ON CONFLICT(anonymous_contributor_id) DO UPDATE SET
      is_active = 1,
      opted_in_at = COALESCE(shared_contributors.opted_in_at, excluded.opted_in_at),
      opted_out_at = NULL,
      delete_requested_at = NULL,
      delete_completed_at = NULL,
      app_version = excluded.app_version,
      updated_at = excluded.updated_at
  `).bind(id, body.shared_opt_in_at || null, now, body.app_version || null, now).run()

  return json({ ok: true, anonymous_contributor_id: id })
}

async function requestOptOut(env, body) {
  const id = body?.anonymous_contributor_id
  if (!id) return json({ ok: false, error: 'anonymous_contributor_id is required' }, 400)

  const now = new Date().toISOString()

  await env.DB.prepare(`
    UPDATE shared_contributors
    SET is_active = 0,
        opted_out_at = ?,
        delete_requested_at = ?,
        updated_at = ?
    WHERE anonymous_contributor_id = ?
  `).bind(now, now, now, id).run()

  await env.DB.prepare(`
    DELETE FROM shared_product_contributions
    WHERE anonymous_contributor_id = ?
  `).bind(id).run()

  await env.DB.prepare(`
    UPDATE shared_contributors
    SET delete_completed_at = ?, updated_at = ?
    WHERE anonymous_contributor_id = ?
  `).bind(now, now, id).run()

  return json({ ok: true, delete_completed_at: now })
}

async function createContribution(env, body) {
  const contributorId = body?.anonymous_contributor_id
  const productName = body?.product_name_normalized || body?.product_name || ''
  const productKey = normalizeProductKey(body?.product_key || productName)

  if (!contributorId) return json({ ok: false, error: 'anonymous_contributor_id is required' }, 400)
  if (!productKey) return json({ ok: false, error: 'product_key or product_name is required' }, 400)

  const contributor = await env.DB.prepare(`
    SELECT anonymous_contributor_id FROM shared_contributors
    WHERE anonymous_contributor_id = ? AND is_active = 1
  `).bind(contributorId).first()

  if (!contributor) return json({ ok: false, error: 'Contributor is not opted in' }, 403)

  const now = new Date().toISOString()
  const contributionId = crypto.randomUUID()

  await env.DB.prepare(`
    INSERT INTO shared_product_contributions (
      contribution_id,
      anonymous_contributor_id,
      product_key,
      product_name_normalized,
      brand_name,
      category,
      strain_type,
      region_bucket,
      body_tags_json,
      mind_tags_json,
      mood_tags_json,
      mood_face,
      amount_bucket,
      entry_logged_at_bucket,
      source_app_version,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    contributionId,
    contributorId,
    productKey,
    productName || productKey,
    body.brand_name || null,
    body.category || null,
    body.strain_type || null,
    body.region_bucket || null,
    JSON.stringify(Array.isArray(body.body_tags) ? body.body_tags : []),
    JSON.stringify(Array.isArray(body.mind_tags) ? body.mind_tags : []),
    JSON.stringify(Array.isArray(body.mood_tags) ? body.mood_tags : []),
    body.mood_face || null,
    body.amount_bucket || null,
    body.entry_logged_at_bucket || null,
    body.source_app_version || null,
    now
  ).run()

  return json({ ok: true, contribution_id: contributionId })
}

async function getAggregate(env, url) {
  const productKey = normalizeProductKey(url.searchParams.get('product_key') || '')
  const regionBucket = url.searchParams.get('region_bucket') || null

  if (!productKey) return json({ ok: false, error: 'product_key is required' }, 400)

  const minimum = regionBucket ? REGION_MINIMUM : PRODUCT_MINIMUM
  const countRow = regionBucket
    ? await env.DB.prepare(`
        SELECT COUNT(DISTINCT anonymous_contributor_id) AS contributor_count
        FROM shared_product_contributions
        WHERE product_key = ? AND region_bucket = ?
      `).bind(productKey, regionBucket).first()
    : await env.DB.prepare(`
        SELECT COUNT(DISTINCT anonymous_contributor_id) AS contributor_count
        FROM shared_product_contributions
        WHERE product_key = ?
      `).bind(productKey).first()

  const contributorCount = Number(countRow?.contributor_count || 0)
  if (contributorCount < minimum) {
    return json({
      ok: true,
      product_key: productKey,
      minimum_pool_met: false,
      sample_size: contributorCount,
      minimum_required: minimum,
      effects: [],
    })
  }

  const rows = regionBucket
    ? await env.DB.prepare(`
        SELECT body_tags_json, mind_tags_json, mood_tags_json
        FROM shared_product_contributions
        WHERE product_key = ? AND region_bucket = ?
      `).bind(productKey, regionBucket).all()
    : await env.DB.prepare(`
        SELECT body_tags_json, mind_tags_json, mood_tags_json
        FROM shared_product_contributions
        WHERE product_key = ?
      `).bind(productKey).all()

  const counts = new Map()
  for (const row of rows.results || []) {
    for (const field of ['body_tags_json', 'mind_tags_json', 'mood_tags_json']) {
      let tags = []
      try { tags = JSON.parse(row[field] || '[]') } catch { tags = [] }
      for (const tag of tags) counts.set(tag, (counts.get(tag) || 0) + 1)
    }
  }

  const effects = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, count]) => ({ label, count, percent: (count / contributorCount) * 100 }))

  return json({
    ok: true,
    product_key: productKey,
    region_bucket: regionBucket,
    minimum_pool_met: true,
    sample_size: contributorCount,
    minimum_required: minimum,
    effects,
  })
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

    if (!env.DB) return json({ ok: false, error: 'D1 binding DB is not configured' }, 500)

    const url = new URL(request.url)

    if (request.method === 'POST' && url.pathname === '/contributors/opt-in') {
      return upsertContributor(env, await readJson(request))
    }

    if (request.method === 'POST' && url.pathname === '/contributors/opt-out') {
      return requestOptOut(env, await readJson(request))
    }

    if (request.method === 'POST' && url.pathname === '/contributions') {
      return createContribution(env, await readJson(request))
    }

    if (request.method === 'GET' && url.pathname === '/aggregates') {
      return getAggregate(env, url)
    }

    return json({ ok: false, error: 'Not found' }, 404)
  },
}
