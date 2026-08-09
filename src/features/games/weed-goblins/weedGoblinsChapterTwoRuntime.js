import {
  CHAPTER_TWO,
  CHAPTER_TWO_LOCATIONS,
  CHAPTER_TWO_MARKET_STATES,
  CHAPTER_TWO_REWARDS,
} from './weedGoblinsChapterTwo.js'
import {
  DIFFICULTY,
  NARRATION_TIERS,
  calculateNarrationTier,
} from './weedGoblinsEngine.js'

export const CHAPTER_TWO_STARTING_ROOTCOIN = 1
export const CHAPTER_TWO_LANTERN_ORDER = 'moth-root-coin'

export const CHAPTER_TWO_DANGER_TIERS = Object.freeze({
  sprout: Object.freeze({ id: 'sprout', label: 'Sprout', dc: DIFFICULTY.easy }),
  bloom: Object.freeze({ id: 'bloom', label: 'Bloom', dc: DIFFICULTY.standard }),
  harvest: Object.freeze({ id: 'harvest', label: 'Harvest', dc: DIFFICULTY.hard }),
  wither: Object.freeze({ id: 'wither', label: 'Wither', dc: DIFFICULTY.goblinKing }),
})

export const CHAPTER_TWO_WOUNDS = Object.freeze([
  'None',
  'Scraped',
  'Bruised',
  'Broken',
  'Downed',
])

export const CHAPTER_TWO_SCENES = Object.freeze({
  lanternOrder: 'hollow-market:lantern-order',
  entryPrice: 'hollow-market:entry-price',
  whisperRows: 'hollow-market:whisper-rows',
  rootExchange: 'hollow-market:root-exchange',
  rootCollector: 'hollow-market:root-collector',
  ledgerDecision: 'hollow-market:ledger-decision',
  drainGate: 'hollow-market:drain-gate',
  ending: 'hollow-market:ending',
})

const LOCATION_IDS = Object.values(CHAPTER_TWO_LOCATIONS).map((location) => location.id)
const VALID_MARKET_STATES = new Set(CHAPTER_TWO_MARKET_STATES)
const VALID_REWARDS = new Set(Object.values(CHAPTER_TWO_REWARDS))

const NATURAL_ONE_COMPLICATIONS = Object.freeze([
  'The nearest black-root receipt stamps your sleeve APPROVED FOR THE WRONG DOOR. Two Trouble, no appeal form.',
  'A smokeless lantern turns itself around so it can pretend it did not see that. Two Trouble, and the market notices anyway.',
  'A receipt-root knots around your boot, presents a tiny invoice, and refuses to explain the service charge. Two Trouble.',
  'A clerk rings a brass bell marked MINOR PROCEDURAL CATASTROPHE. Nobody panics, which is worse. Two Trouble.',
])

const CATEGORY_FICTIONS = Object.freeze([
  Object.freeze({ pattern: /flower|bud|dry/i, recognized: 'pressed blossom stall', counterfeit: 'wax-sealed blossom bundle' }),
  Object.freeze({ pattern: /vape|cart|pod/i, recognized: 'mist-cartridge counter', counterfeit: 'brass mist cartridge' }),
  Object.freeze({ pattern: /edible|gummy|food/i, recognized: 'sugar-charm stall', counterfeit: 'sugar charm in counterfeit guild paper' }),
  Object.freeze({ pattern: /concentrate|resin|wax|extract/i, recognized: 'resin ampoule stall', counterfeit: 'clouded resin ampoule' }),
  Object.freeze({ pattern: /tincture|drop/i, recognized: 'dropper-phial stall', counterfeit: 'ink-dark dropper phial' }),
])

const DEFAULT_PERSONALIZATION = Object.freeze({
  recognizedStall: 'sealed field-goods stall',
  counterfeitItem: 'counterfeit field parcel',
})

function cleanText(value, maxLength = 240) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
    : ''
}

function uniqueText(values = [], allowed = null) {
  const seen = new Set()
  const result = []
  for (const value of values) {
    const text = cleanText(value, 120)
    if (!text || seen.has(text) || (allowed && !allowed.has(text))) continue
    seen.add(text)
    result.push(text)
  }
  return result
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
  return {
    rngState: next || 0x9e3779b9,
    value: next / 0x100000000,
  }
}

function normalizeCount(value) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return 0
  return Math.floor(number)
}

function createRoomState(initialRoomId = CHAPTER_TWO_LOCATIONS.lanternMouth.id) {
  const state = {}
  for (const id of LOCATION_IDS) {
    state[id] = { roomId: id, visited: id === initialRoomId, visitCount: id === initialRoomId ? 1 : 0 }
  }
  return state
}

function visitRoom(roomState, roomId) {
  if (!LOCATION_IDS.includes(roomId)) return roomState
  const current = roomState?.[roomId] || { roomId, visited: false, visitCount: 0 }
  return {
    ...roomState,
    [roomId]: {
      roomId,
      visited: true,
      visitCount: Number(current.visitCount || 0) + 1,
    },
  }
}

function cloneState(state, changes = {}) {
  return {
    ...state,
    ...changes,
    stats: { ...state.stats, ...(changes.stats || {}) },
    flags: { ...state.flags, ...(changes.flags || {}) },
    chapterTwo: { ...state.chapterTwo, ...(changes.chapterTwo || {}) },
    roomState: changes.roomState || { ...state.roomState },
    inventory: changes.inventory || [...state.inventory],
    effects: changes.effects || {
      body: [...(state.effects?.body || [])],
      mind: [...(state.effects?.mind || [])],
      mood: [...(state.effects?.mood || [])],
    },
    history: changes.history || [...state.history],
    narration: changes.narration || [...state.narration],
  }
}

function appendEvent(state, event, narrationLine = '') {
  return cloneState(state, {
    history: [...state.history, event],
    narration: narrationLine ? [...state.narration, narrationLine] : [...state.narration],
  })
}

function enterScene(state, sceneId, roomId, narrationLine = '') {
  let next = cloneState(state, {
    sceneId,
    currentRoomId: roomId,
    roomState: state.currentRoomId === roomId
      ? state.roomState
      : visitRoom(state.roomState, roomId),
  })
  if (narrationLine) next = appendEvent(next, {
    type: 'scene',
    sceneId,
    actionId: 'scene:enter',
    outcome: 'intro',
  }, narrationLine)
  return next
}

function currentDangerTier(state) {
  if (state.sceneId === CHAPTER_TWO_SCENES.lanternOrder) return CHAPTER_TWO_DANGER_TIERS.sprout
  if (state.sceneId === CHAPTER_TWO_SCENES.entryPrice) return CHAPTER_TWO_DANGER_TIERS.sprout
  if (state.sceneId === CHAPTER_TWO_SCENES.whisperRows) return CHAPTER_TWO_DANGER_TIERS.bloom
  if (state.sceneId === CHAPTER_TWO_SCENES.rootExchange) return CHAPTER_TWO_DANGER_TIERS.harvest
  if (state.sceneId === CHAPTER_TWO_SCENES.rootCollector) return CHAPTER_TWO_DANGER_TIERS.wither
  if (state.sceneId === CHAPTER_TWO_SCENES.ledgerDecision) return CHAPTER_TWO_DANGER_TIERS.harvest
  if (state.sceneId === CHAPTER_TWO_SCENES.drainGate) return CHAPTER_TWO_DANGER_TIERS.bloom
  return CHAPTER_TWO_DANGER_TIERS.sprout
}

export function buildChapterTwoPersonalization(snapshot = {}) {
  const categories = Array.isArray(snapshot?.productCategories)
    ? snapshot.productCategories.map((value) => cleanText(value, 80)).filter(Boolean)
    : []
  const category = categories[0] || ''
  const mapped = CATEGORY_FICTIONS.find(({ pattern }) => pattern.test(category))
  return Object.freeze({
    ...DEFAULT_PERSONALIZATION,
    ...(mapped ? { recognizedStall: mapped.recognized, counterfeitItem: mapped.counterfeit } : {}),
  })
}

function latestChapterTwoRun(previousRuns = []) {
  if (!Array.isArray(previousRuns)) return null
  for (let index = previousRuns.length - 1; index >= 0; index -= 1) {
    if (previousRuns[index]?.adventureId === CHAPTER_TWO.adventureId) return previousRuns[index]
  }
  return null
}

function inheritedInventory(previousRuns = []) {
  const rewards = []
  for (const run of previousRuns) {
    if (run?.adventureId !== CHAPTER_TWO.adventureId) continue
    for (const reward of run.chapterTwoRewards || []) rewards.push(reward)
  }
  return uniqueText(rewards, VALID_REWARDS)
}

function inheritedRootcoin(previousRuns = []) {
  const latest = latestChapterTwoRun(previousRuns)
  const remaining = Number(latest?.rootcoinRemaining)
  if (Number.isInteger(remaining) && remaining >= 0 && remaining <= 99) return remaining
  return CHAPTER_TWO_STARTING_ROOTCOIN
}

export function createChapterTwoRunFromSessionZero(sessionState, {
  previousRuns = [],
  personalization = sessionState?.chapterTwoPersonalization || DEFAULT_PERSONALIZATION,
} = {}) {
  if (!sessionState?.flags?.sessionZeroComplete) {
    throw new Error('Chapter 2 requires completed Session Zero character setup.')
  }

  const chapterTwoRunCount = Array.isArray(previousRuns)
    ? previousRuns.filter((run) => run?.adventureId === CHAPTER_TWO.adventureId).length
    : 0
  const narrationTier = calculateNarrationTier(chapterTwoRunCount)
  const inventory = inheritedInventory(previousRuns)
  const rootcoin = inheritedRootcoin(previousRuns)

  return {
    version: 2,
    chapterNumber: 2,
    adventureId: CHAPTER_TWO.adventureId,
    adventure: CHAPTER_TWO,
    seed: String(sessionState.seed || 'hollow-market-session-1'),
    rngState: Number(sessionState.rngState) >>> 0 || hashSeed(sessionState.seed),
    status: 'active',
    sceneId: CHAPTER_TWO_SCENES.lanternOrder,
    currentRoomId: CHAPTER_TWO_LOCATIONS.lanternMouth.id,
    roomState: createRoomState(),
    playerName: sessionState.playerName || null,
    playerRace: sessionState.playerRace || null,
    playerWeapon: sessionState.playerWeapon || null,
    playerPronoun: sessionState.playerPronoun || null,
    playerLook: sessionState.playerLook || null,
    background: sessionState.background || null,
    stats: {
      strength: Number(sessionState.stats?.strength) || 0,
      defense: Number(sessionState.stats?.defense) || 0,
      manaPool: Number(sessionState.stats?.manaPool) || 0,
      maxMana: Number(sessionState.stats?.maxMana) || Number(sessionState.stats?.manaPool) || 0,
    },
    trouble: 0,
    complicationCount: 0,
    priorCompletedRunCount: normalizeCount(chapterTwoRunCount),
    narrationTier: Object.values(NARRATION_TIERS).includes(narrationTier)
      ? narrationTier
      : NARRATION_TIERS.normal,
    rootcoin,
    wound: 'None',
    inventory,
    effects: { body: [], mind: [], mood: [] },
    flags: {
      sessionZeroComplete: true,
      nameSuggestionsVisible: false,
    },
    chapterTwo: {
      lanternSolved: false,
      lanternAttempts: 0,
      entryPrice: null,
      favorOwed: false,
      recognizedStall: cleanText(personalization?.recognizedStall, 120) || DEFAULT_PERSONALIZATION.recognizedStall,
      counterfeitItem: cleanText(personalization?.counterfeitItem, 120) || DEFAULT_PERSONALIZATION.counterfeitItem,
      merchantClues: [],
      receiptClue: false,
      ledgerResolution: null,
      ledgerRearrangements: 0,
      collectorOutcome: null,
      ledgerDisposition: null,
      marketState: 'operational',
      wardenSettlement: null,
    },
    ending: null,
    runSummary: null,
    history: [{
      type: 'chapter-start',
      sceneId: CHAPTER_TWO_SCENES.lanternOrder,
      actionId: 'chapter-two:start',
      outcome: 'intro',
    }],
    narration: [
      `Beneath a collapsed root bridge, three smokeless lanterns hang over a sealed crack in the stone. The Hollow Market only opens when they are lit in the right order.`,
    ],
  }
}

function action(id, label, detail, config = {}) {
  return Object.freeze({ id, label, detail, ...config })
}

const LANTERN_ACTIONS = Object.freeze([
  action('lantern:moth-root-coin', 'Moth, root, coin', 'Light the moth-marked lantern first, then root, then coin.', { order: 'moth-root-coin' }),
  action('lantern:root-coin-moth', 'Root, coin, moth', 'Start with the root mark and finish on the moth.', { order: 'root-coin-moth' }),
  action('lantern:coin-moth-root', 'Coin, moth, root', 'Lead with the coin and leave the root for last.', { order: 'coin-moth-root' }),
  action('lantern:coin-root-moth', 'Coin, root, moth', 'Try the most bureaucratic-looking sequence.', { order: 'coin-root-moth' }),
])

function traceReady(state) {
  return state.chapterTwo.receiptClue === true && state.chapterTwo.merchantClues.length >= 1
}

function hasReward(state, reward) {
  return state.inventory.includes(reward)
}

function availableWhisperActions(state) {
  return [
    action(
      'trace:sixfinger',
      'Ask Grintle who pays the tithe',
      'Trade leverage with Grintle Sixfinger without giving him more than he earns.',
      { check: { stat: 'defense', dangerTier: 'bloom' } },
    ),
    action(
      'trace:nettle',
      'Follow Nettle through Whisper Rows',
      'Shadow the runner and see where the receipts actually go.',
      { check: { stat: 'defense', dangerTier: 'bloom' } },
    ),
    action(
      'trace:auntie',
      'Make a favor deal with Auntie Resin',
      'Take her masking charm now and owe her one clean favor later.',
    ),
    action(
      'trace:receipt',
      `Inspect the receipt beneath the ${state.chapterTwo.recognizedStall}`,
      `A living receipt slips under a counterfeit ${state.chapterTwo.counterfeitItem}. Follow it without spooking the stall.`,
      { check: { stat: 'defense', dangerTier: 'harvest' } },
    ),
  ]
}

function collectorActions(state) {
  const actions = [
    action('collector:evade', 'Slip between the Collector and the ledger', 'Use position and timing to get out of its reach.', { check: { stat: 'defense', dangerTier: 'wither' } }),
    action('collector:brace', 'Break its receipt-roots apart', 'Use force to tear open a route before it closes.', { check: { stat: 'strength', dangerTier: 'wither' } }),
    action('collector:climb', 'Take the ledger shelves upward', 'Use the Exchange itself as a route the Collector cannot flatten at once.', { check: { stat: 'defense', dangerTier: 'wither' } }),
    action('collector:cut-roots', 'Cut the black-root anchor lines', 'Break the Collector away from the floor long enough to move.', { check: { stat: 'strength', dangerTier: 'wither' } }),
  ]
  if (state.stats.manaPool > 0) actions.push(action(
    'collector:mana',
    'Spend Mana and move through the gap',
    'Roll with advantage against the Wither-tier threat.',
    { check: { stat: 'defense', dangerTier: 'wither', manaCost: 1 } },
  ))
  return actions.slice(0, 5)
}

function ledgerDecisionActions() {
  return [
    action('ledger:keep-operational', 'Keep the market operating', 'Keep the trade moving and preserve a supplier route.'),
    action('ledger:expose-tithe', 'Expose the Cultivator’s tithe', 'Turn the living ledger outward and let the merchants see the extraction chain.'),
    action('ledger:burn-flood', 'Burn or flood the Exchange', 'Destroy the market infrastructure and scatter the trade.', { check: { stat: 'strength', dangerTier: 'harvest' } }),
    action('ledger:take-route', 'Quietly take one trade route', 'Alter one route record without trying to own the whole market.', { check: { stat: 'defense', dangerTier: 'harvest' } }),
  ]
}

function drainGateActions(state) {
  const actions = [
    action('exit:drain', 'Leave through the Drain Gate', 'Take the ledger copy and get clear before the market changes its mind.'),
    action('exit:settle', 'Settle directly with the Coin Warden', 'Use the ledger and your market position to negotiate a clean exit.', { check: { stat: 'defense', dangerTier: 'harvest' } }),
    action('exit:ledger-proof', 'Put the Harvest Ledger on the table', 'Make the Warden answer the market’s own records before you leave.'),
    action('exit:favor', 'Offer a future favor instead of coin', 'Leave owing one precise market favor, not an open-ended promise.'),
  ]
  if (state.rootcoin > 0) actions.push(action(
    'exit:rootcoin',
    'Pay one Rootcoin and close the account',
    'Use market currency to end the argument cleanly.',
  ))
  return actions.slice(0, 5)
}

export function getChapterTwoAvailableActions(state) {
  if (!state || state.status === 'completed') return []
  if (state.sceneId === CHAPTER_TWO_SCENES.lanternOrder) return LANTERN_ACTIONS
  if (state.sceneId === CHAPTER_TWO_SCENES.entryPrice) {
    const actions = []
    if (state.rootcoin > 0) actions.push(action('entry:coin', 'Pay one Rootcoin', 'Use market currency and owe nobody anything.'))
    actions.push(
      action('entry:memory', 'Pay with a road-memory', 'Offer a fictional travel memory token. No journal content is used.'),
      action('entry:favor', 'Sign for one favor', 'Enter now and owe the market one bounded favor.'),
      action('entry:negotiate', 'Negotiate the favor before signing', 'Make the Coin Warden narrow the favor to one named service before you accept it.', { check: { stat: 'defense', dangerTier: 'bloom' } }),
      action('entry:ask', 'Ask what counts as a favor', 'Make the Coin Warden define the rule before you accept it.'),
    )
    return actions.slice(0, 5)
  }
  if (state.sceneId === CHAPTER_TWO_SCENES.whisperRows) return availableWhisperActions(state).slice(0, 5)
  if (state.sceneId === CHAPTER_TWO_SCENES.rootExchange) {
    return [
      action('ledger:truth', 'Tell the ledger exactly why you are here', 'The living pages stop moving when they are given a statement they can verify.'),
      action('ledger:compare', 'Match the living receipt to the ledger', 'Use the tribute trail you already followed instead of bluffing.'),
      action('ledger:watch', 'Watch one lie get corrected', 'Let another merchant lie first and study exactly how the ledger rearranges.'),
      action('ledger:lie', 'Feed the ledger a careful lie', 'Try to make the pages expose what they correct.', { check: { stat: 'defense', dangerTier: 'harvest' } }),
      action('ledger:mana', 'Spend Mana to read the moving pattern', 'Roll with advantage while the pages rearrange.', { check: { stat: 'defense', dangerTier: 'harvest', manaCost: 1 } }),
    ].filter((candidate) => candidate.id !== 'ledger:mana' || state.stats.manaPool > 0)
  }
  if (state.sceneId === CHAPTER_TWO_SCENES.rootCollector) return collectorActions(state)
  if (state.sceneId === CHAPTER_TWO_SCENES.ledgerDecision) return ledgerDecisionActions()
  if (state.sceneId === CHAPTER_TWO_SCENES.drainGate) return drainGateActions(state)
  return []
}

function noRollPreview() {
  return Object.freeze({
    requiresRoll: false,
    stat: null,
    dc: null,
    statBonus: 0,
    requiredDie: null,
    manaCost: 0,
    advantage: false,
    dangerTier: null,
  })
}

export function getChapterTwoActionCheckPreview(state, actionId) {
  const selected = getChapterTwoAvailableActions(state).find((candidate) => candidate.id === actionId)
  if (!selected?.check) return noRollPreview()
  const tier = CHAPTER_TWO_DANGER_TIERS[selected.check.dangerTier] || currentDangerTier(state)
  const stat = selected.check.stat
  const manaCost = Number(selected.check.manaCost) || 0
  const statBonus = Number(state.stats?.[stat]) || 0
  return Object.freeze({
    requiresRoll: true,
    stat,
    dc: tier.dc,
    statBonus,
    requiredDie: Math.min(20, Math.max(2, tier.dc - statBonus)),
    manaCost,
    advantage: manaCost > 0,
    dangerTier: tier.id,
  })
}

function complicationFor(state) {
  return NATURAL_ONE_COMPLICATIONS[state.complicationCount % NATURAL_ONE_COMPLICATIONS.length]
}

function rollD20(state) {
  const draw = nextRandom(state.rngState)
  return {
    roll: Math.floor(draw.value * 20) + 1,
    rngState: draw.rngState,
  }
}

function spendMana(state, amount, actionId) {
  if (amount <= 0) return state
  if (state.stats.manaPool < amount) throw new Error(`Not enough Mana for ${actionId}.`)
  return appendEvent(
    cloneState(state, { stats: { manaPool: state.stats.manaPool - amount } }),
    { type: 'mana', sceneId: state.sceneId, actionId, amount },
    `You spend ${amount} Mana.`,
  )
}

function advanceWound(wound, steps = 1) {
  const index = Math.max(0, CHAPTER_TWO_WOUNDS.indexOf(wound))
  return CHAPTER_TWO_WOUNDS[Math.min(CHAPTER_TWO_WOUNDS.length - 1, index + steps)]
}

function completeForcedEscape(state, reason) {
  return completeChapterTwoRun(
    cloneState(state, {
      chapterTwo: {
        marketState: VALID_MARKET_STATES.has(state.chapterTwo.marketState)
          ? state.chapterTwo.marketState
          : 'regulated',
        wardenSettlement: 'forced-exit',
      },
    }),
    'forced-escape',
    reason,
  )
}

function applyOrdinaryFailureConsequence(state, selected, event) {
  const tier = selected?.check?.dangerTier || currentDangerTier(state).id
  let next = cloneState(state, { trouble: Math.min(3, state.trouble + 1) })

  if (tier === 'harvest' && ['trace:receipt', 'ledger:lie', 'ledger:burn-flood', 'ledger:take-route'].includes(selected.id)) {
    next = cloneState(next, { wound: advanceWound(next.wound, 1) })
  }
  if (tier === 'wither') {
    next = cloneState(next, {
      wound: 'Downed',
      chapterTwo: { collectorOutcome: 'downed-but-survived' },
    })
  }

  if (next.trouble >= 3 && tier !== 'wither') {
    return completeForcedEscape(next, `${selected.id} failed with three Trouble`)
  }

  if (tier === 'wither') {
    return enterScene(
      next,
      CHAPTER_TWO_SCENES.ledgerDecision,
      CHAPTER_TWO_LOCATIONS.rootExchange.id,
      'The Collector puts you down hard enough to end the scene, not the run. When you can move again, the ledger is still there and the market has already started arguing over who owns the next minute.',
    )
  }

  return appendEvent(next, {
    type: 'failure-consequence',
    sceneId: state.sceneId,
    actionId: selected.id,
    outcome: 'failure-forward',
    dangerTier: tier,
    relatedCheck: event.actionId,
  })
}

function resolveCheck(state, selected) {
  const preview = getChapterTwoActionCheckPreview(state, selected.id)
  let working = state
  if (preview.manaCost > 0) working = spendMana(working, preview.manaCost, selected.id)

  const first = rollD20(working)
  working = cloneState(working, { rngState: first.rngState })
  const rolls = [first.roll]
  if (preview.advantage) {
    const second = rollD20(working)
    working = cloneState(working, { rngState: second.rngState })
    rolls.push(second.roll)
  }

  const finalRoll = Math.max(...rolls)
  const total = finalRoll + preview.statBonus
  const success = finalRoll === 20 || total >= preview.dc
  const naturalOne = finalRoll === 1
  const event = {
    type: 'check',
    sceneId: state.sceneId,
    actionId: selected.id,
    stat: preview.stat,
    dc: preview.dc,
    dangerTier: preview.dangerTier,
    rolls,
    roll: finalRoll,
    total,
    success,
    naturalOne,
    advantage: preview.advantage,
    manaAssisted: preview.advantage,
    manaCost: preview.manaCost,
    outcome: naturalOne ? 'complication' : success ? 'success' : 'failure',
  }

  if (naturalOne) {
    const text = complicationFor(working)
    return {
      state: appendEvent(
        cloneState(working, {
          trouble: Math.min(2, working.trouble + 2),
          complicationCount: working.complicationCount + 1,
        }),
        { ...event, success: false, naturalOne: true, outcome: 'complication', complicationText: text },
        text,
      ),
      success: false,
      naturalOne: true,
      event,
    }
  }

  working = appendEvent(
    working,
    event,
    success
      ? `Your move works at ${selected.label.toLowerCase()}.`
      : `Your move does not get you what you wanted. The market changes around the failure instead of stopping.`,
  )

  if (success && finalRoll === 20 && working.trouble > 0) {
    working = cloneState(working, { trouble: working.trouble - 1 })
  }
  if (!success) working = applyOrdinaryFailureConsequence(working, selected, event)

  return { state: working, success, naturalOne: false, event }
}

function addInventory(state, reward) {
  if (!VALID_REWARDS.has(reward) || state.inventory.includes(reward)) return state
  return cloneState(state, { inventory: [...state.inventory, reward] })
}

function addMerchantClue(state, clue) {
  const clues = uniqueText([...state.chapterTwo.merchantClues, clue])
  return cloneState(state, { chapterTwo: { merchantClues: clues } })
}

function enterWhisperRows(state, narrationLine) {
  return enterScene(state, CHAPTER_TWO_SCENES.whisperRows, CHAPTER_TWO_LOCATIONS.whisperRows.id, narrationLine)
}

function enterRootExchange(state, narrationLine) {
  return enterScene(state, CHAPTER_TWO_SCENES.rootExchange, CHAPTER_TWO_LOCATIONS.rootExchange.id, narrationLine)
}

function enterCollector(state, ledgerResolution, narrationLine) {
  return enterScene(
    cloneState(state, { chapterTwo: { ledgerResolution } }),
    CHAPTER_TWO_SCENES.rootCollector,
    CHAPTER_TWO_LOCATIONS.rootExchange.id,
    narrationLine,
  )
}

function enterLedgerDecision(state, outcome, narrationLine) {
  return enterScene(
    cloneState(state, { chapterTwo: { collectorOutcome: outcome } }),
    CHAPTER_TWO_SCENES.ledgerDecision,
    CHAPTER_TWO_LOCATIONS.rootExchange.id,
    narrationLine,
  )
}

function enterDrainGate(state, narrationLine) {
  return enterScene(state, CHAPTER_TWO_SCENES.drainGate, CHAPTER_TWO_LOCATIONS.drainGate.id, narrationLine)
}

function postTraceTransition(state) {
  if (!traceReady(state)) return state
  return enterRootExchange(
    state,
    'The merchant story and the living receipt finally agree on one place: the Root Exchange, where the market keeps a ledger that rearranges itself whenever somebody lies to it.',
  )
}

function resolveNoRollAction(state, selected) {
  const id = selected.id

  if (id.startsWith('lantern:')) {
    const attempts = state.chapterTwo.lanternAttempts + 1
    if (selected.order === CHAPTER_TWO_LANTERN_ORDER) {
      return enterScene(
        cloneState(state, { chapterTwo: { lanternSolved: true, lanternAttempts: attempts } }),
        CHAPTER_TWO_SCENES.entryPrice,
        CHAPTER_TWO_LOCATIONS.lanternMouth.id,
        'Moth, root, coin. The three smokeless flames lean toward one another and the crack beneath the bridge opens into a stair. The Coin Warden is already waiting at the bottom with a price list.',
      )
    }
    return appendEvent(
      cloneState(state, { chapterTwo: { lanternAttempts: attempts } }),
      { type: 'puzzle', sceneId: state.sceneId, actionId: id, outcome: 'wrong-order' },
      'The third lantern goes dark. A brass tag flips over by itself: ORDER INCORRECT, MARKET STILL EXTREMELY SECRET. The lanterns reset.',
    )
  }

  if (id === 'entry:ask') {
    return appendEvent(state, { type: 'choice', sceneId: state.sceneId, actionId: id, outcome: 'information' }, 'The Coin Warden defines a favor as one specific service, named before collection, with no interest and no inheritance. Goblin contract law has apparently discovered restraint.')
  }

  if (['entry:coin', 'entry:memory', 'entry:favor'].includes(id)) {
    const price = id.slice('entry:'.length)
    let next = state
    if (price === 'coin') {
      if (state.rootcoin < 1) throw new Error('Not enough Rootcoin.')
      next = cloneState(state, { rootcoin: state.rootcoin - 1 })
    }
    next = cloneState(next, {
      chapterTwo: {
        entryPrice: price,
        favorOwed: price === 'favor' || next.chapterTwo.favorOwed,
      },
    })
    return enterWhisperRows(
      next,
      `The Warden accepts ${price === 'coin' ? 'one Rootcoin' : price === 'memory' ? 'a sealed road-memory token' : 'one bounded future favor'}. Whisper Rows opens around you, and a ${next.chapterTwo.recognizedStall} reacts to your presence before any merchant does. Beside it sits a ${next.chapterTwo.counterfeitItem}.`,
    )
  }

  if (id === 'trace:auntie') {
    let next = addMerchantClue(state, 'auntie-resin')
    next = addInventory(next, CHAPTER_TWO_REWARDS.marketVeil)
    next = cloneState(next, { chapterTwo: { favorOwed: true } })
    next = appendEvent(next, { type: 'choice', sceneId: state.sceneId, actionId: id, outcome: 'favor-deal' }, 'Auntie Resin folds a Market Veil into your hand and names one future favor: help get her confiscated nephew clear when the chance comes. In return, she points straight at the living receipt route.')
    return postTraceTransition(next)
  }

  if (id === 'ledger:watch') {
    return appendEvent(state, { type: 'choice', sceneId: state.sceneId, actionId: id, outcome: 'information' }, 'A merchant lies about a tithe payment. The ledger grows a new black-root line, drags the false number into a margin, and points toward the same hidden route your receipt used.')
  }

  if (id === 'ledger:truth') {
    return enterCollector(state, 'truth-stabilized', 'You tell the ledger exactly what you came to trace. The pages stop rearranging long enough to expose the Cultivator’s tithe chain. Then every loose receipt in the Exchange turns toward the same doorway.')
  }

  if (id === 'ledger:compare') {
    return enterCollector(state, 'receipt-matched', 'You press the living receipt against its matching line. The ledger locks into place around the contradiction, revealing the tithe route. Something tall begins assembling itself from the receipts under the tables.')
  }

  if (id === 'ledger:keep-operational') {
    let next = addInventory(state, CHAPTER_TWO_REWARDS.harvestLedger)
    next = cloneState(next, { chapterTwo: { ledgerDisposition: 'copied', marketState: 'operational' } })
    return enterDrainGate(next, 'You copy the Harvest Ledger without breaking the market’s machinery. Trade keeps moving, which means the route stays useful and the Coin Warden now has a very specific reason to stop you at the Drain Gate.')
  }

  if (id === 'ledger:expose-tithe') {
    let next = addInventory(state, CHAPTER_TWO_REWARDS.harvestLedger)
    next = cloneState(next, { chapterTwo: { ledgerDisposition: 'exposed', marketState: 'exposed' } })
    return enterDrainGate(next, 'You turn the Harvest Ledger outward. Whisper Rows sees the same tithe totals at once, and the market discovers collective bargaining with alarming speed. The revolt reaches the Drain Gate before you do.')
  }

  if (['exit:drain', 'exit:ledger-proof', 'exit:favor', 'exit:rootcoin'].includes(id)) {
    let next = state
    if (id === 'exit:favor') {
      next = addInventory(next, CHAPTER_TWO_REWARDS.favorContract)
      next = cloneState(next, { chapterTwo: { favorOwed: true, wardenSettlement: 'favor' } })
    } else if (id === 'exit:rootcoin') {
      if (next.rootcoin < 1) throw new Error('Not enough Rootcoin.')
      next = cloneState(next, { rootcoin: next.rootcoin - 1, chapterTwo: { wardenSettlement: 'rootcoin' } })
    } else if (id === 'exit:ledger-proof') {
      next = cloneState(next, { chapterTwo: { wardenSettlement: 'ledger-proof' } })
    } else {
      next = cloneState(next, { chapterTwo: { wardenSettlement: 'drain-exit' } })
    }
    return completeChapterTwoRun(next, endingForMarketState(next.chapterTwo.marketState))
  }

  return appendEvent(state, { type: 'choice', sceneId: state.sceneId, actionId: id, outcome: 'no-roll' }, `You choose ${selected.label}.`)
}

function applySuccessfulCheckedAction(state, selected) {
  const id = selected.id
  if (id === 'entry:negotiate') {
    const next = cloneState(state, {
      chapterTwo: { entryPrice: 'favor', favorOwed: true },
    })
    return enterWhisperRows(
      next,
      `The Coin Warden narrows the favor to one named service, seals the terms, and opens Whisper Rows. A ${next.chapterTwo.recognizedStall} reacts to your presence before any merchant does. Beside it sits a ${next.chapterTwo.counterfeitItem}.`,
    )
  }
  if (id === 'trace:sixfinger') {
    let next = addMerchantClue(state, 'grintle-sixfinger')
    next = addInventory(next, CHAPTER_TWO_REWARDS.sixfingersMarker)
    next = appendEvent(next, { type: 'clue', sceneId: state.sceneId, actionId: id, outcome: 'merchant-clue' }, 'Grintle Sixfinger gives you the tithe route and slides over his brass marker, which is apparently both a favor token and an argument starter.')
    return postTraceTransition(next)
  }
  if (id === 'trace:nettle') {
    let next = addMerchantClue(state, 'nettle')
    next = appendEvent(next, { type: 'clue', sceneId: state.sceneId, actionId: id, outcome: 'merchant-clue' }, 'Nettle leads you through three false aisles and one real one. Every route ends at the Root Exchange, where green-cloaked collectors never pay at the door.')
    return postTraceTransition(next)
  }
  if (id === 'trace:receipt') {
    let next = cloneState(state, { chapterTwo: { receiptClue: true } })
    next = appendEvent(next, { type: 'clue', sceneId: state.sceneId, actionId: id, outcome: 'receipt-clue' }, 'You keep pace with the living receipt until it disappears into a floor crack stamped ROOT EXCHANGE. The counterfeit was bait. The receipt is the real trail.')
    return postTraceTransition(next)
  }
  if (id === 'ledger:lie') {
    return enterCollector(state, 'lie-exposed-pattern', 'The ledger catches your lie, rearranges itself to correct you, and exposes the tithe route in the act. Unfortunately, the correction also rings whatever passes for an alarm in a book made of roots.')
  }
  if (id === 'ledger:mana') {
    return enterCollector(state, 'mana-read-pattern', 'Mana catches the page-shifts between movements. The tithe pattern holds still just long enough to read. The Root Collector arrives early anyway.')
  }
  if (id.startsWith('collector:')) {
    return enterLedgerDecision(state, id.slice('collector:'.length), 'You get clear of the Root Collector without pretending you defeated it. The ledger is still yours to act on, and the whole market is listening for what you do next.')
  }
  if (id === 'ledger:burn-flood') {
    let next = addInventory(state, CHAPTER_TWO_REWARDS.harvestLedger)
    next = cloneState(next, { chapterTwo: { ledgerDisposition: 'copied-before-destruction', marketState: 'burned' } })
    return enterDrainGate(next, 'You take the ledger copy first, then break the Exchange hard enough that the market begins emptying through every illegal exit it has. The Drain Gate becomes the only organized route left.')
  }
  if (id === 'ledger:take-route') {
    let next = addInventory(state, CHAPTER_TWO_REWARDS.harvestLedger)
    next = cloneState(next, { chapterTwo: { ledgerDisposition: 'route-copied', marketState: 'secretly-controlled-by-player' } })
    return enterDrainGate(next, 'You alter one route quietly and leave the rest untouched. By the time the ledger notices, that trade line answers to your marker. The Coin Warden notices sooner.')
  }
  if (id === 'exit:settle') {
    let next = addInventory(state, CHAPTER_TWO_REWARDS.favorContract)
    if (next.chapterTwo.marketState === 'operational') {
      next = cloneState(next, { chapterTwo: { marketState: 'regulated' } })
    }
    next = cloneState(next, { chapterTwo: { wardenSettlement: 'negotiated' } })
    return completeChapterTwoRun(next, endingForMarketState(next.chapterTwo.marketState))
  }
  return state
}

function endingForMarketState(marketState) {
  if (marketState === 'exposed') return 'market-revolt'
  if (marketState === 'burned') return 'market-scattered'
  if (marketState === 'secretly-controlled-by-player') return 'trade-route'
  if (marketState === 'regulated') return 'warden-regulated'
  return 'market-operational'
}

function endingNarration(state) {
  const stateText = state.chapterTwo.marketState === 'exposed'
    ? 'Behind you, the market is in open revolt.'
    : state.chapterTwo.marketState === 'burned'
      ? 'Behind you, the Hollow Market is scattering into smaller, harder-to-track routes.'
      : state.chapterTwo.marketState === 'secretly-controlled-by-player'
        ? 'One quiet trade route now answers to your marker.'
        : state.chapterTwo.marketState === 'regulated'
          ? 'The Coin Warden keeps the market open under a new set of rules.'
          : 'The Hollow Market keeps operating, useful and compromised.'
  return `${stateText} Your Harvest Ledger copy points toward the Withered Grove. The Cultivator now wants living roots, emotional residue, and repeatedly used personal objects, not ordinary loot.`
}

export function completeChapterTwoRun(state, ending, reason = null) {
  let working = hasReward(state, CHAPTER_TWO_REWARDS.harvestLedger)
    ? state
    : addInventory(state, CHAPTER_TWO_REWARDS.harvestLedger)
  const rewards = uniqueText(working.inventory, VALID_REWARDS)
  const summary = {
    adventureId: CHAPTER_TWO.adventureId,
    seed: working.seed,
    backgroundId: working.background?.id || null,
    ending,
    outcomeSummary: `${endingForMarketState(working.chapterTwo.marketState)}; Harvest Ledger points to the Withered Grove`,
    trouble: working.trouble,
    manaRemaining: working.stats.manaPool,
    complicationCount: working.complicationCount,
    narrationTier: working.narrationTier,
    rootcoinRemaining: working.rootcoin,
    wound: working.wound,
    chapterTwoBranches: {
      entryPrice: working.chapterTwo.entryPrice || 'none',
      marketState: working.chapterTwo.marketState,
      ledgerDisposition: working.chapterTwo.ledgerDisposition || 'copied',
      collectorOutcome: working.chapterTwo.collectorOutcome || 'survived',
      wardenSettlement: working.chapterTwo.wardenSettlement || 'none',
      recognizedStall: working.chapterTwo.recognizedStall,
    },
    chapterTwoRewards: rewards,
    reason,
  }
  working = cloneState(working, {
    status: 'completed',
    sceneId: CHAPTER_TWO_SCENES.ending,
    ending,
    runSummary: summary,
  })
  return appendEvent(working, {
    type: 'ending',
    sceneId: CHAPTER_TWO_SCENES.ending,
    actionId: 'chapter-two:ending',
    outcome: ending,
    reason,
  }, endingNarration(working))
}

export function advanceChapterTwoRun(state, actionId) {
  if (!state || state.chapterNumber !== 2) throw new Error('A Chapter 2 run state is required.')
  if (state.status === 'completed') throw new Error('This run is already complete.')
  const selected = getChapterTwoAvailableActions(state).find((candidate) => candidate.id === actionId)
  if (!selected) throw new Error(`Choice ${actionId} is not available in ${state.sceneId}.`)

  let working = appendEvent(state, {
    type: 'action',
    sceneId: state.sceneId,
    actionId: selected.id,
    outcome: selected.check ? 'attempt' : 'choice',
  })

  if (!selected.check) return resolveNoRollAction(working, selected)
  const resolution = resolveCheck(working, selected)
  if (resolution.naturalOne) return resolution.state
  if (!resolution.success || resolution.state.status === 'completed') return resolution.state
  return applySuccessfulCheckedAction(resolution.state, selected)
}

function defaultCustomCheckForScene(state, style) {
  const tier = currentDangerTier(state)
  return {
    stat: style === 'strength' ? 'strength' : 'defense',
    dangerTier: tier.id,
    manaCost: style === 'mana' && state.stats.manaPool > 0 ? 1 : 0,
  }
}

export function interpretChapterTwoFreeText(state, value) {
  const playerAction = cleanText(value, 160)
  if (!playerAction) throw new Error('A player action is required.')
  const lower = playerAction.toLowerCase()

  const available = getChapterTwoAvailableActions(state)
  const exactIntent = available.find((candidate) => {
    const tokens = candidate.label.toLowerCase().split(/\W+/).filter((token) => token.length >= 4)
    return tokens.some((token) => lower.includes(token))
  })
  if (exactIntent) {
    return Object.freeze({
      kind: 'mapped-choice',
      actionId: exactIntent.id,
      playerAction,
      narrationPlayerAction: playerAction,
      interpretedAction: exactIntent.label,
      check: exactIntent.check || null,
      style: exactIntent.check?.manaCost ? 'mana' : exactIntent.check?.stat || 'non-check',
    })
  }

  if (/\b(?:hello|hi|wave|look around|listen|ask|talk|speak|wait|watch)\b/i.test(playerAction)
    && !/\b(?:lie|trick|steal|force|break|fight|attack|run|escape|burn|flood|balance|climb|crawl|sneak|follow|track|route|awning|above)\b/i.test(playerAction)) {
    return Object.freeze({
      kind: 'narrative',
      actionId: 'chapter-two:free-text:narrative',
      playerAction,
      narrationPlayerAction: playerAction,
      interpretedAction: 'take a low-risk narrative action in the current market scene',
      check: null,
      style: 'non-check',
    })
  }

  const style = /\b(?:mana|magic|spell|channel|enchant)\b/i.test(playerAction)
    ? 'mana'
    : /\b(?:break|force|hit|shove|push|smash|cut|burn|flood|fight|attack)\b/i.test(playerAction)
      ? 'strength'
      : 'defense'
  const check = defaultCustomCheckForScene(state, style)
  return Object.freeze({
    kind: 'custom-check',
    actionId: `chapter-two:free-text:${style}`,
    playerAction,
    narrationPlayerAction: playerAction,
    interpretedAction: style === 'strength'
      ? 'use force to change the current obstacle'
      : style === 'mana'
        ? 'use Mana to create an opening in the current obstacle'
        : 'use timing, observation, movement, or leverage to change the current obstacle',
    check,
    style,
  })
}

export function getChapterTwoPlanCheckPreview(state, plan) {
  if (!plan?.check) return noRollPreview()
  const tier = CHAPTER_TWO_DANGER_TIERS[plan.check.dangerTier] || currentDangerTier(state)
  const stat = plan.check.stat
  const statBonus = Number(state.stats?.[stat]) || 0
  const manaCost = Number(plan.check.manaCost) || 0
  return Object.freeze({
    requiresRoll: true,
    stat,
    dc: tier.dc,
    statBonus,
    requiredDie: Math.min(20, Math.max(2, tier.dc - statBonus)),
    manaCost,
    advantage: manaCost > 0,
    dangerTier: tier.id,
  })
}

function customResolutionTransition(state, plan, success) {
  if (!success || state.status === 'completed') return state
  if (state.sceneId === CHAPTER_TWO_SCENES.lanternOrder || state.sceneId === CHAPTER_TWO_SCENES.entryPrice) {
    return appendEvent(state, { type: 'free-text-progress', sceneId: state.sceneId, actionId: plan.actionId, outcome: 'success-no-bypass' }, 'Your idea changes the immediate position, but the market still requires its lantern rule and entry price. The procedure is absurd, not optional.')
  }
  if (state.sceneId === CHAPTER_TWO_SCENES.whisperRows) {
    let next = addMerchantClue(state, 'player-method')
    next = appendEvent(next, { type: 'clue', sceneId: state.sceneId, actionId: plan.actionId, outcome: 'merchant-clue' }, 'Your approach gets a merchant-side piece of the tribute chain without replacing the living receipt evidence you still need.')
    return postTraceTransition(next)
  }
  if (state.sceneId === CHAPTER_TWO_SCENES.rootExchange) {
    return enterCollector(state, 'player-method', 'Your approach makes the living ledger hold still long enough to expose the tithe route. The Root Collector arrives before the pages finish settling.')
  }
  if (state.sceneId === CHAPTER_TWO_SCENES.rootCollector) {
    return enterLedgerDecision(state, 'player-method', 'Your idea gets you out of the Collector’s immediate reach. It is not defeated. The ledger is still in play, and the market is waiting on your decision.')
  }
  if (state.sceneId === CHAPTER_TWO_SCENES.ledgerDecision) {
    return appendEvent(state, { type: 'free-text-progress', sceneId: state.sceneId, actionId: plan.actionId, outcome: 'success-no-disposition' }, 'Your move creates leverage, but it does not choose the ledger’s final disposition for you. That decision remains yours.')
  }
  if (state.sceneId === CHAPTER_TWO_SCENES.drainGate) {
    return completeChapterTwoRun(state, endingForMarketState(state.chapterTwo.marketState))
  }
  return state
}

export function advanceChapterTwoFreeTextPlan(state, plan) {
  if (!plan || plan.style === 'non-check') return state
  if (plan.kind === 'mapped-choice') return advanceChapterTwoRun(state, plan.actionId)

  const synthetic = action(
    plan.actionId,
    plan.narrationPlayerAction || 'Custom action',
    plan.interpretedAction || '',
    { check: plan.check },
  )
  let working = appendEvent(state, {
    type: 'action',
    sceneId: state.sceneId,
    actionId: plan.actionId,
    playerAction: plan.narrationPlayerAction,
    outcome: 'attempt',
  })
  const resolution = resolveCheck(working, synthetic)
  if (resolution.naturalOne) return resolution.state
  return customResolutionTransition(resolution.state, plan, resolution.success)
}

export function isChapterTwoFreeTextScene(state) {
  return Boolean(
    state
      && state.chapterNumber === 2
      && state.status !== 'completed'
      && state.sceneId !== CHAPTER_TWO_SCENES.ending,
  )
}

export function chapterTwoDangerTierForState(state) {
  return currentDangerTier(state)
}
