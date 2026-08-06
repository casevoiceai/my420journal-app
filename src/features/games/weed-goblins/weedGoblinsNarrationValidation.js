const BANNED_WORDS = Object.freeze(['awesome', 'amazing', 'weed'])
const SUPPORTED_MOMENT_OUTCOMES = Object.freeze({
  'natural-one-complication': 'complication',
  'ordinary-failure': 'failure',
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

export function validateGeneratedNarration(
  value,
  {
    moment = 'natural-one-complication',
    outcome = SUPPORTED_MOMENT_OUTCOMES[moment],
    blockedRealNames = [],
    allowedFictionalNames = [],
  } = {},
) {
  const text = typeof value === 'string' ? value.trim() : ''
  const reasons = []

  if (SUPPORTED_MOMENT_OUTCOMES[moment] !== outcome) {
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

  if (/\b(you succeed(?:ed)?|your attempt succeeds?|the attempt succeeds?|success|successful(?:ly)?|you win|you won|victory|recover(?:s|ed)? the|defeat(?:s|ed)? the Goblin King|the run (?:ends?|ended|is over)|this ends the run|you escape(?:d)? the Highlands|you (?:make|made) a bargain)\b/i.test(text)) {
    reasons.push('implies a different engine outcome')
  }

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
