export const PRIVATE_ACTIVITY_KEY = 'm420_session_last_activity_v1'
export const PRIVATE_INACTIVITY_MS = 15 * 60 * 1000

function storageOrNull(storage) {
  if (storage) return storage
  try { return globalThis?.sessionStorage || null } catch { return null }
}

export function readPrivateActivity(storage = null) {
  const target = storageOrNull(storage)
  if (!target) return null
  try {
    const value = Number(target.getItem(PRIVATE_ACTIVITY_KEY))
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

export function markPrivateActivity(now = Date.now(), storage = null) {
  const target = storageOrNull(storage)
  if (!target) return false
  try {
    target.setItem(PRIVATE_ACTIVITY_KEY, String(now))
    return true
  } catch {
    return false
  }
}

export function clearPrivateActivity(storage = null) {
  const target = storageOrNull(storage)
  if (!target) return false
  try {
    target.removeItem(PRIVATE_ACTIVITY_KEY)
    target.removeItem('m420_guide_low_effort')
    target.removeItem('m420_guide_chat')
    return true
  } catch {
    return false
  }
}

export function isPrivateSessionExpired(now = Date.now(), storage = null, timeoutMs = PRIVATE_INACTIVITY_MS) {
  const last = readPrivateActivity(storage)
  if (!last) return false
  return now - last >= timeoutMs
}
