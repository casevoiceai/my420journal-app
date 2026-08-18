import test from 'node:test'
import assert from 'node:assert/strict'

import { V2_SCENES, chooseBackground, chooseOpeningRoute, chooseWeapon, createWeedGoblinsV2State, establishIdentity } from './weedGoblinsV2State.js'
import { getCurrentActions, prepareAction, resolveEnemyTurn, startCombat, commitInitiative } from './weedGoblinsV2Runtime.js'

function character({ route = 'investigate', weapon = 'bow', background = 'tracker' } = {}) {
  let state = createWeedGoblinsV2State({ campaignId: `runtime:${route}:${weapon}:${background}` })
  state = chooseOpeningRoute(state, route)
  state = establishIdentity(state, { name: 'Ace', raceId: 'elf' })
  state = chooseWeapon(state, weapon)
  state = chooseBackground(state, background)
  return state
}

test('disabling the alarm does not make an active guard disappear from the crossing', () => {
  let state = character()
  state = {
    ...state,
    alarm: 'disabled',
    world: {
      ...state.world,
      bridge: { ...state.world.bridge, alarm: 'disabled', alarmCondition: 'disabled' },
    },
  }
  assert.equal(state.sceneId, V2_SCENES.rattlebridge)
  const actions = getCurrentActions(state)
  assert.equal(actions.some((action) => action.id === 'bridge:cross'), false)
  assert.equal(actions.some((action) => action.id === 'bridge:bargain'), true)
  assert.equal(actions.some((action) => action.id === 'bridge:fight'), true)
  assert.throws(() => prepareAction(state, 'bridge:cross'), /still controlling the crossing/i)
})

test('a guard who physically escapes after Downed defeat successfully warns camp even when the bell was disabled', () => {
  let state = character({ weapon: 'sword' })
  state = startCombat(state)
  state = commitInitiative(state, { playerDie: 1, enemyDie: 20 })
  state = {
    ...state,
    alarm: 'disabled',
    campAwareness: 'unaware',
    player: { ...state.player, hp: 1 },
    world: {
      ...state.world,
      bridge: { ...state.world.bridge, alarm: 'disabled', alarmCondition: 'disabled' },
    },
    combat: { ...state.combat, turn: 'enemy', playerPosition: 'Engaged' },
  }
  state = resolveEnemyTurn(state, { attackDie: 20, damageRolls: [4] })
  assert.equal(state.player.wound, 'Downed')
  assert.equal(state.world.sneak.status, 'escaped')
  assert.equal(state.world.sneak.reportProcess.status, 'completed')
  assert.equal(state.campAwareness, 'warned')
  assert.equal(state.alarm, 'disabled')
})
