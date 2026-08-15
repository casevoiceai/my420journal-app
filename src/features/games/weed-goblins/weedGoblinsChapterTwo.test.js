import test from 'node:test'
import assert from 'node:assert/strict'

import {
  CHAPTER_TWO,
  CHAPTER_TWO_CORE_BEATS,
  CHAPTER_TWO_LOCATIONS,
  CHAPTER_TWO_MAJOR_BRANCHES,
  CHAPTER_TWO_MARKET_STATES,
  CHAPTER_TWO_NPCS,
  CHAPTER_TWO_PUZZLES,
  CHAPTER_TWO_REWARDS,
  CHAPTER_TWO_THREATS,
} from './weedGoblinsChapterTwo.js'

test('Chapter 2 foundation matches the canonical Hollow Market identity', () => {
  assert.equal(CHAPTER_TWO.number, 2)
  assert.equal(CHAPTER_TWO.title, 'The Hollow Market')
  assert.equal(CHAPTER_TWO.adventureId, 'hollow-market-session-1')
  assert.match(CHAPTER_TWO.corePremise, /three smokeless lanterns/)
  assert.match(CHAPTER_TWO.corePremise, /harvest tithe/)
  assert.match(CHAPTER_TWO.corePremise, /living black-root receipts/)
  assert.match(CHAPTER_TWO.chapterEnding, /Withered Grove/)
})

test('Chapter 2 locks the four canonical market locations', () => {
  assert.deepEqual(
    Object.values(CHAPTER_TWO_LOCATIONS).map((location) => location.name),
    ['Lantern Mouth', 'Whisper Rows', 'Root Exchange', 'Drain Gate'],
  )
})

test('Chapter 2 locks its canonical NPCs and Root Collector threat', () => {
  assert.deepEqual(
    Object.values(CHAPTER_TWO_NPCS).map((npc) => npc.name),
    ['Grintle Sixfinger', 'Nettle', 'Auntie Resin', 'The Coin Warden'],
  )
  assert.equal(CHAPTER_TWO_THREATS.rootCollector.name, 'Root Collector')
  assert.equal(CHAPTER_TWO_THREATS.rootCollector.manaDots, 4)
  assert.match(CHAPTER_TWO_THREATS.rootCollector.description, /does not negotiate/)
})

test('Chapter 2 locks its two canonical puzzles', () => {
  assert.equal(CHAPTER_TWO_PUZZLES.lanternOrder.name, 'correct lantern-lighting order')
  assert.equal(CHAPTER_TWO_PUZZLES.lanternOrder.locationId, 'lantern-mouth')
  assert.equal(CHAPTER_TWO_PUZZLES.livingLedger.name, 'living ledger that rearranges itself when lied to')
  assert.equal(CHAPTER_TWO_PUZZLES.livingLedger.locationId, 'root-exchange')
})

test('Chapter 2 preserves the canonical market-state branches and rewards', () => {
  assert.deepEqual(CHAPTER_TWO_MARKET_STATES, [
    'operational',
    'exposed',
    'burned',
    'regulated',
    'secretly-controlled-by-player',
  ])
  assert.deepEqual(Object.values(CHAPTER_TWO_MAJOR_BRANCHES), [
    'keep the market operational for a recurring supplier',
    'expose the tithe and trigger a revolt',
    'burn or flood the market and scatter its criminals elsewhere',
    'quietly take one trade route for later leverage',
  ])
  assert.deepEqual(Object.values(CHAPTER_TWO_REWARDS), [
    'Harvest Ledger',
    'Market Veil',
    'favor contract',
    "Sixfinger's Marker",
  ])
})

test('Chapter 2 core beats stay investigation and commerce focused', () => {
  assert.deepEqual(CHAPTER_TWO_CORE_BEATS, [
    'pay the entry price in coin, memory, or favor',
    'follow the tribute chain through merchants and living receipts',
    "survive the Root Collector's early arrival",
    'decide what to do with the ledger',
    'escape or settle with the Coin Warden',
  ])
})
