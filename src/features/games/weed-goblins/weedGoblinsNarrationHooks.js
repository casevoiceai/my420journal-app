const NARRATED_EVENT_TYPES = new Set(['mana', 'choice', 'check', 'ending'])

function cleanText(value, maxLength = 300) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
    : ''
}

function baseHook({ moment, outcome, fallbackText, event = {}, before, after }) {
  return Object.freeze({
    moment,
    outcome,
    fallbackText: cleanText(fallbackText, 300),
    authoritativeText: cleanText(fallbackText, 300),
    sceneId: cleanText(event.sceneId, 80),
    actionId: cleanText(event.actionId, 80),
    stat: cleanText(event.stat, 20),
    dc: Number(event.dc) || 0,
    rolls: Array.isArray(event.rolls) ? event.rolls.slice(0, 2) : [],
    selectedRoll: Number.isFinite(Number(event.roll)) ? Number(event.roll) : null,
    troubleBefore: Number(before?.trouble) || 0,
    troubleAfter: Number(after?.trouble) || 0,
    fictionalStolenItem: cleanText(after?.stolenItem ?? before?.stolenItem, 160),
    fictionalGoblinName: cleanText(after?.goblinName ?? before?.goblinName, 100),
    narrationTier: cleanText(after?.narrationTier ?? before?.narrationTier, 50) || 'normal',
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

  if (event.type === 'ending' && ['recovery', 'bargain', 'escape'].includes(event.ending)) {
    return Object.freeze({
      ...baseHook({
        moment: 'run-ending',
        outcome: event.ending,
        fallbackText,
        event: {
          ...event,
          actionId: event.actionId || `ending:${event.ending}`,
        },
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
