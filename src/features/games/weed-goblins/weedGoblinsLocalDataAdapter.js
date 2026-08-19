import * as prior from './weedGoblinsLocalDataAdapterThroughChapterTwo.js'
import { attachWeedGoblinsProgressionMetadata } from './weedGoblinsProgression.js'
import {
  CHAPTER_THREE,
  CHAPTER_THREE_GROVE_STATES,
  CHAPTER_THREE_REWARDS,
} from './weedGoblinsChapterThree.js'
import { CHAPTER_THREE_WOUNDS } from './weedGoblinsChapterThreeRuntime.js'

export * from './weedGoblinsLocalDataAdapterThroughChapterTwo.js'

const VALID_GROVE_STATES = new Set(CHAPTER_THREE_GROVE_STATES)
const VALID_REWARDS = new Set(Object.values(CHAPTER_THREE_REWARDS))

function cleanText(value, maxLength = 120) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
    : ''
}

function safeInteger(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  return Math.min(max, Math.max(min, Math.floor(number)))
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

function sanitizeRewards(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((reward) => cleanText(reward, 100)).filter((reward) => VALID_REWARDS.has(reward)))]
}

function sanitizeChapterThreeBranches(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const groveState = cleanText(value.groveState, 60)
  return {
    groveState: VALID_GROVE_STATES.has(groveState) ? groveState : 'drained',
    falseCureKnown: value.falseCureKnown === true,
    kipWarningHeeded: value.kipWarningHeeded === true,
    stalkerOutcome: cleanText(value.stalkerOutcome, 100) || 'unresolved',
    nurseryOutcome: cleanText(value.nurseryOutcome, 100) || 'unresolved',
    nightlyDrawOutcome: cleanText(value.nightlyDrawOutcome, 100) || 'unresolved',
    bramblekinAllied: value.bramblekinAllied === true,
    majorTruth: cleanText(value.majorTruth, 240) || 'The Cultivator is feeding through a deeper root network.',
    rememberedConsequence: cleanText(value.rememberedConsequence, 300),
  }
}

function sanitizeChapterThreeRunSummary(summary) {
  if (!summary || summary.adventureId !== CHAPTER_THREE.adventureId) return null
  const metadata = attachWeedGoblinsProgressionMetadata(summary)
  const safe = {
    adventureId: CHAPTER_THREE.adventureId,
    seed: cleanText(metadata.seed, 200),
    gameId: cleanText(metadata.gameId, 80),
    chapterId: cleanText(metadata.chapterId, 80),
    chapterNumber: safeInteger(metadata.chapterNumber, { min: 1, max: 99 }) ?? 3,
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
    wound: CHAPTER_THREE_WOUNDS.includes(metadata.wound) ? metadata.wound : 'None',
    chapterThreeBranches: sanitizeChapterThreeBranches(metadata.chapterThreeBranches),
    chapterThreeRewards: sanitizeRewards(metadata.chapterThreeRewards),
  }
  for (const key of Object.keys(safe)) {
    if (safe[key] === '' || safe[key] === null || safe[key] === undefined) delete safe[key]
  }
  return safe
}

function sanitizeChapterThreeCampaign(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const completedRunCount = safeInteger(value.completedRunCount, { min: 0, max: 100000 }) ?? 0
  if (completedRunCount <= 0 && !cleanText(value.lastRunSeed, 200)) return null
  return {
    completedRunCount,
    lastRunSeed: cleanText(value.lastRunSeed, 200),
    lastEnding: cleanText(value.lastEnding, 100),
    groveState: VALID_GROVE_STATES.has(cleanText(value.groveState, 60)) ? cleanText(value.groveState, 60) : 'drained',
    latestBranches: sanitizeChapterThreeBranches(value.latestBranches) || sanitizeChapterThreeBranches({}),
    rewards: sanitizeRewards(value.rewards),
    rootcoin: safeInteger(value.rootcoin, { min: 0, max: 99 }) ?? 0,
    wound: CHAPTER_THREE_WOUNDS.includes(value.wound) ? value.wound : 'None',
  }
}

function campaignStateWithChapterThree(baseCampaign, storedCampaign) {
  const chapterThree = sanitizeChapterThreeCampaign(storedCampaign?.chapterThree)
  return chapterThree ? { ...baseCampaign, chapterThree } : baseCampaign
}

function enrichChapterThreeHistory(baseHistory, storage, userId) {
  if (!Array.isArray(baseHistory)) return []
  const raw = readJson(storage, prior.weedGoblinsRunStorageKey(userId), [])
  if (!Array.isArray(raw)) return baseHistory
  const chapterThreeBySeed = new Map(
    raw
      .filter((run) => run?.adventureId === CHAPTER_THREE.adventureId)
      .map(sanitizeChapterThreeRunSummary)
      .filter(Boolean)
      .map((run) => [cleanText(run.seed, 200), run]),
  )
  return baseHistory.map((run) => {
    if (run?.adventureId !== CHAPTER_THREE.adventureId) return run
    return chapterThreeBySeed.get(cleanText(run.seed, 200)) || run
  })
}

function mergeChapterThreeHistory(baseHistory, summary) {
  const withoutSameSeed = baseHistory.filter((run) => !(
    run?.adventureId === CHAPTER_THREE.adventureId
    && summary.seed
    && cleanText(run.seed, 200) === summary.seed
  ))
  return [...withoutSameSeed, summary].slice(-10)
}

function advanceChapterThreeCampaign(baseCampaign, priorCampaign, summary, wasExistingSeed) {
  const previous = sanitizeChapterThreeCampaign(priorCampaign?.chapterThree) || {
    completedRunCount: 0,
    lastRunSeed: '',
    lastEnding: '',
    groveState: 'drained',
    latestBranches: sanitizeChapterThreeBranches({}),
    rewards: [],
    rootcoin: 0,
    wound: 'None',
  }
  const branches = sanitizeChapterThreeBranches(summary.chapterThreeBranches) || previous.latestBranches
  return {
    ...baseCampaign,
    chapterThree: {
      completedRunCount: previous.completedRunCount + (wasExistingSeed ? 0 : 1),
      lastRunSeed: summary.seed || previous.lastRunSeed,
      lastEnding: summary.ending || previous.lastEnding,
      groveState: branches.groveState,
      latestBranches: branches,
      rewards: sanitizeRewards([...previous.rewards, ...sanitizeRewards(summary.chapterThreeRewards)]),
      rootcoin: safeInteger(summary.rootcoinRemaining, { min: 0, max: 99 }) ?? previous.rootcoin,
      wound: CHAPTER_THREE_WOUNDS.includes(summary.wound) ? summary.wound : previous.wound,
    },
  }
}

export async function saveWeedGoblinsRunSummary({
  runSummary,
  store = null,
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
} = {}) {
  const localStore = await resolveLocalStore(store)
  const resolvedUserId = await resolveUserId(localStore, userId)
  const campaignKey = resolvedUserId ? prior.weedGoblinsCampaignStorageKey(resolvedUserId) : null
  const priorCampaign = campaignKey ? readJson(storage, campaignKey, {}) : {}

  if (runSummary?.adventureId !== CHAPTER_THREE.adventureId) {
    const result = await prior.saveWeedGoblinsRunSummary({ runSummary, store: localStore, storage, userId: resolvedUserId })
    const chapterThree = sanitizeChapterThreeCampaign(priorCampaign?.chapterThree)
    if (!chapterThree || !resolvedUserId) return result
    const campaignState = { ...result.campaignState, chapterThree }
    writeJson(storage, campaignKey, campaignState)
    return { ...result, campaignState }
  }

  if (!resolvedUserId) throw new Error('A local user is required to save Weed Goblins history.')
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new Error('Writable local storage is required to save Weed Goblins history.')
  }
  const safeSummary = sanitizeChapterThreeRunSummary(runSummary)
  if (!safeSummary) throw new Error('A completed Chapter 3 run summary is required.')

  const historyBefore = readJson(storage, prior.weedGoblinsRunStorageKey(resolvedUserId), [])
  const wasExistingSeed = Boolean(safeSummary.seed) && Array.isArray(historyBefore) && historyBefore.some((run) => (
    run?.adventureId === CHAPTER_THREE.adventureId
    && cleanText(run.seed, 200) === safeSummary.seed
  ))

  const base = await prior.saveWeedGoblinsRunSummary({
    runSummary,
    store: localStore,
    storage,
    userId: resolvedUserId,
  })
  const enriched = enrichChapterThreeHistory(base.history, storage, resolvedUserId)
  const history = mergeChapterThreeHistory(enriched, safeSummary)
  writeJson(storage, prior.weedGoblinsRunStorageKey(resolvedUserId), history)

  const campaignState = advanceChapterThreeCampaign(base.campaignState, priorCampaign, safeSummary, wasExistingSeed)
  writeJson(storage, campaignKey, campaignState)
  return { summary: safeSummary, history, campaignState }
}

export async function readWeedGoblinsCampaignState({
  store = null,
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
} = {}) {
  const localStore = await resolveLocalStore(store)
  const resolvedUserId = await resolveUserId(localStore, userId)
  const base = await prior.readWeedGoblinsCampaignState({ store: localStore, storage, userId: resolvedUserId })
  if (!resolvedUserId) return base
  const stored = readJson(storage, prior.weedGoblinsCampaignStorageKey(resolvedUserId), {})
  return campaignStateWithChapterThree(base, stored)
}

export async function readWeedGoblinsLocalContext({
  store = null,
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
} = {}) {
  const localStore = await resolveLocalStore(store)
  const resolvedUserId = await resolveUserId(localStore, userId)
  const base = await prior.readWeedGoblinsLocalContext({ store: localStore, storage, userId: resolvedUserId })
  if (!resolvedUserId) return base
  const storedCampaign = readJson(storage, prior.weedGoblinsCampaignStorageKey(resolvedUserId), {})
  return {
    ...base,
    snapshot: {
      ...base.snapshot,
      previousRuns: enrichChapterThreeHistory(base.snapshot?.previousRuns || [], storage, resolvedUserId),
    },
    campaignState: campaignStateWithChapterThree(base.campaignState, storedCampaign),
  }
}

export async function readWeedGoblinsPersonalizationSnapshot(options = {}) {
  const context = await readWeedGoblinsLocalContext(options)
  return context.snapshot
}
