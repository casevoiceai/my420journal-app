export const TEST_EMAIL = 'test@my420journal.local'
export const TEST_PASSWORD = 'VOGTCOM-TEST-2026'
export const AGE_GATE_TEST_CODE = 'ADMIN'

export function isRuntimeTestConvenienceEnabled() {
  if (typeof window === 'undefined') return false

  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true

  const params = new URLSearchParams(window.location.search)
  if (params.get('m420test') === '1') return true

  try {
    return window.localStorage.getItem('m420_test_convenience') === '1'
  } catch {
    return false
  }
}
