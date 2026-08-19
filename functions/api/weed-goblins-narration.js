import {
  isPrivateTestingHashedCodeSessionValid,
  isPrivateTestingSessionValid,
} from '../../server/private-testing-access.js'
import { getPhase1PreviewAccessCodeHash } from '../../server/phase1-preview-access.js'

const ALLOWED_ORIGINS = new Set([
  'https://my420journal.app',
  'https://my420journal.com',
])
const DEFAULT_PREVIEW_HOST = 'my420journal-app.pages.dev'

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

export function isAllowedWeedGoblinsNarrationOrigin(origin, previewHost = '') {
  if (ALLOWED_ORIGINS.has(origin)) return true

  const allowedPreviewHost = String(previewHost ?? '').trim().toLowerCase()
  if (!allowedPreviewHost) return false

  let parsed
  try {
    parsed = new URL(origin)
  } catch {
    return false
  }

  const hostname = parsed.hostname.toLowerCase()
  return parsed.protocol === 'https:'
    && parsed.port === ''
    && hostname.endsWith(`.${allowedPreviewHost}`)
}

export async function onRequest({ request, env }) {
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

  const origin = request.headers.get('Origin') || ''
  const configuredPreviewHost = String(env?.WEED_GOBLINS_PAGES_PREVIEW_HOST ?? '').trim()
  const previewHost = configuredPreviewHost || (previewCodeHash ? DEFAULT_PREVIEW_HOST : '')
  if (!isAllowedWeedGoblinsNarrationOrigin(origin, previewHost)) {
    return jsonResponse({ error: 'Origin not allowed' }, 403)
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  return jsonResponse({
    error: 'Live narration is disabled for Phase 1 external testing.',
    status: 'phase1_live_narration_disabled',
  }, 503)
}
