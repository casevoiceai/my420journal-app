import test from 'node:test'
import assert from 'node:assert/strict'

import {
  isAllowedWeedGoblinsNarrationOrigin,
  onRequest,
} from '../../../../functions/api/weed-goblins-narration.js'
import {
  PRIVATE_TESTING_COOKIE,
  createPrivateTestingSession,
} from '../../../../server/private-testing-access.js'

const ACCESS_CODE = 'journal-private-test-code'
const env = {
  JOURNAL_ACCESS_CODE: ACCESS_CODE,
  WEED_GOBLINS_NARRATION_WORKER_URL: 'https://private-worker.example.test',
  WEED_GOBLINS_PROXY_SECRET: 'private-shared-secret',
}

async function makeRequest(origin = 'https://my420journal.app', {
  authorized = true,
  method = 'POST',
} = {}) {
  const headers = {
    Origin: origin,
    'Content-Type': 'application/json',
    'CF-Connecting-IP': '203.0.113.42',
  }
  if (authorized) {
    const session = await createPrivateTestingSession(ACCESS_CODE)
    headers.Cookie = `${PRIVATE_TESTING_COOKIE}=${session}`
  }

  return new Request('https://my420journal.app/api/weed-goblins-narration', {
    method,
    headers,
    body: method === 'POST'
      ? JSON.stringify({
          moment: 'natural-one-complication',
          fictionalStolenItem: 'the Northern Lights Field Reliquary',
          playerAction: 'I cross the bridge quietly.',
        })
      : undefined,
  })
}

test('rejects a request without a valid private-testing session', async () => {
  const originalFetch = globalThis.fetch
  let fetchCalls = 0
  globalThis.fetch = async () => {
    fetchCalls += 1
    throw new Error('must not forward')
  }
  try {
    const response = await onRequest({
      request: await makeRequest('https://my420journal.app', { authorized: false }),
      env,
    })
    assert.equal(response.status, 401)
    assert.equal(fetchCalls, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('rejects an unapproved Origin', async () => {
  const originalFetch = globalThis.fetch
  let fetchCalls = 0
  globalThis.fetch = async () => {
    fetchCalls += 1
    throw new Error('must not forward')
  }
  try {
    const response = await onRequest({
      request: await makeRequest('https://example.com'),
      env,
    })
    assert.equal(response.status, 403)
    assert.equal(fetchCalls, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('keeps the locked production and preview origin checks intact', () => {
  assert.equal(isAllowedWeedGoblinsNarrationOrigin('https://my420journal.app'), true)
  assert.equal(isAllowedWeedGoblinsNarrationOrigin('https://my420journal.com'), true)
  assert.equal(isAllowedWeedGoblinsNarrationOrigin('https://example.com'), false)

  const previewHost = 'my420journal-app.pages.dev'
  assert.equal(
    isAllowedWeedGoblinsNarrationOrigin(
      'https://feature-weed-goblins-session-zero.my420journal-app.pages.dev',
      previewHost,
    ),
    true,
  )
  assert.equal(
    isAllowedWeedGoblinsNarrationOrigin('https://my420journal-app.pages.dev', previewHost),
    false,
  )
  assert.equal(
    isAllowedWeedGoblinsNarrationOrigin('https://my420journal-app.pages.dev.evil.example', previewHost),
    false,
  )
  assert.equal(
    isAllowedWeedGoblinsNarrationOrigin(
      'http://feature-weed-goblins-session-zero.my420journal-app.pages.dev',
      previewHost,
    ),
    false,
  )
})

test('authorized POST is refused for Phase 1 and never forwards the request body upstream', async () => {
  const originalFetch = globalThis.fetch
  let fetchCalls = 0
  globalThis.fetch = async () => {
    fetchCalls += 1
    throw new Error('must not forward')
  }

  try {
    const response = await onRequest({ request: await makeRequest(), env })
    assert.equal(response.status, 503)
    assert.equal(fetchCalls, 0)
    assert.deepEqual(await response.json(), {
      error: 'Live narration is disabled for Phase 1 external testing.',
      status: 'phase1_live_narration_disabled',
    })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('non-POST methods remain rejected before the Phase 1 disabled response', async () => {
  const response = await onRequest({
    request: await makeRequest('https://my420journal.app', { method: 'GET' }),
    env,
  })
  assert.equal(response.status, 405)
  assert.deepEqual(await response.json(), { error: 'Method not allowed' })
})
