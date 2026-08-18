import test from 'node:test'
import assert from 'node:assert/strict'

import {
  chooseBackground,
  chooseOpeningRoute,
  chooseWeapon,
  createWeedGoblinsV2State,
  establishIdentity,
} from './weedGoblinsV2State.js'
import {
  commitInitiative,
  commitPendingCheck,
  determineEnemyIntent,
  getCurrentActions,
  interpretLocalFreeform,
  prepareAction,
  resolveEnemyTurn,
  startCombat,
} from './weedGoblinsV2Runtime.js'
import {
  checkResultNarration,
  cloudberryNarration,
  rattlebridgeArrival,
} from './weedGoblinsV2Narration.js'

function character({ route = 'direct', weapon = 'sword', background = 'tracker' } = {}) {
  let state = createWeedGoblinsV2State({ campaignId: `round2:${route}:${weapon}:${background}` })
  state = chooseOpeningRoute(state, route)
  state = establishIdentity(state, { name: 'Ace', raceId: 'human' })
  state = chooseWeapon(state, weapon)
  state = chooseBackground(state, background)
  return state
}

function letSneakPrepareAlarm(state) {
  state = startCombat(state)
  state = commitInitiative(state, { playerDie: 1, enemyDie: 20 })
  assert.equal(determineEnemyIntent(state).type, 'prepare-alarm')
  state = resolveEnemyTurn(state)
  assert.equal(state.alarm, 'threatened')
  assert.equal(state.campAwareness, 'unaware')
  return state
}

test('direct pursuit reaches Rattlebridge before the alarm has mechanically started', () => {
  const state = character()
  assert.equal(state.route, 'direct')
  assert.equal(state.timePressure, 'close')
  assert.equal(state.alarm, 'quiet')
  const narration = rattlebridgeArrival(state)
  assert.match(narration, /warning has started|still slack|still quiet/i)
})

test('losing initiative on the direct route prepares the alarm instead of instantly raising it', () => {
  let state = character()
  state = startCombat(state)
  assert.equal(state.timePressure, 'normal')
  assert.equal(state.combat.intent, 'unresolved')
  state = commitInitiative(state, { playerDie: 1, enemyDie: 20 })
  assert.equal(determineEnemyIntent(state).type, 'prepare-alarm')
  state = resolveEnemyTurn(state)
  assert.equal(state.alarm, 'threatened')
  assert.equal(state.campAwareness, 'unaware')
  assert.equal(state.trouble, 0)
})

test('a prepared combat alarm gives the player a concrete interruption action', () => {
  let state = letSneakPrepareAlarm(character())
  const actions = getCurrentActions(state)
  const interrupt = actions.find((action) => action.id === 'combat:interrupt-alarm')
  assert.ok(interrupt)
  assert.match(interrupt.label, /alarm|line|warning|cord|crank/i)

  state = prepareAction(state, interrupt.id)
  assert.equal(state.pendingResolution.type, 'check')
  assert.equal(state.pendingResolution.dc, 11)
  state = commitPendingCheck(state, { rolls: [20] })
  assert.equal(state.alarm, 'quiet')
  assert.equal(state.combat.playerPosition, 'Engaged')
  assert.equal(determineEnemyIntent(state).type, 'attack')
})

test('failing the combat alarm interruption leaves the warning live and lets the Sneak finish it on its turn', () => {
  let state = letSneakPrepareAlarm(character())
  state = prepareAction(state, 'combat:interrupt-alarm')
  state = commitPendingCheck(state, { rolls: [1] })
  assert.equal(state.alarm, 'threatened')
  assert.equal(determineEnemyIntent(state).type, 'raise-alarm')
  state = resolveEnemyTurn(state)
  assert.equal(state.alarm, 'raised')
  assert.equal(state.campAwareness, 'warned')
  assert.equal(state.trouble, 1)
})

test('freeform alarm intervention during combat routes to the real alarm interruption mechanic', () => {
  const state = letSneakPrepareAlarm(character())
  const interpreted = interpretLocalFreeform(state, 'I cut the alarm cord before he can ring the bell')
  assert.equal(interpreted.supported, true)
  assert.equal(interpreted.actionId, 'combat:interrupt-alarm')
})

test('fighting and failed bridge actions progressively cost pursuit time', () => {
  let state = character()
  assert.equal(state.timePressure, 'close')

  state = startCombat(state)
  assert.equal(state.timePressure, 'normal')
  state = commitInitiative(state, { playerDie: 20, enemyDie: 1 })
  state = prepareAction(state, 'combat:retreat')
  state = commitPendingCheck(state, { rolls: [20] })
  assert.equal(state.timePressure, 'normal')

  state = prepareAction(state, 'bridge:bypass')
  state = commitPendingCheck(state, { rolls: [1] })
  assert.equal(state.timePressure, 'delayed')

  state = prepareAction(state, 'bridge:bargain')
  state = commitPendingCheck(state, { rolls: [1] })
  assert.equal(state.timePressure, 'lost')
})

test('once the alarm has already been raised, bypass and retreat rulings stop pretending the warning can still be prevented', () => {
  let state = character()
  state = {
    ...state,
    alarm: 'raised',
    campAwareness: 'warned',
    stealth: 'suspicious',
    player: { ...state.player, mana: 0 },
    world: {
      ...state.world,
      bridge: { ...state.world.bridge, alarm: 'raised' },
    },
  }

  const bypass = getCurrentActions(state).find((action) => action.id === 'bridge:bypass')
  assert.ok(bypass)
  assert.doesNotMatch(bypass.label, /without giving.*warning|clean warning/i)
  let pending = prepareAction(state, 'bridge:bypass')
  assert.doesNotMatch(pending.pendingResolution.successText, /without.*warning|sending a warning/i)

  state = startCombat(state)
  state = commitInitiative(state, { playerDie: 20, enemyDie: 1 })
  pending = prepareAction(state, 'combat:retreat')
  assert.doesNotMatch(pending.pendingResolution.successText, /without.*warning|clean warning/i)
  assert.doesNotMatch(pending.pendingResolution.failureText, /warning position/i)
})

test('generic successful conversation never invents a bargain promise or obligation', () => {
  let state = character()
  state = prepareAction(state, 'bridge:bargain')
  state = commitPendingCheck(state, { rolls: [20] })
  assert.equal(state.threads.some((thread) => thread.id === 'sneak-bargain'), false)
})

test('raised-alarm narration describes the physical crossing problem instead of pretending warning is still avoidable', () => {
  const state = {
    ...character(),
    alarm: 'raised',
    campAwareness: 'warned',
  }
  const success = checkResultNarration({ actionId: 'bridge:bypass', success: true, natural: 18, state })
  const failure = checkResultNarration({ actionId: 'bridge:bargain', success: false, natural: 7, state })
  assert.match(success, /bell has already|warning/i)
  assert.doesNotMatch(success, /alarm stays out/i)
  assert.match(failure, /warning is not the leverage|bell/i)
})

test('Cloudberry narration exposes whether bridge choices preserved or lost the pursuit lead', () => {
  const close = cloudberryNarration({ ...character(), timePressure: 'close' })
  const lost = cloudberryNarration({ ...character(), timePressure: 'lost' })
  assert.match(close, /still close enough|remains a pursuit/i)
  assert.match(lost, /close pursuit.*gone|enough time to disappear/i)
  assert.notEqual(close, lost)
})
