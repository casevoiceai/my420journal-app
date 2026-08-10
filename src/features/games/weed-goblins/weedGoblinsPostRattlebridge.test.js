import test from 'node:test'
import assert from 'node:assert/strict'

import { createWeedGoblinsRun } from './weedGoblinsEngine.js'
import { prepareWeedGoblinsChoiceTurn } from './weedGoblinsChatControllerChapterOne.js'
import { buildWeedGoblinsChapterEndState } from './weedGoblinsChapterEnd.js'

function latchState() {
  const state = createWeedGoblinsRun({ seed: 'post-rattlebridge-latch-test' })
  return {
    ...state,
    sceneId: 'stash-latch',
    stats: { strength: 3, defense: 1, manaPool: 0, maxMana: 2 },
    flags: {
      ...state.flags,
      sessionZeroComplete: true,
      bossDcModifier: 0,
      hasHighlandCharm: false,
    },
  }
}

for (const action of [
  { id: 'latch:read-face', label: 'Read the carved faces and set the latch correctly' },
  { id: 'latch:force', label: 'Force the carved-face latch open' },
]) {
  test(`${action.id} prepares a real pending D20 turn`, () => {
    const prepared = prepareWeedGoblinsChoiceTurn({ state: latchState(), action })
    assert.equal(prepared.requiresRoll, true)
    assert.equal(prepared.plan.actionId, action.id)
    assert.equal(prepared.rollTriggerMessage.kind, 'roll-trigger')
    assert.equal(prepared.setupMessage.kind, 'check-setup')
  })
}

function chapterOneSummary(index, ending = 'recovery') {
  return {
    adventureId: 'goblin-highlands-session-1',
    seed: `chapter-one-${index}`,
    ending,
    outcomeSummary: ending === 'escape'
      ? 'escaped without recovering the Brass-Latched Research Case'
      : 'recovered the Brass-Latched Research Case',
  }
}

test('failed Chapter 1 run is explicitly identified as a failed attempt', () => {
  const state = {
    status: 'completed',
    adventureId: 'goblin-highlands-session-1',
    ending: 'escape',
    stolenItem: 'the Brass-Latched Research Case',
    runSummary: chapterOneSummary('current', 'escape'),
  }
  const end = buildWeedGoblinsChapterEndState(state, [])
  assert.equal(end.outcomeKind, 'failed')
  assert.equal(end.title, 'This run failed')
  assert.equal(end.continuationKind, 'chapter-replay')
  assert.match(end.continuation, /Chapter 2: The Hollow Market is built but not unlocked yet/)
  assert.equal(end.buttonLabel, 'Play Chapter 1 again')
})

test('fifth completed Chapter 1 run points directly to Chapter 2', () => {
  const previousRuns = [1, 2, 3, 4].map((index) => chapterOneSummary(index))
  const state = {
    status: 'completed',
    adventureId: 'goblin-highlands-session-1',
    ending: 'recovery',
    stolenItem: 'the Brass-Latched Research Case',
    runSummary: chapterOneSummary('current'),
  }
  const end = buildWeedGoblinsChapterEndState(state, previousRuns)
  assert.equal(end.outcomeKind, 'completed')
  assert.equal(end.continuationKind, 'next-chapter')
  assert.equal(end.buttonLabel, 'Continue to Chapter 2: The Hollow Market')
})

test('last built chapter is marked as the edge of current content', () => {
  const state = {
    status: 'completed',
    adventureId: 'withered-grove-session-1',
    ending: 'healing',
    stolenItem: 'the Brass-Latched Research Case',
    runSummary: {
      adventureId: 'withered-grove-session-1',
      seed: 'chapter-three-current',
      ending: 'healing',
      outcomeSummary: 'the grove began healing',
    },
  }
  const end = buildWeedGoblinsChapterEndState(state, [])
  assert.equal(end.continuationKind, 'edge')
  assert.match(end.continuation, /edge of the Weed Goblins content currently built/)
})
