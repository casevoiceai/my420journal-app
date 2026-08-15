import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createWeedGoblinsChatSession,
  getWeedGoblinsQuickReplies,
  prepareWeedGoblinsFreeTextTurn,
  prepareWeedGoblinsQuickReplyTurn,
  resolveWeedGoblinsPreparedMechanics,
  resolveWeedGoblinsTransitionMessages,
  selectWeedGoblinsChatChoice,
  submitWeedGoblinsSessionText,
} from './weedGoblinsChatController.js'
import { CHAPTER_TWO_SCENES } from './weedGoblinsChapterTwoRuntime.js'

function chapterOneRuns(count) {
  return Array.from({ length: count }, (_, index) => ({
    adventureId: 'goblin-highlands-session-1',
    seed: `chapter-one-${index}`,
    ending: 'recovery',
  }))
}

function staticNarration({ hook }) {
  return Promise.resolve({ text: hook.fallbackText, source: 'test' })
}

async function targetSession() {
  return createWeedGoblinsChatSession({
    seed: 'chapter-two-ui',
    previousRuns: chapterOneRuns(5),
    priorCompletedRunCount: 5,
    journalSnapshot: { productCategories: ['Vape'] },
    generateNarration: staticNarration,
  })
}

function choose(state, id) {
  return selectWeedGoblinsChatChoice(state, { id }).after
}

async function playableChapterTwoState() {
  let { state } = await targetSession()
  state = choose(state, 'session:continue')
  state = submitWeedGoblinsSessionText(state, 'Fenna Duskrow').after
  state = choose(state, 'session:race:human')
  state = choose(state, 'session:weapon:sword')
  state = choose(state, 'background:tracker')
  state = choose(state, 'session:pronoun:they')
  state = choose(state, 'session:look:tall-weathered')
  return state
}

async function whisperRowsState() {
  let state = await playableChapterTwoState()
  state = choose(state, 'lantern:moth-root-coin')
  state = choose(state, 'entry:coin')
  return state
}

test('four Chapter 1 runs do not expose Chapter 2 early', async () => {
  const session = await createWeedGoblinsChatSession({
    seed: 'still-chapter-one',
    previousRuns: chapterOneRuns(4),
    priorCompletedRunCount: 4,
  })
  assert.equal(session.state.targetChapterNumber, undefined)
  assert.equal(session.state.adventureId, 'goblin-highlands-session-1')
})

test('five completed Chapter 1 runs open Hollow Market Session Zero instead of replaying the Highlands premise', async () => {
  const session = await targetSession()
  assert.equal(session.state.targetChapterNumber, 2)
  assert.equal(session.state.adventureId, 'goblin-highlands-session-1')
  assert.match(session.messages.map((message) => message.text).join(' '), /Hollow Market/)
  assert.equal(session.messages.some((message) => /Goblin King stole/i.test(message.text)), false)
  assert.equal(session.state.chapterTwoPersonalization.recognizedStall, 'mist-cartridge counter')
})

test('completing Session Zero converts directly into the playable Lantern Mouth state', async () => {
  const state = await playableChapterTwoState()
  assert.equal(state.chapterNumber, 2)
  assert.equal(state.adventureId, 'hollow-market-session-1')
  assert.equal(state.sceneId, CHAPTER_TWO_SCENES.lanternOrder)
  assert.equal(state.currentRoomId, 'lantern-mouth')
  assert.equal(getWeedGoblinsQuickReplies(state).length, 4)
})

test('Session Zero to Chapter 2 transition produces Hollow Market opening narration', async () => {
  let session = await targetSession()
  let state = choose(session.state, 'session:continue')
  state = submitWeedGoblinsSessionText(state, 'Fenna Duskrow').after
  state = choose(state, 'session:race:human')
  state = choose(state, 'session:weapon:sword')
  state = choose(state, 'background:tracker')
  state = choose(state, 'session:pronoun:they')
  const before = state
  const after = choose(state, 'session:look:tall-weathered')
  const messages = await resolveWeedGoblinsTransitionMessages({ before, after, generateNarration: staticNarration })
  assert.equal(after.chapterNumber, 2)
  assert.match(messages.map((message) => message.text).join(' '), /smokeless lanterns|Hollow Market/i)
  assert.equal(messages.some((message) => /Goblin King/i.test(message.text)), false)
})

test('Chapter 2 built-in checks retain explicit setup then Roll D20 before mechanics resolve', async () => {
  let state = await whisperRowsState()
  state = { ...state, rngState: 15360 }
  const action = getWeedGoblinsQuickReplies(state).find((choice) => choice.id === 'trace:sixfinger')
  const prepared = await prepareWeedGoblinsQuickReplyTurn({ state, action })
  assert.equal(prepared.requiresRoll, true)
  assert.equal(prepared.before.sceneId, CHAPTER_TWO_SCENES.whisperRows)
  assert.equal(prepared.rollTriggerMessage.kind, 'roll-trigger')
  assert.equal(prepared.setupMessage.kind, 'check-setup')
  assert.match(prepared.setupMessage.text, /Bloom danger/i)
  assert.match(prepared.setupMessage.text, /DC 12/)

  const mechanics = resolveWeedGoblinsPreparedMechanics({ preparedTurn: prepared })
  assert.equal(mechanics.rollResultMessage.kind, 'roll-result')
  assert.equal(mechanics.checkEvent.roll, 20)
  assert.equal(mechanics.after.chapterTwo.merchantClues.includes('grintle-sixfinger'), true)
})

test('unexpected Chapter 2 free text is deterministically adjudicated without letting narration own mechanics', async () => {
  let state = await whisperRowsState()
  state = { ...state, rngState: 15360 }
  const prepared = await prepareWeedGoblinsFreeTextTurn({
    state,
    playerAction: 'I balance on the awning and watch for the green-cloaked route from above',
    generateNarration: staticNarration,
  })
  assert.equal(prepared.requiresRoll, true)
  assert.equal(prepared.plan.kind, 'custom-check')
  assert.equal(prepared.plan.check.dangerTier, 'bloom')
  assert.equal(prepared.plan.check.stat, 'defense')

  const mechanics = resolveWeedGoblinsPreparedMechanics({ preparedTurn: prepared })
  assert.equal(mechanics.checkEvent.roll, 20)
  assert.equal(mechanics.checkEvent.success, true)
  assert.equal(mechanics.after.chapterTwo.merchantClues.includes('player-method'), true)
})
