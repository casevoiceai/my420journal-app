export async function onRequest({ env }) {
  const present = Boolean(String(env?.JOURNAL_ACCESS_CODE ?? '').trim())

  return new Response(JSON.stringify({ journal_access_code_present: present }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
