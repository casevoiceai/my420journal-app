import test from 'node:test'
import assert from 'node:assert/strict'

import {
  ENDINGS,
  NARRATION_TIERS,
  STONER_INTRODUCTION,
  advanceWeedGoblinsRun,
  calculateNarrationTier,
  createWeedGoblinsRun,
  getAvailableActions,
  playWeedGoblinsActions,
} from './weedGoblinsEngine.js'

const RECOVERY_ACTIONS = [
  'background:hauler',
  'route:ridge',
  'goblin:strike',
  'midpoint:skip',
  'boss:overpower',
]

const BARGAIN_ACTIONS = [
  'background:keeper',
  'route:fen',
  'goblin:guard',
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
  'background:hauler',
  'route:fen',
  'goblin:guard',
  'midpoint:take-charm',
  'boss:outlast',
  'boss:outlast',
  'boss:outlast',
]

test('plays one fixed-seed recovery run from start to finish', () => {
  const start = createWeedGoblinsRun({
    seed: 'recovery-1',
    journalSnapshot: { productNames: ['Blue Dream'] },
  })

  assert.equal(start.sceneId, 'choose-background')
  assert.equal(start.narration[0], STONER_INTRODUCTION)
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

test('reaches the bargain ending through the midpoint ally choice', () => {
  const end = playWeedGoblinsActions(
    createWeedGoblinsRun({ seed: 'bargain-1' }),
    BARGAIN_ACTIONS,
  )

  assert.equal(end.status, 'completed')
  assert.equal(end.ending, ENDINGS.bargain)
  assert.equal(end.flags.goblinAlly, true)
  assert.equal(end.runSummary.midpointChoice, 'help')
})

test('spends the full Mana Pool and reaches the recovery ending', () => {
  const start = createWeedGoblinsRun({ seed: 'mana-1' })
  const afterBackground = advanceWeedGoblinsRun(start, 'background:adept')
  assert.equal(afterBackground.stats.manaPool, 4)

  const end = playWeedGoblinsActions(afterBackground, MANA_ACTIONS.slice(1))
  const manaEvents = end.history.filter((event) => event.type === 'mana')

  assert.equal(end.ending, ENDINGS.recovery)
  assert.equal(end.stats.manaPool, 0)
  assert.deepEqual(manaEvents.map((event) => event.amount), [1, 1, 2])
  assert.equal(end.runSummary.reason, 'mana solution')
})

test('three Trouble ends the run in the escape defeat ending', () => {
  const end = playWeedGoblinsActions(
    createWeedGoblinsRun({ seed: 'defeat-15' }),
    DEFEAT_ACTIONS,
  )

  assert.equal(end.status, 'completed')
  assert.equal(end.ending, ENDINGS.escape)
  assert.equal(end.trouble, 3)
  assert.match(end.runSummary.outcomeSummary, /escaped without recovering/)
})

test('the fixed adventure exposes all three endings through deterministic runs', () => {
  const outcomes = [
    playWeedGoblinsActions(
      createWeedGoblinsRun({ seed: 'recovery-1' }),
      RECOVERY_ACTIONS,
    ).ending,
    playWeedGoblinsActions(
      createWeedGoblinsRun({ seed: 'bargain-1' }),
      BARGAIN_ACTIONS,
    ).ending,
    playWeedGoblinsActions(
      createWeedGoblinsRun({ seed: 'defeat-15' }),
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

test('STONER references the latest prior run without reading storage', () => {
  const run = createWeedGoblinsRun({
    seed: 'returning-player',
    previousRuns: [{ outcomeSummary: 'made a bargain with the Goblin King' }],
  })

  assert.match(run.narration[0], /Last time you made a bargain with the Goblin King/)
  assert.equal(run.narration[1], STONER_INTRODUCTION)
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
        seed: `tier-${priorCompletedRunCount}`,
        priorCompletedRunCount,
      }),
      MANA_ACTIONS,
    )

    assert.equal(end.runSummary.priorCompletedRunCount, priorCompletedRunCount)
    assert.equal(end.runSummary.narrationTier, expectedTier)
  })
}
