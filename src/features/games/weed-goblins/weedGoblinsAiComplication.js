import {
  correctiveNoteForValidation,
  validateGeneratedNarration,
} from './weedGoblinsNarrationValidation.js'

export const WEED_GOBLINS_NARRATION_ENDPOINT = '/api/weed-goblins-narration'

const MOMENT_CONFIG = Object.freeze({
  'natural-one-complication': Object.freeze({ outcomes: Object.freeze(['complication']), troubleCost: 2 }),
  'ordinary-failure': Object.freeze({ outcomes: Object.freeze(['failure']), troubleCost: 1 }),
  'action-success': Object.freeze({ outcomes: Object.freeze(['success']), troubleCost: 0 }),
  'scene-intro': Object.freeze({ outcomes: Object.freeze(['intro']), troubleCost: 0 }),
  'midpoint-outcome': Object.freeze({ outcomes: Object.freeze(['midpoint']), troubleCost: 0 }),
  'goblin-king-taunt': Object.freeze({ outcomes: Object.freeze(['taunt']), troubleCost: 0 }),
  'run-ending': Object.freeze({ outcomes: Object.freeze(['recovery', 'bargain', 'escape']), troubleCost: 0 }),
})

function cleanText(value, maxLength = 160) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
    : ''
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value))
}

function deterministicFallback(staticFallbacks, event) {
  if (!Array.isArray(staticFallbacks) || staticFallbacks.length === 0) {
    throw new Error('At least one static narration fallback is required.')
  }
  const source = cleanText(event?.actionId, 80)
  let hash = 0
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0
  }
  return staticFallbacks[Math.abs(hash) % staticFallbacks.length]
}

function resolveOutcome(moment, event, hook) {
  if (hook?.outcome) return cleanText(hook.outcome, 40)
  if (moment === 'run-ending') return cleanText(event?.ending ?? event?.outcome, 40)
  return MOMENT_CONFIG[moment]?.outcomes[0] ?? ''
}

function fallbackForNarration(hook, event, staticFallbacks) {
  return cleanText(
    hook?.fallbackText
      || hook?.authoritativeText
      || event?.complicationText
      || event?.failureText
      || event?.successText
      || event?.introText
      || event?.midpointText
      || event?.tauntText
      || event?.endingText
      || event?.narrationText,
    300,
  ) || deterministicFallback(staticFallbacks, event)
}

function assertSupportedNarration(moment, outcome, event, hook) {
  const config = MOMENT_CONFIG[moment]
  if (!config || !config.outcomes.includes(outcome)) {
    throw new Error(`Unsupported AI narration moment/outcome pairing: ${moment}/${outcome}`)
  }

  if (moment === 'natural-one-complication') {
    if (!event?.naturalOne || event?.outcome !== 'complication') {
      throw new Error('AI complication generation requires a natural-1 complication event.')
    }
    return
  }

  if (moment === 'ordinary-failure') {
    if (event?.naturalOne || event?.outcome !== 'failure') {
      throw new Error('AI failure generation requires an ordinary failure event.')
    }
    return
  }

  if (hook?.moment === moment && hook?.outcome === outcome && hook?.fallbackText) return

  if (moment === 'action-success') {
    if (event?.naturalOne || event?.outcome !== 'success' || event?.success !== true) {
      throw new Error('AI success generation requires a successful non-natural-1 action event.')
    }
    return
  }

  if (moment === 'scene-intro') {
    if (event?.outcome !== 'intro') {
      throw new Error('AI scene-intro generation requires an intro event.')
    }
    return
  }

  if (moment === 'midpoint-outcome') {
    if (event?.outcome !== 'midpoint') {
      throw new Error('AI midpoint generation requires a midpoint event.')
    }
    return
  }

  if (moment === 'goblin-king-taunt') {
    if (event?.type !== 'taunt' || event?.outcome !== 'taunt') {
      throw new Error('AI Goblin King taunt generation requires the pre-action taunt event.')
    }
    return
  }

  if (moment === 'run-ending') {
    if (event?.type !== 'ending' || event?.ending !== outcome) {
      throw new Error('AI ending generation requires a matching run-ending event.')
    }
  }
}

function narrationRequest({ moment, outcome, event, state, hook, fallbackText, correctiveNote = '' }) {
  const config = MOMENT_CONFIG[moment]
  const rolls = Array.isArray(hook?.rolls)
    ? hook.rolls.slice(0, 2)
    : Array.isArray(event?.rolls)
      ? event.rolls.slice(0, 2)
      : []
  const selectedRoll = isFiniteNumber(hook?.selectedRoll)
    ? Number(hook.selectedRoll)
    : isFiniteNumber(event?.roll)
      ? Number(event.roll)
      : rolls.length > 0
        ? Math.max(...rolls)
        : null
  const troubleAfter = isFiniteNumber(hook?.troubleAfter)
    ? Number(hook.troubleAfter)
    : Number(state?.trouble ?? config.troubleCost)
  const troubleBefore = isFiniteNumber(hook?.troubleBefore)
    ? Number(hook.troubleBefore)
    : Math.max(0, troubleAfter - config.troubleCost)

  return {
    moment,
    outcome,
    sceneId: cleanText(hook?.sceneId ?? event?.sceneId, 80),
    actionId: cleanText(hook?.actionId ?? event?.actionId, 80),
    stat: cleanText(hook?.stat ?? event?.stat, 20),
    dc: Number(hook?.dc ?? event?.dc) || 0,
    rolls,
    selectedRoll,
    troubleBefore,
    troubleAfter,
    fictionalStolenItem: cleanText(hook?.fictionalStolenItem ?? state?.stolenItem, 160),
    fictionalGoblinName: cleanText(hook?.fictionalGoblinName ?? state?.goblinName, 100),
    authoritativeText: cleanText(hook?.authoritativeText ?? fallbackText, 300),
    introKind: cleanText(hook?.introKind, 60),
    backgroundName: cleanText(hook?.backgroundName, 100),
    midpointChoice: cleanText(hook?.midpointChoice, 80),
    endingReason: cleanText(hook?.endingReason, 120),
    narrationTier: cleanText(hook?.narrationTier ?? state?.narrationTier, 50) || 'normal',
    allowCallback: hook?.allowCallback === true,
    allowFourthWall: hook?.allowFourthWall === true,
    correctiveNote: cleanText(correctiveNote, 300),
  }
}

async function generateValidatedNarration({
  moment,
  event,
  state,
  hook,
  staticFallbacks,
  blockedRealNames = [],
  endpoint = WEED_GOBLINS_NARRATION_ENDPOINT,
  fetchImpl = fetch,
} = {}) {
  const outcome = resolveOutcome(moment, event, hook)
  assertSupportedNarration(moment, outcome, event, hook)

  const fallbackText = fallbackForNarration(hook, event, staticFallbacks)
  const allowedFictionalNames = [
    hook?.fictionalStolenItem ?? state?.stolenItem,
    hook?.fictionalGoblinName ?? state?.goblinName,
    hook?.fictionalLocationName ?? state?.fictionalLocationName,
  ].filter(Boolean)
  const failures = []
  let correctiveNote = ''

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    let response
    try {
      response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(narrationRequest({
          moment,
          outcome,
          event,
          state,
          hook,
          fallbackText,
          correctiveNote,
        })),
      })
    } catch {
      failures.push({ attempt, reasons: ['same-origin narration request failed'] })
      correctiveNote = correctiveNoteForValidation(failures.at(-1).reasons)
      continue
    }

    if (!response.ok) {
      failures.push({ attempt, reasons: [`same-origin narration returned HTTP ${response.status}`] })
      correctiveNote = correctiveNoteForValidation(failures.at(-1).reasons)
      continue
    }

    let payload
    try {
      payload = await response.json()
    } catch {
      failures.push({ attempt, reasons: ['same-origin narration returned invalid JSON'] })
      correctiveNote = correctiveNoteForValidation(failures.at(-1).reasons)
      continue
    }

    const validation = validateGeneratedNarration(payload?.text, {
      moment,
      outcome,
      blockedRealNames,
      allowedFictionalNames,
      expectedStolenItem: hook?.fictionalStolenItem ?? state?.stolenItem ?? '',
    })

    if (validation.valid) {
      return {
        text: validation.text,
        source: 'ai',
        model: cleanText(payload?.model, 80) || null,
        attempts: attempt,
        validationFailures: failures,
      }
    }

    failures.push({ attempt, reasons: validation.reasons })
    correctiveNote = correctiveNoteForValidation(validation.reasons)
  }

  return {
    text: fallbackText,
    source: 'static-fallback',
    model: null,
    attempts: 2,
    validationFailures: failures,
  }
}

export function generateNaturalOneComplication(options = {}) {
  return generateValidatedNarration({ ...options, moment: 'natural-one-complication' })
}

export function generateOrdinaryFailureNarration(options = {}) {
  return generateValidatedNarration({ ...options, moment: 'ordinary-failure' })
}

export function generateActionSuccessNarration(options = {}) {
  return generateValidatedNarration({ ...options, moment: 'action-success' })
}

export function generateSceneIntroNarration(options = {}) {
  return generateValidatedNarration({ ...options, moment: 'scene-intro' })
}

export function generateMidpointOutcomeNarration(options = {}) {
  return generateValidatedNarration({ ...options, moment: 'midpoint-outcome' })
}

export function generateGoblinKingTauntNarration(options = {}) {
  return generateValidatedNarration({ ...options, moment: 'goblin-king-taunt' })
}

export function generateRunEndingNarration(options = {}) {
  return generateValidatedNarration({ ...options, moment: 'run-ending' })
}

export function generateNarrationFromHook({ hook, ...options } = {}) {
  if (!hook?.moment) throw new Error('A narration hook is required.')
  return generateValidatedNarration({ ...options, hook, moment: hook.moment })
}
