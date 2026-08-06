import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createInitialNarrationHook,
  getNarrationHooksForTransition,
} from './weedGoblinsNarrationHooks.js'

function state(changes = {}) {
  return {
    trouble: 0,
    stolenItem: 'the Amber Field Satchel',
    goblinName: 'Professor Grub',
    narrationTier: 'normal',
    background: null,
    flags: { midpointChoice: null },
    history: [],
    narration: ["Welcome to the Goblin Highlands. I'll be your narrator."],
    ...changes,
  }
}

test('creates a scene-intro hook for the opening Highlands narration', () => {
  const hook = createInitialNarrationHook(state())
  assert.equal(hook.moment, 'scene-intro')
  assert.equal(hook.outcome, 'intro')
  assert.equal(hook.introKind, 'highlands-opening')
})

test('maps background and midpoint choice narration to their dedicated moments', () => {
  const before = state()
  const afterBackground = state({
    background: { name: 'Highlands Hauler' },
    history: [{
      type: 'choice',
      sceneId: 'choose-background',
      actionId: 'background:hauler',
      backgroundId: 'hauler',
    }],
    narration: [
      ...before.narration,
      'Highlands Hauler. You were trained to move sealed field supplies.',
    ],
  })
  const backgroundHook = getNarrationHooksForTransition(before, afterBackground)[0]
  assert.equal(backgroundHook.moment, 'scene-intro')
  assert.equal(backgroundHook.backgroundName, 'Highlands Hauler')

  const afterMidpoint = state({
    flags: { midpointChoice: 'help' },
    history: [{ type: 'choice', sceneId: 'midpoint', actionId: 'midpoint:help' }],
    narration: [
      ...before.narration,
      'You help the goblin clerk recover a stack of forms.',
    ],
  })
  const midpointHook = getNarrationHooksForTransition(before, afterMidpoint)[0]
  assert.equal(midpointHook.moment, 'midpoint-outcome')
  assert.equal(midpointHook.outcome, 'midpoint')
  assert.equal(midpointHook.midpointChoice, 'help')
})

test('maps check and ending events without changing deterministic lines', () => {
  const before = state()
  const after = state({
    history: [
      {
        type: 'check',
        sceneId: 'goblin-king',
        actionId: 'boss:overpower',
        outcome: 'success',
        success: true,
        naturalOne: false,
        rolls: [18],
        roll: 18,
        stat: 'strength',
        dc: 16,
      },
      {
        type: 'ending',
        sceneId: 'ending',
        ending: 'recovery',
        reason: 'strength victory',
      },
    ],
    narration: [
      ...before.narration,
      'The Goblin King is defeated within the accepted fictional meaning of defeated.',
      'You recover the Amber Field Satchel.',
    ],
  })
  const hooks = getNarrationHooksForTransition(before, after)
  assert.deepEqual(hooks.map((hook) => [hook.moment, hook.outcome]), [
    ['action-success', 'success'],
    ['run-ending', 'recovery'],
  ])
  assert.equal(hooks[0].fallbackText, after.narration.at(-2))
  assert.equal(hooks[1].fallbackText, after.narration.at(-1))
})

test('keeps a midpoint check under midpoint-outcome while natural 1 stays a complication', () => {
  const before = state()
  const midpoint = state({
    flags: { midpointChoice: 'read-runes' },
    history: [{
      type: 'check',
      sceneId: 'midpoint',
      actionId: 'midpoint:read-runes',
      outcome: 'failure',
      success: false,
      naturalOne: false,
      rolls: [7],
      roll: 7,
    }],
    narration: [...before.narration, 'The runes include a footnote you interpret as optional.'],
  })
  assert.equal(getNarrationHooksForTransition(before, midpoint)[0].moment, 'midpoint-outcome')

  const naturalOne = state({
    history: [{
      type: 'check',
      sceneId: 'midpoint',
      actionId: 'midpoint:read-runes',
      outcome: 'complication',
      success: false,
      naturalOne: true,
      rolls: [1],
      roll: 1,
      complicationText: 'A complication.',
    }],
    narration: [...before.narration, 'A complication.'],
  })
  assert.equal(
    getNarrationHooksForTransition(before, naturalOne)[0].moment,
    'natural-one-complication',
  )
})
