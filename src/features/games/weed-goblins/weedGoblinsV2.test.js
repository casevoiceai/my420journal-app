import test from 'node:test'
import assert from 'node:assert/strict'

import { BACKGROUNDS, WEAPONS, healthState } from './weedGoblinsV2Rules.js'
import {
  V2_SCENES,
  chooseBackground,
  chooseOpeningRoute,
  chooseWeapon,
  createWeedGoblinsV2State,
  establishIdentity,
  validateV2State,
} from './weedGoblinsV2State.js'
import {
  commitInitiative,
  commitPendingCheck,
  commitPlayerAttack,
  commitPlayerDamage,
  determineEnemyIntent,
  getCombatActions,
  getRattlebridgeActions,
  interpretLocalFreeform,
  prepareAction,
  resolveEnemyTurn,
  startCombat,
} from './weedGoblinsV2Engine.js'
import { createMemoryWeedGoblinsV2Persistence } from './weedGoblinsV2Persistence.js'

function buildCharacter({ route = 'investigate', race = 'elf', weapon = 'bow', background = 'tracker' } = {}) {
  let state = createWeedGoblinsV2State({ campaignId: `test:${route}:${race}:${weapon}:${background}` })
  state = chooseOpeningRoute(state, route)
  state = establishIdentity(state, { name: 'Ace', raceId: race })
  state = chooseWeapon(state, WEAPONS[weapon]?.id || weapon)
  state = chooseBackground(state, background)
  return state
}

function maxDamageRolls(pending) {
  const dice = pending.natural20 ? [...pending.dice, ...pending.dice] : [...pending.dice]
  return dice.map((sides) => sides)
}

test('v2 starts as a story, not a session-zero questionnaire', () => {
  const state = createWeedGoblinsV2State({ campaignId: 'opening' })
  assert.equal(state.sceneId, V2_SCENES.windcut)
  assert.equal(state.player.backgroundId, null)
  assert.equal(state.pendingResolution, null)
  assert.equal(state.ledger.some((event) => event.type === 'roll'), false)
  assert.equal(validateV2State(state), true)
})

test('no D20 roll can occur before background selection', () => {
  let state = createWeedGoblinsV2State({ campaignId: 'distributed-creation' })
  state = chooseOpeningRoute(state, 'investigate')
  assert.equal(state.sceneId, V2_SCENES.identity)
  state = establishIdentity(state, { name: 'Ace', raceId: 'elf' })
  assert.equal(state.sceneId, V2_SCENES.weapon)
  state = chooseWeapon(state, 'bow')
  assert.equal(state.sceneId, V2_SCENES.background)
  assert.equal(state.pendingResolution, null)
  assert.equal(state.ledger.some((event) => event.type === 'roll'), false)
})

test('investigation route carries targeted-theft discoveries forward', () => {
  const state = buildCharacter({ route: 'investigate' })
  assert.equal(state.sceneId, V2_SCENES.rattlebridge)
  assert.ok(state.discoveries.some((item) => item.id === 'targeted-theft'))
  assert.ok(state.discoveries.some((item) => item.id === 'crooked-root-mark'))
  assert.ok(state.inventory.storyItems.some((item) => item.includes('Bent brass clasp')))
})

test('high route delays its risky check until background exists and failure still reaches Rattlebridge', () => {
  let state = buildCharacter({ route: 'high', weapon: 'bow', background: 'tracker' })
  assert.equal(state.sceneId, V2_SCENES.highRouteCheck)
  state = prepareAction(state, 'high:careful')
  assert.equal(state.pendingResolution.type, 'check')
  state = commitPendingCheck(state, { rolls: [1] })
  assert.equal(state.sceneId, V2_SCENES.rattlebridge)
  assert.ok(state.player.hp >= 1)
  assert.notEqual(state.stealth, 'unseen')
})

test('all 18 Level 1 background/weapon combinations can land a real damaging attack', () => {
  for (const backgroundId of Object.keys(BACKGROUNDS)) {
    for (const weapon of Object.values(WEAPONS)) {
      let state = buildCharacter({ route: 'investigate', weapon: weapon.id, background: backgroundId })
      state = startCombat(state)
      state = commitInitiative(state, { playerDie: 20, enemyDie: 1 })
      assert.equal(state.combat.turn, 'player', `${backgroundId}/${weapon.id} should be able to act`)
      const actions = getCombatActions(state)
      assert.ok(actions.some((action) => action.id === 'combat:attack-force'))
      assert.ok(actions.some((action) => action.id === 'combat:attack-precision'))
      state = prepareAction(state, 'combat:attack-force')
      state = commitPlayerAttack(state, { rolls: [20] })
      assert.equal(state.pendingResolution.type, 'damage')
      state = commitPlayerDamage(state, { rolls: maxDamageRolls(state.pendingResolution) })
      assert.ok(state.world.sneak.hp < state.world.sneak.maxHp, `${backgroundId}/${weapon.id} must deal damage`)
    }
  }
})

test('a successful player attack requires a separate damage roll', () => {
  let state = buildCharacter({ weapon: 'bow', background: 'tracker' })
  state = startCombat(state)
  state = commitInitiative(state, { playerDie: 20, enemyDie: 1 })
  state = prepareAction(state, 'combat:attack-precision')
  state = commitPlayerAttack(state, { rolls: [20] })
  assert.equal(state.pendingResolution.type, 'damage')
  assert.equal(state.world.sneak.hp, 12)
  state = commitPlayerDamage(state, { rolls: maxDamageRolls(state.pendingResolution) })
  assert.ok(state.world.sneak.hp < 12)
})

test('enemy alarm behavior is a two-step threat, not an initiative coin flip', () => {
  let state = buildCharacter({ route: 'investigate', weapon: 'sword', background: 'tracker' })
  state = startCombat(state)
  state = commitInitiative(state, { playerDie: 1, enemyDie: 20 })
  assert.equal(determineEnemyIntent(state).type, 'prepare-alarm')
  state = resolveEnemyTurn(state)
  assert.equal(state.alarm, 'threatened')
  assert.equal(state.campAwareness, 'unaware')

  state = prepareAction(state, 'combat:attack-precision')
  state = commitPlayerAttack(state, { rolls: [1] })
  assert.equal(state.combat.turn, 'enemy')
  assert.equal(determineEnemyIntent(state).type, 'raise-alarm')
  state = resolveEnemyTurn(state)
  assert.equal(state.alarm, 'raised')
  assert.equal(state.campAwareness, 'warned')
})

test('ordinary 0 HP defeat is nonlethal and continues from consequence', () => {
  let state = buildCharacter({ route: 'investigate', weapon: 'sword', background: 'tracker' })
  state = startCombat(state)
  state = commitInitiative(state, { playerDie: 1, enemyDie: 20 })
  state = {
    ...state,
    alarm: 'raised',
    player: { ...state.player, hp: 1 },
    world: {
      ...state.world,
      bridge: { ...state.world.bridge, alarm: 'raised' },
    },
    combat: { ...state.combat, turn: 'enemy', playerPosition: 'Engaged' },
  }
  state = resolveEnemyTurn(state, { attackDie: 20, damageRolls: [4] })
  assert.equal(state.sceneId, V2_SCENES.rattlebridge)
  assert.equal(state.player.hp, 1)
  assert.equal(state.player.wound, 'Downed')
  assert.equal(state.world.sneak.status, 'escaped')
  assert.ok(state.ledger.some((event) => event.type === 'defeat' && event.lethal === false))
  assert.ok(getRattlebridgeActions(state).some((action) => action.id === 'bridge:continue-after-defeat'))
})

test('faction knowledge is not omniscient when the Sneak is stopped', () => {
  let state = buildCharacter({ route: 'investigate', weapon: 'battle-axe', background: 'tracker' })
  state = startCombat(state)
  state = commitInitiative(state, { playerDie: 20, enemyDie: 1 })
  state = prepareAction(state, 'combat:attack-force')
  state = commitPlayerAttack(state, { rolls: [20] })
  state = commitPlayerDamage(state, { rolls: maxDamageRolls(state.pendingResolution) })
  assert.equal(state.world.sneak.status, 'down')
  assert.equal(state.campAwareness, 'unaware')
})

test('local freeform maps ordinary intent without giving Eliza authority over mechanics', () => {
  const state = buildCharacter({ route: 'investigate' })
  assert.deepEqual(interpretLocalFreeform(state, 'I cut the alarm cord before he can ring it'), {
    supported: true,
    actionId: 'bridge:disable-alarm',
  })
  assert.deepEqual(interpretLocalFreeform(state, 'I ask him what the crooked root means'), {
    supported: true,
    actionId: 'bridge:bargain',
  })
  assert.equal(interpretLocalFreeform(state, 'I turn into a dragon and erase yesterday').supported, false)
})

test('memory persistence keeps ledger and current snapshot together', async () => {
  const persistence = createMemoryWeedGoblinsV2Persistence()
  const state = buildCharacter({ route: 'investigate', weapon: 'bow', background: 'diviner' })
  await persistence.save(state)
  const restored = await persistence.load(state.campaignId)
  assert.deepEqual(restored, state)
  assert.equal(healthState(restored.world.sneak.hp, restored.world.sneak.maxHp), 'Unhurt')
})
