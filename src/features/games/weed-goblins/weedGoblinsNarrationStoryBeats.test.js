import test from 'node:test'
import assert from 'node:assert/strict'

import { generateNarrationFromHook } from './weedGoblinsAiComplication.js'
import {
  SUPPORTED_MOMENT_OUTCOMES,
  validateGeneratedNarration,
} from './weedGoblinsNarrationValidation.js'

function response(text, model = 'claude-haiku-4-5-20251001') {
  return Promise.resolve(new Response(JSON.stringify({ text, model }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }))
}

const VALID_LINES = Object.freeze({
  'action-success': ['success', 'I record your success as the stone gate yields the direct route.'],
  'scene-intro': ['intro', 'I welcome you to the Goblin Highlands, where the terrain has already filed an objection.'],
  'midpoint-outcome': ['midpoint', 'I note that you help the clerk gather every numbered form before moving on.'],
})

for (const [moment, [outcome, line]] of Object.entries(VALID_LINES)) {
  test(`validates a compliant ${moment} line`, () => {
    const result = validateGeneratedNarration(line, { moment, outcome })
    assert.equal(result.valid, true, result.reasons.join('; '))
  })
}

test('midpoint help may recover forms without implying the recovery ending', () => {
  const result = validateGeneratedNarration(
    'I note that you help the clerk recover a stack of numbered forms before moving on.',
    { moment: 'midpoint-outcome', outcome: 'midpoint' },
  )
  assert.equal(result.valid, true, result.reasons.join('; '))
})

test('validates each exact run ending and rejects a line naming the wrong ending', () => {
  const cases = [
    ['recovery', 'I record that you recover the Amber Field Satchel and leave the throne room with it secured.', 'I record that you make a bargain for the Amber Field Satchel.'],
    ['bargain', 'I record the bargain as complete, with the Amber Field Satchel returned under formal agreement.', 'I record that you escape the Highlands without the Amber Field Satchel.'],
    ['escape', 'I record that you escape the Highlands without recovering the Amber Field Satchel.', 'I record that you recover the Amber Field Satchel in victory.'],
  ]

  for (const [outcome, correct, wrong] of cases) {
    const matching = validateGeneratedNarration(correct, {
      moment: 'run-ending',
      outcome,
      allowedFictionalNames: ['the Amber Field Satchel'],
    })
    const mismatched = validateGeneratedNarration(wrong, {
      moment: 'run-ending',
      outcome,
      allowedFictionalNames: ['the Amber Field Satchel'],
    })

    assert.equal(matching.valid, true, `${outcome}: ${matching.reasons.join('; ')}`)
    assert.equal(mismatched.valid, false, outcome)
    assert.equal(
      mismatched.reasons.includes('implies a different engine outcome'),
      true,
      outcome,
    )
  }
})

test('keeps success and specific endings forbidden outside their matching moments', () => {
  for (const [moment, outcome] of [
    ['natural-one-complication', 'complication'],
    ['ordinary-failure', 'failure'],
    ['scene-intro', 'intro'],
    ['midpoint-outcome', 'midpoint'],
  ]) {
    const result = validateGeneratedNarration(
      'I record your success as you recover the Field Reliquary and escape the Highlands.',
      { moment, outcome },
    )
    assert.equal(result.valid, false, moment)
    assert.equal(result.reasons.includes('implies a different engine outcome'), true, moment)
  }
})

test('rejects unsupported moment and outcome pairings in the validator', () => {
  for (const [moment, outcomes] of Object.entries(SUPPORTED_MOMENT_OUTCOMES)) {
    const wrongOutcome = outcomes.includes('failure') ? 'success' : 'failure'
    const result = validateGeneratedNarration(
      'I record the supplied event without changing its result.',
      { moment, outcome: wrongOutcome },
    )
    assert.equal(result.valid, false, moment)
    assert.equal(
      result.reasons.includes('uses an unsupported narration moment/outcome pairing'),
      true,
      moment,
    )
  }
})

test('generic story-beat hook retries once with the existing corrective pattern', async () => {
  const hook = {
    moment: 'action-success',
    outcome: 'success',
    fallbackText: 'You move the stone gate before it finishes objecting.',
    authoritativeText: 'You move the stone gate before it finishes objecting.',
    sceneId: 'choose-route',
    actionId: 'route:ridge',
    rolls: [16],
    selectedRoll: 16,
    fictionalStolenItem: 'the Amber Field Satchel',
    fictionalGoblinName: 'Professor Grub',
  }
  const bodies = []
  const drafts = [
    'I record that you escape the Highlands after the gate opens.',
    'I record your success as the stone gate yields the direct route.',
  ]

  const result = await generateNarrationFromHook({
    hook,
    fetchImpl: async (_url, init) => {
      bodies.push(JSON.parse(init.body))
      return response(drafts[bodies.length - 1])
    },
  })

  assert.equal(result.source, 'ai')
  assert.equal(result.attempts, 2)
  assert.equal(bodies[0].moment, 'action-success')
  assert.equal(bodies[0].outcome, 'success')
  assert.equal(bodies[0].authoritativeText, hook.fallbackText)
  assert.match(bodies[1].correctiveNote, /different engine outcome/i)
})

test('run-ending hook uses the static line after two wrong endings', async () => {
  const hook = {
    moment: 'run-ending',
    outcome: 'recovery',
    fallbackText: 'You recover the Amber Field Satchel.',
    authoritativeText: 'You recover the Amber Field Satchel.',
    fictionalStolenItem: 'the Amber Field Satchel',
  }
  let calls = 0
  const result = await generateNarrationFromHook({
    hook,
    fetchImpl: async () => {
      calls += 1
      return response(calls === 1
        ? 'I record that you make a bargain for the Amber Field Satchel.'
        : 'I record that you escape the Highlands without the Amber Field Satchel.')
    },
  })

  assert.equal(calls, 2)
  assert.equal(result.source, 'static-fallback')
  assert.equal(result.text, hook.fallbackText)
})
