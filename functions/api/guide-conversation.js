import { isPrivateTestingSessionValid } from '../../server/private-testing-access.js'

const ALLOWED_ORIGINS = new Set([
  'https://my420journal.app',
  'https://my420journal.com',
])
const MAX_REQUEST_BYTES = 24_576
const BLOCKED_RESPONSE_HEADERS = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'keep-alive',
  'transfer-encoding',
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

export async function onRequest({ request, env }) {
  const accessCode = String(env?.JOURNAL_ACCESS_CODE ?? '').trim()
  const hasTesterSession = accessCode
    ? await isPrivateTestingSessionValid(request.headers.get('Cookie') || '', accessCode)
    : false

  if (!hasTesterSession) return jsonResponse({ error: 'Private testing access required' }, 401)

  const origin = request.headers.get('Origin') || ''
  if (!ALLOWED_ORIGINS.has(origin)) return jsonResponse({ error: 'Origin not allowed' }, 403)
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const workerUrl = String(env?.GUIDE_CONVERSATION_WORKER_URL ?? '').trim()
  const sharedSecret = String(env?.GUIDE_CONVERSATION_PROXY_SECRET ?? '').trim()
  if (!workerUrl || !sharedSecret) {
    return jsonResponse({ error: 'Guide conversation service is not configured' }, 500)
  }

  const declaredLength = Number(request.headers.get('Content-Length') || 0)
  if (declaredLength > MAX_REQUEST_BYTES) return jsonResponse({ error: 'Request too large' }, 413)

  let body
  try { body = await request.text() } catch { return jsonResponse({ error: 'Unable to read request body' }, 400) }
  if (byteLength(body) > MAX_REQUEST_BYTES) return jsonResponse({ error: 'Request too large' }, 413)

  let upstream
  try {
    const sourceAddress = String(
      request.headers.get('CF-Connecting-IP')
      || request.headers.get('CF-Connecting-IPv6')
      || '',
    ).trim()
    const headers = {
      Authorization: `Bearer ${sharedSecret}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
    if (sourceAddress) headers['X-Guide-Source-IP'] = sourceAddress

    upstream = await fetch(workerUrl, { method: 'POST', headers, body })
  } catch {
    return jsonResponse({ error: 'Unable to reach Guide conversation service' }, 502)
  }

  const responseHeaders = new Headers({ 'Cache-Control': 'no-store' })
  for (const [name, value] of upstream.headers.entries()) {
    if (!BLOCKED_RESPONSE_HEADERS.has(name.toLowerCase())) responseHeaders.set(name, value)
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
