import test from 'node:test'
import assert from 'node:assert/strict'

import {
  scrubLegacyShoppingLocationFields,
  stripLegacyShoppingLocationFields,
} from './privacyMigrations.js'

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
