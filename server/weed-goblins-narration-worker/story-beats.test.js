import test from 'node:test'
import assert from 'node:assert/strict'

import {
  SUPPORTED_MOMENT_OUTCOMES,
  WEED_GOBLINS_SYSTEM_PROMPT,
  handleNarrationWorkerRequest,
} from './index.js'

const SECRET = 'test-shared-secret'
const env = {
  WEED_GOBLINS_PROXY_SECRET: SECRET,
  WEED_GOBLINS_ANTHROPIC_API_KEY: 'test-api-key',
  WEED_GOBLINS_RATE_LIMIT_SALT: 'test-rate-limit-salt',
  FREE_TEXT_RATE_LIMITER: {
    getByName() {
      return {
        async fetch() {
          return new Response(JSON.stringify({
            allowed: true,
            retry_after_seconds: 0,
          }), {
            headers: { 'Content-Type': 'application/json' },
          })
        },
      }
    },
  },
}

function request(moment, outcome, extra = {}) {
  return new Request('https://worker.example.test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SECRET}`,
    },
    body: JSON.stringify({
      moment,
      outcome,
      sceneId: 'test-scene',
      actionId: 'test:action',
      rolls: [],
      troubleBefore: 0,
      troubleAfter: 0,
      fictionalStolenItem: 'the Amber Field Satchel',
      fictionalGoblinName: 'Professor Grub',
      authoritativeText: 'The deterministic engine supplied this exact result.',
      narrationTier: 'normal',
      playerAction: 'I shove the goblin aside',
      narrationPlayerAction: 'I shove the goblin aside',
      interpretedAction: 'press the goblin directly using the physical means available in the scene',
      ...extra,
    }),
  })
}

function anthropicResponse() {
  return new Response(JSON.stringify({
    content: [{ type: 'text', text: 'I record the supplied result without altering it.' }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

const PAIRS = [
  ['action-success', 'success'],
  ['scene-intro', 'intro'],
  ['midpoint-outcome', 'midpoint'],
  ['goblin-king-taunt', 'taunt'],
  ['player-action-attempt', 'attempt'],
  ['player-action-response', 'response'],
  ['run-ending', 'recovery'],
  ['run-ending', 'bargain'],
  ['run-ending', 'escape'],
]

for (const [moment, outcome] of PAIRS) {
  test(`accepts ${moment} with ${outcome}`, async () => {
    let forwarded
    const response = await handleNarrationWorkerRequest(
      request(moment, outcome),
      env,
      async (_url, init) => {
        forwarded = JSON.parse(init.body)
        return anthropicResponse()
      },
    )

    assert.equal(response.status, 200)
    assert.equal(forwarded.messages[0].content.includes(`"moment":"${moment}"`), true)
    assert.equal(forwarded.messages[0].content.includes(`"outcome":"${outcome}"`), true)
  })
}

test('rejects mismatched new pairs before Anthropic', async () => {
  let fetchCalls = 0
  const mismatches = [
    ['action-success', 'failure'],
    ['scene-intro', 'success'],
    ['midpoint-outcome', 'intro'],
    ['goblin-king-taunt', 'success'],
    ['goblin-king-taunt', 'intro'],
    ['player-action-attempt', 'success'],
    ['player-action-response', 'failure'],
    ['run-ending', 'success'],
    ['run-ending', 'midpoint'],
  ]

  for (const [moment, outcome] of mismatches) {
    const response = await handleNarrationWorkerRequest(
      request(moment, outcome),
      env,
      async () => {
        fetchCalls += 1
        return anthropicResponse()
      },
    )
    assert.equal(response.status, 400, `${moment}/${outcome}`)
  }

  assert.equal(fetchCalls, 0)
})

test('exports the exact story-beat outcome sets', () => {
  assert.deepEqual(SUPPORTED_MOMENT_OUTCOMES['action-success'], ['success'])
  assert.deepEqual(SUPPORTED_MOMENT_OUTCOMES['scene-intro'], ['intro'])
  assert.deepEqual(SUPPORTED_MOMENT_OUTCOMES['midpoint-outcome'], ['midpoint'])
  assert.deepEqual(SUPPORTED_MOMENT_OUTCOMES['goblin-king-taunt'], ['taunt'])
  assert.deepEqual(SUPPORTED_MOMENT_OUTCOMES['player-action-attempt'], ['attempt'])
  assert.deepEqual(SUPPORTED_MOMENT_OUTCOMES['player-action-response'], ['response'])
  assert.deepEqual(SUPPORTED_MOMENT_OUTCOMES['run-ending'], [
    'recovery',
    'bargain',
    'escape',
  ])
})

test('system prompt contains every new supported-moment rule', () => {
  for (const required of [
    'When moment is "action-success", outcome must be "success"',
    'When moment is "scene-intro", outcome must be "intro"',
    'When moment is "midpoint-outcome", outcome must be "midpoint"',
    'When moment is "goblin-king-taunt", outcome must be "taunt"',
    'When moment is "player-action-attempt", outcome must be "attempt"',
    'When moment is "player-action-response", outcome must be "response"',
    'playerAction is the player\'s raw typed action',
    'Never reveal the silent mechanical mapping',
    'Include one short quoted or clearly attributed Goblin King line',
    'When moment is "run-ending", outcome must be exactly "recovery", "bargain", or "escape"',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})
