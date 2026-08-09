import * as legacy from './weedGoblinsLocalDataAdapterChapterOne.js'
import { attachWeedGoblinsProgressionMetadata } from './weedGoblinsProgression.js'
import {
  CHAPTER_TWO,
  CHAPTER_TWO_MARKET_STATES,
  CHAPTER_TWO_REWARDS,
} from './weedGoblinsChapterTwo.js'
import { CHAPTER_TWO_WOUNDS } from './weedGoblinsChapterTwoRuntime.js'

export * from './weedGoblinsLocalDataAdapterChapterOne.js'

const MAX_TEXT_LENGTH = 120
const VALID_MARKET_STATES = new Set(CHAPTER_TWO_MARKET_STATES)
const VALID_REWARDS = new Set(Object.values(CHAPTER_TWO_REWARDS))
const ENTRY_PRICES = new Set(['coin', 'memory', 'favor', 'none'])

function cleanText(value, maxLength = MAX_TEXT_LENGTH) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
    : ''
}

function safeInteger(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  return Math.min(max, Math.max(min, Math.floor(number)))
}

function sanitizeRewards(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((reward) => cleanText(reward, 100)).filter((reward) => VALID_REWARDS.has(reward)))]
}

function sanitizeChapterTwoBranches(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const entryPrice = cleanText(value.entryPrice, 40)
  const marketState = cleanText(value.marketState, 80)
  const safe = {
    entryPrice: ENTRY_PRICES.has(entryPrice) ? entryPrice : 'none',
    marketState: VALID_MARKET_STATES.has(marketState) ? marketState : 'operational',
    ledgerDisposition: cleanText(value.ledgerDisposition, 100) || 'unresolved',
    collectorOutcome: cleanText(value.collectorOutcome, 100) || 'unresolved',
    wardenSettlement: cleanText(value.wardenSettlement, 100) || 'unresolved',
    recognizedStall: cleanText(value.recognizedStall, 120) || 'sealed field-goods stall',
  }
  return safe
}

function sanitizeChapterTwoRunSummary(summary) {
  if (!summary || summary.adventureId !== CHAPTER_TWO.adventureId) return null
  const metadata = attachWeedGoblinsProgressionMetadata(summary)
  const safe = {
    adventureId: CHAPTER_TWO.adventureId,
    seed: cleanText(metadata.seed, 200),
    gameId: cleanText(metadata.gameId, 80),
    chapterId: cleanText(metadata.chapterId, 80),
    chapterNumber: safeInteger(metadata.chapterNumber, { min: 1, max: 99 }) ?? 2,
    chapterTitle: cleanText(metadata.chapterTitle, 120),
    questId: cleanText(metadata.questId, 80),
    questNumber: safeInteger(metadata.questNumber, { min: 1, max: 99 }) ?? 1,
    questTitle: cleanText(metadata.questTitle, 120),
    backgroundId: cleanText(metadata.backgroundId, 80),
    ending: cleanText(metadata.ending, 100),
    outcomeSummary: cleanText(metadata.outcomeSummary, 300),
    trouble: safeInteger(metadata.trouble, { min: 0, max: 3 }) ?? 0,
    manaRemaining: safeInteger(metadata.manaRemaining, { min: 0, max: 20 }) ?? 0,
    complicationCount: safeInteger(metadata.complicationCount, { min: 0, max: 1000 }) ?? 0,
    narrationTier: cleanText(metadata.narrationTier, 80) || 'normal',
    reason: cleanText(metadata.reason, 160),
    rootcoinRemaining: safeInteger(metadata.rootcoinRemaining, { min: 0, max: 99 }) ?? 0,
    wound: CHAPTER_TWO_WOUNDS.includes(metadata.wound) ? metadata.wound : 'None',
    chapterTwoBranches: sanitizeChapterTwoBranches(metadata.chapterTwoBranches),
    chapterTwoRewards: sanitizeRewards(metadata.chapterTwoRewards),
  }
  for (const key of Object.keys(safe)) {
    if (safe[key] === '' || safe[key] === null || safe[key] === undefined) delete safe[key]
  }
  return safe
}

function sanitizeStoredChapterTwoRun(run) {
  if (!run || run.adventureId !== CHAPTER_TWO.adventureId) return null
  return sanitizeChapterTwoRunSummary(run)
}

function sanitizeChapterTwoCampaign(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const completedRunCount = safeInteger(value.completedRunCount, { min: 0, max: 100000 }) ?? 0
  if (completedRunCount <= 0 && !cleanText(value.lastRunSeed, 200)) return null
  const marketState = cleanText(value.marketState, 80)
  return {
    completedRunCount,
    lastRunSeed: cleanText(value.lastRunSeed, 200),
    lastEnding: cleanText(value.lastEnding, 100),
    marketState: VALID_MARKET_STATES.has(marketState) ? marketState : 'operational',
    latestBranches: sanitizeChapterTwoBranches(value.latestBranches) || sanitizeChapterTwoBranches({}),
    rewards: sanitizeRewards(value.rewards),
    rootcoin: safeInteger(value.rootcoin, { min: 0, max: 99 }) ?? 0,
    wound: CHAPTER_TWO_WOUNDS.includes(value.wound) ? value.wound : 'None',
  }
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
  if (!storage || typeof storage.setItem !== 'function') return
  storage.setItem(key, JSON.stringify(value))
}

async function resolveLocalStore(explicitStore) {
  if (explicitStore) return explicitStore
  const module = await import('../../../lib/localStore.js')
  return module.localStore
}

async function resolveUserId(store, explicitUserId) {
  const supplied = cleanText(explicitUserId, 100)
  if (supplied) return supplied
  const result = await store.auth.getUser()
  return cleanText(result?.data?.user?.id, 100)
}

function previousSafeHistory(storage, userId) {
  const key = legacy.weedGoblinsRunStorageKey(userId)
  const raw = readJson(storage, key, [])
  if (!Array.isArray(raw)) return []

  const recent = raw.slice(-10)
  const legacySafe = legacy.buildWeedGoblinsPersonalizationSnapshot({
    entries: [],
    previousRuns: recent,
  }).previousRuns
  const chapterTwoBySeed = new Map(
    recent
      .filter((run) => run?.adventureId === CHAPTER_TWO.adventureId)
      .map(sanitizeStoredChapterTwoRun)
      .filter(Boolean)
      .map((run) => [cleanText(run.seed, 200), run]),
  )

  return legacySafe.map((run) => {
    if (run?.adventureId !== CHAPTER_TWO.adventureId) return run
    return chapterTwoBySeed.get(cleanText(run.seed, 200)) || run
  })
}

function mergeSafeChapterTwoHistory(history, chapterTwoSummary) {
  const withoutSameSeed = history.filter((run) => !(
    run?.adventureId === CHAPTER_TWO.adventureId
    && chapterTwoSummary.seed
    && cleanText(run.seed, 200) === chapterTwoSummary.seed
  ))
  return [...withoutSameSeed, chapterTwoSummary].slice(-10)
}

function campaignStateWithChapterTwo(baseCampaign, storedCampaign) {
  const chapterTwo = sanitizeChapterTwoCampaign(storedCampaign?.chapterTwo)
  return chapterTwo ? { ...baseCampaign, chapterTwo } : baseCampaign
}

function advanceChapterTwoCampaign(baseCampaign, priorCampaign, summary, wasExistingSeed) {
  const previous = sanitizeChapterTwoCampaign(priorCampaign?.chapterTwo) || {
    completedRunCount: 0,
    lastRunSeed: '',
    lastEnding: '',
    marketState: 'operational',
    latestBranches: sanitizeChapterTwoBranches({}),
    rewards: [],
    rootcoin: 0,
    wound: 'None',
  }
  const branches = sanitizeChapterTwoBranches(summary.chapterTwoBranches) || previous.latestBranches
  const rewards = sanitizeRewards([...previous.rewards, ...sanitizeRewards(summary.chapterTwoRewards)])
  const next = {
    completedRunCount: previous.completedRunCount + (wasExistingSeed ? 0 : 1),
    lastRunSeed: summary.seed || previous.lastRunSeed,
    lastEnding: summary.ending || previous.lastEnding,
    marketState: branches.marketState,
    latestBranches: branches,
    rewards,
    rootcoin: safeInteger(summary.rootcoinRemaining, { min: 0, max: 99 }) ?? previous.rootcoin,
    wound: CHAPTER_TWO_WOUNDS.includes(summary.wound) ? summary.wound : previous.wound,
  }
  const totalCompleted = Math.max(
    0,
    Number(baseCampaign.completedRunCount) || 0,
  )
  return {
    ...baseCampaign,
    completedRunCount: wasExistingSeed ? Math.max(0, totalCompleted - 1) : totalCompleted,
    chapterTwo: next,
  }
}

export async function saveWeedGoblinsRunSummary({
  runSummary,
  store = null,
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
} = {}) {
  if (runSummary?.adventureId !== CHAPTER_TWO.adventureId) {
    const localStore = await resolveLocalStore(store)
    const resolvedUserId = await resolveUserId(localStore, userId)
    const priorCampaign = readJson(storage, legacy.weedGoblinsCampaignStorageKey(resolvedUserId), {})
    const result = await legacy.saveWeedGoblinsRunSummary({ runSummary, store: localStore, storage, userId: resolvedUserId })
    const chapterTwo = sanitizeChapterTwoCampaign(priorCampaign?.chapterTwo)
    if (!chapterTwo) return result
    const campaignState = { ...result.campaignState, chapterTwo }
    writeJson(storage, legacy.weedGoblinsCampaignStorageKey(resolvedUserId), campaignState)
    return { ...result, campaignState }
  }

  const localStore = await resolveLocalStore(store)
  const resolvedUserId = await resolveUserId(localStore, userId)
  if (!resolvedUserId) throw new Error('A local user is required to save Weed Goblins history.')
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new Error('Writable local storage is required to save Weed Goblins history.')
  }

  const safeChapterTwo = sanitizeChapterTwoRunSummary(runSummary)
  if (!safeChapterTwo) throw new Error('A completed Chapter 2 run summary is required.')
  const historyBefore = previousSafeHistory(storage, resolvedUserId)
  const wasExistingSeed = Boolean(safeChapterTwo.seed) && historyBefore.some((run) => (
    run?.adventureId === CHAPTER_TWO.adventureId
    && cleanText(run.seed, 200) === safeChapterTwo.seed
  ))
  const priorCampaign = readJson(storage, legacy.weedGoblinsCampaignStorageKey(resolvedUserId), {})

  const base = await legacy.saveWeedGoblinsRunSummary({
    runSummary,
    store: localStore,
    storage,
    userId: resolvedUserId,
  })

  const history = mergeSafeChapterTwoHistory(previousSafeHistory(storage, resolvedUserId), safeChapterTwo)
  writeJson(storage, legacy.weedGoblinsRunStorageKey(resolvedUserId), history)

  const campaignState = advanceChapterTwoCampaign(base.campaignState, priorCampaign, safeChapterTwo, wasExistingSeed)
  writeJson(storage, legacy.weedGoblinsCampaignStorageKey(resolvedUserId), campaignState)

  return {
    summary: safeChapterTwo,
    history,
    campaignState,
  }
}

export async function readWeedGoblinsCampaignState({
  store = null,
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
} = {}) {
  const localStore = await resolveLocalStore(store)
  const resolvedUserId = await resolveUserId(localStore, userId)
  const base = await legacy.readWeedGoblinsCampaignState({ store: localStore, storage, userId: resolvedUserId })
  if (!resolvedUserId) return base
  const stored = readJson(storage, legacy.weedGoblinsCampaignStorageKey(resolvedUserId), {})
  return campaignStateWithChapterTwo(base, stored)
}

export async function readWeedGoblinsLocalContext({
  store = null,
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
} = {}) {
  const localStore = await resolveLocalStore(store)
  const resolvedUserId = await resolveUserId(localStore, userId)
  const base = await legacy.readWeedGoblinsLocalContext({ store: localStore, storage, userId: resolvedUserId })
  if (!resolvedUserId) return base
  const history = previousSafeHistory(storage, resolvedUserId)
  const storedCampaign = readJson(storage, legacy.weedGoblinsCampaignStorageKey(resolvedUserId), {})
  return {
    ...base,
    snapshot: {
      ...base.snapshot,
      previousRuns: history,
    },
    campaignState: campaignStateWithChapterTwo(base.campaignState, storedCampaign),
  }
}

export async function readWeedGoblinsPersonalizationSnapshot(options = {}) {
  const context = await readWeedGoblinsLocalContext(options)
  return context.snapshot
}
