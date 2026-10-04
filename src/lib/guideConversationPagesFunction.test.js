import test from 'node:test'
import assert from 'node:assert/strict'

import { onRequest } from '../../functions/api/guide-conversation.js'
import { buildPrivateTestingCookie } from '../../server/private-testing-access.js'

const TEST_ACCESS_CODE = 'journal-test-access-code'
const env = {
  JOURNAL_ACCESS_CODE: TEST_ACCESS_CODE,
  GUIDE_CONVERSATION_WORKER_URL: 'https://private-guide-worker.example.test',
  GUIDE_CONVERSATION_PROXY_SECRET: 'private-guide-secret',
}
const testerCookie = (await buildPrivateTestingCookie(TEST_ACCESS_CODE)).split(';')[0]

function makeRequest(origin = 'https://my420journal.app', { authorized = true } = {}) {
  const headers = {
    Origin: origin,
    'Content-Type': 'application/json',
    'CF-Connecting-IP': '203.0.113.42',
  }
  if (authorized) headers.Cookie = testerCookie
  return new Request('https://my420journal.app/api/guide-conversation', {
    method: 'POST',
    headers,
    body: JSON.stringify({ mode: 'chat', guide: 'sunny', messages: [{ role: 'user', content: 'Talk to me.' }] }),
  })
}

test('Guide proxy rejects missing tester session before forwarding', async () => {
  const originalFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => { calls += 1; throw new Error('must not forward') }
  try {
    const response = await onRequest({ request: makeRequest(undefined, { authorized: false }), env })
    assert.equal(response.status, 401)
    assert.equal(calls, 0)
  } finally { globalThis.fetch = originalFetch }
})

test('Guide proxy rejects unapproved origin before forwarding', async () => {
  const originalFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => { calls += 1; throw new Error('must not forward') }
  try {
    const response = await onRequest({ request: makeRequest('https://example.com'), env })
    assert.equal(response.status, 403)
    assert.equal(calls, 0)
  } finally { globalThis.fetch = originalFetch }
})

test('Guide proxy accepts only locked production origins and keeps credentials server-side', async () => {
  const originalFetch = globalThis.fetch
  const forwarded = []
  globalThis.fetch = async (url, init) => {
    forwarded.push({
      url,
      authorization: init.headers.Authorization,
      sourceAddress: init.headers['X-Guide-Source-IP'],
      body: JSON.parse(init.body),
    })
    return new Response(JSON.stringify({ content: 'Hosted Guide reply.\n[[BRANCHES:[]]]' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  try {
    for (const origin of ['https://my420journal.app', 'https://my420journal.com']) {
      const response = await onRequest({ request: makeRequest(origin), env })
      assert.equal(response.status, 200)
      assert.match((await response.json()).content, /Hosted Guide reply/)
    }
    assert.equal(forwarded.length, 2)
    for (const item of forwarded) {
      assert.equal(item.url, env.GUIDE_CONVERSATION_WORKER_URL)
      assert.equal(item.authorization, `Bearer ${env.GUIDE_CONVERSATION_PROXY_SECRET}`)
      assert.equal(item.sourceAddress, '203.0.113.42')
      assert.equal(item.body.guide, 'sunny')
    }
  } finally { globalThis.fetch = originalFetch }
})

test('Guide proxy returns generic connection error without leaking Worker URL or secret', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => { throw new Error(`failed ${env.GUIDE_CONVERSATION_WORKER_URL}`) }
  try {
    const response = await onRequest({ request: makeRequest(), env })
    const text = await response.text()
    assert.equal(response.status, 502)
    assert.equal(text.includes(env.GUIDE_CONVERSATION_WORKER_URL), false)
    assert.equal(text.includes(env.GUIDE_CONVERSATION_PROXY_SECRET), false)
  } finally { globalThis.fetch = originalFetch }
})
