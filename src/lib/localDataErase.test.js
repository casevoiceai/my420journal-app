import test from 'node:test'
import assert from 'node:assert/strict'
import { erasePrivateLocalJournalData, PRESERVED_SHARED_PRIVACY_KEY } from './localDataErase.js'

class MemoryStorage {
  constructor(entries = {}) { this.map = new Map(Object.entries(entries)) }
  get length() { return this.map.size }
  key(index) { return [...this.map.keys()][index] ?? null }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null }
  setItem(key, value) { this.map.set(key, String(value)) }
  removeItem(key) { this.map.delete(key) }
}

test('private local erase removes journal, PIN, market, dispensary and session state', () => {
  const local = new MemoryStorage({
    'my420journal_local_v1:entries': '[private]',
    'my420journal_local_v1:users': '[user]',
    'my420journal_market_v1': '{"market":"PA"}',
    'my420journal_shared_contribution_queue_v1': '[]',
    'm420_pin_hash': 'hash',
    'm420_dispensaries': '[saved]',
    'unrelated_origin_key': 'keep',
    [PRESERVED_SHARED_PRIVACY_KEY]: '{"anonymous_contributor_id":"legacy"}',
  })
  const session = new MemoryStorage({
    'm420_pin_unlocked_v1': '1',
    'm420_guide_low_effort': '1',
    'unrelated_session_key': 'keep',
  })

  const result = erasePrivateLocalJournalData(local, session)
  assert.equal(result.localRemoved, 6)
  assert.equal(result.sessionRemoved, 2)
  assert.equal(local.getItem('my420journal_local_v1:entries'), null)
  assert.equal(local.getItem('m420_pin_hash'), null)
  assert.equal(local.getItem('my420journal_market_v1'), null)
  assert.equal(local.getItem('unrelated_origin_key'), 'keep')
  assert.equal(local.getItem(PRESERVED_SHARED_PRIVACY_KEY), '{"anonymous_contributor_id":"legacy"}')
  assert.equal(session.getItem('unrelated_session_key'), 'keep')
})

test('private local erase never treats the legacy shared privacy identity as private-journal storage', () => {
  const local = new MemoryStorage({ [PRESERVED_SHARED_PRIVACY_KEY]: '{"pending_shared_delete":true}' })
  const result = erasePrivateLocalJournalData(local, new MemoryStorage())
  assert.equal(result.localRemoved, 0)
  assert.notEqual(local.getItem(PRESERVED_SHARED_PRIVACY_KEY), null)
})
