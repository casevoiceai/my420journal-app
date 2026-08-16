import {
  WHO_TOOK_MY_LIGHTER_GAME_ID,
  restoreWhoTookMyLighterRun,
  sanitizeWhoTookMyLighterPersonalization,
  serializeWhoTookMyLighterRun,
} from './whoTookMyLighterEngine.js'

export const WHO_TOOK_MY_LIGHTER_ACTIVE_STORAGE_PREFIX =
  'my420journal_local_v1:who_took_my_lighter_active'
export const WHO_TOOK_MY_LIGHTER_RUNS_STORAGE_PREFIX =
  'my420journal_local_v1:who_took_my_lighter_runs'

const MAX_HISTORY = 10
const MAX_LABELS = 3
const MAX_TEXT = 48

const COMPLETION_FIELDS = Object.freeze([
  'gameId',
  'version',
  'caseSeed',
  'culpritArchetypeId',
  'accusedArchetypeId',
  'correct',
  'missingObjectId',
  'motiveId',
  'evidenceCount',
  'interviewedCount',
  'contradictionCount',
])

function cleanText(value) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, MAX_TEXT)
    : ''
}

function safeInteger(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.max(0, Math.floor(number))
}

function addCount(index, value) {
  const text = cleanText(value)
  if (!text) return
  const key = text.toLocaleLowerCase('en-US')
  const current = index.get(key)
  if (current) {
    current.count += 1
    return
  }
  index.set(key, { value: text, count: 1, order: index.size })
}

function ranked(index) {
  return [...index.values()]
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .slice(0, MAX_LABELS)
    .map((item) => item.value)
}

function entryBand(count) {
  const value = safeInteger(count)
  if (value <= 0) return '0'
  if (value <= 9) return '1-9'
  if (value <= 24) return '10-24'
  if (value <= 49) return '25-49'
  return '50+'
}

function runBand(count) {
  const value = safeInteger(count)
  if (value <= 0) return '0'
  if (value <= 2) return '1-2'
  if (value <= 4) return '3-4'
  if (value <= 9) return '5-9'
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

function writeJson(storage, key, value) {
  if (!storage || typeof storage.setItem !== 'function') {
    throw new Error('Writable local storage is required for Who Took My Lighter?.')
  }
  storage.setItem(key, JSON.stringify(value))
}

async function resolveLocalStore(explicitStore) {
  if (explicitStore) return explicitStore
  const module = await import('../../../lib/localStore.js')
  return module.localStore
}

async function resolveUserId(store, explicitUserId) {
  const supplied = cleanText(explicitUserId)
  if (supplied) return supplied
  const result = await store.auth.getUser()
  return cleanText(result?.data?.user?.id)
}

export function whoTookMyLighterActiveStorageKey(userId) {
  const safeUserId = cleanText(userId)
  return safeUserId
    ? `${WHO_TOOK_MY_LIGHTER_ACTIVE_STORAGE_PREFIX}:${safeUserId}`
    : WHO_TOOK_MY_LIGHTER_ACTIVE_STORAGE_PREFIX
}

export function whoTookMyLighterRunsStorageKey(userId) {
  const safeUserId = cleanText(userId)
  return safeUserId
    ? `${WHO_TOOK_MY_LIGHTER_RUNS_STORAGE_PREFIX}:${safeUserId}`
    : WHO_TOOK_MY_LIGHTER_RUNS_STORAGE_PREFIX
}

export function sanitizeWhoTookMyLighterCompletionSummary(summary) {
  if (!summary || summary.gameId !== WHO_TOOK_MY_LIGHTER_GAME_ID) return null
  const safe = {}
  for (const field of COMPLETION_FIELDS) {
    const value = summary[field]
    if (typeof value === 'string') {
      const text = cleanText(value)
      if (text) safe[field] = text
    } else if (typeof value === 'boolean') {
      safe[field] = value
    } else if (typeof value === 'number') {
      safe[field] = safeInteger(value)
    }
  }
  return safe.gameId && safe.caseSeed ? safe : null
}

export function buildWhoTookMyLighterPersonalization({ entries = [], completedRuns = [] } = {}) {
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

  return sanitizeWhoTookMyLighterPersonalization({
    categoryBands: ranked(categories),
    effectTags: ranked(effects),
    profileLabels: ranked(profiles),
    entryBand: entryBand(safeEntries.length),
    runBand: runBand(Array.isArray(completedRuns) ? completedRuns.length : 0),
  })
}

export function readWhoTookMyLighterRunHistory({
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
} = {}) {
  const raw = readJson(storage, whoTookMyLighterRunsStorageKey(userId), [])
  if (!Array.isArray(raw)) return []
  return raw
    .map(sanitizeWhoTookMyLighterCompletionSummary)
    .filter(Boolean)
    .slice(-MAX_HISTORY)
}

export function saveWhoTookMyLighterActiveRun({
  run,
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
} = {}) {
  if (!run || run.gameId !== WHO_TOOK_MY_LIGHTER_GAME_ID || run.status !== 'active') {
    throw new Error('An active Who Took My Lighter? run is required.')
  }
  if (!storage || typeof storage.setItem !== 'function') {
    throw new Error('Writable local storage is required for Who Took My Lighter?.')
  }
  storage.setItem(whoTookMyLighterActiveStorageKey(userId), serializeWhoTookMyLighterRun(run))
  return run
}

export function loadWhoTookMyLighterActiveRun({
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
} = {}) {
  if (!storage || typeof storage.getItem !== 'function') return null
  const raw = storage.getItem(whoTookMyLighterActiveStorageKey(userId))
  if (!raw) return null
  try {
    const run = restoreWhoTookMyLighterRun(raw)
    return run.status === 'active' ? run : null
  } catch {
    return null
  }
}

export function clearWhoTookMyLighterActiveRun({
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
} = {}) {
  if (storage && typeof storage.removeItem === 'function') {
    storage.removeItem(whoTookMyLighterActiveStorageKey(userId))
  }
}

export function saveWhoTookMyLighterCompletion({
  completionSummary,
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
} = {}) {
  const safe = sanitizeWhoTookMyLighterCompletionSummary(completionSummary)
  if (!safe) throw new Error('A completed Who Took My Lighter? summary is required.')
  const history = readWhoTookMyLighterRunHistory({ storage, userId })
    .filter((item) => item.caseSeed !== safe.caseSeed)
  const next = [...history, safe].slice(-MAX_HISTORY)
  writeJson(storage, whoTookMyLighterRunsStorageKey(userId), next)
  clearWhoTookMyLighterActiveRun({ storage, userId })
  return next
}

export async function readWhoTookMyLighterLocalContext({
  store = null,
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
} = {}) {
  const localStore = await resolveLocalStore(store)
  const resolvedUserId = await resolveUserId(localStore, userId)
  const completedRuns = readWhoTookMyLighterRunHistory({ storage, userId: resolvedUserId })

  if (!resolvedUserId) {
    return {
      userId: null,
      personalization: buildWhoTookMyLighterPersonalization({ entries: [], completedRuns }),
      completedRuns,
      activeRun: loadWhoTookMyLighterActiveRun({ storage, userId: null }),
    }
  }

  const result = await localStore
    .from('entries')
    .select('category, body_tags, mind_tags, mood_tags, terpenes')
    .eq('user_id', resolvedUserId)

  if (result?.error) throw result.error
  const entries = result?.data || []

  return {
    userId: resolvedUserId,
    personalization: buildWhoTookMyLighterPersonalization({ entries, completedRuns }),
    completedRuns,
    activeRun: loadWhoTookMyLighterActiveRun({ storage, userId: resolvedUserId }),
  }
}
