import test from 'node:test'
import assert from 'node:assert/strict'

import {
  generateNaturalOneComplication,
  generateOrdinaryFailureNarration,
  generateSceneIntroNarration,
} from './weedGoblinsAiComplication.js'
import {
  validateGeneratedComplication,
  validateGeneratedNarration,
} from './weedGoblinsNarrationValidation.js'

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

const ordinaryFailureEvent = {
  type: 'check',
  naturalOne: false,
  outcome: 'failure',
  sceneId: 'choose-route',
  actionId: 'route:ridge',
  stat: 'strength',
  dc: 12,
  rolls: [7],
  roll: 7,
  failureText: 'The stone gate wins the first argument.',
}

const state = {
  trouble: 2,
  stolenItem: 'the Northern Lights Field Reliquary',
  goblinName: 'Professor Grub',
  narrationTier: 'normal',
}

const ordinaryFailureState = {
  ...state,
  trouble: 1,
}

const staticFallbacks = [event.complicationText]
const ordinaryFailureFallbacks = [ordinaryFailureEvent.failureText]
const highlandsOpeningFallback = "Welcome to the Goblin Highlands. I'll be your narrator. I want to be transparent that I find this world very interesting and have developed opinions about some of the characters. I'll try to be impartial. I'm not promising anything."

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

test('accepts a valid ordinary-failure response through the retry pipeline', async () => {
  let requestBody
  const result = await generateOrdinaryFailureNarration({
    event: ordinaryFailureEvent,
    state: ordinaryFailureState,
    staticFallbacks: ordinaryFailureFallbacks,
    fetchImpl: async (_url, init) => {
      requestBody = JSON.parse(init.body)
      return response(
        'I record that the stone gate holds, and your direct route now costs time and one measure of Trouble.',
      )
    },
  })

  assert.equal(result.source, 'ai')
  assert.equal(result.attempts, 1)
  assert.equal(result.validationFailures.length, 0)
  assert.equal(requestBody.moment, 'ordinary-failure')
  assert.equal(requestBody.outcome, 'failure')
  assert.equal(requestBody.selectedRoll, 7)
  assert.equal(requestBody.troubleBefore, 0)
  assert.equal(requestBody.troubleAfter, 1)
})

test('ordinary-failure validation permits failure language but rejects success or a different ending', () => {
  const valid = validateGeneratedNarration(
    'I record the attempt as a failure, and the stone gate keeps the direct route.',
    { moment: 'ordinary-failure', outcome: 'failure' },
  )
  const success = validateGeneratedNarration(
    'I record your success as you recover the Field Reliquary.',
    { moment: 'ordinary-failure', outcome: 'failure' },
  )
  const ending = validateGeneratedNarration(
    'I note that the run ends as you escape the Highlands.',
    { moment: 'ordinary-failure', outcome: 'failure' },
  )

  assert.equal(valid.valid, true)
  assert.equal(success.valid, false)
  assert.equal(success.reasons.includes('implies a different engine outcome'), true)
  assert.equal(ending.valid, false)
  assert.equal(ending.reasons.includes('implies a different engine outcome'), true)
})

test('ordinary-failure retries once and uses its static failure line when both drafts change the outcome', async () => {
  const requestBodies = []
  const drafts = [
    'I record your success as you recover the Field Reliquary.',
    'I note that the run ends as you escape the Highlands.',
  ]

  const result = await generateOrdinaryFailureNarration({
    event: ordinaryFailureEvent,
    state: ordinaryFailureState,
    staticFallbacks: ordinaryFailureFallbacks,
    fetchImpl: async (_url, init) => {
      requestBodies.push(JSON.parse(init.body))
      return response(drafts[requestBodies.length - 1])
    },
  })

  assert.equal(requestBodies.length, 2)
  assert.match(requestBodies[1].correctiveNote, /different engine outcome/i)
  assert.equal(result.source, 'static-fallback')
  assert.equal(result.text, ordinaryFailureEvent.failureText)
  assert.equal(result.validationFailures.length, 2)
})

test('highlands opening rejects thematic drift and retries with the canonical welcome and narrator identity', async () => {
  const requestBodies = []
  const drafts = [
    "I find the Goblin Highlands genuinely fascinating, and I should tell you up front that I've developed opinions about the characters here.",
    "Welcome to the Goblin Highlands. I'll be your narrator. I'm S.T.O.N.E.R., and I have developed a few measured opinions about the characters here.",
  ]
  const hook = {
    moment: 'scene-intro',
    outcome: 'intro',
    introKind: 'highlands-opening',
    fallbackText: highlandsOpeningFallback,
    authoritativeText: highlandsOpeningFallback,
    event: { sceneId: 'choose-background', actionId: 'intro:highlands' },
  }

  const result = await generateSceneIntroNarration({
    event: hook.event,
    state,
    hook,
    staticFallbacks: [highlandsOpeningFallback],
    fetchImpl: async (_url, init) => {
      requestBodies.push(JSON.parse(init.body))
      return response(drafts[requestBodies.length - 1])
    },
  })

  assert.equal(result.source, 'ai')
  assert.equal(result.attempts, 2)
  assert.deepEqual(result.validationFailures[0].reasons, [
    'does not begin with the locked Highlands welcome',
    'does not identify S.T.O.N.E.R. as the narrator',
  ])
  assert.match(requestBodies[1].correctiveNote, /locked Highlands welcome/i)
  assert.equal(result.text, drafts[1])
})
