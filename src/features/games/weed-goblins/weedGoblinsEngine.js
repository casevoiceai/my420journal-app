export const STONER_INTRODUCTION =
  "Welcome to the Goblin Highlands. I'll be your narrator. I want to be transparent that I find this world very interesting and have developed opinions about some of the characters. I'll try to be impartial. I'm not promising anything."

export const STONER_RETURNING_LINE =
  "You've been to the Goblin Highlands before. Last time you [outcome]. I'm curious whether you'll make the same choices."

export const GOBLIN_KING_TAUNT_FALLBACK =
  'I watch the Goblin King lean back on his throne and say, "You may begin whenever you are ready to disappoint yourself," with the confidence of someone who has already prepared the paperwork.'

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
  hauler: Object.freeze({
    id: 'hauler',
    name: 'Highlands Hauler',
    flavor:
      'You were trained to move sealed field supplies across unreasonable terrain without asking what made the terrain unreasonable.',
    strength: 3,
    defense: 1,
    manaPool: 2,
    ability: 'Shoulder Through',
  }),
  keeper: Object.freeze({
    id: 'keeper',
    name: 'Cautious Keeper',
    flavor:
      'You label every pouch, lock every case, and have never once trusted a goblin who said a latch was probably fine.',
    strength: 1,
    defense: 3,
    manaPool: 2,
    ability: 'Nothing Gets Past Me',
  }),
  adept: Object.freeze({
    id: 'adept',
    name: 'Fog-Table Adept',
    flavor:
      'You studied the ceremonial arrangement of snacks, maps, and improbable theories until the theories started answering back.',
    strength: 1,
    defense: 2,
    manaPool: 4,
    ability: 'Several Theories at Once',
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
    'Crankle Moss-Tooth',
    'Nib Wickerboot',
    'Professor Grub',
    'Skrint Approximately',
  ]),
  routes: Object.freeze({
    ridge: Object.freeze({
      id: 'ridge',
      name: 'The Direct Ridge',
      stat: 'strength',
      dc: DIFFICULTY.standard,
      successText: 'You move the stone gate before it finishes objecting.',
      failureText: 'The stone gate wins the first argument.',
    }),
    fen: Object.freeze({
      id: 'fen',
      name: 'The Suspicious Fen',
      stat: 'defense',
      dc: DIFFICULTY.standard,
      successText: 'You cross without allowing the fen to reorganize your belongings.',
      failureText: 'The fen keeps one boot for administrative reasons.',
    }),
  }),
})

const SCENES = Object.freeze({
  background: 'choose-background',
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
  return STONER_RETURNING_LINE.replace('[outcome]', outcome)
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
  if (actionId === 'route:ridge') return NATURAL_ONE_COMPLICATIONS[0]
  if (actionId === 'route:fen') return NATURAL_ONE_COMPLICATIONS[1]
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
    return `You recover ${state.stolenItem}. The Goblin King has several objections. None are operational.`
  }
  if (ending === ENDINGS.bargain) {
    return `You leave with ${state.stolenItem} and a formal agreement the goblins insist is customary. It is not customary.`
  }
  return `You escape the Highlands without ${state.stolenItem}. This is a defeat. It is also useful information for next time.`
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
  const narration = returningLine
    ? [returningLine, STONER_INTRODUCTION]
    : [STONER_INTRODUCTION]

  return {
    version: 1,
    adventureId: adventure.id,
    adventure,
    seed: String(seed),
    rngState,
    status: 'active',
    sceneId: SCENES.background,
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
    },
    ending: null,
    runSummary: null,
    history: [],
    narration,
  }
}

function optionalManaCost(options) {
  return options.useManaAdvantage === true || options.useManaReroll === true ? 1 : 0
}

export function getAvailableActions(state) {
  if (!state || state.status === 'completed') return []

  if (state.sceneId === SCENES.background) {
    return Object.values(BACKGROUNDS).map((background) => ({
      id: `background:${background.id}`,
      label: background.name,
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
      { id: 'midpoint:help', label: 'Help the stranded goblin clerk' },
      { id: 'midpoint:take-charm', label: 'Take the unattended brass charm' },
      { id: 'midpoint:skip', label: 'Keep moving' },
    ]
    if (state.stats.manaPool >= 1) {
      actions.push({ id: 'midpoint:read-runes', label: 'Spend 1 Mana for advantage while reading the gate runes' })
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

  if (state.sceneId === SCENES.background) {
    const backgroundId = actionId.split(':')[1]
    const background = BACKGROUNDS[backgroundId]
    const traitText = backgroundTraitText(state.characterTraitFlavor)
    return appendEvent(
      cloneState(state, {
        background,
        sceneId: SCENES.route,
        stats: {
          strength: background.strength,
          defense: background.defense,
          manaPool: background.manaPool,
          maxMana: background.manaPool,
        },
      }),
      { type: 'choice', sceneId: SCENES.background, actionId, backgroundId },
      `${background.name}. ${background.flavor}${traitText} I find this background mechanically defensible.`,
    )
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

    const stat = actionId === 'goblin:strike' ? 'strength' : 'defense'
    const result = resolveCheck(state, {
      actionId,
      stat,
      dc: DIFFICULTY.standard,
      successText: `${state.goblinName} yields the path with theatrical reluctance.`,
      failureText: `${state.goblinName} lands a surprisingly organized counterargument.`,
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
          'You help the goblin clerk recover a stack of forms. The clerk is moved. Mostly because the forms were numbered.',
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
          successText: 'The runes explain the throne mechanism in unnecessary detail. I approve of the detail.',
          failureText: 'The runes include a footnote you interpret as optional. The throne mechanism does not.',
        },
      )
      if (result.state.status === 'completed') return result.state
      return enterGoblinKingScene(
        cloneState(result.state, {
          flags: { bossDcModifier: result.success ? -2 : 1 },
        }),
      )
    }

    if (actionId === 'midpoint:take-charm') {
      const result = resolveCheck(
        cloneState(state, { flags: { midpointChoice: 'take-charm' } }),
        {
          actionId,
          stat: 'defense',
          dc: DIFFICULTY.easy,
          successText: 'You take the charm without activating the small but judgmental bell.',
          failureText: 'The bell announces your decision to the entire administrative wing.',
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

    const stat = actionId === 'boss:overpower' ? 'strength' : 'defense'
    const result = resolveCheck(state, {
      actionId,
      stat,
      dc,
      successText: 'The Goblin King is defeated within the accepted fictional meaning of defeated.',
      failureText: 'The Goblin King remains king for at least one more action.',
      manaCost: optionalManaCost(options),
    })
    if (result.state.status === 'completed') return result.state
    if (result.success) return completeRun(result.state, ENDINGS.recovery, `${stat} victory`)
    return result.state
  }

  throw new Error(`Unsupported scene: ${state.sceneId}`)
}

export function playWeedGoblinsActions(initialState, actions) {
  if (!Array.isArray(actions)) throw new Error('Actions must be an array.')
  return actions.reduce((state, action) => {
    const actionId = typeof action === 'string' ? action : action.id
    const options = typeof action === 'string' ? {} : action.options ?? {}
    return advanceWeedGoblinsRun(state, actionId, options)
  }, initialState)
}
