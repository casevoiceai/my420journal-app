import test from 'node:test'
import assert from 'node:assert/strict'

import { CHAPTER_THREE_REWARDS } from './weedGoblinsChapterThree.js'
import {
  CHAPTER_THREE_DANGER_TIERS,
  CHAPTER_THREE_MEMORY_RING_ORDER,
  CHAPTER_THREE_SCENES,
  CHAPTER_THREE_WATER_STONE_BALANCE,
  advanceChapterThreeRun,
  buildChapterThreePersonalization,
  createChapterThreeRunFromSessionZero,
  getChapterThreeAvailableActions,
} from './weedGoblinsChapterThreeRuntime.js'
import { buildChapterThreeNarrationPayloadForTest } from './weedGoblinsChapterThreeNarration.js'
import { prepareChapterThreeChoiceTurn } from './weedGoblinsChapterThreeChatController.js'
import {
  getWeedGoblinsAutomaticGuidance,
  getWeedGoblinsHelpResponse,
  shouldShowAutomaticWeedGoblinsGuidance,
} from './weedGoblinsHelp.js'
import {
  readWeedGoblinsActiveRun,
  saveWeedGoblinsActiveRun,
} from './weedGoblinsPersistence.js'
import {
  readWeedGoblinsCampaignState,
  saveWeedGoblinsRunSummary,
} from './weedGoblinsLocalDataAdapter.js'

function sessionZeroState(seed = 'chapter-three-test') {
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
    stats: { strength: 3, defense: 2, manaPool: 2, maxMana: 2 },
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

function createWritableMemoryStorage() {
  const values = {}
  return {
    getItem(key) {
      return Object.hasOwn(values, key) ? values[key] : null
    },
    setItem(key, value) {
      values[key] = String(value)
    },
    removeItem(key) {
      delete values[key]
    },
  }
}

function createAuthOnlyStore(userId = 'user-1') {
  return {
    auth: {
      async getUser() {
        return { data: { user: { id: userId } }, error: null }
      },
    },
  }
}

function enterStalkerTrail({ kip = true } = {}) {
  let state = createChapterThreeRunFromSessionZero(sessionZeroState())
  if (kip) state = advanceChapterThreeRun(state, 'verge:kip')
  state = advanceChapterThreeRun(state, 'verge:compare-growth')
  state = advanceChapterThreeRun(state, `rings:${CHAPTER_THREE_MEMORY_RING_ORDER}`)
  state = advanceChapterThreeRun(state, `stones:${CHAPTER_THREE_WATER_STONE_BALANCE}`)
  assert.equal(state.sceneId, CHAPTER_THREE_SCENES.stalkerTrail)
  return state
}

function enterNightlyDraw({
  kip = true,
  stalkerAction = 'stalker:stillness',
  nurseryAction = 'nursery:evacuation-channel',
  siphonAction = 'siphon:water-buffer',
} = {}) {
  let state = enterStalkerTrail({ kip })
  if (stalkerAction === 'stalker:watch') {
    state = advanceChapterThreeRun(state, stalkerAction)
    state = advanceChapterThreeRun(withRoll(state, 20), 'stalker:stillness')
  } else {
    state = advanceChapterThreeRun(withRoll(state, 20), stalkerAction)
  }
  assert.equal(state.sceneId, CHAPTER_THREE_SCENES.sleepingNursery)

  if (nurseryAction.startsWith('nursery:lift') || nurseryAction.startsWith('nursery:thread') || nurseryAction === 'nursery:mana-lure') {
    state = advanceChapterThreeRun(withRoll(state, 20), nurseryAction)
  } else {
    state = advanceChapterThreeRun(state, nurseryAction)
  }
  assert.equal(state.sceneId, CHAPTER_THREE_SCENES.siphonWell)

  if (['siphon:read-conduits', 'siphon:brace-lines', 'siphon:mana-sense'].includes(siphonAction)) {
    state = advanceChapterThreeRun(withRoll(state, 20), siphonAction)
  } else {
    state = advanceChapterThreeRun(state, siphonAction)
  }
  assert.equal(state.sceneId, CHAPTER_THREE_SCENES.nightlyDraw)
  return state
}

function enterGroveDecision(options = {}) {
  let state = enterNightlyDraw(options)
  const drawAction = options.drawAction || (state.chapterThree.siphonPrepared ? 'draw:prepared-channel' : 'draw:ride-pulse')
  state = advanceChapterThreeRun(withRoll(state, 20), drawAction)
  assert.equal(state.sceneId, CHAPTER_THREE_SCENES.groveDecision)
  return state
}

function completeBranch(decision, options = {}) {
  let state = enterGroveDecision(options)
  if (decision === 'decision:burn' || decision === 'decision:redirect') state = withRoll(state, 20)
  return advanceChapterThreeRun(state, decision)
}

test('Chapter 3 maps danger tiers onto the locked 9/12/15/16 DC ladder', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(CHAPTER_THREE_DANGER_TIERS).map(([key, value]) => [key, value.dc])),
    { sprout: 9, bloom: 12, harvest: 15, wither: 16 },
  )
})

test('approved effect signals become one fictional grove-memory sensation without carrying raw journal text', () => {
  const personalization = buildChapterThreePersonalization({
    effectTags: ['Relaxed', 'Focused'],
    notes: 'PRIVATE JOURNAL NOTE',
    transcript: 'PRIVATE TRANSCRIPT',
    healthInfo: 'PRIVATE HEALTH INFO',
  })
  assert.equal(typeof personalization.memorySensation, 'string')
  assert.ok(personalization.memorySensation.length > 0)
  assert.equal(JSON.stringify(personalization).includes('PRIVATE'), false)
  assert.equal(JSON.stringify(personalization).includes('Relaxed'), false)
})

test('Gray Verge opens with four contextual choices and both Chapter 3 puzzles are no-roll', () => {
  let state = createChapterThreeRunFromSessionZero(sessionZeroState())
  assert.equal(state.chapterNumber, 3)
  assert.equal(state.sceneId, CHAPTER_THREE_SCENES.grayVerge)
  assert.equal(getChapterThreeAvailableActions(state).length, 4)

  state = advanceChapterThreeRun(state, 'verge:compare-growth')
  const historyBeforeWrongRing = state.history.length
  state = advanceChapterThreeRun(state, 'rings:canopy-sapling-seed')
  assert.equal(state.sceneId, CHAPTER_THREE_SCENES.memoryRings)
  assert.equal(state.history.slice(historyBeforeWrongRing).some((event) => event.type === 'check'), false)
  state = advanceChapterThreeRun(state, `rings:${CHAPTER_THREE_MEMORY_RING_ORDER}`)
  assert.equal(state.sceneId, CHAPTER_THREE_SCENES.waterStones)
  state = advanceChapterThreeRun(state, 'stones:all-access')
  assert.equal(state.sceneId, CHAPTER_THREE_SCENES.waterStones)
  state = advanceChapterThreeRun(state, `stones:${CHAPTER_THREE_WATER_STONE_BALANCE}`)
  assert.equal(state.sceneId, CHAPTER_THREE_SCENES.stalkerTrail)
})

test('watching the Withering Stalker learns a blind spot and reduces the crossing from Harvest to Bloom', async () => {
  let state = enterStalkerTrail()
  const before = getChapterThreeAvailableActions(state).find((action) => action.id === 'stalker:stillness')
  assert.equal(before.check.dangerTier, 'harvest')
  state = advanceChapterThreeRun(state, 'stalker:watch')
  assert.equal(state.chapterThree.stalkerBlindSpotKnown, true)
  const after = getChapterThreeAvailableActions(state).find((action) => action.id === 'stalker:stillness')
  assert.equal(after.check.dangerTier, 'bloom')
})

test('natural 1 costs exactly two Trouble and remains nonfatal in Chapter 3', () => {
  let state = enterStalkerTrail()
  state = advanceChapterThreeRun(withRoll(state, 1), 'stalker:stillness')
  const check = state.history.findLast((event) => event.type === 'check')
  assert.equal(check.roll, 1)
  assert.equal(check.naturalOne, true)
  assert.equal(state.trouble, 2)
  assert.equal(state.status, 'active')
  assert.equal(state.sceneId, CHAPTER_THREE_SCENES.stalkerTrail)
})

test('ordinary Wither failure is failure-forward, Downed, and reaches the grove decision instead of ending the run', () => {
  let state = enterNightlyDraw({ siphonAction: 'siphon:read-conduits' })
  state = advanceChapterThreeRun(withRoll(state, 2), 'draw:ride-pulse')
  const check = state.history.findLast((event) => event.type === 'check')
  assert.equal(check.naturalOne, false)
  assert.equal(check.success, false)
  assert.equal(state.wound, 'Downed')
  assert.equal(state.status, 'active')
  assert.equal(state.sceneId, CHAPTER_THREE_SCENES.groveDecision)
})

for (const fixture of [
  ['decision:heal', 'healing', 'grove-healing', { kip: true, stalkerAction: 'stalker:watch', nurseryAction: 'nursery:evacuation-channel', siphonAction: 'siphon:water-buffer' }],
  ['decision:quarantine', 'quarantined', 'grove-quarantined', { kip: false, stalkerAction: 'stalker:break-cover', nurseryAction: 'nursery:lift-roots', siphonAction: 'siphon:brace-lines', drawAction: 'draw:hold-lines' }],
  ['decision:burn', 'burned', 'grove-burned', { kip: true, stalkerAction: 'stalker:resin-shadow', nurseryAction: 'nursery:thread-path', siphonAction: 'siphon:read-conduits', drawAction: 'draw:ride-pulse' }],
  ['decision:redirect', 'bonded-to-player', 'siphon-bonded', { kip: true, stalkerAction: 'stalker:stillness', nurseryAction: 'nursery:kip-count', siphonAction: 'siphon:listen-kip', drawAction: 'draw:prepared-channel' }],
  ['decision:ignore-kip', 'drained', 'grove-drained', { kip: false, stalkerAction: 'stalker:break-cover', nurseryAction: 'nursery:lift-roots', siphonAction: 'siphon:brace-lines', drawAction: 'draw:cut-leech' }],
]) {
  const [decision, groveState, ending, options] = fixture
  test(`materially distinct completed route ${groveState} persists its own remembered consequence`, () => {
    const state = completeBranch(decision, options)
    assert.equal(state.status, 'completed')
    assert.equal(state.ending, ending)
    assert.equal(state.chapterThree.groveState, groveState)
    assert.equal(state.runSummary.chapterThreeBranches.groveState, groveState)
    assert.ok(state.runSummary.chapterThreeBranches.majorTruth.includes('Nightly Draw'))
    assert.ok(state.runSummary.chapterThreeBranches.rememberedConsequence.length > 0)
    assert.ok(state.inventory.includes(CHAPTER_THREE_REWARDS.greyBarkShard))
    assert.ok(state.inventory.includes(CHAPTER_THREE_REWARDS.livingRootMap))
  })
}

test("Corla's Last Seed is preserved for recovery/containment/bond routes but not the burn or drained route", () => {
  assert.ok(completeBranch('decision:heal').inventory.includes(CHAPTER_THREE_REWARDS.corlasLastSeed))
  assert.ok(completeBranch('decision:quarantine').inventory.includes(CHAPTER_THREE_REWARDS.corlasLastSeed))
  assert.ok(completeBranch('decision:redirect').inventory.includes(CHAPTER_THREE_REWARDS.corlasLastSeed))
  assert.equal(completeBranch('decision:burn').inventory.includes(CHAPTER_THREE_REWARDS.corlasLastSeed), false)
  assert.equal(completeBranch('decision:ignore-kip').inventory.includes(CHAPTER_THREE_REWARDS.corlasLastSeed), false)
})

test('Chapter 3 suppresses automatic beginner teaching but keeps on-demand Help through exact puzzle solutions', () => {
  let state = createChapterThreeRunFromSessionZero(sessionZeroState())
  state = advanceChapterThreeRun(state, 'verge:compare-growth')
  assert.equal(shouldShowAutomaticWeedGoblinsGuidance(3), false)
  assert.equal(getWeedGoblinsAutomaticGuidance(state, 3), null)
  const help = getWeedGoblinsHelpResponse(state, 3, 3)
  assert.equal(help.level, 3)
  assert.equal(help.solvesObstacle, true)
  assert.match(help.text, /seed, sapling, canopy/i)
})

test('Chapter 3 narration payload excludes raw custom player text and carries only deterministic interpreted action plus fictional state', () => {
  const state = enterStalkerTrail()
  const payload = buildChapterThreeNarrationPayloadForTest({
    moment: 'player-action-attempt',
    outcome: 'attempt',
    fallbackText: 'You test a careful route against the current obstacle.',
    authoritativeText: 'You test a careful route against the current obstacle.',
    storySoFar: 'The Stalker blocks the route to the nursery.',
    choiceContext: 'Stay still; cross carefully',
    playerAction: 'PRIVATE RAW TYPED ACTION ABOUT MY REAL LIFE',
    interpretedAction: 'use careful movement or positioning against the current obstacle',
    requiresRoll: true,
  }, state)
  const serialized = JSON.stringify(payload)
  assert.equal(payload.playerAction, '')
  assert.equal(serialized.includes('PRIVATE RAW'), false)
  assert.equal(serialized.includes('REAL LIFE'), false)
  assert.match(payload.interpretedAction, /careful movement/i)
})

test('active Chapter 3 save/resume preserves exact RNG, scene, transcript, Help, and pending D20 state', () => {
  const storage = createWritableMemoryStorage()
  const userId = 'user-1'
  const state = enterStalkerTrail()
  const action = getChapterThreeAvailableActions(state).find((candidate) => candidate.id === 'stalker:stillness')
  const pendingTurn = prepareChapterThreeChoiceTurn({ state, action })
  const record = saveWeedGoblinsActiveRun({
    storage,
    userId,
    state,
    messages: [{ direction: 'incoming', kind: 'message', text: 'The Stalker moves when you do not.' }],
    choices: getChapterThreeAvailableActions(state),
    pendingTurn,
    helpLevel: 2,
    helpMessage: { level: 2, text: 'Stillness and thick resin trunks create gaps.', solvesObstacle: false },
  })
  assert.equal(record.version, 3)
  assert.equal(record.pendingTurn.requiresRoll, true)

  const restored = readWeedGoblinsActiveRun({ storage, userId })
  assert.equal(restored.state.chapterNumber, 3)
  assert.equal(restored.state.sceneId, state.sceneId)
  assert.equal(restored.state.rngState, state.rngState)
  assert.equal(restored.pendingTurn.before.rngState, state.rngState)
  assert.equal(restored.pendingTurn.plan.actionId, 'stalker:stillness')
  assert.equal(restored.helpLevel, 2)
  assert.equal(restored.messages[0].text, 'The Stalker moves when you do not.')
})

test('completed Chapter 3 save keeps grove memory and duplicate seed does not inflate Chapter 3 run count', async () => {
  const storage = createWritableMemoryStorage()
  const store = createAuthOnlyStore('user-1')
  const completed = completeBranch('decision:redirect', {
    kip: true,
    stalkerAction: 'stalker:stillness',
    nurseryAction: 'nursery:kip-count',
    siphonAction: 'siphon:listen-kip',
    drawAction: 'draw:prepared-channel',
  })
  const first = await saveWeedGoblinsRunSummary({ runSummary: completed.runSummary, store, storage })
  assert.equal(first.summary.chapterNumber, 3)
  assert.equal(first.summary.chapterThreeBranches.groveState, 'bonded-to-player')
  assert.equal(first.campaignState.chapterThree.completedRunCount, 1)
  assert.equal(first.campaignState.chapterThree.groveState, 'bonded-to-player')

  const second = await saveWeedGoblinsRunSummary({ runSummary: completed.runSummary, store, storage })
  assert.equal(second.campaignState.chapterThree.completedRunCount, 1)
  const campaign = await readWeedGoblinsCampaignState({ store, storage })
  assert.equal(campaign.chapterThree.completedRunCount, 1)
  assert.equal(campaign.chapterThree.latestBranches.bramblekinAllied, false)
  assert.ok(campaign.chapterThree.rewards.includes(CHAPTER_THREE_REWARDS.livingRootMap))
})
