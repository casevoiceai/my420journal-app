const MAX_TEXT_LENGTH = 100

export const PERSONALIZATION_LIMITS = Object.freeze({
  productNames: 5,
  productCategories: 3,
  effectTags: 5,
  terpeneLabels: 5,
  dispensaryNames: 3,
  previousRuns: 10,
})

export const WEED_GOBLINS_RUNS_STORAGE_PREFIX =
  'my420journal_local_v1:weed_goblins_runs'

const RUN_SUMMARY_FIELDS = Object.freeze([
  'adventureId',
  'backgroundId',
  'stolenItem',
  'routeId',
  'midpointChoice',
  'ending',
  'outcomeSummary',
  'trouble',
  'manaRemaining',
  'complicationCount',
  'narrationTier',
  'reason',
])

function cleanText(value) {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ').slice(0, MAX_TEXT_LENGTH)
}

function normalizeEntryType(value) {
  return cleanText(value).toLowerCase()
}

function isCannabisJournalEntry(entry) {
  const type = normalizeEntryType(entry?.entry_type)
  return !type || type === 'cannabis'
}

function addRankedValue(index, value, order) {
  const text = cleanText(value)
  if (!text) return order
  const key = text.toLocaleLowerCase('en-US')
  const existing = index.get(key)
  if (existing) {
    existing.count += 1
    return order
  }
  index.set(key, { value: text, count: 1, firstSeen: order })
  return order + 1
}

function rankedValues(index, limit) {
  return [...index.values()]
    .sort((a, b) => b.count - a.count || a.firstSeen - b.firstSeen)
    .slice(0, limit)
    .map((item) => item.value)
}

function collectArrayValues(index, values, order) {
  if (!Array.isArray(values)) return order
  let nextOrder = order
  for (const value of values) nextOrder = addRankedValue(index, value, nextOrder)
  return nextOrder
}

function collectTerpeneLabels(index, terpenes, order) {
  if (!terpenes || typeof terpenes !== 'object' || Array.isArray(terpenes)) return order
  let nextOrder = order
  for (const label of Object.keys(terpenes)) {
    nextOrder = addRankedValue(index, label, nextOrder)
  }
  return nextOrder
}

function safeInteger(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  return Math.max(0, Math.floor(number))
}

function sanitizeRunSummary(summary) {
  if (!summary || typeof summary !== 'object' || Array.isArray(summary)) return null
  const safe = {}
  for (const field of RUN_SUMMARY_FIELDS) {
    const value = summary[field]
    if (typeof value === 'string') {
      const text = cleanText(value)
      if (text) safe[field] = text
    } else if (typeof value === 'number') {
      const number = safeInteger(value)
      if (number !== null) safe[field] = number
    }
  }
  return Object.keys(safe).length > 0 ? safe : null
}

function sanitizePreviousRuns(previousRuns = []) {
  if (!Array.isArray(previousRuns)) return []
  return previousRuns
    .map(sanitizeRunSummary)
    .filter(Boolean)
    .slice(-PERSONALIZATION_LIMITS.previousRuns)
}

export function createEmptyWeedGoblinsPersonalizationSnapshot() {
  return {
    productNames: [],
    productCategories: [],
    effectTags: [],
    terpeneLabels: [],
    dispensaryNames: [],
    entryCount: 0,
    previousRuns: [],
  }
}

export function buildWeedGoblinsPersonalizationSnapshot({
  entries = [],
  previousRuns = [],
} = {}) {
  const snapshot = createEmptyWeedGoblinsPersonalizationSnapshot()
  if (!Array.isArray(entries)) {
    snapshot.previousRuns = sanitizePreviousRuns(previousRuns)
    return snapshot
  }

  const cannabisEntries = entries.filter(isCannabisJournalEntry)
  snapshot.entryCount = cannabisEntries.length

  const productNames = new Map()
  const productCategories = new Map()
  const effectTags = new Map()
  const terpeneLabels = new Map()
  const dispensaryNames = new Map()
  let productOrder = 0
  let categoryOrder = 0
  let effectOrder = 0
  let terpeneOrder = 0
  let dispensaryOrder = 0

  for (const entry of cannabisEntries) {
    productOrder = addRankedValue(productNames, entry?.product_name, productOrder)
    categoryOrder = addRankedValue(productCategories, entry?.category, categoryOrder)
    dispensaryOrder = addRankedValue(
      dispensaryNames,
      entry?.dispensary_name,
      dispensaryOrder,
    )
    effectOrder = collectArrayValues(effectTags, entry?.body_tags, effectOrder)
    effectOrder = collectArrayValues(effectTags, entry?.mind_tags, effectOrder)
    effectOrder = collectArrayValues(effectTags, entry?.mood_tags, effectOrder)
    terpeneOrder = collectTerpeneLabels(terpeneLabels, entry?.terpenes, terpeneOrder)
  }

  snapshot.productNames = rankedValues(
    productNames,
    PERSONALIZATION_LIMITS.productNames,
  )
  snapshot.productCategories = rankedValues(
    productCategories,
    PERSONALIZATION_LIMITS.productCategories,
  )
  snapshot.effectTags = rankedValues(
    effectTags,
    PERSONALIZATION_LIMITS.effectTags,
  )
  snapshot.terpeneLabels = rankedValues(
    terpeneLabels,
    PERSONALIZATION_LIMITS.terpeneLabels,
  )
  snapshot.dispensaryNames = rankedValues(
    dispensaryNames,
    PERSONALIZATION_LIMITS.dispensaryNames,
  )
  snapshot.previousRuns = sanitizePreviousRuns(previousRuns)
  return snapshot
}

export function weedGoblinsRunStorageKey(userId) {
  const safeUserId = cleanText(userId)
  return safeUserId
    ? `${WEED_GOBLINS_RUNS_STORAGE_PREFIX}:${safeUserId}`
    : WEED_GOBLINS_RUNS_STORAGE_PREFIX
}

function readRunSummaries(storage, userId) {
  if (!storage || typeof storage.getItem !== 'function') return []
  try {
    const raw = storage.getItem(weedGoblinsRunStorageKey(userId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

async function resolveLocalStore(explicitStore) {
  if (explicitStore) return explicitStore
  const module = await import('../../../lib/localStore.js')
  return module.localStore
}

export async function readWeedGoblinsPersonalizationSnapshot({
  store = null,
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
} = {}) {
  const localStore = await resolveLocalStore(store)
  let resolvedUserId = cleanText(userId)

  if (!resolvedUserId) {
    const authResult = await localStore.auth.getUser()
    resolvedUserId = cleanText(authResult?.data?.user?.id)
  }

  if (!resolvedUserId) return createEmptyWeedGoblinsPersonalizationSnapshot()

  const result = await localStore
    .from('entries')
    .select('*')
    .eq('user_id', resolvedUserId)

  if (result?.error) throw result.error

  return buildWeedGoblinsPersonalizationSnapshot({
    entries: result?.data || [],
    previousRuns: readRunSummaries(storage, resolvedUserId),
  })
}
