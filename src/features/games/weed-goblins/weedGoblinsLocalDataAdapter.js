const MAX_TEXT_LENGTH = 100

export const PERSONALIZATION_LIMITS = Object.freeze({
  productNames: 5,
  productCategories: 3,
  effectTags: 5,
  terpeneLabels: 5,
  fictionalLocationNames: 3,
  previousRuns: 10,
})

export const WEED_GOBLINS_RUNS_STORAGE_PREFIX =
  'my420journal_local_v1:weed_goblins_runs'

const LOCATION_NOUNS = Object.freeze([
  'Warrens',
  'Gatehouse',
  'Galleries',
  'Vaults',
  'Causeway',
  'Tribunal',
  'Bastion',
  'Cloisters',
  'Cellars',
  'Crossing',
  'Arcade',
  'Annex',
  'Repository',
  'Caverns',
  'Archives',
  'Halls',
])

const LOCATION_ADJECTIVES = Object.freeze([
  'Mossbound',
  'Copper',
  'Lantern-Lit',
  'Weathered',
  'Moonlit',
  'Quiet',
  'Gilded',
  'Hollow',
  'Emberlit',
  'Crooked',
  'Hidden',
  'Silvered',
  'Rootbound',
  'Brassbound',
  'Verdant',
  'High',
])

const LOCATION_ADJECTIVE_HINTS = Object.freeze([
  Object.freeze([/\brestore(?:d|s|ing)?\b/i, 'Restored']),
  Object.freeze([/\bjustice\b/i, 'Justiciar']),
  Object.freeze([/\bcare\b/i, 'Sheltered']),
  Object.freeze([/\bethos\b/i, 'Earnest']),
  Object.freeze([/\bbeyond\b/i, 'Far']),
  Object.freeze([/\bsunnyside\b/i, 'Sunlit']),
  Object.freeze([/\borganic\b/i, 'Rootbound']),
  Object.freeze([/\bprime\b/i, 'High']),
  Object.freeze([/\bgreen\b/i, 'Verdant']),
])

const EFFECT_TRAIT_FLAVORS = Object.freeze({
  body: Object.freeze([
    'You favor solid footing, deliberate movement, and the sort of patience that makes loose stones nervous.',
    'You carry yourself like someone who checks balance first and lets momentum arrive on schedule.',
    'You trust steady movement and physical follow-through more than dramatic shortcuts.',
  ]),
  mind: Object.freeze([
    'You approach obstacles as puzzles with suspiciously many acceptable diagrams.',
    'You notice patterns quickly and keep a second theory ready in case the first one becomes a goblin.',
    'You treat every locked door as a question that probably has footnotes.',
  ]),
  mood: Object.freeze([
    'You meet strange situations with steady good humor and an alarming willingness to greet goblins politely.',
    'You keep morale intact by treating absurdity as useful field information.',
    'You assume most situations are salvageable until the paperwork proves otherwise.',
  ]),
  neutral: Object.freeze([
    'You have developed a measured field style that is difficult for goblins to classify.',
    'Your habits suggest a practical adventurer who prefers repeatable methods over dramatic guesses.',
    'You enter the Highlands with a personal rhythm that does not require explanation.',
  ]),
})

const TERPENE_THEME_HINTS = Object.freeze([
  Object.freeze([/limonene/i, 'citrus']),
  Object.freeze([/myrcene/i, 'low-fog']),
  Object.freeze([/linalool/i, 'floral-hush']),
  Object.freeze([/caryophyllene/i, 'pepper-spark']),
  Object.freeze([/pinene/i, 'pine-shadow']),
  Object.freeze([/terpinolene/i, 'herbal-wind']),
  Object.freeze([/humulene/i, 'dry-green']),
])

const TERPENE_ENVIRONMENT_FLAVORS = Object.freeze({
  citrus: Object.freeze([
    'The Highlands air has a bright, citrus-sharp edge, and the rune-light looks almost too clean.',
    'Bright, sharp air cuts through the mist while the old stones catch a pale gold gleam.',
  ]),
  'low-fog': Object.freeze([
    'Low, heavy fog pools between the stones, making every lantern look farther away than it is.',
    'A dense low mist drapes the path and turns the lower ruins into dark islands of stone.',
  ]),
  'floral-hush': Object.freeze([
    'A pale floral hush hangs over the path, as if the moss has agreed to keep its voice down.',
    'Soft violet light gathers around the old stones while the air stays strangely quiet.',
  ]),
  'pepper-spark': Object.freeze([
    'Warm peppery sparks drift from the rune-stones whenever the path shifts underfoot.',
    'The old masonry gives off a dry, pepper-bright crackle when the wind crosses it.',
  ]),
  'pine-shadow': Object.freeze([
    'Resin-bright air and needle-dark shadows make the highland paths feel newly carved.',
    'Dark evergreen shadows stripe the route while the air stays sharp and resinous.',
  ]),
  'herbal-wind': Object.freeze([
    'The wind carries a bright herbal edge around old runes that hum when nobody touches them.',
    'Herbal-scented gusts sweep the ridge and wake faint green light in the carved stones.',
  ]),
  'dry-green': Object.freeze([
    'Dry green wind moves through the ruins and leaves the old stone smelling faintly of fields.',
    'The route feels dry and green-edged, with brittle moss whispering against the masonry.',
  ]),
  neutral: Object.freeze([
    'Thin silver mist follows the old stones, and faint rune-light gathers wherever the path narrows.',
    'Moss-lanterns burn along the route with a quiet green light that the goblins insist is normal.',
    'The Highlands carry a cool mineral haze, and the carved stones answer the wind with a low hum.',
  ]),
})

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

function normalizeRankedLabels(values) {
  if (!Array.isArray(values)) return []
  const seen = new Set()
  const labels = []
  for (const value of values) {
    const text = cleanText(value)
    const key = text.toLocaleLowerCase('en-US')
    if (!text || seen.has(key)) continue
    seen.add(key)
    labels.push(text)
    if (labels.length >= 5) break
  }
  return labels
}

function stableTextHash(value) {
  const text = cleanText(value).toLocaleLowerCase('en-US')
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function buildEffectTraitFlavor(effectTags = [], dominantGroup = 'neutral') {
  const labels = normalizeRankedLabels(effectTags)
  if (labels.length === 0) return ''

  const group = Object.hasOwn(EFFECT_TRAIT_FLAVORS, dominantGroup)
    ? dominantGroup
    : 'neutral'
  const family = EFFECT_TRAIT_FLAVORS[group]
  const hash = stableTextHash(`${group}:${labels.join('|')}`)
  return family[hash % family.length]
}

export function buildTerpeneEnvironmentFlavor(terpeneLabels = []) {
  const labels = normalizeRankedLabels(terpeneLabels)
  if (labels.length === 0) return ''

  const primary = labels[0]
  const theme = TERPENE_THEME_HINTS.find(([pattern]) => pattern.test(primary))?.[1]
    ?? 'neutral'
  const family = TERPENE_ENVIRONMENT_FLAVORS[theme]
  const hash = stableTextHash(labels.join('|'))
  return family[hash % family.length]
}

export function fictionalizeDispensaryName(value) {
  const normalized = cleanText(value)
  if (!normalized) return ''

  const hash = stableTextHash(normalized)
  const hint = LOCATION_ADJECTIVE_HINTS.find(([pattern]) => pattern.test(normalized))
  const adjective = hint?.[1]
    ?? LOCATION_ADJECTIVES[(hash >>> 8) % LOCATION_ADJECTIVES.length]
  const noun = LOCATION_NOUNS[hash % LOCATION_NOUNS.length]
  return `The ${adjective} ${noun}`
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

function countStructuredValues(values) {
  if (!Array.isArray(values)) return 0
  return values.reduce((count, value) => count + (cleanText(value) ? 1 : 0), 0)
}

function dominantEffectGroup(counts) {
  const groups = ['body', 'mind', 'mood']
  const maximum = Math.max(...groups.map((group) => counts[group] || 0))
  if (maximum <= 0) return 'neutral'
  return groups.find((group) => (counts[group] || 0) === maximum) || 'neutral'
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
    effectTraitFlavor: '',
    terpeneEnvironmentFlavor: '',
    fictionalLocationNames: [],
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

  snapshot.entryCount = entries.length
  const cannabisEntries = entries.filter(isCannabisJournalEntry)

  const productNames = new Map()
  const productCategories = new Map()
  const effectTags = new Map()
  const terpeneLabels = new Map()
  const dispensaryNames = new Map()
  const effectGroupCounts = { body: 0, mind: 0, mood: 0 }
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
    effectGroupCounts.body += countStructuredValues(entry?.body_tags)
    effectGroupCounts.mind += countStructuredValues(entry?.mind_tags)
    effectGroupCounts.mood += countStructuredValues(entry?.mood_tags)
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
  snapshot.effectTraitFlavor = buildEffectTraitFlavor(
    snapshot.effectTags,
    dominantEffectGroup(effectGroupCounts),
  )
  snapshot.terpeneEnvironmentFlavor = buildTerpeneEnvironmentFlavor(
    snapshot.terpeneLabels,
  )
  snapshot.fictionalLocationNames = rankedValues(
    dispensaryNames,
    PERSONALIZATION_LIMITS.fictionalLocationNames,
  ).map(fictionalizeDispensaryName)
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

async function resolveLocalUserId(localStore, explicitUserId) {
  let resolvedUserId = cleanText(explicitUserId)
  if (!resolvedUserId) {
    const authResult = await localStore.auth.getUser()
    resolvedUserId = cleanText(authResult?.data?.user?.id)
  }
  return resolvedUserId
}

export async function saveWeedGoblinsRunSummary({
  runSummary,
  store = null,
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
} = {}) {
  const localStore = await resolveLocalStore(store)
  const resolvedUserId = await resolveLocalUserId(localStore, userId)
  if (!resolvedUserId) throw new Error('A local user is required to save Weed Goblins history.')
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new Error('Writable local storage is required to save Weed Goblins history.')
  }

  const safeSummary = sanitizeRunSummary(runSummary)
  if (!safeSummary) throw new Error('A completed Weed Goblins run summary is required.')

  const previousRuns = sanitizePreviousRuns(readRunSummaries(storage, resolvedUserId))
  const history = sanitizePreviousRuns([...previousRuns, safeSummary])
  storage.setItem(weedGoblinsRunStorageKey(resolvedUserId), JSON.stringify(history))

  return {
    summary: safeSummary,
    history,
  }
}

export async function readWeedGoblinsPersonalizationSnapshot({
  store = null,
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
} = {}) {
  const localStore = await resolveLocalStore(store)
  const resolvedUserId = await resolveLocalUserId(localStore, userId)

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
