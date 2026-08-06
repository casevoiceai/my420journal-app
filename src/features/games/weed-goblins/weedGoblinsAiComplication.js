import {
  correctiveNoteForValidation,
  validateGeneratedNarration,
} from './weedGoblinsNarrationValidation.js'

export const WEED_GOBLINS_NARRATION_ENDPOINT = '/api/weed-goblins-narration'

const MOMENT_CONFIG = Object.freeze({
  'natural-one-complication': Object.freeze({
    outcome: 'complication',
    troubleCost: 2,
  }),
  'ordinary-failure': Object.freeze({
    outcome: 'failure',
    troubleCost: 1,
  }),
})

function cleanText(value, maxLength = 160) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
    : ''
}

function narrationRequest({ moment, event, state, correctiveNote = '' }) {
  const config = MOMENT_CONFIG[moment]
  const selectedRoll = Number(event?.roll)
    || Math.max(...(Array.isArray(event?.rolls) ? event.rolls : [1]))

  return {
    moment,
    outcome: config.outcome,
    sceneId: cleanText(event?.sceneId, 80),
    actionId: cleanText(event?.actionId, 80),
    stat: cleanText(event?.stat, 20),
    dc: Number(event?.dc) || 0,
    rolls: Array.isArray(event?.rolls) ? event.rolls.slice(0, 2) : [selectedRoll],
    selectedRoll,
    troubleBefore: Math.max(0, Number(state?.trouble ?? config.troubleCost) - config.troubleCost),
    troubleAfter: Number(state?.trouble ?? config.troubleCost),
    fictionalStolenItem: cleanText(state?.stolenItem, 160),
    fictionalGoblinName: cleanText(state?.goblinName, 100),
    narrationTier: cleanText(state?.narrationTier, 50) || 'normal',
    allowCallback: false,
    allowFourthWall: false,
    correctiveNote: cleanText(correctiveNote, 300),
  }
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

function assertSupportedEvent(moment, event) {
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

  throw new Error(`Unsupported AI narration moment: ${moment}`)
}

async function generateValidatedNarration({
  moment,
  event,
  state,
  staticFallbacks,
  blockedRealNames = [],
  endpoint = WEED_GOBLINS_NARRATION_ENDPOINT,
  fetchImpl = fetch,
} = {}) {
  assertSupportedEvent(moment, event)

  const config = MOMENT_CONFIG[moment]
  const fallbackText = event.complicationText
    || event.failureText
    || deterministicFallback(staticFallbacks, event)
  const allowedFictionalNames = [state?.stolenItem, state?.goblinName].filter(Boolean)
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
          event,
          state,
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
      outcome: config.outcome,
      blockedRealNames,
      allowedFictionalNames,
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
  return generateValidatedNarration({
    ...options,
    moment: 'natural-one-complication',
  })
}

export function generateOrdinaryFailureNarration(options = {}) {
  return generateValidatedNarration({
    ...options,
    moment: 'ordinary-failure',
  })
}
