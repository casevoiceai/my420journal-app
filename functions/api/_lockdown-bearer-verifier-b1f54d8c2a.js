export async function onRequest() {
  return new Response('Not found', { status: 404 })
}
