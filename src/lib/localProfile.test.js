import test from 'node:test'
import assert from 'node:assert/strict'

import {
  activateLegacyLocalProfile,
  ensureAnonymousLocalProfile,
  migrateExistingLocalProfile,
} from './localProfile.js'
import { localStore } from './localStore.js'

class MemoryStorage {
  constructor() {
    this.map = new Map()
  }
  get length() { return this.map.size }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null }
  setItem(key, value) { this.map.set(String(key), String(value)) }
  removeItem(key) { this.map.delete(String(key)) }
  clear() { this.map.clear() }
  key(index) { return [...this.map.keys()][index] ?? null }
}

const PREFIX = 'my420journal_local_v1'
const USERS_KEY = `${PREFIX}:users`
const ACTIVE_USER_KEY = `${PREFIX}:active_user`
const ENTRIES_KEY = `${PREFIX}:entries`

function setup() {
  globalThis.localStorage = new MemoryStorage()
}

test('migrates the active legacy profile without changing its id or journal rows', async () => {
  setup()
  localStorage.setItem(USERS_KEY, JSON.stringify([
    {
      id: 'user_existing',
      email: 'tester@example.com',
      credential_salt: 'salt',
      credential_hash: 'hash',
      created_at: '2026-08-01T00:00:00.000Z',
    },
  ]))
  localStorage.setItem(ACTIVE_USER_KEY, 'user_existing')
  localStorage.setItem(ENTRIES_KEY, JSON.stringify([
    { id: 'entry_1', user_id: 'user_existing', product_name: 'Example' },
  ]))

  const result = migrateExistingLocalProfile()
  const users = JSON.parse(localStorage.getItem(USERS_KEY))
  const entries = JSON.parse(localStorage.getItem(ENTRIES_KEY))
  const { data: { session } } = await localStore.auth.getSession()

  assert.equal(result.migrated, true)
  assert.equal(result.profile.id, 'user_existing')
  assert.equal(users[0].id, 'user_existing')
  assert.equal(users[0].profile_type, 'anonymous_local')
  assert.equal('email' in users[0], false)
  assert.equal('credential_salt' in users[0], false)
  assert.equal('credential_hash' in users[0], false)
  assert.equal(session.user.id, 'user_existing')
  assert.equal(session.user.email, null)
  assert.deepEqual(entries, [
    { id: 'entry_1', user_id: 'user_existing', product_name: 'Example' },
  ])
})

test('creates an anonymous local profile when the device has no profile', async () => {
  setup()

  const result = ensureAnonymousLocalProfile()
  const users = JSON.parse(localStorage.getItem(USERS_KEY))
  const { data: { session } } = await localStore.auth.getSession()

  assert.equal(result.created, true)
  assert.equal(users.length, 1)
  assert.equal(users[0].id, result.profile.id)
  assert.equal(users[0].profile_type, 'anonymous_local')
  assert.equal(localStorage.getItem(ACTIVE_USER_KEY), result.profile.id)
  assert.equal('email' in users[0], false)
  assert.equal(session.user.id, result.profile.id)
})

test('keeps an existing anonymous active profile unchanged', () => {
  setup()
  const user = {
    id: 'user_anonymous',
    created_at: '2026-08-01T00:00:00.000Z',
    profile_type: 'anonymous_local',
    migrated_at: '2026-08-10T00:00:00.000Z',
  }
  localStorage.setItem(USERS_KEY, JSON.stringify([user]))
  localStorage.setItem(ACTIVE_USER_KEY, user.id)

  const result = migrateExistingLocalProfile()
  const users = JSON.parse(localStorage.getItem(USERS_KEY))

  assert.equal(result.migrated, false)
  assert.equal(result.status, 'already_anonymous')
  assert.deepEqual(users, [user])
})

test('requires a choice when multiple legacy profiles exist without an active pointer', () => {
  setup()
  localStorage.setItem(USERS_KEY, JSON.stringify([
    { id: 'newest', email: 'newest@example.com', credential_hash: 'a', credential_salt: 'b' },
    { id: 'older', email: 'older@example.com', credential_hash: 'c', credential_salt: 'd' },
  ]))

  const result = ensureAnonymousLocalProfile()
  const usersBeforeChoice = JSON.parse(localStorage.getItem(USERS_KEY))

  assert.equal(result.profile, null)
  assert.equal(result.status, 'legacy_profile_choice_required')
  assert.deepEqual(result.choices.map((choice) => choice.id), ['newest', 'older'])
  assert.equal(localStorage.getItem(ACTIVE_USER_KEY), null)
  assert.equal(usersBeforeChoice[0].email, 'newest@example.com')
  assert.equal(usersBeforeChoice[1].email, 'older@example.com')

  const selected = activateLegacyLocalProfile('older')
  const usersAfterChoice = JSON.parse(localStorage.getItem(USERS_KEY))

  assert.equal(selected.profile.id, 'older')
  assert.equal(localStorage.getItem(ACTIVE_USER_KEY), 'older')
  assert.equal(usersAfterChoice[0].email, 'newest@example.com')
  assert.equal('email' in usersAfterChoice[1], false)
  assert.equal(usersAfterChoice[1].profile_type, 'anonymous_local')
})
