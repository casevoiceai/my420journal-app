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
  if (state?.flags?.nibTreatment === 'safe') anchors.push('Nib')
  if (state?.flags?.hasHighlandCharm) anchors.push('highland charm')
  if (state?.flags?.blackRootSealKnown) anchors.push('black-root seal')
  if (state?.flags?.tributeArrangement === 'exposed') anchors.push('picture tribute ledger')
  if (state?.flags?.tributeArrangement === 'protected') anchors.push('protected tribute arrangement')
  return Object.freeze([...new Set(anchors)].slice(0, 6))
}


function storySoFarForState(state) {
  const parts = [openingObjectiveForState(state)]
  if (state?.background?.name) parts.push(`The player chose ${state.background.name}.`)
  const routeName = routeNameForState(state)
  if (routeName) parts.push(`The player took ${routeName}.`)
  if (state?.flags?.midpointChoice) parts.push(`At Cloudberry Shelf, the player chose ${cleanText(state.flags.midpointChoice, 80)}.`)
  if (state?.flags?.nibTreatment) parts.push(`Nib was treated as ${cleanText(state.flags.nibTreatment, 40)}.`)
  if (state?.flags?.tributeArrangement) parts.push(`The tribute arrangement is ${cleanText(state.flags.tributeArrangement, 40)}.`)
  if (state?.flags?.hasHighlandCharm) parts.push('The player carries the highland charm.')
  if (state?.flags?.blackRootSealKnown) parts.push('Old Tatter or the ledger identified the black-root seal.')
  const latestEvent = state?.history?.at(-1)
  if (latestEvent?.outcome) parts.push(`The latest authoritative outcome was ${cleanText(latestEvent.outcome, 40)}.`)
  else if (latestEvent?.ending) parts.push(`The authoritative ending is ${cleanText(latestEvent.ending, 40)}.`)
  parts.push(`Current Trouble is ${Number(state?.trouble) || 0}.`)
  const resolvedChecks = (state?.history || []).filter((event) => event?.type === 'check').slice(-4)
  for (const event of resolvedChecks) {
    const result = event.naturalOne ? 'natural-1 complication' : cleanText(event.outcome, 40)
    parts.push(`${cleanText(event.actionId, 80) || 'A prior action'} resolved as ${result}.`)
  }
  if (state?.flags?.goblinAlly) parts.push('Nib is now a goblin ally.')
  return cleanText(parts.join(' '), 600)
}


function tensionLevelForScene(sceneId) {
  return ({
    'choose-background': 'opening',
    'choose-route': 'commitment',
    'goblin-encounter': 'rising',
    midpoint: 'high',
    'highland-camp': 'high',
    'stash-latch': 'high',
    'goblin-king': 'climax',
    ending: 'resolution',
  })[sceneId] || 'rising'
}


function choiceContextForScene(state) {
  if (state?.sceneId === 'choose-background') {
    return 'Highland Tracker favors Strength, Trail Warden favors Defense, and Fen Diviner carries the deepest Mana pool.'
  }
  if (state?.sceneId === 'choose-route') {
    const quiet = cleanText(state?.adventure?.routes?.quiet?.name, 100) || 'The Quiet Crossing'
    const loud = cleanText(state?.adventure?.routes?.loud?.name, 100) || 'The Direct Crossing'
    return `${quiet} crosses Rattlebridge using care and Defense; ${loud} crosses it using Strength before the alarm lines can react.`
  }
  if (state?.sceneId === 'goblin-encounter') {
    return `${cleanText(state?.goblinName, 100) || 'A goblin'} blocks the clear passage; the player may confront, endure, distract, negotiate with, or otherwise act on that obstacle.`
  }
  if (state?.sceneId === 'midpoint') {
    return 'At Cloudberry Shelf, Nib is caught up with a snapped tripwire. The player can keep him safe, use him as bait, take a highland charm, read old trail-runes, or move on.'
  }
  if (state?.sceneId === 'highland-camp') {
    return 'At Highland Camp, Grubbin guards a picture tribute ledger and resents the outgoing tribute. Old Tatter can identify the black-root seal. The player can expose, protect, question, investigate, or leave the arrangement alone.'
  }
  if (state?.sceneId === 'stash-latch') {
    return 'A carved-face latch seals the King’s Stash Hall. It can be read carefully, forced, read with Mana, or opened with the highland charm if the player has it.'
  }
  if (state?.sceneId === 'goblin-king') {
    return `The Goblin King controls ${cleanText(state?.stolenItem, 160) || 'the stolen item'} in the Stash Hall; the player can humiliate him with Strength, spare him through Defense, use Mana, bargain if Nib is an ally, or attempt another concrete action.`
  }
  return ''
}


function scenePurposeForScene(sceneId) {
  return ({
    'choose-background': 'Make the three character approaches legible before the player chooses one.',
    'choose-route': 'Turn preparation into a committed Rattlebridge crossing with different visible risks.',
    'goblin-encounter': 'Put a named goblin obstacle between the player and Cloudberry Shelf.',
    midpoint: 'Make the Nib decision and local leverage matter before Highland Camp.',
    'highland-camp': 'Reveal the tribute arrangement through Grubbin, Old Tatter, and the picture tribute ledger.',
    'stash-latch': 'Make the carved-face latch the final obstacle before the King.',
    'goblin-king': 'Bring the stolen item, the antagonist, and accumulated branch state together for the climax.',
    ending: 'Resolve the exact objective established at the opening.',
  })[sceneId] || 'Continue the same causal story from the authoritative state.'
}


function sceneFallbackForState(state) {
  if (state?.sceneId === 'choose-background') return 'Three ways of meeting trouble wait at Windcut Trail: tracking it, holding against it, or reading the strange signs around it.'
  if (state?.sceneId === 'choose-route') return 'Rattlebridge narrows ahead, bottle-cap alarm lines trembling across both the quiet path and the direct one.'
  if (state?.sceneId === 'goblin-encounter') {
    const goblin = cleanText(state?.goblinName, 100) || 'a goblin sentry'
    return `${goblin} plants one boot across the only clear passage beyond Rattlebridge.`
  }
  if (state?.sceneId === 'midpoint') return 'At Cloudberry Shelf, Nib is tangled beside a snapped tripwire while a highland charm and old trail-runes sit within reach.'
  if (state?.sceneId === 'highland-camp') return 'At Highland Camp, Grubbin keeps one hand on a picture tribute ledger while Old Tatter studies the black-root seal stamped across its cover.'
  if (state?.sceneId === 'stash-latch') return 'Four carved goblin faces stare from the Stash Hall latch, each rotated to a different expression.'
  if (state?.sceneId === 'goblin-king') {
    const stolenItem = cleanText(state?.stolenItem, 160) || 'the stolen field reliquary'
    return `The Goblin King's hand settles on ${stolenItem} as the Stash Hall doors close behind you.`
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
