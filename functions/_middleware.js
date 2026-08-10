import {
  PRIVATE_TESTING_ACCESS_PATH,
  isPrivateTestingSessionValid,
  renderPrivateTestingGate,
} from '../server/private-testing-access.js'

const TEMP_LOCKDOWN_VERIFIER_PATH = '/api/_lockdown-bearer-verifier-b1f54d8c2a'

function gateHeaders(contentType) {
  return {
    'Content-Type': contentType,
    'Cache-Control': 'no-store, max-age=0',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  }
}

async function continueAuthorized(context) {
  const response = await context.next()
  const request = context.request
  const url = new URL(request.url)
  const acceptsHtml = (request.headers.get('Accept') || '').includes('text/html')

  if (
    response.status === 404
    && request.method === 'GET'
    && acceptsHtml
    && !url.pathname.startsWith('/api/')
    && context.env?.ASSETS
  ) {
    const fallbackUrl = new URL('/index.html', request.url)
    return context.env.ASSETS.fetch(new Request(fallbackUrl, request))
  }

  return response
}

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)

  if (url.pathname === PRIVATE_TESTING_ACCESS_PATH || url.pathname === TEMP_LOCKDOWN_VERIFIER_PATH) {
    return context.next()
  }

  const secret = String(env?.JOURNAL_ACCESS_CODE ?? '').trim()
  const authorized = secret
    ? await isPrivateTestingSessionValid(request.headers.get('Cookie') || '', secret)
    : false

  if (authorized) {
    return continueAuthorized(context)
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(JSON.stringify({ error: 'Private testing access required' }), {
      status: 401,
      headers: gateHeaders('application/json; charset=utf-8'),
    })
  }

  return new Response(request.method === 'HEAD' ? null : renderPrivateTestingGate(), {
    status: 401,
    headers: gateHeaders('text/html; charset=utf-8'),
  })
}
