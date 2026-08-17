import {
  isPrivateTestingHashedCodeSessionValid,
  isPrivateTestingSessionValid,
} from '../../../server/private-testing-access.js'
import { getPhase1PreviewAccessCodeHash } from '../../../server/phase1-preview-access.js'

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

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

export async function onRequest({ request, env, params }) {
  const requestUrl = new URL(request.url)
  const accessCode = String(env?.JOURNAL_ACCESS_CODE ?? '').trim()
  const previewCodeHash = accessCode ? '' : getPhase1PreviewAccessCodeHash(requestUrl.hostname)
  const cookieHeader = request.headers.get('Cookie') || ''
  const hasTesterSession = accessCode
    ? await isPrivateTestingSessionValid(cookieHeader, accessCode)
    : previewCodeHash
      ? await isPrivateTestingHashedCodeSessionValid(cookieHeader, previewCodeHash)
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

  return jsonResponse({
    error: 'Shared Journey is disabled for Phase 1 external testing.',
    status: 'phase1_shared_disabled',
  }, 503)
}
