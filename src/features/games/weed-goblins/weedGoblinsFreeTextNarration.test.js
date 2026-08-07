import test from 'node:test'
import assert from 'node:assert/strict'

import { validateGeneratedNarration } from './weedGoblinsNarrationValidation.js'

const playerAction = 'I shove the goblin into the paperwork cart'

function options(overrides = {}) {
  return {
    moment: 'player-action-attempt',
    outcome: 'attempt',
    playerAction,
    narrationPlayerAction: playerAction,
    ...overrides,
  }
}

test('pre-roll setup accepts exact player wording without revealing a result', () => {
  const result = validateGeneratedNarration(
    'I take "I shove the goblin into the paperwork cart" as your move, and the uncertain footing calls for a roll.',
    options(),
  )
  assert.equal(result.valid, true, result.reasons.join('; '))
})

test('pre-roll setup accepts a fictional name substituted for the generic goblin placeholder', () => {
  const result = validateGeneratedNarration(
    'I shove Skrint Approximately into the paperwork cart, and whether that works is far from certain, let\'s see.',
    options({ allowedFictionalNames: ['Skrint Approximately'] }),
  )

  assert.equal(result.valid, true, result.reasons.join('; '))
})

test('pre-roll setup rejects a resolved number before the player rolls', () => {
  const result = validateGeneratedNarration(
    'I take "I shove the goblin into the paperwork cart" as your move, and the d20 rolls 14.',
    options(),
  )
  assert.equal(result.valid, false)
  assert.equal(result.reasons.includes('reveals a roll result before resolution'), true)
})

test('pre-roll setup rejects exposure of the hidden stat mapping', () => {
  const result = validateGeneratedNarration(
    'I take "I shove the goblin into the paperwork cart" as your move, so this is a Strength check.',
    options(),
  )
  assert.equal(result.valid, false)
  assert.equal(result.reasons.includes('reveals hidden mechanical mapping'), true)
})

test('pre-roll setup rejects the confirmed live defense-check leak', () => {
  const result = validateGeneratedNarration(
    'I take "I shove the goblin into the paperwork cart" as your move, and that\'ll call for a defense check.',
    options(),
  )
  assert.equal(result.valid, false)
  assert.equal(result.reasons.includes('reveals hidden mechanical mapping'), true)
})

test('pre-roll setup rejects a bare stat name even without the word check', () => {
  const result = validateGeneratedNarration(
    'I take "I shove the goblin into the paperwork cart" as your move, and Strength is what matters here.',
    options(),
  )
  assert.equal(result.valid, false)
  assert.equal(result.reasons.includes('reveals hidden mechanical mapping'), true)
})

test('free-text outcome must preserve significant player wording while respecting engine success', () => {
  const valid = validateGeneratedNarration(
    'I watch "I shove the goblin into the paperwork cart" work as the goblin yields the path.',
    options({ moment: 'action-success', outcome: 'success' }),
  )
  const generic = validateGeneratedNarration(
    'I watch your clever plan work as the goblin yields the path.',
    options({ moment: 'action-success', outcome: 'success' }),
  )

  assert.equal(valid.valid, true, valid.reasons.join('; '))
  assert.equal(generic.valid, false)
  assert.equal(generic.reasons.includes('does not preserve the player action wording'), true)
})

test('player text cannot force a success into a failure outcome', () => {
  const result = validateGeneratedNarration(
    'I watch "I shove the goblin into the paperwork cart" succeed, so you win.',
    options({ moment: 'ordinary-failure', outcome: 'failure' }),
  )

  assert.equal(result.valid, false)
  assert.equal(result.reasons.includes('implies a different engine outcome'), true)
})

test('real-world proper name copied from player input is rejected from generated narration', () => {
  const result = validateGeneratedNarration(
    'I take "I use Samsung to distract the goblin" as your move and call for a roll.',
    {
      moment: 'player-action-attempt',
      outcome: 'attempt',
      playerAction: 'I use Samsung to distract the goblin',
      narrationPlayerAction: '',
    },
  )

  assert.equal(result.valid, false)
  assert.equal(result.reasons.some((reason) => reason.includes('Samsung')), true)
})
