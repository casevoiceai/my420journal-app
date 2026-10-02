import { buildGuideResponse } from './guideEngine.js'
import { semanticDecisionToCanonicalQuestion } from './guideSemanticModel.js'
import { classifyWithLocalGuideModel, chatWithLocalGuideModel } from './localGuideModel.js'

function latestUser(messages = []) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === 'user') return String(messages[i].content || '')
  }
  return ''
}

function forceControlledBoundary(text = '') {
  const t = text.toLowerCase()
  return /\b(diagnose|diagnosis|prescribe|prescription|dose|dosage|treat|treatment|what should i take|how much should i take)\b/.test(t)
    || /\b(recommend|recommendation|what should i buy|what should i get|best strain|best product|should i use|which strain)\b/.test(t)
}

function canonicalMessages(messages, canonicalQuestion) {
  if (!canonicalQuestion) return messages
  const copy = messages.map((m) => ({ ...m }))
  for (let i = copy.length - 1; i >= 0; i -= 1) {
    if (copy[i]?.role === 'user') { copy[i].content = canonicalQuestion; return copy }
  }
  return [...copy, { role: 'user', content: canonicalQuestion }]
}

export async function buildHybridGuideResponse({
  guide = 'bud', messages = [], entries = [], localModelEnabled = false, modelClient,
} = {}) {
  const deterministic = () => buildGuideResponse({ guide, messages, entries })
  if (!localModelEnabled || guide === 'stoner') return deterministic()
  if (forceControlledBoundary(latestUser(messages))) return deterministic()

  const client = modelClient || {
    classify: (payload) => classifyWithLocalGuideModel(payload),
    chat: (payload) => chatWithLocalGuideModel(payload),
  }

  try {
    const decision = await client.classify({ guide, messages })
    if (decision?.route !== 'general' && Number(decision?.confidence || 0) >= 0.55) {
      const canonical = semanticDecisionToCanonicalQuestion(decision)
      if (canonical) {
        return buildGuideResponse({
          guide,
          messages: canonicalMessages(messages, canonical),
          entries,
        })
      }
    }

    const generated = await client.chat({ guide, messages })
    return String(generated || '').trim() || deterministic()
  } catch {
    return deterministic()
  }
}

export const hybridGuideInternals = {
  forceControlledBoundary,
  canonicalMessages,
}
