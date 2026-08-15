import test from 'node:test'
import assert from 'node:assert/strict'

import {
  generateChapterTwoNarration,
  validateChapterTwoNarration,
} from './weedGoblinsChapterTwoNarration.js'

function state() {
  return {
    chapterNumber: 2,
    sceneId: 'hollow-market:whisper-rows',
    trouble: 0,
    stats: { manaPool: 2 },
    rootcoin: 1,
    wound: 'None',
    inventory: [],
    narrationTier: 'normal',
    chapterTwo: {
      marketState: 'operational',
      entryPrice: 'coin',
      recognizedStall: 'mist-cartridge counter',
      counterfeitItem: 'brass mist cartridge',
    },
  }
}

test('Chapter 2 narration never transmits raw typed gameplay text to the narration service', async () => {
  let sent = null
  const rawPlayerAction = 'I go to Restore Scranton on August 9 and spend $45 because my pain is worse'
  const result = await generateChapterTwoNarration({
    state: state(),
    hook: {
      moment: 'player-action-attempt',
      outcome: 'attempt',
      actionId: 'chapter-two:free-text:defense',
      fallbackText: 'You use position to watch the route without exposing yourself.',
      playerAction: rawPlayerAction,
      interpretedAction: 'use timing, observation, movement, or leverage to change the current obstacle',
      requiresRoll: true,
    },
    fetchImpl: async (_url, options) => {
      sent = JSON.parse(options.body)
      return new Response(JSON.stringify({ text: 'You shift above the stalls until the route opens beneath you.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    },
  })
  assert.equal(result.source, 'ai')
  assert.ok(sent)
  assert.equal(sent.playerAction, '')
  assert.equal(JSON.stringify(sent).includes('Restore Scranton'), false)
  assert.equal(JSON.stringify(sent).includes('August 9'), false)
  assert.equal(JSON.stringify(sent).includes('$45'), false)
  assert.equal(JSON.stringify(sent).includes('pain'), false)
  assert.match(sent.interpretedAction, /timing|observation|movement|leverage/)
})

test('Chapter 2 narration validation rejects privacy/safety and output-contract violations', () => {
  assert.equal(validateChapterTwoNarration('A clean market line.').valid, true)
  assert.equal(validateChapterTwoNarration('This is amazing!').valid, false)
  assert.equal(validateChapterTwoNarration('The treatment cures symptoms.').valid, false)
  assert.equal(validateChapterTwoNarration('A Restore Scranton clerk appears.', { blockedRealNames: ['Restore Scranton'] }).valid, false)
})
