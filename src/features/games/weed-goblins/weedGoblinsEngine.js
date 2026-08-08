export const WEED_GOBLINS_NARRATOR_NAME = 'Eliza'

export const WEED_GOBLINS_INTRODUCTION =
  "Welcome to the Goblin Highlands. I'll be your narrator. I'm Eliza. I watch your boot stop beside one fresh goblin footprint pressed into the mud of Windcut Trail as the King's Stash Hall closes somewhere above it."

export const WEED_GOBLINS_RETURNING_LINE =
  "You've been to the Goblin Highlands before. Last time you [outcome]. I'm curious whether you'll make the same choices."


export const SESSION_ZERO_WELCOME = Object.freeze([
  "Welcome, traveler. Before the road opens beneath you, sit with me a moment at the edge of it. I'm Eliza, and for as long as this story runs, I'll be watching everything that happens to you and telling it back, one true beat at a time. The Highlands ahead are not gentle country. Goblin banners hang from crooked posts along Windcut Trail, smoke rises from a keep built more from stubbornness than stone, and somewhere inside it sits a king who has something of yours he was never supposed to take.",
  "But first, I need to know who's walking into that story. Every traveler who comes up this road carries a name, a look, a kind, and a way of meeting trouble. Let's settle those now.",
])

const SESSION_KIND_QUESTION =
  "Now tell me what you are, so I can picture you moving through this. A steady human hand, a dwarf built low and heavy, quiet elf feet, or a gnome quicker than anyone expects, your call."

const SESSION_CLASS_QUESTION =
  "And how do you carry yourself out here? Are you the one who reads the ground, the one who holds the line, or the one who trusts a map nobody else would?"

const SESSION_PRONOUN_QUESTION =
  "One more small thing. How should I picture you when I say 'you' in this story?"

const SESSION_LOOK_QUESTION =
  'Last thing. Paint yourself for me, however you like.'

export const PLAYER_NAME_SUGGESTIONS = Object.freeze([
  'Fenna Duskrow',
  'Corvin Ashwell',
  'Rell Marrowlight',
  'Sable Underhollow',
])

export const PLAYER_KINDS = Object.freeze({
  'human-sword': Object.freeze({
    id: 'human-sword',
    label: 'Human, Sword',
    race: 'Human',
    weapon: 'Sword',
    flavor: 'Worn leather over practical mail. Steel and grit, no tricks, no excuses.',
    reaction: 'A sword-arm. Straightforward, honest work. I respect that.',
  }),
  'human-bow': Object.freeze({
    id: 'human-bow',
    label: 'Human, Bow',
    race: 'Human',
    weapon: 'Bow',
    flavor: 'Light leather built for movement. Steady hands, patient eyes.',
    reaction: "A bow. Patient hands. You'll want that patience later.",
  }),
  'dwarf-battle-axe': Object.freeze({
    id: 'dwarf-battle-axe',
    label: 'Dwarf, Battle Axe',
    race: 'Dwarf',
    weapon: 'Battle Axe',
    flavor: "Dented plate that's earned every scratch. Built low, hits heavy, holds a grudge as long as a mountain does.",
    reaction: "A battle axe, dwarven grip. That's not subtle, and I don't think you're going for subtle.",
  }),
  'elf-bow': Object.freeze({
    id: 'elf-bow',
    label: 'Elf, Bow',
    race: 'Elf',
    weapon: 'Bow',
    flavor: 'Cloth and leaf-cloak. Quiet feet, quicker eyes, gone before the echo catches up.',
    reaction: "An elf's bow. Quiet feet, quicker eyes. Good instincts.",
  }),
  'elf-bo-staff': Object.freeze({
    id: 'elf-bo-staff',
    label: 'Elf, Bo Staff',
    race: 'Elf',
    weapon: 'Bo Staff',
    flavor: 'Simple robes, old discipline. Every strike already three moves planned.',
    reaction: 'A bo staff, old discipline behind it. Someone taught you to think three moves ahead.',
  }),
  'gnome-mace': Object.freeze({
    id: 'gnome-mace',
    label: 'Gnome, Mace',
    race: 'Gnome',
    weapon: 'Mace',
    flavor: 'A scavenged breastplate two sizes too big. Small frame, surprising swing.',
    reaction: 'A mace, gnome-sized and heavier than it looks. I like a good surprise.',
  }),
  'gnome-daggers': Object.freeze({
    id: 'gnome-daggers',
    label: 'Gnome, Daggers',
    race: 'Gnome',
    weapon: 'Daggers',
    flavor: 'Dark leathers built for slipping through gaps. Quick hands, quicker mouth.',
    reaction: "Daggers, quick hands. You'll want every inch of that speed.",
  }),
})

export const PLAYER_PRONOUN_OPTIONS = Object.freeze([
  Object.freeze({ id: 'he', label: 'He', value: 'He' }),
  Object.freeze({ id: 'she', label: 'She', value: 'She' }),
  Object.freeze({ id: 'they', label: 'They', value: 'They' }),
  Object.freeze({ id: 'skip', label: 'Skip this', value: null }),
])

export const PLAYER_LOOK_OPTIONS = Object.freeze([
  Object.freeze({
    id: 'tall-weathered',
    label: 'Tall and weathered, hair silvered early, eyes the color of wet slate.',
  }),
  Object.freeze({
    id: 'broad-scarred',
    label: 'Broad-built and scarred, dark hair kept short, eyes a startling amber.',
  }),
  Object.freeze({
    id: 'small-quick',
    label: 'Small and quick, hair the color of dry grass, eyes that catch light strangely, faintly glowing at dusk.',
  }),
  Object.freeze({
    id: 'heavyset-steady',
    label: 'Heavyset and steady, hair long and braided, eyes a deep, ordinary brown that misses nothing.',
  }),
])

export const WEAPON_FLAVOR_PHRASES = Object.freeze({
  Sword: 'a clean cut',
  Bow: 'an arrow finds its mark',
  'Battle Axe': 'a heavy swing crushes through',
  'Bo Staff': 'a precise, practiced strike',
  Mace: 'a blunt crack connects',
  Daggers: 'a quick double strike flickers in and out',
})

export const GOBLIN_KING_TAUNT_FALLBACK =
  "I watch the Goblin King lean back on his throne in the Stash Hall, crates stacked behind him, one crate marked with a seal he clearly didn't design himself, and say, 'You may begin whenever you are ready to disappoint yourself.'"

export const DIFFICULTY = Object.freeze({
  easy: 9,
  standard: 12,
  hard: 15,
  goblinKing: 16,
})

export const ENDINGS = Object.freeze({
  recovery: 'recovery',
  bargain: 'bargain',
  escape: 'escape',
})

export const NARRATION_TIERS = Object.freeze({
  normal: 'normal',
  experiencedCallback: 'experienced-callback-eligible',
  fourthWall: 'fourth-wall-eligible',
})

export const NATURAL_ONE_COMPLICATIONS = Object.freeze([
  'The stone gate moves exactly far enough to block the route you were using. This is measurable progress.',
  'Your boot remains in the fen. This is not serious, but it does change the schedule.',
  'A goblin stamps your sleeve TEMPORARY ASSISTANT. The stamp is permanent for the rest of the afternoon.',
  "The field reliquary acquires a dent shaped exactly like a goblin's opinion. Its contents remain secure.",
  'You reach the correct tactical position one minute after it stops being the correct tactical position.',
])

export const BACKGROUNDS = Object.freeze({
  tracker: Object.freeze({
    id: 'tracker',
    name: 'Highland Tracker',
    flavor:
      "At the road's edge, I watch you crouch beside the fresh goblin footprint and measure its stride; the trail into the Highlands has never hidden itself from you for long.",
    strength: 3,
    defense: 1,
    manaPool: 2,
    ability: 'Push Through',
  }),
  warden: Object.freeze({
    id: 'warden',
    name: 'Trail Warden',
    flavor:
      "At the road's edge, I watch you check every strap and buckle before Rattlebridge comes into view; a warden who is careless at the crossing does not stay a warden long.",
    strength: 1,
    defense: 3,
    manaPool: 2,
    ability: 'Hold the Line',
  }),
  diviner: Object.freeze({
    id: 'diviner',
    name: 'Fen Diviner',
    flavor:
      "At the road's edge, I watch you unfold a map that has never once agreed with the terrain it describes; it points toward the Highlands anyway, and that has been enough before.",
    strength: 1,
    defense: 2,
    manaPool: 4,
    ability: 'Read the Wrong Map Right',
  }),
})

export const FIXED_TEST_ADVENTURE = Object.freeze({
  id: 'goblin-highlands-session-1',
  title: 'The Goblin Highlands',
  fallbackStolenItems: Object.freeze([
    'the Amber Field Satchel',
    'the Carefully Labeled Moon Jar',
    'the Emergency Snack Reliquary',
    'the Brass-Latched Research Case',
  ]),
  goblinNames: Object.freeze([
    'Bracken Toewiggle',
    'Marrow Pinchfinger',
    'Grix Kettlebottom',
    'Old Sump',
  ]),
  routes: Object.freeze({
    quiet: Object.freeze({
      id: 'quiet',
      name: 'The Quiet Crossing',
      stat: 'defense',
      dc: DIFFICULTY.standard,
      successText: 'You cross Rattlebridge without waking a single bottle-cap alarm.',
      failureText: 'One bottle cap sings out before you can silence it.',
    }),
    loud: Object.freeze({
      id: 'loud',
      name: 'The Direct Crossing',
      stat: 'strength',
      dc: DIFFICULTY.standard,
      successText: 'You cross Rattlebridge fast enough that the alarm lines never finish deciding what they heard.',
      failureText: "Rattlebridge's alarm lines finish deciding before you're halfway across.",
    }),
  }),
})

const SCENES = Object.freeze({
  sessionWelcome: 'session-zero-welcome',
  sessionName: 'session-zero-name',
  sessionKind: 'session-zero-kind',
  background: 'choose-background',
  sessionPronoun: 'session-zero-pronoun',
  sessionLook: 'session-zero-look',
  route: 'choose-route',
  goblin: 'goblin-encounter',
  midpoint: 'midpoint',
  boss: 'goblin-king',
  ending: 'ending',
})

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

function drawFromList(list, rngState) {
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error('Cannot draw from an empty list.')
  }

  const draw = nextRandom(rngState)
  const index = Math.min(list.length - 1, Math.floor(draw.value * list.length))
  return { value: list[index], rngState: draw.rngState }
}

function normalizeText(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ')
}


function isNameHelpRequest(value) {
  const text = normalizeText(value).toLowerCase()
  if (!text) return true
  return /\b(?:help|suggest|suggestion|name idea|name ideas|not sure|don't know|do not know)\b/.test(text)
}

function weaponFlavorSentence(weapon) {
  const phrase = WEAPON_FLAVOR_PHRASES[weapon] || 'a direct strike'
  return `${phrase.charAt(0).toUpperCase()}${phrase.slice(1)}.`
}

function finalizeSessionZero(state, playerLook, actionId) {
  const returningLine = normalizeText(state.returningLine)
  const narration = [
    ...state.narration,
    `${state.playerName}. I'll remember that.`,
    WEED_GOBLINS_INTRODUCTION,
  ]
  if (returningLine) narration.push(returningLine)

  return cloneState(state, {
    playerLook,
    returningLine: null,
    sceneId: SCENES.route,
    flags: { sessionZeroComplete: true },
    history: [
      ...state.history,
      {
        type: 'session-choice',
        sceneId: SCENES.sessionLook,
        actionId,
        playerLook,
      },
    ],
    narration,
  })
}

export function isWeedGoblinsSessionTextScene(state) {
  return Boolean(
    state
      && state.status !== 'completed'
      && [SCENES.sessionName, SCENES.sessionLook].includes(state.sceneId),
  )
}

export function advanceWeedGoblinsSessionText(state, value) {
  if (!state || typeof state !== 'object') throw new Error('A run state is required.')
  if (state.status === 'completed') throw new Error('This run is already complete.')

  if (state.sceneId === SCENES.sessionName) {
    const playerName = normalizeText(value).slice(0, 160)
    if (isNameHelpRequest(playerName)) {
      return cloneState(state, { flags: { nameSuggestionsVisible: true } })
    }
    return cloneState(state, {
      playerName,
      sceneId: SCENES.sessionKind,
      flags: { nameSuggestionsVisible: false },
      history: [
        ...state.history,
        {
          type: 'session-choice',
          sceneId: SCENES.sessionName,
          actionId: 'session:name:custom',
          playerName,
        },
      ],
      narration: [
        ...state.narration,
        `${playerName}. Good, that's who you'll be.`,
        SESSION_KIND_QUESTION,
      ],
    })
  }

  if (state.sceneId === SCENES.sessionLook) {
    const playerLook = normalizeText(value).slice(0, 160)
    if (!playerLook) throw new Error('A character look is required.')
    return finalizeSessionZero(state, playerLook, 'session:look:custom')
  }

  throw new Error(`Session text input is not available in scene ${state.sceneId}.`)
}

function normalizePriorCompletedRunCount(value) {
  const count = Number(value)
  if (!Number.isFinite(count) || count <= 0) return 0
  return Math.floor(count)
}

export function calculateNarrationTier(priorCompletedRunCount = 0) {
  const count = normalizePriorCompletedRunCount(priorCompletedRunCount)
  if (count >= 10) return NARRATION_TIERS.fourthWall
  if (count >= 5) return NARRATION_TIERS.experiencedCallback
  return NARRATION_TIERS.normal
}

function getProductNames(snapshot = {}) {
  const values = Array.isArray(snapshot.productNames) ? snapshot.productNames : []
  return values
    .map((item) => (typeof item === 'string' ? item : item?.name ?? item?.displayName))
    .map(normalizeText)
    .filter(Boolean)
    .slice(0, 20)
}

function getFictionalLocationNames(snapshot = {}) {
  const values = Array.isArray(snapshot.fictionalLocationNames)
    ? snapshot.fictionalLocationNames
    : []
  return values
    .map(normalizeText)
    .filter(Boolean)
    .slice(0, 20)
}

function fictionalizeProductName(productName) {
  return `the ${normalizeText(productName)} Field Reliquary`
}

function chooseStolenItem(snapshot, adventure, rngState) {
  const products = getProductNames(snapshot)
  const source = products.length > 0
    ? products.map(fictionalizeProductName)
    : adventure.fallbackStolenItems
  return drawFromList(source, rngState)
}

function chooseFictionalLocationName(snapshot, seed) {
  const locations = getFictionalLocationNames(snapshot)
  if (locations.length === 0) return null
  const index = hashSeed(`${seed}:fictional-location`) % locations.length
  return locations[index]
}

function locationForSentence(locationName) {
  return normalizeText(locationName).replace(/^The\s+/i, 'the ')
}

function routeLocationText(locationName) {
  const location = locationForSentence(locationName)
  return location ? ` The route bends past ${location}.` : ''
}

function routeEnvironmentText(environmentThemeFlavor) {
  const flavor = normalizeText(environmentThemeFlavor)
  return flavor ? ` ${flavor}` : ''
}

function backgroundTraitText(characterTraitFlavor) {
  const flavor = normalizeText(characterTraitFlavor)
  return flavor ? ` ${flavor}` : ''
}

function buildReturningNarration(previousRuns = []) {
  if (!Array.isArray(previousRuns) || previousRuns.length === 0) return null
  const latest = previousRuns[previousRuns.length - 1]
  const outcome = normalizeText(
    latest?.outcomeSummary ?? latest?.ending ?? 'left with unfinished business',
  )
  return WEED_GOBLINS_RETURNING_LINE.replace('[outcome]', outcome)
}

function cloneState(state, changes = {}) {
  return {
    ...state,
    ...changes,
    stats: { ...state.stats, ...(changes.stats ?? {}) },
    flags: { ...state.flags, ...(changes.flags ?? {}) },
    history: changes.history ?? [...state.history],
    narration: changes.narration ?? [...state.narration],
  }
}

function appendEvent(state, event, narrationLine) {
  return cloneState(state, {
    history: [...state.history, event],
    narration: narrationLine ? [...state.narration, narrationLine] : [...state.narration],
  })
}

function enterGoblinKingScene(state) {
  return appendEvent(
    cloneState(state, { sceneId: SCENES.boss }),
    {
      type: 'taunt',
      sceneId: SCENES.boss,
      actionId: 'boss:taunt',
      outcome: 'taunt',
      tauntText: GOBLIN_KING_TAUNT_FALLBACK,
    },
    GOBLIN_KING_TAUNT_FALLBACK,
  )
}

function rollD20(state) {
  const draw = nextRandom(state.rngState)
  return {
    roll: Math.floor(draw.value * 20) + 1,
    rngState: draw.rngState,
  }
}

function applyTrouble(state, amount, reason) {
  const trouble = Math.min(3, state.trouble + amount)
  const updated = cloneState(state, { trouble })
  if (trouble >= 3) {
    return completeRun(updated, ENDINGS.escape, reason)
  }
  return updated
}

function spendMana(state, amount, actionId) {
  if (!Number.isInteger(amount) || amount < 1) {
    throw new Error('Mana cost must be a positive integer.')
  }
  if (state.stats.manaPool < amount) {
    throw new Error(`Not enough Mana for ${actionId}.`)
  }
  return appendEvent(
    cloneState(state, { stats: { manaPool: state.stats.manaPool - amount } }),
    { type: 'mana', sceneId: state.sceneId, actionId, amount },
    `You spend ${amount} Mana. I am recording this because Mana accounting matters.`,
  )
}

function selectComplication(state, actionId) {
  if (actionId === 'route:loud') return NATURAL_ONE_COMPLICATIONS[0]
  if (actionId === 'route:quiet') return NATURAL_ONE_COMPLICATIONS[1]
  if (String(actionId).startsWith('goblin:')) return NATURAL_ONE_COMPLICATIONS[2]
  if (String(actionId).startsWith('midpoint:')) return NATURAL_ONE_COMPLICATIONS[3]
  if (String(actionId).startsWith('boss:')) return NATURAL_ONE_COMPLICATIONS[4]
  return NATURAL_ONE_COMPLICATIONS[state.complicationCount % NATURAL_ONE_COMPLICATIONS.length]
}

function applyNaturalOneComplication(state, event, complicationText) {
  const trouble = Math.min(2, state.trouble + 2)
  return appendEvent(
    cloneState(state, {
      trouble,
      complicationCount: state.complicationCount + 1,
    }),
    {
      ...event,
      success: false,
      naturalOne: true,
      outcome: 'complication',
      complicationText,
    },
    complicationText,
  )
}

function resolveCheck(
  state,
  {
    actionId,
    stat,
    dc,
    successText,
    failureText,
    manaCost = 0,
  },
) {
  if (!['strength', 'defense'].includes(stat)) {
    throw new Error(`Unsupported check stat: ${stat}`)
  }

  let working = state
  if (manaCost > 0) {
    working = spendMana(working, manaCost, actionId)
  }

  const first = rollD20(working)
  working = cloneState(working, { rngState: first.rngState })
  const rolls = [first.roll]

  if (manaCost > 0) {
    const second = rollD20(working)
    working = cloneState(working, { rngState: second.rngState })
    rolls.push(second.roll)
  }

  const finalRoll = Math.max(...rolls)
  const total = finalRoll + working.stats[stat]
  const success = finalRoll === 20 || total >= dc
  const naturalOne = finalRoll === 1
  const event = {
    type: 'check',
    sceneId: working.sceneId,
    actionId,
    stat,
    dc,
    rolls,
    roll: finalRoll,
    total,
    success,
    naturalOne,
    advantage: manaCost > 0,
    manaAssisted: manaCost > 0,
    manaCost,
    outcome: naturalOne ? 'complication' : success ? 'success' : 'failure',
  }

  if (naturalOne) {
    const complicationText = selectComplication(working, actionId)
    working = applyNaturalOneComplication(working, event, complicationText)
    return { state: working, success: false, event: working.history.at(-1) }
  }

  working = appendEvent(working, event, success ? successText : failureText)

  if (success && finalRoll === 20 && working.trouble > 0) {
    working = cloneState(working, { trouble: working.trouble - 1 })
  }

  if (!success) {
    working = applyTrouble(working, 1, `${actionId} failed`)
  }

  return { state: working, success, event }
}

function endingNarration(ending, state) {
  if (ending === ENDINGS.recovery) {
    return `You recover ${state.stolenItem} from the King's Stash Hall. The Goblin King insists he is a king. His fear, and the black-root seal stamped on every crate around you, say otherwise.`
  }
  if (ending === ENDINGS.bargain) {
    return `You leave the Stash Hall with ${state.stolenItem} and a bargain the goblins insist is customary. A tribute crate marked with the same black-root seal is already being carried off toward some place called the Hollow Market.`
  }
  return `You escape the Highlands without ${state.stolenItem}. A black-root seal on the nearest crate is the last thing you see before the trail closes behind you, someone else's tribute, headed somewhere you don't yet have a name for.`
}

function completeRun(state, ending, reason = null) {
  if (!Object.values(ENDINGS).includes(ending)) {
    throw new Error(`Unknown ending: ${ending}`)
  }

  const summary = {
    adventureId: state.adventureId,
    seed: state.seed,
    backgroundId: state.background?.id ?? null,
    stolenItem: state.stolenItem,
    routeId: state.flags.routeId,
    midpointChoice: state.flags.midpointChoice,
    ending,
    outcomeSummary:
      ending === ENDINGS.recovery
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

  return appendEvent(
    cloneState(state, {
      status: 'completed',
      sceneId: SCENES.ending,
      ending,
      runSummary: summary,
    }),
    { type: 'ending', sceneId: SCENES.ending, ending, reason },
    endingNarration(ending, state),
  )
}

export function createWeedGoblinsRun({
  seed = 'weed-goblins-session-1',
  journalSnapshot = {},
  previousRuns = [],
  priorCompletedRunCount = 0,
  adventure = FIXED_TEST_ADVENTURE,
} = {}) {
  if (!adventure?.fallbackStolenItems || !adventure?.goblinNames || !adventure?.routes) {
    throw new Error('Adventure definition is incomplete.')
  }

  const normalizedPriorCompletedRunCount = normalizePriorCompletedRunCount(
    priorCompletedRunCount,
  )
  const narrationTier = calculateNarrationTier(normalizedPriorCompletedRunCount)

  let rngState = hashSeed(seed)
  const stolen = chooseStolenItem(journalSnapshot, adventure, rngState)
  rngState = stolen.rngState
  const goblin = drawFromList(adventure.goblinNames, rngState)
  rngState = goblin.rngState
  const fictionalLocationName = chooseFictionalLocationName(journalSnapshot, seed)
  const characterTraitFlavor = normalizeText(journalSnapshot?.effectTraitFlavor)
  const environmentThemeFlavor = normalizeText(journalSnapshot?.terpeneEnvironmentFlavor)

  const returningLine = buildReturningNarration(previousRuns)

  return {
    version: 1,
    adventureId: adventure.id,
    adventure,
    seed: String(seed),
    rngState,
    status: 'active',
    sceneId: SCENES.sessionWelcome,
    playerName: null,
    playerRace: null,
    playerWeapon: null,
    playerPronoun: null,
    playerLook: null,
    returningLine,
    background: null,
    stats: { strength: 0, defense: 0, manaPool: 0, maxMana: 0 },
    trouble: 0,
    complicationCount: 0,
    priorCompletedRunCount: normalizedPriorCompletedRunCount,
    narrationTier,
    stolenItem: stolen.value,
    goblinName: goblin.value,
    fictionalLocationName,
    characterTraitFlavor,
    environmentThemeFlavor,
    flags: {
      routeId: null,
      midpointChoice: null,
      goblinAlly: false,
      bossDcModifier: 0,
      sessionZeroComplete: false,
      nameSuggestionsVisible: false,
    },
    ending: null,
    runSummary: null,
    history: [],
    narration: [...SESSION_ZERO_WELCOME],
  }
}

function optionalManaCost(options) {
  return options.useManaAdvantage === true || options.useManaReroll === true ? 1 : 0
}

export function getAvailableActions(state) {
  if (!state || state.status === 'completed') return []


  if (state.sceneId === SCENES.sessionWelcome) {
    return [{ id: 'session:continue', label: 'Continue' }]
  }

  if (state.sceneId === SCENES.sessionName) {
    if (!state.flags.nameSuggestionsVisible) return []
    return PLAYER_NAME_SUGGESTIONS.map((name, index) => ({
      id: `session:name:${index}`,
      label: name,
    }))
  }

  if (state.sceneId === SCENES.sessionKind) {
    return Object.values(PLAYER_KINDS).map((kind) => ({
      id: `session:kind:${kind.id}`,
      label: kind.label,
      detail: kind.flavor,
    }))
  }


  if (state.sceneId === SCENES.background) {
    return Object.values(BACKGROUNDS).map((background) => ({
      id: `background:${background.id}`,
      label: background.name,
    }))
  }

  if (state.sceneId === SCENES.sessionPronoun) {
    return PLAYER_PRONOUN_OPTIONS.map((option) => ({
      id: `session:pronoun:${option.id}`,
      label: option.label,
    }))
  }

  if (state.sceneId === SCENES.sessionLook) {
    return PLAYER_LOOK_OPTIONS.map((option) => ({
      id: `session:look:${option.id}`,
      label: option.label,
    }))
  }

  if (state.sceneId === SCENES.route) {
    const location = locationForSentence(state.fictionalLocationName)
    return Object.values(state.adventure.routes).map((route) => ({
      id: `route:${route.id}`,
      label: location ? `${route.name} past ${location}` : route.name,
    }))
  }

  if (state.sceneId === SCENES.goblin) {
    const actions = [
      { id: 'goblin:strike', label: `Strike ${state.goblinName}` },
      { id: 'goblin:guard', label: `Outlast ${state.goblinName}` },
    ]
    if (state.stats.manaPool >= 1) {
      actions.push({ id: 'goblin:channel', label: 'Spend 1 Mana for advantage while confusing the encounter' })
    }
    return actions
  }

  if (state.sceneId === SCENES.midpoint) {
    const actions = [
      { id: 'midpoint:help', label: 'Help Nib untangle a snapped tripwire' },
      { id: 'midpoint:take-token', label: 'Take the unattended tribute token' },
      { id: 'midpoint:skip', label: 'Keep moving' },
    ]
    if (state.stats.manaPool >= 1) {
      actions.push({ id: 'midpoint:read-runes', label: 'Spend 1 Mana for advantage while reading the old trail-runes at Cloudberry Shelf' })
    }
    return actions
  }

  if (state.sceneId === SCENES.boss) {
    const actions = [
      { id: 'boss:overpower', label: 'Overpower the Goblin King' },
      { id: 'boss:outlast', label: 'Outlast the Goblin King' },
    ]
    if (state.stats.manaPool >= 2) {
      actions.push({ id: 'boss:spell', label: 'Spend 2 Mana for advantage on a decisive theory' })
    }
    if (state.flags.goblinAlly) {
      actions.push({ id: 'boss:bargain', label: 'Invoke the goblin clerk as a witness' })
    }
    return actions
  }

  return []
}

export function advanceWeedGoblinsRun(state, actionId, options = {}) {
  if (!state || typeof state !== 'object') throw new Error('A run state is required.')
  if (state.status === 'completed') throw new Error('This run is already complete.')
  if (!getAvailableActions(state).some((action) => action.id === actionId)) {
    throw new Error(`Action ${actionId} is not available in scene ${state.sceneId}.`)
  }

  if (state.sceneId === SCENES.sessionWelcome) {
    return cloneState(state, {
      sceneId: SCENES.sessionName,
      history: [
        ...state.history,
        { type: 'session-choice', sceneId: SCENES.sessionWelcome, actionId },
      ],
    })
  }

  if (state.sceneId === SCENES.sessionName) {
    const suggestionIndex = Number(actionId.split(':')[2])
    const playerName = PLAYER_NAME_SUGGESTIONS[suggestionIndex]
    if (!playerName) throw new Error('Unknown Session Zero name suggestion.')
    return cloneState(state, {
      playerName,
      sceneId: SCENES.sessionKind,
      flags: { nameSuggestionsVisible: false },
      history: [
        ...state.history,
        {
          type: 'session-choice',
          sceneId: SCENES.sessionName,
          actionId,
          playerName,
        },
      ],
      narration: [
        ...state.narration,
        `${playerName}. Good, that's who you'll be.`,
        SESSION_KIND_QUESTION,
      ],
    })
  }

  if (state.sceneId === SCENES.sessionKind) {
    const kindId = actionId.slice('session:kind:'.length)
    const kind = PLAYER_KINDS[kindId]
    if (!kind) throw new Error('Unknown Session Zero kind.')
    return cloneState(state, {
      playerRace: kind.race,
      playerWeapon: kind.weapon,
      sceneId: SCENES.background,
      history: [
        ...state.history,
        {
          type: 'session-choice',
          sceneId: SCENES.sessionKind,
          actionId,
          playerRace: kind.race,
          playerWeapon: kind.weapon,
        },
      ],
      narration: [
        ...state.narration,
        kind.reaction,
        SESSION_CLASS_QUESTION,
      ],
    })
  }

  if (state.sceneId === SCENES.background) {
    const backgroundId = actionId.split(':')[1]
    const background = BACKGROUNDS[backgroundId]
    const traitText = backgroundTraitText(state.characterTraitFlavor)
    const afterClassChoice = appendEvent(
      cloneState(state, {
        background,
        sceneId: SCENES.sessionPronoun,
        stats: {
          strength: background.strength,
          defense: background.defense,
          manaPool: background.manaPool,
          maxMana: background.manaPool,
        },
      }),
      { type: 'session-choice', sceneId: SCENES.background, actionId, backgroundId },
      `${background.name}. ${background.flavor}${traitText}`,
    )
    return cloneState(afterClassChoice, {
      narration: [...afterClassChoice.narration, SESSION_PRONOUN_QUESTION],
    })
  }

  if (state.sceneId === SCENES.sessionPronoun) {
    const pronounId = actionId.slice('session:pronoun:'.length)
    const option = PLAYER_PRONOUN_OPTIONS.find((candidate) => candidate.id === pronounId)
    if (!option) throw new Error('Unknown Session Zero pronoun option.')
    return cloneState(state, {
      playerPronoun: option.value,
      sceneId: SCENES.sessionLook,
      history: [
        ...state.history,
        {
          type: 'session-choice',
          sceneId: SCENES.sessionPronoun,
          actionId,
          playerPronoun: option.value,
        },
      ],
      narration: [...state.narration, SESSION_LOOK_QUESTION],
    })
  }

  if (state.sceneId === SCENES.sessionLook) {
    const lookId = actionId.slice('session:look:'.length)
    const option = PLAYER_LOOK_OPTIONS.find((candidate) => candidate.id === lookId)
    if (!option) throw new Error('Unknown Session Zero look option.')
    return finalizeSessionZero(state, option.label, actionId)
  }

  if (state.sceneId === SCENES.route) {
    const routeId = actionId.split(':')[1]
    const route = state.adventure.routes[routeId]
    const locationText = routeLocationText(state.fictionalLocationName)
    const environmentText = routeEnvironmentText(state.environmentThemeFlavor)
    const result = resolveCheck(
      cloneState(state, { flags: { routeId } }),
      {
        actionId,
        stat: route.stat,
        dc: route.dc,
        successText: `${route.successText}${locationText}${environmentText}`,
        failureText: `${route.failureText}${locationText}${environmentText}`,
        manaCost: optionalManaCost(options),
      },
    )
    if (result.state.status === 'completed') return result.state
    return cloneState(result.state, { sceneId: SCENES.goblin })
  }

  if (state.sceneId === SCENES.goblin) {
    if (actionId === 'goblin:channel') {
      const result = resolveCheck(state, {
        actionId,
        stat: 'defense',
        dc: DIFFICULTY.standard,
        manaCost: 1,
        successText: `${state.goblinName} becomes occupied with a theory that has no immediate conclusion. The path is clear.`,
        failureText: `${state.goblinName} rejects the theory on procedural grounds and keeps the useful side of the path.`,
      })
      if (result.state.status === 'completed') return result.state
      return cloneState(result.state, { sceneId: SCENES.midpoint })
    }

    const isStrike = actionId === 'goblin:strike'
    const stat = isStrike ? 'strength' : 'defense'
    const weaponFlavor = weaponFlavorSentence(state.playerWeapon)
    const result = resolveCheck(state, {
      actionId,
      stat,
      dc: DIFFICULTY.standard,
      successText: isStrike
        ? `${weaponFlavor} ${state.goblinName} yields the path with theatrical reluctance.`
        : `${state.goblinName} yields the path with theatrical reluctance.`,
      failureText: isStrike
        ? `${weaponFlavor} ${state.goblinName} lands a surprisingly organized counterargument.`
        : `${state.goblinName} lands a surprisingly organized counterargument.`,
      manaCost: optionalManaCost(options),
    })
    if (result.state.status === 'completed') return result.state
    return cloneState(result.state, { sceneId: SCENES.midpoint })
  }

  if (state.sceneId === SCENES.midpoint) {
    if (actionId === 'midpoint:help') {
      return enterGoblinKingScene(
        appendEvent(
          cloneState(state, {
            flags: { midpointChoice: 'help', goblinAlly: true },
          }),
          { type: 'choice', sceneId: SCENES.midpoint, actionId },
          'You help a nervous young scout named Nib untangle a snapped tripwire. Nib is grateful, and a little surprised anyone bothered.',
        ),
      )
    }

    if (actionId === 'midpoint:read-runes') {
      const result = resolveCheck(
        cloneState(state, { flags: { midpointChoice: 'read-runes' } }),
        {
          actionId,
          stat: 'defense',
          dc: DIFFICULTY.standard,
          manaCost: 1,
          successText: "The old trail-runes at Cloudberry Shelf explain the Stash Hall's entrance in unnecessary detail. I approve of the detail.",
          failureText: 'The runes include a footnote you interpret as optional. The entrance does not.',
        },
      )
      if (result.state.status === 'completed') return result.state
      return enterGoblinKingScene(
        cloneState(result.state, {
          flags: { bossDcModifier: result.success ? -2 : 1 },
        }),
      )
    }

    if (actionId === 'midpoint:take-token') {
      const result = resolveCheck(
        cloneState(state, { flags: { midpointChoice: 'take-token' } }),
        {
          actionId,
          stat: 'defense',
          dc: DIFFICULTY.easy,
          successText: 'You take the unattended tribute token without waking the small but judgmental bell.',
          failureText: 'The bell announces your decision to the entire camp.',
          manaCost: optionalManaCost(options),
        },
      )
      if (result.state.status === 'completed') return result.state
      return enterGoblinKingScene(
        cloneState(result.state, {
          flags: { bossDcModifier: result.success ? -1 : 1 },
        }),
      )
    }

    return enterGoblinKingScene(
      appendEvent(
        cloneState(state, { flags: { midpointChoice: 'skip' } }),
        { type: 'choice', sceneId: SCENES.midpoint, actionId },
        'You continue without interfering. This is a valid choice. I have no additional comment. I have several comments.',
      ),
    )
  }

  if (state.sceneId === SCENES.boss) {
    if (actionId === 'boss:bargain') {
      return completeRun(state, ENDINGS.bargain, 'goblin clerk testimony')
    }

    const dc = Math.max(
      DIFFICULTY.easy,
      DIFFICULTY.goblinKing + state.flags.bossDcModifier,
    )

    if (actionId === 'boss:spell') {
      const result = resolveCheck(state, {
        actionId,
        stat: 'defense',
        dc,
        manaCost: 2,
        successText: 'Your decisive theory contains three premises and one diagram. The Goblin King concedes before the diagram is explained.',
        failureText: 'The Goblin King identifies a missing label on the diagram and remains in control of the room.',
      })
      if (result.state.status === 'completed') return result.state
      if (result.success) return completeRun(result.state, ENDINGS.recovery, 'mana-assisted victory')
      return result.state
    }

    const isOverpower = actionId === 'boss:overpower'
    const stat = isOverpower ? 'strength' : 'defense'
    const weaponFlavor = weaponFlavorSentence(state.playerWeapon)
    const result = resolveCheck(state, {
      actionId,
      stat,
      dc,
      successText: isOverpower
        ? `${weaponFlavor} The Goblin King is defeated within the accepted fictional meaning of defeated.`
        : 'The Goblin King is defeated within the accepted fictional meaning of defeated.',
      failureText: isOverpower
        ? `${weaponFlavor} The Goblin King remains king for at least one more action.`
        : 'The Goblin King remains king for at least one more action.',
      manaCost: optionalManaCost(options),
    })
    if (result.state.status === 'completed') return result.state
    if (result.success) return completeRun(result.state, ENDINGS.recovery, `${stat} victory`)
    return result.state
  }

  throw new Error(`Unsupported scene: ${state.sceneId}`)
}

export function advanceWeedGoblinsFreeTextMidpointCheck(state, style) {
  if (!state || typeof state !== 'object') throw new Error('A run state is required.')
  if (state.status === 'completed') throw new Error('This run is already complete.')
  if (state.sceneId !== SCENES.midpoint) {
    throw new Error(`Free-text midpoint checks are not available in scene ${state.sceneId}.`)
  }
  if (!['strength', 'defense', 'mana'].includes(style)) {
    throw new Error(`Unsupported free-text midpoint style: ${style}`)
  }

  const manaCost = style === 'mana' ? 1 : 0
  const stat = style === 'strength' ? 'strength' : 'defense'
  const actionId = `free-text:midpoint:${style}`
  const result = resolveCheck(state, {
    actionId,
    stat,
    dc: DIFFICULTY.standard,
    manaCost,
    successText: 'Your improvised midpoint approach works without adding a new complication.',
    failureText: 'Your improvised midpoint approach costs time and position without resolving cleanly.',
  })

  if (result.state.status === 'completed') return result.state
  return enterGoblinKingScene(result.state)
}

export function playWeedGoblinsActions(initialState, actions) {
  if (!Array.isArray(actions)) throw new Error('Actions must be an array.')
  return actions.reduce((state, action) => {
    const actionId = typeof action === 'string' ? action : action.id
    const options = typeof action === 'string' ? {} : action.options ?? {}
    return advanceWeedGoblinsRun(state, actionId, options)
  }, initialState)
}
