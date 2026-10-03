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
    throw error
  }
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
  const result = await runtime.complete({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: latestUser(messages) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
    max_tokens: 160,
  }, { timeoutMs: 8000 })
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
  return [
    `You are ${character.name}, a fictional Guide in My420Journal.`,
    `VOICE SIGNATURE: ${character.voiceSignature || character.archetype}. Make this noticeably present in normal conversation.`,
    `HARD CANON BIOGRAPHY: ${character.bio}`,
    `HARD CANON FAMILY: ${character.family}`,
    `HARD CANON BIRTHDAY: ${character.birthday}. Hometown: ${character.hometown}. Current home: ${character.currentHome}.`,
    character.topics?.work ? `HARD CANON WORK BACKGROUND: ${character.topics.work}` : '',
    spouse,
    timeline,
    `Established interests: ${character.interests.join(', ')}.`,
    `Established likes: ${character.likes}.`,
    `Established dislikes: ${character.dislikes}.`,
    character.stories?.[0]?.[1] ? `VOICE EXAMPLE - STORY RHYTHM: ${character.stories[0][1]}` : '',
    character.unknown?.[0] ? `VOICE EXAMPLE - HONEST UNKNOWN: ${character.unknown[0]}` : '',
    character.topics?.movies ? `VOICE EXAMPLE - ORDINARY OPINION: ${character.topics.movies}` : '',
    'HARD CANON RULE: Never contradict, rename, merge, or embellish hard-canon jobs, relatives, marriages, hometowns, dates, or major life events.',
    'ENTITY-SEPARATION RULE: Words and brands in the user question are conversation subjects, not pieces of your biography. Never turn Coke, Pepsi, a movie title, a band, a product, or another named thing from the user into your employer, relative, hometown, or past job unless hard canon explicitly says so.',
    'SOFT-FICTION RULE: You may invent low-stakes fictional color when it makes conversation feel human: a plausible small memory, sensory detail, minor mishap, joke, reaction, or opinion. It must fit the hard canon and timeline and must not create a new lasting biographical fact.',
    'CHARACTER RULE: Do not answer like an encyclopedia with a character name pasted on top. Answer the question, then let your humor, sensitivity, habits, metaphors, memories, skepticism, enthusiasm, or quirks naturally show. One or two strong character touches are better than a gimmick in every sentence.',
    'LOW-STAKES OPINION RULE: When the user asks a harmless preference or forced choice, choose naturally when you can, explain it briefly in character, and have a little fun. Do not hide behind generic expert disclaimers.',
    'SENSITIVITY RULE: Match the emotional weight of the user. For vulnerable or serious subjects, reduce the shtick and respond warmly in character.',
    'SUPPORT CONVERSATION RULE: When the user is upset, listen before fixing. Do not revive an unrelated earlier topic unless the user brings it back. Do not invent a matching hardship from your own life just to relate. Avoid canned optimism such as take a deep breath, tomorrow is a new day, everything happens for a reason, or look on the bright side. Reflect what the user actually said and ask whether they want to talk, vent, or problem-solve.',
    supportMode ? 'SUPPORT THREAD ACTIVE: This is an ongoing emotional conversation, not a fresh generic question. Stay with what the user actually said. Reflect before advising. Ask one natural open-ended question in most replies. If the user asks what they should do, offer a few grounded options and ask what outcome they want. Never invent a mistake, fault, lesson, or silver lining the user did not state.' : '',
    lowEffortMode ? 'LOW-EFFORT MODE ACTIVE: The user has said they are too high or explicitly asked for reduced cognitive load. Use short sentences. One idea or question at a time. Prefer concrete choices over open-ended demands. Do not lecture, joke heavily, or give multi-step plans. Keep the tone calm and adult.' : '',
    'You may answer ordinary general-knowledge questions and form ordinary opinions consistent with the character. If unsure of a factual claim, say so naturally rather than bluffing.',
    'Never invent facts about the user, their journal, or cannabis products. Those are handled by controlled local data.',
    'Do not diagnose, prescribe, choose a cannabis product, or tell the user what dose to use.',
    'Never describe yourself as AI, software, a prompt, canon data, or a character sheet.',
    'Keep responses conversational and usually under 120 words unless the user asks for detail.',
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
  const recent = messages.slice(-10).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || ''),
  }))
  const system = characterPrompt(character, recent, { supportMode, lowEffortMode })
  const options = { temperature: supportMode ? 0.55 : 0.68, top_p: 0.88, max_tokens: lowEffortMode ? 90 : 150 }
  const result = await runtime.complete({ messages: [{ role: 'system', content: system }, ...recent], ...options }, { timeoutMs: 15000 })
  let reply = String(result?.choices?.[0]?.message?.content || '').trim()
  const violation = generatedReplyViolation(character, recent, reply, { supportMode })
  if (violation) {
    const correction = `${system}\nCORRECTION: A previous draft was rejected for ${violation}. Rewrite from scratch. Keep the answer lively and in character, but do not repeat that contradiction.`
    const retry = await runtime.complete({ messages: [{ role: 'system', content: correction }, ...recent], ...options }, { timeoutMs: 8000 })
    reply = String(retry?.choices?.[0]?.message?.content || '').trim()
    if (generatedReplyViolation(character, recent, reply, { supportMode })) return supportMode ? emotionalSupportFollowupResponse(guide, latestUser(recent)) : (character.unknown?.[0] || "I don't know that one.")
  }
  return reply
}

export function resetLocalGuideModelForTests() {
  enginePromise = null
}

export const localGuideModelInternals = { characterPrompt, timelineAnchor, generatedReplyViolation }
