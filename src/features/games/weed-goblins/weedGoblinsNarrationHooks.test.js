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
    fictionalLocationName: 'The Copper Tribunal',
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
  assert.equal(hook.fictionalLocationName, 'The Copper Tribunal')
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
  assert.equal(backgroundHook.event, afterBackground.history[0])

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
  assert.equal(midpointHook.event, afterMidpoint.history[0])
})

test('maps the pre-action Goblin King taunt to its dedicated moment', () => {
  const before = state({
    flags: { midpointChoice: 'skip' },
  })
  const fallbackText = 'I watch the Goblin King settle into his throne and prepare a remark.'
  const after = state({
    flags: { midpointChoice: 'skip' },
    history: [{
      type: 'taunt',
      sceneId: 'goblin-king',
      actionId: 'boss:taunt',
      outcome: 'taunt',
      tauntText: fallbackText,
    }],
    narration: [...before.narration, fallbackText],
  })

  const hook = getNarrationHooksForTransition(before, after)[0]
  assert.equal(hook.moment, 'goblin-king-taunt')
  assert.equal(hook.outcome, 'taunt')
  assert.equal(hook.sceneId, 'goblin-king')
  assert.equal(hook.actionId, 'boss:taunt')
  assert.equal(hook.fallbackText, fallbackText)
  assert.equal(hook.selectedRoll, null)
  assert.deepEqual(hook.rolls, [])
  assert.equal(hook.event, after.history[0])
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
  assert.equal(hooks[0].fictionalLocationName, 'The Copper Tribunal')
  assert.equal(hooks[1].fallbackText, after.narration.at(-1))
  assert.equal(hooks[0].event, after.history[0])
  assert.equal(hooks[1].event, after.history[1])
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
  const midpointHook = getNarrationHooksForTransition(before, midpoint)[0]
  assert.equal(midpointHook.moment, 'midpoint-outcome')
  assert.equal(midpointHook.event, midpoint.history[0])

  const ordinaryFailure = state({
    history: [{
      type: 'check',
      sceneId: 'choose-route',
      actionId: 'route:ridge',
      outcome: 'failure',
      success: false,
      naturalOne: false,
      rolls: [7],
      roll: 7,
    }],
    narration: [...before.narration, 'The stone gate wins the first argument.'],
  })
  const ordinaryFailureHook = getNarrationHooksForTransition(before, ordinaryFailure)[0]
  assert.equal(ordinaryFailureHook.moment, 'ordinary-failure')
  assert.equal(ordinaryFailureHook.event, ordinaryFailure.history[0])

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
  const naturalOneHook = getNarrationHooksForTransition(before, naturalOne)[0]
  assert.equal(naturalOneHook.moment, 'natural-one-complication')
  assert.equal(naturalOneHook.event, naturalOne.history[0])
})
