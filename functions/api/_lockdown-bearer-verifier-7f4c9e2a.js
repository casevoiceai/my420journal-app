function toHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function onRequestGet({ request, env }) {
  const hostname = new URL(request.url).hostname
  if (!hostname.endsWith('.pages.dev')) {
    return new Response('Not found', { status: 404 })
  }

  const secret = String(env?.WEED_GOBLINS_PROXY_SECRET ?? '').trim()
  if (!secret) {
    return Response.json({ present: false, verifier: null }, { status: 503 })
  }

  const bytes = new TextEncoder().encode(`Bearer ${secret}`)
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))

  return Response.json({ present: true, verifier: toHex(digest) }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
