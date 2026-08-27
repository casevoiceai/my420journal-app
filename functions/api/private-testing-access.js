import {
  buildPrivateTestingCookie,
  buildPrivateTestingHashedCodeCookie,
  renderPrivateTestingGate,
  timingSafeEqualText,
  timingSafeEqualTextToSha256Hex,
} from '../../server/private-testing-access.js'
import { getPhase1PreviewAccessCodeHash } from '../../server/phase1-preview-access.js'

function gateHeaders() {
  return {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  }
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return new Response(renderPrivateTestingGate(), {
      status: 405,
      headers: { ...gateHeaders(), Allow: 'POST' },
    })
  }

  let suppliedCode = ''
  try {
    const formData = await request.formData()
    suppliedCode = String(formData.get('access_code') ?? '').trim()
  } catch {
    suppliedCode = ''
  }

  const url = new URL(request.url)
  const expectedCode = String(env?.JOURNAL_ACCESS_CODE ?? '').trim()
  const previewCodeHash = expectedCode ? '' : getPhase1PreviewAccessCodeHash(url.hostname)

  const valid = expectedCode && suppliedCode
    ? await timingSafeEqualText(suppliedCode, expectedCode)
    : previewCodeHash && suppliedCode
      ? await timingSafeEqualTextToSha256Hex(suppliedCode, previewCodeHash)
      : false

  if (!valid) {
    return new Response(renderPrivateTestingGate({ showError: true }), {
      status: 401,
      headers: gateHeaders(),
    })
  }

  const cookie = expectedCode
    ? await buildPrivateTestingCookie(expectedCode)
    : buildPrivateTestingHashedCodeCookie(suppliedCode)

  return new Response(null, {
    status: 303,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Set-Cookie': cookie,
      Location: '/games/weed-goblins',
    },
  })
}
