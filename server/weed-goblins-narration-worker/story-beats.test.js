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
  AI: { async run() { throw new Error('test must inject model runner') } },
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
      openingObjective: 'The Goblin King stole the Amber Field Satchel; get it back.',
      storySoFar: 'The player took the Direct Ridge and the stone gate held.',
      continuityAnchors: ['The Direct Ridge'],
      choiceContext: 'The guarded arch suggests force, stealth, or negotiation.',
      scenePurpose: 'Raise pressure before the keep.',
      tensionLevel: 'rising',
      narrationTier: 'normal',
      playerAction: 'I shove the goblin aside',
      narrationPlayerAction: 'I shove the goblin aside',
      interpretedAction: 'press the goblin directly using the physical means available in the scene',
      ...extra,
    }),
  })
}

function workersAiResponse() {
  return { response: 'I record the supplied result without altering it.' }
}

const PAIRS = [
  ['premise-statement', 'premise'],
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
      async (_model, input) => {
        forwarded = input
        return workersAiResponse()
      },
    )

    assert.equal(response.status, 200)
    assert.equal(forwarded.messages[1].content.includes(`"moment":"${moment}"`), true)
    assert.equal(forwarded.messages[1].content.includes(`"outcome":"${outcome}"`), true)
    assert.equal(forwarded.messages[1].content.includes('"storySoFar"'), true)
    assert.equal(forwarded.messages[1].content.includes('"choiceContext"'), true)
    assert.equal(forwarded.messages[1].content.includes('"continuityAnchors":["The Direct Ridge"]'), true)
  })
}

test('rejects mismatched new pairs before Workers AI invocation', async () => {
  let fetchCalls = 0
  const mismatches = [
    ['premise-statement', 'intro'],
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
        return workersAiResponse()
      },
    )
    assert.equal(response.status, 400, `${moment}/${outcome}`)
  }

  assert.equal(fetchCalls, 0)
})

test('exports the exact story-beat outcome sets', () => {
  assert.deepEqual(SUPPORTED_MOMENT_OUTCOMES['premise-statement'], ['premise'])
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

test('system prompt defines one continuous one-shot contract for every moment', () => {
  for (const required of [
    'one beat of a single continuous fantasy one-shot',
    'Premise before choice.',
    'Choices grow from visible pressure.',
    'Show, never muse.',
    'Preserve causality.',
    'Improvise with "yes, and".',
    'Escalate.',
    'Close the loop.',
    'CONTINUITY GATE',
    'the final line MUST include at least one of those exact prior-story details',
    'premise-statement/premise:',
    'scene-intro/intro with introKind highlands-opening:',
    'action-success/success:',
    'ordinary-failure/failure:',
    'natural-one-complication/complication:',
    'midpoint-outcome/midpoint:',
    'goblin-king-taunt/taunt:',
    'player-action-attempt/attempt:',
    'player-action-response/response:',
    'run-ending/recovery:',
    'run-ending/bargain:',
    'run-ending/escape:',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})
