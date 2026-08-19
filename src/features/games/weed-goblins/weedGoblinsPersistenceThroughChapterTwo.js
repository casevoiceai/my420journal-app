import * as legacy from './weedGoblinsPersistenceChapterOne.js'
import { BACKGROUNDS, FIXED_TEST_ADVENTURE } from './weedGoblinsEngine.js'
import {
  CHAPTER_TWO,
  CHAPTER_TWO_LOCATIONS,
  CHAPTER_TWO_REWARDS,
} from './weedGoblinsChapterTwo.js'
import { CHAPTER_TWO_WOUNDS } from './weedGoblinsChapterTwoRuntime.js'

export const WEED_GOBLINS_ACTIVE_RUN_STORAGE_PREFIX = legacy.WEED_GOBLINS_ACTIVE_RUN_STORAGE_PREFIX
export const WEED_GOBLINS_ACTIVE_RUN_VERSION = legacy.WEED_GOBLINS_ACTIVE_RUN_VERSION
export const CHAPTER_TWO_ACTIVE_RUN_VERSION = 2

const MAX_MESSAGES = 300
const MAX_HISTORY_EVENTS = 300
const MAX_NARRATION_LINES = 300
const MAX_RECORD_BYTES = 300_000
const CHAPTER_TWO_LOCATION_IDS = new Set(Object.values(CHAPTER_TWO_LOCATIONS).map((room) => room.id))
const CHAPTER_TWO_REWARD_VALUES = new Set(Object.values(CHAPTER_TWO_REWARDS))

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

function isChapterTwoState(state) {
  return Number(state?.chapterNumber) === 2 || state?.adventureId === CHAPTER_TWO.adventureId
}

function isChapterTwoTargetSession(state) {
  return Number(state?.targetChapterNumber) === 2 && state?.adventureId === FIXED_TEST_ADVENTURE.id
}

function sanitizeRoomState(roomState, allowedRoomIds) {
  const safe = {}
  for (const roomId of allowedRoomIds) {
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
  return narration
    .slice(-MAX_NARRATION_LINES)
    .map((line) => cleanText(line, 600))
    .filter(Boolean)
}

function sanitizeChapterTwoPersonalization(value = {}) {
  return {
    recognizedStall: cleanText(value.recognizedStall, 120) || 'sealed field-goods stall',
    counterfeitItem: cleanText(value.counterfeitItem, 120) || 'counterfeit field parcel',
  }
}

function sanitizeChapterTwoPreviousRuns(value) {
  if (!Array.isArray(value)) return []
  return value.slice(-10).map((run) => {
    if (!run || typeof run !== 'object' || Array.isArray(run)) return null
    const safe = {
      adventureId: cleanText(run.adventureId, 100),
      seed: cleanText(run.seed, 200),
      ending: cleanText(run.ending, 80),
      outcomeSummary: cleanText(run.outcomeSummary, 240),
      rootcoinRemaining: safeInteger(run.rootcoinRemaining, { min: 0, max: 99 }) ?? 0,
      wound: CHAPTER_TWO_WOUNDS.includes(run.wound) ? run.wound : 'None',
      chapterTwoRewards: Array.isArray(run.chapterTwoRewards)
        ? [...new Set(run.chapterTwoRewards.map((reward) => cleanText(reward, 100)).filter((reward) => CHAPTER_TWO_REWARD_VALUES.has(reward)))]
        : [],
    }
    return safe.adventureId ? safe : null
  }).filter(Boolean)
}

function sanitizeChapterTwoStateFields(state) {
  const chapter = state?.chapterTwo && typeof state.chapterTwo === 'object' ? state.chapterTwo : {}
  return {
    lanternSolved: chapter.lanternSolved === true,
    lanternAttempts: safeInteger(chapter.lanternAttempts, { min: 0, max: 1000 }) ?? 0,
    entryPrice: cleanText(chapter.entryPrice, 40) || null,
    favorOwed: chapter.favorOwed === true,
    recognizedStall: cleanText(chapter.recognizedStall, 120) || 'sealed field-goods stall',
    counterfeitItem: cleanText(chapter.counterfeitItem, 120) || 'counterfeit field parcel',
    merchantClues: Array.isArray(chapter.merchantClues)
      ? [...new Set(chapter.merchantClues.map((value) => cleanText(value, 80)).filter(Boolean))].slice(0, 4)
      : [],
    receiptClue: chapter.receiptClue === true,
    ledgerResolution: cleanText(chapter.ledgerResolution, 100) || null,
    ledgerRearrangements: safeInteger(chapter.ledgerRearrangements, { min: 0, max: 1000 }) ?? 0,
    collectorOutcome: cleanText(chapter.collectorOutcome, 100) || null,
    ledgerDisposition: cleanText(chapter.ledgerDisposition, 100) || null,
    marketState: cleanText(chapter.marketState, 80) || 'operational',
    wardenSettlement: cleanText(chapter.wardenSettlement, 100) || null,
  }
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

function sanitizeV2ActiveState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state) || state.status !== 'active') return null
  if (!isChapterTwoState(state) && !isChapterTwoTargetSession(state)) return null

  const isTargetSession = isChapterTwoTargetSession(state)
  const sceneId = cleanText(state.sceneId, 100)
  const currentRoomId = cleanText(state.currentRoomId, 100)
  const seed = cleanText(state.seed, 200)
  const rngState = safeInteger(state.rngState, { min: 0, max: 0xffffffff })
  if (!sceneId || !currentRoomId || !seed || rngState === null) return null

  if (!isTargetSession && !CHAPTER_TWO_LOCATION_IDS.has(currentRoomId)) return null

  const flags = state.flags && typeof state.flags === 'object' ? state.flags : {}
  const base = {
    version: CHAPTER_TWO_ACTIVE_RUN_VERSION,
    adventureId: isTargetSession ? FIXED_TEST_ADVENTURE.id : CHAPTER_TWO.adventureId,
    adventure: isTargetSession ? FIXED_TEST_ADVENTURE : CHAPTER_TWO,
    seed,
    rngState,
    status: 'active',
    sceneId,
    currentRoomId,
    roomState: isTargetSession
      ? safeJsonClone(state.roomState, 10_000) || {}
      : sanitizeRoomState(state.roomState, CHAPTER_TWO_LOCATION_IDS),
    playerName: cleanText(state.playerName, 160) || null,
    playerRace: cleanText(state.playerRace, 80) || null,
    playerWeapon: cleanText(state.playerWeapon, 80) || null,
    playerPronoun: cleanText(state.playerPronoun, 40) || null,
    playerLook: cleanText(state.playerLook, 160) || null,
    returningLine: cleanText(state.returningLine, 300) || null,
    background: sanitizeBackground(state.background),
    stats: sanitizeStats(state.stats),
    trouble: safeInteger(state.trouble, { min: 0, max: 3 }) ?? 0,
    complicationCount: safeInteger(state.complicationCount, { min: 0, max: 1000 }) ?? 0,
    priorCompletedRunCount: safeInteger(state.priorCompletedRunCount, { min: 0, max: 100000 }) ?? 0,
    narrationTier: cleanText(state.narrationTier, 60) || 'normal',
    flags: {
      sessionZeroComplete: flags.sessionZeroComplete === true,
      nameSuggestionsVisible: flags.nameSuggestionsVisible === true,
    },
    ending: null,
    runSummary: null,
    history: sanitizeHistory(state.history),
    narration: sanitizeNarration(state.narration),
  }

  if (isTargetSession) {
    return {
      ...base,
      targetChapterNumber: 2,
      chapterTwoPersonalization: sanitizeChapterTwoPersonalization(state.chapterTwoPersonalization),
      chapterTwoPreviousRuns: sanitizeChapterTwoPreviousRuns(state.chapterTwoPreviousRuns),
      stolenItem: cleanText(state.stolenItem, 200),
      goblinName: cleanText(state.goblinName, 120),
      fictionalLocationName: cleanText(state.fictionalLocationName, 160) || null,
      characterTraitFlavor: cleanText(state.characterTraitFlavor, 300),
      environmentThemeFlavor: cleanText(state.environmentThemeFlavor, 300),
      flags: {
        ...base.flags,
        routeId: cleanText(flags.routeId, 40) || null,
        midpointChoice: cleanText(flags.midpointChoice, 60) || null,
        goblinAlly: flags.goblinAlly === true,
        goblinFavor: flags.goblinFavor === true,
        hasHighlandCharm: flags.hasHighlandCharm === true,
        blackRootSealKnown: flags.blackRootSealKnown === true,
        nibTreatment: cleanText(flags.nibTreatment, 40) || null,
        tributeArrangement: cleanText(flags.tributeArrangement, 40) || null,
        kingTreatment: cleanText(flags.kingTreatment, 40) || null,
        latchOutcome: cleanText(flags.latchOutcome, 60) || null,
        bossDcModifier: Number.isFinite(Number(flags.bossDcModifier)) ? Math.trunc(Number(flags.bossDcModifier)) : 0,
      },
    }
  }

  return {
    ...base,
    chapterNumber: 2,
    rootcoin: safeInteger(state.rootcoin, { min: 0, max: 99 }) ?? 0,
    wound: CHAPTER_TWO_WOUNDS.includes(state.wound) ? state.wound : 'None',
    inventory: Array.isArray(state.inventory)
      ? [...new Set(state.inventory.map((reward) => cleanText(reward, 100)).filter((reward) => CHAPTER_TWO_REWARD_VALUES.has(reward)))]
      : [],
    effects: sanitizeEffects(state.effects),
    chapterTwo: sanitizeChapterTwoStateFields(state),
  }
}

function sanitizeMessage(message) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) return null
  const direction = message.direction === 'outgoing' ? 'outgoing' : 'incoming'
  const kind = cleanText(message.kind, 40) || 'message'
  const die = safeInteger(message.die, { min: 1, max: 20 })
  const rolls = Array.isArray(message.rolls)
    ? message.rolls.map((roll) => safeInteger(roll, { min: 1, max: 20 })).filter(Boolean).slice(0, 2)
    : []
  return {
    direction,
    kind,
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

function createV2ActiveRunRecord({
  state,
  messages = [],
  choices = [],
  pendingTurn = null,
  helpLevel = 0,
  helpMessage = null,
} = {}) {
  const safeState = sanitizeV2ActiveState(state)
  if (!safeState) return null
  const safePendingTurn = sanitizePendingTurn(pendingTurn, safeState)
  return {
    version: CHAPTER_TWO_ACTIVE_RUN_VERSION,
    state: safeState,
    messages: sanitizeMessages(messages),
    choices: safePendingTurn ? [] : sanitizeChoices(choices),
    pendingTurn: safePendingTurn,
    helpLevel: safeInteger(helpLevel, { min: 0, max: 3 }) ?? 0,
    helpMessage: sanitizeHelpMessage(helpMessage),
  }
}

export function weedGoblinsActiveRunStorageKey(userId) {
  return legacy.weedGoblinsActiveRunStorageKey(userId)
}

export function sanitizeWeedGoblinsActiveState(state) {
  if (isChapterTwoState(state) || isChapterTwoTargetSession(state)) return sanitizeV2ActiveState(state)
  return legacy.sanitizeWeedGoblinsActiveState(state)
}

export function createWeedGoblinsActiveRunRecord(session = {}) {
  if (isChapterTwoState(session.state) || isChapterTwoTargetSession(session.state)) {
    return createV2ActiveRunRecord(session)
  }
  return legacy.createWeedGoblinsActiveRunRecord(session)
}

export function saveWeedGoblinsActiveRun({
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
  ...session
} = {}) {
  if (!isChapterTwoState(session.state) && !isChapterTwoTargetSession(session.state)) {
    return legacy.saveWeedGoblinsActiveRun({ storage, userId, ...session })
  }
  if (!storage || typeof storage.setItem !== 'function') return null
  const key = weedGoblinsActiveRunStorageKey(userId)
  if (session.state?.status === 'completed') {
    if (typeof storage.removeItem === 'function') storage.removeItem(key)
    return null
  }
  const record = createV2ActiveRunRecord(session)
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
  if (
    parsed?.version === CHAPTER_TWO_ACTIVE_RUN_VERSION
    && (isChapterTwoState(parsed.state) || isChapterTwoTargetSession(parsed.state))
  ) {
    return createV2ActiveRunRecord(parsed)
  }
  return legacy.readWeedGoblinsActiveRun({ storage, userId })
}

export function clearWeedGoblinsActiveRun(options = {}) {
  return legacy.clearWeedGoblinsActiveRun(options)
}
