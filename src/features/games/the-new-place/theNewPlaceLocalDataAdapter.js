import {
  THE_NEW_PLACE_GAME_ID,
  restoreTheNewPlaceRun,
  sanitizeTheNewPlacePersonalization,
  serializeTheNewPlaceRun,
} from './theNewPlaceEngine.js'

export const THE_NEW_PLACE_ACTIVE_STORAGE_PREFIX = 'my420journal_local_v1:the_new_place_active'
export const THE_NEW_PLACE_RUNS_STORAGE_PREFIX = 'my420journal_local_v1:the_new_place_runs'

const MAX_HISTORY = 10
const MAX_LABELS = 3
const MAX_TEXT = 64

const SUMMARY_FIELDS = Object.freeze([
  'gameId', 'version', 'weekSeed', 'outcomeId', 'average',
  'funds', 'inventory', 'satisfaction', 'compliance', 'reportConsistency',
  'inspectorOutcome', 'inspectorFocusId',
])

function cleanText(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, MAX_TEXT) : ''
}

function safeInteger(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.max(0, Math.min(100, Math.round(number)))
}

function addCount(index, value) {
  const text = cleanText(value)
  if (!text) return
  const key = text.toLocaleLowerCase('en-US')
  const item = index.get(key)
  if (item) item.count += 1
  else index.set(key, { value: text, count: 1, order: index.size })
}

function ranked(index) {
  return [...index.values()]
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .slice(0, MAX_LABELS)
    .map((item) => item.value)
}

function entryBand(count) {
  if (count <= 0) return '0'
  if (count <= 9) return '1-9'
  if (count <= 24) return '10-24'
  if (count <= 49) return '25-49'
  return '50+'
}

function runBand(count) {
  if (count <= 0) return '0'
  if (count <= 2) return '1-2'
  if (count <= 4) return '3-4'
  if (count <= 9) return '5-9'
  return '10+'
}

function readJson(storage, key, fallback) {
  if (!storage || typeof storage.getItem !== 'function') return fallback
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

async function resolveStore(explicitStore) {
  if (explicitStore) return explicitStore
  const module = await import('../../../lib/localStore.js')
  return module.localStore
}

async function resolveUserId(store, explicitUserId) {
  const supplied = cleanText(explicitUserId)
  if (supplied) return supplied
  const auth = await store.auth.getUser()
  return cleanText(auth?.data?.user?.id)
}

export function theNewPlaceActiveStorageKey(userId) {
  const id = cleanText(userId)
  return id ? `${THE_NEW_PLACE_ACTIVE_STORAGE_PREFIX}:${id}` : THE_NEW_PLACE_ACTIVE_STORAGE_PREFIX
}

export function theNewPlaceRunsStorageKey(userId) {
  const id = cleanText(userId)
  return id ? `${THE_NEW_PLACE_RUNS_STORAGE_PREFIX}:${id}` : THE_NEW_PLACE_RUNS_STORAGE_PREFIX
}

export function buildTheNewPlacePersonalization({ entries = [], completedRuns = [] } = {}) {
  const categories = new Map()
  const effects = new Map()
  const profiles = new Map()
  const safeEntries = Array.isArray(entries) ? entries : []
  for (const entry of safeEntries) {
    addCount(categories, entry?.category)
    for (const tag of entry?.body_tags || []) addCount(effects, tag)
    for (const tag of entry?.mind_tags || []) addCount(effects, tag)
    for (const tag of entry?.mood_tags || []) addCount(effects, tag)
    if (entry?.terpenes && typeof entry.terpenes === 'object' && !Array.isArray(entry.terpenes)) {
      for (const label of Object.keys(entry.terpenes)) addCount(profiles, label)
    }
  }
  return sanitizeTheNewPlacePersonalization({
    categoryBands: ranked(categories),
    effectTags: ranked(effects),
    profileLabels: ranked(profiles),
    entryBand: entryBand(safeEntries.length),
    runBand: runBand(Array.isArray(completedRuns) ? completedRuns.length : 0),
  })
}

export function sanitizeTheNewPlaceCompletionSummary(summary) {
  if (!summary || summary.gameId !== THE_NEW_PLACE_GAME_ID || !summary.weekSeed) return null
  const safe = {}
  for (const field of SUMMARY_FIELDS) {
    const value = summary[field]
    if (typeof value === 'string') {
      const text = cleanText(value)
      if (text) safe[field] = text
    } else if (typeof value === 'number') {
      safe[field] = safeInteger(value)
    }
  }
  return safe
}

export function buildTheNewPlaceCompletionSummary(run) {
  if (!run || run.gameId !== THE_NEW_PLACE_GAME_ID || run.status !== 'completed' || !run.finalSummary) return null
  return sanitizeTheNewPlaceCompletionSummary({
    gameId: THE_NEW_PLACE_GAME_ID,
    version: run.version,
    weekSeed: run.weekDefinition.weekSeed,
    ...run.finalSummary,
  })
}

export function readTheNewPlaceRunHistory({ storage = typeof localStorage === 'undefined' ? null : localStorage, userId = null } = {}) {
  const raw = readJson(storage, theNewPlaceRunsStorageKey(userId), [])
  if (!Array.isArray(raw)) return []
  return raw.map(sanitizeTheNewPlaceCompletionSummary).filter(Boolean).slice(-MAX_HISTORY)
}

export function saveTheNewPlaceActiveRun({ run, storage = typeof localStorage === 'undefined' ? null : localStorage, userId = null } = {}) {
  if (!run || run.gameId !== THE_NEW_PLACE_GAME_ID || run.status !== 'active') throw new Error('An active The New Place week is required.')
  if (!storage || typeof storage.setItem !== 'function') throw new Error('Writable local storage is required for The New Place.')
  storage.setItem(theNewPlaceActiveStorageKey(userId), serializeTheNewPlaceRun(run))
  return run
}

export function loadTheNewPlaceActiveRun({ storage = typeof localStorage === 'undefined' ? null : localStorage, userId = null } = {}) {
  if (!storage || typeof storage.getItem !== 'function') return null
  const raw = storage.getItem(theNewPlaceActiveStorageKey(userId))
  if (!raw) return null
  try {
    const run = restoreTheNewPlaceRun(raw)
    return run.status === 'active' ? run : null
  } catch {
    return null
  }
}

export function clearTheNewPlaceActiveRun({ storage = typeof localStorage === 'undefined' ? null : localStorage, userId = null } = {}) {
  if (storage && typeof storage.removeItem === 'function') storage.removeItem(theNewPlaceActiveStorageKey(userId))
}

export function saveTheNewPlaceCompletion({ run, storage = typeof localStorage === 'undefined' ? null : localStorage, userId = null } = {}) {
  const safe = buildTheNewPlaceCompletionSummary(run)
  if (!safe) throw new Error('A completed The New Place week is required.')
  if (!storage || typeof storage.setItem !== 'function') throw new Error('Writable local storage is required for The New Place.')
  const history = readTheNewPlaceRunHistory({ storage, userId }).filter((item) => item.weekSeed !== safe.weekSeed)
  const next = [...history, safe].slice(-MAX_HISTORY)
  storage.setItem(theNewPlaceRunsStorageKey(userId), JSON.stringify(next))
  clearTheNewPlaceActiveRun({ storage, userId })
  return next
}

export async function readTheNewPlaceLocalContext({ store = null, storage = typeof localStorage === 'undefined' ? null : localStorage, userId = null } = {}) {
  const localStore = await resolveStore(store)
  const resolvedUserId = await resolveUserId(localStore, userId)
  const completedRuns = readTheNewPlaceRunHistory({ storage, userId: resolvedUserId })
  if (!resolvedUserId) {
    return {
      userId: null,
      personalization: buildTheNewPlacePersonalization({ completedRuns }),
      completedRuns,
      activeRun: loadTheNewPlaceActiveRun({ storage, userId: null }),
    }
  }
  const result = await localStore
    .from('entries')
    .select('category, body_tags, mind_tags, mood_tags, terpenes')
    .eq('user_id', resolvedUserId)
  if (result?.error) throw result.error
  return {
    userId: resolvedUserId,
    personalization: buildTheNewPlacePersonalization({ entries: result?.data || [], completedRuns }),
    completedRuns,
    activeRun: loadTheNewPlaceActiveRun({ storage, userId: resolvedUserId }),
  }
}
