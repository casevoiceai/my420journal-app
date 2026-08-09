import {
  BACKGROUNDS,
  FIXED_TEST_ADVENTURE,
} from './weedGoblinsEngine.js'
import { CHAPTER_ONE_ROOM_LIST } from './weedGoblinsRooms.js'

export const WEED_GOBLINS_ACTIVE_RUN_STORAGE_PREFIX =
  'my420journal_local_v1:weed_goblins_active_run'
export const WEED_GOBLINS_ACTIVE_RUN_VERSION = 1

const MAX_MESSAGES = 300
const MAX_HISTORY_EVENTS = 300
const MAX_NARRATION_LINES = 300
const MAX_RECORD_BYTES = 300_000

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

export function weedGoblinsActiveRunStorageKey(userId) {
  const safeUserId = cleanText(userId, 100)
  return safeUserId
    ? `${WEED_GOBLINS_ACTIVE_RUN_STORAGE_PREFIX}:${safeUserId}`
    : WEED_GOBLINS_ACTIVE_RUN_STORAGE_PREFIX
}

function sanitizeRoomState(roomState) {
  const safe = {}
  for (const room of CHAPTER_ONE_ROOM_LIST) {
    const visit = roomState?.[room.id]
    safe[room.id] = {
      roomId: room.id,
      visited: visit?.visited === true,
      visitCount: safeInteger(visit?.visitCount, { min: 0, max: 1000 }) ?? 0,
    }
  }
  return safe
}

function sanitizeFlags(flags = {}) {
  return {
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
    bossDcModifier: Number.isFinite(Number(flags.bossDcModifier))
      ? Math.trunc(Number(flags.bossDcModifier))
      : 0,
    sessionZeroComplete: flags.sessionZeroComplete === true,
    nameSuggestionsVisible: flags.nameSuggestionsVisible === true,
  }
}

function sanitizeStats(stats = {}) {
  return {
    strength: safeInteger(stats.strength, { min: 0, max: 20 }) ?? 0,
    defense: safeInteger(stats.defense, { min: 0, max: 20 }) ?? 0,
    manaPool: safeInteger(stats.manaPool, { min: 0, max: 20 }) ?? 0,
    maxMana: safeInteger(stats.maxMana, { min: 0, max: 20 }) ?? 0,
  }
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

export function sanitizeWeedGoblinsActiveState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return null
  if (state.status !== 'active') return null
  if (state.adventureId !== FIXED_TEST_ADVENTURE.id) return null

  const sceneId = cleanText(state.sceneId, 80)
  const currentRoomId = cleanText(state.currentRoomId, 80)
  const seed = cleanText(state.seed, 200)
  const rngState = safeInteger(state.rngState, { min: 0, max: 0xffffffff })
  if (!sceneId || !currentRoomId || !seed || rngState === null) return null

  const backgroundId = cleanText(state.background?.id, 40)
  const background = backgroundId && BACKGROUNDS[backgroundId]
    ? BACKGROUNDS[backgroundId]
    : null

  return {
    version: WEED_GOBLINS_ACTIVE_RUN_VERSION,
    adventureId: FIXED_TEST_ADVENTURE.id,
    adventure: FIXED_TEST_ADVENTURE,
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
    returningLine: cleanText(state.returningLine, 300) || null,
    background,
    stats: sanitizeStats(state.stats),
    trouble: safeInteger(state.trouble, { min: 0, max: 3 }) ?? 0,
    complicationCount: safeInteger(state.complicationCount, { min: 0, max: 1000 }) ?? 0,
    priorCompletedRunCount: safeInteger(state.priorCompletedRunCount, { min: 0, max: 100000 }) ?? 0,
    narrationTier: cleanText(state.narrationTier, 60) || 'normal',
    stolenItem: cleanText(state.stolenItem, 200),
    goblinName: cleanText(state.goblinName, 120),
    fictionalLocationName: cleanText(state.fictionalLocationName, 160) || null,
    characterTraitFlavor: cleanText(state.characterTraitFlavor, 300),
    environmentThemeFlavor: cleanText(state.environmentThemeFlavor, 300),
    flags: sanitizeFlags(state.flags),
    ending: null,
    runSummary: null,
    history: sanitizeHistory(state.history),
    narration: sanitizeNarration(state.narration),
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

export function createWeedGoblinsActiveRunRecord({
  state,
  messages = [],
  choices = [],
  pendingTurn = null,
  helpLevel = 0,
  helpMessage = null,
} = {}) {
  const safeState = sanitizeWeedGoblinsActiveState(state)
  if (!safeState) return null
  const safePendingTurn = sanitizePendingTurn(pendingTurn, safeState)
  return {
    version: WEED_GOBLINS_ACTIVE_RUN_VERSION,
    state: safeState,
    messages: sanitizeMessages(messages),
    choices: safePendingTurn ? [] : sanitizeChoices(choices),
    pendingTurn: safePendingTurn,
    helpLevel: safeInteger(helpLevel, { min: 0, max: 3 }) ?? 0,
    helpMessage: sanitizeHelpMessage(helpMessage),
  }
}

export function saveWeedGoblinsActiveRun({
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
  ...session
} = {}) {
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
  try {
    const raw = storage.getItem(weedGoblinsActiveRunStorageKey(userId))
    if (!raw || raw.length > MAX_RECORD_BYTES) return null
    const parsed = JSON.parse(raw)
    if (parsed?.version !== WEED_GOBLINS_ACTIVE_RUN_VERSION) return null
    const record = createWeedGoblinsActiveRunRecord(parsed)
    if (!record) return null
    return record
  } catch {
    return null
  }
}

export function clearWeedGoblinsActiveRun({
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
} = {}) {
  if (!storage || typeof storage.removeItem !== 'function') return
  storage.removeItem(weedGoblinsActiveRunStorageKey(userId))
}
