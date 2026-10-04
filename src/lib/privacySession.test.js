import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PRIVATE_ACTIVITY_KEY,
  PRIVATE_INACTIVITY_MS,
  clearPrivateActivity,
  isPrivateSessionExpired,
  markPrivateActivity,
  readPrivateActivity,
} from './privacySession.js'

class MemoryStorage {
  constructor() { this.map = new Map() }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null }
  setItem(key, value) { this.map.set(key, String(value)) }
  removeItem(key) { this.map.delete(key) }
}

test('private session starts unexpired when there is no activity timestamp', () => {
  const storage = new MemoryStorage()
  assert.equal(readPrivateActivity(storage), null)
  assert.equal(isPrivateSessionExpired(1_000_000, storage), false)
})

test('private session expires after fifteen minutes of inactivity', () => {
  const storage = new MemoryStorage()
  markPrivateActivity(10_000, storage)
  assert.equal(isPrivateSessionExpired(10_000 + PRIVATE_INACTIVITY_MS - 1, storage), false)
  assert.equal(isPrivateSessionExpired(10_000 + PRIVATE_INACTIVITY_MS, storage), true)
})

test('activity refreshes the privacy timer', () => {
  const storage = new MemoryStorage()
  markPrivateActivity(10_000, storage)
  markPrivateActivity(20_000, storage)
  assert.equal(readPrivateActivity(storage), 20_000)
  assert.equal(isPrivateSessionExpired(20_000 + PRIVATE_INACTIVITY_MS - 1, storage), false)
})

test('privacy exit clears session-only activity and Guide state without touching persistent profile state', () => {
  const storage = new MemoryStorage()
  storage.setItem(PRIVATE_ACTIVITY_KEY, '123')
  storage.setItem('m420_guide_low_effort', '1')
  storage.setItem('m420_guide_chat', 'old')
  storage.setItem('my420journal_local_v1:active_user', 'must-remain')
  assert.equal(clearPrivateActivity(storage), true)
  assert.equal(storage.getItem(PRIVATE_ACTIVITY_KEY), null)
  assert.equal(storage.getItem('m420_guide_low_effort'), null)
  assert.equal(storage.getItem('m420_guide_chat'), null)
  assert.equal(storage.getItem('my420journal_local_v1:active_user'), 'must-remain')
})
