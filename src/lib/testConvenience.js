export const TEST_EMAIL = 'test@my420journal.local'
export const TEST_PASSWORD = 'VOGTCOM-TEST-2026'
export const AGE_GATE_TEST_CODE = 'ADMIN'

export function isRuntimeTestConvenienceEnabled() {
  if (typeof window === 'undefined') return false

  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1'
}
