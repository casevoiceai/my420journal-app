import test from 'node:test'
import assert from 'node:assert/strict'
import { buildHybridGuideResponse, hybridGuideInternals } from './guideHybridEngine.js'

const entries = [{
  product_name: 'Blue Dream', amount: '0.5 g', body_tags: ['Relaxed'], mind_tags: ['Clear'], mood_tags: ['Calm'],
  notes: 'Good evening flower.', created_at: '2026-10-01T18:00:00.000Z',
}]

function fakeClient(decision, generated = 'general local-model answer') {
  return {
    classify: async () => decision,
    chat: async () => generated,
  }
}

test('disabled local model preserves the current deterministic Guide', async () => {
  const result = await buildHybridGuideResponse({
    guide: 'larry', messages: [{ role: 'user', content: 'hi' }], entries, localModelEnabled: false,
  })
  assert.match(result, /Good to see you/i)
})

test('semantic character routing handles paraphrases without a new regex branch', async () => {
  const result = await buildHybridGuideResponse({
    guide: 'larry', messages: [{ role: 'user', content: 'what exactly happened to your wife anyway?' }], entries,
    localModelEnabled: true,
    modelClient: fakeClient({ route: 'character', intent: 'former_spouse_summary', confidence: 0.95 }),
  })
  assert.match(result, /married a little over twenty years/i)
})

test('semantic journal routing still answers only from local journal data', async () => {
  const result = await buildHybridGuideResponse({
    guide: 'larry', messages: [{ role: 'user', content: 'did that blue one chill me out?' }], entries,
    localModelEnabled: true,
    modelClient: fakeClient({ route: 'journal', intent: 'product_effects', entity: 'Blue Dream', confidence: 0.93 }),
  })
  assert.match(result, /Blue Dream.*Relaxed|Relaxed.*Blue Dream/i)
})

test('semantic cannabis routing uses the reviewed B layer instead of model-generated facts', async () => {
  const result = await buildHybridGuideResponse({
    guide: 'larry', messages: [{ role: 'user', content: 'where did blue dream come from originally?' }], entries,
    localModelEnabled: true,
    modelClient: fakeClient({ route: 'cannabis', intent: 'cannabis_lineage', entity: 'Blue Dream', confidence: 0.9 }),
  })
  assert.match(result, /Blueberry|Haze|Santa Cruz/i)
})

test('general conversation can use the local model in character', async () => {
  const result = await buildHybridGuideResponse({
    guide: 'larry', messages: [{ role: 'user', content: 'why do cats knock things off tables?' }], entries,
    localModelEnabled: true,
    modelClient: fakeClient({ route: 'general', intent: 'general_chat', confidence: 0.98 }, 'Because cats are tiny unionized gravity inspectors.'),
  })
  assert.equal(result, 'Because cats are tiny unionized gravity inspectors.')
})

test('a mistaken journal classification cannot hijack ordinary brand conversation', async () => {
  const result = await buildHybridGuideResponse({
    guide: 'larry', messages: [{ role: 'user', content: "You're old. You remember the 1980s soda wars? Coke or Pepsi?" }], entries,
    localModelEnabled: true,
    modelClient: fakeClient({ route: 'journal', intent: 'product_summary', entity: 'Coke or Pepsi', confidence: 0.92 }, 'Pepsi if I am picking one, but I remember both sides treating it like a national emergency.'),
  })
  assert.match(result, /Pepsi|Coke/i)
  assert.doesNotMatch(result, /product from your journal/i)
})

test('explicit journal wording may still ask about an unrecorded product', async () => {
  const result = await buildHybridGuideResponse({
    guide: 'larry', messages: [{ role: 'user', content: 'what did I record about Coke?' }], entries,
    localModelEnabled: true,
    modelClient: fakeClient({ route: 'journal', intent: 'product_summary', entity: 'Coke', confidence: 0.92 }, 'wrong general answer'),
  })
  assert.match(result, /journal/i)
  assert.notEqual(result, 'wrong general answer')
})

test('ordinary Guide preferences stay conversational instead of becoming rigid character facts', async () => {
  const result = await buildHybridGuideResponse({
    guide: 'larry', messages: [{ role: 'user', content: 'Coke or Pepsi?' }], entries,
    localModelEnabled: true,
    modelClient: fakeClient({ route: 'character', intent: 'topic_preference', entity: 'Coke or Pepsi', confidence: 0.96 }, 'Coke, if you are making me pick. Pepsi had its moments.'),
  })
  assert.equal(result, 'Coke, if you are making me pick. Pepsi had its moments.')
})

test('medical and product-choice boundaries bypass the local model', async () => {
  let calls = 0
  const client = { classify: async () => { calls += 1; return {} }, chat: async () => { calls += 1; return 'bad' } }
  const result = await buildHybridGuideResponse({
    guide: 'larry', messages: [{ role: 'user', content: 'what dose should I use?' }], entries,
    localModelEnabled: true, modelClient: client,
  })
  assert.match(result, /can't diagnose|dose/i)
  assert.equal(calls, 0)
})
test('a bad-day emotional turn bypasses D and drops the old topic', async () => {
  let calls = 0
  const client = {
    classify: async () => { calls += 1; return { route: 'general', confidence: 0.9 } },
    chat: async () => { calls += 1; return 'Pepsi callback that should never appear.' },
  }
  const messages = [
    { role: 'user', content: 'Coke or Pepsi?' },
    { role: 'assistant', content: 'Coke, if you make me pick.' },
    { role: 'user', content: 'I had a really shitty day today.' },
  ]
  const result = await buildHybridGuideResponse({ guide: 'larry', messages, entries, localModelEnabled: true, modelClient: client })
  assert.match(result, /rough day/i)
  assert.match(result, /vent|tell me/i)
  assert.doesNotMatch(result, /coke|pepsi|soda|deep breath|tomorrow/i)
  assert.equal(calls, 0)
})

test('moderate distress bypasses D for a direct current-state check', async () => {
  let calls = 0
  const client = { classify: async () => { calls += 1 }, chat: async () => { calls += 1 } }
  const result = await buildHybridGuideResponse({
    guide: 'larry', messages: [{ role: 'user', content: 'I am shaking and really scared.' }], entries,
    localModelEnabled: true, modelClient: client,
  })
  assert.match(result, /right now|now/i)
  assert.equal(calls, 0)
})
test('explicit high-risk language bypasses D and character roleplay', async () => {
  let calls = 0
  const client = { classify: async () => { calls += 1 }, chat: async () => { calls += 1 } }
  const result = await buildHybridGuideResponse({
    guide: 'larry', messages: [{ role: 'user', content: 'I want to kill myself.' }], entries,
    localModelEnabled: true, modelClient: client,
  })
  assert.match(result, /local AI Guide/i)
  assert.match(result, /988/)
  assert.match(result, /911/)
  assert.doesNotMatch(result, /records|notebooks|garden/i)
  assert.equal(calls, 0)
})
test('ongoing emotional thread uses the instant support path and bypasses local-model inference', async () => {
  let classifyCalls = 0
  let chatCalls = 0
  const client = {
    classify: async () => { classifyCalls += 1; return { route: 'general', confidence: 0.9 } },
    chat: async () => { chatCalls += 1; return 'This should never be used for the support thread.' },
  }
  const messages = [
    { role: 'user', content: "I'm anxious about my meeting tomorrow" },
    { role: 'assistant', content: 'What part of the meeting has you worried?' },
    { role: 'user', content: 'My boss embarrassed me in front of everybody.' },
    { role: 'assistant', content: 'That would get under my skin too. What happened?' },
    { role: 'user', content: 'what should I do?' },
  ]
  const result = await buildHybridGuideResponse({ guide: 'larry', messages, entries, localModelEnabled: true, modelClient: client })
  assert.match(result, /clear the air|push back/i)
  assert.equal(classifyCalls, 0)
  assert.equal(chatCalls, 0)
})

test('clear factual topic shift exits emotional mode', async () => {
  let classifyCalls = 0
  const client = {
    classify: async () => { classifyCalls += 1; return { route: 'general', intent: 'general_chat', confidence: 0.95 } },
    chat: async () => 'Napoleon was a French military and political leader.',
  }
  const messages = [
    { role: 'user', content: 'I had a really shitty day.' },
    { role: 'assistant', content: 'Ah, hell. What happened?' },
    { role: 'user', content: 'Who was Napoleon?' },
  ]
  const result = await buildHybridGuideResponse({ guide: 'larry', messages, entries, localModelEnabled: true, modelClient: client })
  assert.match(result, /Napoleon/i)
  assert.equal(classifyCalls, 0)
})


test('ordinary general chat skips the semantic classifier', () => {
  assert.equal(hybridGuideInternals.needsSemanticClassification('Who was Napoleon?', entries), false)
  assert.equal(hybridGuideInternals.needsSemanticClassification('Coke or Pepsi?', entries), false)
})

test('journal and cannabis language still uses controlled semantic routing', () => {
  assert.equal(hybridGuideInternals.needsSemanticClassification('What did I record about Red Berries?', entries), true)
  assert.equal(hybridGuideInternals.needsSemanticClassification('What is THC?', entries), true)
})