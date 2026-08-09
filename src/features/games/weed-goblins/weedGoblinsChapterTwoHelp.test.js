import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getWeedGoblinsAutomaticGuidance,
  getWeedGoblinsHelpContextKey,
  getWeedGoblinsHelpResponse,
} from './weedGoblinsHelp.js'
import {
  CHAPTER_TWO_LANTERN_ORDER,
  advanceChapterTwoRun,
  createChapterTwoRunFromSessionZero,
} from './weedGoblinsChapterTwoRuntime.js'

function state() {
  return createChapterTwoRunFromSessionZero({
    seed: 'help-two',
    rngState: 123,
    playerName: 'Fenna',
    playerRace: 'Human',
    playerWeapon: 'Sword',
    background: { id: 'tracker', name: 'Highland Tracker', ability: 'Push Through' },
    stats: { strength: 3, defense: 1, manaPool: 2, maxMana: 2 },
    flags: { sessionZeroComplete: true },
  })
}

test('Chapter 2 automatic guidance teaches danger tiers, typing, and explicit D20 rolls', () => {
  const guidance = getWeedGoblinsAutomaticGuidance(state(), 2)
  assert.match(guidance, /Sprout|Bloom|Harvest|Wither/)
  assert.match(guidance, /type|speak/i)
  assert.match(guidance, /Roll D20/i)
})

test('third Chapter 2 Help gives the exact lantern solution without executing it', () => {
  const before = state()
  const response = getWeedGoblinsHelpResponse(before, 3, 2)
  assert.equal(response.solvesObstacle, true)
  assert.match(response.text, /Moth.*root.*coin/i)
  assert.equal(before.chapterTwo.lanternSolved, false)
  assert.equal(before.sceneId, 'hollow-market:lantern-order')
})

test('Help context resets when the Hollow Market obstacle changes', () => {
  const before = state()
  const after = advanceChapterTwoRun(before, `lantern:${CHAPTER_TWO_LANTERN_ORDER}`)
  assert.notEqual(
    getWeedGoblinsHelpContextKey(before, 2),
    getWeedGoblinsHelpContextKey(after, 2),
  )
})
