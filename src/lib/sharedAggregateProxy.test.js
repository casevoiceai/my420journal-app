import test from 'node:test'
import assert from 'node:assert/strict'

import { onRequest } from '../../functions/api/shared/[[path]].js'
import { buildPrivateTestingCookie } from '../../server/private-testing-access.js'

const TEST_ACCESS_CODE = 'journal-access-test-secret'
const TEST_PROXY_SECRET = 'journal-shared-proxy-test-secret'
const testerCookie = (await buildPrivateTestingCookie(TEST_ACCESS_CODE)).split(';')[0]
const env = {
  JOURNAL_ACCESS_CODE: TEST_ACCESS_CODE,
  JOURNAL_SHARED_PROXY_SECRET: TEST_PROXY_SECRET,
  SHARED_AGGREGATE_WORKER_URL: 'https://shared-worker.example.test',
}

function makeRequest(path, {
  method = 'GET',
  origin = 'https://my420journal.app',
  authorized = true,
  body,
} = {}) {
  const headers = { Accept: 'application/json' }
  if (authorized) headers.Cookie = testerCookie
  if (method !== 'GET') {
    headers.Origin = origin
    headers['Content-Type'] = 'application/json'
  }

  return new Request(`https://my420journal.app/api/shared/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

test('shared signals proxy rejects requests without a tester session before forwarding', async () => {
  const originalFetch = globalThis.fetch
  let fetchCalls = 0
  globalThis.fetch = async () => {
    fetchCalls += 1
    throw new Error('must not forward')
  }

  try {
    const response = await onRequest({
      request: makeRequest('aggregates', { authorized: false }),
      env,
      params: { path: ['aggregates'] },
    })

    assert.equal(response.status, 401)
    assert.equal(fetchCalls, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('shared signals proxy forwards only the approved route with server-side authorization', async () => {
  const originalFetch = globalThis.fetch
  let target
  let authorization
  globalThis.fetch = async (url, init) => {
    target = String(url)
    authorization = init.headers.Authorization
    return new Response(JSON.stringify({ ok: true, effects: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const response = await onRequest({
      request: makeRequest('aggregates?product_key=test'),
      env,
      params: { path: ['aggregates'] },
    })

    assert.equal(response.status, 200)
    assert.equal(target, 'https://shared-worker.example.test/aggregates?product_key=test')
    assert.equal(authorization, `Bearer ${TEST_PROXY_SECRET}`)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('shared signals proxy does not expose the Worker admin purge route', async () => {
  const originalFetch = globalThis.fetch
  let fetchCalls = 0
  globalThis.fetch = async () => {
    fetchCalls += 1
    throw new Error('must not forward')
  }

  try {
    const response = await onRequest({
      request: makeRequest('admin/purge-opted-out', {
        method: 'POST',
        body: {},
      }),
      env,
      params: { path: ['admin', 'purge-opted-out'] },
    })

    assert.equal(response.status, 404)
    assert.equal(fetchCalls, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})
