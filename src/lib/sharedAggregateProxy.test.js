import test from 'node:test'
import assert from 'node:assert/strict'

import { onRequest } from '../../functions/api/shared/[[path]].js'
import { buildPrivateTestingCookie } from '../../server/private-testing-access.js'

const TEST_ACCESS_CODE = 'journal-access-test-secret'
const testerCookie = (await buildPrivateTestingCookie(TEST_ACCESS_CODE)).split(';')[0]
const env = {
  JOURNAL_ACCESS_CODE: TEST_ACCESS_CODE,
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

async function withBlockedFetch(run) {
  const originalFetch = globalThis.fetch
  let fetchCalls = 0
  globalThis.fetch = async () => {
    fetchCalls += 1
    throw new Error('must not forward')
  }
  try {
    await run(() => fetchCalls)
  } finally {
    globalThis.fetch = originalFetch
  }
}

test('shared proxy rejects requests without a tester session and never forwards', async () => {
  await withBlockedFetch(async (fetchCalls) => {
    const response = await onRequest({
      request: makeRequest('aggregates', { authorized: false }),
      env,
      params: { path: ['aggregates'] },
    })
    assert.equal(response.status, 401)
    assert.equal(fetchCalls(), 0)
  })
})

test('authorized aggregate reads are disabled for Phase 1 and never forwarded', async () => {
  await withBlockedFetch(async (fetchCalls) => {
    const response = await onRequest({
      request: makeRequest('aggregates?product_key=test'),
      env,
      params: { path: ['aggregates'] },
    })
    assert.equal(response.status, 503)
    assert.equal(fetchCalls(), 0)
    assert.deepEqual(await response.json(), {
      error: 'Shared Journey is disabled for Phase 1 external testing.',
      status: 'phase1_shared_disabled',
    })
  })
})

test('authorized contribution writes are disabled for Phase 1 and never forwarded', async () => {
  await withBlockedFetch(async (fetchCalls) => {
    const response = await onRequest({
      request: makeRequest('contributions', {
        method: 'POST',
        body: { product_key: 'test' },
      }),
      env,
      params: { path: ['contributions'] },
    })
    assert.equal(response.status, 503)
    assert.equal(fetchCalls(), 0)
  })
})

test('shared proxy still rejects an unapproved write Origin before the Phase 1 disabled response', async () => {
  await withBlockedFetch(async (fetchCalls) => {
    const response = await onRequest({
      request: makeRequest('contributions', {
        method: 'POST',
        origin: 'https://example.com',
        body: {},
      }),
      env,
      params: { path: ['contributions'] },
    })
    assert.equal(response.status, 403)
    assert.equal(fetchCalls(), 0)
  })
})

test('shared proxy still rejects the wrong method before the Phase 1 disabled response', async () => {
  const response = await onRequest({
    request: makeRequest('aggregates', { method: 'POST', body: {} }),
    env,
    params: { path: ['aggregates'] },
  })
  assert.equal(response.status, 405)
})

test('shared proxy does not expose the Worker admin purge route', async () => {
  await withBlockedFetch(async (fetchCalls) => {
    const response = await onRequest({
      request: makeRequest('admin/purge-opted-out', {
        method: 'POST',
        body: {},
      }),
      env,
      params: { path: ['admin', 'purge-opted-out'] },
    })
    assert.equal(response.status, 404)
    assert.equal(fetchCalls(), 0)
  })
})
