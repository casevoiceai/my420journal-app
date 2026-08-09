const DEFAULT_ENDPOINT = '/api/weed-goblins-narration'
const MAX_TEXT_LENGTH = 300
const BANNED_WORDS = ['awesome', 'amazing', 'weed']
const CANONICAL_NAMES = Object.freeze([
  'Eliza',
  'Grintle Sixfinger',
  'Nettle',
  'Auntie Resin',
  'Coin Warden',
  'The Coin Warden',
  'Root Collector',
  'Cultivator',
  'Hollow Market',
  'Lantern Mouth',
  'Whisper Rows',
  'Root Exchange',
  'Drain Gate',
  'Withered Grove',
])

function cleanText(value, maxLength = MAX_TEXT_LENGTH) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
    : ''
}

function cleanList(values, maxItems = 8, maxLength = 100) {
  if (!Array.isArray(values)) return []
  const seen = new Set()
  const output = []
  for (const value of values) {
    const text = cleanText(value, maxLength)
    const key = text.toLowerCase()
    if (!text || seen.has(key)) continue
    seen.add(key)
    output.push(text)
    if (output.length >= maxItems) break
  }
  return output
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function redactBlockedNames(value, blockedRealNames = []) {
  let text = cleanText(value, 160)
  for (const name of cleanList(blockedRealNames, 20, 100)) {
    if (name.length < 2) continue
    text = text.replace(new RegExp(escapeRegExp(name), 'gi'), 'the thing you mean')
  }
  return text
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[private detail]')
    .replace(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[private detail]')
}

function containsBlockedName(text, blockedRealNames = []) {
  const lowered = text.toLowerCase()
  return cleanList(blockedRealNames, 20, 100).some((name) => lowered.includes(name.toLowerCase()))
}

export function validateChapterTwoNarration(value, { blockedRealNames = [] } = {}) {
  const text = cleanText(value, 600)
  const reasons = []
  if (!text) reasons.push('empty response')
  if (text.length > MAX_TEXT_LENGTH) reasons.push('response is too long')
  if (/[\u2013\u2014]/.test(text)) reasons.push('uses an em dash or en dash')
  if (text.includes('!')) reasons.push('contains an exclamation point')
  for (const word of BANNED_WORDS) {
    if (new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i').test(text)) {
      reasons.push(`contains banned word: ${word}`)
    }
  }
  if (containsBlockedName(text, blockedRealNames)) reasons.push('contains a blocked real-world name')
  if (/\b(?:diagnos|treats?|cures?|dosage|medical benefit|symptoms?)\b/i.test(text)) {
    reasons.push('contains a health or medical claim')
  }
  if (/\b(?:dies?|dead|killed|fatal|bleeding|broken bone|permanent injury)\b/i.test(text)) {
    reasons.push('contains fatal or serious-harm language')
  }
  return { valid: reasons.length === 0, text, reasons }
}

function safeHookPayload(hook = {}, state = {}, blockedRealNames = []) {
  const chapter = state.chapterTwo || {}
  return {
    chapterNumber: 2,
    moment: cleanText(hook.moment, 40),
    outcome: cleanText(hook.outcome, 60),
    sceneId: cleanText(state.sceneId || hook.sceneId, 80),
    previousSceneId: cleanText(hook.previousSceneId, 80),
    actionId: cleanText(hook.actionId, 100),
    dangerTier: cleanText(hook.dangerTier, 20),
    authoritativeText: cleanText(hook.authoritativeText || hook.fallbackText, 300),
    storySoFar: cleanText(hook.storySoFar, 600),
    choiceContext: cleanText(hook.choiceContext, 600),
    scenePurpose: cleanText(hook.scenePurpose, 240),
    tensionLevel: cleanText(hook.tensionLevel, 40),
    playerAction: '',
    interpretedAction: cleanText(hook.interpretedAction, 200),
    requiresRoll: hook.requiresRoll === true,
    roll: Number.isInteger(hook.roll) ? hook.roll : null,
    rolls: Array.isArray(hook.rolls) ? hook.rolls.slice(0, 2).map(Number).filter(Number.isInteger) : [],
    success: hook.success === true,
    naturalOne: hook.naturalOne === true,
    trouble: Number(state.trouble) || 0,
    manaRemaining: Number(state.stats?.manaPool) || 0,
    rootcoin: Number(state.rootcoin) || 0,
    wound: cleanText(state.wound, 40),
    marketState: cleanText(chapter.marketState, 60),
    entryPrice: cleanText(chapter.entryPrice, 40),
    recognizedStall: cleanText(chapter.recognizedStall, 120),
    counterfeitItem: cleanText(chapter.counterfeitItem, 120),
    inventory: cleanList(state.inventory, 8, 100),
    canonicalNames: CANONICAL_NAMES,
    narrationTier: cleanText(state.narrationTier, 50) || 'normal',
  }
}

export async function generateChapterTwoNarration({
  hook,
  state,
  blockedRealNames = [],
  fetchImpl = typeof fetch === 'function' ? fetch : null,
  endpoint = DEFAULT_ENDPOINT,
} = {}) {
  const fallbackText = cleanText(hook?.fallbackText || hook?.authoritativeText, MAX_TEXT_LENGTH)
  if (!fetchImpl || !hook || !state) {
    return { text: fallbackText, source: 'static-fallback' }
  }

  let response
  try {
    response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safeHookPayload(hook, state, blockedRealNames)),
    })
  } catch {
    return { text: fallbackText, source: 'static-fallback' }
  }

  if (!response?.ok) return { text: fallbackText, source: 'static-fallback' }

  let payload
  try {
    payload = await response.json()
  } catch {
    return { text: fallbackText, source: 'static-fallback' }
  }

  const validation = validateChapterTwoNarration(payload?.text, { blockedRealNames })
  if (!validation.valid) return { text: fallbackText, source: 'static-fallback' }
  return { text: validation.text, source: 'ai' }
}
