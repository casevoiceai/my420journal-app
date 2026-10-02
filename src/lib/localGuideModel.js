import { GUIDE_CHARACTERS } from './guideCharacters.js'
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
  })
  const content = result?.choices?.[0]?.message?.content || '{}'
  try { return normalizeSemanticDecision(JSON.parse(content)) } catch { return normalizeSemanticDecision() }
}

function characterPrompt(character) {
  const spouse = character.formerSpouse
    ? `Former spouse: ${character.formerSpouse.status} ${character.formerSpouse.summary}`
    : ''
  return [
    `You are ${character.name}, a fictional Guide in My420Journal.`,
    `Core biography: ${character.bio}`,
    `Family: ${character.family}`,
    `Interests: ${character.interests.join(', ')}.`,
    `Likes: ${character.likes}.`,
    `Dislikes: ${character.dislikes}.`,
    spouse,
    'Speak like a real person in this established character, not like software or a character sheet.',
    'You may answer ordinary general-knowledge questions and express normal opinions consistent with this character.',
    'Never invent new biographical events, relatives, dates, jobs, medical history, or cannabis experiences for the Guide.',
    'Never invent facts about the user, their journal, or cannabis products. Those are handled by controlled local data.',
    'If asked for a missing personal biographical fact, say you do not know or have never settled that detail, naturally in character.',
    'Do not diagnose, prescribe, choose a cannabis product, or tell the user what dose to use.',
    'Keep responses conversational and usually under 120 words unless the user asks for detail.',
  ].filter(Boolean).join('\n')
}

export async function chatWithLocalGuideModel({ guide = 'bud', messages = [], onProgress } = {}) {
  const character = GUIDE_CHARACTERS[guide] || GUIDE_CHARACTERS.bud
  const runtime = await loadLocalGuideModel({ onProgress })
  const recent = messages.slice(-10).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || ''),
  }))
  const result = await runtime.complete({
    messages: [{ role: 'system', content: characterPrompt(character) }, ...recent],
    temperature: 0.75,
    top_p: 0.9,
    max_tokens: 220,
  })
  return String(result?.choices?.[0]?.message?.content || '').trim()
}

export function resetLocalGuideModelForTests() {
  enginePromise = null
}
