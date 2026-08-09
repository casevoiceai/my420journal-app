import test from 'node:test'
import assert from 'node:assert/strict'

import {
  advanceWeedGoblinsRun,
  advanceWeedGoblinsSessionText,
  createWeedGoblinsRun,
  getAvailableActions,
  getWeedGoblinsActionCheckPreview,
} from './weedGoblinsEngine.js'
import {
  prepareWeedGoblinsChoiceTurn,
  prepareWeedGoblinsFreeTextTurn,
  resolveWeedGoblinsPreparedMechanics,
} from './weedGoblinsChatController.js'

function stateAtRoute(seed = 'explicit-roll-cycle') {
  let state = createWeedGoblinsRun({ seed })
  state = advanceWeedGoblinsRun(state, 'session:continue')
  state = advanceWeedGoblinsSessionText(state, 'Corvin Ashwell')
  state = advanceWeedGoblinsRun(state, 'session:race:human')
  state = advanceWeedGoblinsRun(state, 'session:weapon:sword')
  state = advanceWeedGoblinsRun(state, 'background:tracker')
  state = advanceWeedGoblinsRun(state, 'session:pronoun:they')
  state = advanceWeedGoblinsRun(state, 'session:look:tall-weathered')
  assert.equal(state.sceneId, 'choose-route')
  return state
}

function stateAtGoblin(seed = 'explicit-roll-cycle-goblin') {
  return advanceWeedGoblinsRun(stateAtRoute(seed), 'route:quiet')
}

test('built-in route choice stages the check without consuming its roll', () => {
  const state = stateAtRoute()
  const action = getAvailableActions(state).find((candidate) => candidate.id === 'route:quiet')
  const rngBefore = state.rngState
  const prepared = prepareWeedGoblinsChoiceTurn({ state, action })

  assert.equal(prepared.requiresRoll, true)
  assert.equal(prepared.before.sceneId, 'choose-route')
  assert.equal(prepared.before.rngState, rngBefore)
  assert.match(prepared.setupMessage.text, /DC 12/)
  assert.match(prepared.setupMessage.text, /Defense is \+1/)
  assert.match(prepared.setupMessage.text, /11 or better on the die/)
  assert.equal(prepared.rollTriggerMessage.kind, 'roll-trigger')

  const mechanics = resolveWeedGoblinsPreparedMechanics({ preparedTurn: prepared })
  assert.equal(mechanics.after.sceneId, 'goblin-encounter')
  assert.equal(mechanics.checkEvent.dc, 12)
  assert.equal(mechanics.checkEvent.stat, 'defense')
  assert.notEqual(mechanics.after.rngState, rngBefore)
})

test('no-roll Session Zero choice still resolves immediately', () => {
  const state = createWeedGoblinsRun({ seed: 'no-roll-session' })
  const action = getAvailableActions(state)[0]
  const prepared = prepareWeedGoblinsChoiceTurn({ state, action })

  assert.equal(prepared.requiresRoll, false)
  assert.equal(prepared.after.sceneId, 'session-zero-name')
  assert.equal(prepared.setupMessage, null)
  assert.equal(prepared.rollTriggerMessage, null)
})

test('Mana-assisted built-in choice explains advantage without changing its math', () => {
  const state = stateAtGoblin('mana-preview')
  const action = getAvailableActions(state).find((candidate) => candidate.id === 'goblin:channel')
  const preview = getWeedGoblinsActionCheckPreview(state, action.id)
  const prepared = prepareWeedGoblinsChoiceTurn({ state, action })

  assert.equal(preview.dc, 12)
  assert.equal(preview.stat, 'defense')
  assert.equal(preview.manaCost, 1)
  assert.equal(preview.advantage, true)
  assert.equal(preview.requiredDie, 11)
  assert.match(prepared.setupMessage.text, /spending 1 Mana/)
  assert.match(prepared.setupMessage.text, /roll with advantage/)
  assert.match(prepared.setupMessage.text, /11 or better on either die/)
})

test('free-text check receives the same exact DC and modifier instructions', async () => {
  const state = stateAtGoblin('free-text-preview')
  const prepared = await prepareWeedGoblinsFreeTextTurn({
    state,
    playerAction: 'I shove the goblin aside',
    generateNarration: async ({ hook }) => ({
      text: hook.fallbackText,
      source: 'test-fallback',
    }),
  })

  assert.equal(prepared.requiresRoll, true)
  assert.equal(prepared.checkPreview.dc, 12)
  assert.equal(prepared.checkPreview.stat, 'strength')
  assert.equal(prepared.checkPreview.statBonus, 3)
  assert.equal(prepared.checkPreview.requiredDie, 9)
  assert.match(prepared.setupMessage.text, /DC 12/)
  assert.match(prepared.setupMessage.text, /Strength is \+3/)
  assert.match(prepared.setupMessage.text, /9 or better on the die/)
})
