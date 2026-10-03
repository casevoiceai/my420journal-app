import test from 'node:test'
import assert from 'node:assert/strict'
import { localStore } from './localStore.js'

class MemoryStorage {
  constructor() { this.map = new Map() }
  get length() { return this.map.size }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null }
  setItem(key, value) { this.map.set(String(key), String(value)) }
  removeItem(key) { this.map.delete(String(key)) }
  clear() { this.map.clear() }
  key(index) { return [...this.map.keys()][index] ?? null }
}

globalThis.localStorage = new MemoryStorage()

async function send(guide, text, history = []) {
  const { data, error } = await localStore.tools.invoke('guide-response', {
    body: { guide, messages: [...history, { role: 'user', content: text }] },
  })
  assert.equal(error, null)
  return data.content
}

test('guide reads only the active local profile journal', async () => {
  const first = await localStore.auth.signUp({ email: 'first@example.com', password: 'password1' })
  const firstId = first.data.user.id
  await localStore.from('entries').insert({
    user_id: firstId,
    product_name: 'Red Berries',
    body_tags: ['Relaxed'], mind_tags: ['Clear'], mood_tags: ['Calm'],
    notes: 'Good body effect.',
  })

  const second = await localStore.auth.signUp({ email: 'second@example.com', password: 'password2' })
  await localStore.from('entries').insert({
    user_id: second.data.user.id,
    product_name: 'Private Second Profile Product',
    notes: 'This must never appear for the first profile.',
  })

  await localStore.auth.signInWithPassword({ email: 'first@example.com', password: 'password1' })
  const own = await send('larry', 'what did I record about Red Berries?')
  assert.match(own, /Good body effect/)

  const other = await send('larry', 'what did I record about Private Second Profile Product?')
  assert.doesNotMatch(other, /must never appear/i)
  assert.doesNotMatch(other, /Private Second Profile Product: 1 entry/i)
})


test('live local Guide response carries contextual RPG branches', async () => {
  const { data, error } = await localStore.tools.invoke('guide-response', {
    body: {
      guide: 'larry',
      messages: [{ role: 'user', content: 'I had a really shitty day.' }],
    },
  })
  assert.equal(error, null)
  assert.match(data.content, /tell me|what happened/i)
  assert.equal(data.choices.length, 3)
  assert.match(data.choices[0].label, /vent/i)
  assert.match(data.choices[2].label, /Larry|stay with me/i)
  assert.equal(data.choices.some((choice) => choice.freeText), false)
})
