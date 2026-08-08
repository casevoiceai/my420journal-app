const NARRATED_EVENT_TYPES = new Set(['mana', 'choice', 'check', 'taunt', 'ending'])

function cleanText(value, maxLength = 300) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
    : ''
}

function openingObjectiveForState(state) {
  const stolenItem = cleanText(state?.stolenItem, 160)
  return stolenItem
    ? `The Goblin King stole ${stolenItem} from the player. The objective is to enter the Highlands and get it back.`
    : 'The Goblin King stole the player\'s field reliquary. The objective is to enter the Highlands and get it back.'
}

function routeNameForState(state) {
  const routeId = cleanText(state?.flags?.routeId, 40)
  return cleanText(state?.adventure?.routes?.[routeId]?.name, 100)
}

function continuityAnchorsForState(state) {
  const anchors = []
  const backgroundName = cleanText(state?.background?.name, 100)
  const routeName = routeNameForState(state)
  if (backgroundName) anchors.push(backgroundName)
  if (routeName) anchors.push(routeName)
  if (state?.flags?.goblinAlly) anchors.push('goblin clerk')
  if (state?.flags?.hasCharm) anchors.push('brass charm')
  if (state?.flags?.runeKnowledge) anchors.push('throne-room runes')
  return Object.freeze([...new Set(anchors)].slice(0, 6))
}

function storySoFarForState(state) {
  const parts = [openingObjectiveForState(state)]
  if (state?.background?.name) parts.push(`The player chose ${state.background.name}.`)
  const routeName = routeNameForState(state)
  if (routeName) parts.push(`The player took ${routeName}.`)
  if (state?.flags?.midpointChoice) {
    parts.push(`At the keep, the player chose ${cleanText(state.flags.midpointChoice, 80)}.`)
  }
  const latestEvent = state?.history?.at(-1)
  if (latestEvent?.outcome) {
    parts.push(`The latest authoritative outcome was ${cleanText(latestEvent.outcome, 40)}.`)
  } else if (latestEvent?.ending) {
    parts.push(`The authoritative ending is ${cleanText(latestEvent.ending, 40)}.`)
  }
  parts.push(`Current Trouble is ${Number(state?.trouble) || 0}.`)
  const resolvedChecks = (state?.history || [])
    .filter((event) => event?.type === 'check')
    .slice(-4)
  for (const event of resolvedChecks) {
    const result = event.naturalOne ? 'natural-1 complication' : cleanText(event.outcome, 40)
    parts.push(`${cleanText(event.actionId, 80) || 'A prior action'} resolved as ${result}.`)
  }
  if (state?.flags?.goblinAlly) parts.push('The goblin clerk is now an ally.')
  if (state?.flags?.hasCharm) parts.push('The player carries the brass charm.')
  if (state?.flags?.runeKnowledge) parts.push('The player learned the throne-room runes.')
  if (state?.flags?.dangerousForce) parts.push('The player used dangerous force earlier.')
  return cleanText(parts.join(' '), 600)
}

function tensionLevelForScene(sceneId) {
  return ({
    'choose-background': 'opening',
    'choose-route': 'commitment',
    'goblin-encounter': 'rising',
    midpoint: 'high',
    'goblin-king': 'climax',
    ending: 'resolution',
  })[sceneId] || 'rising'
}

function choiceContextForScene(state) {
  if (state?.sceneId === 'choose-background') {
    return 'Highlands Hauler means carrying the stolen item back over steep ground; Cautious Keeper means securing every latch against goblin hands; Fog-Table Adept means reading the Highlands through a shifting map and strange signs.'
  }
  if (state?.sceneId === 'choose-route') {
    const ridge = cleanText(state?.adventure?.routes?.ridge?.name, 100) || 'The Direct Ridge'
    const fen = cleanText(state?.adventure?.routes?.fen?.name, 100) || 'The Suspicious Fen'
    return `${ridge} reaches a stone gate directly and risks open resistance; ${fen} offers concealment in fog but threatens unsecured gear.`
  }
  if (state?.sceneId === 'goblin-encounter') {
    return `${cleanText(state?.goblinName, 100) || 'A goblin'} physically blocks the only clear passage; the player may confront, endure, distract, negotiate with, or otherwise act on that obstacle.`
  }
  if (state?.sceneId === 'midpoint') {
    return 'A stranded goblin clerk needs help with scattered forms, an unattended brass charm can be taken, runes cover the throne-room gate, and the player can also keep moving.'
  }
  if (state?.sceneId === 'goblin-king') {
    return `The Goblin King controls ${cleanText(state?.stolenItem, 160) || 'the stolen item'} in the throne room; the player must overcome him, outlast him, use a prepared advantage, bargain if an ally permits it, or attempt another concrete action.`
  }
  return ''
}

function scenePurposeForScene(sceneId) {
  return ({
    'choose-background': 'Make the three preparations legible before the player chooses one.',
    'choose-route': 'Turn preparation into a committed route with different visible risks.',
    'goblin-encounter': 'Put a named physical obstacle between the player and the keep.',
    midpoint: 'Raise pressure by presenting a consequential choice at the threshold of the throne room.',
    'goblin-king': 'Bring the stolen item, the antagonist, and the accumulated run state together for the climax.',
    ending: 'Resolve the exact objective established at the opening.',
  })[sceneId] || 'Continue the same causal story from the authoritative state.'
}

function sceneFallbackForState(state) {
  if (state?.sceneId === 'choose-background') {
    return 'I watch you stop at one scarred trailhead table where the waiting gear asks a single question: what kind of traveler will bring the stolen item home?'
  }
  if (state?.sceneId === 'choose-route') {
    const ridge = cleanText(state?.adventure?.routes?.ridge?.name, 100) || 'The Direct Ridge'
    const fen = cleanText(state?.adventure?.routes?.fen?.name, 100) || 'The Suspicious Fen'
    return `I watch your gear settle beside one split marker, its bare face pointing toward ${ridge} and its mossed face toward ${fen}.`
  }
  if (state?.sceneId === 'goblin-encounter') {
    const goblin = cleanText(state?.goblinName, 100) || 'a goblin sentry'
    return `I watch broken stones narrow around ${goblin}, who plants one boot across the only clear passage.`
  }
  if (state?.sceneId === 'midpoint') {
    return 'I watch the throne-room gate begin to close while a stranded clerk reaches through it with one numbered form.'
  }
  if (state?.sceneId === 'goblin-king') {
    const stolenItem = cleanText(state?.stolenItem, 160) || 'the stolen field reliquary'
    return `I watch the Goblin King's hand settle on ${stolenItem} as the throne-room doors grind shut behind you.`
  }
  return ''
}

export function getNarrationStoryContext(state) {
  const sceneId = cleanText(state?.sceneId, 80)
  return Object.freeze({
    openingObjective: openingObjectiveForState(state),
    storySoFar: storySoFarForState(state),
    continuityAnchors: continuityAnchorsForState(state),
    choiceContext: choiceContextForScene(state),
    scenePurpose: scenePurposeForScene(sceneId),
    tensionLevel: tensionLevelForScene(sceneId),
  })
}

function baseHook({
  moment,
  outcome,
  fallbackText,
  event = {},
  actionId = event.actionId,
  before,
  after,
  storyState = after ?? before,
}) {
  const sceneId = cleanText(event.sceneId, 80)
  return Object.freeze({
    moment,
    outcome,
    event,
    fallbackText: cleanText(fallbackText, 300),
    authoritativeText: cleanText(fallbackText, 300),
    sceneId,
    previousSceneId: cleanText(before?.sceneId, 80),
    actionId: cleanText(actionId, 80),
    stat: cleanText(event.stat, 20),
    dc: Number(event.dc) || 0,
    rolls: Array.isArray(event.rolls) ? event.rolls.slice(0, 2) : [],
    selectedRoll: Number.isFinite(Number(event.roll)) ? Number(event.roll) : null,
    troubleBefore: Number(before?.trouble) || 0,
    troubleAfter: Number(after?.trouble) || 0,
    fictionalStolenItem: cleanText(after?.stolenItem ?? before?.stolenItem, 160),
    fictionalGoblinName: cleanText(after?.goblinName ?? before?.goblinName, 100),
    fictionalLocationName: cleanText(
      after?.fictionalLocationName ?? before?.fictionalLocationName,
      120,
    ),
    narrationTier: cleanText(after?.narrationTier ?? before?.narrationTier, 50) || 'normal',
    ...getNarrationStoryContext(storyState),
    allowCallback: false,
    allowFourthWall: false,
  })
}

export function createInitialNarrationHook(state) {
  const fallbackText = cleanText(state?.narration?.at(-1), 300)
  if (!fallbackText) throw new Error('The run has no opening narration line.')

  return Object.freeze({
    ...baseHook({
      moment: 'scene-intro',
      outcome: 'intro',
      fallbackText,
      event: { sceneId: state.sceneId, actionId: 'intro:highlands' },
      before: state,
      after: state,
    }),
    introKind: 'highlands-opening',
    backgroundName: '',
    midpointChoice: '',
    endingReason: '',
  })
}

export function createPremiseNarrationHook(state) {
  const stolenItem = cleanText(state?.stolenItem, 160)
  if (!stolenItem) throw new Error('The run has no fictional stolen item.')
  const fallbackText = `I will state the problem plainly: the Goblin King stole ${stolenItem} from you. Your objective is to go into the Highlands and get it back.`

  return Object.freeze({
    ...baseHook({
      moment: 'premise-statement',
      outcome: 'premise',
      fallbackText,
      event: {
        type: 'premise',
        outcome: 'premise',
        sceneId: state.sceneId,
        actionId: 'intro:premise',
      },
      before: state,
      after: state,
    }),
    introKind: 'premise-statement',
    backgroundName: '',
    midpointChoice: '',
    endingReason: '',
  })
}

export function createOpeningChoiceNarrationHook(state) {
  const fallbackText = sceneFallbackForState(state)
  if (!fallbackText) throw new Error('The opening scene has no choice presentation.')

  return Object.freeze({
    ...baseHook({
      moment: 'scene-intro',
      outcome: 'intro',
      fallbackText,
      event: {
        type: 'intro',
        outcome: 'intro',
        sceneId: state.sceneId,
        actionId: 'intro:choose-background',
      },
      before: state,
      after: state,
    }),
    introKind: 'choice-presentation',
    backgroundName: '',
    midpointChoice: '',
    endingReason: '',
  })
}

export function createSceneTransitionNarrationHook(before, after) {
  if (!before || !after || before.sceneId === after.sceneId || after.status === 'completed') {
    return null
  }
  const fallbackText = sceneFallbackForState(after)
  if (!fallbackText) return null

  return Object.freeze({
    ...baseHook({
      moment: 'scene-intro',
      outcome: 'intro',
      fallbackText,
      event: {
        type: 'intro',
        outcome: 'intro',
        sceneId: after.sceneId,
        actionId: `intro:${after.sceneId}`,
      },
      before,
      after,
    }),
    introKind: 'scene-transition',
    backgroundName: cleanText(after?.background?.name, 100),
    midpointChoice: cleanText(after?.flags?.midpointChoice, 80),
    endingReason: '',
  })
}

function hookForEvent(event, fallbackText, before, after) {
  if (!fallbackText) return null

  if (event.type === 'check' && event.naturalOne) {
    return baseHook({
      moment: 'natural-one-complication',
      outcome: 'complication',
      fallbackText,
      event,
      before,
      after,
    })
  }

  if (event.type === 'check' && String(event.actionId).startsWith('midpoint:')) {
    return Object.freeze({
      ...baseHook({
        moment: 'midpoint-outcome',
        outcome: 'midpoint',
        fallbackText,
        event,
        before,
        after,
      }),
      midpointChoice: cleanText(after?.flags?.midpointChoice, 80),
    })
  }

  if (event.type === 'check' && event.outcome === 'success') {
    return baseHook({
      moment: 'action-success',
      outcome: 'success',
      fallbackText,
      event,
      before,
      after,
    })
  }

  if (event.type === 'check' && event.outcome === 'failure') {
    return baseHook({
      moment: 'ordinary-failure',
      outcome: 'failure',
      fallbackText,
      event,
      before,
      after,
    })
  }

  if (event.type === 'choice' && event.sceneId === 'choose-background') {
    return Object.freeze({
      ...baseHook({
        moment: 'scene-intro',
        outcome: 'intro',
        fallbackText,
        event,
        before,
        after,
      }),
      introKind: 'background-selection',
      backgroundName: cleanText(after?.background?.name, 100),
    })
  }

  if (event.type === 'choice' && event.sceneId === 'midpoint') {
    return Object.freeze({
      ...baseHook({
        moment: 'midpoint-outcome',
        outcome: 'midpoint',
        fallbackText,
        event,
        before,
        after,
      }),
      midpointChoice: cleanText(after?.flags?.midpointChoice, 80),
    })
  }

  if (event.type === 'taunt' && event.sceneId === 'goblin-king' && event.outcome === 'taunt') {
    return baseHook({
      moment: 'goblin-king-taunt',
      outcome: 'taunt',
      fallbackText,
      event,
      before,
      after,
    })
  }

  if (event.type === 'ending' && ['recovery', 'bargain', 'escape'].includes(event.ending)) {
    return Object.freeze({
      ...baseHook({
        moment: 'run-ending',
        outcome: event.ending,
        fallbackText,
        event,
        actionId: event.actionId || `ending:${event.ending}`,
        before,
        after,
      }),
      endingReason: cleanText(event.reason, 120),
    })
  }

  return null
}

export function getNarrationHooksForTransition(before, after) {
  if (!before || !after) throw new Error('Both transition states are required.')

  const newEvents = after.history.slice(before.history.length)
  const newNarration = after.narration.slice(before.narration.length)
  const hooks = []
  let narrationIndex = 0

  for (const event of newEvents) {
    const fallbackText = NARRATED_EVENT_TYPES.has(event.type)
      ? newNarration[narrationIndex++]
      : ''
    const hook = hookForEvent(event, fallbackText, before, after)
    if (hook) hooks.push(hook)
  }

  return hooks
}
