import test from 'node:test'
import assert from 'node:assert/strict'

import {
  BACKGROUNDS,
  createWeedGoblinsRun,
  getAvailableActions,
  getWeedGoblinsActionCheckPreview,
} from './weedGoblinsEngine.js'
import { prepareWeedGoblinsChoiceTurn } from './weedGoblinsChatControllerChapterOne.js'
import {
  CHAPTER_TWO_SCENES,
  createChapterTwoRunFromSessionZero,
  getChapterTwoActionCheckPreview,
  getChapterTwoAvailableActions,
} from './weedGoblinsChapterTwoRuntime.js'
import {
  CHAPTER_THREE_SCENES,
  createChapterThreeRunFromSessionZero,
  getChapterThreeActionCheckPreview,
  getChapterThreeAvailableActions,
} from './weedGoblinsChapterThreeRuntime.js'

const sessionState = {
  flags: { sessionZeroComplete: true },
  seed: 'check-type-audit',
  rngState: 123456,
  playerName: 'Fenna',
  playerRace: 'Human',
  playerWeapon: 'Sword',
  playerPronoun: 'They',
  playerLook: 'Tall and weathered',
  background: BACKGROUNDS.tracker,
  stats: { strength: 3, defense: 1, manaPool: 5, maxMana: 5 },
}

function chapterOneState(sceneId) {
  const base = createWeedGoblinsRun({ seed: `audit:${sceneId}` })
  return {
    ...base,
    sceneId,
    goblinName: 'Old Sump',
    background: BACKGROUNDS.tracker,
    stats: { strength: 3, defense: 1, manaPool: 5, maxMana: 5 },
    flags: {
      ...base.flags,
      sessionZeroComplete: true,
      hasHighlandCharm: true,
      goblinAlly: true,
    },
  }
}

const chapterOneExpected = {
  'route:quiet': ['choose-route', 'Stealth'],
  'route:loud': ['choose-route', 'Athletics'],
  'goblin:channel': ['goblin-encounter', 'Deception'],
  'goblin:strike': ['goblin-encounter', 'Strength'],
  'goblin:guard': ['goblin-encounter', 'Defense'],
  'midpoint:read-runes': ['midpoint', 'Investigation'],
  'midpoint:take-charm': ['midpoint', 'Stealth'],
  'camp:force-ledger': ['highland-camp', 'Athletics'],
  'camp:expose-tribute': ['highland-camp', 'Investigation'],
  'camp:protect-tribute': ['highland-camp', 'Deception'],
  'latch:read-face': ['stash-latch', 'Investigation'],
  'latch:force': ['stash-latch', 'Athletics'],
  'latch:channel': ['stash-latch', 'Investigation'],
  'boss:overpower': ['goblin-king', 'Strength'],
  'boss:outlast': ['goblin-king', 'Defense'],
  'boss:spell': ['goblin-king', 'Persuasion'],
}

test('Chapter 1 every built-in rolled choice has a fiction-matched semantic check type', () => {
  for (const [actionId, [sceneId, expectedType]] of Object.entries(chapterOneExpected)) {
    const state = chapterOneState(sceneId)
    const preview = getWeedGoblinsActionCheckPreview(state, actionId)
    assert.equal(preview.requiresRoll, true, `${actionId} should require a roll`)
    assert.equal(preview.checkType, expectedType, actionId)
  }

  for (const sceneId of ['choose-route', 'goblin-encounter', 'midpoint', 'highland-camp', 'stash-latch', 'goblin-king']) {
    const state = chapterOneState(sceneId)
    for (const action of getAvailableActions(state)) {
      const preview = getWeedGoblinsActionCheckPreview(state, action.id)
      if (preview.requiresRoll) assert.ok(preview.checkType, `Missing check type for ${action.id}`)
    }
  }
})

test('Chapter 1 latch reads as Investigation while Old Sump outlast remains Defense', () => {
  const latchState = chapterOneState('stash-latch')
  const latch = prepareWeedGoblinsChoiceTurn({
    state: latchState,
    action: { id: 'latch:read-face' },
  })
  assert.match(latch.setupMessage.text, /Investigation check, DC 12/i)
  assert.match(latch.setupMessage.text, /Using your Defense \+1/i)

  const goblinState = chapterOneState('goblin-encounter')
  const outlast = prepareWeedGoblinsChoiceTurn({
    state: goblinState,
    action: { id: 'goblin:guard' },
  })
  assert.match(outlast.setupMessage.text, /Defense check, DC 12/i)
  assert.doesNotMatch(outlast.setupMessage.text, /Investigation check/i)
})

const chapterTwoExpected = {
  'entry:negotiate': [CHAPTER_TWO_SCENES.entryPrice, 'Persuasion'],
  'trace:sixfinger': [CHAPTER_TWO_SCENES.whisperRows, 'Persuasion'],
  'trace:nettle': [CHAPTER_TWO_SCENES.whisperRows, 'Stealth'],
  'trace:receipt': [CHAPTER_TWO_SCENES.whisperRows, 'Investigation'],
  'ledger:lie': [CHAPTER_TWO_SCENES.rootExchange, 'Deception'],
  'ledger:mana': [CHAPTER_TWO_SCENES.rootExchange, 'Investigation'],
  'collector:evade': [CHAPTER_TWO_SCENES.rootCollector, 'Acrobatics'],
  'collector:brace': [CHAPTER_TWO_SCENES.rootCollector, 'Athletics'],
  'collector:climb': [CHAPTER_TWO_SCENES.rootCollector, 'Athletics'],
  'collector:cut-roots': [CHAPTER_TWO_SCENES.rootCollector, 'Athletics'],
  'collector:mana': [CHAPTER_TWO_SCENES.rootCollector, 'Acrobatics'],
  'ledger:burn-flood': [CHAPTER_TWO_SCENES.ledgerDecision, 'Athletics'],
  'ledger:take-route': [CHAPTER_TWO_SCENES.ledgerDecision, 'Deception'],
  'exit:settle': [CHAPTER_TWO_SCENES.drainGate, 'Persuasion'],
}

function chapterTwoState(sceneId) {
  const base = createChapterTwoRunFromSessionZero(sessionState)
  return {
    ...base,
    sceneId,
    rootcoin: 1,
    stats: { ...base.stats, strength: 3, defense: 1, manaPool: 5, maxMana: 5 },
  }
}

test('Chapter 2 every built-in rolled choice has a fiction-matched semantic check type', () => {
  for (const [actionId, [sceneId, expectedType]] of Object.entries(chapterTwoExpected)) {
    const state = chapterTwoState(sceneId)
    const preview = getChapterTwoActionCheckPreview(state, actionId)
    assert.equal(preview.requiresRoll, true, `${actionId} should require a roll`)
    assert.equal(preview.checkType, expectedType, actionId)
  }

  for (const sceneId of Object.values(CHAPTER_TWO_SCENES)) {
    const state = chapterTwoState(sceneId)
    for (const action of getChapterTwoAvailableActions(state)) {
      const preview = getChapterTwoActionCheckPreview(state, action.id)
      if (preview.requiresRoll) assert.ok(preview.checkType, `Missing Chapter 2 check type for ${action.id}`)
    }
  }
})

const chapterThreeExpected = {
  'stalker:stillness': [CHAPTER_THREE_SCENES.stalkerTrail, 'Stealth'],
  'stalker:break-cover': [CHAPTER_THREE_SCENES.stalkerTrail, 'Athletics'],
  'stalker:resin-shadow': [CHAPTER_THREE_SCENES.stalkerTrail, 'Stealth'],
  'stalker:mana-decoy': [CHAPTER_THREE_SCENES.stalkerTrail, 'Deception'],
  'nursery:lift-roots': [CHAPTER_THREE_SCENES.sleepingNursery, 'Athletics'],
  'nursery:thread-path': [CHAPTER_THREE_SCENES.sleepingNursery, 'Acrobatics'],
  'nursery:mana-lure': [CHAPTER_THREE_SCENES.sleepingNursery, 'Deception'],
  'siphon:read-conduits': [CHAPTER_THREE_SCENES.siphonWell, 'Investigation'],
  'siphon:brace-lines': [CHAPTER_THREE_SCENES.siphonWell, 'Athletics'],
  'siphon:mana-sense': [CHAPTER_THREE_SCENES.siphonWell, 'Investigation'],
  'draw:hold-lines': [CHAPTER_THREE_SCENES.nightlyDraw, 'Athletics'],
  'draw:ride-pulse': [CHAPTER_THREE_SCENES.nightlyDraw, 'Acrobatics'],
  'draw:cut-leech': [CHAPTER_THREE_SCENES.nightlyDraw, 'Athletics'],
  'draw:prepared-channel': [CHAPTER_THREE_SCENES.nightlyDraw, 'Defense'],
  'draw:mana-anchor': [CHAPTER_THREE_SCENES.nightlyDraw, 'Defense'],
  'decision:burn': [CHAPTER_THREE_SCENES.groveDecision, 'Survival'],
  'decision:redirect': [CHAPTER_THREE_SCENES.groveDecision, 'Investigation'],
}

function chapterThreeState(sceneId) {
  const base = createChapterThreeRunFromSessionZero(sessionState)
  return {
    ...base,
    sceneId,
    stats: { ...base.stats, strength: 3, defense: 1, manaPool: 5, maxMana: 5 },
    chapterThree: {
      ...base.chapterThree,
      waterStonesBalanced: true,
      siphonPrepared: true,
    },
  }
}

test('Chapter 3 every built-in rolled choice has a fiction-matched semantic check type', () => {
  for (const [actionId, [sceneId, expectedType]] of Object.entries(chapterThreeExpected)) {
    const state = chapterThreeState(sceneId)
    const preview = getChapterThreeActionCheckPreview(state, actionId)
    assert.equal(preview.requiresRoll, true, `${actionId} should require a roll`)
    assert.equal(preview.checkType, expectedType, actionId)
  }

  for (const sceneId of Object.values(CHAPTER_THREE_SCENES)) {
    const state = chapterThreeState(sceneId)
    for (const action of getChapterThreeAvailableActions(state)) {
      const preview = getChapterThreeActionCheckPreview(state, action.id)
      if (preview.requiresRoll) assert.ok(preview.checkType, `Missing Chapter 3 check type for ${action.id}`)
    }
  }
})
