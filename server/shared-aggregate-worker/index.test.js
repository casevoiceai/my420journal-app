import test from 'node:test'
import assert from 'node:assert/strict'

import worker from './index.js'

const secret = 'shared-worker-test-secret'

async function verifierFor(secretValue) {
  const bytes = new TextEncoder().encode(`Bearer ${secretValue}`)
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const verifier = await verifierFor(secret)

function request(authorization) {
  const headers = {}
  if (authorization) headers.Authorization = authorization
  return new Request('https://shared-worker.example.test/aggregates?product_key=test', {
    method: 'GET',
    headers,
  })
}

test('shared aggregate Worker rejects missing service authorization before database access', async () => {
  const response = await worker.fetch(request(), {
    JOURNAL_SHARED_PROXY_SECRET: verifier,
  })

  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), { ok: false, error: 'Unauthorized' })
})

test('shared aggregate Worker rejects the wrong service authorization', async () => {
  const response = await worker.fetch(request('Bearer wrong-secret'), {
    JOURNAL_SHARED_PROXY_SECRET: verifier,
  })

  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), { ok: false, error: 'Unauthorized' })
})

test('shared aggregate Worker accepts the correct service authorization before checking DB configuration', async () => {
  const response = await worker.fetch(request(`Bearer ${secret}`), {
    JOURNAL_SHARED_PROXY_SECRET: verifier,
  })

  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), { ok: false, error: 'D1 binding DB is not configured' })
})
