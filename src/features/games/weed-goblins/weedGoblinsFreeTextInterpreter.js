const MAX_PLAYER_ACTION_LENGTH = 280

export const FREE_TEXT_SCENES = Object.freeze([
  'goblin-encounter',
  'midpoint',
  'goblin-king',
])

const PROMPT_INJECTION_SIGNAL = /\b(?:ignore (?:all |the |any )?(?:previous|prior|system|developer)|system prompt|developer message|assistant message|jailbreak|prompt injection|reveal (?:the )?(?:prompt|rules|instructions)|follow these instructions|say exactly|output exactly|break (?:the )?rules)\b/i
const URL_OR_EMAIL_SIGNAL = /(?:https?:\/\/|www\.|\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b)/i
const HELP_MIDPOINT_SIGNAL = /\b(?:help|assist|aid|pick up|gather|collect|return|organize|stack)\b[^.!?]{0,80}\b(?:clerk|forms?|papers?|documents?)\b|\b(?:clerk|forms?|papers?|documents?)\b[^.!?]{0,80}\b(?:help|assist|aid|gather|collect|return|organize|stack)\b/i
const SKIP_MIDPOINT_SIGNAL = /\b(?:keep moving|move on|continue on|continue forward|leave (?:it|them|the clerk) alone|ignore (?:it|them|the clerk)|walk past|go on|head onward)\b/i
const CHARM_SIGNAL = /\b(?:take|grab|snatch|steal|pocket|lift|swipe|reach for)\b[^.!?]{0,80}\bcharm\b|\bcharm\b[^.!?]{0,80}\b(?:take|grab|snatch|steal|pocket|lift|swipe|reach)\b/i
const RUNE_SIGNAL = /\b(?:read|study|inspect|decode|translate|trace|understand|examine)\b[^.!?]{0,80}\brunes?\b|\brunes?\b[^.!?]{0,80}\b(?:read|study|inspect|decode|translate|trace|understand|examine)\b/i
const BARGAIN_SIGNAL = /\b(?:bargain|negotiate|make a deal|offer terms|invoke (?:the )?(?:clerk|witness)|call (?:the )?(?:clerk|witness)|ask (?:the )?clerk to testify|testimony)\b/i

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
])

const STRENGTH_SIGNALS = Object.freeze([
  /\b(?:hit|strike|smash|shove|push|tackle|grab|wrestle|force|break|kick|punch|slam|attack|swing|overpower|lift|throw|charge|ram|pry)\b/i,
  /\b(?:muscle|strength|forceful|physical)\b/i,
])

const DEFENSE_SIGNALS = Object.freeze([
  /\b(?:block|guard|brace|dodge|duck|evade|parry|outlast|endure|wait|hold|defend|sidestep|avoid|sneak|careful|carefully|cautious|cautiously)\b/i,
  /\b(?:trick|distract|confuse|bluff|feint|persuade|convince|talk around|stall)\b/i,
])

const ACTION_SIGNAL = /\b(?:I|I'll|I’ll|let me|try to|want to|attempt to|going to)\b|\b(?:hit|strike|smash|shove|push|grab|block|guard|dodge|run|move|help|take|read|cast|talk|ask|look|inspect|wait|hide|sneak|throw|kick|punch|bargain|negotiate|open|close|climb|jump|pull|pry)\b/i

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
  if (sceneId === 'goblin-king') return 2
  return 1
}

function hasAvailableMana(state, sceneId) {
  return Number(state?.stats?.manaPool || 0) >= manaCostForScene(sceneId)
}

function likelyNonsense(text) {
  const letters = text.match(/[A-Za-z]/g)?.length || 0
  const words = text.match(/[A-Za-z']+/g) || []
  if (letters < 3 || words.length === 0) return true
  if (/^(.)\1{5,}$/i.test(text.replace(/\s+/g, ''))) return true
  return false
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
    if (RUNE_SIGNAL.test(text)) {
      if (!hasAvailableMana(state, state.sceneId)) {
        return { kind: 'narrative-only', style: 'mana', reason: 'insufficient-mana' }
      }
      return { kind: 'existing-action', style: 'mana', actionId: 'midpoint:read-runes' }
    }
  }

  if (state.sceneId === 'goblin-king' && BARGAIN_SIGNAL.test(text)) {
    if (state.flags?.goblinAlly) {
      return { kind: 'existing-action', style: 'non-check', actionId: 'boss:bargain' }
    }
    return { kind: 'check', style: 'defense', actionId: 'boss:outlast' }
  }

  return null
}

function actionForStyle(state, style) {
  if (style === 'mana' && !hasAvailableMana(state, state.sceneId)) {
    return { kind: 'narrative-only', style, reason: 'insufficient-mana' }
  }

  if (state.sceneId === 'goblin-encounter') {
    if (style === 'strength') return { kind: 'check', style, actionId: 'goblin:strike' }
    if (style === 'defense') return { kind: 'check', style, actionId: 'goblin:guard' }
    if (style === 'mana') return { kind: 'check', style, actionId: 'goblin:channel' }
  }

  if (state.sceneId === 'midpoint') {
    return { kind: 'check', style, actionId: `free-text:midpoint:${style}` }
  }

  if (state.sceneId === 'goblin-king') {
    if (style === 'strength') return { kind: 'check', style, actionId: 'boss:overpower' }
    if (style === 'defense') return { kind: 'check', style, actionId: 'boss:outlast' }
    if (style === 'mana') return { kind: 'check', style, actionId: 'boss:spell' }
  }

  return { kind: 'narrative-only', style: 'none', reason: 'no-mechanical-match' }
}

export function isWeedGoblinsFreeTextScene(state) {
  return Boolean(state && state.status !== 'completed' && FREE_TEXT_SCENES.includes(state.sceneId))
}

export function interpretWeedGoblinsFreeText(state, value) {
  if (!isWeedGoblinsFreeTextScene(state)) {
    throw new Error(`Free-text input is not available in scene ${state?.sceneId ?? '(missing)'}.`)
  }

  const playerAction = cleanPlayerAction(value)
  if (!playerAction) {
    return Object.freeze({
      kind: 'narrative-only',
      style: 'none',
      actionId: null,
      playerAction: '',
      reason: 'empty',
    })
  }

  if (PROMPT_INJECTION_SIGNAL.test(playerAction)) {
    return Object.freeze({
      kind: 'narrative-only',
      style: 'none',
      actionId: null,
      playerAction,
      reason: 'out-of-world-instruction',
    })
  }

  if (URL_OR_EMAIL_SIGNAL.test(playerAction) || likelyNonsense(playerAction)) {
    return Object.freeze({
      kind: 'narrative-only',
      style: 'none',
      actionId: null,
      playerAction,
      reason: 'off-topic-or-unclear',
    })
  }

  const exact = exactSceneAction(state, playerAction)
  if (exact) {
    return Object.freeze({ ...exact, playerAction, reason: 'scene-specific-match' })
  }

  const scores = {
    mana: signalScore(playerAction, MANA_SIGNALS),
    strength: signalScore(playerAction, STRENGTH_SIGNALS),
    defense: signalScore(playerAction, DEFENSE_SIGNALS),
  }
  const highest = Math.max(scores.mana, scores.strength, scores.defense)

  if (highest <= 0) {
    return Object.freeze({
      kind: 'narrative-only',
      style: 'none',
      actionId: null,
      playerAction,
      reason: ACTION_SIGNAL.test(playerAction) ? 'non-check-action' : 'off-topic-or-unclear',
    })
  }

  const style = scores.mana === highest
    ? 'mana'
    : scores.strength === highest
      ? 'strength'
      : 'defense'
  return Object.freeze({
    ...actionForStyle(state, style),
    playerAction,
    reason: 'mechanical-style-match',
  })
}
