const STORAGE_PREFIX = 'my420journal_local_v1'
const PROFILE_STORAGE_KEY = `${STORAGE_PREFIX}:user_profiles`
const USERS_STORAGE_KEY = `${STORAGE_PREFIX}:users`
const ACTIVE_USER_KEY = `${STORAGE_PREFIX}:active_user`

export const OBSOLETE_SHOPPING_LOCATION_FIELDS = [
  'home_city',
  'travel_radius_miles',
  'preferred_cities',
]

function nowIso() {
  return new Date().toISOString()
}

function sanitizeAnonymousUsers(rows) {
  if (!Array.isArray(rows)) throw new Error('Legacy users storage must be an array.')
  const migratedAt = nowIso()

  return rows.map((user) => {
    if (!user || typeof user !== 'object' || Array.isArray(user) || !user.id) {
      throw new Error('Legacy user record is invalid.')
    }

    return {
      id: user.id,
      created_at: user.created_at || migratedAt,
      profile_type: 'anonymous_local',
      migrated_at: user.migrated_at || migratedAt,
    }
  })
}

export function stripLegacyShoppingLocationFields(rows) {
  if (!Array.isArray(rows)) return { rows, changed: false, profilesChanged: 0 }

  let profilesChanged = 0
  const cleaned = rows.map((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return row

    const hasObsoleteField = OBSOLETE_SHOPPING_LOCATION_FIELDS.some((field) => (
      Object.prototype.hasOwnProperty.call(row, field)
    ))

    if (!hasObsoleteField) return row

    const next = { ...row }
    for (const field of OBSOLETE_SHOPPING_LOCATION_FIELDS) delete next[field]
    profilesChanged += 1
    return next
  })

  return {
    rows: cleaned,
    changed: profilesChanged > 0,
    profilesChanged,
  }
}

export function sanitizeLegacyBackupData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: 'Backup data must be an object.', data: null }
  }

  try {
    const sanitized = {}

    for (const [key, value] of Object.entries(data)) {
      if (!key.startsWith(STORAGE_PREFIX) || typeof value !== 'string') {
        throw new Error('Backup contains an invalid storage entry.')
      }

      if (key === USERS_STORAGE_KEY) {
        const users = sanitizeAnonymousUsers(JSON.parse(value))
        sanitized[key] = JSON.stringify(users)
        continue
      }

      if (key === PROFILE_STORAGE_KEY) {
        const profiles = JSON.parse(value)
        if (!Array.isArray(profiles)) throw new Error('Profile storage must be an array.')
        const result = stripLegacyShoppingLocationFields(profiles)
        sanitized[key] = JSON.stringify(result.rows)
        continue
      }

      sanitized[key] = value
    }

    if (sanitized[ACTIVE_USER_KEY] && sanitized[USERS_STORAGE_KEY]) {
      const activeId = sanitized[ACTIVE_USER_KEY]
      const users = JSON.parse(sanitized[USERS_STORAGE_KEY])
      if (!users.some((user) => user?.id === activeId)) {
        throw new Error('Active user does not exist in restored users.')
      }
    }

    return { ok: true, error: null, data: sanitized }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Backup sanitation failed.',
      data: null,
    }
  }
}

export function restoreSanitizedLegacyBackup(storage, data) {
  const sanitized = sanitizeLegacyBackupData(data)
  if (!sanitized.ok) return sanitized

  const snapshots = new Map()
  const entries = Object.entries(sanitized.data)

  try {
    for (const [key] of entries) {
      const existing = storage.getItem(key)
      snapshots.set(key, { existed: existing !== null, value: existing })
    }

    for (const [key, value] of entries) storage.setItem(key, value)

    return { ok: true, error: null, data: sanitized.data }
  } catch {
    for (const [key, snapshot] of snapshots.entries()) {
      try {
        if (snapshot.existed) storage.setItem(key, snapshot.value)
        else storage.removeItem(key)
      } catch {
        // Best-effort rollback. The caller receives a failure either way.
      }
    }
    return { ok: false, error: 'Could not restore backup without partial writes.', data: null }
  }
}

export function scrubLegacyShoppingLocationFields() {
  if (typeof localStorage === 'undefined') {
    return { changed: false, profilesChanged: 0, status: 'storage_unavailable' }
  }

  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (!raw) return { changed: false, profilesChanged: 0, status: 'nothing_to_scrub' }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return { changed: false, profilesChanged: 0, status: 'unexpected_profile_shape' }
    }

    const result = stripLegacyShoppingLocationFields(parsed)
    if (result.changed) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(result.rows))
    }

    return {
      changed: result.changed,
      profilesChanged: result.profilesChanged,
      status: result.changed ? 'scrubbed' : 'already_clean',
    }
  } catch {
    return { changed: false, profilesChanged: 0, status: 'scrub_failed' }
  }
}
