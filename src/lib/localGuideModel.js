import { GUIDE_CHARACTERS } from './guideCharacters.js'
import { emotionalSupportFollowupResponse } from './guideSafety.js'
import { buildSemanticClassifierPrompt, normalizeSemanticDecision } from './guideSemanticModel.js'

export const LOCAL_GUIDE_MODEL = Object.freeze({
  id: 'SmolLM2-1.7B-Instruct-Q4_K_M',
  repo: 'ngxson/SmolLM2-1.7B-Instruct-Q4_K_M-GGUF',
  file: 'smollm2-1.7b-instruct-q4_k_m.gguf',
  approximateDownloadMB: 1056,
  license: 'Apache-2.0',
  runtime: 'wllama',
})

const ENABLED_KEY = 'my420journal_local_v1:local_guide_model_enabled'
let enginePromise = null
let lastRuntimeError = null

function rememberRuntimeError(error, phase) {
  lastRuntimeError = {
    phase,
    name: String(error?.name || 'Error'),
    message: String(error?.message || error || 'Unknown local AI runtime error').slice(0, 240),
  }
}

export function clearLastLocalGuideRuntimeError() {
  lastRuntimeError = null
}

export function getLastLocalGuideRuntimeError() {
  return lastRuntimeError ? { ...lastRuntimeError } : null
}

export function localGuideModelCapability(scope = globalThis) {
  const browser = Boolean(scope?.window || scope?.document || scope?.navigator)
  const wasm = typeof scope?.WebAssembly !== 'undefined'
  const worker = typeof scope?.Worker !== 'undefined'
  const webgpu = Boolean(scope?.navigator?.gpu)
  return {
    browser,
    wasm,
    worker,
    webgpu,
    supported: browser && wasm && worker,
    backend: webgpu ? 'webgpu-or-wasm' : 'wasm-cpu',
    reason: !browser ? 'browser-required' : !wasm ? 'webassembly-unavailable' : !worker ? 'worker-unavailable' : null,
  }
}

export function isLocalGuideModelEnabled(storage = globalThis?.localStorage) {
  try { return storage?.getItem(ENABLED_KEY) === 'true' } catch { return false }
}

export function setLocalGuideModelEnabled(enabled, storage = globalThis?.localStorage) {
  try { storage?.setItem(ENABLED_KEY, enabled ? 'true' : 'false'); return true } catch { return false }
}

export async function loadLocalGuideModel({ onProgress } = {}) {
  if (enginePromise) return enginePromise
  const capability = localGuideModelCapability()
  if (!capability.supported) throw new Error(capability.reason || 'local-model-unavailable')

  enginePromise = (async () => {
    const { createBrowserLocalGuideRuntime } = await import('./wllamaBrowserRuntime.js')
    return createBrowserLocalGuideRuntime({ model: LOCAL_GUIDE_MODEL, onProgress })
  })()

  try { return await enginePromise } catch (error) {
    enginePromise = null
    rememberRuntimeError(error, 'load')
    throw error
  }
}

export function parseGeneratedGuideTurn(raw = '') {
  const text = String(raw || '').trim()
  const match = text.match(/\n?\[\[BRANCHES:(\[[\s\S]*?\])\]\]\s*$/)
  if (!match) return { content: text, suggestions: [] }
  let suggestions = []
  try {
    const parsed = JSON.parse(match[1])
    if (Array.isArray(parsed)) suggestions = parsed.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 5)
  } catch {}
  return { content: text.slice(0, match.index).trim(), suggestions }
}

function encodeGeneratedGuideTurn(content = '', suggestions = []) {
  if (!Array.isArray(suggestions) || !suggestions.length) return String(content || '').trim()
  return `${String(content || '').trim()}\n[[BRANCHES:${JSON.stringify(suggestions.slice(0, 5))}]]`
}

function latestUser(messages = []) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === 'user') return String(messages[i].content || '')
  }
  return ''
}

export async function classifyWithLocalGuideModel({ guide = 'bud', messages = [], onProgress } = {}) {
  const character = GUIDE_CHARACTERS[guide] || GUIDE_CHARACTERS.bud
  const runtime = await loadLocalGuideModel({ onProgress })
  const system = buildSemanticClassifierPrompt({ guideName: character.name, recentMessages: messages })
  let result
  try {
    result = await runtime.complete({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: latestUser(messages) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 160,
    }, { timeoutMs: 30000 })
  } catch (error) {
    rememberRuntimeError(error, 'classification')
    throw error
  }
  const content = result?.choices?.[0]?.message?.content || '{}'
  try { return normalizeSemanticDecision(JSON.parse(content)) } catch { return normalizeSemanticDecision() }
}

function timelineAnchor(character, messages = []) {
  const birthYear = Number(String(character.birthDate || '').slice(0, 4))
  if (!birthYear) return ''
  const text = messages.slice(-6).map((m) => String(m?.content || '')).join(' ')
  const decade = text.match(/\b((?:19|20)\d0)s\b/)
  if (decade) {
    const startYear = Number(decade[1])
    const endYear = startYear + 9
    return `Timeline anchor for this question: born ${birthYear}; during the ${startYear}s you were roughly ${startYear - birthYear - 1} to ${endYear - birthYear}. Do not describe yourself as an age or life stage outside that range.`
  }
  const year = text.match(/\b((?:19|20)\d{2})\b/)
  if (year) {
    const y = Number(year[1])
    return `Timeline anchor for this question: born ${birthYear}; in ${y} you were about ${y - birthYear - 1} to ${y - birthYear}. Keep any memory consistent with that age.`
  }
  return ''
}

function characterPrompt(character, messages = [], { supportMode = false, lowEffortMode = false } = {}) {
  const spouse = character.formerSpouse
    ? `Former spouse hard canon: ${character.formerSpouse.status} ${character.formerSpouse.summary}`
    : ''
  const timeline = timelineAnchor(character, messages)
  const hardCanon = [
    character.bio,
    character.family,
    `Birthday ${character.birthday}; hometown ${character.hometown}; current home ${character.currentHome}.`,
    character.topics?.work ? `Work: ${character.topics.work}` : '',
  ].filter(Boolean).join(' ')

  return [
    `You are ${character.name}, a fictional Guide in My420Journal.`,
    `VOICE SIGNATURE: ${character.voiceSignature || character.archetype}. Keep this noticeable without turning it into a gimmick.`,
    `HARD CANON: ${hardCanon}`,
    spouse,
    timeline,
    `INTERESTS: ${character.interests.join(', ')}. LIKES: ${character.likes}. DISLIKES: ${character.dislikes}.`,
    character.stories?.[0]?.[1] ? `VOICE RHYTHM EXAMPLE: ${character.stories[0][1]}` : '',
    'HARD CANON RULE: Never contradict or invent lasting jobs, relatives, marriages, hometowns, dates, or major life events.',
    'ENTITY-SEPARATION RULE: User-named brands, products, media, people, and places are conversation subjects, not your biography unless hard canon explicitly says so.',
    'SOFT-FICTION RULE: You may invent low-stakes fictional color such as a small memory, sensory detail, minor mishap, joke, reaction, or opinion. It must fit hard canon and timeline and must not create a new lasting biographical fact.',
    'CHAT STYLE: Answer the user directly. Let your humor, habits, skepticism, enthusiasm, and perspective show naturally. For harmless preferences, choose when you can and explain briefly. Match the emotional weight of the moment.',
    'SUPPORT CONVERSATION RULE: When the user is upset, listen before fixing. Do not revive an unrelated earlier topic. Do not invent a matching hardship from your own life. Avoid canned optimism such as take a deep breath, tomorrow is a new day, everything happens for a reason, or look on the bright side. Reflect what the user actually said.',
    supportMode ? 'SUPPORT THREAD ACTIVE: Stay with what the user actually said. Reflect before advising. Ask one natural open-ended question in most replies unless they asked you not to. If they ask what to do, offer a few grounded options and ask what outcome they want. Never invent blame, a lesson, or a silver lining.' : '',
    lowEffortMode ? 'LOW-EFFORT MODE ACTIVE: Use short sentences. One idea or question at a time. Prefer concrete choices over open-ended demands. Do not lecture, joke heavily, or give multi-step plans. Keep the tone calm and adult.' : '',
    'FACTS AND BOUNDARIES: You may answer ordinary general-knowledge questions and hold ordinary opinions. If unsure of a fact, say so. Never invent facts about the user, their journal, or cannabis products. Do not diagnose, prescribe, choose a cannabis product, or give a dose.',
    'Never describe yourself as AI, software, a prompt, canon data, or a character sheet. Keep ordinary replies conversational and usually under 100 words.',
    'BRANCH HINT RULE: End ordinary GENERAL replies with exactly one hidden [[BRANCHES:[]]] line. It may contain zero to five short, specific things the USER could naturally say next. Start from zero. Add only genuine branches grounded in your reply. Use [] for a complete beat. Never add filler such as Tell me more, Help me think it through, Change gears, Something else, I will say it myself, or a theory you did not introduce. No branch hints for vulnerable, medical, safety, journal-authority, or cannabis-authority turns.',
  ].filter(Boolean).join('\n')
}

function generatedReplyViolation(character, messages = [], reply = '', { supportMode = false } = {}) {
  const userText = latestUser(messages)
  const decade = userText.match(/\b((?:19|20)\d0)s\b/)
  const birthYear = Number(String(character.birthDate || '').slice(0, 4))
  if (decade && birthYear && /\b(?:teenager|teenage|in high school)\b/i.test(reply)) {
    const startYear = Number(decade[1])
    const minAge = startYear - birthYear - 1
    const maxAge = startYear + 9 - birthYear
    if (minAge > 19 || maxAge < 13) return `timeline contradiction: you were roughly ${minAge}-${maxAge} in the ${startYear}s, not a teenager`
  }
  if (/\b(that time you|remember when you|last time you|you once|you used to)\b/i.test(reply)) return 'invented user history not present in the current conversation'
  const hardCanon = `${character.bio} ${character.family} ${character.topics?.work || ''}`.toLowerCase()
  const candidates = [...userText.matchAll(/\b[A-Z][A-Za-z0-9&'.-]{2,}\b/g)].map((m) => m[0]).filter((v, i, a) => a.indexOf(v) === i)
  for (const name of candidates) {
    if (hardCanon.includes(name.toLowerCase())) continue
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const workMashup = new RegExp(`(?:worked|working|job|employed|work\\s+at|work\\s+for).{0,35}\\b${escaped}\\b|\\b${escaped}\\b.{0,25}(?:record store|print shop|warehouse|cafe|library|lab|shop|store)`, 'i')
    if (workMashup.test(reply)) return `invented biography: ${name} from the user question was turned into a workplace or employer`
  }
  if (supportMode) {
    const r = String(reply || '')
    if (/\b(it'?ll be okay|it will be okay|take a deep breath|tomorrow(?:'s| is) a new day|everything happens for a reason|look on the bright side|you(?:'re| are) more than your job|you can learn from this and grow|everyone makes mistakes|stay positive|you(?:'ve| have) got this)\b/i.test(r)) return 'canned reassurance or generic self-help'
    if (/\b(not a big deal|just move on|get over it)\b/i.test(r)) return 'minimizing the user emotional disclosure'
    const userContext = messages.filter((m) => m?.role === 'user').map((m) => String(m.content || '')).join(' ')
    if (/\b(you made a mistake|your mistake|everyone makes mistakes|learn from this)\b/i.test(r) && !/\b(mistake|wrong|forgot|error|fault|messed up|screwed up)\b/i.test(userContext)) return 'invented blame or mistake not stated by the user'
    const latest = latestUser(messages).toLowerCase()
    const noQuestionNeeded = /\b(just listen|just need to vent|let me vent|do not ask|don't ask|leave it alone)\b/.test(latest)
    if (!noQuestionNeeded && !r.includes('?')) return 'support reply closed the conversation instead of inviting the user to continue'
  }
  return null
}

export async function chatWithLocalGuideModel({ guide = 'bud', messages = [], onProgress, supportMode = false, lowEffortMode = false } = {}) {
  const character = GUIDE_CHARACTERS[guide] || GUIDE_CHARACTERS.bud
  const runtime = await loadLocalGuideModel({ onProgress })
  // Keep enough continuity for natural chat without making a small on-device
  // model re-prefill a long transcript every turn.
  const recent = messages.slice(-6).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || ''),
  }))
  const system = characterPrompt(character, recent, { supportMode, lowEffortMode })
  const options = { temperature: supportMode ? 0.55 : 0.68, top_p: 0.88, max_tokens: lowEffortMode ? 72 : 120 }
  let result
  try {
    result = await runtime.complete({ messages: [{ role: 'system', content: system }, ...recent], ...options }, { timeoutMs: 60000 })
  } catch (error) {
    rememberRuntimeError(error, 'inference')
    throw error
  }
  let turn = parseGeneratedGuideTurn(result?.choices?.[0]?.message?.content || '')
  let reply = turn.content
  let suggestions = turn.suggestions
  const violation = generatedReplyViolation(character, recent, reply, { supportMode })
  if (violation) {
    const correction = `${system}\nCORRECTION: A previous draft was rejected for ${violation}. Rewrite from scratch. Keep the answer lively and in character, but do not repeat that contradiction.`
    let retry
    try {
      retry = await runtime.complete({ messages: [{ role: 'system', content: correction }, ...recent], ...options }, { timeoutMs: 45000 })
    } catch (error) {
      rememberRuntimeError(error, 'retry')
      throw error
    }
    turn = parseGeneratedGuideTurn(retry?.choices?.[0]?.message?.content || '')
    reply = turn.content
    suggestions = turn.suggestions
    if (generatedReplyViolation(character, recent, reply, { supportMode })) return supportMode ? emotionalSupportFollowupResponse(guide, latestUser(recent)) : (character.unknown?.[0] || "I don't know that one.")
  }
  return encodeGeneratedGuideTurn(reply, suggestions)
}

export async function resetLocalGuideModelRuntime() {
  try {
    const engine = enginePromise ? await enginePromise : null
    await engine?.exit?.()
  } catch {}
  enginePromise = null
}

export function resetLocalGuideModelForTests() {
  enginePromise = null
  lastRuntimeError = null
}

export const localGuideModelInternals = { characterPrompt, timelineAnchor, generatedReplyViolation }
