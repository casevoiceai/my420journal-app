import test from 'node:test'
import assert from 'node:assert/strict'
import { localGuideModelCapability, isLocalGuideModelEnabled, setLocalGuideModelEnabled, LOCAL_GUIDE_MODEL, localGuideModelInternals, parseGeneratedGuideTurn } from './localGuideModel.js'
import { GUIDE_CHARACTERS } from './guideCharacters.js'

function fakeStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
  }
}

function browserScope({ gpu = false } = {}) {
  return {
    window: {},
    navigator: { ...(gpu ? { gpu: {} } : {}) },
    WebAssembly: {},
    Worker: function Worker() {},
  }
}

test('local Guide model supports CPU/WASM without WebGPU', () => {
  assert.equal(localGuideModelCapability({}).supported, false)
  const cpu = localGuideModelCapability(browserScope())
  assert.equal(cpu.supported, true)
  assert.equal(cpu.backend, 'wasm-cpu')
  const gpu = localGuideModelCapability(browserScope({ gpu: true }))
  assert.equal(gpu.supported, true)
  assert.equal(gpu.webgpu, true)
})

test('local Guide model stays disabled until explicit local opt-in', () => {
  const storage = fakeStorage()
  assert.equal(isLocalGuideModelEnabled(storage), false)
  assert.equal(setLocalGuideModelEnabled(true, storage), true)
  assert.equal(isLocalGuideModelEnabled(storage), true)
  setLocalGuideModelEnabled(false, storage)
  assert.equal(isLocalGuideModelEnabled(storage), false)
})

test('prototype model metadata keeps the download visible to UI', () => {
  assert.equal(LOCAL_GUIDE_MODEL.id, 'SmolLM2-1.7B-Instruct-Q4_K_M')
  assert.equal(LOCAL_GUIDE_MODEL.runtime, 'wllama')
  assert.equal(LOCAL_GUIDE_MODEL.repo, 'ngxson/SmolLM2-1.7B-Instruct-Q4_K_M-GGUF')
  assert.equal(LOCAL_GUIDE_MODEL.file, 'smollm2-1.7b-instruct-q4_k_m.gguf')
  assert.ok(LOCAL_GUIDE_MODEL.approximateDownloadMB >= 1000)
  assert.equal(LOCAL_GUIDE_MODEL.license, 'Apache-2.0')
})


test('Larry prompt carries voice, soft-fiction permission, and a correct 1980s timeline anchor', () => {
  const prompt = localGuideModelInternals.characterPrompt(GUIDE_CHARACTERS.larry, [{ role: 'user', content: 'You remember the 1980s soda wars?' }])
  assert.match(prompt, /VOICE SIGNATURE: Older storyteller/i)
  assert.match(prompt, /SOFT-FICTION RULE/i)
  assert.match(prompt, /ENTITY-SEPARATION RULE/i)
  assert.match(prompt, /DIRECT-REQUEST RULE/i)
  assert.match(prompt, /roughly 21 to 31/i)
})

test('logic guard rejects impossible decade age claims', () => {
  const messages = [{ role: 'user', content: 'You remember the 1980s soda wars?' }]
  const reason = localGuideModelInternals.generatedReplyViolation(GUIDE_CHARACTERS.larry, messages, 'I was a teenager then, buying records every weekend.')
  assert.match(reason, /timeline contradiction/i)
})

test('logic guard rejects turning a user brand into an invented workplace', () => {
  const messages = [{ role: 'user', content: 'Coke or Pepsi?' }]
  const reason = localGuideModelInternals.generatedReplyViolation(GUIDE_CHARACTERS.larry, messages, 'I worked at a Pepsi record store back then.')
  assert.match(reason, /invented biography/i)
})

test('logic guard permits plausible low-stakes color that respects hard canon', () => {
  const messages = [{ role: 'user', content: 'You remember the 1980s soda wars? Coke or Pepsi?' }]
  const reply = 'Coke, if you are making me pick. I remember those ads being everywhere. I was already working at the print shop by then, and people argued about cola like it was a blood oath.'
  assert.equal(localGuideModelInternals.generatedReplyViolation(GUIDE_CHARACTERS.larry, messages, reply), null)
})

test('Guide prompt treats emotional turns as listening, not forced optimism', () => {
  const prompt = localGuideModelInternals.characterPrompt(GUIDE_CHARACTERS.larry, [
    { role: 'user', content: 'I had a really shitty day today.' },
  ])
  assert.match(prompt, /listen before fixing/i)
  assert.match(prompt, /do not revive an unrelated earlier topic/i)
  assert.match(prompt, /tomorrow is a new day/i)
  assert.match(prompt, /do not invent a matching hardship/i)
})
test('support mode rejects canned reassurance and invented blame from the live failure', () => {
  const messages = [
    { role: 'user', content: "I'm anxious about my meeting tomorrow" },
    { role: 'assistant', content: 'What part has you worried?' },
    { role: 'user', content: 'My boss embarrassed me in front of everybody.' },
    { role: 'user', content: 'what should I do?' },
  ]
  const bad = 'Take a deep breath, focus on your goal, and remember that everyone makes mistakes. You can learn from this and grow.'
  const reason = localGuideModelInternals.generatedReplyViolation(GUIDE_CHARACTERS.larry, messages, bad, { supportMode: true })
  assert.match(reason, /canned reassurance|invented blame/i)
})

test('support mode accepts grounded advice that keeps the conversation open', () => {
  const messages = [
    { role: 'user', content: 'My boss embarrassed me in front of everybody.' },
    { role: 'user', content: 'what should I do?' },
  ]
  const good = 'Depends what you want out of it. Do you want to clear the air, push back, or just make sure it does not happen again?'
  assert.equal(localGuideModelInternals.generatedReplyViolation(GUIDE_CHARACTERS.larry, messages, good, { supportMode: true }), null)
})

test('low-effort mode tells D to use short one-step replies', () => {
  const prompt = localGuideModelInternals.characterPrompt(GUIDE_CHARACTERS.larry, [
    { role: 'user', content: "I'm too high." },
  ], { lowEffortMode: true })
  assert.match(prompt, /LOW-EFFORT MODE ACTIVE/i)
  assert.match(prompt, /one idea or question at a time/i)
  assert.match(prompt, /concrete choices/i)
})


test('direct requests must be answered instead of turned into an unrelated question', () => {
  const messages = [{ role: 'user', content: 'Tell me something random.' }]
  const reason = localGuideModelInternals.generatedReplyViolation(GUIDE_CHARACTERS.larry, messages, "What's the capital of France?")
  assert.match(reason, /direct request/i)
  assert.equal(localGuideModelInternals.generatedReplyViolation(GUIDE_CHARACTERS.larry, messages, 'I once watched a crow steal a whole sandwich. What is the strangest thing you saw today?'), null)
})

test('logic guard rejects fabricated user memories', () => {
  const messages = [
    { role: 'user', content: "I'm anxious about my meeting tomorrow." },
    { role: 'user', content: 'Help me think it through.' },
  ]
  const bad = 'We can work through this together, just like that time you forgot your password.'
  const reason = localGuideModelInternals.generatedReplyViolation(GUIDE_CHARACTERS.larry, messages, bad)
  assert.match(reason, /invented user history/i)
})

test('generated Guide turn parser hides branch metadata from visible text', () => {
  const turn = parseGeneratedGuideTurn('Coke. That is my pick.\n[[BRANCHES:["Defend Coke","Tell me why Pepsi loses"]]]')
  assert.equal(turn.content, 'Coke. That is my pick.')
  assert.deepEqual(turn.suggestions, ['Defend Coke', 'Tell me why Pepsi loses'])
})

test('generated Guide turn parser tolerates ordinary replies with no branch metadata', () => {
  const turn = parseGeneratedGuideTurn('Coke. That is my pick.')
  assert.equal(turn.content, 'Coke. That is my pick.')
  assert.deepEqual(turn.suggestions, [])
})
