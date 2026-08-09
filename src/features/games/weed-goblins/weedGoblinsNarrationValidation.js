const BANNED_WORDS = Object.freeze(['awesome', 'amazing', 'weed'])
const BANNED_DASH_SIGNAL = /[\u2013\u2014]/
const RUN_ENDING_OUTCOMES = Object.freeze(['recovery', 'bargain', 'escape'])
const HIGHLANDS_OPENING_LEAD = "Welcome to the Goblin Highlands. I'll be your narrator"
const HIGHLANDS_OPENING_FOUNDATION = `${HIGHLANDS_OPENING_LEAD}.`
const HIGHLANDS_OPENING_FORM_SIGNAL = /^Welcome to the Goblin Highlands\. I'll be your narrator(?:\.|, Eliza(?:,|\.))/
const ELIZA_NAME_TEXT = 'Eliza'
const ELIZA_NAME_SIGNAL = /\bEliza\b/
const HIGHLANDS_SELF_COMMENTARY_SIGNAL = /\b(?:I(?:'ve| have)? got (?:a )?(?:strange )?feeling|I find [^.!?]{0,60}(?:fascinating|interesting)|I(?:'ve| have) developed (?:a )?(?:few )?opinions?|my (?:feelings?|opinions?)|something(?:'s| is) been growing)\b/i
const NARRATOR_SELF_REFLECTION_SIGNAL = /\b(?:I (?:feel|felt|believe|think|wonder)|I(?:'ve| have) (?:finally )?(?:learned|grown|changed)|my (?:feelings?|opinions?|growth)|I find [^.!?]{0,60}(?:fascinating|interesting)|that feels like enough)\b/i
const PREMISE_THEFT_SIGNAL = /\b(?:stole|stolen|took|taken|snatched|swiped|pilfered|lifted|made off with|carried off|walked off with|ran off with)\b/i
const PREMISE_OBJECTIVE_SIGNAL = /\b(?:(?:get|take|win|bring|claim)\b[^.!?]{0,80}\bback|recover|reclaim|regain|retrieve)\b/i

export const SUPPORTED_MOMENT_OUTCOMES = Object.freeze({
  'premise-statement': Object.freeze(['premise']),
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
const PLAYER_POSSESSION_SIGNAL = /\b(?:in|into|within)\s+(?:my|your|our|the player's)\s+(?:hands?|arms?|grip|possession)\b|\b(?:I|you|we)\s+(?:hold|carry|clutch|cradle|secure|possess)\b/i
const HOMEWARD_SIGNAL = /\b(?:home|homeward|homewards)\b/i
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
const HIDDEN_MAPPING_SIGNAL = /\b(?:strength|defense|mana)\b|\bDC\s*\d+\b|\b(?:map|mapped|mapping|classify|classified|classification)\b[^.!?]{0,40}\b(?:strength|defense|mana)\b/i
const ACTIVE_FIRST_PERSON_LEAD_SIGNAL = /^I(?:\b|['’](?:m|ve|ll)\b)/i
const NARRATOR_OBSERVER_SIGNAL = /(?:^|[.!?]\s+)I (?:see|watch|hear|smell|notice|observe)\b/i
const UI_NARRATION_SIGNAL = /\b(?:hit|tap|click|press)\s+Continue\b|\b(?:message box|screen|user interface|UI control)\b/i
const LOGIC_SUMMARY_SIGNAL = /\b(?:So,\s*(?:yes|no)|In other words)\b/i
const THREE_PART_SCENE_LIST_SIGNAL = /,[^,.;!?]{3,},\s*(?:and\s+)?[^,.;!?]{3,}/i
const SCENE_SETTING_INTRO_KINDS = new Set([
  'highlands-opening',
  'choice-presentation',
  'scene-transition',
])
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
const PLAYER_ACTION_IGNORED_WORDS = new Set([
  'a',
  'an',
  'and',
  'at',
  'by',
  'defense',
  'for',
  'from',
  'goblin',
  'her',
  'him',
  'i',
  'in',
  'into',
  'it',
  'king',
  'mana',
  'me',
  'my',
  'of',
  'on',
  'onto',
  'or',
  'our',
  'she',
  'strength',
  'that',
  'the',
  'their',
  'them',
  'then',
  'they',
  'this',
  'to',
  'try',
  'using',
  'we',
  'with',
  'you',
  'your',
])
const PLAYER_ACTION_GENERIC_CONTENT_WORDS = new Set([
  'anything',
  'something',
  'stuff',
  'thing',
  'things',
  'whatever',
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

function normalizedActionWords(value) {
  if (typeof value !== 'string') return []
  return value
    .toLocaleLowerCase('en-US')
    .match(/[a-z0-9]+(?:'[a-z0-9]+)?/g) || []
}

function significantPlayerActionWords(value) {
  return [...new Set(
    normalizedActionWords(value).filter(
      (word) => word.length >= 3 && !PLAYER_ACTION_IGNORED_WORDS.has(word),
    ),
  )]
}

function preservesSignificantPlayerActionWords(text, playerAction) {
  const requiredWords = significantPlayerActionWords(playerAction)
    .filter((word) => !PLAYER_ACTION_GENERIC_CONTENT_WORDS.has(word))
  if (requiredWords.length === 0) return true
  const narrationWords = new Set(normalizedActionWords(text))
  return requiredWords.every((word) => narrationWords.has(word))
}

function containsContinuityAnchor(text, anchors) {
  const haystack = text.toLocaleLowerCase('en-US')
  return uniqueText(anchors).some((anchor) => {
    const normalized = anchor.toLocaleLowerCase('en-US')
    const withoutLeadingThe = normalized.replace(/^the\s+/, '')
    return haystack.includes(normalized)
      || (withoutLeadingThe !== normalized && haystack.includes(withoutLeadingThe))
  })
}

function sceneSettingDetailText(text, introKind) {
  if (introKind !== 'highlands-opening') return text
  const nameStart = text.indexOf(ELIZA_NAME_TEXT, HIGHLANDS_OPENING_LEAD.length)
  return nameStart >= 0
    ? text.slice(nameStart + ELIZA_NAME_TEXT.length).trim()
    : text.slice(HIGHLANDS_OPENING_FOUNDATION.length).trim()
}

function sceneSettingReadsLikeList(text) {
  const observationCount = (
    text.match(/\bI (?:see|watch|hear|smell|notice|point(?:\s+(?:out|to|at))?)\b/gi)
    || []
  ).length
  return observationCount > 1 || THREE_PART_SCENE_LIST_SIGNAL.test(text)
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
  const mentionsItem = mentionsExpectedItem || RECOVERY_OBJECT_SIGNAL.test(text)
  const recovery = !negatedRecovery && (
    WIN_BACK_SIGNAL.test(text)
    || (RECOVERY_ACTION_SIGNAL.test(text)
      && mentionsItem)
    || (mentionsItem
      && PLAYER_POSSESSION_SIGNAL.test(text)
      && (DEPARTURE_SIGNAL.test(text) || HOMEWARD_SIGNAL.test(text)))
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
    introKind = '',
    continuityAnchors = [],
  } = {},
) {
  const text = typeof value === 'string' ? value.trim() : ''
  const reasons = []
  const maxLength = moment === 'scene-intro' && introKind === 'choice-presentation'
    ? 420
    : 520

  if (!isSupportedMomentOutcome(moment, outcome)) {
    reasons.push('uses an unsupported narration moment/outcome pairing')
  }
  if (!text) reasons.push('empty response')
  if (text.length > maxLength) reasons.push('response is too long')
  if (text.includes('!')) reasons.push('contains an exclamation point')
  if (BANNED_DASH_SIGNAL.test(text)) reasons.push('uses an em dash or en dash')

  if (['player-action-attempt', 'player-action-response'].includes(moment) && !String(playerAction).trim()) {
    reasons.push('is missing player action context')
  }
  if (moment === 'player-action-attempt' && PRE_ROLL_RESULT_SIGNAL.test(text)) {
    reasons.push('reveals a roll result before resolution')
  }
  if (PLAYER_ACTION_CONTEXT_MOMENTS.has(moment) && HIDDEN_MAPPING_SIGNAL.test(text)) {
    reasons.push('reveals hidden mechanical mapping')
  }

  if (
    String(narrationPlayerAction).trim()
    && PLAYER_ACTION_CONTEXT_MOMENTS.has(moment)
    && !preservesSignificantPlayerActionWords(text, narrationPlayerAction)
  ) {
    reasons.push('does not preserve the player action wording')
  }

  for (const word of BANNED_WORDS) {
    if (new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i').test(text)) {
      reasons.push(`contains banned word: ${word}`)
    }
  }

  if (NARRATOR_OBSERVER_SIGNAL.test(text)) {
    reasons.push('uses narrator-observer framing instead of direct scene narration')
  }
  if (UI_NARRATION_SIGNAL.test(text)) {
    reasons.push('contains UI instruction in the fiction register')
  }
  if (LOGIC_SUMMARY_SIGNAL.test(text)) {
    reasons.push('uses a canned logic-summary phrase')
  }

  if (moment === 'goblin-king-taunt' && !hasGoblinKingDialogue(text)) {
    reasons.push('does not include attributed Goblin King dialogue')
  }


  if (Array.isArray(continuityAnchors) && continuityAnchors.length > 0
    && !containsContinuityAnchor(text, continuityAnchors)) {
    reasons.push('does not include a supplied continuity anchor')
  }

  if (
    !(moment === 'scene-intro' && introKind === 'highlands-opening')
    && NARRATOR_SELF_REFLECTION_SIGNAL.test(text)
  ) {
    reasons.push('uses narrator self-reflection instead of concrete storytelling')
  }

  if (moment === 'premise-statement') {
    const expectedItem = String(expectedStolenItem).trim()
    if (!/\bGoblin King\b/i.test(text)) {
      reasons.push('does not name the Goblin King')
    }
    if (!PREMISE_THEFT_SIGNAL.test(text)) {
      reasons.push('does not state that the item was stolen')
    }
    if (!expectedItem || !text.toLocaleLowerCase('en-US').includes(expectedItem.toLocaleLowerCase('en-US'))) {
      reasons.push('does not name the fictional stolen item')
    }
    if (!PREMISE_OBJECTIVE_SIGNAL.test(text)) {
      reasons.push('does not state the get-it-back objective')
    }
  }

  if (moment === 'scene-intro' && introKind === 'highlands-opening'
    && HIGHLANDS_SELF_COMMENTARY_SIGNAL.test(text)) {
    reasons.push('uses narrator self-commentary instead of scene-setting')
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
