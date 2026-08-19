const STORAGE_KEY = 'my420journal_shared_privacy_v1'

export const PHASE1_SHARED_CONTRIBUTIONS_ENABLED = false

export const SHARED_PROFILE_DEFAULTS = {
  shared_opt_in_enabled: false,
  shared_opt_in_at: null,
  shared_opt_out_at: null,
  anonymous_contributor_id: null,
  last_shared_sync_at: null,
  pending_shared_delete: false,
}

function nowIso() {
  return new Date().toISOString()
}

function makeAnonymousId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function readLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeLocalState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getSharedPrivacyState(profile = {}) {
  const localState = typeof localStorage !== 'undefined' ? readLocalState() : {}
  return {
    ...SHARED_PROFILE_DEFAULTS,
    ...localState,
    ...profile,
    shared_opt_in_enabled: PHASE1_SHARED_CONTRIBUTIONS_ENABLED
      && (profile?.shared_opt_in_enabled === true || localState?.shared_opt_in_enabled === true),
    pending_shared_delete: profile?.pending_shared_delete === true || localState?.pending_shared_delete === true,
  }
}

export function ensureAnonymousContributorId(state = {}) {
  return state.anonymous_contributor_id || makeAnonymousId()
}

export function enableSharedOptIn(currentState = {}) {
  const current = getSharedPrivacyState(currentState)
  if (!PHASE1_SHARED_CONTRIBUTIONS_ENABLED) {
    return {
      ...current,
      shared_opt_in_enabled: false,
    }
  }

  const next = {
    ...current,
    shared_opt_in_enabled: true,
    shared_opt_in_at: current.shared_opt_in_at || nowIso(),
    shared_opt_out_at: null,
    anonymous_contributor_id: ensureAnonymousContributorId(current),
    pending_shared_delete: false,
  }
  writeLocalState(next)
  return next
}

export function disableSharedOptIn(currentState = {}) {
  const current = getSharedPrivacyState(currentState)
  const next = {
    ...current,
    shared_opt_in_enabled: false,
    shared_opt_out_at: nowIso(),
    anonymous_contributor_id: ensureAnonymousContributorId(current),
    pending_shared_delete: true,
  }
  writeLocalState(next)
  return next
}

export function markSharedSyncComplete(currentState = {}) {
  const current = getSharedPrivacyState(currentState)
  const next = {
    ...current,
    last_shared_sync_at: nowIso(),
    pending_shared_delete: false,
  }
  writeLocalState(next)
  return next
}

export function getSharedProfileFields(state = {}) {
  const current = getSharedPrivacyState(state)
  return {
    shared_opt_in_enabled: current.shared_opt_in_enabled,
    shared_opt_in_at: current.shared_opt_in_at,
    shared_opt_out_at: current.shared_opt_out_at,
    anonymous_contributor_id: current.anonymous_contributor_id,
    last_shared_sync_at: current.last_shared_sync_at,
    pending_shared_delete: current.pending_shared_delete,
  }
}
