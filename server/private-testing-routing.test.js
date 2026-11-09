import test from 'node:test'
import assert from 'node:assert/strict'
import { onRequest as middleware, isPublicMarketingRequest } from '../functions/_middleware.js'
import { onRequest as sessionStatus } from '../functions/api/private-testing-session.js'
import { createPrivateTestingSession, PRIVATE_TESTING_COOKIE } from './private-testing-access.js'

function makeContext(path, method = 'GET', cookie = '', secret = 'test-secret') {
  return {
    request: new Request('https://my420journal.app' + path, {
      method,
      headers: { Cookie: cookie, Accept: 'text/html' },
    }),
    env: { JOURNAL_ACCESS_CODE: secret },
    next: async () => new Response('site content', { status: 200 }),
  }
}

test('public marketing is accessible without a tester code', async () => {
  for (const path of ['/', '/about', '/faq', '/contact', '/partners', '/privacy',
    '/assets/index-aA4.js', '/assets/index-bB5.css', '/approved-brain-logo.webp', '/favicon.svg']) {
    assert.equal(isPublicMarketingRequest(makeContext(path).request), true, path)
    assert.equal((await middleware(makeContext(path))).status, 200, path)
  }
})

test('journal and API endpoints remain gated', async () => {
  for (const path of ['/app', '/app/start', '/home', '/journal', '/settings',
    '/api/guide-conversation', '/api/shared/path']) {
    assert.equal(isPublicMarketingRequest(makeContext(path).request), false, path)
    assert.equal((await middleware(makeContext(path))).status, 401, path)
  }
  assert.equal((await middleware(makeContext('/contact', 'POST'))).status, 401)
})

test('session probe refuses public traffic and accepts valid tester cookie', async () => {
  assert.equal((await sessionStatus(makeContext('/api/private-testing-session'))).status, 401)
  const cookie = PRIVATE_TESTING_COOKIE + '=' + await createPrivateTestingSession('test-secret')
  assert.equal((await sessionStatus(makeContext('/api/private-testing-session', 'GET', cookie))).status, 200)
  assert.equal((await middleware(makeContext('/app', 'GET', cookie))).status, 200)
})
