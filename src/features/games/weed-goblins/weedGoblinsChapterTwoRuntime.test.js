import test from 'node:test'
import assert from 'node:assert/strict'

import { CHAPTER_TWO_REWARDS } from './weedGoblinsChapterTwo.js'
import {
  CHAPTER_TWO_DANGER_TIERS,
  CHAPTER_TWO_LANTERN_ORDER,
  CHAPTER_TWO_SCENES,
  CHAPTER_TWO_STARTING_ROOTCOIN,
  advanceChapterTwoRun,
  buildChapterTwoPersonalization,
  createChapterTwoRunFromSessionZero,
  getChapterTwoAvailableActions,
} from './weedGoblinsChapterTwoRuntime.js'

function sessionZeroState(seed = 'chapter-two-test') {
  return {
    seed,
    rngState: 123456789,
    playerName: 'Fenna Duskrow',
    playerRace: 'Human',
    playerWeapon: 'Sword',
    playerPronoun: 'They',
    playerLook: 'Tall and weathered.',
    background: {
      id: 'tracker',
      name: 'Highland Tracker',
      ability: 'Push Through',
    },
    stats: { strength: 3, defense: 1, manaPool: 2, maxMana: 2 },
    flags: { sessionZeroComplete: true },
  }
}

function withRoll(state, roll) {
  const rngByRoll = {
    1: 1,
    2: 800,
    20: 15360,
  }
  return { ...state, rngState: rngByRoll[roll] }
}

function enterWhisperRows({ rootcoin = CHAPTER_TWO_STARTING_ROOTCOIN } = {}) {
  let state = createChapterTwoRunFromSessionZero(sessionZeroState())
  state = { ...state, rootcoin }
  state = advanceChapterTwoRun(state, `lantern:${CHAPTER_TWO_LANTERN_ORDER}`)
  const entryAction = state.rootcoin > 0 ? 'entry:coin' : 'entry:favor'
  return advanceChapterTwoRun(state, entryAction)
}

function enterRootExchange() {
  let state = enterWhisperRows()
  state = advanceChapterTwoRun(state, 'trace:auntie')
  state = advanceChapterTwoRun(withRoll(state, 20), 'trace:receipt')
  assert.equal(state.sceneId, CHAPTER_TWO_SCENES.rootExchange)
  return state
}

function enterLedgerDecision() {
  let state = enterRootExchange()
  state = advanceChapterTwoRun(state, 'ledger:truth')
  assert.equal(state.sceneId, CHAPTER_TWO_SCENES.rootCollector)
  state = advanceChapterTwoRun(withRoll(state, 20), 'collector:evade')
  assert.equal(state.sceneId, CHAPTER_TWO_SCENES.ledgerDecision)
  return state
}

test('Chapter 2 maps danger tiers onto the locked 9/12/15/16 DC ladder', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(CHAPTER_TWO_DANGER_TIERS).map(([key, value]) => [key, value.dc])),
    { sprout: 9, bloom: 12, harvest: 15, wither: 16 },
  )
})

test('approved product categories become fictional stall and counterfeit details only', () => {
  assert.deepEqual(buildChapterTwoPersonalization({ productCategories: ['Vape'] }), {
    recognizedStall: 'mist-cartridge counter',
    counterfeitItem: 'brass mist cartridge',
  })
  const fallback = buildChapterTwoPersonalization({
    productCategories: [],
    notes: 'PRIVATE NOTE',
    voice_transcript: 'PRIVATE TRANSCRIPT',
  })
  assert.equal(JSON.stringify(fallback).includes('PRIVATE'), false)
})

test('Hollow Market opens with four choices and the lantern puzzle does not roll', () => {
  let state = createChapterTwoRunFromSessionZero(sessionZeroState())
  assert.equal(state.chapterNumber, 2)
  assert.equal(state.sceneId, CHAPTER_TWO_SCENES.lanternOrder)
  assert.equal(state.rootcoin, 1)
  assert.equal(getChapterTwoAvailableActions(state).length, 4)

  const beforeHistory = state.history.length
  state = advanceChapterTwoRun(state, 'lantern:root-coin-moth')
  assert.equal(state.sceneId, CHAPTER_TWO_SCENES.lanternOrder)
  assert.equal(state.chapterTwo.lanternAttempts, 1)
  assert.equal(state.history.slice(beforeHistory).some((event) => event.type === 'check'), false)

  state = advanceChapterTwoRun(state, `lantern:${CHAPTER_TWO_LANTERN_ORDER}`)
  assert.equal(state.sceneId, CHAPTER_TWO_SCENES.entryPrice)
  assert.equal(getChapterTwoAvailableActions(state).length, 5)
})

test('entry still offers four contextual choices when no Rootcoin remains', () => {
  let state = createChapterTwoRunFromSessionZero(sessionZeroState(), {
    previousRuns: [{
      adventureId: 'hollow-market-session-1',
      rootcoinRemaining: 0,
      chapterTwoRewards: [CHAPTER_TWO_REWARDS.harvestLedger],
    }],
  })
  state = advanceChapterTwoRun(state, `lantern:${CHAPTER_TWO_LANTERN_ORDER}`)
  assert.equal(state.rootcoin, 0)
  assert.equal(getChapterTwoAvailableActions(state).length, 4)
  assert.ok(getChapterTwoAvailableActions(state).some((action) => action.id === 'entry:negotiate'))
})

test('tribute investigation requires a merchant-side clue and the living receipt', () => {
  let state = enterWhisperRows()
  assert.equal(getChapterTwoAvailableActions(state).length, 4)

  state = advanceChapterTwoRun(state, 'trace:auntie')
  assert.equal(state.sceneId, CHAPTER_TWO_SCENES.whisperRows)
  assert.ok(state.inventory.includes(CHAPTER_TWO_REWARDS.marketVeil))
  assert.equal(getChapterTwoAvailableActions(state).length, 4)

  state = advanceChapterTwoRun(withRoll(state, 20), 'trace:receipt')
  assert.equal(state.chapterTwo.receiptClue, true)
  assert.equal(state.sceneId, CHAPTER_TWO_SCENES.rootExchange)
  assert.ok(getChapterTwoAvailableActions(state).length >= 4)
})

test('natural 1 costs exactly two Trouble and remains nonfatal', () => {
  let state = enterWhisperRows()
  state = advanceChapterTwoRun(withRoll(state, 1), 'trace:sixfinger')
  const check = state.history.findLast((event) => event.type === 'check')
  assert.equal(check.roll, 1)
  assert.equal(check.naturalOne, true)
  assert.equal(state.trouble, 2)
  assert.equal(state.status, 'active')
  assert.equal(state.sceneId, CHAPTER_TWO_SCENES.whisperRows)
})

test('Mana action rolls with advantage and spends exactly one Mana', () => {
  let state = enterRootExchange()
  state = advanceChapterTwoRun(state, 'ledger:truth')
  const manaBefore = state.stats.manaPool
  state = advanceChapterTwoRun(state, 'collector:mana')
  const check = state.history.findLast((event) => event.type === 'check')
  assert.equal(check.advantage, true)
  assert.equal(check.rolls.length, 2)
  assert.equal(state.stats.manaPool, manaBefore - 1)
})

test('ordinary Wither failure is failure-forward, Downed, and does not kill or end the run', () => {
  let state = enterRootExchange()
  state = advanceChapterTwoRun(state, 'ledger:truth')
  state = advanceChapterTwoRun(withRoll(state, 2), 'collector:evade')
  const check = state.history.findLast((event) => event.type === 'check')
  assert.equal(check.naturalOne, false)
  assert.equal(check.success, false)
  assert.equal(state.wound, 'Downed')
  assert.equal(state.status, 'active')
  assert.equal(state.sceneId, CHAPTER_TWO_SCENES.ledgerDecision)
})

for (const fixture of [
  ['ledger:keep-operational', null, 'operational', 'market-operational'],
  ['ledger:expose-tithe', null, 'exposed', 'market-revolt'],
  ['ledger:burn-flood', 20, 'burned', 'market-scattered'],
  ['ledger:take-route', 20, 'secretly-controlled-by-player', 'trade-route'],
]) {
  const [decision, forcedRoll, marketState, ending] = fixture
  test(`ledger branch ${decision} produces its canonical persistent market state`, () => {
    let state = enterLedgerDecision()
    if (forcedRoll) state = withRoll(state, forcedRoll)
    state = advanceChapterTwoRun(state, decision)
    assert.equal(state.sceneId, CHAPTER_TWO_SCENES.drainGate)
    assert.equal(state.chapterTwo.marketState, marketState)
    assert.ok(state.inventory.includes(CHAPTER_TWO_REWARDS.harvestLedger))
    state = advanceChapterTwoRun(state, 'exit:drain')
    assert.equal(state.status, 'completed')
    assert.equal(state.ending, ending)
    assert.equal(state.runSummary.chapterTwoBranches.marketState, marketState)
    assert.ok(state.runSummary.chapterTwoRewards.includes(CHAPTER_TWO_REWARDS.harvestLedger))
    assert.match(state.runSummary.outcomeSummary, /Withered Grove/)
  })
}
