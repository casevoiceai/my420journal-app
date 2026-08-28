import { isPrivateTestingSessionValid } from '../../../server/private-testing-access.js'

const DEFAULT_WORKER_URL = 'https://my420journal-shared-worker.casevoice-ai.workers.dev'
const MAX_REQUEST_BYTES = 64 * 1024
const ALLOWED_ORIGINS = new Set([
  'https://my420journal.app',
  'https://my420journal.com',
])

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

function byteLength(value) {
  return new TextEncoder().encode(value).byteLength
}

function isSharedJourneyEnabled(env) {
  return String(env?.SHARED_JOURNEY_ENABLED ?? '').trim().toLowerCase() === 'true'
}

export async function onRequest({ request, env, params }) {
  const accessCode = String(env?.JOURNAL_ACCESS_CODE ?? '').trim()
  const hasTesterSession = accessCode
    ? await isPrivateTestingSessionValid(request.headers.get('Cookie') || '', accessCode)
    : false

  if (!hasTesterSession) {
    return jsonResponse({ error: 'Private testing access required' }, 401)
  }

  const pathParts = Array.isArray(params?.path) ? params.path : [params?.path]
  const relativePath = pathParts.filter(Boolean).join('/')
  const sharedJourneyEnabled = isSharedJourneyEnabled(env)

  // Defense in depth: missing, blank, malformed, or false config means OFF.
  // Opt-out cleanup remains reachable even while Shared Journey is disabled.
  if (!sharedJourneyEnabled && relativePath !== 'contributors/opt-out') {
    return jsonResponse({
      error: 'Shared Journey is disabled pending redesign and review',
      shared_journey_enabled: false,
    }, 410)
  }

  // V2 re-enable is intentionally impossible from configuration alone.
  // Non-cleanup routes stay closed until their V2 handlers and privacy tests exist.
  if (relativePath !== 'contributors/opt-out') {
    return jsonResponse({
      error: 'Shared Journey V2 route is not implemented',
      shared_journey_enabled: sharedJourneyEnabled,
    }, 501)
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const origin = request.headers.get('Origin') || ''
  if (!ALLOWED_ORIGINS.has(origin)) {
    return jsonResponse({ error: 'Origin not allowed' }, 403)
  }

  let body
  try {
    body = await request.text()
  } catch {
    return jsonResponse({ error: 'Unable to read request body' }, 400)
  }

  if (byteLength(body) > MAX_REQUEST_BYTES) {
    return jsonResponse({ error: 'Request too large' }, 413)
  }

  const proxySecret = String(
    env?.JOURNAL_SHARED_PROXY_SECRET ?? env?.WEED_GOBLINS_PROXY_SECRET ?? '',
  ).trim()
  if (!proxySecret) {
    return jsonResponse({ error: 'Shared signals cleanup service is not configured' }, 500)
  }

  const workerBaseUrl = String(env?.SHARED_AGGREGATE_WORKER_URL ?? DEFAULT_WORKER_URL).replace(/\/+$/, '')
  const upstreamUrl = `${workerBaseUrl}/contributors/opt-out`

  let upstream
  try {
    upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${proxySecret}`,
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        Accept: 'application/json',
      },
      body,
    })
  } catch {
    return jsonResponse({ error: 'Unable to reach shared signals cleanup service' }, 502)
  }

  let payload = null
  try {
    payload = await upstream.json()
  } catch {
    payload = { ok: upstream.ok }
  }

  return jsonResponse(payload, upstream.status)
}
