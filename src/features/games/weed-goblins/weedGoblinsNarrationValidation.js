const BANNED_WORDS = Object.freeze(['awesome', 'amazing', 'weed'])
const RUN_ENDING_OUTCOMES = Object.freeze(['recovery', 'bargain', 'escape'])

export const SUPPORTED_MOMENT_OUTCOMES = Object.freeze({
  'natural-one-complication': Object.freeze(['complication']),
  'ordinary-failure': Object.freeze(['failure']),
  'action-success': Object.freeze(['success']),
  'scene-intro': Object.freeze(['intro']),
  'midpoint-outcome': Object.freeze(['midpoint']),
  'run-ending': RUN_ENDING_OUTCOMES,
})

export const DEFAULT_REAL_WORLD_NAMES = Object.freeze([
  'AYR',
  'Beyond Hello',
  'Columbia Care',
  'Cresco',
  'Curaleaf',
  'Ethos',
  'Good Green',
  'Grassroots',
  'INSA',
  'Justice Grown',
  'Moxie',
  'Organic Remedies',
  'Prime Wellness',
  'Restore',
  'Rythm',
  'Select',
  'Strane',
  'Sunnyside',
  'Trulieve',
  'Verano',
])

const SUCCESS_SIGNAL = /\b(succeed(?:s|ed|ing)?|success|successful(?:ly)?|you win|you won|victory|prevail(?:s|ed|ing)?|defeat(?:s|ed)? the Goblin King)\b/i
const RUN_END_SIGNAL = /\b(the run (?:ends?|ended|is over|concludes?|concluded)|this ends the run|the adventure (?:ends?|ended|is over|concludes?|concluded))\b/i
const RECOVERY_ACTION_SIGNAL = /\b(recover(?:s|ed|ing)?|reclaim(?:s|ed|ing)?|regain(?:s|ed|ing)?|retrieve(?:s|d|ving)?)\b/i
const RECOVERY_OBJECT_SIGNAL = /\b(stolen (?:item|goods?)|field reliquary|reliquary|satchel|moon jar|research case)\b/i
const WIN_BACK_SIGNAL = /\b(win(?:s|ning)? back|won back)\b/i
const ENDING_SIGNALS = Object.freeze({
  bargain: /\b(bargain(?:s|ed|ing)?|deal|agreement|terms|negotiate(?:s|d|ing)?|testimony)\b/i,
  escape: /\b(escape(?:s|d|ing)?|flee(?:s|ing)?|fled|retreat(?:s|ed|ing)?|withdraw(?:s|n|ing)?|without recovering|leave(?:s|d)? without)\b/i,
})

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function uniqueText(values) {
  const seen = new Set()
  const result = []
  for (const value of values || []) {
    const text = typeof value === 'string' ? value.trim() : ''
    const key = text.toLocaleLowerCase('en-US')
    if (!text || seen.has(key)) continue
    seen.add(key)
    result.push(text)
  }
  return result
}

function maskAllowedFictionalNames(text, allowedFictionalNames) {
  let masked = text
  for (const allowed of uniqueText(allowedFictionalNames)) {
    masked = masked.replace(new RegExp(escapeRegExp(allowed), 'gi'), ' ')
  }
  return masked
}

function containsName(text, name) {
  if (name.length <= 3) {
    return new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i').test(text)
  }
  return text.toLocaleLowerCase('en-US').includes(name.toLocaleLowerCase('en-US'))
}

function isSupportedMomentOutcome(moment, outcome) {
  return SUPPORTED_MOMENT_OUTCOMES[moment]?.includes(outcome) === true
}

function detectOutcomeSignals(text, expectedStolenItem = '') {
  const escape = ENDING_SIGNALS.escape.test(text)
  const negatedRecovery = /\b(without recovering|without recovery|leave(?:s|d)? without)\b/i.test(text)
  const mentionsExpectedItem = expectedStolenItem
    ? text.toLocaleLowerCase('en-US').includes(expectedStolenItem.toLocaleLowerCase('en-US'))
    : false
  const recovery = !negatedRecovery && (
    WIN_BACK_SIGNAL.test(text)
    || (RECOVERY_ACTION_SIGNAL.test(text)
      && (mentionsExpectedItem || RECOVERY_OBJECT_SIGNAL.test(text)))
  )
  return {
    success: SUCCESS_SIGNAL.test(text),
    runEnd: RUN_END_SIGNAL.test(text),
    recovery,
    bargain: ENDING_SIGNALS.bargain.test(text),
    escape,
  }
}

function addOutcomeFidelityReasons(reasons, text, moment, outcome, expectedStolenItem) {
  if (!isSupportedMomentOutcome(moment, outcome)) return

  const signals = detectOutcomeSignals(text, expectedStolenItem)
  const anyEnding = signals.recovery || signals.bargain || signals.escape

  if (moment === 'action-success') {
    if (signals.runEnd || anyEnding) {
      reasons.push('implies a different engine outcome')
    }
    return
  }

  if (moment === 'run-ending') {
    let expectedEndingPresent = false
    let wrongEndingPresent = false

    if (outcome === 'recovery') {
      expectedEndingPresent = signals.recovery
      wrongEndingPresent = signals.bargain || signals.escape
    } else if (outcome === 'bargain') {
      expectedEndingPresent = signals.bargain
      wrongEndingPresent = signals.escape || (signals.recovery && !signals.bargain)
    } else if (outcome === 'escape') {
      expectedEndingPresent = signals.escape
      wrongEndingPresent = signals.recovery || signals.bargain || signals.success
    }

    if (wrongEndingPresent) {
      reasons.push('implies a different engine outcome')
    }
    if (!expectedEndingPresent) {
      reasons.push('does not describe the requested ending')
    }
    return
  }

  if (signals.success || signals.runEnd || anyEnding) {
    reasons.push('implies a different engine outcome')
  }
}

export function validateGeneratedNarration(
  value,
  {
    moment = 'natural-one-complication',
    outcome = SUPPORTED_MOMENT_OUTCOMES[moment]?.[0],
    blockedRealNames = [],
    allowedFictionalNames = [],
    expectedStolenItem = allowedFictionalNames[0] || '',
  } = {},
) {
  const text = typeof value === 'string' ? value.trim() : ''
  const reasons = []

  if (!isSupportedMomentOutcome(moment, outcome)) {
    reasons.push('uses an unsupported narration moment/outcome pairing')
  }
  if (!text) reasons.push('empty response')
  if (text.length > 260) reasons.push('response is too long')
  if (text.includes('!')) reasons.push('contains an exclamation point')

  for (const word of BANNED_WORDS) {
    if (new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i').test(text)) {
      reasons.push(`contains banned word: ${word}`)
    }
  }

  if (/\bSTONER\b/i.test(text)) {
    reasons.push('writes STONER without periods')
  }

  if (!/\b(I|I'm|I’m|I’ve|I've|I’ll|I'll|me|my)\b/i.test(text)) {
    reasons.push('is not written in first person')
  }

  if (/\b(treats?|treated|treating|cures?|cured|curing|diagnos(?:e|es|ed|is)|therapeutic|medical benefit|dosage|symptoms?)\b/i.test(text)
    || /\b(relieves?|relieved|relieving)\s+(pain|anxiety|symptoms?)\b/i.test(text)) {
    reasons.push('contains a health or medical claim')
  }

  if (/\b(dies?|dead|killed|fatal|blood|bleeding|broken bone|serious injury|permanent injury)\b/i.test(text)) {
    reasons.push('contains fatal or serious-harm language')
  }

  addOutcomeFidelityReasons(reasons, text, moment, outcome, expectedStolenItem)

  const nameScanText = maskAllowedFictionalNames(text, allowedFictionalNames)
  const names = uniqueText([...DEFAULT_REAL_WORLD_NAMES, ...blockedRealNames])
  for (const name of names) {
    if (containsName(nameScanText, name)) {
      reasons.push(`contains real-world name: ${name}`)
    }
  }

  return {
    valid: reasons.length === 0,
    text,
    reasons,
  }
}

export function validateGeneratedComplication(value, options = {}) {
  return validateGeneratedNarration(value, {
    ...options,
    moment: 'natural-one-complication',
    outcome: 'complication',
  })
}

export function validateGeneratedFailure(value, options = {}) {
  return validateGeneratedNarration(value, {
    ...options,
    moment: 'ordinary-failure',
    outcome: 'failure',
  })
}

export function correctiveNoteForValidation(reasons = []) {
  const safeReasons = uniqueText(reasons).slice(0, 8)
  return safeReasons.length > 0
    ? `The prior draft was rejected because it ${safeReasons.join('; ')}. Produce a new line that corrects every issue.`
    : 'The prior draft was rejected. Produce a new line that follows every hard constraint.'
}
