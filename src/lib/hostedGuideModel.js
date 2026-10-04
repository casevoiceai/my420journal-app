import { normalizeSemanticDecision } from './guideSemanticModel.js'

const ENABLED_KEY = 'my420journal_local_v1:hosted_guide_conversation_enabled'
const ENDPOINT = '/api/guide-conversation'

let lastRuntimeError = null

function rememberRuntimeError(error, phase) {
  lastRuntimeError = {
    phase,
    name: String(error?.name || 'Error'),
    message: String(error?.message || error || 'Unknown hosted Guide error').slice(0, 240),
  }
}

export function clearLastHostedGuideRuntimeError() {
  lastRuntimeError = null
}

export function getLastHostedGuideRuntimeError() {
  return lastRuntimeError ? { ...lastRuntimeError } : null
}

export function isHostedGuideEnabled(storage = globalThis?.localStorage) {
  try { return storage?.getItem(ENABLED_KEY) === 'true' } catch { return false }
}

export function setHostedGuideEnabled(enabled, storage = globalThis?.localStorage) {
  try {
    storage?.setItem(ENABLED_KEY, enabled ? 'true' : 'false')
    return true
  } catch {
    return false
  }
}

export function parseGeneratedGuideTurn(raw = '') {
  const text = String(raw || '').trim()
  const match = text.match(/\n?\[\[BRANCHES:(\[[\s\S]*?\])\]\]\s*$/)
  if (!match) return { content: text, suggestions: [] }
  let suggestions = []
  try {
    const parsed = JSON.parse(match[1])
    if (Array.isArray(parsed)) {
      suggestions = parsed.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 5)
    }
  } catch {}
  return { content: text.slice(0, match.index).trim(), suggestions }
}

async function requestHostedGuide(body) {
  let response
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch (error) {
    rememberRuntimeError(error, body?.mode || 'request')
    throw error
  }

  let payload = null
  try { payload = await response.json() } catch {}
  if (!response.ok) {
    const error = new Error(payload?.error || `Guide service returned ${response.status}`)
    rememberRuntimeError(error, body?.mode || 'request')
    throw error
  }
  return payload || {}
}

export async function classifyWithHostedGuideModel({ guide = 'bud', messages = [] } = {}) {
  try {
    const payload = await requestHostedGuide({ mode: 'classify', guide, messages })
    return normalizeSemanticDecision(payload?.decision || payload)
  } catch (error) {
    rememberRuntimeError(error, 'classification')
    throw error
  }
}

export async function chatWithHostedGuideModel({
  guide = 'bud', messages = [], lowEffortMode = false, contextFacts = [],
} = {}) {
  try {
    const payload = await requestHostedGuide({
      mode: 'chat',
      guide,
      messages,
      lowEffortMode: lowEffortMode === true,
      contextFacts: Array.isArray(contextFacts) ? contextFacts : [],
    })
    return String(payload?.content || '').trim()
  } catch (error) {
    rememberRuntimeError(error, 'inference')
    throw error
  }
}

export const hostedGuideModelInternals = Object.freeze({ endpoint: ENDPOINT, enabledKey: ENABLED_KEY })
