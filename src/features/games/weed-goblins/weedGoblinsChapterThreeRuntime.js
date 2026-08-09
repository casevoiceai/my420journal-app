import {
  CHAPTER_THREE,
  CHAPTER_THREE_GROVE_STATES,
  CHAPTER_THREE_LOCATIONS,
  CHAPTER_THREE_REWARD_EFFECT_GROUPS,
  CHAPTER_THREE_REWARDS,
  CHAPTER_THREE_SCENE_DEFINITIONS,
} from './weedGoblinsChapterThree.js'
import { CHAPTER_TWO_REWARDS } from './weedGoblinsChapterTwo.js'
import {
  DIFFICULTY,
  NARRATION_TIERS,
  calculateNarrationTier,
} from './weedGoblinsEngine.js'

export const CHAPTER_THREE_MEMORY_RING_ORDER = 'seed-sapling-canopy'
export const CHAPTER_THREE_WATER_STONE_BALANCE = 'one-each'

export const CHAPTER_THREE_DANGER_TIERS = Object.freeze({
  sprout: Object.freeze({ id: 'sprout', label: 'Sprout', dc: DIFFICULTY.easy }),
  bloom: Object.freeze({ id: 'bloom', label: 'Bloom', dc: DIFFICULTY.standard }),
  harvest: Object.freeze({ id: 'harvest', label: 'Harvest', dc: DIFFICULTY.hard }),
  wither: Object.freeze({ id: 'wither', label: 'Wither', dc: DIFFICULTY.goblinKing }),
})

export const CHAPTER_THREE_WOUNDS = Object.freeze([
  'None',
  'Scraped',
  'Bruised',
  'Broken',
  'Downed',
])

export const CHAPTER_THREE_SCENES = Object.freeze({
  grayVerge: CHAPTER_THREE_SCENE_DEFINITIONS.grayVerge.id,
  memoryRings: CHAPTER_THREE_SCENE_DEFINITIONS.memoryRings.id,
  waterStones: CHAPTER_THREE_SCENE_DEFINITIONS.waterStones.id,
  stalkerTrail: CHAPTER_THREE_SCENE_DEFINITIONS.stalkerTrail.id,
  sleepingNursery: CHAPTER_THREE_SCENE_DEFINITIONS.sleepingNursery.id,
  siphonWell: CHAPTER_THREE_SCENE_DEFINITIONS.siphonWell.id,
  nightlyDraw: CHAPTER_THREE_SCENE_DEFINITIONS.nightlyDraw.id,
  groveDecision: CHAPTER_THREE_SCENE_DEFINITIONS.groveDecision.id,
  ending: CHAPTER_THREE_SCENE_DEFINITIONS.ending.id,
})

const LOCATION_IDS = Object.values(CHAPTER_THREE_LOCATIONS).map((location) => location.id)
const CHAPTER_THREE_REWARD_SET = new Set(Object.values(CHAPTER_THREE_REWARDS))
const INHERITABLE_REWARD_SET = new Set([
  ...Object.values(CHAPTER_TWO_REWARDS),
  ...Object.values(CHAPTER_THREE_REWARDS),
])
const VALID_GROVE_STATES = new Set(CHAPTER_THREE_GROVE_STATES)

const NATURAL_ONE_COMPLICATIONS = Object.freeze([
  'A root tag curls around your ankle and stamps itself DELAYED BY BOTANICAL PROCEDURE. Two Trouble.',
  'A gray branch points at you like a disappointed clerk while three acorns roll away with your dignity. Two Trouble.',
  'Kip whispers that the roots just added your mistake to tonight’s schedule. Two Trouble, apparently itemized.',
  'A Root Leech drops a tiny numbered ticket before retreating underground. You are number two. Two Trouble.',
])

const MEMORY_SENSATIONS = Object.freeze([
  'a warm weight settling from branch to root',
  'a bright pattern clicking into place beneath the bark',
  'a low laugh preserved inside amber resin',
  'a steady pulse moving through rain-dark wood',
  'a quiet spark passing from one root-tip to the next',
])

function cleanText(value, maxLength = 240) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
    : ''
}

function uniqueText(values = [], allowed = null) {
  const seen = new Set()
  const output = []
  for (const value of values) {
    const text = cleanText(value, 120)
    if (!text || seen.has(text) || (allowed && !allowed.has(text))) continue
    seen.add(text)
    output.push(text)
  }
  return output
}

function stableHash(value) {
  const text = String(value ?? '')
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function hashSeed(seed) {
  return stableHash(seed) || 0x9e3779b9
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

function createRoomState(initialRoomId = CHAPTER_THREE_LOCATIONS.grayVerge.id) {
  const state = {}
  for (const id of LOCATION_IDS) {
    state[id] = {
      roomId: id,
      visited: id === initialRoomId,
      visitCount: id === initialRoomId ? 1 : 0,
    }
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
    chapterThree: { ...state.chapterThree, ...(changes.chapterThree || {}) },
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
  if (narrationLine) {
    next = appendEvent(next, {
      type: 'scene',
      sceneId,
      actionId: 'scene:enter',
      outcome: 'intro',
    }, narrationLine)
  }
  return next
}

function currentSceneDefinition(state) {
  return Object.values(CHAPTER_THREE_SCENE_DEFINITIONS)
    .find((scene) => scene.id === state?.sceneId) || CHAPTER_THREE_SCENE_DEFINITIONS.grayVerge
}

export function chapterThreeDangerTierForState(state) {
  const tierId = currentSceneDefinition(state).dangerTier
  return CHAPTER_THREE_DANGER_TIERS[tierId] || CHAPTER_THREE_DANGER_TIERS.sprout
}

export function buildChapterThreePersonalization(snapshot = {}) {
  const tags = Array.isArray(snapshot?.effectTags)
    ? snapshot.effectTags.map((value) => cleanText(value, 80)).filter(Boolean).slice(0, 5)
    : []
  const source = tags.length > 0
    ? tags.join('|')
    : cleanText(snapshot?.effectTraitFlavor, 240) || 'neutral-grove-memory'
  return Object.freeze({
    memorySensation: MEMORY_SENSATIONS[stableHash(source) % MEMORY_SENSATIONS.length],
  })
}

function latestCampaignRun(previousRuns = []) {
  if (!Array.isArray(previousRuns)) return null
  for (let index = previousRuns.length - 1; index >= 0; index -= 1) {
    const run = previousRuns[index]
    if (run?.adventureId === CHAPTER_THREE.adventureId || run?.adventureId === 'hollow-market-session-1') return run
  }
  return null
}

function inheritedInventory(previousRuns = []) {
  const rewards = []
  for (const run of previousRuns || []) {
    for (const reward of run?.chapterTwoRewards || []) rewards.push(reward)
    for (const reward of run?.chapterThreeRewards || []) rewards.push(reward)
  }
  return uniqueText(rewards, INHERITABLE_REWARD_SET)
}

function inheritedRootcoin(previousRuns = []) {
  const remaining = Number(latestCampaignRun(previousRuns)?.rootcoinRemaining)
  return Number.isInteger(remaining) && remaining >= 0 && remaining <= 99 ? remaining : 0
}

export function createChapterThreeRunFromSessionZero(sessionState, {
  previousRuns = [],
  personalization = sessionState?.chapterThreePersonalization || buildChapterThreePersonalization(),
} = {}) {
  if (!sessionState?.flags?.sessionZeroComplete) {
    throw new Error('Chapter 3 requires completed Session Zero character setup.')
  }

  const chapterThreeRunCount = Array.isArray(previousRuns)
    ? previousRuns.filter((run) => run?.adventureId === CHAPTER_THREE.adventureId).length
    : 0
  const narrationTier = calculateNarrationTier(chapterThreeRunCount)

  return {
    version: 3,
    chapterNumber: 3,
    adventureId: CHAPTER_THREE.adventureId,
    adventure: CHAPTER_THREE,
    seed: String(sessionState.seed || CHAPTER_THREE.adventureId),
    rngState: Number(sessionState.rngState) >>> 0 || hashSeed(sessionState.seed),
    status: 'active',
    sceneId: CHAPTER_THREE_SCENES.grayVerge,
    currentRoomId: CHAPTER_THREE_LOCATIONS.grayVerge.id,
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
    priorCompletedRunCount: normalizeCount(chapterThreeRunCount),
    narrationTier: Object.values(NARRATION_TIERS).includes(narrationTier)
      ? narrationTier
      : NARRATION_TIERS.normal,
    rootcoin: inheritedRootcoin(previousRuns),
    wound: 'None',
    inventory: inheritedInventory(previousRuns),
    effects: { body: [], mind: [], mood: [] },
    flags: {
      sessionZeroComplete: true,
      nameSuggestionsVisible: false,
    },
    chapterThree: {
      memorySensation: cleanText(personalization?.memorySensation, 160) || MEMORY_SENSATIONS[0],
      falseCureKnown: false,
      bramblekinHeard: false,
      corlaHeard: false,
      kipWarningHeeded: false,
      memoryRingsSolved: false,
      memoryRingAttempts: 0,
      nightlyDrawScheduleKnown: false,
      waterStonesBalanced: false,
      waterStoneAttempts: 0,
      stalkerBlindSpotKnown: false,
      stalkerOutcome: null,
      nurseryOutcome: null,
      siphonPrepared: false,
      nightlyDrawOutcome: null,
      groveState: null,
      majorTruth: null,
      rememberedConsequence: null,
      bramblekinAllied: false,
    },
    ending: null,
    runSummary: null,
    history: [{
      type: 'chapter-start',
      sceneId: CHAPTER_THREE_SCENES.grayVerge,
      actionId: 'chapter-three:start',
      outcome: 'intro',
    }],
    narration: [
      'The Gray Verge begins where the color stops. Resin trees stand in full daylight with water at their roots, yet every trunk is paling upward from something pulling below.',
    ],
  }
}

function action(id, label, detail, config = {}) {
  return Object.freeze({ id, label, detail, ...config })
}

const MEMORY_RING_ACTIONS = Object.freeze([
  action('rings:seed-sapling-canopy', 'Seed, sapling, canopy', 'Read the memories by how the grove grew.', { order: 'seed-sapling-canopy' }),
  action('rings:canopy-sapling-seed', 'Canopy, sapling, seed', 'Read the memories backward from the largest growth.', { order: 'canopy-sapling-seed' }),
  action('rings:sapling-seed-canopy', 'Sapling, seed, canopy', 'Put the middle growth first.', { order: 'sapling-seed-canopy' }),
  action('rings:seed-canopy-sapling', 'Seed, canopy, sapling', 'Jump from first growth to full canopy.', { order: 'seed-canopy-sapling' }),
])

const WATER_STONE_ACTIONS = Object.freeze([
  action('stones:one-each', 'One stone to each need', 'Preservation, evacuation, and access each receive one water stone.', { balance: 'one-each' }),
  action('stones:preserve-heavy', 'Two to preservation, one to access', 'Protect the living patch and keep a path open, but leave evacuation dry.', { balance: 'preserve-heavy' }),
  action('stones:evacuate-heavy', 'Two to evacuation, one to preservation', 'Move sleepers first, but close the route deeper in.', { balance: 'evacuate-heavy' }),
  action('stones:all-access', 'Put all three into access', 'Force the deep route open and let the rest of the channels wait.', { balance: 'all-access' }),
])

function grayVergeActions(state) {
  const actions = [
    action('verge:bramblekin', 'Ask Bramblekin where the pull goes', 'Let the grove spirit point beneath the visible damage.'),
    action('verge:corla', 'Ask Corla what she has tried', 'Compare the one living patch with the gray trees around it.'),
    action('verge:kip', 'Listen to Kip’s root schedule', 'Take the young spriggan’s numbers seriously.'),
    action('verge:compare-growth', 'Compare the living patch to the gray trees', 'Trace where the borrowed growth actually comes from.'),
  ]
  if (state.chapterThree.kipWarningHeeded) {
    actions.push(action('verge:repeat-schedule', 'Have Kip repeat the numbers', 'Check the timing before moving deeper.'))
  }
  return actions.slice(0, 5)
}

function stalkerActions(state) {
  const actions = [
    action('stalker:watch', 'Stay still and watch it move', 'Learn what the Withering Stalker fails to notice when the grove goes quiet.'),
    action('stalker:stillness', 'Cross in the Stalker’s stillness', 'Move only when dead-root cover breaks its line.', {
      check: { stat: 'defense', dangerTier: state.chapterThree.stalkerBlindSpotKnown ? 'bloom' : 'harvest' },
    }),
    action('stalker:break-cover', 'Break a dead branch path open', 'Use force to make a short route before the Stalker turns.', {
      check: { stat: 'strength', dangerTier: 'harvest' },
    }),
    action('stalker:resin-shadow', 'Use the resin-bright trunks as cover', 'Thread the places its branch-antlers cannot see through.', {
      check: { stat: 'defense', dangerTier: state.chapterThree.stalkerBlindSpotKnown ? 'bloom' : 'harvest' },
    }),
  ]
  if (Number(state.stats?.manaPool) > 0) {
    actions.push(action('stalker:mana-decoy', 'Send a Mana flicker the other way', 'Spend Mana to draw its attention away while you cross.', {
      check: { stat: 'defense', dangerTier: 'harvest', manaCost: 1 },
    }))
  }
  return actions.slice(0, 5)
}

function nurseryActions(state) {
  const actions = [
    action('nursery:lift-roots', 'Lift the trapped root-bed clear', 'Use Strength to free sleepers without tearing the bed apart.', {
      check: { stat: 'strength', dangerTier: 'harvest' },
    }),
    action('nursery:thread-path', 'Thread a path between the Root Leeches', 'Use Defense to move sleepers through the gaps.', {
      check: { stat: 'defense', dangerTier: 'harvest' },
    }),
  ]
  if (state.chapterThree.waterStonesBalanced) {
    actions.push(action('nursery:evacuation-channel', 'Open the evacuation water channel', 'Use the balanced stones to float the sleeping root-beds clear without another roll.'))
  }
  if (state.chapterThree.kipWarningHeeded) {
    actions.push(action('nursery:kip-count', 'Move on Kip’s whispered count', 'Use the root schedule you believed earlier to cross between pulls without another roll.'))
  }
  if (Number(state.stats?.manaPool) > 0) {
    actions.push(action('nursery:mana-lure', 'Lure the Root Leeches with a Mana spark', 'Spend Mana for advantage while the leeches pull toward the decoy.', {
      check: { stat: 'defense', dangerTier: 'harvest', manaCost: 1 },
    }))
  }
  return actions.slice(0, 5)
}

function siphonActions(state) {
  const actions = [
    action('siphon:read-conduits', 'Read which conduits are about to pull', 'Use Defense to map the active lines before the Nightly Draw.', {
      check: { stat: 'defense', dangerTier: 'harvest' },
    }),
    action('siphon:brace-lines', 'Brace the weakest conduits', 'Use Strength to keep the worst line from snapping early.', {
      check: { stat: 'strength', dangerTier: 'harvest' },
    }),
    action('siphon:water-buffer', 'Use the balanced water channels as a buffer', 'Turn the water-stone work into preparation for the Draw.'),
    action('siphon:listen-kip', 'Match Kip’s numbers to the root pulses', 'Use the warning schedule to time the start of the Draw.'),
  ]
  if (Number(state.stats?.manaPool) > 0) {
    actions.push(action('siphon:mana-sense', 'Touch the network with Mana', 'Spend Mana for advantage while reading the conduit pattern.', {
      check: { stat: 'defense', dangerTier: 'harvest', manaCost: 1 },
    }))
  }
  return actions.slice(0, 5)
}

function nightlyDrawActions(state) {
  const actions = [
    action('draw:hold-lines', 'Hold the conduit bundle together', 'Use Strength against the Wither pull until the pattern exposes itself.', {
      check: { stat: 'strength', dangerTier: 'wither' },
    }),
    action('draw:ride-pulse', 'Move between the conduit pulls', 'Use Defense to survive the Draw without being caught in one line.', {
      check: { stat: 'defense', dangerTier: 'wither' },
    }),
    action('draw:cut-leech', 'Cut the Root Leeches off the main line', 'Use Strength to break the siphon’s smallest active mouths.', {
      check: { stat: 'strength', dangerTier: 'wither' },
    }),
  ]
  if (state.chapterThree.siphonPrepared || state.chapterThree.waterStonesBalanced) {
    actions.push(action('draw:prepared-channel', 'Use the prepared water channel', 'Let the earlier preparation reduce the immediate danger by one tier.', {
      check: { stat: 'defense', dangerTier: 'harvest' },
    }))
  }
  if (Number(state.stats?.manaPool) > 0) {
    actions.push(action('draw:mana-anchor', 'Anchor yourself with Mana', 'Spend Mana for advantage without changing the Wither target.', {
      check: { stat: 'defense', dangerTier: 'wither', manaCost: 1 },
    }))
  }
  return actions.slice(0, 5)
}

function groveDecisionActions() {
  return Object.freeze([
    action('decision:heal', 'Heal the grove and keep it connected', 'Use the surviving water and living roots to start genuine recovery.'),
    action('decision:quarantine', 'Quarantine the grove', 'Seal the corrupted network so the surviving grove can recover apart from it.'),
    action('decision:burn', 'Perform a controlled burn', 'Weaken the Cultivator’s network at the cost of Corla’s trust.', {
      check: { stat: 'strength', dangerTier: 'harvest' },
    }),
    action('decision:redirect', 'Redirect the siphon and keep its trail', 'Turn one conduit back toward the Cultivator so it can be followed later.', {
      check: { stat: 'defense', dangerTier: 'harvest' },
    }),
    action('decision:ignore-kip', 'Leave Kip’s warning unheeded', 'Let the remaining schedule run and accept what the Draw takes.'),
  ])
}

export function getChapterThreeAvailableActions(state) {
  if (!state || state.chapterNumber !== 3 || state.status === 'completed') return []
  if (state.sceneId === CHAPTER_THREE_SCENES.grayVerge) return grayVergeActions(state)
  if (state.sceneId === CHAPTER_THREE_SCENES.memoryRings) return MEMORY_RING_ACTIONS
  if (state.sceneId === CHAPTER_THREE_SCENES.waterStones) return WATER_STONE_ACTIONS
  if (state.sceneId === CHAPTER_THREE_SCENES.stalkerTrail) return stalkerActions(state)
  if (state.sceneId === CHAPTER_THREE_SCENES.sleepingNursery) return nurseryActions(state)
  if (state.sceneId === CHAPTER_THREE_SCENES.siphonWell) return siphonActions(state)
  if (state.sceneId === CHAPTER_THREE_SCENES.nightlyDraw) return nightlyDrawActions(state)
  if (state.sceneId === CHAPTER_THREE_SCENES.groveDecision) return groveDecisionActions(state)
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

export function getChapterThreeActionCheckPreview(state, actionId) {
  const selected = getChapterThreeAvailableActions(state).find((candidate) => candidate.id === actionId)
  if (!selected?.check) return noRollPreview()
  const tier = CHAPTER_THREE_DANGER_TIERS[selected.check.dangerTier] || chapterThreeDangerTierForState(state)
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
  return { roll: Math.floor(draw.value * 20) + 1, rngState: draw.rngState }
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
  const index = Math.max(0, CHAPTER_THREE_WOUNDS.indexOf(wound))
  return CHAPTER_THREE_WOUNDS[Math.min(CHAPTER_THREE_WOUNDS.length - 1, index + steps)]
}

function enterMemoryRings(state, line) {
  return enterScene(state, CHAPTER_THREE_SCENES.memoryRings, CHAPTER_THREE_LOCATIONS.resinChapel.id, line)
}

function enterWaterStones(state, line) {
  return enterScene(state, CHAPTER_THREE_SCENES.waterStones, CHAPTER_THREE_LOCATIONS.thirstingRun.id, line)
}

function enterStalkerTrail(state, line) {
  return enterScene(state, CHAPTER_THREE_SCENES.stalkerTrail, CHAPTER_THREE_LOCATIONS.thirstingRun.id, line)
}

function enterNursery(state, line) {
  return enterScene(state, CHAPTER_THREE_SCENES.sleepingNursery, CHAPTER_THREE_LOCATIONS.sleepingNursery.id, line)
}

function enterSiphonWell(state, line) {
  return enterScene(state, CHAPTER_THREE_SCENES.siphonWell, CHAPTER_THREE_LOCATIONS.siphonWell.id, line)
}

function enterNightlyDraw(state, line) {
  return enterScene(state, CHAPTER_THREE_SCENES.nightlyDraw, CHAPTER_THREE_LOCATIONS.siphonWell.id, line)
}

function enterGroveDecision(state, line) {
  return enterScene(state, CHAPTER_THREE_SCENES.groveDecision, CHAPTER_THREE_LOCATIONS.siphonWell.id, line)
}

function applyOrdinaryFailureConsequence(state, selected, event) {
  const tier = selected?.check?.dangerTier || chapterThreeDangerTierForState(state).id
  let next = cloneState(state, { trouble: Math.min(3, state.trouble + 1) })
  if (tier === 'harvest') next = cloneState(next, { wound: advanceWound(next.wound, 1) })
  if (tier === 'wither') next = cloneState(next, { wound: 'Downed' })

  if (state.sceneId === CHAPTER_THREE_SCENES.stalkerTrail) {
    return enterNursery(
      cloneState(next, { chapterThree: { stalkerOutcome: 'crossed-with-cost' } }),
      'The Stalker catches the movement and forces you into a rougher crossing, but the nursery is still ahead. You reach it hurt and later than planned, not stopped.',
    )
  }
  if (state.sceneId === CHAPTER_THREE_SCENES.sleepingNursery) {
    return enterSiphonWell(
      cloneState(next, { chapterThree: { nurseryOutcome: 'rescued-with-cost' } }),
      'The rescue goes badly enough to cost you, but not badly enough to abandon the sleepers. The last root-bed clears as the Siphon Well begins to pulse.',
    )
  }
  if (state.sceneId === CHAPTER_THREE_SCENES.siphonWell) {
    return enterNightlyDraw(
      cloneState(next, { chapterThree: { siphonPrepared: false } }),
      'The preparation slips away from you just as every conduit tightens. The Nightly Draw begins before you have the network where you wanted it.',
    )
  }
  if (state.sceneId === CHAPTER_THREE_SCENES.nightlyDraw) {
    return enterGroveDecision(
      cloneState(next, { chapterThree: { nightlyDrawOutcome: 'downed-but-survived' } }),
      'The Nightly Draw puts you down, but it does not end the run. When the pull finally breaks, the conduit pattern is exposed and the grove still needs a decision.',
    )
  }
  if (state.sceneId === CHAPTER_THREE_SCENES.groveDecision) {
    const fallbackState = selected.id === 'decision:burn' ? 'burned' : 'drained'
    return completeChapterThreeRun(
      cloneState(next, {
        chapterThree: {
          groveState: fallbackState,
          rememberedConsequence: selected.id === 'decision:burn'
            ? 'The burn spreads farther than intended and Corla remembers the cost.'
            : 'The redirect fails and the grove is left drained, but the root map still preserves the enemy route.',
        },
      }),
      endingForGroveState(fallbackState),
      `${selected.id} failed but the campaign moved forward`,
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
  const preview = getChapterThreeActionCheckPreview(state, selected.id)
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
      : 'The move fails, but the grove changes around the failure instead of stopping the story.',
  )
  if (success && finalRoll === 20 && working.trouble > 0) {
    working = cloneState(working, { trouble: working.trouble - 1 })
  }
  if (!success) working = applyOrdinaryFailureConsequence(working, selected, event)
  return { state: working, success, naturalOne: false, event }
}

function addInventory(state, reward) {
  if (!CHAPTER_THREE_REWARD_SET.has(reward) || state.inventory.includes(reward)) return state
  const group = CHAPTER_THREE_REWARD_EFFECT_GROUPS[reward]
  const effects = {
    body: [...state.effects.body],
    mind: [...state.effects.mind],
    mood: [...state.effects.mood],
  }
  if (group && effects[group] && !effects[group].includes(reward)) effects[group].push(reward)
  return cloneState(state, { inventory: [...state.inventory, reward], effects })
}

function solveMemoryRings(state, selected) {
  const attempts = state.chapterThree.memoryRingAttempts + 1
  if (selected.order !== CHAPTER_THREE_MEMORY_RING_ORDER) {
    return appendEvent(
      cloneState(state, { chapterThree: { memoryRingAttempts: attempts } }),
      { type: 'puzzle', sceneId: state.sceneId, actionId: selected.id, outcome: 'wrong-order' },
      'The resin memories fold back into the wrong shape. Bramblekin points at the smallest ring first. The chapel lets you try again.',
    )
  }
  return enterWaterStones(
    cloneState(state, {
      chapterThree: {
        memoryRingsSolved: true,
        memoryRingAttempts: attempts,
        nightlyDrawScheduleKnown: true,
        majorTruth: 'The Nightly Draw is scheduled, repeated, and connected to a deeper siphon network.',
      },
    }),
    `Seed, sapling, canopy. The rings settle into growth order and replay ${state.chapterThree.memorySensation}. Beneath it, Kip’s numbers resolve into a schedule: every active conduit pulls together at the Nightly Draw.`,
  )
}

function solveWaterStones(state, selected) {
  const attempts = state.chapterThree.waterStoneAttempts + 1
  if (selected.balance !== CHAPTER_THREE_WATER_STONE_BALANCE) {
    return appendEvent(
      cloneState(state, { chapterThree: { waterStoneAttempts: attempts } }),
      { type: 'puzzle', sceneId: state.sceneId, actionId: selected.id, outcome: 'unbalanced' },
      'One channel drinks everything while another runs dry. Three needs, three stones. The channels reset with the patience of plumbing that knows it is right.',
    )
  }
  return enterStalkerTrail(
    cloneState(state, { chapterThree: { waterStonesBalanced: true, waterStoneAttempts: attempts } }),
    'One stone preserves the living patch, one feeds the evacuation channel, and one keeps the deep route open. The water levels settle. Something deer-shaped moves only when you look away from where it was.',
  )
}

const NO_ROLL_HANDLERS = Object.freeze({
  'verge:bramblekin': (state) => appendEvent(
    cloneState(state, { chapterThree: { bramblekinHeard: true } }),
    { type: 'clue', sceneId: state.sceneId, actionId: 'verge:bramblekin', outcome: 'underground-pull' },
    'Bramblekin holds a shape long enough to point below the grove. The pull is underground, deliberate, and too regular to be drought.',
  ),
  'verge:corla': (state) => appendEvent(
    cloneState(state, { chapterThree: { corlaHeard: true } }),
    { type: 'clue', sceneId: state.sceneId, actionId: 'verge:corla', outcome: 'false-cure-suspected' },
    'Corla shows you the living patch she has kept green by hand. Every time it brightens, another nearby tree pales. She calls it a cure because the alternative word is theft.',
  ),
  'verge:kip': (state) => appendEvent(
    cloneState(state, { chapterThree: { kipWarningHeeded: true } }),
    { type: 'clue', sceneId: state.sceneId, actionId: 'verge:kip', outcome: 'schedule-heeded' },
    'Kip repeats the numbers the roots whisper every night. Nobody believed him because roots are not licensed accountants. The intervals are exact.',
  ),
  'verge:repeat-schedule': (state) => appendEvent(
    state,
    { type: 'clue', sceneId: state.sceneId, actionId: 'verge:repeat-schedule', outcome: 'schedule-repeated' },
    'Kip repeats the intervals. The last number lands exactly when the deepest gray root gives a small, involuntary tug.',
  ),
  'verge:compare-growth': (state) => enterMemoryRings(
    cloneState(state, { chapterThree: { falseCureKnown: true } }),
    'You follow the living patch root by root. Its new growth is borrowed directly from neighboring trees. The apparent cure is only moving the damage. Bramblekin leads you into the Resin Chapel, where the grove kept its memories before the gray reached them.',
  ),
  'stalker:watch': (state) => appendEvent(
    cloneState(state, { chapterThree: { stalkerBlindSpotKnown: true } }),
    { type: 'clue', sceneId: state.sceneId, actionId: 'stalker:watch', outcome: 'blind-spot-known' },
    'You stop moving. The Withering Stalker crosses the Run without turning toward you. It tracks motion and bright magic, but dead-root stillness and thick resin trunks leave clean blind spots.',
  ),
  'nursery:evacuation-channel': (state) => enterSiphonWell(
    cloneState(state, { chapterThree: { nurseryOutcome: 'rescued-by-water-channel' } }),
    'The evacuation channel lifts the sleeping root-beds one at a time and carries them clear of the Root Leeches. The rescue works because you balanced the water before you needed it. The Siphon Well begins pulsing downstream.',
  ),
  'nursery:kip-count': (state) => enterSiphonWell(
    cloneState(state, { chapterThree: { nurseryOutcome: 'rescued-on-kip-schedule' } }),
    'Kip counts under his breath. You move the sleepers between the root pulls exactly when he says. The last bed clears, and the Siphon Well answers with the next number in his sequence.',
  ),
  'siphon:water-buffer': (state) => enterNightlyDraw(
    cloneState(state, { chapterThree: { siphonPrepared: state.chapterThree.waterStonesBalanced } }),
    state.chapterThree.waterStonesBalanced
      ? 'The balanced water channels take the first strain and buy you one tier of breathing room. Then every conduit tightens at once. The Nightly Draw has started.'
      : 'The water channels are not balanced enough to carry the strain. The Nightly Draw starts before the buffer can hold.',
  ),
  'siphon:listen-kip': (state) => enterNightlyDraw(
    cloneState(state, { chapterThree: { siphonPrepared: state.chapterThree.kipWarningHeeded } }),
    state.chapterThree.kipWarningHeeded
      ? 'Kip’s numbers match the conduit pulses exactly. You know which pull comes first. The Nightly Draw begins on schedule.'
      : 'Without the earlier warning, the numbers arrive too late to prepare around them. The Nightly Draw begins anyway.',
  ),
  'decision:heal': (state) => finishDecision(state, 'healing'),
  'decision:quarantine': (state) => finishDecision(state, 'quarantined'),
  'decision:ignore-kip': (state) => finishDecision(state, 'drained'),
})

function applySuccessfulCheckedAction(state, selected) {
  if (state.sceneId === CHAPTER_THREE_SCENES.stalkerTrail) {
    return enterNursery(
      cloneState(state, { chapterThree: { stalkerOutcome: selected.id, stalkerBlindSpotKnown: true } }),
      'You use the Stalker’s gaps instead of trying to defeat it. It turns toward the place you were, while you reach the Sleeping Nursery and find Root Leeches tucked beneath the major roots.',
    )
  }
  if (state.sceneId === CHAPTER_THREE_SCENES.sleepingNursery) {
    return enterSiphonWell(
      cloneState(state, { chapterThree: { nurseryOutcome: selected.id } }),
      'The sleeping root-beds come free and the nursery clears. Ahead, the Siphon Well pulses hard enough to make every surviving leaf turn the same direction.',
    )
  }
  if (state.sceneId === CHAPTER_THREE_SCENES.siphonWell) {
    return enterNightlyDraw(
      cloneState(state, { chapterThree: { siphonPrepared: true } }),
      'You get the conduit pattern under control before the pull peaks. Then every active line tightens together. The Nightly Draw begins.',
    )
  }
  if (state.sceneId === CHAPTER_THREE_SCENES.nightlyDraw) {
    return enterGroveDecision(
      cloneState(state, { chapterThree: { nightlyDrawOutcome: selected.id } }),
      'You survive the full pull and see the network for what it is: the grove is one feeding line among many. The conduit is exposed now, and what happens to it is your choice.',
    )
  }
  if (selected.id === 'decision:burn') return finishDecision(state, 'burned')
  if (selected.id === 'decision:redirect') return finishDecision(state, 'bonded-to-player')
  return state
}

function finishDecision(state, groveState) {
  if (!VALID_GROVE_STATES.has(groveState)) return state
  const consequence = {
    healing: 'The grove begins genuine recovery without stealing growth from its neighbors.',
    quarantined: 'The surviving grove is sealed away from the corrupted network while the deeper line remains contained.',
    burned: 'The controlled burn weakens the Cultivator network, and Corla remembers exactly what it cost.',
    drained: 'The Nightly Draw finishes its work. The grove survives as evidence more than habitat.',
    'bonded-to-player': 'One redirected siphon line now answers to the player and points back toward the deeper network.',
  }[groveState]
  return completeChapterThreeRun(
    cloneState(state, {
      chapterThree: {
        groveState,
        rememberedConsequence: consequence,
        bramblekinAllied: groveState === 'healing' || groveState === 'quarantined',
      },
    }),
    endingForGroveState(groveState),
  )
}

function endingForGroveState(groveState) {
  if (groveState === 'healing') return 'grove-healing'
  if (groveState === 'quarantined') return 'grove-quarantined'
  if (groveState === 'burned') return 'grove-burned'
  if (groveState === 'bonded-to-player') return 'siphon-bonded'
  return 'grove-drained'
}

function endingNarration(state) {
  const consequence = state.chapterThree.rememberedConsequence || 'The grove carries the consequence of your choice.'
  return `${consequence} Bramblekin traces the surviving pull toward the Sunken Greenhouse, a flooded place everyone stopped talking about. The Living Root Map confirms it. The threat is bigger than the goblins.`
}

export function completeChapterThreeRun(state, ending, reason = null) {
  let working = addInventory(state, CHAPTER_THREE_REWARDS.greyBarkShard)
  working = addInventory(working, CHAPTER_THREE_REWARDS.livingRootMap)
  if (['healing', 'quarantined', 'bonded-to-player'].includes(working.chapterThree.groveState)) {
    working = addInventory(working, CHAPTER_THREE_REWARDS.corlasLastSeed)
  }
  const rewards = uniqueText(working.inventory, CHAPTER_THREE_REWARD_SET)
  const groveState = VALID_GROVE_STATES.has(working.chapterThree.groveState)
    ? working.chapterThree.groveState
    : 'drained'
  const summary = {
    adventureId: CHAPTER_THREE.adventureId,
    seed: working.seed,
    backgroundId: working.background?.id || null,
    ending,
    outcomeSummary: `${groveState}; Living Root Map points to the Sunken Greenhouse`,
    trouble: working.trouble,
    manaRemaining: working.stats.manaPool,
    complicationCount: working.complicationCount,
    narrationTier: working.narrationTier,
    rootcoinRemaining: working.rootcoin,
    wound: working.wound,
    chapterThreeBranches: {
      groveState,
      falseCureKnown: working.chapterThree.falseCureKnown === true,
      kipWarningHeeded: working.chapterThree.kipWarningHeeded === true,
      stalkerOutcome: working.chapterThree.stalkerOutcome || 'unresolved',
      nurseryOutcome: working.chapterThree.nurseryOutcome || 'unresolved',
      nightlyDrawOutcome: working.chapterThree.nightlyDrawOutcome || 'unresolved',
      bramblekinAllied: working.chapterThree.bramblekinAllied === true,
      majorTruth: working.chapterThree.majorTruth || 'The Cultivator is feeding through a deeper root network.',
      rememberedConsequence: working.chapterThree.rememberedConsequence || '',
    },
    chapterThreeRewards: rewards,
    reason,
  }
  working = cloneState(working, {
    status: 'completed',
    sceneId: CHAPTER_THREE_SCENES.ending,
    ending,
    runSummary: summary,
  })
  return appendEvent(working, {
    type: 'ending',
    sceneId: CHAPTER_THREE_SCENES.ending,
    actionId: 'chapter-three:ending',
    outcome: ending,
    reason,
  }, endingNarration(working))
}

export function advanceChapterThreeRun(state, actionId) {
  if (!state || state.chapterNumber !== 3) throw new Error('A Chapter 3 run state is required.')
  if (state.status === 'completed') throw new Error('This run is already complete.')
  const selected = getChapterThreeAvailableActions(state).find((candidate) => candidate.id === actionId)
  if (!selected) throw new Error(`Choice ${actionId} is not available in ${state.sceneId}.`)

  let working = appendEvent(state, {
    type: 'action',
    sceneId: state.sceneId,
    actionId: selected.id,
    outcome: selected.check ? 'attempt' : 'choice',
  })

  if (state.sceneId === CHAPTER_THREE_SCENES.memoryRings) return solveMemoryRings(working, selected)
  if (state.sceneId === CHAPTER_THREE_SCENES.waterStones) return solveWaterStones(working, selected)
  if (!selected.check) {
    const handler = NO_ROLL_HANDLERS[selected.id]
    return handler ? handler(working) : appendEvent(working, {
      type: 'choice',
      sceneId: state.sceneId,
      actionId: selected.id,
      outcome: 'no-roll',
    }, `You choose ${selected.label}.`)
  }

  const resolution = resolveCheck(working, selected)
  if (resolution.naturalOne) return resolution.state
  if (!resolution.success || resolution.state.status === 'completed') return resolution.state
  return applySuccessfulCheckedAction(resolution.state, selected)
}

function defaultCustomCheckForScene(state, style) {
  const tier = chapterThreeDangerTierForState(state)
  return {
    stat: style === 'strength' ? 'strength' : 'defense',
    dangerTier: tier.id,
    manaCost: style === 'mana' && state.stats.manaPool > 0 ? 1 : 0,
  }
}

export function interpretChapterThreeFreeText(state, value) {
  const playerAction = cleanText(value, 160)
  if (!playerAction) throw new Error('A player action is required.')
  const lower = playerAction.toLowerCase()
  const available = getChapterThreeAvailableActions(state)

  const directPuzzle = available.find((candidate) => (
    (candidate.order && lower.includes(candidate.order.replaceAll('-', ' ')))
    || (candidate.balance === 'one-each' && /one.*each|each.*one/.test(lower))
  ))
  if (directPuzzle) {
    return Object.freeze({
      kind: 'mapped-action',
      actionId: directPuzzle.id,
      playerAction,
      interpretedAction: directPuzzle.label,
      check: directPuzzle.check || null,
    })
  }

  const exactIntent = available.find((candidate) => {
    const tokens = candidate.label.toLowerCase().split(/\W+/).filter((token) => token.length >= 5)
    return tokens.some((token) => lower.includes(token))
  })
  if (exactIntent) {
    return Object.freeze({
      kind: 'mapped-action',
      actionId: exactIntent.id,
      playerAction,
      interpretedAction: exactIntent.label,
      check: exactIntent.check || null,
    })
  }

  const riskWords = /\b(?:climb|crawl|sneak|follow|track|balance|cut|pull|force|break|jump|leap|rush|fight|strike|dodge|cross|grab|lift|brace|redirect|burn)\b/i
  const forceWords = /\b(?:lift|break|force|push|pull|hold|brace|smash|strike|cut)\b/i
  const manaWords = /\b(?:mana|magic|spell|cast|arcane)\b/i
  const narrativeWords = /\b(?:ask|talk|listen|look|watch|inspect|study|wait|read|compare|remember)\b/i

  if (narrativeWords.test(playerAction) && !riskWords.test(playerAction)) {
    return Object.freeze({
      kind: 'narrative',
      playerAction,
      interpretedAction: 'carefully investigate or speak without forcing an uncertain outcome',
      check: null,
    })
  }

  const style = manaWords.test(playerAction)
    ? 'mana'
    : forceWords.test(playerAction)
      ? 'strength'
      : 'defense'
  return Object.freeze({
    kind: 'custom-check',
    playerAction,
    interpretedAction: style === 'strength'
      ? 'use direct physical force on the current obstacle'
      : style === 'mana'
        ? 'use Mana to support a careful attempt at the current obstacle'
        : 'use careful movement or positioning against the current obstacle',
    check: defaultCustomCheckForScene(state, style),
  })
}

export function getChapterThreePlanCheckPreview(state, plan) {
  if (!plan?.check) return noRollPreview()
  const syntheticId = `custom:${plan.check.stat}:${plan.check.dangerTier}:${plan.check.manaCost || 0}`
  const synthetic = action(syntheticId, plan.interpretedAction || 'Custom action', '', { check: plan.check })
  const tier = CHAPTER_THREE_DANGER_TIERS[synthetic.check.dangerTier] || chapterThreeDangerTierForState(state)
  const statBonus = Number(state.stats?.[synthetic.check.stat]) || 0
  const manaCost = Number(synthetic.check.manaCost) || 0
  return Object.freeze({
    requiresRoll: true,
    stat: synthetic.check.stat,
    dc: tier.dc,
    statBonus,
    requiredDie: Math.min(20, Math.max(2, tier.dc - statBonus)),
    manaCost,
    advantage: manaCost > 0,
    dangerTier: tier.id,
  })
}

export function advanceChapterThreeFreeTextPlan(state, plan) {
  if (!plan || !plan.playerAction) throw new Error('A Chapter 3 free-text plan is required.')
  if (plan.kind === 'mapped-action' && plan.actionId) return advanceChapterThreeRun(state, plan.actionId)
  if (plan.kind === 'narrative') {
    return appendEvent(state, {
      type: 'free-text',
      sceneId: state.sceneId,
      actionId: 'custom:narrative',
      outcome: 'no-roll',
      interpretedAction: plan.interpretedAction,
    }, 'You take a moment to test the idea without forcing a roll. The grove gives you information, not a mechanical shortcut.')
  }

  const selected = action('custom:check', plan.interpretedAction || 'Custom action', '', { check: plan.check })
  let working = appendEvent(state, {
    type: 'free-text',
    sceneId: state.sceneId,
    actionId: selected.id,
    outcome: 'attempt',
    interpretedAction: plan.interpretedAction,
  })
  const resolution = resolveCustomCheck(working, selected, plan)
  if (resolution.naturalOne) return resolution.state
  if (!resolution.success || resolution.state.status === 'completed') return resolution.state

  if (state.sceneId === CHAPTER_THREE_SCENES.stalkerTrail) {
    return enterNursery(
      cloneState(resolution.state, { chapterThree: { stalkerOutcome: 'custom-crossing', stalkerBlindSpotKnown: true } }),
      'Your improvised route gets you through the Stalker’s territory. The Sleeping Nursery is still reachable, and the Root Leeches are already moving underneath it.',
    )
  }
  if (state.sceneId === CHAPTER_THREE_SCENES.sleepingNursery) {
    return enterSiphonWell(
      cloneState(resolution.state, { chapterThree: { nurseryOutcome: 'custom-rescue' } }),
      'Your improvised rescue clears the sleeping root-beds. The Siphon Well pulses ahead before anyone can celebrate properly.',
    )
  }
  if (state.sceneId === CHAPTER_THREE_SCENES.siphonWell) {
    return enterNightlyDraw(
      cloneState(resolution.state, { chapterThree: { siphonPrepared: true } }),
      'Your preparation holds long enough to expose the first conduit pull. Then the Nightly Draw begins.',
    )
  }
  if (state.sceneId === CHAPTER_THREE_SCENES.nightlyDraw) {
    return enterGroveDecision(
      cloneState(resolution.state, { chapterThree: { nightlyDrawOutcome: 'custom-survival' } }),
      'Your idea carries you through the Draw. The siphon pattern is exposed and the grove still needs a final decision.',
    )
  }
  return resolution.state
}

function resolveCustomCheck(state, selected, plan) {
  const tier = CHAPTER_THREE_DANGER_TIERS[plan.check?.dangerTier] || chapterThreeDangerTierForState(state)
  const stat = plan.check?.stat || 'defense'
  const manaCost = Number(plan.check?.manaCost) || 0
  const preview = {
    requiresRoll: true,
    stat,
    dc: tier.dc,
    statBonus: Number(state.stats?.[stat]) || 0,
    requiredDie: Math.min(20, Math.max(2, tier.dc - (Number(state.stats?.[stat]) || 0))),
    manaCost,
    advantage: manaCost > 0,
    dangerTier: tier.id,
  }
  let working = state
  if (manaCost > 0) working = spendMana(working, manaCost, selected.id)
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
    success ? 'Your improvised action works.' : 'The improvised action fails forward into a worse position.',
  )
  if (success && finalRoll === 20 && working.trouble > 0) working = cloneState(working, { trouble: working.trouble - 1 })
  if (!success) working = applyOrdinaryFailureConsequence(working, selected, event)
  return { state: working, success, naturalOne: false, event }
}

export function isChapterThreeFreeTextScene(state) {
  return Boolean(state && state.chapterNumber === 3 && state.status === 'active' && state.sceneId !== CHAPTER_THREE_SCENES.ending)
}

export function getChapterThreeSnapshotContext(state) {
  if (!state || state.chapterNumber !== 3) return null
  const scene = currentSceneDefinition(state)
  const location = Object.values(CHAPTER_THREE_LOCATIONS).find((candidate) => candidate.id === state.currentRoomId)
  return Object.freeze({
    chapterNumber: 3,
    chapterTitle: CHAPTER_THREE.title,
    roomId: state.currentRoomId,
    roomName: location?.name || '',
    sceneId: state.sceneId,
    characters: [...(scene.characters || [])],
    objects: [...(scene.objects || [])],
    environmentState: state.chapterThree?.groveState || 'withering',
    consequence: state.chapterThree?.rememberedConsequence || '',
    snapshotEligible: scene.snapshotEligible === true,
  })
}
