import {
  correctiveNoteForValidation,
  validateGeneratedComplication,
} from './weedGoblinsNarrationValidation.js'

export const WEED_GOBLINS_NARRATION_ENDPOINT = '/api/weed-goblins-narration'

function cleanText(value, maxLength = 160) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
    : ''
}

function naturalOneRequest({ event, state, correctiveNote = '' }) {
  return {
    moment: 'natural-one-complication',
    outcome: 'complication',
    sceneId: cleanText(event?.sceneId, 80),
    actionId: cleanText(event?.actionId, 80),
    stat: cleanText(event?.stat, 20),
    dc: Number(event?.dc) || 0,
    rolls: Array.isArray(event?.rolls) ? event.rolls.slice(0, 2) : [event?.roll || 1],
    selectedRoll: 1,
    troubleBefore: Math.max(0, Number(state?.trouble ?? 2) - 2),
    troubleAfter: Number(state?.trouble ?? 2),
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
    throw new Error('At least one static natural-1 fallback is required.')
  }
  const source = cleanText(event?.actionId, 80)
  let hash = 0
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0
  }
  return staticFallbacks[Math.abs(hash) % staticFallbacks.length]
}

export async function generateNaturalOneComplication({
  event,
  state,
  staticFallbacks,
  blockedRealNames = [],
  endpoint = WEED_GOBLINS_NARRATION_ENDPOINT,
  fetchImpl = fetch,
} = {}) {
  if (!event?.naturalOne || event?.outcome !== 'complication') {
    throw new Error('AI complication generation requires a natural-1 complication event.')
  }

  const fallbackText = event.complicationText
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
        body: JSON.stringify(naturalOneRequest({ event, state, correctiveNote })),
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

    const validation = validateGeneratedComplication(payload?.text, {
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
