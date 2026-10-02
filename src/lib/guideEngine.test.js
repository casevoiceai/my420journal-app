import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGuideResponse } from './guideEngine.js'

const entries = [
  {
    product_name: 'Strawberry Cream',
    category: 'Flower',
    amount: '0.5 g',
    body_tags: ['Tired'],
    mind_tags: ['Foggy'],
    mood_tags: [],
    notes: 'Hardly any taste and not much body effect.',
    created_at: '2026-09-30T18:00:00.000Z',
  },
  {
    product_name: 'Red Berries',
    category: 'Flower',
    amount: '0.4 g',
    body_tags: ['Relaxed', 'Tingly'],
    mind_tags: ['Clear'],
    mood_tags: ['Calm'],
    notes: 'Good body effect.',
    created_at: '2026-10-01T18:00:00.000Z',
  },
]

function reply(text, guide = 'larry', history = []) {
  return buildGuideResponse({ guide, entries, messages: [...history, { role: 'user', content: text }] })
}

test('Lucky Larry answers a social check-in in character', () => {
  assert.match(reply('how are you today?'), /Still kicking/)
  assert.doesNotMatch(reply('how are you today?'), /latest note as/i)
})

test('greeting does not echo user input', () => {
  const result = reply('hi')
  assert.match(result, /Good to see you/)
  assert.doesNotMatch(result, /\bhi\b.*latest/i)
})

test('help describes bounded guide capabilities', () => {
  const result = reply('what can you do?')
  assert.match(result, /log an experience/i)
  assert.match(result, /compare two products/i)
})

test('recommendation requests are refused', () => {
  const result = reply('what should I buy next?')
  assert.match(result, /don't choose products/i)
})

test('medical requests are refused', () => {
  const result = reply('what dose should I use?')
  assert.match(result, /can't diagnose, prescribe, or tell you what dose/i)
})

test('looks up an exact product from local journal data', () => {
  const result = reply('what did I think of Strawberry Cream?')
  assert.match(result, /1 entry for Strawberry Cream/)
  assert.match(result, /Hardly any taste/)
})

test('compares two products without recommending one', () => {
  const result = reply('compare Strawberry Cream vs Red Berries')
  assert.match(result, /Strawberry Cream: 1 entry/)
  assert.match(result, /Red Berries: 1 entry/)
  assert.match(result, /not a recommendation/i)
})

test('summarizes latest entry', () => {
  const result = reply('show me my latest entry')
  assert.match(result, /latest entry is Red Berries/i)
  assert.match(result, /Good body effect/)
})

test('counts local entries', () => {
  assert.equal(reply('how many entries do I have?'), 'You have 2 entries in your local journal.')
})

test('recognizes a new product logging statement', () => {
  const result = reply('I tried Blue Dream and it made me sleepy')
  assert.match(result, /Blue Dream/)
  assert.match(result, /What happened with it/)
})

test('recognizes effect language without pretending to infer more', () => {
  const result = reply('I felt relaxed and clear')
  assert.match(result, /Relaxed, Clear/)
  assert.doesNotMatch(result, /recommend/i)
})

test('uses recent product context for follow-up lookup', () => {
  const history = [
    { role: 'user', content: 'I was looking at Red Berries' },
    { role: 'assistant', content: 'What do you want to know about it?' },
  ]
  const result = reply('what did I record about it?', 'larry', history)
  assert.match(result, /1 entry for Red Berries/)
})

test('falls back to bounded capabilities instead of echoing', () => {
  const result = reply('purple elephants on Tuesday')
  assert.match(result, /not sure what you want me to do/i)
  assert.doesNotMatch(result, /purple elephants/i)
})

test('other guides share the engine but retain distinct voice', () => {
  assert.match(reply('how are you?', 'sunny'), /I am good/)
  assert.match(reply('how are you?', 'herb'), /Doing well/)
  assert.match(reply('how are you?', 'mary'), /doing well/)
})

test('short check-in answer continues naturally', () => {
  const history = [{ role: 'assistant', content: 'Still kicking. How are you doing?' }]
  assert.match(reply('good', 'larry', history), /Good\. What are we doing today/i)
})

test('known product name wins over extra category wording', () => {
  const result = reply('I got Red Berries flower')
  assert.match(result, /Alright\. Red Berries\./)
  assert.doesNotMatch(result, /Red Berries flower/)
})
