import test from 'node:test'
import assert from 'node:assert/strict'

import {
  WEED_GOBLINS_SYSTEM_PROMPT,
  selectChapterOneScenePosture,
} from './legacyChapterOne.js'
import {
  CHAPTER_TWO_SYSTEM_PROMPT,
  selectChapterTwoScenePosture,
} from './chapterTwo.js'
import {
  CHAPTER_THREE_SYSTEM_PROMPT,
  selectChapterThreeScenePosture,
} from './chapterThree.js'

function assertArchitecture(prompt, names = []) {
  for (const required of [
    'GM TURN LOOP',
    'SCENE POSTURE',
    'NPC CAUSAL DNA',
    'BEHAVIORAL CONTRASTS',
    'RECEIVE:',
    'CHANGE:',
    'REACT:',
    'OPEN:',
    'STOP:',
    'Do not reflexively',
  ]) {
    assert.equal(prompt.includes(required), true, required)
  }
  for (const name of names) {
    assert.equal(prompt.includes(name), true, name)
  }
  assert.equal(prompt.includes('\u2014'), false, 'em dash must remain forbidden')
  assert.equal(prompt.includes('\u2013'), false, 'en dash must remain forbidden')
}

test('Chapter 1 prompt is architecture first with existing lint underneath', () => {
  assertArchitecture(WEED_GOBLINS_SYSTEM_PROMPT, [
    'Nib',
    'Goblin King',
    'Grubbin',
    'Old Tatter',
    'Old Sump',
    'ASHKA GREYROOT',
  ])
  for (const lint of [
    'one coherent messenger bubble',
    'Fragments are punctuation for dramatic effect',
    'Use "as though" at most once in a scene.',
    'Do not default to lists of three.',
    "Do not echo a player's answer as a standalone receipt",
    'Never announce a mode switch.',
    'Automatic affirmation is forbidden',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(lint), true, lint)
  }
})

test('Chapter 2 prompt uses causal DNA for named market NPCs', () => {
  assertArchitecture(CHAPTER_TWO_SYSTEM_PROMPT, [
    'Grintle Sixfinger',
    'Nettle',
    'Auntie Resin',
    'The Coin Warden',
    'ASHKA GREYROOT',
  ])
  assert.match(CHAPTER_TWO_SYSTEM_PROMPT, /Root Collector is not a social NPC/)
  assert.match(CHAPTER_TWO_SYSTEM_PROMPT, /goblin-bureaucracy/)
})

test('Chapter 3 prompt uses Withered Grove posture and named NPC causal DNA', () => {
  assertArchitecture(CHAPTER_THREE_SYSTEM_PROMPT, [
    'Bramblekin',
    'Corla the Forager',
    'Kip',
    'ASHKA GREYROOT',
  ])
  assert.match(CHAPTER_THREE_SYSTEM_PROMPT, /withered-grove: melancholy, quiet, uncanny/)
})

test('Chapter 1 scene posture selection is deterministic from authoritative state', () => {
  assert.equal(
    selectChapterOneScenePosture({
      sceneId: 'goblin-encounter',
      moment: 'action-success',
      actionId: 'goblin:guard',
      tensionLevel: 'rising',
    }),
    'combat-resolution',
  )
  assert.equal(
    selectChapterOneScenePosture({
      sceneId: 'highland-camp',
      moment: 'scene-intro',
      tensionLevel: 'high',
    }),
    'goblin-bureaucracy',
  )
  assert.equal(
    selectChapterOneScenePosture({
      sceneId: 'stash-latch',
      moment: 'scene-intro',
      tensionLevel: 'high',
    }),
    'discovery',
  )
  assert.equal(
    selectChapterOneScenePosture({
      sceneId: 'choose-route',
      moment: 'scene-intro',
      tensionLevel: 'commitment',
    }),
    'exploration',
  )
})

test('Chapter 2 scene posture selection separates market procedure, discovery, and danger', () => {
  assert.equal(
    selectChapterTwoScenePosture({
      sceneId: 'whisper-rows',
      moment: 'scene-intro',
      dangerTier: 'Bloom',
      tensionLevel: 'rising',
    }),
    'goblin-bureaucracy',
  )
  assert.equal(
    selectChapterTwoScenePosture({
      sceneId: 'root-exchange-ledger',
      moment: 'scene-intro',
      dangerTier: 'Bloom',
    }),
    'discovery',
  )
  assert.equal(
    selectChapterTwoScenePosture({
      sceneId: 'root-collector',
      moment: 'ordinary-failure',
      dangerTier: 'Wither',
    }),
    'combat-resolution',
  )
  assert.equal(
    selectChapterTwoScenePosture({
      sceneId: 'root-collector',
      moment: 'scene-intro',
      dangerTier: 'Wither',
    }),
    'immediate-danger',
  )
})

test('Chapter 3 scene posture selection preserves the grove baseline and tightens when needed', () => {
  assert.equal(
    selectChapterThreeScenePosture({
      sceneId: 'gray-verge',
      moment: 'scene-intro',
      dangerTier: 'Bloom',
      tensionLevel: 'rising',
    }),
    'withered-grove',
  )
  assert.equal(
    selectChapterThreeScenePosture({
      sceneId: 'resin-chapel-memory-rings',
      moment: 'scene-intro',
      dangerTier: 'Bloom',
    }),
    'discovery',
  )
  assert.equal(
    selectChapterThreeScenePosture({
      sceneId: 'nightly-draw',
      moment: 'scene-intro',
      dangerTier: 'Wither',
    }),
    'immediate-danger',
  )
  assert.equal(
    selectChapterThreeScenePosture({
      sceneId: 'withering-stalker',
      moment: 'action-success',
      dangerTier: 'Harvest',
    }),
    'combat-resolution',
  )
})
