import {
  buildPrivateTestingCookie,
  renderPrivateTestingGate,
  timingSafeEqualText,
} from '../../server/private-testing-access.js'

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

  const expectedCode = String(env?.JOURNAL_ACCESS_CODE ?? '').trim()
  const valid = expectedCode && suppliedCode
    ? await timingSafeEqualText(suppliedCode, expectedCode)
    : false

  if (!valid) {
    return new Response(renderPrivateTestingGate({ showError: true }), {
      status: 401,
      headers: gateHeaders(),
    })
  }

  return new Response(null, {
    status: 303,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Set-Cookie': await buildPrivateTestingCookie(expectedCode),
      Location: '/',
    },
  })
}
