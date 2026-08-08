import test from 'node:test'
import assert from 'node:assert/strict'

import {
  BACKGROUNDS,
  ENDINGS,
  GOBLIN_KING_TAUNT_FALLBACK,
  NATURAL_ONE_COMPLICATIONS,
  NARRATION_TIERS,
  WEED_GOBLINS_INTRODUCTION,
  WEED_GOBLINS_NARRATOR_NAME,
  advanceWeedGoblinsRun,
  calculateNarrationTier,
  createWeedGoblinsRun,
  getAvailableActions,
  playWeedGoblinsActions,
} from './weedGoblinsEngine.js'

const EXPECTED_OPENING = "Welcome to the Goblin Highlands. I'll be your narrator. I'm Eliza. I watch your boot stop beside one fresh goblin footprint pressed deep into the mud as the keep's gate closes above it."

const EXPECTED_BACKGROUND_HINTS = Object.freeze({
  hauler: "At the road's edge, I watch you settle empty carrying straps across your shoulders before the climb; steep ground has never stopped you from hauling what matters home.",
  keeper: "At the road's edge, I watch you test every buckle and latch before following the Goblin King's trail; one overlooked detail is all a thief needs.",
  adept: "At the road's edge, I watch you spread a weathered map across a stone as its ink shifts toward the Highlands; strange theories are useful when they point somewhere real.",
})

const RECOVERY_ACTIONS = [
  'background:hauler',
  'route:ridge',
  'goblin:strike',
  'midpoint:skip',
  'boss:overpower',
]

const BARGAIN_ACTIONS = [
  'background:hauler',
  'route:ridge',
  'goblin:strike',
  'midpoint:help',
  'boss:bargain',
]

const MANA_ACTIONS = [
  'background:adept',
  'route:fen',
  'goblin:channel',
  'midpoint:read-runes',
  'boss:spell',
]

const DEFEAT_ACTIONS = [
  'background:adept',
  'route:fen',
  'goblin:channel',
  'midpoint:take-charm',
  'boss:outlast',
]

function latestCheck(state) {
  return [...state.history].reverse().find((event) => event.type === 'check')
}

test('uses the locked welcome as the foundation for concrete Highlands scene-setting', () => {
  assert.equal(WEED_GOBLINS_NARRATOR_NAME, 'Eliza')
  assert.equal(WEED_GOBLINS_INTRODUCTION, EXPECTED_OPENING)
})

test('background hints are concrete start-of-road narrative moments', () => {
  assert.equal(BACKGROUNDS.hauler.flavor, EXPECTED_BACKGROUND_HINTS.hauler)
  assert.equal(BACKGROUNDS.keeper.flavor, EXPECTED_BACKGROUND_HINTS.keeper)
  assert.equal(BACKGROUNDS.adept.flavor, EXPECTED_BACKGROUND_HINTS.adept)

  const before = createWeedGoblinsRun({ seed: 'background-hint-check' })
  const after = advanceWeedGoblinsRun(before, 'background:hauler')
  assert.equal(
    after.narration.at(-1),
    `Highlands Hauler. ${EXPECTED_BACKGROUND_HINTS.hauler}`,
  )
  assert.equal(after.narration.at(-1).includes('mechanically defensible'), false)
})

test('plays one fixed-seed recovery run from start to finish', () => {
  const start = createWeedGoblinsRun({
    seed: 'recovery-1',
    journalSnapshot: { productNames: ['Blue Dream'] },
  })

  assert.equal(start.sceneId, 'choose-background')
  assert.equal(start.narration[0], WEED_GOBLINS_INTRODUCTION)
  assert.equal(start.stolenItem, 'the Blue Dream Field Reliquary')

  const end = playWeedGoblinsActions(start, RECOVERY_ACTIONS)

  assert.equal(end.status, 'completed')
  assert.equal(end.ending, ENDINGS.recovery)
  assert.equal(end.sceneId, 'ending')
  assert.equal(end.runSummary.backgroundId, 'hauler')
  assert.equal(end.runSummary.routeId, 'ridge')
  assert.equal(end.runSummary.midpointChoice, 'skip')
  assert.equal(end.runSummary.narrationTier, NARRATION_TIERS.normal)
  assert.match(end.runSummary.outcomeSummary, /recovered the Blue Dream Field Reliquary/)
  assert.equal(getAvailableActions(end).length, 0)
})

test('plays a full Chapter 1 natural-20 victory with Eliza', () => {
  const end = playWeedGoblinsActions(
    createWeedGoblinsRun({ seed: 'eliza-natural-20-32' }),
    RECOVERY_ACTIONS,
  )
  const bossCheck = end.history.find(
    (event) => event.type === 'check' && event.actionId === 'boss:overpower',
  )

  assert.equal(end.narration[0], WEED_GOBLINS_INTRODUCTION)
  assert.match(end.narration[0], /\bEliza\b/)
  assert.equal(bossCheck.roll, 20)
  assert.equal(bossCheck.outcome, 'success')
  assert.equal(end.status, 'completed')
  assert.equal(end.ending, ENDINGS.recovery)
})

test('emits exactly one Goblin King taunt before boss actions are chosen', () => {
  let state = createWeedGoblinsRun({ seed: 'recovery-1' })
  for (const actionId of [
    'background:hauler',
    'route:ridge',
    'goblin:strike',
  ]) {
    state = advanceWeedGoblinsRun(state, actionId)
  }

  assert.equal(state.sceneId, 'midpoint')
  const historyBefore = state.history.length
  state = advanceWeedGoblinsRun(state, 'midpoint:skip')

  assert.equal(state.sceneId, 'goblin-king')
  const newEvents = state.history.slice(historyBefore)
  assert.deepEqual(newEvents.map((event) => event.type), ['choice', 'taunt'])
  const taunts = state.history.filter((event) => event.type === 'taunt')
  assert.equal(taunts.length, 1)
  assert.equal(taunts[0].sceneId, 'goblin-king')
  assert.equal(taunts[0].actionId, 'boss:taunt')
  assert.equal(taunts[0].outcome, 'taunt')
  assert.equal(state.narration.at(-1), GOBLIN_KING_TAUNT_FALLBACK)
  assert.equal(taunts[0].tauntText, GOBLIN_KING_TAUNT_FALLBACK)

  const bossActions = getAvailableActions(state).map((action) => action.id)
  assert.equal(bossActions.includes('boss:overpower'), true)
  assert.equal(bossActions.includes('boss:outlast'), true)

  state = advanceWeedGoblinsRun(state, 'boss:overpower')
  assert.equal(state.history.filter((event) => event.type === 'taunt').length, 1)
})

test('reaches the bargain ending after a natural-1 complication', () => {
  const end = playWeedGoblinsActions(
    createWeedGoblinsRun({ seed: 'scan-28' }),
    BARGAIN_ACTIONS,
  )

  assert.equal(end.status, 'completed')
  assert.equal(end.ending, ENDINGS.bargain)
  assert.equal(end.flags.goblinAlly, true)
  assert.equal(end.runSummary.midpointChoice, 'help')
  assert.equal(end.runSummary.complicationCount, 1)
  assert.match(end.narration[0], /\bEliza\b/)
})

test('spends the full Mana Pool through rolled checks and reaches recovery', () => {
  const start = createWeedGoblinsRun({ seed: 'scan-10' })
  const afterBackground = advanceWeedGoblinsRun(start, 'background:adept')
  assert.equal(afterBackground.stats.manaPool, 4)

  const end = playWeedGoblinsActions(afterBackground, MANA_ACTIONS.slice(1))
  const manaEvents = end.history.filter((event) => event.type === 'mana')
  const assistedChecks = end.history.filter(
    (event) => event.type === 'check' && event.manaAssisted,
  )

  assert.equal(end.ending, ENDINGS.recovery)
  assert.equal(end.stats.manaPool, 0)
  assert.deepEqual(manaEvents.map((event) => event.amount), [1, 1, 2])
  assert.deepEqual(assistedChecks.map((event) => event.rolls.length), [2, 2, 2])
  assert.equal(end.runSummary.reason, 'mana-assisted victory')
})

test('a Mana-assisted roll can still fail', () => {
  let state = createWeedGoblinsRun({ seed: 'scan-11' })
  state = advanceWeedGoblinsRun(state, 'background:adept')
  state = advanceWeedGoblinsRun(state, 'route:fen')
  state = advanceWeedGoblinsRun(state, 'goblin:channel')

  const check = latestCheck(state)
  assert.equal(check.manaAssisted, true)
  assert.equal(check.advantage, true)
  assert.deepEqual(check.rolls, [9, 6])
  assert.equal(check.roll, 9)
  assert.equal(check.total, 11)
  assert.equal(check.dc, 12)
  assert.equal(check.outcome, 'failure')
  assert.equal(check.success, false)
  assert.equal(state.stats.manaPool, 3)
  assert.equal(state.trouble, 1)
  assert.equal(state.status, 'active')
})

test('completes Chapter 1 after a Mana-assisted failure with Eliza', () => {
  const end = playWeedGoblinsActions(
    createWeedGoblinsRun({ seed: 'scan-11' }),
    [
      'background:adept',
      'route:fen',
      'goblin:channel',
      'midpoint:help',
      'boss:bargain',
    ],
  )
  const failedAssistedCheck = end.history.find(
    (event) => event.type === 'check'
      && event.actionId === 'goblin:channel'
      && event.manaAssisted,
  )

  assert.match(end.narration[0], /\bEliza\b/)
  assert.equal(failedAssistedCheck.outcome, 'failure')
  assert.deepEqual(failedAssistedCheck.rolls, [9, 6])
  assert.equal(end.status, 'completed')
  assert.equal(end.ending, ENDINGS.bargain)
})

test('a selected natural 1 always uses the non-fatal complication path', () => {
  let state = createWeedGoblinsRun({ seed: 'scan-28' })
  state = advanceWeedGoblinsRun(state, 'background:hauler')
  state = { ...state, trouble: 2 }
  state = advanceWeedGoblinsRun(state, 'route:ridge')

  const check = latestCheck(state)
  assert.equal(check.roll, 1)
  assert.equal(check.naturalOne, true)
  assert.equal(check.outcome, 'complication')
  assert.equal(check.success, false)
  assert.ok(NATURAL_ONE_COMPLICATIONS.includes(check.complicationText))
  assert.equal(state.narration.at(-1), check.complicationText)
  assert.notEqual(state.narration.at(-1), state.adventure.routes.ridge.failureText)
  assert.equal(state.complicationCount, 1)
  assert.equal(state.trouble, 2)
  assert.equal(state.status, 'active')
  assert.equal(state.sceneId, 'goblin-encounter')
})

test('ordinary accumulated Trouble can still end the run in defeat', () => {
  const end = playWeedGoblinsActions(
    createWeedGoblinsRun({ seed: 'scan-10' }),
    DEFEAT_ACTIONS,
  )

  assert.equal(end.status, 'completed')
  assert.equal(end.ending, ENDINGS.escape)
  assert.equal(end.trouble, 3)
  assert.match(end.runSummary.outcomeSummary, /escaped without recovering/)
  assert.equal(end.runSummary.reason, 'boss:outlast failed')
})

test('the fixed adventure exposes all three endings through deterministic runs', () => {
  const outcomes = [
    playWeedGoblinsActions(
      createWeedGoblinsRun({ seed: 'recovery-1' }),
      RECOVERY_ACTIONS,
    ).ending,
    playWeedGoblinsActions(
      createWeedGoblinsRun({ seed: 'scan-28' }),
      BARGAIN_ACTIONS,
    ).ending,
    playWeedGoblinsActions(
      createWeedGoblinsRun({ seed: 'scan-10' }),
      DEFEAT_ACTIONS,
    ).ending,
  ]

  assert.deepEqual(new Set(outcomes), new Set(Object.values(ENDINGS)))
})

test('same seed and choices produce the same run summary', () => {
  const first = playWeedGoblinsActions(
    createWeedGoblinsRun({ seed: 'recovery-1' }),
    RECOVERY_ACTIONS,
  )
  const second = playWeedGoblinsActions(
    createWeedGoblinsRun({ seed: 'recovery-1' }),
    RECOVERY_ACTIONS,
  )

  assert.deepEqual(first.runSummary, second.runSummary)
  assert.deepEqual(
    first.history.filter((event) => event.type === 'check'),
    second.history.filter((event) => event.type === 'check'),
  )
})

test('Eliza references the latest prior run without reading storage', () => {
  const run = createWeedGoblinsRun({
    seed: 'returning-player',
    previousRuns: [{ outcomeSummary: 'made a bargain with the Goblin King' }],
  })

  assert.match(run.narration[0], /Last time you made a bargain with the Goblin King/)
  assert.equal(run.narration[1], WEED_GOBLINS_INTRODUCTION)
})

const TIER_CASES = [
  [0, NARRATION_TIERS.normal],
  [4, NARRATION_TIERS.normal],
  [5, NARRATION_TIERS.experiencedCallback],
  [9, NARRATION_TIERS.experiencedCallback],
  [10, NARRATION_TIERS.fourthWall],
]

for (const [priorCompletedRunCount, expectedTier] of TIER_CASES) {
  test(`reports ${expectedTier} narration tier at ${priorCompletedRunCount} prior runs`, () => {
    assert.equal(calculateNarrationTier(priorCompletedRunCount), expectedTier)

    const end = playWeedGoblinsActions(
      createWeedGoblinsRun({
        seed: 'recovery-1',
        priorCompletedRunCount,
      }),
      RECOVERY_ACTIONS,
    )

    assert.equal(end.runSummary.priorCompletedRunCount, priorCompletedRunCount)
    assert.equal(end.runSummary.narrationTier, expectedTier)
  })
}
