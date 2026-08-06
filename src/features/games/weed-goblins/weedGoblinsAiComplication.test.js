import test from 'node:test'
import assert from 'node:assert/strict'

import { generateNaturalOneComplication } from './weedGoblinsAiComplication.js'
import { validateGeneratedComplication } from './weedGoblinsNarrationValidation.js'

const event = {
  type: 'check',
  naturalOne: true,
  outcome: 'complication',
  sceneId: 'choose-route',
  actionId: 'route:ridge',
  stat: 'strength',
  dc: 12,
  rolls: [1],
  roll: 1,
  complicationText: 'The stone gate moves exactly far enough to block the route you were using. This is measurable progress.',
}

const state = {
  trouble: 2,
  stolenItem: 'the Northern Lights Field Reliquary',
  goblinName: 'Professor Grub',
  narrationTier: 'normal',
}

const staticFallbacks = [event.complicationText]

function response(text, model = 'claude-haiku-4-5-20251001') {
  return Promise.resolve(new Response(JSON.stringify({ text, model }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }))
}

test('accepts a compliant first-attempt AI complication', async () => {
  const result = await generateNaturalOneComplication({
    event,
    state,
    staticFallbacks,
    blockedRealNames: ['Northern Lights', 'Restore Scranton'],
    fetchImpl: async () => response(
      'I note that the gate has reassigned you to a route with more stairs and less dignity.',
    ),
  })

  assert.equal(result.source, 'ai')
  assert.equal(result.attempts, 1)
  assert.equal(result.validationFailures.length, 0)
})

test('retries once with a corrective note after validation catches banned patterns', async () => {
  const requestBodies = []
  const drafts = [
    'STONER says this weed plan is amazing!',
    'I record that the gate has kept your preferred route and issued you the inconvenient one.',
  ]

  const result = await generateNaturalOneComplication({
    event,
    state,
    staticFallbacks,
    fetchImpl: async (_url, init) => {
      requestBodies.push(JSON.parse(init.body))
      return response(drafts[requestBodies.length - 1])
    },
  })

  assert.equal(result.source, 'ai')
  assert.equal(result.attempts, 2)
  assert.equal(result.validationFailures.length, 1)
  assert.equal(result.validationFailures[0].reasons.includes('contains an exclamation point'), true)
  assert.match(requestBodies[1].correctiveNote, /prior draft was rejected/i)
  assert.match(requestBodies[1].correctiveNote, /banned word/i)
})

test('falls back to the existing static line when both AI drafts fail', async () => {
  let calls = 0
  const result = await generateNaturalOneComplication({
    event,
    state,
    staticFallbacks,
    fetchImpl: async () => {
      calls += 1
      return response(calls === 1
        ? 'This is amazing!'
        : 'You win and recover the Northern Lights product.')
    },
  })

  assert.equal(calls, 2)
  assert.equal(result.source, 'static-fallback')
  assert.equal(result.text, event.complicationText)
  assert.equal(result.validationFailures.length, 2)
})

test('blocks player-specific real names but permits the supplied fictionalized name', () => {
  const blocked = validateGeneratedComplication(
    'I find that Restore Scranton has filed your route under avoidable delays.',
    {
      blockedRealNames: ['Restore Scranton', 'Northern Lights'],
      allowedFictionalNames: [state.stolenItem],
    },
  )
  const allowed = validateGeneratedComplication(
    'I note that the Northern Lights Field Reliquary now has a dent shaped like administrative confidence.',
    {
      blockedRealNames: ['Restore Scranton', 'Northern Lights'],
      allowedFictionalNames: [state.stolenItem],
    },
  )

  assert.equal(blocked.valid, false)
  assert.equal(blocked.reasons.some((reason) => reason.includes('Restore Scranton')), true)
  assert.equal(allowed.valid, true)
})
