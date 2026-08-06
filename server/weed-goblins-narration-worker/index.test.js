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
      selectedRoll: 1,
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

function anthropicResponse(text) {
  return new Response(JSON.stringify({
    content: [{ type: 'text', text }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
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

test('forwards only an authorized valid natural-one request to Anthropic', async () => {
  let forwarded
  const response = await handleNarrationWorkerRequest(
    request(),
    env,
    async (url, init) => {
      forwarded = { url, init, body: JSON.parse(init.body) }
      return anthropicResponse(
        'I note that the gate has reassigned your route to the longer route.',
      )
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

test('accepts ordinary-failure with outcome failure and forwards the paired context', async () => {
  let forwarded
  const response = await handleNarrationWorkerRequest(
    request({
      body: {
        moment: 'ordinary-failure',
        outcome: 'failure',
        rolls: [7],
        selectedRoll: 7,
        troubleBefore: 0,
        troubleAfter: 1,
      },
    }),
    env,
    async (_url, init) => {
      forwarded = JSON.parse(init.body)
      return anthropicResponse(
        'I record that the gate holds, and your direct route now costs time and one measure of Trouble.',
      )
    },
  )

  assert.equal(response.status, 200)
  assert.match(forwarded.messages[0].content, /single ordinary failure line/)
  assert.equal(forwarded.messages[0].content.includes('"moment":"ordinary-failure"'), true)
  assert.equal(forwarded.messages[0].content.includes('"outcome":"failure"'), true)
  assert.equal(forwarded.messages[0].content.includes('"selectedRoll":7'), true)
})

test('enforces supported moment and outcome pairings before Anthropic forwarding', async () => {
  let fetchCalls = 0
  const fetchImpl = async () => {
    fetchCalls += 1
    return anthropicResponse('I should not be reached.')
  }

  const crossedNatural = await handleNarrationWorkerRequest(
    request({ body: { outcome: 'failure' } }),
    env,
    fetchImpl,
  )
  const crossedFailure = await handleNarrationWorkerRequest(
    request({ body: { moment: 'ordinary-failure', outcome: 'complication' } }),
    env,
    fetchImpl,
  )
  const unsupported = await handleNarrationWorkerRequest(
    request({ body: { moment: 'ordinary-success', outcome: 'success' } }),
    env,
    fetchImpl,
  )

  assert.equal(crossedNatural.status, 400)
  assert.equal(crossedFailure.status, 400)
  assert.equal(unsupported.status, 400)
  assert.equal(fetchCalls, 0)
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

test('system prompt contains explicit character guidance', () => {
  assert.equal(
    WEED_GOBLINS_SYSTEM_PROMPT.includes(
      'Keep the line to one sentence, ideally under 200 characters, and never exceed 260.',
    ),
    true,
  )
})

test('system prompt contains the ordinary-failure moment rules', () => {
  for (const required of [
    'When moment is "ordinary-failure", outcome must be "failure"',
    'An ordinary failure is a real setback',
    'is not automatically comedic',
    'It does not end the run',
    'must not imply that the player succeeded',
    'For an ordinary-failure request, narrate only the failure setback',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})
