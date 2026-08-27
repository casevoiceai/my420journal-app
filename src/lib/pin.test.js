import test from 'node:test'
import assert from 'node:assert/strict'

import {
  clearPin,
  clearPinUnlock,
  hasPin,
  isPinUnlocked,
  markPinUnlocked,
  storePin,
  verifyPin,
} from './pin.js'

class MemoryStorage {
  constructor() { this.map = new Map() }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null }
  setItem(key, value) { this.map.set(String(key), String(value)) }
  removeItem(key) { this.map.delete(String(key)) }
}

function setup() {
  globalThis.localStorage = new MemoryStorage()
  globalThis.sessionStorage = new MemoryStorage()
}

test('storing a PIN does not silently unlock the journal', async () => {
  setup()
  await storePin('1234')

  assert.equal(hasPin(), true)
  assert.equal(isPinUnlocked(), false)
})

test('only a correct PIN unlocks the current browser session', async () => {
  setup()
  await storePin('1234')

  assert.equal(await verifyPin('9999'), false)
  assert.equal(isPinUnlocked(), false)

  assert.equal(await verifyPin('1234'), true)
  assert.equal(isPinUnlocked(), true)
})

test('PIN unlock state is session-scoped rather than stored with journal data', async () => {
  setup()
  await storePin('2468')
  markPinUnlocked()

  assert.equal(isPinUnlocked(), true)
  assert.equal(localStorage.getItem('m420_pin_unlocked_v1'), null)
  assert.equal(sessionStorage.getItem('m420_pin_unlocked_v1'), '1')

  clearPinUnlock()
  assert.equal(isPinUnlocked(), false)
  assert.equal(hasPin(), true)
})

test('removing a PIN also removes any active unlock state', async () => {
  setup()
  await storePin('1357')
  markPinUnlocked()

  clearPin()

  assert.equal(hasPin(), false)
  assert.equal(isPinUnlocked(), false)
})
