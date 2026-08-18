import test from 'node:test'
import assert from 'node:assert/strict'

import { V2_SCENES, chooseBackground, chooseOpeningRoute, chooseWeapon, createWeedGoblinsV2State, establishIdentity } from './weedGoblinsV2State.js'
import {
  commitInitiative,
  commitPendingCheck,
  commitPlayerAttack,
  commitPlayerDamage,
  getCurrentActions,
  interpretLocalFreeform,
  prepareAction,
  resolveEnemyTurn,
  startCombat,
} from './weedGoblinsV2Runtime.js'
import { attackNarration, checkResultNarration } from './weedGoblinsV2Narration.js'

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

test('all three backgrounds expose a real one-Mana signature action at Rattlebridge', () => {
  for (const background of ['tracker', 'warden', 'diviner']) {
    const state = character({ background })
    const ability = getCurrentActions(state).find((action) => action.id === `ability:${background}-bridge`)
    assert.ok(ability, `${background} must have a Rattlebridge signature action`)
    const pending = prepareAction(state, ability.id)
    assert.equal(pending.player.mana, state.player.mana - 1)
    assert.equal(pending.pendingResolution.manaCost, 1)
    assert.equal(pending.pendingResolution.dc, 11)
  }
})

test('a successful bridge signature uses failure-forward bypass resolution and reaches the far side', () => {
  let state = character({ background: 'tracker' })
  state = prepareAction(state, 'ability:tracker-bridge')
  state = commitPendingCheck(state, { rolls: [20] })
  assert.equal(state.sceneId, V2_SCENES.cloudberry)
  assert.equal(state.player.mana, 1)
  assert.ok(state.ledger.some((event) => event.type === 'roll' && event.actionId === 'ability:tracker-bridge'))
})

test('a later signature resolution never relabels an earlier ordinary bypass in the immutable ledger', () => {
  let state = character({ background: 'tracker' })
  state = prepareAction(state, 'bridge:bypass')
  const ordinaryResolutionId = state.pendingResolution.id
  state = commitPendingCheck(state, { rolls: [1] })
  const ordinaryBefore = state.ledger.filter((event) => event.resolutionId === ordinaryResolutionId && ['roll', 'outcome'].includes(event.type))
  assert.ok(ordinaryBefore.length >= 2)
  assert.ok(ordinaryBefore.every((event) => event.actionId === 'bridge:bypass'))

  state = prepareAction(state, 'ability:tracker-bridge')
  const signatureResolutionId = state.pendingResolution.id
  state = commitPendingCheck(state, { rolls: [20] })

  const ordinaryAfter = state.ledger.filter((event) => event.resolutionId === ordinaryResolutionId && ['roll', 'outcome'].includes(event.type))
  assert.ok(ordinaryAfter.every((event) => event.actionId === 'bridge:bypass'))
  const signature = state.ledger.filter((event) => event.resolutionId === signatureResolutionId && ['roll', 'outcome'].includes(event.type))
  assert.ok(signature.length >= 2)
  assert.ok(signature.every((event) => event.actionId === 'ability:tracker-bridge'))
})

test('Tracker and Warden replace generic combat control with their signature technique', () => {
  for (const background of ['tracker', 'warden']) {
    let state = character({ background })
    state = startCombat(state)
    state = commitInitiative(state, { playerDie: 20, enemyDie: 1 })
    const actions = getCurrentActions(state)
    assert.equal(actions.some((action) => action.id === 'combat:control'), false)
    assert.ok(actions.some((action) => action.id === `ability:${background}-combat`))
    state = prepareAction(state, `ability:${background}-combat`)
    assert.equal(state.player.mana, 1)
    assert.equal(state.pendingResolution.dc, 8)
  }
})

test('Fen Diviner gets a real magical combat attack with a separate d6 damage roll', () => {
  let state = character({ background: 'diviner' })
  state = startCombat(state)
  state = commitInitiative(state, { playerDie: 20, enemyDie: 1 })
  assert.ok(getCurrentActions(state).some((action) => action.id === 'ability:diviner-combat'))
  state = prepareAction(state, 'ability:diviner-combat')
  assert.equal(state.player.mana, 3)
  assert.equal(state.pendingResolution.stat, 'magic')
  assert.deepEqual(state.pendingResolution.damageDice, [6])
  state = commitPlayerAttack(state, { rolls: [20] })
  assert.equal(state.pendingResolution.type, 'damage')
  assert.deepEqual(state.pendingResolution.dice, [6])
  assert.equal(state.world.sneak.hp, 12)
  state = commitPlayerDamage(state, { rolls: [6, 6] })
  assert.equal(state.world.sneak.hp, 0)
})

test('typed Fen Diviner magic is routed into bounded magic without replacing the player wording', () => {
  let state = character({ background: 'diviner' })
  let interpretation = interpretLocalFreeform(state, 'I cast a spell into the bridge cords and ask the magic where the blind route is')
  assert.equal(interpretation.supported, true)
  assert.equal(interpretation.actionId, 'ability:diviner-bridge')
  assert.equal(interpretation.boundedMagic, true)

  state = startCombat(state)
  state = commitInitiative(state, { playerDie: 20, enemyDie: 1 })
  interpretation = interpretLocalFreeform(state, 'I cast a quick arcane bolt at the goblin')
  assert.equal(interpretation.supported, true)
  assert.equal(interpretation.actionId, 'ability:diviner-combat')
  assert.equal(interpretation.boundedMagic, true)
})

test('attack narration cannot mislabel a spell as the equipped physical weapon', () => {
  const hit = attackNarration({ hit: true, weaponId: 'bow' })
  const miss = attackNarration({ hit: false, weaponId: 'battle-axe' })
  assert.doesNotMatch(hit, /bow|axe|sword|staff|mace|dagger/i)
  assert.doesNotMatch(miss, /bow|axe|sword|staff|mace|dagger/i)
})

test('signature abilities have specific DM result narration rather than the generic fallback', () => {
  for (const actionId of ['ability:tracker-bridge', 'ability:warden-bridge', 'ability:diviner-bridge', 'ability:tracker-combat', 'ability:warden-combat']) {
    const success = checkResultNarration({ actionId, success: true, natural: 15, state: character() })
    const failure = checkResultNarration({ actionId, success: false, natural: 5, state: character() })
    assert.doesNotMatch(success, /^The attempt works/)
    assert.doesNotMatch(failure, /^The attempt fails/)
  }
})
