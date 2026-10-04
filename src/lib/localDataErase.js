const LOCAL_PREFIXES = ['my420journal_local_v1', 'm420_']
const LOCAL_EXACT_KEYS = new Set([
  'my420journal_market_v1',
  'my420journal_shared_contribution_queue_v1',
])

export const PRESERVED_SHARED_PRIVACY_KEY = 'my420journal_shared_privacy_v1'

function ownedPrivateKey(key) {
  if (!key || key === PRESERVED_SHARED_PRIVACY_KEY) return false
  return LOCAL_EXACT_KEYS.has(key) || LOCAL_PREFIXES.some((prefix) => key.startsWith(prefix))
}

function eraseFromStorage(storage) {
  if (!storage || typeof storage.length !== 'number') return 0
  const keys = []
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i)
    if (ownedPrivateKey(key)) keys.push(key)
  }
  keys.forEach((key) => storage.removeItem(key))
  return keys.length
}

export function erasePrivateLocalJournalData(local = null, session = null) {
  const localTarget = local ?? (typeof localStorage !== 'undefined' ? localStorage : null)
  const sessionTarget = session ?? (typeof sessionStorage !== 'undefined' ? sessionStorage : null)
  return {
    localRemoved: eraseFromStorage(localTarget),
    sessionRemoved: eraseFromStorage(sessionTarget),
  }
}

export const localDataEraseInternals = Object.freeze({ ownedPrivateKey })
