import test from 'node:test'
import assert from 'node:assert/strict'

import { onRequest } from '../../../../functions/api/weed-goblins-narration.js'

const env = {
  WEED_GOBLINS_NARRATION_WORKER_URL: 'https://private-worker.example.test',
  WEED_GOBLINS_PROXY_SECRET: 'private-shared-secret',
}

function makeRequest(origin = 'https://my420journal.app') {
  return new Request('https://my420journal.app/api/weed-goblins-narration', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ moment: 'natural-one-complication' }),
  })
}

test('rejects an unapproved Origin before forwarding', async () => {
  const originalFetch = globalThis.fetch
  let fetchCalls = 0
  globalThis.fetch = async () => {
    fetchCalls += 1
    throw new Error('must not forward')
  }
  try {
    const response = await onRequest({
      request: makeRequest('https://example.com'),
      env,
    })
    assert.equal(response.status, 403)
    assert.equal(fetchCalls, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('accepts only the two locked production origins', async () => {
  const originalFetch = globalThis.fetch
  const origins = []
  globalThis.fetch = async (_url, init) => {
    origins.push(init.headers.Authorization)
    return new Response(JSON.stringify({ text: 'I record a harmless scheduling problem.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  try {
    for (const origin of ['https://my420journal.app', 'https://my420journal.com']) {
      const response = await onRequest({ request: makeRequest(origin), env })
      assert.equal(response.status, 200)
      assert.equal((await response.json()).text, 'I record a harmless scheduling problem.')
    }
    assert.deepEqual(origins, [
      'Bearer private-shared-secret',
      'Bearer private-shared-secret',
    ])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('keeps Worker URL and secret server-side and returns generic connection errors', async () => {
  const originalFetch = globalThis.fetch
  let target
  let authorization
  globalThis.fetch = async (url, init) => {
    target = url
    authorization = init.headers.Authorization
    throw new Error(`could not reach ${url}`)
  }
  try {
    const response = await onRequest({ request: makeRequest(), env })
    const text = await response.text()
    assert.equal(target, env.WEED_GOBLINS_NARRATION_WORKER_URL)
    assert.equal(authorization, `Bearer ${env.WEED_GOBLINS_PROXY_SECRET}`)
    assert.equal(response.status, 502)
    assert.equal(text.includes(env.WEED_GOBLINS_NARRATION_WORKER_URL), false)
    assert.equal(text.includes(env.WEED_GOBLINS_PROXY_SECRET), false)
  } finally {
    globalThis.fetch = originalFetch
  }
})
