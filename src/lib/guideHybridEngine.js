import { buildGuideResponse } from './guideEngine.js'
import { semanticDecisionToCanonicalQuestion } from './guideSemanticModel.js'
import { classifyWithLocalGuideModel, chatWithLocalGuideModel } from './localGuideModel.js'
import { lookupCannabisKnowledge } from './cannabisKnowledge.js'
import {
  detectGuideSafetyForConversation,
  emotionalSupportResponse,
  crisisResponse,
  activateCrisisFollowup,
  conversationAfterEmotionalShift,
  emotionalThreadState,
  emotionalSupportFollowupResponse,
  readCrisisFollowup,
  clearCrisisFollowup,
  isCrisisFollowupDismissal,
} from './guideSafety.js'

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

function normalizeText(value = '') {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

const CONVERSATIONAL_SETUP_REQUIRED = 'Natural conversation is not set up on this device yet. Use Set up conversational Guides below, or ask me about your journal or reviewed cannabis information.'
const CONVERSATIONAL_MODEL_UNAVAILABLE = 'Conversational mode could not start on this device. You can still ask me about your journal or reviewed cannabis information.'

function controlledWithoutConversationModel(text = '', entries = []) {
  const t = normalizeText(text)
  if (!t) return false
  if (lookupCannabisKnowledge(text)) return true
  if (/\b(my journal|journal|entries?|logged|recorded|my notes?|what did i|did i|when did i|how many times did i)\b/.test(t)) return true
  if (/\b(cannabis|weed|marijuana|strain|cultivar|thc|cbd|terpene|terpenes|indica|sativa|hybrid|edible|edibles|vape|flower|dab|concentrate|rosin|resin)\b/.test(t)) return true
  return entries.some((entry) => {
    const name = normalizeText(entry?.product_name)
    return Boolean(name && t.includes(name))
  })
}

function journalDecisionIsGrounded(decision = {}, text = '', entries = []) {
  if (decision?.route !== 'journal') return true
  const t = normalizeText(text)
  const explicitJournalCue = /\b(my journal|journal|entries?|logged|recorded|what did i|did i|when did i|how many times did i|my notes?)\b/.test(t)
  if (['latest_entry', 'entry_count'].includes(decision?.intent)) return explicitJournalCue
  const names = new Set(entries.map((entry) => normalizeText(entry?.product_name)).filter(Boolean))
  const primary = normalizeText(decision?.entity)
  const secondary = normalizeText(decision?.secondaryEntity || decision?.secondary_entity)
  if (decision?.intent === 'compare_products') return explicitJournalCue || (names.has(primary) && names.has(secondary))
  return explicitJournalCue || Boolean(primary && names.has(primary))
}


function needsSemanticClassification(text = '', entries = []) {
  const t = normalizeText(text)
  if (!t) return false
  if (lookupCannabisKnowledge(text)) return true
  if (/\b(my journal|journal|entries?|logged|recorded|my notes?|what did i|did i|when did i|how many times did i)\b/.test(t)) return true
  if (/\b(cannabis|weed|marijuana|strain|cultivar|thc|cbd|terpene|terpenes|indica|sativa|hybrid|edible|edibles|vape|flower|dab|concentrate|rosin|resin)\b/.test(t)) return true
  // Ambiguous personal-experience follow-ups may need journal disambiguation,
  // but ordinary uses of "me" should stay conversational.
  if (/\b(?:did|does|do|how did|how does|what did)\b.{0,50}\b(?:me|my)\b/.test(t)) return true
  if (entries.some((entry) => {
    const name = normalizeText(entry?.product_name)
    return Boolean(name && t.includes(name))
  })) return true
  // First-person pronouns are normal conversation, not evidence that the user
  // is asking for journal/personal-data routing. "Tell me something random"
  // must go straight to the conversational Guide instead of burning a model
  // classification pass just because it contains "me".
  if (/\b(wife|husband|spouse|married|marriage|family|children|kids|career|hometown|birthday)\b/.test(t)) return true
  if (/\b(how old are you|where do you live|where were you born|what do you do for work|your job)\b/.test(t)) return true
  return false
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
  guide = 'bud', messages = [], entries = [], localModelEnabled = false, lowEffortMode = false, modelClient,
} = {}) {
  const userText = latestUser(messages)
  const activeCrisis = readCrisisFollowup()
  if (activeCrisis && isCrisisFollowupDismissal(userText)) {
    clearCrisisFollowup()
    return "Okay. I’ll stop the extra check-ins. If that changes, tell me."
  }
  const safety = detectGuideSafetyForConversation(messages)
  const emotionalThread = emotionalThreadState(messages)
  const scopedMessages = conversationAfterEmotionalShift(messages)
  const deterministic = (inputMessages = scopedMessages) => buildGuideResponse({ guide, messages: inputMessages, entries })
  if (safety.level === 'emotional') return emotionalSupportResponse(guide)
  if (safety.level === 'level2' || safety.level === 'level3') {
    if (!activeCrisis) activateCrisisFollowup({ guide, level: safety.level })
    return crisisResponse(guide, safety)
  }

  const supportMode = safety.level === 'normal' && emotionalThread.active
  if (forceControlledBoundary(userText)) return deterministic()
  // Emotional support must be immediate. Do not make a distressed or intoxicated user wait on local-model inference.
  if (supportMode) return emotionalSupportFollowupResponse(guide, userText)
  if (guide === 'stoner') return deterministic()
  if (!localModelEnabled) {
    if (controlledWithoutConversationModel(userText, entries)) return deterministic()
    return CONVERSATIONAL_SETUP_REQUIRED
  }

  const client = modelClient || {
    classify: (payload) => classifyWithLocalGuideModel(payload),
    chat: (payload) => chatWithLocalGuideModel(payload),
  }

  try {
    if (needsSemanticClassification(latestUser(scopedMessages), entries)) {
      const decision = await client.classify({ guide, messages: scopedMessages })
      const grounded = journalDecisionIsGrounded(decision, latestUser(scopedMessages), entries)
      const conversationalPreference = decision?.route === 'character' && decision?.intent === 'topic_preference'
      if (grounded && !conversationalPreference && decision?.route !== 'general' && Number(decision?.confidence || 0) >= 0.55) {
        const canonical = semanticDecisionToCanonicalQuestion(decision)
        if (canonical) {
          return buildGuideResponse({ guide, messages: canonicalMessages(scopedMessages, canonical), entries })
        }
      }
    }
    const generated = await client.chat({ guide, messages: scopedMessages, lowEffortMode })
    const content = String(generated || '').trim()
    if (content) return content
    return controlledWithoutConversationModel(userText, entries) ? deterministic() : CONVERSATIONAL_MODEL_UNAVAILABLE
  } catch {
    return controlledWithoutConversationModel(userText, entries) ? deterministic() : CONVERSATIONAL_MODEL_UNAVAILABLE
  }
}

export const hybridGuideInternals = {
  forceControlledBoundary,
  canonicalMessages,
  journalDecisionIsGrounded,
  needsSemanticClassification,
}
