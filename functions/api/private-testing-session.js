import { isPrivateTestingSessionValid } from '../../server/private-testing-access.js'

// Verify the tester cookie before any client-side navigation enters the journal.
export async function onRequest({ request, env }) {
  const secret = String(env?.JOURNAL_ACCESS_CODE ?? '').trim()
  const authorized = Boolean(secret) && await isPrivateTestingSessionValid(
    request.headers.get('Cookie') || '',
    secret,
  )
  return new Response(JSON.stringify({ authorized }), {
    status: authorized ? 200 : 401,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
