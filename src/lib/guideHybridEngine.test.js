import test from 'node:test'
import assert from 'node:assert/strict'
import { buildHybridGuideResponse } from './guideHybridEngine.js'

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
