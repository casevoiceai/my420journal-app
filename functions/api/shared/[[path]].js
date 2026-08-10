import { isPrivateTestingSessionValid } from '../../../server/private-testing-access.js'

const DEFAULT_WORKER_URL = 'https://my420journal-shared-worker.casevoice-ai.workers.dev'
const MAX_REQUEST_BYTES = 64 * 1024
const ALLOWED_PATHS = new Map([
  ['contributors/opt-in', 'POST'],
  ['contributors/opt-out', 'POST'],
  ['contributions', 'POST'],
  ['aggregates', 'GET'],
])
const ALLOWED_ORIGINS = new Set([
  'https://my420journal.app',
  'https://my420journal.com',
])
const BLOCKED_RESPONSE_HEADERS = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'keep-alive',
  'transfer-encoding',
  'access-control-allow-origin',
  'access-control-allow-credentials',
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
  const expectedMethod = ALLOWED_PATHS.get(relativePath)
  if (!expectedMethod) {
    return jsonResponse({ error: 'Not found' }, 404)
  }

  if (request.method !== expectedMethod) {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  if (request.method !== 'GET') {
    const origin = request.headers.get('Origin') || ''
    if (!ALLOWED_ORIGINS.has(origin)) {
      return jsonResponse({ error: 'Origin not allowed' }, 403)
    }
  }

  const proxySecret = String(
    env?.JOURNAL_SHARED_PROXY_SECRET ?? env?.WEED_GOBLINS_PROXY_SECRET ?? '',
  ).trim()
  if (!proxySecret) {
    return jsonResponse({ error: 'Shared signals proxy is not configured' }, 500)
  }

  const workerBaseUrl = String(env?.SHARED_AGGREGATE_WORKER_URL ?? DEFAULT_WORKER_URL).replace(/\/+$/, '')
  const incomingUrl = new URL(request.url)
  const upstreamUrl = new URL(`${workerBaseUrl}/${relativePath}`)
  upstreamUrl.search = incomingUrl.search

  let body
  if (request.method !== 'GET') {
    const declaredLength = Number(request.headers.get('Content-Length') || 0)
    if (declaredLength > MAX_REQUEST_BYTES) {
      return jsonResponse({ error: 'Request too large' }, 413)
    }

    try {
      body = await request.text()
    } catch {
      return jsonResponse({ error: 'Unable to read request body' }, 400)
    }

    if (byteLength(body) > MAX_REQUEST_BYTES) {
      return jsonResponse({ error: 'Request too large' }, 413)
    }
  }

  let upstream
  try {
    const headers = {
      Authorization: `Bearer ${proxySecret}`,
      Accept: 'application/json',
    }
    const contentType = request.headers.get('Content-Type')
    if (contentType) headers['Content-Type'] = contentType

    upstream = await fetch(upstreamUrl.toString(), {
      method: request.method,
      headers,
      body,
    })
  } catch {
    return jsonResponse({ error: 'Unable to reach shared signals service' }, 502)
  }

  const responseHeaders = new Headers({ 'Cache-Control': 'no-store' })
  for (const [name, value] of upstream.headers.entries()) {
    if (!BLOCKED_RESPONSE_HEADERS.has(name.toLowerCase())) {
      responseHeaders.set(name, value)
    }
  }
  if (!responseHeaders.has('Content-Type')) {
    responseHeaders.set('Content-Type', 'application/json; charset=utf-8')
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  })
}
