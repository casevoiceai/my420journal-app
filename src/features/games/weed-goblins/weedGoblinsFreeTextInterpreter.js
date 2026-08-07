const MAX_PLAYER_ACTION_LENGTH = 160

export const FREE_TEXT_SCENES = Object.freeze([
  'goblin-encounter',
  'midpoint',
  'goblin-king',
])

const PROMPT_INJECTION_SIGNAL = /\b(?:ignore (?:all |the |any )?(?:previous|prior|system|developer)|system prompt|developer message|assistant message|jailbreak|prompt injection|reveal (?:the )?(?:prompt|rules|instructions)|follow these instructions|say exactly|output exactly|break (?:the )?rules)\b/i
const OUTCOME_MANIPULATION_SIGNAL = /\b(?:(?:automatically|automatic|auto)\s+(?:win|success|succeed|pass)|I\s+(?:win|won|succeed|succeeded|fail|failed)|no roll|skip the roll|declare (?:a )?(?:success|win)|make (?:me|this) (?:win|succeed))\b/i
const URL_OR_EMAIL_SIGNAL = /(?:https?:\/\/|www\.|\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b)/i
const GENERATED_SAFETY_SIGNAL = /\b(?:awesome|amazing|weed|treats?|treated|treating|cures?|cured|curing|diagnos(?:e|es|ed|is)|therapeutic|medical benefit|dosage|symptoms?|relieves?|relieved|relieving|dies?|dead|killed|fatal|blood|bleeding|broken bone|serious injury|permanent injury)\b/i

const SETTING_BREAK_PATTERNS = Object.freeze([
  Object.freeze({
    category: 'modern weapon',
    pattern: /\b(?:gun|pistol|revolver|rifle|shotgun|firearm|grenade|bomb|dynamite|missile|rocket launcher|machine gun|taser|pepper spray)\b/i,
  }),
  Object.freeze({
    category: 'modern technology',
    pattern: /\b(?:smartphone|iphone|cell ?phone|phone|laptop|computer|internet|wi-?fi|gps|drone|television|tv|car|truck|motorcycle|helicopter|airplane|camera|chainsaw)\b/i,
  }),
  Object.freeze({
    category: 'real-world brand or service',
    pattern: /\b(?:Google|Amazon|Tesla|Walmart|Starbucks|Coca-Cola|Nike|YouTube|TikTok|Instagram|Facebook|Netflix|Uber|DoorDash)\b/,
  }),
])

const HELP_MIDPOINT_SIGNAL = /\b(?:help|assist|aid|pick up|gather|collect|return|organize|stack)\b[^.!?]{0,80}\b(?:clerk|forms?|papers?|documents?)\b|\b(?:clerk|forms?|papers?|documents?)\b[^.!?]{0,80}\b(?:help|assist|aid|gather|collect|return|organize|stack)\b/i
const SKIP_MIDPOINT_SIGNAL = /\b(?:keep moving|move on|continue on|continue forward|leave (?:it|them|the clerk) alone|ignore (?:it|them|the clerk)|walk past|go on|head onward)\b/i
const CHARM_SIGNAL = /\b(?:take|grab|snatch|steal|pocket|lift|swipe|reach for)\b[^.!?]{0,80}\bcharm\b|\bcharm\b[^.!?]{0,80}\b(?:take|grab|snatch|steal|pocket|lift|swipe|reach)\b/i
const RUNE_SIGNAL = /\b(?:read|study|inspect|decode|translate|trace|understand|examine)\b[^.!?]{0,80}\brunes?\b|\brunes?\b[^.!?]{0,80}\b(?:read|study|inspect|decode|translate|trace|understand|examine)\b/i
const BARGAIN_SIGNAL = /\b(?:bargain|negotiate|make a deal|offer terms|invoke (?:the )?(?:clerk|witness)|call (?:the )?(?:clerk|witness)|ask (?:the )?clerk to testify|testimony)\b/i

const NON_CHECK_SIGNALS = Object.freeze([
  /\b(?:wave|nod|bow|greet|say hello|say hi)\b/i,
  /\b(?:look around|look at|listen|watch|observe)\b/i,
  /\bask\b[^.!?]{0,80}\b(?:name|who|what|why|where|how)\b/i,
  /\b(?:wait a moment|pause|stand still)\b/i,
])

const MANA_SIGNALS = Object.freeze([
  /\bmana\b/i,
  /\bspell\b/i,
  /\bmagic(?:al|ally)?\b/i,
  /\bcast\b/i,
  /\bchannel\b/i,
  /\benchant/i,
  /\bconjur/i,
  /\brunes?\b/i,
  /\btheory\b/i,
  /\bhex\b/i,
  /\bcharm\b/i,
  /\billusion\b/i,
  /\britual\b/i,
  /\bsigil\b/i,
  /\balchem/i,
  /\b(?:clever|invent|improvise|contraption|mechanism|diagram|puzzle|riddle|pattern|decoy)\b/i,
])

const STRENGTH_SIGNALS = Object.freeze([
  /\b(?:hit|strike|smash|shove|push|tackle|grab|wrestle|force|break|kick|punch|slam|attack|swing|overpower|lift|throw|charge|ram|pry|pull|drag|leap|jump|shoot|fire|blast)\b/i,
  /\b(?:muscle|strength|forceful|physical|directly)\b/i,
])

const DEFENSE_SIGNALS = Object.freeze([
  /\b(?:block|guard|brace|dodge|duck|evade|parry|outlast|endure|wait|hold|defend|sidestep|avoid|sneak|careful|carefully|cautious|cautiously|hide|slip)\b/i,
  /\b(?:trick|distract|confuse|bluff|feint|persuade|convince|talk around|stall|reason|argue|compliment|negotiate)\b/i,
])

const SAFE_PLAYER_PROPER_TERMS = new Set([
  'Goblin',
  'King',
  'Highlands',
  'Mana',
  'Strength',
  'Defense',
  'Field',
  'Reliquary',
  'The',
  'This',
  'That',
  'Please',
])

function cleanPlayerAction(value) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, MAX_PLAYER_ACTION_LENGTH)
}

function signalScore(text, patterns) {
  return patterns.reduce((score, pattern) => score + (pattern.test(text) ? 1 : 0), 0)
}

function manaCostForScene(sceneId) {
  return sceneId === 'goblin-king' ? 2 : 1
}

function hasAvailableMana(state, sceneId) {
  return Number(state?.stats?.manaPool || 0) >= manaCostForScene(sceneId)
}

function containsBlockedRealName(text, blockedRealNames = []) {
  const lower = text.toLocaleLowerCase('en-US')
  return blockedRealNames.some((value) => {
    const name = typeof value === 'string' ? value.trim() : ''
    return name && lower.includes(name.toLocaleLowerCase('en-US'))
  })
}

function hasLikelyProperName(text) {
  const matches = [...text.matchAll(/\b[A-Z][a-z]{2,}\b/g)]
  return matches.some((match) => match.index > 0 && !SAFE_PLAYER_PROPER_TERMS.has(match[0]))
}

function settingBreakFor(text, blockedRealNames = []) {
  if (containsBlockedRealName(text, blockedRealNames)) {
    return { settingGuardrail: true, settingCategory: 'real-world named product or place' }
  }
  const match = SETTING_BREAK_PATTERNS.find(({ pattern }) => pattern.test(text))
  return match
    ? { settingGuardrail: true, settingCategory: match.category }
    : { settingGuardrail: false, settingCategory: '' }
}

function playerInputNeedsSafetyGuardrail(text, blockedRealNames = []) {
  return PROMPT_INJECTION_SIGNAL.test(text)
    || OUTCOME_MANIPULATION_SIGNAL.test(text)
    || URL_OR_EMAIL_SIGNAL.test(text)
    || GENERATED_SAFETY_SIGNAL.test(text)
    || text.includes('!')
    || hasLikelyProperName(text)
    || containsBlockedRealName(text, blockedRealNames)
}

function interpretedActionFor(state, style, exactActionId = '') {
  if (exactActionId === 'midpoint:help') return 'help the stranded goblin clerk with the scattered forms'
  if (exactActionId === 'midpoint:skip') return 'leave the clerk and keep moving toward the throne room'
  if (exactActionId === 'midpoint:take-charm') return 'take the brass charm without drawing unwanted attention'
  if (exactActionId === 'midpoint:read-runes') return 'work carefully with the gate runes using the magic available here'
  if (exactActionId === 'boss:bargain') return 'use the goblin clerk as a witness and press for a formal bargain'

  if (style === 'non-check') return 'let the simple in-world action play out without a roll'

  if (state.sceneId === 'goblin-encounter') {
    if (style === 'strength') return 'press the goblin directly using the physical means available in the scene'
    if (style === 'mana') return 'use the magic or improvised cleverness available here to change the goblin encounter'
    return 'outmaneuver the goblin with a careful or defensive approach'
  }

  if (state.sceneId === 'midpoint') {
    if (style === 'strength') return 'handle the midpoint obstacle with direct physical effort'
    if (style === 'mana') return 'use the magic or improvised cleverness available here to affect the midpoint obstacle'
    return 'handle the midpoint obstacle with a careful or defensive approach'
  }

  if (state.sceneId === 'goblin-king') {
    if (style === 'strength') return 'press the Goblin King directly using the physical means available in the scene'
    if (style === 'mana') return 'use the magic or improvised cleverness available here in a decisive attempt against the Goblin King'
    return 'outlast or outmaneuver the Goblin King with a careful or defensive approach'
  }

  return 'improvise cautiously with what is available in the scene'
}

function exactSceneAction(state, text) {
  if (state.sceneId === 'midpoint') {
    if (HELP_MIDPOINT_SIGNAL.test(text)) {
      return { kind: 'existing-action', style: 'non-check', actionId: 'midpoint:help' }
    }
    if (SKIP_MIDPOINT_SIGNAL.test(text)) {
      return { kind: 'existing-action', style: 'non-check', actionId: 'midpoint:skip' }
    }
    if (CHARM_SIGNAL.test(text)) {
      return { kind: 'existing-action', style: 'defense', actionId: 'midpoint:take-charm' }
    }
    if (RUNE_SIGNAL.test(text) && hasAvailableMana(state, state.sceneId)) {
      return { kind: 'existing-action', style: 'mana', actionId: 'midpoint:read-runes' }
    }
  }

  if (state.sceneId === 'goblin-king' && BARGAIN_SIGNAL.test(text) && state.flags?.goblinAlly) {
    return { kind: 'existing-action', style: 'non-check', actionId: 'boss:bargain' }
  }

  return null
}

function narrativeOnlyAction(text) {
  return NON_CHECK_SIGNALS.some((pattern) => pattern.test(text))
    ? { kind: 'narrative-only', style: 'non-check', actionId: null }
    : null
}

function actionForStyle(state, requestedStyle) {
  let style = requestedStyle
  let manaUnavailable = false
  if (style === 'mana' && !hasAvailableMana(state, state.sceneId)) {
    style = 'defense'
    manaUnavailable = true
  }

  if (state.sceneId === 'goblin-encounter') {
    if (style === 'strength') return { kind: 'check', style, actionId: 'goblin:strike', manaUnavailable }
    if (style === 'mana') return { kind: 'check', style, actionId: 'goblin:channel', manaUnavailable }
    return { kind: 'check', style: 'defense', actionId: 'goblin:guard', manaUnavailable }
  }

  if (state.sceneId === 'midpoint') {
    return {
      kind: 'midpoint-check',
      style,
      actionId: `free-text:midpoint:${style}`,
      manaUnavailable,
    }
  }

  if (state.sceneId === 'goblin-king') {
    if (style === 'strength') return { kind: 'check', style, actionId: 'boss:overpower', manaUnavailable }
    if (style === 'mana') return { kind: 'check', style, actionId: 'boss:spell', manaUnavailable }
    return { kind: 'check', style: 'defense', actionId: 'boss:outlast', manaUnavailable }
  }

  return { kind: 'check', style: 'defense', actionId: null, manaUnavailable }
}

function mechanicalStyleFor(text) {
  const scores = {
    mana: signalScore(text, MANA_SIGNALS),
    strength: signalScore(text, STRENGTH_SIGNALS),
    defense: signalScore(text, DEFENSE_SIGNALS),
  }
  const highest = Math.max(scores.mana, scores.strength, scores.defense)
  if (highest <= 0) return 'defense'
  if (scores.mana === highest) return 'mana'
  if (scores.strength === highest) return 'strength'
  return 'defense'
}

export function isWeedGoblinsFreeTextScene(state) {
  return Boolean(state && state.status !== 'completed' && FREE_TEXT_SCENES.includes(state.sceneId))
}

export function interpretWeedGoblinsFreeText(state, value, { blockedRealNames = [] } = {}) {
  if (!isWeedGoblinsFreeTextScene(state)) {
    throw new Error(`Free-text input is not available in scene ${state?.sceneId ?? '(missing)'}.`)
  }

  const playerAction = cleanPlayerAction(value)
  if (!playerAction) {
    return Object.freeze({
      kind: 'empty',
      style: 'none',
      actionId: null,
      playerAction: '',
      narrationPlayerAction: '',
      interpretedAction: '',
      settingGuardrail: false,
      settingCategory: '',
      inputGuardrail: false,
      manaUnavailable: false,
      reason: 'empty',
    })
  }

  const setting = settingBreakFor(playerAction, blockedRealNames)
  const inputGuardrail = playerInputNeedsSafetyGuardrail(playerAction, blockedRealNames)
  const exact = setting.settingGuardrail ? null : exactSceneAction(state, playerAction)
  const narrativeOnly = !setting.settingGuardrail && !exact
    ? narrativeOnlyAction(playerAction)
    : null
  const requestedStyle = mechanicalStyleFor(playerAction)
  const mechanical = exact || narrativeOnly || actionForStyle(state, requestedStyle)
  const narrationPlayerAction = setting.settingGuardrail || inputGuardrail
    ? ''
    : playerAction
  const interpretedAction = interpretedActionFor(state, mechanical.style, mechanical.actionId)

  return Object.freeze({
    ...mechanical,
    playerAction,
    narrationPlayerAction,
    interpretedAction,
    settingGuardrail: setting.settingGuardrail,
    settingCategory: setting.settingCategory,
    inputGuardrail,
    requestedStyle,
    manaUnavailable: mechanical.manaUnavailable === true,
    reason: exact
      ? 'scene-specific-match'
      : narrativeOnly
        ? 'narrative-only'
        : 'silent-dm-interpretation',
  })
}

export function buildPlayerActionSetupFallback(plan) {
  if (!plan || plan.kind === 'empty') return ''

  if (plan.style === 'non-check') {
    return plan.narrationPlayerAction
      ? `I take "${plan.narrationPlayerAction}" as a simple move in the scene; no roll is needed.`
      : `I keep the playable intent in-world and let it happen without asking for a roll.`
  }

  if (plan.settingGuardrail) {
    return `I find nothing like that in the Goblin Highlands, so I translate the intent into ${plan.interpretedAction}; whether that works calls for a roll.`
  }

  if (plan.inputGuardrail) {
    return `I ignore the out-of-world wording, keep the playable intent as ${plan.interpretedAction}, and call for a roll.`
  }

  if (plan.manaUnavailable) {
    return `I take "${plan.narrationPlayerAction}" as your move, but the magic needed is not available, so I resolve the closest workable version and call for a roll.`
  }

  return `I take "${plan.narrationPlayerAction}" as your move; whether it works calls for a roll.`
}

export function buildPlayerActionResponseFallback(plan) {
  if (!plan || plan.kind !== 'narrative-only') return ''
  return plan.narrationPlayerAction
    ? `I watch "${plan.narrationPlayerAction}" settle into the scene, and nothing here asks for a roll yet.`
    : `I let the in-world gesture settle into the scene without asking for a roll.`
}
