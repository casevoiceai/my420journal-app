import test from 'node:test'
import assert from 'node:assert/strict'
import { STARTER_ANCESTRIES } from './content/starterLandsAncestries.js'
import { STARTER_BACKGROUNDS } from './content/starterLandsBackgrounds.js'
import { STARTER_WEAPONS, SABLE_MERROW } from './content/starterLandsArmory.js'
import { STARTER_LANDS_PROLOGUE } from './content/starterLandsPrologue.js'
import { STARTER_QUESTIONS } from './content/starterLandsQuestions.js'

test('Starter Lands contains the full browseable character foundations', () => {
  assert.deepEqual(STARTER_ANCESTRIES.map((item) => item.id), ['human', 'dwarf', 'elf', 'gnome'])
  assert.equal(STARTER_ANCESTRIES.every((item) => item.sections.length >= 6), true)
  assert.equal(STARTER_WEAPONS.length, 6)
  assert.equal(STARTER_BACKGROUNDS.length, 3)
  assert.ok(STARTER_QUESTIONS.length >= 12)
  assert.equal(SABLE_MERROW.name, 'Sable Merrow')
})

test('prologue is substantial and frames Eliza as DM without chat-bubble pacing', () => {
  const text = STARTER_LANDS_PROLOGUE.paragraphs.join(' ')
  assert.ok(text.split(/\s+/).length >= 550)
  assert.match(text, /Dungeon Master/)
  assert.match(text, /Goblin Highlands/)
  assert.match(text, /black-root/i)
  assert.doesNotMatch(text, /S\.T\.O\.N\.E\.R\./)
})

test('fantasy cannabis content does not include common instructional guidance', () => {
  const corpus = [
    STARTER_LANDS_PROLOGUE.paragraphs.join(' '),
    ...STARTER_ANCESTRIES.flatMap((item) => item.sections.map((section) => section[1])),
  ].join(' ')
  assert.doesNotMatch(corpus, /\b\d+\s?(mg|milligram|grams?|°f|°c)\b/i)
  assert.doesNotMatch(corpus, /\b(thc|cbd)\s*%/i)
  assert.doesNotMatch(corpus, /\b(inhale for|hold (the|your) breath|take \d+ (hits?|puffs?))\b/i)
})

test('V3 authored content does not name remote narration providers', () => {
  const corpus = JSON.stringify({ STARTER_LANDS_PROLOGUE, STARTER_ANCESTRIES, STARTER_WEAPONS, STARTER_BACKGROUNDS })
  assert.doesNotMatch(corpus, /anthropic|claude|workers ai|llama/i)
})
