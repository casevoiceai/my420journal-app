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
  assert.match(result, /I am with you/i)
  assert.match(result, /journal|logging something new/i)
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

test('cannabis question opener gets a natural conversational bridge', () => {
  const result = reply('I have a question about weed.', 'mary')
  assert.equal(result, 'Of course. What would you like to know about weed?')
})

test('unsupported general cannabis question after bridge explains the boundary', () => {
  const history = [{ role: 'assistant', content: 'Of course. What is your question?' }]
  const result = reply('What is the difference between indica and sativa?', 'mary', history)
  assert.match(result, /do not have general cannabis facts built into the Guide yet/i)
  assert.match(result, /your journal/i)
})

test('question about an arbitrary topic starts a real dialogue', () => {
  assert.equal(
    reply('i have question about Blue Dream', 'larry'),
    'Sure. What do you want to know about Blue Dream?'
  )
})

test('unknown product topic survives into a follow-up question', () => {
  const history = [
    { role: 'user', content: 'i have question about Blue Dream' },
    { role: 'assistant', content: 'Sure. What do you want to know about Blue Dream?' },
  ]
  assert.equal(reply('did I like it?', 'larry', history), 'I do not see Blue Dream in your local journal yet.')
})

test('known product topic survives into natural pronoun follow-ups', () => {
  const history = [
    { role: 'user', content: 'I have a question about Red Berries' },
    { role: 'assistant', content: 'Sure. What do you want to know about Red Berries?' },
  ]
  const result = reply('how did it make me feel?', 'larry', history)
  for (const effect of ['Relaxed', 'Tingly', 'Clear', 'Calm']) assert.match(result, new RegExp(effect, 'i'))
})

test('known topic supports count, date, amount, and note follow-ups', () => {
  const history = [
    { role: 'user', content: 'question about Red Berries' },
    { role: 'assistant', content: 'Sure. What do you want to know about Red Berries?' },
  ]
  assert.match(reply('how many times did I use it?', 'larry', history), /1 entry for Red Berries/i)
  assert.match(reply('when did I last use it?', 'larry', history), /Oct 1, 2026/i)
  assert.match(reply('how much did I use?', 'larry', history), /0\.4 g/)
  assert.match(reply('what did I write about it?', 'larry', history), /Good body effect/i)
})

test('unsupported general fact question keeps the remembered topic', () => {
  const history = [
    { role: 'user', content: 'I have a question about Blue Dream' },
    { role: 'assistant', content: 'Sure. What do you want to know about Blue Dream?' },
  ]
  const result = reply('what kind of strain is it?', 'larry', history)
  assert.match(result, /Blue Dream/i)
  assert.match(result, /do not have general cannabis facts built into the Guide yet/i)
})

test('unrecognized conversation gets a guide-specific clarification, not a command menu', () => {
  const result = reply('so anyway that was weird', 'larry')
  assert.equal(result, 'I am with you. Is this about something in your journal, or are we logging something new?')
})
