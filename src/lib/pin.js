const PIN_KEY = 'm420_pin_hash'

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

export async function storePin(pin) {
  const hash = await hashPin(pin)
  localStorage.setItem(PIN_KEY, hash)
  return hash
}

export async function verifyPin(pin) {
  const stored = getStoredHash()
  if (!stored) return false
  const hash = await hashPin(pin)
  return hash === stored
}

export function clearPin() {
  localStorage.removeItem(PIN_KEY)
}

export function hasPin() {
  return Boolean(getStoredHash())
}
