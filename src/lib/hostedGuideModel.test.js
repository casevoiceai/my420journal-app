import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isHostedGuideEnabled,
  setHostedGuideEnabled,
  parseGeneratedGuideTurn,
  classifyWithHostedGuideModel,
  chatWithHostedGuideModel,
} from './hostedGuideModel.js'

class MemoryStorage {
  constructor() { this.map = new Map() }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null }
  setItem(key, value) { this.map.set(key, String(value)) }
}

test('hosted Guide conversation requires a separate explicit opt-in', () => {
  const storage = new MemoryStorage()
  storage.setItem('my420journal_local_v1:local_guide_model_enabled', 'true')
  assert.equal(isHostedGuideEnabled(storage), false)
  assert.equal(setHostedGuideEnabled(true, storage), true)
  assert.equal(isHostedGuideEnabled(storage), true)
  setHostedGuideEnabled(false, storage)
  assert.equal(isHostedGuideEnabled(storage), false)
})

test('hosted Guide parser keeps branch metadata out of visible reply', () => {
  const turn = parseGeneratedGuideTurn('Here is the actual reply.\n[[BRANCHES:["That is weird","Keep going"]]]')
  assert.equal(turn.content, 'Here is the actual reply.')
  assert.deepEqual(turn.suggestions, ['That is weird', 'Keep going'])
})

test('hosted Guide chat sends only the supplied Guide packet to same-origin API', async () => {
  const originalFetch = globalThis.fetch
  let captured
  globalThis.fetch = async (url, options) => {
    captured = { url, options, body: JSON.parse(options.body) }
    return new Response(JSON.stringify({ content: 'Sunny answer.\n[[BRANCHES:[]]]' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  try {
    const result = await chatWithHostedGuideModel({
      guide: 'sunny',
      messages: [{ role: 'user', content: 'Talk to me.' }],
      contextFacts: ['Only this fact is selected locally.'],
    })
    assert.match(result, /Sunny answer/)
    assert.equal(captured.url, '/api/guide-conversation')
    assert.equal(captured.options.credentials, 'same-origin')
    assert.equal(captured.body.mode, 'chat')
    assert.deepEqual(Object.keys(captured.body).sort(), ['contextFacts', 'guide', 'lowEffortMode', 'messages', 'mode'].sort())
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('hosted classifier normalizes the server decision', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({
    decision: { route: 'journal', intent: 'product_summary', entity: 'Red Berries', secondary_entity: null, confidence: 0.9 },
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  try {
    const decision = await classifyWithHostedGuideModel({
      guide: 'larry',
      messages: [{ role: 'user', content: 'What did I record about Red Berries?' }],
    })
    assert.equal(decision.route, 'journal')
    assert.equal(decision.entity, 'Red Berries')
    assert.equal(decision.confidence, 0.9)
  } finally {
    globalThis.fetch = originalFetch
  }
})
