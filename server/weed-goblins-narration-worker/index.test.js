import test from 'node:test'
import assert from 'node:assert/strict'

import {
  WEED_GOBLINS_MODEL,
  WEED_GOBLINS_SYSTEM_PROMPT,
  handleNarrationWorkerRequest,
} from './index.js'

const SECRET = 'test-shared-secret'

function request({ method = 'POST', secret = SECRET, body = {} } = {}) {
  return new Request('https://worker.example.test', {
    method,
    headers: secret === null
      ? { 'Content-Type': 'application/json' }
      : {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`,
        },
    body: method === 'GET' ? undefined : JSON.stringify({
      moment: 'natural-one-complication',
      outcome: 'complication',
      sceneId: 'choose-route',
      actionId: 'route:ridge',
      stat: 'strength',
      dc: 12,
      rolls: [1],
      troubleBefore: 0,
      troubleAfter: 2,
      fictionalStolenItem: 'the Amber Field Satchel',
      fictionalGoblinName: 'Professor Grub',
      narrationTier: 'normal',
      ...body,
    }),
  })
}

const env = {
  WEED_GOBLINS_PROXY_SECRET: SECRET,
  WEED_GOBLINS_ANTHROPIC_API_KEY: 'test-api-key',
}

test('rejects missing or wrong authorization before any forwarding', async () => {
  let fetchCalls = 0
  const fetchImpl = async () => {
    fetchCalls += 1
    throw new Error('must not be called')
  }

  const missing = await handleNarrationWorkerRequest(
    request({ method: 'GET', secret: null }),
    {},
    fetchImpl,
  )
  const wrong = await handleNarrationWorkerRequest(
    request({ secret: 'wrong-secret', body: { moment: 'wrong' } }),
    env,
    fetchImpl,
  )

  assert.equal(missing.status, 401)
  assert.equal(wrong.status, 401)
  assert.equal(fetchCalls, 0)
})

test('forwards only an authorized valid request to Anthropic', async () => {
  let forwarded
  const response = await handleNarrationWorkerRequest(
    request(),
    env,
    async (url, init) => {
      forwarded = { url, init, body: JSON.parse(init.body) }
      return new Response(JSON.stringify({
        content: [{ type: 'text', text: 'I note that the gate has reassigned your route to the longer route.' }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    },
  )

  assert.equal(response.status, 200)
  assert.equal(forwarded.url, 'https://api.anthropic.com/v1/messages')
  assert.equal(forwarded.init.headers['x-api-key'], 'test-api-key')
  assert.equal(forwarded.body.model, WEED_GOBLINS_MODEL)
  assert.equal(forwarded.body.system, WEED_GOBLINS_SYSTEM_PROMPT)
  assert.equal(forwarded.body.messages[0].role, 'user')
  assert.equal(forwarded.body.messages[0].content.includes('"outcome":"complication"'), true)
  assert.equal(JSON.stringify(forwarded).includes(SECRET), false)
})

test('system prompt contains the locked hard constraints', () => {
  for (const required of [
    'strictly in first person',
    'Do not use exclamation points',
    'Never use the words "awesome" or "amazing"',
    'Never use the word "weed"',
    'Never introduce or repeat any real product name',
    'natural-1 complication is always comedic, non-fatal',
    'Never imply that a different roll',
    'narrationTier is "normal"',
    'The Goblin King is a distinct theatrical villain performance',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})
