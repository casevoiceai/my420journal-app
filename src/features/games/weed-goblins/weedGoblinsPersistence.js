import * as prior from './weedGoblinsPersistenceThroughChapterTwo.js'
import { BACKGROUNDS } from './weedGoblinsEngine.js'
import { CHAPTER_TWO_REWARDS } from './weedGoblinsChapterTwo.js'
import {
  CHAPTER_THREE,
  CHAPTER_THREE_GROVE_STATES,
  CHAPTER_THREE_LOCATIONS,
  CHAPTER_THREE_REWARDS,
} from './weedGoblinsChapterThree.js'
import { CHAPTER_THREE_WOUNDS } from './weedGoblinsChapterThreeRuntime.js'

export const WEED_GOBLINS_ACTIVE_RUN_STORAGE_PREFIX = prior.WEED_GOBLINS_ACTIVE_RUN_STORAGE_PREFIX
export const WEED_GOBLINS_ACTIVE_RUN_VERSION = prior.WEED_GOBLINS_ACTIVE_RUN_VERSION
export const CHAPTER_TWO_ACTIVE_RUN_VERSION = prior.CHAPTER_TWO_ACTIVE_RUN_VERSION
export const CHAPTER_THREE_ACTIVE_RUN_VERSION = 3

const MAX_MESSAGES = 300
const MAX_HISTORY_EVENTS = 300
const MAX_NARRATION_LINES = 300
const MAX_RECORD_BYTES = 300_000
const CHAPTER_THREE_LOCATION_IDS = new Set(Object.values(CHAPTER_THREE_LOCATIONS).map((room) => room.id))
const CHAPTER_THREE_REWARD_VALUES = new Set(Object.values(CHAPTER_THREE_REWARDS))
const INHERITABLE_REWARD_VALUES = new Set([
  ...Object.values(CHAPTER_TWO_REWARDS),
  ...Object.values(CHAPTER_THREE_REWARDS),
])
const VALID_GROVE_STATES = new Set(CHAPTER_THREE_GROVE_STATES)

function cleanText(value, maxLength = 500) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
    : ''
}

function safeInteger(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value)
  if (!Number.isInteger(number)) return null
  return Math.min(max, Math.max(min, number))
}

function safeJsonClone(value, maxBytes = 100_000) {
  try {
    const serialized = JSON.stringify(value)
    if (!serialized || serialized.length > maxBytes) return null
    return JSON.parse(serialized)
  } catch {
    return null
  }
}

function isChapterThreeState(state) {
  return Number(state?.chapterNumber) === 3 || state?.adventureId === CHAPTER_THREE.adventureId
}

function isChapterThreeTargetSession(state) {
  return Number(state?.targetChapterNumber) === 3 && !isChapterThreeState(state)
}

function stripChapterThreeTargetTags(state) {
  if (!state || typeof state !== 'object') return state
  const {
    targetChapterNumber,
    chapterThreePersonalization,
    chapterThreePreviousRuns,
    ...base
  } = state
  return base
}

function sanitizeRoomState(roomState) {
  const safe = {}
  for (const roomId of CHAPTER_THREE_LOCATION_IDS) {
    const visit = roomState?.[roomId]
    safe[roomId] = {
      roomId,
      visited: visit?.visited === true,
      visitCount: safeInteger(visit?.visitCount, { min: 0, max: 1000 }) ?? 0,
    }
  }
  return safe
}

function sanitizeStats(stats = {}) {
  return {
    strength: safeInteger(stats.strength, { min: 0, max: 20 }) ?? 0,
    defense: safeInteger(stats.defense, { min: 0, max: 20 }) ?? 0,
    manaPool: safeInteger(stats.manaPool, { min: 0, max: 20 }) ?? 0,
    maxMana: safeInteger(stats.maxMana, { min: 0, max: 20 }) ?? 0,
  }
}

function sanitizeBackground(background) {
  const id = cleanText(background?.id, 40)
  return id && BACKGROUNDS[id] ? BACKGROUNDS[id] : null
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return []
  return history
    .slice(-MAX_HISTORY_EVENTS)
    .map((event) => safeJsonClone(event, 5000))
    .filter((event) => event && typeof event === 'object' && !Array.isArray(event))
}

function sanitizeNarration(narration) {
  if (!Array.isArray(narration)) return []
  return narration.slice(-MAX_NARRATION_LINES).map((line) => cleanText(line, 600)).filter(Boolean)
}

function sanitizeEffects(effects = {}) {
  const cleanList = (values) => Array.isArray(values)
    ? values.map((value) => cleanText(value, 100)).filter(Boolean).slice(0, 12)
    : []
  return {
    body: cleanList(effects.body),
    mind: cleanList(effects.mind),
    mood: cleanList(effects.mood),
  }
}

function sanitizeInventory(inventory) {
  if (!Array.isArray(inventory)) return []
  return [...new Set(
    inventory
      .map((value) => cleanText(value, 100))
      .filter((value) => INHERITABLE_REWARD_VALUES.has(value)),
  )]
}

function sanitizeChapterThreeFields(value = {}) {
  const chapter = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const groveState = cleanText(chapter.groveState, 60)
  return {
    memorySensation: cleanText(chapter.memorySensation, 160),
    falseCureKnown: chapter.falseCureKnown === true,
    bramblekinHeard: chapter.bramblekinHeard === true,
    corlaHeard: chapter.corlaHeard === true,
    kipWarningHeeded: chapter.kipWarningHeeded === true,
    memoryRingsSolved: chapter.memoryRingsSolved === true,
    memoryRingAttempts: safeInteger(chapter.memoryRingAttempts, { min: 0, max: 1000 }) ?? 0,
    nightlyDrawScheduleKnown: chapter.nightlyDrawScheduleKnown === true,
    waterStonesBalanced: chapter.waterStonesBalanced === true,
    waterStoneAttempts: safeInteger(chapter.waterStoneAttempts, { min: 0, max: 1000 }) ?? 0,
    stalkerBlindSpotKnown: chapter.stalkerBlindSpotKnown === true,
    stalkerOutcome: cleanText(chapter.stalkerOutcome, 100) || null,
    nurseryOutcome: cleanText(chapter.nurseryOutcome, 100) || null,
    siphonPrepared: chapter.siphonPrepared === true,
    nightlyDrawOutcome: cleanText(chapter.nightlyDrawOutcome, 100) || null,
    groveState: VALID_GROVE_STATES.has(groveState) ? groveState : null,
    majorTruth: cleanText(chapter.majorTruth, 240) || null,
    rememberedConsequence: cleanText(chapter.rememberedConsequence, 300) || null,
    bramblekinAllied: chapter.bramblekinAllied === true,
  }
}

function sanitizeChapterThreePreviousRuns(value) {
  if (!Array.isArray(value)) return []
  return value.slice(-10).map((run) => {
    if (!run || typeof run !== 'object' || Array.isArray(run)) return null
    const safe = {
      adventureId: cleanText(run.adventureId, 100),
      seed: cleanText(run.seed, 200),
      ending: cleanText(run.ending, 100),
      outcomeSummary: cleanText(run.outcomeSummary, 300),
      rootcoinRemaining: safeInteger(run.rootcoinRemaining, { min: 0, max: 99 }) ?? 0,
      chapterTwoRewards: Array.isArray(run.chapterTwoRewards)
        ? [...new Set(run.chapterTwoRewards.map((reward) => cleanText(reward, 100)).filter((reward) => INHERITABLE_REWARD_VALUES.has(reward)))]
        : [],
      chapterThreeRewards: Array.isArray(run.chapterThreeRewards)
        ? [...new Set(run.chapterThreeRewards.map((reward) => cleanText(reward, 100)).filter((reward) => CHAPTER_THREE_REWARD_VALUES.has(reward)))]
        : [],
    }
    return safe.adventureId ? safe : null
  }).filter(Boolean)
}

function sanitizeChapterThreeTargetPersonalization(value = {}) {
  return {
    memorySensation: cleanText(value?.memorySensation, 160),
  }
}

function sanitizeChapterThreeActiveState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state) || state.status !== 'active') return null
  if (!isChapterThreeState(state)) return null
  const sceneId = cleanText(state.sceneId, 100)
  const currentRoomId = cleanText(state.currentRoomId, 100)
  const seed = cleanText(state.seed, 200)
  const rngState = safeInteger(state.rngState, { min: 0, max: 0xffffffff })
  if (!sceneId || !CHAPTER_THREE_LOCATION_IDS.has(currentRoomId) || !seed || rngState === null) return null
  const flags = state.flags && typeof state.flags === 'object' ? state.flags : {}
  return {
    version: CHAPTER_THREE_ACTIVE_RUN_VERSION,
    chapterNumber: 3,
    adventureId: CHAPTER_THREE.adventureId,
    adventure: CHAPTER_THREE,
    seed,
    rngState,
    status: 'active',
    sceneId,
    currentRoomId,
    roomState: sanitizeRoomState(state.roomState),
    playerName: cleanText(state.playerName, 160) || null,
    playerRace: cleanText(state.playerRace, 80) || null,
    playerWeapon: cleanText(state.playerWeapon, 80) || null,
    playerPronoun: cleanText(state.playerPronoun, 40) || null,
    playerLook: cleanText(state.playerLook, 160) || null,
    background: sanitizeBackground(state.background),
    stats: sanitizeStats(state.stats),
    trouble: safeInteger(state.trouble, { min: 0, max: 3 }) ?? 0,
    complicationCount: safeInteger(state.complicationCount, { min: 0, max: 1000 }) ?? 0,
    priorCompletedRunCount: safeInteger(state.priorCompletedRunCount, { min: 0, max: 100000 }) ?? 0,
    narrationTier: cleanText(state.narrationTier, 60) || 'normal',
    rootcoin: safeInteger(state.rootcoin, { min: 0, max: 99 }) ?? 0,
    wound: CHAPTER_THREE_WOUNDS.includes(state.wound) ? state.wound : 'None',
    inventory: sanitizeInventory(state.inventory),
    effects: sanitizeEffects(state.effects),
    flags: {
      sessionZeroComplete: flags.sessionZeroComplete === true,
      nameSuggestionsVisible: flags.nameSuggestionsVisible === true,
    },
    chapterThree: sanitizeChapterThreeFields(state.chapterThree),
    ending: null,
    runSummary: null,
    history: sanitizeHistory(state.history),
    narration: sanitizeNarration(state.narration),
  }
}

function sanitizeMessage(message) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) return null
  const die = safeInteger(message.die, { min: 1, max: 20 })
  const rolls = Array.isArray(message.rolls)
    ? message.rolls.map((roll) => safeInteger(roll, { min: 1, max: 20 })).filter(Boolean).slice(0, 2)
    : []
  return {
    direction: message.direction === 'outgoing' ? 'outgoing' : 'incoming',
    kind: cleanText(message.kind, 40) || 'message',
    text: cleanText(message.text, 1000),
    actionId: cleanText(message.actionId, 120) || undefined,
    die,
    rolls,
    source: cleanText(message.source, 100) || 'restored',
  }
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return []
  return messages.slice(-MAX_MESSAGES).map(sanitizeMessage).filter(Boolean)
}

function sanitizeChoice(choice) {
  if (!choice || typeof choice !== 'object' || Array.isArray(choice)) return null
  const id = cleanText(choice.id, 120)
  const label = cleanText(choice.label, 240)
  if (!id || !label) return null
  return {
    id,
    label,
    detail: cleanText(choice.detail, 300) || undefined,
    inputMode: cleanText(choice.inputMode, 40) || undefined,
    playerAction: cleanText(choice.playerAction, 160) || undefined,
  }
}

function sanitizeChoices(choices) {
  if (!Array.isArray(choices)) return []
  return choices.slice(0, 8).map(sanitizeChoice).filter(Boolean)
}

function sanitizePendingTurn(pendingTurn, state) {
  if (!pendingTurn || pendingTurn.requiresRoll !== true) return null
  const plan = safeJsonClone(pendingTurn.plan, 10_000)
  const checkPreview = safeJsonClone(pendingTurn.checkPreview, 3000)
  if (!plan || !checkPreview || checkPreview.requiresRoll !== true) return null
  return {
    before: state,
    plan,
    checkPreview,
    requiresRoll: true,
    outgoingMessage: sanitizeMessage(pendingTurn.outgoingMessage),
    setupMessage: sanitizeMessage(pendingTurn.setupMessage),
    rollTriggerMessage: sanitizeMessage(pendingTurn.rollTriggerMessage),
  }
}

function sanitizeHelpMessage(helpMessage) {
  if (!helpMessage || typeof helpMessage !== 'object') return null
  const text = cleanText(helpMessage.text, 1000)
  if (!text) return null
  return {
    level: safeInteger(helpMessage.level, { min: 1, max: 3 }) ?? undefined,
    text,
    solvesObstacle: helpMessage.solvesObstacle === true,
  }
}

function createChapterThreeTargetRecord(session = {}) {
  const baseState = stripChapterThreeTargetTags(session.state)
  const baseRecord = prior.createWeedGoblinsActiveRunRecord({ ...session, state: baseState })
  if (!baseRecord?.state) return null
  return {
    ...baseRecord,
    version: CHAPTER_THREE_ACTIVE_RUN_VERSION,
    state: {
      ...baseRecord.state,
      targetChapterNumber: 3,
      chapterThreePersonalization: sanitizeChapterThreeTargetPersonalization(session.state?.chapterThreePersonalization),
      chapterThreePreviousRuns: sanitizeChapterThreePreviousRuns(session.state?.chapterThreePreviousRuns),
    },
  }
}

function createChapterThreeActiveRecord({
  state,
  messages = [],
  choices = [],
  pendingTurn = null,
  helpLevel = 0,
  helpMessage = null,
} = {}) {
  const safeState = sanitizeChapterThreeActiveState(state)
  if (!safeState) return null
  const safePendingTurn = sanitizePendingTurn(pendingTurn, safeState)
  return {
    version: CHAPTER_THREE_ACTIVE_RUN_VERSION,
    state: safeState,
    messages: sanitizeMessages(messages),
    choices: safePendingTurn ? [] : sanitizeChoices(choices),
    pendingTurn: safePendingTurn,
    helpLevel: safeInteger(helpLevel, { min: 0, max: 3 }) ?? 0,
    helpMessage: sanitizeHelpMessage(helpMessage),
  }
}

export function weedGoblinsActiveRunStorageKey(userId) {
  return prior.weedGoblinsActiveRunStorageKey(userId)
}

export function sanitizeWeedGoblinsActiveState(state) {
  if (isChapterThreeState(state)) return sanitizeChapterThreeActiveState(state)
  if (isChapterThreeTargetSession(state)) return createChapterThreeTargetRecord({ state })?.state || null
  return prior.sanitizeWeedGoblinsActiveState(state)
}

export function createWeedGoblinsActiveRunRecord(session = {}) {
  if (isChapterThreeState(session.state)) return createChapterThreeActiveRecord(session)
  if (isChapterThreeTargetSession(session.state)) return createChapterThreeTargetRecord(session)
  return prior.createWeedGoblinsActiveRunRecord(session)
}

export function saveWeedGoblinsActiveRun({
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
  ...session
} = {}) {
  if (!isChapterThreeState(session.state) && !isChapterThreeTargetSession(session.state)) {
    return prior.saveWeedGoblinsActiveRun({ storage, userId, ...session })
  }
  if (!storage || typeof storage.setItem !== 'function') return null
  const key = weedGoblinsActiveRunStorageKey(userId)
  if (session.state?.status === 'completed') {
    if (typeof storage.removeItem === 'function') storage.removeItem(key)
    return null
  }
  const record = createWeedGoblinsActiveRunRecord(session)
  if (!record) return null
  const serialized = JSON.stringify(record)
  if (serialized.length > MAX_RECORD_BYTES) return null
  storage.setItem(key, serialized)
  return record
}

export function readWeedGoblinsActiveRun({
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
} = {}) {
  if (!storage || typeof storage.getItem !== 'function') return null
  const key = weedGoblinsActiveRunStorageKey(userId)
  let parsed
  try {
    const raw = storage.getItem(key)
    if (!raw || raw.length > MAX_RECORD_BYTES) return null
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (parsed?.version !== CHAPTER_THREE_ACTIVE_RUN_VERSION) {
    return prior.readWeedGoblinsActiveRun({ storage, userId })
  }
  if (isChapterThreeTargetSession(parsed.state)) return createChapterThreeTargetRecord(parsed)
  if (isChapterThreeState(parsed.state)) return createChapterThreeActiveRecord(parsed)
  return null
}

export function clearWeedGoblinsActiveRun(options = {}) {
  return prior.clearWeedGoblinsActiveRun(options)
}
