import test from 'node:test'
import assert from 'node:assert/strict'

import {
  advanceWeedGoblinsRun,
  advanceWeedGoblinsSessionText,
  createWeedGoblinsRun,
} from './weedGoblinsEngine.js'
import {
  getWeedGoblinsQuickReplies,
  isWeedGoblinsFreeTextScene,
  prepareWeedGoblinsFreeTextTurn,
  prepareWeedGoblinsQuickReplyTurn,
  resolveWeedGoblinsPreparedMechanics,
} from './weedGoblinsChatController.js'
import { isWeedGoblinsSuggestedChoice } from './weedGoblinsChoices.js'
import { CHAPTER_ONE_ROOMS } from './weedGoblinsRooms.js'

const staticNarration = async ({ hook }) => ({
  text: hook.fallbackText,
  source: 'test-fallback',
})

function stateAtRoute(seed = 'dynamic-choices') {
  let state = createWeedGoblinsRun({ seed })
  state = advanceWeedGoblinsRun(state, 'session:continue')
  state = advanceWeedGoblinsSessionText(state, 'Rell Marrowlight')
  state = advanceWeedGoblinsRun(state, 'session:race:human')
  state = advanceWeedGoblinsRun(state, 'session:weapon:sword')
  state = advanceWeedGoblinsRun(state, 'background:tracker')
  state = advanceWeedGoblinsRun(state, 'session:pronoun:they')
  state = advanceWeedGoblinsRun(state, 'session:look:tall-weathered')
  return state
}

function stateAtMidpoint() {
  for (let index = 0; index < 100; index += 1) {
    let state = stateAtRoute(`dynamic-midpoint-${index}`)
    state = advanceWeedGoblinsRun(state, 'route:quiet')
    if (state.status !== 'active') continue
    state = advanceWeedGoblinsRun(state, 'goblin:guard')
    if (state.status === 'active' && state.sceneId === 'midpoint') return state
  }
  throw new Error('Could not find an active midpoint seed.')
}

function stateAtBoss() {
  return advanceWeedGoblinsRun(stateAtMidpoint(), 'midpoint:skip')
}

test('actual gameplay scenes expose no more than five contextual reply choices', () => {
  const route = stateAtRoute('choice-count-route')
  const goblin = advanceWeedGoblinsRun(route, 'route:quiet')
  const midpoint = stateAtMidpoint()
  const boss = stateAtBoss()

  for (const state of [route, goblin, midpoint, boss]) {
    const choices = getWeedGoblinsQuickReplies(state)
    assert.equal(choices.length, 5, state.sceneId)
  }
})

test('route choices mix authoritative engine choices with suggested custom actions', () => {
  const state = stateAtRoute('choice-composition')
  const choices = getWeedGoblinsQuickReplies(state)

  assert.deepEqual(choices.slice(0, 2).map((choice) => choice.id), ['route:quiet', 'route:loud'])
  assert.equal(choices.filter(isWeedGoblinsSuggestedChoice).length, 3)
  assert.ok(choices.some((choice) => choice.id === 'suggested:route:mana-crossing'))
})

test('custom input is open from the first real gameplay route scene', () => {
  const state = stateAtRoute('route-custom-input')
  assert.equal(state.sceneId, 'choose-route')
  assert.equal(state.currentRoomId, CHAPTER_ONE_ROOMS.windcutTrail.id)
  assert.equal(isWeedGoblinsFreeTextScene(state), true)
})

test('a suggested Mana route button becomes a real free-text check with advantage', async () => {
  const state = stateAtRoute('suggested-mana-route')
  const choice = getWeedGoblinsQuickReplies(state)
    .find((candidate) => candidate.id === 'suggested:route:mana-crossing')
  const manaBefore = state.stats.manaPool

  const prepared = await prepareWeedGoblinsQuickReplyTurn({
    state,
    action: choice,
    generateNarration: staticNarration,
  })

  assert.equal(prepared.requiresRoll, true)
  assert.equal(prepared.plan.actionId, 'route:quiet')
  assert.equal(prepared.plan.engineOptions.useManaAdvantage, true)
  assert.equal(prepared.checkPreview.advantage, true)
  assert.equal(prepared.outgoingMessage.text, choice.playerAction)

  const mechanics = resolveWeedGoblinsPreparedMechanics({ preparedTurn: prepared })
  assert.equal(mechanics.after.stats.manaPool, manaBefore - 1)
  assert.equal(mechanics.after.currentRoomId, CHAPTER_ONE_ROOMS.rattlebridge.id)
})

test('typed physical route action maps to the existing direct crossing mechanics', async () => {
  const state = stateAtRoute('typed-route-action')
  const prepared = await prepareWeedGoblinsFreeTextTurn({
    state,
    playerAction: 'Push straight across Rattlebridge',
    generateNarration: staticNarration,
  })

  assert.equal(prepared.requiresRoll, true)
  assert.equal(prepared.plan.actionId, 'route:loud')
  assert.equal(prepared.checkPreview.stat, 'strength')
  assert.equal(prepared.checkPreview.dc, 12)
})

test('canonical room names in custom actions are treated as in-world terms', async () => {
  const state = stateAtRoute('canonical-room-name')
  const prepared = await prepareWeedGoblinsFreeTextTurn({
    state,
    playerAction: 'Sneak across Rattlebridge along the side ropes',
    generateNarration: staticNarration,
  })

  assert.equal(prepared.plan.inputGuardrail, false)
  assert.equal(prepared.plan.settingGuardrail, false)
  assert.equal(prepared.plan.actionId, 'route:quiet')
})
