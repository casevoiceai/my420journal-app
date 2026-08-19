import test from 'node:test'
import assert from 'node:assert/strict'

import {
  advanceWeedGoblinsRun,
  advanceWeedGoblinsSessionText,
  createWeedGoblinsRun,
} from './weedGoblinsEngine.js'
import {
  getWeedGoblinsAutomaticGuidance,
  getWeedGoblinsHelpContextKey,
  getWeedGoblinsHelpResponse,
  shouldShowAutomaticWeedGoblinsGuidance,
} from './weedGoblinsHelp.js'

function stateAtRoute(seed = 'help-route') {
  let state = createWeedGoblinsRun({ seed })
  state = advanceWeedGoblinsRun(state, 'session:continue')
  state = advanceWeedGoblinsSessionText(state, 'Fenna Duskrow')
  state = advanceWeedGoblinsRun(state, 'session:race:human')
  state = advanceWeedGoblinsRun(state, 'session:weapon:sword')
  state = advanceWeedGoblinsRun(state, 'background:tracker')
  state = advanceWeedGoblinsRun(state, 'session:pronoun:they')
  return advanceWeedGoblinsRun(state, 'session:look:tall-weathered')
}

function stateAtMidpoint() {
  for (let index = 0; index < 100; index += 1) {
    let state = stateAtRoute(`help-midpoint-${index}`)
    state = advanceWeedGoblinsRun(state, 'route:quiet')
    if (state.status !== 'active') continue
    state = advanceWeedGoblinsRun(state, 'goblin:guard')
    if (state.status === 'active' && state.sceneId === 'midpoint') return state
  }
  throw new Error('Could not find active midpoint seed.')
}

test('automatic beginner guidance is enabled only for Chapters 1 and 2', () => {
  assert.equal(shouldShowAutomaticWeedGoblinsGuidance(1), true)
  assert.equal(shouldShowAutomaticWeedGoblinsGuidance(2), true)
  assert.equal(shouldShowAutomaticWeedGoblinsGuidance(3), false)
  assert.equal(shouldShowAutomaticWeedGoblinsGuidance(12), false)
})

test('current Chapter 1 route guidance teaches replies, custom input, and explicit rolls', () => {
  const state = stateAtRoute('help-guidance')
  const guidance = getWeedGoblinsAutomaticGuidance(state, 1)

  assert.match(guidance, /suggested moves/i)
  assert.match(guidance, /type or speak/i)
  assert.match(guidance, /DC/i)
  assert.equal(getWeedGoblinsAutomaticGuidance(state, 3), '')
})

test('help escalates from nudge to stronger hint to direct third-tap answer', () => {
  const state = stateAtMidpoint()
  const first = getWeedGoblinsHelpResponse(state, 1, 1)
  const second = getWeedGoblinsHelpResponse(state, 2, 1)
  const third = getWeedGoblinsHelpResponse(state, 3, 1)

  assert.equal(first.level, 1)
  assert.equal(first.solvesObstacle, false)
  assert.match(first.text, /Nib|tribute token|trail-runes/)

  assert.equal(second.level, 2)
  assert.equal(second.solvesObstacle, false)
  assert.match(second.text, /requires no roll/i)

  assert.equal(third.level, 3)
  assert.equal(third.solvesObstacle, true)
  assert.match(third.text, /late|hour|up absurdly late/i)
  assert.match(third.text, /help Nib/i)
  assert.match(third.text, /no roll/i)
})

test('third Help tells rather than executes the solution', () => {
  const state = stateAtMidpoint()
  const historyLength = state.history.length
  const sceneId = state.sceneId
  const response = getWeedGoblinsHelpResponse(state, 3, 1)

  assert.equal(response.solvesObstacle, true)
  assert.equal(state.history.length, historyLength)
  assert.equal(state.sceneId, sceneId)
  assert.equal(state.flags.goblinAlly, false)
})

test('help context changes when the obstacle changes so UI can reset escalation', () => {
  const route = stateAtRoute('help-context')
  const goblin = advanceWeedGoblinsRun(route, 'route:quiet')

  assert.notEqual(
    getWeedGoblinsHelpContextKey(route, 1),
    getWeedGoblinsHelpContextKey(goblin, 1),
  )
})

test('third Help gives a concrete current-stat answer on a route decision', () => {
  const route = stateAtRoute('help-direct-route')
  const response = getWeedGoblinsHelpResponse(route, 3, 1)

  assert.equal(response.solvesObstacle, true)
  assert.match(response.text, /Direct Crossing/)
  assert.match(response.text, /Mana crossing for advantage/)
})
