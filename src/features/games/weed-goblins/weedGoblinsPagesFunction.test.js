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

async function makeRequest(origin = 'https://my420journal.app', { authorized = true } = {}) {
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
    method: 'POST',
    headers,
    body: JSON.stringify({ moment: 'natural-one-complication' }),
  })
}

test('rejects a request without a valid private-testing session before forwarding', async () => {
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

test('rejects an unapproved Origin before forwarding', async () => {
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

test('accepts only the two locked production origins when Preview wiring is absent', async () => {
  const originalFetch = globalThis.fetch
  const origins = []
  globalThis.fetch = async (_url, init) => {
    origins.push({
      authorization: init.headers.Authorization,
      sourceAddress: init.headers['X-Weed-Goblins-Source-IP'],
    })
    return new Response(JSON.stringify({ text: 'I record a harmless scheduling problem.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  try {
    for (const origin of ['https://my420journal.app', 'https://my420journal.com']) {
      const response = await onRequest({ request: await makeRequest(origin), env })
      assert.equal(response.status, 200)
      assert.equal((await response.json()).text, 'I record a harmless scheduling problem.')
    }
    assert.equal(
      isAllowedWeedGoblinsNarrationOrigin('https://feature-weed-goblins-session-zero.my420journal-app.pages.dev'),
      false,
    )
    assert.deepEqual(origins, [
      {
        authorization: 'Bearer private-shared-secret',
        sourceAddress: '203.0.113.42',
      },
      {
        authorization: 'Bearer private-shared-secret',
        sourceAddress: '203.0.113.42',
      },
    ])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('Preview-only host binding admits Pages preview subdomains without admitting unrelated origins', async () => {
  const previewEnv = {
    ...env,
    WEED_GOBLINS_PAGES_PREVIEW_HOST: 'my420journal-app.pages.dev',
  }
  const previewOrigin = 'https://feature-weed-goblins-session-zero.my420journal-app.pages.dev'
  const hashOrigin = 'https://373f31e2.my420journal-app.pages.dev'

  assert.equal(
    isAllowedWeedGoblinsNarrationOrigin(previewOrigin, previewEnv.WEED_GOBLINS_PAGES_PREVIEW_HOST),
    true,
  )
  assert.equal(
    isAllowedWeedGoblinsNarrationOrigin(hashOrigin, previewEnv.WEED_GOBLINS_PAGES_PREVIEW_HOST),
    true,
  )
  assert.equal(
    isAllowedWeedGoblinsNarrationOrigin('https://my420journal-app.pages.dev', previewEnv.WEED_GOBLINS_PAGES_PREVIEW_HOST),
    false,
  )
  assert.equal(
    isAllowedWeedGoblinsNarrationOrigin('https://my420journal-app.pages.dev.evil.example', previewEnv.WEED_GOBLINS_PAGES_PREVIEW_HOST),
    false,
  )
  assert.equal(
    isAllowedWeedGoblinsNarrationOrigin('http://feature-weed-goblins-session-zero.my420journal-app.pages.dev', previewEnv.WEED_GOBLINS_PAGES_PREVIEW_HOST),
    false,
  )

  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ text: 'Preview narration works.' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
  try {
    const response = await onRequest({ request: await makeRequest(previewOrigin), env: previewEnv })
    assert.equal(response.status, 200)
    assert.equal((await response.json()).text, 'Preview narration works.')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('passes a clean rate-limit response and Retry-After header through unchanged', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({
    error: 'Free-text narration rate limit reached. Please try again later.',
    retry_after_seconds: 900,
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Retry-After': '900',
    },
  })

  try {
    const response = await onRequest({ request: await makeRequest(), env })
    assert.equal(response.status, 429)
    assert.equal(response.headers.get('Retry-After'), '900')
    assert.deepEqual(await response.json(), {
      error: 'Free-text narration rate limit reached. Please try again later.',
      retry_after_seconds: 900,
    })
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
    const response = await onRequest({ request: await makeRequest(), env })
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
