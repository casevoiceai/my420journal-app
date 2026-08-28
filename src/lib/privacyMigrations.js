const PROFILE_STORAGE_KEY = 'my420journal_local_v1:user_profiles'

export const OBSOLETE_SHOPPING_LOCATION_FIELDS = [
  'home_city',
  'travel_radius_miles',
  'preferred_cities',
]

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
