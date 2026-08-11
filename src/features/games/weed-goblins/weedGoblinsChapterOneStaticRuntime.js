import {
  BACKGROUNDS,
  DIFFICULTY,
  ENDINGS,
  FIXED_TEST_ADVENTURE,
  NARRATION_TIERS,
  PLAYER_LOOK_OPTIONS,
  PLAYER_NAME_SUGGESTIONS,
  PLAYER_PRONOUN_OPTIONS,
  PLAYER_RACES,
  PLAYER_WEAPONS,
  calculateNarrationTier,
} from './weedGoblinsEngine.js'
import {
  CHAPTER_ONE_ACTION_OUTCOMES,
  CHAPTER_ONE_ENDINGS,
  CHAPTER_ONE_NPC_TOPICS,
  CHAPTER_ONE_REWARDS,
  CHAPTER_ONE_SCENE_TEXT,
  CHAPTER_ONE_SECRETS,
  CHAPTER_ONE_STOLEN_ITEM_STATUSES,
  SESSION_ZERO_QUESTIONS,
  SESSION_ZERO_WELCOME,
} from './weedGoblinsChapterOne.js'
import {
  CHAPTER_ONE_ROOMS,
  createWeedGoblinsRoomState,
  visitWeedGoblinsRoom,
} from './weedGoblinsRooms.js'
import {
  getWeedGoblinsDangerCheckPreview,
  resolveWeedGoblinsDangerRoll,
} from './weedGoblinsDanger.js'

export const CHAPTER_ONE_STATIC_SCENES = Object.freeze({
  sessionName: 'session-zero-name',
  sessionRace: 'session-zero-race',
  sessionWeapon: 'session-zero-weapon',
  background: 'choose-background',
  sessionPronoun: 'session-zero-pronoun',
  sessionLook: 'session-zero-look',
  windcut: 'windcut-trail',
  rattlebridge: 'rattlebridge-alarm',
  gearMark: 'rattlebridge-gear-mark',
  sneak: 'rattlebridge-sneak',
  sneakTitle: 'rattlebridge-sneak-title',
  cloudberry: 'cloudberry-shelf',
  cloudberryExplore: 'cloudberry-explore',
  cloudberryPress: 'cloudberry-press',
  oldSkyBell: 'old-sky-bell',
  nibTopics: 'nib-topics',
  campSmell: 'camp-smell',
  camp: 'highland-camp',
  campLedger: 'camp-ledger',
  latch: 'stash-latch',
  boss: 'goblin-king',
  wholeCourt: 'whole-court',
  ending: 'ending',
})

const STOLEN_ITEM = 'the Brass-Latched Research Case'
const SECRET_BY_ID = new Map(CHAPTER_ONE_SECRETS.map((secret) => [secret.id, secret]))

function cleanText(value, maxLength = 300) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : ''
}

function hashSeed(seed) {
  const text = String(seed ?? 'weed-goblins')
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0 || 0x9e3779b9
}

function nextRandom(rngState) {
  let next = rngState >>> 0
  next ^= next << 13
  next ^= next >>> 17
  next ^= next << 5
  next >>>= 0
  return { rngState: next || 0x9e3779b9, value: next / 0x100000000 }
}

function cloneState(state, changes = {}) {
  return {
    ...state,
    ...changes,
    stats: { ...state.stats, ...(changes.stats || {}) },
    flags: { ...state.flags, ...(changes.flags || {}) },
    chapterOne: { ...state.chapterOne, ...(changes.chapterOne || {}) },
    roomState: changes.roomState || { ...state.roomState },
    history: changes.history || [...state.history],
    narration: changes.narration || [...state.narration],
  }
}

function appendNarration(state, lines = [], event = null) {
  const cleanLines = (Array.isArray(lines) ? lines : [lines]).map((line) => cleanText(line, 1000)).filter(Boolean)
  return cloneState(state, {
    history: event ? [...state.history, event] : [...state.history],
    narration: [...state.narration, ...cleanLines],
  })
}

function templateLine(line, state) {
  return String(line)
    .replaceAll('{campSmell}', state.chapterOne.campSmell || 'Burnt cloudberry syrup')
    .replaceAll('{gearMark}', state.chapterOne.gearMark || 'Your gear')
}

function enterScene(state, sceneId, roomId, lines = []) {
  const roomState = state.currentRoomId === roomId
    ? state.roomState
    : visitWeedGoblinsRoom(state.roomState, roomId)
  const next = cloneState(state, { sceneId, currentRoomId: roomId, roomState })
  return appendNarration(next, lines.map((line) => templateLine(line, next)), {
    type: 'scene', sceneId, actionId: 'scene:enter', outcome: 'intro',
  })
}

function discover(state, ids = []) {
  const discovered = new Set(state.chapterOne.discoveredSecrets || [])
  for (const id of ids) if (SECRET_BY_ID.has(id)) discovered.add(id)
  return cloneState(state, { chapterOne: { discoveredSecrets: [...discovered] } })
}

function hasSecret(state, id) {
  return (state.chapterOne.discoveredSecrets || []).includes(id)
}

function addOutcome(state, actionId, outcome = 'success', extra = {}) {
  const text = CHAPTER_ONE_ACTION_OUTCOMES[actionId]?.[outcome]
  return appendNarration(state, text || '', {
    type: 'choice', sceneId: state.sceneId, actionId, outcome, ...extra,
  })
}

function backgroundForId(id) {
  return BACKGROUNDS[id] || null
}

function rollD20(state) {
  const draw = nextRandom(state.rngState)
  return { roll: Math.floor(draw.value * 20) + 1, rngState: draw.rngState }
}

function checkConfig(state, actionId) {
  const configs = {
    'route:quiet': { stat: 'defense', tierId: 'bloom' },
    'route:loud': { stat: 'strength', tierId: 'bloom' },
    'sneak:fee-paid': { stat: 'defense', tierId: 'bloom' },
    'sneak:move': { stat: 'strength', tierId: 'bloom' },
    'sneak:title-deputy': { stat: 'defense', tierId: 'bloom' },
    'sneak:title-duke': { stat: 'defense', tierId: 'bloom' },
    'sneak:mana': { stat: 'defense', tierId: 'bloom', manaCost: 1 },
    'cloudberry:take-charm': { stat: 'defense', tierId: 'sprout' },
    'press:climb': { stat: 'strength', tierId: 'bloom' },
    'press:wait': { stat: 'defense', tierId: 'bloom' },
    'press:distract': { stat: 'defense', tierId: 'bloom' },
    'skybell:runes': { stat: 'defense', tierId: 'bloom', manaCost: 1 },
    'skybell:brace': { stat: 'strength', tierId: 'bloom' },
    'camp:expose-tribute': { stat: 'defense', tierId: 'bloom' },
    'camp:protect-tribute': { stat: 'defense', tierId: 'bloom' },
    'camp:force-ledger': { stat: 'strength', tierId: 'bloom' },
    'latch:read-face': { stat: 'defense', tierId: 'bloom' },
    'latch:force': { stat: 'strength', tierId: 'bloom' },
    'latch:channel': { stat: 'defense', tierId: 'bloom', manaCost: 1 },
    'boss:outlast': { stat: 'defense', tierId: 'wither', dcOverride: Math.max(DIFFICULTY.easy, DIFFICULTY.goblinKing + state.flags.bossDcModifier) },
    'boss:overpower': { stat: 'strength', tierId: 'wither', dcOverride: Math.max(DIFFICULTY.easy, DIFFICULTY.goblinKing + state.flags.bossDcModifier) },
    'boss:spell': { stat: 'defense', tierId: 'wither', manaCost: 2, dcOverride: Math.max(DIFFICULTY.easy, DIFFICULTY.goblinKing + state.flags.bossDcModifier) },
    'court:break-line': { stat: 'strength', tierId: 'wither' },
    'court:hold-room': { stat: 'defense', tierId: 'wither' },
  }
  return configs[actionId] || null
}

function previewForConfig(state, config) {
  if (!config) return Object.freeze({ requiresRoll: false, stat: null, dc: null, statBonus: 0, requiredDie: null, manaCost: 0, advantage: false, dangerTier: null })
  const preview = getWeedGoblinsDangerCheckPreview({ tierId: config.tierId, stat: config.stat, stats: state.stats, manaCost: config.manaCost || 0 })
  if (!config.dcOverride) return preview
  return Object.freeze({
    ...preview,
    dc: config.dcOverride,
    requiredDie: Math.min(20, Math.max(2, config.dcOverride - preview.statBonus)),
  })
}

export function getWeedGoblinsActionCheckPreview(state, actionId) {
  return previewForConfig(state, checkConfig(state, actionId))
}

function troubleAfterFailure(state, naturalOne) {
  if (naturalOne) return Math.min(2, state.trouble + 2)
  return Math.min(3, state.trouble + 1)
}

function stolenItemCondition(state, ending) {
  if (ending === ENDINGS.escape) return 'not-recovered'
  return state.trouble >= 2 ? 'altered' : 'intact'
}

function stolenItemStatus(state, ending) {
  if (state.flags.voluntarilySurrendered) return CHAPTER_ONE_STOLEN_ITEM_STATUSES.voluntarilySurrendered
  if (ending === ENDINGS.bargain) return CHAPTER_ONE_STOLEN_ITEM_STATUSES.bargainedBack
  if (ending === ENDINGS.escape) return CHAPTER_ONE_STOLEN_ITEM_STATUSES.stillMissing
  return state.trouble >= 2
    ? CHAPTER_ONE_STOLEN_ITEM_STATUSES.recoveredAltered
    : CHAPTER_ONE_STOLEN_ITEM_STATUSES.recoveredIntact
}

function rewardsForRun(state) {
  const rewards = [CHAPTER_ONE_REWARDS.blackRootSeal]
  if (state.flags.goblinFavor) rewards.push(CHAPTER_ONE_REWARDS.goblinFavor)
  if (state.flags.hasHighlandCharm) rewards.push(CHAPTER_ONE_REWARDS.highlandCharm)
  return [...new Set(rewards)]
}

function completeRun(state, endingKey, reason = null) {
  const endingDef = CHAPTER_ONE_ENDINGS[endingKey]
  if (!endingDef) throw new Error(`Unknown Chapter 1 ending: ${endingKey}`)
  const ending = endingDef.ending
  const itemStatus = stolenItemStatus(state, ending)
  const condition = stolenItemCondition(state, ending)
  const summary = {
    adventureId: state.adventureId,
    seed: state.seed,
    backgroundId: state.background?.id || null,
    stolenItem: state.stolenItem,
    stolenItemStatus: itemStatus,
    routeId: state.flags.routeId,
    midpointChoice: state.flags.midpointChoice,
    chapterOneBranches: {
      nibTreatment: state.flags.nibTreatment || 'ignored',
      tributeArrangement: state.flags.tributeArrangement || 'unknown',
      kingTreatment: state.flags.kingTreatment || 'unresolved',
      stolenItemCondition: condition,
    },
    chapterOneRewards: rewardsForRun(state),
    ending,
    endingKey,
    outcomeSummary: ending === ENDINGS.recovery
      ? `recovered ${state.stolenItem}`
      : ending === ENDINGS.bargain
        ? `made a bargain and recovered ${state.stolenItem}`
        : `escaped without recovering ${state.stolenItem}`,
    trouble: state.trouble,
    manaRemaining: state.stats.manaPool,
    complicationCount: state.complicationCount,
    priorCompletedRunCount: state.priorCompletedRunCount,
    narrationTier: state.narrationTier,
    reason,
  }
  const completed = cloneState(state, {
    status: 'completed',
    sceneId: CHAPTER_ONE_STATIC_SCENES.ending,
    ending,
    endingKey,
    stolenItemStatus: itemStatus,
    runSummary: summary,
  })
  return appendNarration(completed, endingDef.lines, {
    type: 'ending', sceneId: CHAPTER_ONE_STATIC_SCENES.ending, actionId: `ending:${endingKey}`, ending, outcome: endingKey, reason,
  })
}

function afterResolvedCheck(state, actionId, result) {
  let next = state
  if (actionId === 'route:quiet' || actionId === 'route:loud') {
    return enterScene(next, CHAPTER_ONE_STATIC_SCENES.gearMark, CHAPTER_ONE_ROOMS.rattlebridge.id, ['The crossing leaves one obvious mark on your gear. Which one?'])
  }
  if (actionId.startsWith('sneak:')) {
    return enterScene(next, CHAPTER_ONE_STATIC_SCENES.cloudberry, CHAPTER_ONE_ROOMS.cloudberryShelf.id, CHAPTER_ONE_SCENE_TEXT.cloudberryShelf)
  }
  if (actionId === 'cloudberry:take-charm') {
    return cloneState(next, { chapterOne: { charmResolved: true }, flags: { hasHighlandCharm: result.success } })
  }
  if (actionId.startsWith('press:') || actionId.startsWith('skybell:')) return next
  if (actionId.startsWith('camp:')) return next
  if (actionId.startsWith('latch:')) {
    return enterScene(next, CHAPTER_ONE_STATIC_SCENES.boss, CHAPTER_ONE_ROOMS.kingsStashHall.id, CHAPTER_ONE_SCENE_TEXT.stashHall)
  }
  if (actionId === 'boss:outlast' || actionId === 'boss:spell') {
    if (result.success) return completeRun(cloneState(next, { flags: { kingTreatment: 'spared', goblinFavor: true } }), 'recoverySpared', actionId)
    return next
  }
  if (actionId === 'boss:overpower') {
    if (result.success) return completeRun(cloneState(next, { flags: { kingTreatment: 'humiliated' } }), 'recoveryHumiliated', actionId)
    return next
  }
  if (actionId === 'court:break-line') {
    return result.success
      ? completeRun(cloneState(next, { flags: { kingTreatment: 'humiliated' } }), 'recoveryHumiliated', 'whole-court Wither success')
      : completeRun(next, 'cleanFailure', 'whole-court Wither failure')
  }
  if (actionId === 'court:hold-room') {
    return result.success
      ? completeRun(cloneState(next, { flags: { kingTreatment: 'spared' } }), 'recoverySpared', 'whole-court Wither success')
      : completeRun(next, 'cleanFailure', 'whole-court Wither failure')
  }
  return next
}

function resolveCheck(state, actionId) {
  const config = checkConfig(state, actionId)
  if (!config) throw new Error(`Action ${actionId} has no check configuration.`)
  if ((config.manaCost || 0) > state.stats.manaPool) throw new Error(`Not enough Mana for ${actionId}.`)
  let working = cloneState(state, { stats: { manaPool: state.stats.manaPool - (config.manaCost || 0) } })
  const first = rollD20(working)
  working = cloneState(working, { rngState: first.rngState })
  const rolls = [first.roll]
  if ((config.manaCost || 0) > 0) {
    const second = rollD20(working)
    working = cloneState(working, { rngState: second.rngState })
    rolls.push(second.roll)
  }
  const sharedResult = resolveWeedGoblinsDangerRoll({ tierId: config.tierId, statBonus: working.stats[config.stat], rolls })
  const dc = config.dcOverride || sharedResult.tier.dc
  const success = sharedResult.roll === 20 || sharedResult.roll + working.stats[config.stat] >= dc
  const naturalOne = sharedResult.naturalOne
  const outcome = naturalOne ? 'naturalOne' : success ? 'success' : 'failure'
  const trouble = success ? working.trouble : troubleAfterFailure(working, naturalOne)
  let next = cloneState(working, {
    trouble,
    complicationCount: working.complicationCount + (naturalOne ? 1 : 0),
  })
  next = addOutcome(next, actionId === 'sneak:title-deputy' || actionId === 'sneak:title-duke' ? 'sneak:title' : actionId, outcome, {
    type: 'check', stat: config.stat, dc, dangerTier: config.tierId, rolls, roll: sharedResult.roll,
    total: sharedResult.roll + working.stats[config.stat], success, naturalOne, advantage: (config.manaCost || 0) > 0, manaCost: config.manaCost || 0,
  })
  const checkEvent = {
    type: 'check', sceneId: state.sceneId, actionId, stat: config.stat, dc, dangerTier: config.tierId,
    rolls, roll: sharedResult.roll, total: sharedResult.roll + working.stats[config.stat], success, naturalOne,
    advantage: (config.manaCost || 0) > 0, manaCost: config.manaCost || 0, outcome: naturalOne ? 'complication' : success ? 'success' : 'failure',
  }
  next = cloneState(next, { history: [...next.history.filter((event) => event.actionId !== actionId || event.type !== 'choice'), checkEvent] })

  if (success && actionId === 'sneak:title-duke') next = discover(next, [1])
  if (success && actionId === 'press:climb') next = discover(next, [2])
  if (success && actionId === 'press:wait') next = discover(next, [2])
  if (success && actionId === 'press:distract') next = discover(next, [2])
  if (success && actionId === 'skybell:runes') next = discover(next, [5])
  if (success && actionId === 'skybell:brace') next = discover(next, [2])
  if (actionId === 'camp:expose-tribute') next = cloneState(discover(next, [1, 6]), { flags: { tributeArrangement: 'exposed', blackRootSealKnown: true }, chapterOne: { tributeEvidence: true } })
  if (actionId === 'camp:protect-tribute') next = cloneState(discover(next, [6]), { flags: { tributeArrangement: 'protected', goblinFavor: success || next.flags.goblinFavor }, chapterOne: { tributeEvidence: true } })
  if (actionId === 'camp:force-ledger') next = cloneState(discover(next, [1, 6]), { flags: { tributeArrangement: 'exposed', blackRootSealKnown: true }, chapterOne: { tributeEvidence: success || next.chapterOne.tributeEvidence } })
  if (success && actionId === 'latch:read-face') next = discover(next, [5])

  if (!success && !naturalOne && trouble >= 3 && !actionId.startsWith('court:')) return completeRun(next, 'cleanFailure', `${actionId} failed at three Trouble`)
  return afterResolvedCheck(next, actionId, { success, naturalOne, checkEvent })
}

export function createWeedGoblinsRun({
  seed = 'weed-goblins-session-1',
  journalSnapshot = {},
  previousRuns = [],
  priorCompletedRunCount = previousRuns.length,
} = {}) {
  const count = Math.max(0, Number(priorCompletedRunCount) || 0)
  return {
    version: 2,
    chapterNumber: 1,
    adventureId: FIXED_TEST_ADVENTURE.id,
    adventure: FIXED_TEST_ADVENTURE,
    seed: String(seed),
    rngState: hashSeed(seed),
    status: 'active',
    sceneId: CHAPTER_ONE_STATIC_SCENES.sessionName,
    currentRoomId: CHAPTER_ONE_ROOMS.windcutTrail.id,
    roomState: createWeedGoblinsRoomState(CHAPTER_ONE_ROOMS.windcutTrail.id),
    playerName: null,
    playerRace: null,
    playerWeapon: null,
    playerPronoun: null,
    playerLook: null,
    background: null,
    stats: { strength: 0, defense: 0, manaPool: 0, maxMana: 0 },
    trouble: 0,
    complicationCount: 0,
    priorCompletedRunCount: count,
    narrationTier: calculateNarrationTier(count) || NARRATION_TIERS.normal,
    stolenItem: STOLEN_ITEM,
    stolenItemStatus: null,
    goblinName: 'Highland Sneak',
    fictionalLocationName: null,
    characterTraitFlavor: cleanText(journalSnapshot?.effectTraitFlavor, 300),
    environmentThemeFlavor: cleanText(journalSnapshot?.terpeneEnvironmentFlavor, 300),
    flags: {
      routeId: null,
      midpointChoice: null,
      goblinAlly: false,
      goblinFavor: false,
      hasHighlandCharm: false,
      blackRootSealKnown: false,
      nibTreatment: null,
      tributeArrangement: null,
      kingTreatment: null,
      latchOutcome: null,
      bossDcModifier: 0,
      sessionZeroComplete: false,
      nameSuggestionsVisible: false,
      voluntarilySurrendered: false,
    },
    chapterOne: {
      gearMark: null,
      campSmell: null,
      discoveredSecrets: [],
      optionalVisited: { press: false, skyBell: false },
      nibResolved: false,
      charmResolved: false,
      ledgerSeen: false,
      tributeEvidence: false,
      courtChallenged: false,
    },
    ending: null,
    endingKey: null,
    runSummary: null,
    history: [],
    narration: [...SESSION_ZERO_WELCOME],
  }
}

export function isWeedGoblinsSessionTextScene(state) {
  return Boolean(state?.status === 'active' && [CHAPTER_ONE_STATIC_SCENES.sessionName, CHAPTER_ONE_STATIC_SCENES.sessionLook].includes(state.sceneId))
}

function isNameHelpRequest(value) {
  const text = cleanText(value).toLowerCase()
  return !text || /\b(?:help|suggest|suggestion|name idea|not sure|don't know|do not know)\b/.test(text)
}

export function advanceWeedGoblinsSessionText(state, value) {
  if (state.sceneId === CHAPTER_ONE_STATIC_SCENES.sessionName) {
    const playerName = cleanText(value, 160)
    if (isNameHelpRequest(playerName)) return cloneState(state, { flags: { nameSuggestionsVisible: true } })
    return cloneState(state, {
      playerName,
      sceneId: CHAPTER_ONE_STATIC_SCENES.sessionRace,
      flags: { nameSuggestionsVisible: false },
      history: [...state.history, { type: 'session-choice', sceneId: state.sceneId, actionId: 'session:name:custom', playerName }],
    })
  }
  if (state.sceneId === CHAPTER_ONE_STATIC_SCENES.sessionLook) {
    const playerLook = cleanText(value, 160)
    if (!playerLook) throw new Error('A character look is required.')
    const next = cloneState(state, { playerLook, flags: { sessionZeroComplete: true }, history: [...state.history, { type: 'session-choice', sceneId: state.sceneId, actionId: 'session:look:custom', playerLook }] })
    return enterScene(next, CHAPTER_ONE_STATIC_SCENES.windcut, CHAPTER_ONE_ROOMS.windcutTrail.id, CHAPTER_ONE_SCENE_TEXT.windcutTrail)
  }
  throw new Error(`Session text input is not available in scene ${state.sceneId}.`)
}

function action(id, label, detail = '') { return Object.freeze({ id, label, ...(detail ? { detail } : {}) }) }

export function getAvailableActions(state) {
  if (!state || state.status !== 'active') return []
  const C = CHAPTER_ONE_STATIC_SCENES
  if (state.sceneId === C.sessionName) {
    return state.flags.nameSuggestionsVisible
      ? PLAYER_NAME_SUGGESTIONS.map((name, index) => action(`session:name:${index}`, name))
      : []
  }
  if (state.sceneId === C.sessionRace) return Object.values(PLAYER_RACES).map((race) => action(`session:race:${race.id}`, race.label, race.flavor))
  if (state.sceneId === C.sessionWeapon) return Object.values(PLAYER_WEAPONS).map((weapon) => action(`session:weapon:${weapon.id}`, weapon.label, weapon.flavor))
  if (state.sceneId === C.background) return Object.values(BACKGROUNDS).map((background) => action(`background:${background.id}`, background.name))
  if (state.sceneId === C.sessionPronoun) return PLAYER_PRONOUN_OPTIONS.map((option) => action(`session:pronoun:${option.id}`, option.label))
  if (state.sceneId === C.sessionLook) return PLAYER_LOOK_OPTIONS.map((option) => action(`session:look:${option.id}`, option.label))
  if (state.sceneId === C.windcut) return [
    action('windcut:rivet', 'Examine the brass rivet'), action('windcut:groove', 'Check the drag groove'), action('windcut:twine', 'Inspect the green twine'), action('windcut:listen', 'Listen before climbing'), action('windcut:head-rattlebridge', 'Head for Rattlebridge'),
  ]
  if (state.sceneId === C.rattlebridge) return [
    action('route:quiet', 'Cut the line and cross quietly'), action('route:loud', 'Cross before the alarms catch up'), action('rattlebridge:inspect-reset', 'Inspect the red reset cord'), action('rattlebridge:talk', 'Talk to the Sneak from here'), action('rattlebridge:look-below', 'Look beneath the bridge'),
  ]
  if (state.sceneId === C.gearMark) return [
    action('gear:tar', 'My cloak hem is black with bridge tar.'), action('gear:tie', 'My weapon wrap lost its top tie.'),
  ]
  if (state.sceneId === C.sneak) {
    const choices = [action('sneak:fee-paid', 'Tell it the fee was already paid'), action('sneak:move', 'Move it out of the path'), action('sneak:offer-title', 'Offer it a better title'), action('sneak:ask-case', 'Ask who carried the case uphill')]
    if (state.stats.manaPool >= 1) choices.push(action('sneak:mana', 'Spend 1 Mana and make the fee complicated'))
    return choices
  }
  if (state.sceneId === C.sneakTitle) return [action('sneak:title-deputy', 'Deputy Crossing Inspector'), action('sneak:title-duke', 'Acting Emergency Bridge Duke')]
  if (state.sceneId === C.cloudberry) {
    const choices = []
    if (!state.chapterOne.nibResolved) {
      choices.push(action('cloudberry:help-nib', 'Free Nib and keep him out of sight'), action('cloudberry:bait-nib', 'Send Nib down the lower path'))
    } else if (state.flags.nibTreatment === 'safe') choices.push(action('cloudberry:talk-nib', 'Talk to Nib'))
    if (!state.chapterOne.charmResolved) choices.push(action('cloudberry:take-charm', 'Reach for the highland charm'))
    choices.push(action('cloudberry:look-around', 'Look around Cloudberry Shelf'), action('cloudberry:leave', 'Leave for Highland Camp'))
    return choices.slice(0, 5)
  }
  if (state.sceneId === C.nibTopics) {
    const topics = CHAPTER_ONE_NPC_TOPICS.nib.filter((topic) => !topic.gatedBy || state.flags.nibTreatment === 'safe')
    return [...topics.slice(0, 4).map((topic) => action(`nib:${topic.id}`, topic.prompt)), action('nib:return', 'Back to Cloudberry Shelf')].slice(0, 5)
  }
  if (state.sceneId === C.cloudberryExplore) return [
    action('cloudberry:press', "Follow the grooves to the Giant's Cloudberry Press"), action('cloudberry:skybell', 'Climb to the Old Sky-Bell'), action('cloudberry:return-main', 'Go back to Nib and the trail'),
  ]
  if (state.sceneId === C.cloudberryPress) return [
    action('press:climb', 'Climb the press frame'), action('press:wait', 'Wait for the Kite to move'), action('press:distract', 'Distract the Kite with something shiny'), action('press:inspect-mark', 'Inspect the carved black-root mark'), action('press:return', 'Return to the main shelf'),
  ]
  if (state.sceneId === C.oldSkyBell) return [
    ...(state.stats.manaPool >= 1 ? [action('skybell:runes', 'Read the trail-runes before it rings')] : []), action('skybell:brace', 'Brace the clapper'), action('skybell:inspect-mark', 'Inspect the black-root carving'), action('skybell:ring', 'Let the bell ring'), action('skybell:return', 'Return to the main shelf'),
  ].slice(0, 5)
  if (state.sceneId === C.campSmell) return [action('smell:syrup', 'Burnt cloudberry syrup'), action('smell:wool', 'Wet goat wool')]
  if (state.sceneId === C.camp) return [
    action('camp:ask-grubbin', 'Ask Grubbin why the best goods leave camp'), action('camp:ask-tatter', 'Ask Old Tatter about the black-root seal'), action('camp:study-ledger', 'Study the picture ledger'), action('camp:watch-crates', 'Watch the outgoing crates'), action('camp:head-hall', "Head for the King's Stash Hall"),
  ]
  if (state.sceneId === C.campLedger) return [
    action('camp:expose-tribute', 'Expose what the King is sending away'), action('camp:protect-tribute', 'Alter the page to protect the goblins'), action('camp:force-ledger', 'Pull the ledger free and take it'), action('camp:ask-collector', 'Ask Grubbin who collects the tribute'), action('camp:leave-ledger', 'Leave the ledger alone'),
  ]
  if (state.sceneId === C.latch) {
    const choices = [action('latch:read-face', 'Study the wear on the carved faces')]
    if (hasSecret(state, 5)) choices.push(action('latch:set-worried', 'Set the faces to worried'))
    choices.push(action('latch:force', 'Force the latch'))
    if (state.stats.manaPool >= 1) choices.push(action('latch:channel', 'Spend 1 Mana to read the mechanism'))
    if (state.flags.hasHighlandCharm) choices.push(action('latch:use-charm', 'Use the highland charm'))
    return choices.slice(0, 5)
  }
  if (state.sceneId === C.boss) {
    const choices = [action('boss:outlast', 'Make him surrender the case'), action('boss:overpower', 'Take the case from him')]
    if (state.stats.manaPool >= 2) choices.push(action('boss:spell', 'Spend 2 Mana on a decisive theory'))
    if (state.chapterOne.tributeEvidence || state.flags.goblinAlly || state.flags.blackRootSealKnown) choices.push(action('boss:evidence', 'Put the tribute evidence in front of him'))
    choices.push(action('boss:challenge-court', 'Challenge the entire court'))
    return choices.slice(0, 5)
  }
  if (state.sceneId === C.wholeCourt) return [action('court:break-line', 'Break through the court'), action('court:hold-room', 'Hold the whole court off')]
  return []
}

function chooseSessionOption(state, actionId) {
  const C = CHAPTER_ONE_STATIC_SCENES
  if (state.sceneId === C.sessionName && actionId.startsWith('session:name:')) {
    const index = Number(actionId.split(':')[2])
    const playerName = PLAYER_NAME_SUGGESTIONS[index]
    if (!playerName) throw new Error('Unknown name suggestion.')
    return cloneState(state, { playerName, sceneId: C.sessionRace, flags: { nameSuggestionsVisible: false }, history: [...state.history, { type: 'session-choice', sceneId: state.sceneId, actionId, playerName }] })
  }
  if (state.sceneId === C.sessionRace) {
    const race = PLAYER_RACES[actionId.slice('session:race:'.length)]
    if (!race) return null
    return appendNarration(cloneState(state, { playerRace: race.label, sceneId: C.sessionWeapon, history: [...state.history, { type: 'session-choice', sceneId: state.sceneId, actionId, playerRace: race.label }] }), SESSION_ZERO_QUESTIONS.weapon)
  }
  if (state.sceneId === C.sessionWeapon) {
    const id = actionId.slice('session:weapon:'.length)
    const weapon = Object.values(PLAYER_WEAPONS).find((candidate) => candidate.id === id)
    if (!weapon) return null
    return appendNarration(cloneState(state, { playerWeapon: weapon.value, sceneId: C.background, history: [...state.history, { type: 'session-choice', sceneId: state.sceneId, actionId, playerWeapon: weapon.value }] }), SESSION_ZERO_QUESTIONS.background)
  }
  if (state.sceneId === C.background) {
    const background = backgroundForId(actionId.slice('background:'.length))
    if (!background) return null
    return appendNarration(cloneState(state, { background, sceneId: C.sessionPronoun, stats: { strength: background.strength, defense: background.defense, manaPool: background.manaPool, maxMana: background.manaPool }, history: [...state.history, { type: 'session-choice', sceneId: state.sceneId, actionId, backgroundId: background.id }] }), SESSION_ZERO_QUESTIONS.pronoun)
  }
  if (state.sceneId === C.sessionPronoun) {
    const option = PLAYER_PRONOUN_OPTIONS.find((candidate) => candidate.id === actionId.slice('session:pronoun:'.length))
    if (!option) return null
    return appendNarration(cloneState(state, { playerPronoun: option.value, sceneId: C.sessionLook, history: [...state.history, { type: 'session-choice', sceneId: state.sceneId, actionId, playerPronoun: option.value }] }), SESSION_ZERO_QUESTIONS.look)
  }
  if (state.sceneId === C.sessionLook) {
    const option = PLAYER_LOOK_OPTIONS.find((candidate) => candidate.id === actionId.slice('session:look:'.length))
    if (!option) return null
    return enterScene(cloneState(state, { playerLook: option.label, flags: { sessionZeroComplete: true }, history: [...state.history, { type: 'session-choice', sceneId: state.sceneId, actionId, playerLook: option.label }] }), C.windcut, CHAPTER_ONE_ROOMS.windcutTrail.id, CHAPTER_ONE_SCENE_TEXT.windcutTrail)
  }
  return null
}

export function advanceWeedGoblinsRun(state, actionId) {
  if (!state || state.status !== 'active') throw new Error('An active Chapter 1 state is required.')
  const available = getAvailableActions(state)
  if (!available.some((candidate) => candidate.id === actionId)) throw new Error(`Action ${actionId} is not available in scene ${state.sceneId}.`)
  const session = chooseSessionOption(state, actionId)
  if (session) return session
  const preview = getWeedGoblinsActionCheckPreview(state, actionId)
  if (preview.requiresRoll) return resolveCheck(state, actionId)
  const C = CHAPTER_ONE_STATIC_SCENES

  if (state.sceneId === C.windcut) {
    if (actionId === 'windcut:head-rattlebridge') return enterScene(state, C.rattlebridge, CHAPTER_ONE_ROOMS.rattlebridge.id, CHAPTER_ONE_SCENE_TEXT.rattlebridgeAlarm)
    const secrets = actionId === 'windcut:rivet' ? [1] : actionId === 'windcut:groove' ? [1, 3] : actionId === 'windcut:twine' ? [4] : []
    return discover(addOutcome(state, actionId), secrets)
  }
  if (state.sceneId === C.rattlebridge) {
    const secrets = ['rattlebridge:inspect-reset', 'rattlebridge:look-below'].includes(actionId) ? [4] : []
    return discover(addOutcome(state, actionId), secrets)
  }
  if (state.sceneId === C.gearMark) {
    const gearMark = actionId === 'gear:tar' ? 'Your cloak hem, black with bridge tar,' : 'Your weapon wrap, missing its top tie,'
    return enterScene(cloneState(state, { chapterOne: { gearMark } }), C.sneak, CHAPTER_ONE_ROOMS.rattlebridge.id, CHAPTER_ONE_SCENE_TEXT.rattlebridgeSneak)
  }
  if (state.sceneId === C.sneak) {
    if (actionId === 'sneak:offer-title') return cloneState(state, { sceneId: C.sneakTitle })
    if (actionId === 'sneak:ask-case') return discover(addOutcome(state, actionId), [1, 3])
  }
  if (state.sceneId === C.cloudberry) {
    if (actionId === 'cloudberry:help-nib') return cloneState(addOutcome(state, actionId), { flags: { midpointChoice: 'help', nibTreatment: 'safe', goblinAlly: true, goblinFavor: true }, chapterOne: { nibResolved: true } })
    if (actionId === 'cloudberry:bait-nib') return cloneState(addOutcome(state, actionId), { flags: { midpointChoice: 'bait-nib', nibTreatment: 'bait', bossDcModifier: -1 }, chapterOne: { nibResolved: true } })
    if (actionId === 'cloudberry:talk-nib') return cloneState(state, { sceneId: C.nibTopics })
    if (actionId === 'cloudberry:look-around') return enterScene(state, C.cloudberryExplore, CHAPTER_ONE_ROOMS.cloudberryShelf.id, CHAPTER_ONE_SCENE_TEXT.cloudberryExplore)
    if (actionId === 'cloudberry:leave') return appendNarration(cloneState(state, { sceneId: C.campSmell }), 'Smoke from Highland Camp reaches the shelf. Which smell carries farther?')
  }
  if (state.sceneId === C.nibTopics) {
    if (actionId === 'nib:return') return cloneState(state, { sceneId: C.cloudberry })
    const topic = CHAPTER_ONE_NPC_TOPICS.nib.find((candidate) => `nib:${candidate.id}` === actionId)
    if (topic) {
      let next = appendNarration(state, topic.text)
      if (topic.id === 'promotion') next = appendNarration(next, 'Acting Emergency Bridge Duke is irresponsible. Nib writes it down immediately. A worried goblin face is doodled above a little door.')
      return discover(next, [topic.rewardSecret])
    }
  }
  if (state.sceneId === C.cloudberryExplore) {
    if (actionId === 'cloudberry:press') return enterScene(cloneState(state, { chapterOne: { optionalVisited: { ...state.chapterOne.optionalVisited, press: true } } }), C.cloudberryPress, CHAPTER_ONE_ROOMS.cloudberryShelf.id, [
      'The press screw rises above the shelf like a stone mast. Fermented cloudberry skins sting the nose from a trough wide enough for a cart.',
      'An old tribute tag is woven into a Cliff Kite nest. A faded black-root mark is carved into the press base below it.',
      'A Cliff Kite drops onto the tribute tag and spreads its wings over it.',
    ])
    if (actionId === 'cloudberry:skybell') return enterScene(cloneState(state, { chapterOne: { optionalVisited: { ...state.chapterOne.optionalVisited, skyBell: true } } }), C.oldSkyBell, CHAPTER_ONE_ROOMS.cloudberryShelf.id, [
      "The bell's cracked rim stands higher than Nib. Cold bronze smells like rain under the sun.",
      'Old trail-runes circle the foundation. The clapper chain passes through a stone carved with the black-root seal.',
      'The wind turns, and the clapper begins to swing.',
    ])
    if (actionId === 'cloudberry:return-main') return cloneState(state, { sceneId: C.cloudberry })
  }
  if (state.sceneId === C.cloudberryPress) {
    if (actionId === 'press:return') return cloneState(state, { sceneId: C.cloudberryExplore })
    if (actionId === 'press:inspect-mark') return discover(addOutcome(state, actionId), [2])
  }
  if (state.sceneId === C.oldSkyBell) {
    if (actionId === 'skybell:return') return cloneState(state, { sceneId: C.cloudberryExplore })
    if (actionId === 'skybell:inspect-mark') return discover(addOutcome(state, actionId), [2])
    if (actionId === 'skybell:ring') return addOutcome(state, actionId)
  }
  if (state.sceneId === C.campSmell) {
    const campSmell = actionId === 'smell:wool' ? 'Wet goat wool' : 'Burnt cloudberry syrup'
    return enterScene(cloneState(state, { chapterOne: { campSmell } }), C.camp, CHAPTER_ONE_ROOMS.highlandCamp.id, CHAPTER_ONE_SCENE_TEXT.highlandCamp)
  }
  if (state.sceneId === C.camp) {
    if (actionId === 'camp:ask-grubbin') return cloneState(discover(addOutcome(state, actionId), [1, 3, 6]), { flags: { blackRootSealKnown: true }, chapterOne: { tributeEvidence: true } })
    if (actionId === 'camp:ask-tatter') return cloneState(discover(addOutcome(state, actionId), [2, 8]), { flags: { blackRootSealKnown: true } })
    if (actionId === 'camp:watch-crates') return discover(addOutcome(state, actionId), [3, 6])
    if (actionId === 'camp:study-ledger') return enterScene(cloneState(discover(state, [1, 6]), { chapterOne: { ledgerSeen: true, tributeEvidence: true } }), C.campLedger, CHAPTER_ONE_ROOMS.highlandCamp.id, CHAPTER_ONE_SCENE_TEXT.campLedger)
    if (actionId === 'camp:head-hall') return enterScene(state, C.latch, CHAPTER_ONE_ROOMS.kingsStashHall.id, CHAPTER_ONE_SCENE_TEXT.stashLatch)
  }
  if (state.sceneId === C.campLedger) {
    if (actionId === 'camp:ask-collector') return discover(addOutcome(state, actionId), [3])
    if (actionId === 'camp:leave-ledger') return cloneState(state, { sceneId: C.camp })
  }
  if (state.sceneId === C.latch) {
    if (actionId === 'latch:set-worried') return enterScene(cloneState(addOutcome(state, actionId), { flags: { latchOutcome: 'worried-face', bossDcModifier: state.flags.bossDcModifier - 1 } }), C.boss, CHAPTER_ONE_ROOMS.kingsStashHall.id, CHAPTER_ONE_SCENE_TEXT.stashHall)
    if (actionId === 'latch:use-charm') return enterScene(cloneState(addOutcome(state, actionId), { flags: { latchOutcome: 'charm', bossDcModifier: state.flags.bossDcModifier - 1 } }), C.boss, CHAPTER_ONE_ROOMS.kingsStashHall.id, CHAPTER_ONE_SCENE_TEXT.stashHall)
  }
  if (state.sceneId === C.boss) {
    if (actionId === 'boss:evidence') return completeRun(cloneState(addOutcome(state, actionId), { flags: { kingTreatment: 'spared', goblinFavor: true } }), 'bargain', 'tribute evidence')
    if (actionId === 'boss:challenge-court') return enterScene(cloneState(state, { chapterOne: { courtChallenged: true } }), C.wholeCourt, CHAPTER_ONE_ROOMS.kingsStashHall.id, CHAPTER_ONE_SCENE_TEXT.wholeCourt)
  }
  throw new Error(`Unsupported no-roll action ${actionId} in scene ${state.sceneId}.`)
}

export function advanceWeedGoblinsFreeTextMidpointCheck(state, style) {
  const actionId = style === 'strength' ? 'press:climb' : style === 'mana' ? 'skybell:runes' : 'press:wait'
  return resolveCheck(state, actionId)
}

export function isWeedGoblinsFreeTextScene(state) {
  if (!state || state.status !== 'active') return false
  return ![
    CHAPTER_ONE_STATIC_SCENES.sessionName,
    CHAPTER_ONE_STATIC_SCENES.sessionRace,
    CHAPTER_ONE_STATIC_SCENES.sessionWeapon,
    CHAPTER_ONE_STATIC_SCENES.background,
    CHAPTER_ONE_STATIC_SCENES.sessionPronoun,
    CHAPTER_ONE_STATIC_SCENES.sessionLook,
    CHAPTER_ONE_STATIC_SCENES.gearMark,
    CHAPTER_ONE_STATIC_SCENES.campSmell,
  ].includes(state.sceneId)
}

export function getChapterOneSecret(state, id) {
  return hasSecret(state, id) ? SECRET_BY_ID.get(id) || null : null
}
