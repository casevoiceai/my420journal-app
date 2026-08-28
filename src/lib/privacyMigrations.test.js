import test from 'node:test'
import assert from 'node:assert/strict'

import {
  restoreSanitizedLegacyBackup,
  sanitizeLegacyBackupData,
  scrubLegacyShoppingLocationFields,
  stripLegacyShoppingLocationFields,
} from './privacyMigrations.js'

const USERS_KEY = 'my420journal_local_v1:users'
const ACTIVE_USER_KEY = 'my420journal_local_v1:active_user'
const PROFILE_KEY = 'my420journal_local_v1:user_profiles'
const ENTRIES_KEY = 'my420journal_local_v1:entries'

class MemoryStorage {
  constructor() { this.map = new Map() }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null }
  setItem(key, value) { this.map.set(String(key), String(value)) }
  removeItem(key) { this.map.delete(String(key)) }
}

test('pure scrub removes only the three obsolete shopping-location fields', () => {
  const original = [{
    id: 'profile-1',
    user_id: 'user-1',
    guide_selected: 'sunny',
    home_city: 'Scranton, PA',
    travel_radius_miles: 15,
    preferred_cities: 'Dickson City',
    interaction_dial: 3,
  }]

  const result = stripLegacyShoppingLocationFields(original)

  assert.equal(result.changed, true)
  assert.equal(result.profilesChanged, 1)
  assert.deepEqual(result.rows, [{
    id: 'profile-1',
    user_id: 'user-1',
    guide_selected: 'sunny',
    interaction_dial: 3,
  }])
  assert.equal(original[0].home_city, 'Scranton, PA')
})

test('storage scrub preserves profile identity and journal entries exactly', () => {
  globalThis.localStorage = new MemoryStorage()
  const profiles = [{
    id: 'profile-row-1',
    user_id: 'user-123',
    guide_selected: 'bud',
    home_city: 'Scranton, PA',
    travel_radius_miles: 30,
    preferred_cities: 'Moosic',
    entry_count: 9,
  }]
  const entries = [{ id: 'entry-1', user_id: 'user-123', notes: 'keep this exactly' }]

  localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles))
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
  const entriesBefore = localStorage.getItem(ENTRIES_KEY)

  const result = scrubLegacyShoppingLocationFields()
  const cleaned = JSON.parse(localStorage.getItem(PROFILE_KEY))

  assert.equal(result.status, 'scrubbed')
  assert.equal(result.profilesChanged, 1)
  assert.equal(cleaned[0].id, 'profile-row-1')
  assert.equal(cleaned[0].user_id, 'user-123')
  assert.equal(cleaned[0].guide_selected, 'bud')
  assert.equal(cleaned[0].entry_count, 9)
  assert.equal('home_city' in cleaned[0], false)
  assert.equal('travel_radius_miles' in cleaned[0], false)
  assert.equal('preferred_cities' in cleaned[0], false)
  assert.equal(localStorage.getItem(ENTRIES_KEY), entriesBefore)
})

test('storage scrub is idempotent', () => {
  globalThis.localStorage = new MemoryStorage()
  localStorage.setItem(PROFILE_KEY, JSON.stringify([{ id: 'profile-1', user_id: 'user-1' }]))

  const first = scrubLegacyShoppingLocationFields()
  const second = scrubLegacyShoppingLocationFields()

  assert.equal(first.status, 'already_clean')
  assert.equal(second.status, 'already_clean')
})

test('malformed profile storage fails closed without overwriting it', () => {
  globalThis.localStorage = new MemoryStorage()
  localStorage.setItem(PROFILE_KEY, '{not-valid-json')

  const before = localStorage.getItem(PROFILE_KEY)
  const result = scrubLegacyShoppingLocationFields()

  assert.equal(result.status, 'scrub_failed')
  assert.equal(localStorage.getItem(PROFILE_KEY), before)
})

test('legacy backup sanitation strips retired credentials and shopping location while preserving IDs and entries', () => {
  const entryString = JSON.stringify([{ id: 'entry-1', user_id: 'user-1', notes: 'preserve exactly' }])
  const result = sanitizeLegacyBackupData({
    [USERS_KEY]: JSON.stringify([{
      id: 'user-1',
      email: 'legacy@example.com',
      credential_hash: 'old-hash',
      credential_salt: 'old-salt',
      created_at: '2026-01-01T00:00:00.000Z',
    }]),
    [ACTIVE_USER_KEY]: 'user-1',
    [PROFILE_KEY]: JSON.stringify([{
      id: 'profile-1',
      user_id: 'user-1',
      guide_selected: 'mary',
      home_city: 'Scranton, PA',
      travel_radius_miles: 15,
      preferred_cities: 'Moosic',
      entry_count: 4,
    }]),
    [ENTRIES_KEY]: entryString,
  })

  assert.equal(result.ok, true)
  const users = JSON.parse(result.data[USERS_KEY])
  const profiles = JSON.parse(result.data[PROFILE_KEY])

  assert.deepEqual(Object.keys(users[0]).sort(), ['created_at', 'id', 'migrated_at', 'profile_type'].sort())
  assert.equal(users[0].id, 'user-1')
  assert.equal(users[0].profile_type, 'anonymous_local')
  assert.equal(profiles[0].id, 'profile-1')
  assert.equal(profiles[0].user_id, 'user-1')
  assert.equal(profiles[0].guide_selected, 'mary')
  assert.equal(profiles[0].entry_count, 4)
  assert.equal('home_city' in profiles[0], false)
  assert.equal('travel_radius_miles' in profiles[0], false)
  assert.equal('preferred_cities' in profiles[0], false)
  assert.equal(result.data[ENTRIES_KEY], entryString)
})

test('legacy backup sanitation rejects malformed users and mismatched active user', () => {
  const malformed = sanitizeLegacyBackupData({
    [USERS_KEY]: JSON.stringify([{ email: 'missing-id@example.com' }]),
  })
  assert.equal(malformed.ok, false)

  const mismatched = sanitizeLegacyBackupData({
    [USERS_KEY]: JSON.stringify([{ id: 'user-1' }]),
    [ACTIVE_USER_KEY]: 'user-2',
  })
  assert.equal(mismatched.ok, false)
})

test('restore writes only sanitized values and preserves journal entry bytes', () => {
  const storage = new MemoryStorage()
  const entryString = '[{"id":"entry-1","notes":"exact bytes"}]'

  const result = restoreSanitizedLegacyBackup(storage, {
    [USERS_KEY]: JSON.stringify([{ id: 'user-1', email: 'legacy@example.com', credential_hash: 'x', credential_salt: 'y' }]),
    [ACTIVE_USER_KEY]: 'user-1',
    [PROFILE_KEY]: JSON.stringify([{ id: 'profile-1', user_id: 'user-1', home_city: 'Scranton, PA' }]),
    [ENTRIES_KEY]: entryString,
  })

  assert.equal(result.ok, true)
  assert.equal(storage.getItem(ENTRIES_KEY), entryString)
  assert.equal('email' in JSON.parse(storage.getItem(USERS_KEY))[0], false)
  assert.equal('home_city' in JSON.parse(storage.getItem(PROFILE_KEY))[0], false)
})

test('restore rolls back all touched keys when a storage write fails', () => {
  class FailingStorage extends MemoryStorage {
    setItem(key, value) {
      if (key === PROFILE_KEY && this.failWrites) throw new Error('quota failure')
      super.setItem(key, value)
    }
  }

  const storage = new FailingStorage()
  storage.setItem(USERS_KEY, 'old-users')
  storage.setItem(PROFILE_KEY, 'old-profiles')
  storage.failWrites = true

  const result = restoreSanitizedLegacyBackup(storage, {
    [USERS_KEY]: JSON.stringify([{ id: 'user-1' }]),
    [PROFILE_KEY]: JSON.stringify([{ id: 'profile-1', user_id: 'user-1' }]),
  })

  assert.equal(result.ok, false)
  assert.equal(storage.getItem(USERS_KEY), 'old-users')
  assert.equal(storage.getItem(PROFILE_KEY), 'old-profiles')
})
