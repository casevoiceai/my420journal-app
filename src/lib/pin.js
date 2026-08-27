const PIN_KEY = 'm420_pin_hash'
const PIN_UNLOCK_KEY = 'm420_pin_unlocked_v1'

export async function hashPin(pin) {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function getStoredHash() {
  return localStorage.getItem(PIN_KEY)
}

export function markPinUnlocked() {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(PIN_UNLOCK_KEY, '1')
}

export function clearPinUnlock() {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(PIN_UNLOCK_KEY)
}

export function isPinUnlocked() {
  if (typeof sessionStorage === 'undefined') return false
  return sessionStorage.getItem(PIN_UNLOCK_KEY) === '1'
}

export async function storePin(pin) {
  const hash = await hashPin(pin)
  localStorage.setItem(PIN_KEY, hash)
  return hash
}

export async function verifyPin(pin) {
  const stored = getStoredHash()
  if (!stored) return false
  const hash = await hashPin(pin)
  const matches = hash === stored
  if (matches) markPinUnlocked()
  return matches
}

export function clearPin() {
  localStorage.removeItem(PIN_KEY)
  clearPinUnlock()
}

export function hasPin() {
  return Boolean(getStoredHash())
}
