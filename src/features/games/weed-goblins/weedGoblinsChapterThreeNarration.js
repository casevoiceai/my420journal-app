const DEFAULT_ENDPOINT = '/api/weed-goblins-narration'
const MAX_TEXT_LENGTH = 300
const BANNED_WORDS = ['awesome', 'amazing', 'weed']
const CANONICAL_NAMES = Object.freeze([
  'Eliza',
  'Bramblekin',
  'Corla the Forager',
  'Corla',
  'Kip',
  'Withering Stalker',
  'Root Leeches',
  'Cultivator',
  'Withered Grove',
  'Gray Verge',
  'Resin Chapel',
  'Thirsting Run',
  'Sleeping Nursery',
  'Siphon Well',
  'Sunken Greenhouse',
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

function containsBlockedName(text, blockedRealNames = []) {
  const lowered = text.toLowerCase()
  return cleanList(blockedRealNames, 20, 100).some((name) => lowered.includes(name.toLowerCase()))
}

export function validateChapterThreeNarration(value, { blockedRealNames = [] } = {}) {
  const text = cleanText(value, 600)
  const reasons = []
  if (!text) reasons.push('empty response')
  if (text.length > MAX_TEXT_LENGTH) reasons.push('response is too long')
  if (/[\u2013\u2014]/.test(text)) reasons.push('uses an em dash or en dash')
  if (text.includes('!')) reasons.push('contains an exclamation point')
  for (const word of BANNED_WORDS) {
    if (new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i').test(text)) reasons.push(`contains banned word: ${word}`)
  }
  if (containsBlockedName(text, blockedRealNames)) reasons.push('contains a blocked real-world name')
  if (/\b(?:diagnos|treats?|cures?|dosage|medical benefit|symptoms?)\b/i.test(text)) reasons.push('contains a health or medical claim')
  if (/\b(?:dies?|dead|killed|fatal|bleeding|broken bone|permanent injury)\b/i.test(text)) reasons.push('contains fatal or serious-harm language')
  return { valid: reasons.length === 0, text, reasons }
}

function safeHookPayload(hook = {}, state = {}) {
  const chapter = state.chapterThree || {}
  return {
    chapterNumber: 3,
    moment: cleanText(hook.moment, 40),
    outcome: cleanText(hook.outcome, 60),
    sceneId: cleanText(state.sceneId || hook.sceneId, 100),
    previousSceneId: cleanText(hook.previousSceneId, 100),
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
    groveState: cleanText(chapter.groveState, 60),
    falseCureKnown: chapter.falseCureKnown === true,
    kipWarningHeeded: chapter.kipWarningHeeded === true,
    memoryRingsSolved: chapter.memoryRingsSolved === true,
    waterStonesBalanced: chapter.waterStonesBalanced === true,
    stalkerBlindSpotKnown: chapter.stalkerBlindSpotKnown === true,
    nurseryOutcome: cleanText(chapter.nurseryOutcome, 100),
    nightlyDrawOutcome: cleanText(chapter.nightlyDrawOutcome, 100),
    memorySensation: cleanText(chapter.memorySensation, 160),
    inventory: cleanList(state.inventory, 10, 100),
    canonicalNames: CANONICAL_NAMES,
    narrationTier: cleanText(state.narrationTier, 50) || 'normal',
  }
}

export async function generateChapterThreeNarration({
  hook,
  state,
  blockedRealNames = [],
  fetchImpl = typeof fetch === 'function' ? fetch : null,
  endpoint = DEFAULT_ENDPOINT,
} = {}) {
  const fallbackText = cleanText(hook?.fallbackText || hook?.authoritativeText, MAX_TEXT_LENGTH)
  if (!fetchImpl || !hook || !state) return { text: fallbackText, source: 'static-fallback' }

  let response
  try {
    response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safeHookPayload(hook, state)),
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
  const validation = validateChapterThreeNarration(payload?.text, { blockedRealNames })
  if (!validation.valid) return { text: fallbackText, source: 'static-fallback' }
  return { text: validation.text, source: 'ai' }
}

export function buildChapterThreeNarrationPayloadForTest(hook, state) {
  return Object.freeze(safeHookPayload(hook, state))
}
