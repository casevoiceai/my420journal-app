const ACCESS_CODE_SHA256 = '6373e44782bc67116a0dfc83b3d8352461f0dd7c904b160c1e237a362c3ceaf5'
const COOKIE_NAME = 'wg_private_playtest'

function toHex(bytes) {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

function equalText(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function sha256(value) {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))
}

function cookieValue(request) {
  const cookie = request.headers.get('Cookie') || ''
  for (const part of cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === COOKIE_NAME) return rest.join('=')
  }
  return ''
}

function accessPage(error = false) {
  const message = error ? '<p class="error">That playtest code did not match.</p>' : ''
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Private Weed Goblins Playtest</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0A1A0A;color:#E8F0E8;font-family:Arial,sans-serif}main{width:min(92vw,460px);padding:32px;border:1px solid #2D4A2D;border-radius:18px;background:#1A2E1A}h1{margin-top:0;font-size:28px}p{color:#B7C9B7;line-height:1.5}.error{color:#ffb3a7}label{display:block;margin:20px 0 8px;font-weight:700}input{box-sizing:border-box;width:100%;padding:14px;border:1px solid #4A674A;border-radius:10px;background:#081508;color:#fff;font-size:18px}button{width:100%;margin-top:14px;padding:14px;border:0;border-radius:10px;background:#C9A84C;color:#0A1A0A;font-weight:800;font-size:16px;cursor:pointer}</style></head><body><main><h1>Private Weed Goblins Playtest</h1><p>This build is restricted to invited testers.</p>${message}<form method="post" action="/_playtest_access"><label for="code">Playtest code</label><input id="code" name="code" type="password" autocomplete="off" autofocus required><button type="submit">Open Weed Goblins</button></form></main></body></html>`, {
    status: error ? 401 : 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'Referrer-Policy': 'no-referrer',
    },
  })
}

async function proxy(request, origin) {
  const incoming = new URL(request.url)
  const upstreamUrl = new URL(incoming.pathname + incoming.search, origin)
  const headers = new Headers(request.headers)
  headers.delete('Cookie')
  const upstream = await fetch(new Request(upstreamUrl, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual',
  }))
  const responseHeaders = new Headers(upstream.headers)
  responseHeaders.set('Cache-Control', 'no-store')
  responseHeaders.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  responseHeaders.set('Referrer-Policy', 'no-referrer')
  const location = responseHeaders.get('Location')
  if (location && location.startsWith(origin)) responseHeaders.set('Location', location.slice(origin.length) || '/')
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (!env.SESSION_SECRET || !env.PAGES_ORIGIN) {
      return new Response('Private playtest unavailable.', {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      })
    }

    if (url.pathname === '/_playtest_access' && request.method === 'POST') {
      const raw = await request.text()
      const code = new URLSearchParams(raw).get('code') || ''
      const digest = await sha256(code)
      if (!equalText(digest, ACCESS_CODE_SHA256)) return accessPage(true)
      return new Response(null, {
        status: 303,
        headers: {
          'Location': '/games/weed-goblins',
          'Set-Cookie': `${COOKIE_NAME}=${env.SESSION_SECRET}; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Lax`,
          'Cache-Control': 'no-store',
          'X-Robots-Tag': 'noindex, nofollow, noarchive',
        },
      })
    }

    const supplied = cookieValue(request)
    if (!supplied || !equalText(supplied, env.SESSION_SECRET)) return accessPage(false)
    return proxy(request, env.PAGES_ORIGIN)
  },
}
