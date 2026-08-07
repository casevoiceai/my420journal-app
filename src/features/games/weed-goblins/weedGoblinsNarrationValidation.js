const BANNED_WORDS = Object.freeze(['awesome', 'amazing', 'weed'])
const RUN_ENDING_OUTCOMES = Object.freeze(['recovery', 'bargain', 'escape'])

export const SUPPORTED_MOMENT_OUTCOMES = Object.freeze({
  'natural-one-complication': Object.freeze(['complication']),
  'ordinary-failure': Object.freeze(['failure']),
  'action-success': Object.freeze(['success']),
  'scene-intro': Object.freeze(['intro']),
  'midpoint-outcome': Object.freeze(['midpoint']),
  'goblin-king-taunt': Object.freeze(['taunt']),
  'player-action-attempt': Object.freeze(['attempt']),
  'player-action-response': Object.freeze(['response']),
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

const FIRST_PERSON_SIGNAL = /\b(I|I'm|I’m|I’ve|I've|I’ll|I'll|me|my)\b/i
const SUCCESS_SIGNAL = /\b(succeed(?:s|ed|ing)?|success|successful(?:ly)?|(?:I|you|we)\s+(?:already\s+)?(?:win|won)|victory|prevail(?:s|ed|ing)?|defeat(?:s|ed)? the Goblin King)\b/i
const FAILURE_SIGNAL = /\b(?:you fail(?:ed)?|your (?:attempt|check|action) fail(?:s|ed)?|failure|you (?:lose|lost)|you are defeated)\b/i
const RUN_END_SIGNAL = /\b(the run (?:ends?|ended|is over|concludes?|concluded)|this ends the run|the adventure (?:ends?|ended|is over|concludes?|concluded))\b/i
const RECOVERY_ACTION_SIGNAL = /\b(recover(?:s|ed|ing)?|reclaim(?:s|ed|ing)?|regain(?:s|ed|ing)?|retrieve(?:s|d|ving)?)\b/i
const RECOVERY_OBJECT_SIGNAL = /\b(stolen (?:item|goods?)|field reliquary|reliquary|satchel|moon jar|research case)\b/i
const WIN_BACK_SIGNAL = /\b(win(?:s|ning)? back|won back)\b/i
const EMPTY_HANDED_SIGNAL = /\b(?:empty[- ]handed|with empty hands?)\b/i
const DEPARTURE_SIGNAL = /\b(?:leave(?:s|d|ing)?|depart(?:s|ed|ing)?|return(?:s|ed|ing)?|slip(?:s|ped|ping)? back|head(?:s|ed|ing)? back|make(?:s|d|ing)? (?:my|your|their|the) way back|walk(?:s|ed|ing)? away|turn(?:s|ed|ing)? back)\b/i
const SURVIVAL_SIGNAL = /\b(?:call|consider|count|record) (?:that|this) (?:a )?survival\b|\bsurvival\b/i
const ESCAPE_OBJECT_SIGNAL = /\b(?:the )?(?:stolen )?(?:item|goods?|field reliquary|reliquary|satchel|moon jar|research case)\b/i
const RETAINED_STATE_SIGNAL = /\b(?:stay(?:s|ed|ing)?|remain(?:s|ed|ing)?|is still|still (?:sits?|rests?|lies?|waits?))\b/i
const OUT_OF_REACH_SIGNAL = /\b(?:(?:still|just|well|far)\s+)?(?:out of|beyond)(?:\s+(?:my|your|our|their|the player's))?\s+reach\b/i
const ANTAGONIST_POSSESSION_SIGNAL = /\b(?:locked|held|kept|secured)?\s*(?:in|within|under|with)\s+(?:(?:the )?Goblin King's|the antagonist's|his|her|their|the Goblin King|the antagonist)\s+(?:keeping|possession|grip|hands?|control|custody|vault|chest)\b|\b(?:the )?Goblin King (?:keeps?|holds?|retains?|has)\b/i
const LEAVING_WITHOUT_ITEM_SIGNAL = /\b(?:leave(?:s|d|ing)?|depart(?:s|ed|ing)?|return(?:s|ed|ing)?|slip(?:s|ped|ping)? back|head(?:s|ed|ing)? back|walk(?:s|ed|ing)? away)\b[^.!?]{0,100}\bwithout\b[^.!?]{0,80}\b(?:the )?(?:stolen )?(?:item|goods?|field reliquary|reliquary|satchel|moon jar|research case)\b/i
const ENDING_SIGNALS = Object.freeze({
  bargain: /\b(bargain(?:s|ed|ing)?|deal|agreement|terms|negotiate(?:s|d|ing)?|testimony)\b/i,
  escape: /\b(escape(?:s|d|ing)?|flee(?:s|ing)?|fled|retreat(?:s|ed|ing)?|withdraw(?:s|n|ing)?|without recovering|leave(?:s|d)? without)\b/i,
})
const GOBLIN_KING_SPEECH_VERB = '(?:say(?:s|ing)?|declare(?:s|d|ing)?|drawl(?:s|ed|ing)?|remark(?:s|ed|ing)?|announce(?:s|d|ing)?|observe(?:s|d|ing)?|boast(?:s|ed|ing)?|tell(?:s|ing)\\s+(?:me|you))'
const QUOTED_DIALOGUE_SIGNAL = /(?:"[^"]+"|“[^”]+”)/
const PRE_ROLL_RESULT_SIGNAL = /\b(?:roll(?:ed)?|d20|die|dice)\b[^.!?]{0,24}\b(?:[1-9]|1\d|20)\b/i
const HIDDEN_MAPPING_SIGNAL = /\b(?:strength|defense|mana)\s+(?:check|test|path|stat|bucket)\b|\bDC\s*\d+\b|\b(?:map|mapped|mapping|classify|classified|classification)\b[^.!?]{0,40}\b(?:strength|defense|mana)\b/i
const PLAYER_ACTION_CONTEXT_MOMENTS = new Set([
  'player-action-attempt',
  'player-action-response',
  'natural-one-complication',
  'ordinary-failure',
  'action-success',
  'midpoint-outcome',
  'run-ending',
])
const PLAYER_ACTION_SAFE_PROPER_TERMS = Object.freeze([
  'Goblin King',
  'Goblin Highlands',
  'Mana',
  'Strength',
  'Defense',
  'Field Reliquary',
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

function isSupportedMomentOutcome(moment, outcome) {
  return SUPPORTED_MOMENT_OUTCOMES[moment]?.includes(outcome) === true
}

function stripQuotedDialogue(text) {
  return String(text)
    .replace(/"[^"]*"/g, ' ')
    .replace(/“[^”]*”/g, ' ')
}

function narratorFrameForFirstPerson(text, moment) {
  if (moment !== 'goblin-king-taunt') return text

  const withoutQuotes = stripQuotedDialogue(text)
  const attributedColon = new RegExp(
    `^(.*?\\b(?:Goblin King|the King|he)\\b[^:]{0,80}\\b${GOBLIN_KING_SPEECH_VERB}\\b)\\s*:\\s*.*$`,
    'i',
  ).exec(withoutQuotes)

  return attributedColon?.[1] ?? withoutQuotes
}

function hasGoblinKingDialogue(text) {
  const hasQuote = QUOTED_DIALOGUE_SIGNAL.test(text)
  const namesKing = /\bGoblin King\b/i.test(text)
  const attributedSpeech = new RegExp(
    `(?:\\bGoblin King\\b[^.!?]{0,100}\\b${GOBLIN_KING_SPEECH_VERB}\\b|\\b${GOBLIN_KING_SPEECH_VERB}\\b[^.!?]{0,100}\\bGoblin King\\b|\\b(?:he|the King)\\b[^.!?]{0,60}\\b${GOBLIN_KING_SPEECH_VERB}\\b)`,
    'i',
  ).test(text)
  return (hasQuote && (namesKing || attributedSpeech)) || attributedSpeech
}

function likelyPlayerActionProperNames(playerAction, allowedFictionalNames) {
  if (!playerAction) return []
  const masked = maskAllowedFictionalNames(
    playerAction,
    [...allowedFictionalNames, ...PLAYER_ACTION_SAFE_PROPER_TERMS],
  )
  const matches = masked.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){0,2}\b/g) || []
  return uniqueText(matches).filter((name) => !/^(The|This|That|Your|My|You|Please)$/i.test(name))
}

function normalizedActionText(value) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US')
    : ''
}

function detectsNaturalEscape(text, expectedStolenItem = '') {
  const mentionsExpectedItem = expectedStolenItem
    ? text.toLocaleLowerCase('en-US').includes(expectedStolenItem.toLocaleLowerCase('en-US'))
    : false
  const mentionsItem = mentionsExpectedItem || ESCAPE_OBJECT_SIGNAL.test(text)
  const departure = DEPARTURE_SIGNAL.test(text)
  const emptyHanded = EMPTY_HANDED_SIGNAL.test(text)
  const survival = SURVIVAL_SIGNAL.test(text)
  const retainedByAntagonist = mentionsItem
    && RETAINED_STATE_SIGNAL.test(text)
    && ANTAGONIST_POSSESSION_SIGNAL.test(text)
  const itemOutOfReach = mentionsItem && OUT_OF_REACH_SIGNAL.test(text)

  return LEAVING_WITHOUT_ITEM_SIGNAL.test(text)
    || (emptyHanded && (departure || survival))
    || (retainedByAntagonist && (departure || emptyHanded || survival))
    || (itemOutOfReach && (departure || emptyHanded || survival))
}

function detectOutcomeSignals(text, expectedStolenItem = '') {
  const naturalEscape = detectsNaturalEscape(text, expectedStolenItem)
  const escape = ENDING_SIGNALS.escape.test(text) || naturalEscape
  const negatedRecovery = /\b(without recovering|without recovery|leave(?:s|d)? without)\b/i.test(text)
    || naturalEscape
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
    failure: FAILURE_SIGNAL.test(text),
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

  if ([
    'scene-intro',
    'goblin-king-taunt',
    'player-action-attempt',
    'player-action-response',
  ].includes(moment)) {
    if (signals.success || signals.failure || signals.runEnd || anyEnding) {
      reasons.push('implies a different engine outcome')
    }
    return
  }

  if (moment === 'action-success') {
    if (signals.failure || signals.runEnd || anyEnding) {
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
    playerAction = '',
    narrationPlayerAction = '',
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

  if (['player-action-attempt', 'player-action-response'].includes(moment) && !String(playerAction).trim()) {
    reasons.push('is missing player action context')
  }
  if (moment === 'player-action-attempt' && PRE_ROLL_RESULT_SIGNAL.test(text)) {
    reasons.push('reveals a roll result before resolution')
  }
  if (PLAYER_ACTION_CONTEXT_MOMENTS.has(moment) && HIDDEN_MAPPING_SIGNAL.test(text)) {
    reasons.push('reveals hidden mechanical mapping')
  }

  const requiredAction = normalizedActionText(narrationPlayerAction)
  if (requiredAction && PLAYER_ACTION_CONTEXT_MOMENTS.has(moment)) {
    const normalizedText = normalizedActionText(text)
    if (!normalizedText.includes(requiredAction)) {
      reasons.push('does not preserve the player action wording')
    }
  }

  for (const word of BANNED_WORDS) {
    if (new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i').test(text)) {
      reasons.push(`contains banned word: ${word}`)
    }
  }

  if (/\bSTONER\b/i.test(text)) {
    reasons.push('writes STONER without periods')
  }

  const narratorFrame = narratorFrameForFirstPerson(text, moment)
  if (!FIRST_PERSON_SIGNAL.test(narratorFrame)) {
    reasons.push('is not written in first person')
  }

  if (moment === 'goblin-king-taunt' && !hasGoblinKingDialogue(text)) {
    reasons.push('does not include attributed Goblin King dialogue')
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
  const playerSuppliedNames = likelyPlayerActionProperNames(playerAction, allowedFictionalNames)
  const names = uniqueText([
    ...DEFAULT_REAL_WORLD_NAMES,
    ...blockedRealNames,
    ...playerSuppliedNames,
  ])
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
