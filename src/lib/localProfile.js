const STORAGE_PREFIX = 'my420journal_local_v1'
const ACTIVE_USER_KEY = `${STORAGE_PREFIX}:active_user`
const USERS_KEY = `${STORAGE_PREFIX}:users`

function nowIso() {
  return new Date().toISOString()
}

function makeId(prefix = 'local') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function sanitizeUser(user) {
  if (!user?.id) return null
  return {
    id: user.id,
    created_at: user.created_at || nowIso(),
    profile_type: 'anonymous_local',
    migrated_at: user.migrated_at || nowIso(),
  }
}

function publicProfile(user, extra = {}) {
  if (!user) return null
  return {
    id: user.id,
    created_at: user.created_at,
    profile_type: user.profile_type || 'anonymous_local',
    ...extra,
  }
}

export function migrateExistingLocalProfile() {
  if (typeof localStorage === 'undefined') {
    return { profile: null, migrated: false, status: 'storage_unavailable' }
  }

  const activeId = localStorage.getItem(ACTIVE_USER_KEY)
  if (!activeId) {
    return { profile: null, migrated: false, status: 'no_active_profile' }
  }

  const users = readUsers()
  const index = users.findIndex((user) => user?.id === activeId)
  if (index < 0) {
    localStorage.removeItem(ACTIVE_USER_KEY)
    return { profile: null, migrated: false, status: 'active_profile_missing' }
  }

  const current = users[index]
  const alreadyAnonymous = current.profile_type === 'anonymous_local'
    && !current.email
    && !current.credential_hash
    && !current.credential_salt

  if (alreadyAnonymous) {
    return { profile: publicProfile(current), migrated: false, status: 'already_anonymous' }
  }

  const sanitized = sanitizeUser(current)
  users[index] = sanitized
  writeUsers(users)

  return {
    profile: publicProfile(sanitized),
    migrated: true,
    status: 'legacy_profile_migrated',
  }
}

export function ensureAnonymousLocalProfile() {
  if (typeof localStorage === 'undefined') {
    return { profile: null, created: false, migrated: false, status: 'storage_unavailable' }
  }

  const migrated = migrateExistingLocalProfile()
  if (migrated.profile) {
    return {
      ...migrated,
      created: false,
    }
  }

  const users = readUsers()

  if (users.length > 0) {
    // If an old active-user pointer disappeared but local profiles remain, keep
    // all rows intact and resume the newest stored profile rather than deleting data.
    const chosen = users[0]
    const sanitized = sanitizeUser(chosen)
    users[0] = sanitized
    writeUsers(users)
    localStorage.setItem(ACTIVE_USER_KEY, sanitized.id)

    return {
      profile: publicProfile(sanitized, { multiple_profiles_detected: users.length > 1 }),
      created: false,
      migrated: true,
      status: users.length > 1 ? 'legacy_profiles_preserved_newest_resumed' : 'legacy_profile_resumed',
    }
  }

  const fresh = {
    id: makeId('user'),
    created_at: nowIso(),
    profile_type: 'anonymous_local',
    migrated_at: null,
  }

  writeUsers([fresh])
  localStorage.setItem(ACTIVE_USER_KEY, fresh.id)

  return {
    profile: publicProfile(fresh),
    created: true,
    migrated: false,
    status: 'anonymous_profile_created',
  }
}
