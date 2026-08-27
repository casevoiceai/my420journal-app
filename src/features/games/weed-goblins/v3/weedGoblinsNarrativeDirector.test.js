import test from 'node:test'
import assert from 'node:assert/strict'
import { STARTER_QUESTIONS } from './content/starterLandsQuestions.js'
import { departureCallback, selectStarterQuestions } from './weedGoblinsNarrativeDirector.js'

test('question selection is deterministic and includes ancestry-aware material', () => {
  const a = selectStarterQuestions({ questions: STARTER_QUESTIONS, ancestryId: 'dwarf', seed: 'same', count: 3 }).map((q) => q.id)
  const b = selectStarterQuestions({ questions: STARTER_QUESTIONS, ancestryId: 'dwarf', seed: 'same', count: 3 }).map((q) => q.id)
  assert.deepEqual(a, b)
  assert.equal(a.length, 3)
  assert.ok(a.includes('q:dwarf-expectation'))
  assert.equal(new Set(a).size, 3)
})

test('starter selection excludes later-sensitive and later-pool questions', () => {
  const selected = selectStarterQuestions({ questions: STARTER_QUESTIONS, ancestryId: 'human', seed: 'filter', count: 3 })
  assert.equal(selected.some((q) => q.tags.includes('later-pool') || q.tags.includes('later-sensitive')), false)
})

test('departure callback remembers relevant established facts without inventing them', () => {
  const state = {
    player: {
      weaponId: 'battle-axe',
      characterFacts: [{ key: 'keepsake_type', value: 'spoon', label: 'A spoon I refuse to explain.' }],
    },
  }
  const lines = departureCallback({ state }).join(' ')
  assert.match(lines, /architectural disagreement/i)
  assert.match(lines, /spoon/i)
  assert.doesNotMatch(lines, /come back alive/i)
})
