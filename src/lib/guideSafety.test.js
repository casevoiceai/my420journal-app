import test from 'node:test'
import assert from 'node:assert/strict'
import {
  detectGuideSafety,
  emotionalSupportResponse,
  crisisResponse,
  activateCrisisFollowup,
  readCrisisFollowup,
  stageCrisisFollowupOnAppOpen,
  consumePendingCrisisFollowup,
  conversationAfterEmotionalShift,
} from './guideSafety.js'

class MemoryStorage {
  constructor() { this.map = new Map() }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null }
  setItem(key, value) { this.map.set(key, String(value)) }
  removeItem(key) { this.map.delete(key) }
}

test('a shitty day is human support, not crisis', () => {
  assert.deepEqual(detectGuideSafety('I had a really shitty day today.'), {
    level: 'emotional', kind: 'human-support',
  })
  const reply = emotionalSupportResponse('larry')
  assert.match(reply, /rough day/i)
  assert.match(reply, /vent|tell me/i)
  assert.doesNotMatch(reply, /deep breath|tomorrow|soda|pepsi|coke/i)
})
test('ordinary negative opinions do not become emotional safety events', () => {
  assert.equal(detectGuideSafety('That movie was awful.').level, 'normal')
  assert.equal(detectGuideSafety('This coffee is terrible.').level, 'normal')
})

test('acute distress maps to the locked moderate tier', () => {
  assert.equal(detectGuideSafety('I am shaking and really scared.').level, 'level2')
  assert.equal(detectGuideSafety("I couldn't breathe after that edible.").level, 'level2')
  assert.match(crisisResponse('larry', { level: 'level2', kind: 'distress' }), /right now|now/i)
})

test('ordinary anxiety is support, not a crisis follow-up', () => {
  assert.equal(detectGuideSafety('I am anxious about my meeting tomorrow.').level, 'emotional')
  assert.equal(detectGuideSafety('That edible made me anxious and paranoid.').level, 'level2')
})

test('severe adverse events use the severe safety path', () => {
  const safety = detectGuideSafety('I had a panic attack and went to urgent care.')
  assert.equal(safety.level, 'level3')
  assert.equal(safety.kind, 'adverse-event')
  assert.match(crisisResponse('larry', safety), /frightening|911/i)
})

test('explicit self-harm language bypasses personality for resource routing', () => {
  const safety = detectGuideSafety('I want to kill myself.')
  const reply = crisisResponse('larry', safety)
  assert.equal(safety.level, 'level3')
  assert.equal(safety.kind, 'high-risk')
  assert.match(reply, /local AI Guide/i)
  assert.match(reply, /988/)
  assert.match(reply, /911/)
  assert.doesNotMatch(reply, /records|notebooks|garden|buddy/i)
})
test('only moderate and severe events create the locked seven-session follow-up', () => {
  const storage = new MemoryStorage()
  assert.equal(activateCrisisFollowup({ guide: 'larry', level: 'emotional', storage }), false)
  assert.equal(readCrisisFollowup(storage), null)
  assert.equal(activateCrisisFollowup({ guide: 'larry', level: 'level2', storage }), true)
  assert.deepEqual(readCrisisFollowup(storage), { guide: 'larry', remaining: 7, level: 'level2' })
})

test('follow-up staging uses a session counter and stores no timestamp', () => {
  const storage = new MemoryStorage()
  activateCrisisFollowup({ guide: 'mary', level: 'level3', storage })
  const pending = stageCrisisFollowupOnAppOpen(storage)
  assert.deepEqual(pending, { guide: 'mary', session: 1, level: 'level3' })
  assert.deepEqual(readCrisisFollowup(storage), { guide: 'mary', remaining: 6, level: 'level3' })
  const raw = [...storage.map.values()].join(' ')
  assert.doesNotMatch(raw, /timestamp|2026-|T\d\d:/i)
  assert.deepEqual(consumePendingCrisisFollowup(storage), pending)
})

test('an emotional turn cuts unrelated earlier topic history', () => {
  const messages = [
    { role: 'user', content: 'Coke or Pepsi?' },
    { role: 'assistant', content: 'Coke, if you make me pick.' },
    { role: 'user', content: 'I had a really shitty day today.' },
    { role: 'assistant', content: 'Ah, hell. Want to tell me what happened?' },
    { role: 'user', content: 'My boss embarrassed me in front of everybody.' },
  ]
  const sliced = conversationAfterEmotionalShift(messages)
  assert.equal(sliced[0].content, 'I had a really shitty day today.')
  assert.equal(sliced.some((m) => /coke|pepsi/i.test(m.content)), false)
})
test('high-risk follow-up answers stay inside the safety route', async () => {
  const { detectGuideSafetyForConversation, crisisResponse } = await import('./guideSafety.js')
  const messages = [
    { role: 'user', content: 'I want to kill myself.' },
    { role: 'assistant', content: 'I am a local AI Guide, not a human or emergency service. Are you in immediate danger or thinking about acting on this right now?' },
    { role: 'user', content: 'Yes. I have a plan.' },
  ]
  const safety = detectGuideSafetyForConversation(messages)
  assert.equal(safety.kind, 'high-risk-immediate')
  assert.match(crisisResponse('larry', safety), /988/)
  assert.match(crisisResponse('larry', safety), /move away/i)
})

test('not okay after a crisis check-in advances instead of looping', async () => {
  const { detectGuideSafetyForConversation, crisisResponse } = await import('./guideSafety.js')
  const messages = [
    { role: 'assistant', content: 'Before anything else, how are you feeling right now?' },
    { role: 'user', content: "No. I'm not okay." },
  ]
  const safety = detectGuideSafetyForConversation(messages)
  assert.equal(safety.level, 'level2')
  assert.equal(safety.kind, 'distress-continuation')
  const reply = crisisResponse('larry', safety)
  assert.match(reply, /real person|safe/i)
  assert.doesNotMatch(reply, /how are you feeling right now/i)
})
