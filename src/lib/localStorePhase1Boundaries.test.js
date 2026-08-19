import test from 'node:test'
import assert from 'node:assert/strict'

import { localStore } from './localStore.js'

class MemoryStorage {
  constructor() {
    this.map = new Map()
  }

  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null
  }

  setItem(key, value) {
    this.map.set(key, String(value))
  }

  removeItem(key) {
    this.map.delete(key)
  }

  clear() {
    this.map.clear()
  }
}

function resetStorage() {
  globalThis.localStorage = new MemoryStorage()
}

test('Phase 1 entry storage strips blank automatic terpene guesses and their suggestion metadata', async () => {
  resetStorage()

  const { data, error } = await localStore.from('entries').insert({
    user_id: 'tester-1',
    product_name: 'Blue Dream',
    terpenes: {
      'Beta Myrcene': '',
      Terpinolene: '',
      Limonene: '',
    },
    terpenesAiSuggested: ['Beta Myrcene', 'Terpinolene', 'Limonene'],
  })

  assert.equal(error, null)
  assert.equal(data.length, 1)
  assert.deepEqual(data[0].terpenes, {})
  assert.equal('terpenesAiSuggested' in data[0], false)
})

test('Phase 1 entry storage preserves a tester-entered terpene value while removing unconfirmed guesses', async () => {
  resetStorage()

  const { data, error } = await localStore.from('entries').insert({
    user_id: 'tester-1',
    product_name: 'Blue Dream',
    terpenes: {
      'Beta Myrcene': '1.25',
      Terpinolene: '',
    },
    terpenesAiSuggested: ['Beta Myrcene', 'Terpinolene'],
  })

  assert.equal(error, null)
  assert.deepEqual(data[0].terpenes, { 'Beta Myrcene': '1.25' })
  assert.equal('terpenesAiSuggested' in data[0], false)
})

test('Phase 1 reads sanitize legacy rows that still contain blank automatic guesses', async () => {
  resetStorage()
  localStorage.setItem('my420journal_local_v1:entries', JSON.stringify([{
    id: 'legacy-entry',
    user_id: 'tester-1',
    product_name: 'Gelato',
    terpenes: {
      Limonene: '',
      'Beta Myrcene': '0.8',
    },
    terpenesAiSuggested: ['Limonene', 'Beta Myrcene'],
  }]))

  const { data, error } = await localStore.from('entries').select('*')

  assert.equal(error, null)
  assert.deepEqual(data[0].terpenes, { 'Beta Myrcene': '0.8' })
  assert.equal('terpenesAiSuggested' in data[0], false)
})
