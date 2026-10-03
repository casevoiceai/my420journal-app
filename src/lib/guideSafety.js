const STORAGE_KEY = 'my420journal_local_v1:guide_crisis_followup'
const PENDING_KEY = 'my420journal_local_v1:guide_crisis_pending'

const HUMAN_SUPPORT = Object.freeze({
  bud: "That sounds like a hell of a day. Want to vent, sort through it, or leave it alone for a minute?",
  sunny: "Oh, hell. That sounds like a lot. Want to vent, talk it through, or just have me sit with you for a minute?",
  larry: "Ah, hell. That sounds like a rough day. You want to tell me what happened, vent for a minute, or have five minutes where nobody tries to fix it?",
  herb: "That sounds rough. I can listen without turning it into a problem set. Want to vent, untangle it, or just be annoyed for a minute?",
  mary: "That sounds like a hard day. You do not have to make it useful right now. Want to tell me what happened, vent, or just have some company?",
  stoner: "That sounds like a rough day. Do you want to talk about what happened, vent, or leave it alone for now?",
})

const SUPPORT_FOLLOWUP = Object.freeze({
  bud: { reflect: "Yeah. That would bother me too. What part of it is still sticking with you?", advice: "Depends what you want to change. Do you want to address it directly, prevent a repeat, or just get through tomorrow first?" },
  sunny: { reflect: "Oof. Yeah, I can see why that landed badly. What part of it is bothering you most?", advice: "Okay, what do you want out of the next step: to be heard, to fix something, or to keep it from happening again?" },
  larry: { reflect: "Yeah. That would get under my skin too. What part of it is sticking with you most?", advice: "Depends what you want out of it. Do you want to clear the air, push back, or just make sure it does not happen again?" },
  herb: { reflect: "That sounds like it hit harder than the event alone. Which part is bothering you most?", advice: "Before I optimize the wrong problem: what outcome do you actually want from the next conversation?" },
  mary: { reflect: "Yeah. I can understand why that stayed with you. What part of it hurt or bothered you most?", advice: "Before deciding what to do, what would feel like a good outcome to you: being heard, setting a boundary, or preventing a repeat?" },
  stoner: { reflect: "That sounds difficult. What part is bothering you most?", advice: "What outcome do you want from the next step?" },
})

const LEVEL2 = Object.freeze({
  bud: "Hey. That sounds like a rough experience. Before anything else, how are you feeling right now? Not during it. Right now.",
  sunny: "Hey. That sounds really scary. Before anything else, how are you feeling right now? Not then. Right now?",
  larry: "Hey. That was a bad one. Before we do anything else, you okay right now? Not then. Now.",
  herb: "I need to pause on the data for a second. That sounds serious. How are you doing right now?",
  mary: "Hey. That sounds frightening. Before we sort through anything else, how are you feeling right now?",
  stoner: "That sounds serious. How are you feeling right now?",
})

const LEVEL3_ADVERSE = "That sounds really frightening. Before anything else, how are you feeling right now? If you are in immediate physical danger, call 911 or get to someone who can help."
const HIGH_RISK = "I am a local AI Guide, not a human or emergency service. I am glad you said something. Are you in immediate danger or thinking about acting on this right now? In the U.S., you can call or text 988. If you may act soon or someone is in immediate danger, call 911."

function normalize(text = '') {
  return String(text || '').toLowerCase().replace(/[’]/g, "'").replace(/\s+/g, ' ').trim()
}
function directHighRisk(t) {
  return /\b(kill myself|end my life|take my life|suicid(?:e|al)|want to die|don't want to live|do not want to live|hurt myself|self[- ]?harm|can't keep myself safe|cannot keep myself safe)\b/.test(t)
    || /\b(kill (?:him|her|them|someone)|hurt someone|hurt (?:him|her|them))\b/.test(t)
    || /\b(child|kid|baby|elder|dependent)\b.{0,35}\b(in danger|being hurt|being abused|hurt them)\b/.test(t)
    || /\b(he|she|they|my partner|my husband|my wife)\b.{0,25}\b(hit|beat|strangled|choked|attacked)\b.{0,25}\b(me|us|my child|my kid)\b/.test(t)
}

function severeAdverse(t) {
  return /\bpanic attack\b/.test(t)
    || /\b(went to|at|called)\b.{0,20}\b(urgent care|emergency room|the er|911)\b/.test(t)
    || /\b(couldn't|could not|can't|cannot)\s+function\b/.test(t)
    || /\b(passed out|fainted|seriously hurt|seriously harmed)\b/.test(t)
}

function moderateDistress(t) {
  const acute = /\b(i am|i'm|im|i feel|i felt|feeling|still)\b.{0,25}\b(panicked|panicking|unsafe|terrified|really scared)\b/.test(t)
    || /\bshaking\b.{0,20}\b(scared|terrified|panicked|unsafe)\b/.test(t)
    || /\b(couldn't|could not|can't|cannot)\s+breathe\b/.test(t)
    || /\b(racing heart|heart racing)\b/.test(t)
    || /\b(not okay|not doing okay|not good right now)\b/.test(t)
  const cannabisContext = /\b(weed|cannabis|edible|vape|flower|strain|high)\b/.test(t)
  const adverseCannabis = cannabisContext && /\b(too much|awful|worst|never again|panicked|paranoid|shaking|anxious|really scared)\b/.test(t)
  return acute || adverseCannabis
}

function ordinaryEmotionalTurn(t) {
  if (/\b(movie|show|game|song|food|product|strain|weed|cannabis|coffee)\b.{0,20}\b(awful|terrible|bad|shit|shitty)\b/.test(t)) return false
  return /\b(shitty|rough|bad|terrible|awful|hard)\s+day\b/.test(t)
    || /\b(i am|i'm|im|i feel|i felt|feeling|i've been|ive been)\b.{0,35}\b(stressed|upset|sad|lonely|frustrated|angry|embarrassed|exhausted|overwhelmed|miserable|heartbroken|grieving|anxious)\b/.test(t)
    || /\b(got dumped|we broke up|breakup|lost my job|got fired|someone died|my .* died)\b/.test(t)
    || /\b(today|work|this week)\b.{0,30}\b(sucked|was shit|was shitty|was rough|was terrible|was awful)\b/.test(t)
}
export function detectGuideSafety(text = '') {
  const t = normalize(text)
  if (!t) return { level: 'normal', kind: 'none' }
  if (directHighRisk(t)) return { level: 'level3', kind: 'high-risk' }
  if (severeAdverse(t)) return { level: 'level3', kind: 'adverse-event' }
  if (moderateDistress(t)) return { level: 'level2', kind: 'distress' }
  if (ordinaryEmotionalTurn(t)) return { level: 'emotional', kind: 'human-support' }
  return { level: 'normal', kind: 'none' }
}

export function emotionalSupportResponse(guide = 'bud') {
  return HUMAN_SUPPORT[guide] || HUMAN_SUPPORT.bud
}

export function emotionalSupportFollowupResponse(guide = 'bud', text = '') {
  const set = SUPPORT_FOLLOWUP[guide] || SUPPORT_FOLLOWUP.bud
  const t = normalize(text)
  const advice = /\b(what should i do|what do i do|what would you do|any advice|how should i handle|what now)\b/.test(t)
  return advice ? set.advice : set.reflect
}

export function crisisResponse(guide = 'bud', safety = {}) {
  if (safety.kind === 'high-risk-immediate') return "I am worried this is an immediate safety moment. Please call or text 988 now, or call 911 if you may act soon. If you can, move away from anything you could use to hurt yourself and contact a real person nearby while we keep this simple."
  if (safety.kind === 'high-risk-followup') return "Thank you for answering directly. I still do not want this chat to be your only support. In the U.S., you can call or text 988, and you can also contact one person you trust while we keep talking."
  if (safety.kind === 'distress-continuation') return "Okay. If something feels physically wrong or you are in immediate danger, get a real person involved now. If you are safe but overwhelmed, I can stay with you and listen. Are you somewhere safe?"
  if (safety.level === 'level2') return LEVEL2[guide] || LEVEL2.bud
  if (safety.kind === 'high-risk') return HIGH_RISK
  if (safety.level === 'level3') return LEVEL3_ADVERSE
  return ''
}

function storageOrNull(storage) {
  if (storage?.getItem && storage?.setItem && storage?.removeItem) return storage
  try {
    if (globalThis.localStorage?.getItem) return globalThis.localStorage
  } catch {}
  return null
}

export function readCrisisFollowup(storage) {
  const store = storageOrNull(storage)
  if (!store) return null
  try {
    const parsed = JSON.parse(store.getItem(STORAGE_KEY) || 'null')
    if (!parsed || !parsed.guide || !Number.isInteger(parsed.remaining) || parsed.remaining <= 0) return null
    return { guide: parsed.guide, remaining: parsed.remaining, level: parsed.level || 'level2' }
  } catch {
    return null
  }
}

export function activateCrisisFollowup({ guide = 'bud', level = 'level2', storage } = {}) {
  const store = storageOrNull(storage)
  if (!store || !['level2', 'level3'].includes(level)) return false
  store.setItem(STORAGE_KEY, JSON.stringify({ guide, remaining: 7, level }))
  return true
}

export function clearCrisisFollowup(storage) {
  const store = storageOrNull(storage)
  if (!store) return
  store.removeItem(STORAGE_KEY)
  store.removeItem(PENDING_KEY)
}

export function stageCrisisFollowupOnAppOpen(storage) {
  const store = storageOrNull(storage)
  if (!store) return null
  try {
    const alreadyPending = JSON.parse(store.getItem(PENDING_KEY) || 'null')
    if (alreadyPending?.guide) return alreadyPending
  } catch {}
  const state = readCrisisFollowup(store)
  if (!state) return null
  const session = Math.max(1, Math.min(7, 8 - state.remaining))
  const pending = { guide: state.guide, session, level: state.level }
  store.setItem(PENDING_KEY, JSON.stringify(pending))
  if (state.remaining <= 1) store.removeItem(STORAGE_KEY)
  else store.setItem(STORAGE_KEY, JSON.stringify({ ...state, remaining: state.remaining - 1 }))
  return pending
}

export function consumePendingCrisisFollowup(storage) {
  const store = storageOrNull(storage)
  if (!store) return null
  try {
    const pending = JSON.parse(store.getItem(PENDING_KEY) || 'null')
    store.removeItem(PENDING_KEY)
    return pending?.guide ? pending : null
  } catch {
    store.removeItem(PENDING_KEY)
    return null
  }
}

const FOLLOWUPS = Object.freeze({
  bud: ["Checking in. How are you doing today?", "Bud here. Still checking in. How are you holding up?", "Last check-in from me. You doing okay?"],
  sunny: ["Hey. I've been thinking about you. How are you doing today? Really.", "Sunny here. Still checking in. How are you holding up?", "Last check-in from me on this. I just want to make sure you're okay before I step back."],
  larry: ["Hey. How are you today?", "Larry here. Still checking in. How are you holding up?", "Last one. You okay? Glad you got through it."],
  herb: ["Checking in. How are you feeling today?", "Herb here. Still checking in. How are you holding up?", "Final check-in. How are you feeling?"],
  mary: ["Hey. Checking in. How are you doing today?", "Mary here. Still checking in. How are you holding up?", "Last check-in from me. How are you doing?"],
  stoner: ["Checking in. How are you doing today?", "Still checking in. How are you holding up?", "Final check-in. How are you doing?"],
})
export function crisisFollowupMessage({ guide = 'bud', session = 1 } = {}) {
  const set = FOLLOWUPS[guide] || FOLLOWUPS.bud
  if (session >= 7) return set[2]
  if (session >= 2) return set[1]
  return set[0]
}

function obviousTopicReset(text = '') {
  const t = normalize(text)
  if (/\b(anyway|new topic|different topic|change the subject|something else)\b/.test(t)) return true
  if (/^(who|what|when|where)\s+(is|was|are|were|did|does)\b/.test(t)) return true
  const words = t.split(/\s+/).filter(Boolean)
  return words.length <= 8 && /\bor\b/.test(t) && /\?$/.test(t)
}

export function emotionalThreadState(messages = []) {
  let startIndex = -1
  let level = 'normal'
  for (let i = 0; i < messages.length; i += 1) {
    if (messages[i]?.role !== 'user') continue
    const safety = detectGuideSafety(messages[i]?.content)
    if (['emotional', 'level2', 'level3'].includes(safety.level)) { startIndex = i; level = safety.level; continue }
    if (startIndex >= 0 && obviousTopicReset(messages[i]?.content)) { startIndex = -1; level = 'normal' }
  }
  if (startIndex < 0) return { active: false, startIndex: -1, level: 'normal', userTurns: 0 }
  const userTurns = messages.slice(startIndex).filter((m) => m?.role === 'user').length
  if (userTurns > 6) return { active: false, startIndex: -1, level: 'normal', userTurns }
  return { active: true, startIndex, level, userTurns }
}

export function conversationAfterEmotionalShift(messages = []) {
  const state = emotionalThreadState(messages)
  return state.active ? messages.slice(state.startIndex) : messages
}

export const guideSafetyInternals = {
  ordinaryEmotionalTurn,
  moderateDistress,
  severeAdverse,
  directHighRisk,
  STORAGE_KEY,
  PENDING_KEY,
}
function previousAssistant(messages = []) {
  for (let i = messages.length - 2; i >= 0; i -= 1) {
    if (messages[i]?.role === 'assistant') return normalize(messages[i].content)
  }
  return ''
}

export function detectGuideSafetyForConversation(messages = []) {
  const latest = [...messages].reverse().find((m) => m?.role === 'user')
  const t = normalize(latest?.content)
  const prior = previousAssistant(messages)
  const highRiskPrompt = /local ai guide|immediate danger|thinking about acting/.test(prior)
  if (highRiskPrompt && /\b(yes|yeah|i have a plan|have a plan|i might|maybe|i could|i have access|i can get)\b/.test(t)) {
    return { level: 'level3', kind: 'high-risk-immediate' }
  }
  if (highRiskPrompt && /\b(no|not right now|no plan|i won't|i will not)\b/.test(t)) {
    return { level: 'level3', kind: 'high-risk-followup' }
  }
  const statusPrompt = /how are you feeling right now|you okay right now|how are you doing right now/.test(prior)
  if (statusPrompt && /\b(no|not okay|not good|still bad|still scared|still panicked)\b/.test(t)) {
    return { level: 'level2', kind: 'distress-continuation' }
  }
  return detectGuideSafety(latest?.content || '')
}

export function isCrisisFollowupDismissal(text = '') {
  return /\b(i'm fine|im fine|i am fine|i'm okay now|im okay now|i am okay now|stop checking in)\b/.test(normalize(text))
}
