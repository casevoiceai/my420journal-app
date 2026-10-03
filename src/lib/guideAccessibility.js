import { emotionalThreadState, detectGuideSafetyForConversation } from './guideSafety.js'

const GUIDE_PREFIX = Object.freeze({
  bud: 'No problem.', sunny: 'Yep, absolutely.', larry: 'No problem, man.',
  herb: 'Yep. Let us simplify the variables.', mary: 'Of course.', stoner: 'No problem.',
})

const GENERAL_CHOICES = Object.freeze([
  { id: 'continue', label: 'A. Keep talking about this', value: 'Keep talking about this. Ask me one easy question at a time.' },
  { id: 'think', label: 'B. Help me think it through', value: 'Help me think this through without putting words in my mouth.' },
  { id: 'distract', label: 'C. Change gears', value: 'Change the subject and distract me for a bit.' },
  { id: 'other', label: 'D. Something else', freeText: true },
])

const TOO_HIGH_CHOICES = Object.freeze([
  { id: 'safe', label: 'A. I’m somewhere safe', value: "I'm somewhere safe." },
  { id: 'unsure', label: 'B. I’m not sure', value: "I'm not sure if I'm somewhere safe." },
  { id: 'help', label: 'C. I need help', value: 'I need help right now.' },
  { id: 'other', label: 'D. Something else', freeText: true },
])
function normalize(text = '') {
  return String(text || '').toLowerCase().replace(/[’]/g, "'").replace(/\s+/g, ' ').trim()
}

export function accessibilityAction(text = '') {
  const t = normalize(text)
  if (/^(give me (?:more )?choices|give me options|choices please|multiple choice)[.! ]*$/.test(t)) return 'choices'
  if (/^(i forgot|i forgot what we were talking about|what were we talking about)[.!? ]*$/.test(t)) return 'recap'
  if (/^(make (?:that|it) simpler|simpler|say that simpler)[.! ]*$/.test(t)) return 'simplify'
  if (/^(i'?m|im|i am) too high(?: right now)?[.! ]*$/.test(t)) return 'too-high'
  return null
}

function recentUserTopics(messages = []) {
  return messages
    .filter((m) => m?.role === 'user' && !accessibilityAction(m.content))
    .map((m) => String(m.content || '').trim())
    .filter(Boolean)
    .slice(-2)
}

function previousAssistant(messages = []) {
  for (let i = messages.length - 2; i >= 0; i -= 1) {
    if (messages[i]?.role === 'assistant') return String(messages[i].content || '').trim()
  }
  return ''
}
function simplifyText(text = '') {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return 'I do not have anything to simplify yet.'
  const sentences = clean.match(/[^.!?]+[.!?]?/g) || [clean]
  const first = sentences.slice(0, 2).join(' ').trim()
  return first.length <= 220 ? first : `${first.slice(0, 217).trim()}...`
}

function seriousNoSilly(messages = []) {
  const text = messages.filter((m) => m?.role === 'user').slice(-2).map((m) => String(m.content || '')).join(' ')
  return /\b(died|death|funeral|grief|assault|abuse|violence|hurt me|suicide|self-harm|emergency|hospital|urgent care|panic attack|embarrassed|humiliated|anxious|lonely|upset|overwhelmed|rough day|shitty day|scared|ashamed)\b/i.test(text)
}

function lastQuestion(text = '') {
  const matches = String(text || '').match(/[^?]*\?/g)
  return matches?.at(-1)?.trim() || ''
}

function cleanChoiceLabel(value = '') {
  return String(value || '').replace(/^[,;:\s]+|[,;:\s?]+$/g, '').replace(/^(?:was|is|are|were) it\s+/i, '').replace(/^(?:do|did|would|could|should|can) you(?: rather)?\s+/i, '').replace(/^want to\s+/i, '').trim()
}

function explicitQuestionBranches(question = '') {
  const body = question.replace(/\?+$/, '').trim()
  const orMatch = body.match(/^(.{1,90}?)\s*,?\s+or\s+(.{1,90})$/i)
  if (orMatch) {
    const left = cleanChoiceLabel(orMatch[1])
    const right = cleanChoiceLabel(orMatch[2])
    if (left && right && left.toLowerCase() !== right.toLowerCase()) return [
      { id: 'option-1', label: left, value: left },
      { id: 'option-2', label: right, value: right },
    ]
  }
  if (/^(?:do|did|are|is|was|were|would|could|should|can|have|has)\b/i.test(body) || /^want to\b/i.test(body)) return [
    { id: 'yes', label: 'Yeah', value: 'Yeah.' },
    { id: 'no', label: 'Not really', value: 'Not really.' },
  ]
  return []
}

export function buildContextualBranches({ guide = 'bud', messages = [], assistantText = '', lowEffortMode = false } = {}) {
  const reply = String(assistantText || '').trim()
  if (!reply) return null
  const safety = detectGuideSafetyForConversation(messages)
  if (['level2', 'level3'].includes(safety.level) || lowEffortMode) return null
  const support = safety.level === 'emotional' || emotionalThreadState(messages).active
  const question = lastQuestion(reply)
  const longThread = messages.filter((m) => m?.role === 'user').length >= 3
  const utility = reply.length > 260
    ? { id: 'simplify', label: 'Make that simpler', value: 'Make that simpler.' }
    : longThread ? { id: 'recap', label: 'Remind me where we were', value: 'I forgot what we were talking about.' } : null

  if (!question) return utility ? [utility] : null

  let choices = []
  if (support) {
    if (/want to tell me|what (?:happened|part)|what has you worried|what's bothering|what is bothering|how (?:are|do) you feel/i.test(question)) choices = [
      { id: 'vent', label: 'Let me vent', value: 'I just want to vent. Do not try to fix it yet.' },
      { id: 'sort', label: 'Help me sort it out', value: 'Help me sort out what happened without putting words in my mouth.' },
    ]
    else if (/what do you want|what outcome|what would help/i.test(question)) choices = [
      { id: 'heard', label: 'I want to be heard', value: 'I mostly want to be heard.' },
      { id: 'change', label: 'I want something to change', value: 'I want something to change.' },
      { id: 'unsure', label: "I'm not sure yet", value: "I'm not sure what I want yet." },
    ]
    else choices = explicitQuestionBranches(question)
  } else choices = explicitQuestionBranches(question)

  if ((support || seriousNoSilly(messages)) && choices.length > 0 && choices.length < 3) {
    choices.push({ id: 'company', label: 'Just stay with me', value: 'Just stay with me for a minute. Keep it simple and do not try to fix anything yet.' })
  }
  if (utility && choices.length < 5) choices.push(utility)
  if (choices.length === 0) return null
  return choices.slice(0, 5)
}

export function buildModelSuggestedBranches({ messages = [], assistantText = '', suggestions = [], lowEffortMode = false } = {}) {
  const reply = String(assistantText || '').trim()
  if (!reply || lowEffortMode) return null
  const safety = detectGuideSafetyForConversation(messages)
  if (safety.level !== 'normal' || emotionalThreadState(messages).active || seriousNoSilly(messages)) return null
  const blocked = /^(?:tell me more|keep talking|keep talking about this|help me think(?: it)? through|change gears|something else|i(?:'|’)ll say it myself|say it myself|larry'?s ridiculous theory)$/i
  const clean = []
  for (const raw of Array.isArray(suggestions) ? suggestions : []) {
    const label = String(raw || '').replace(/^[A-E]\.\s*/i, '').replace(/\s+/g, ' ').trim()
    if (label.length < 2 || label.length > 64 || blocked.test(label)) continue
    if (clean.some((item) => item.toLowerCase() === label.toLowerCase())) continue
    clean.push(label)
    if (clean.length === 5) break
  }
  if (!clean.length) return null
  return clean.map((label, index) => ({ id: `ai-${index + 1}`, label, value: label }))
}

export function buildAccessibilityTurn({ guide = 'bud', messages = [], action } = {}) {
  const prefix = GUIDE_PREFIX[guide] || GUIDE_PREFIX.bud
  if (action === 'choices') {
    const support = emotionalThreadState(messages).active
    return support ? null : {
      content: `${prefix} Pick what feels easiest right now.`,
      choices: GENERAL_CHOICES.map((choice) => ({ ...choice })),
    }
  }
  if (action === 'recap') {
    const topics = recentUserTopics(messages)
    if (!topics.length) return { content: `${prefix} We have not really gotten into anything yet.` }
    const recap = topics.map((topic) => `“${topic}”`).join(' Then you said ')
    return { content: `${prefix} You were talking about ${recap}. Want to pick it up there or change subjects?` }
  }
  if (action === 'simplify') {
    const prior = previousAssistant(messages)
    return { content: `${prefix} Short version: ${simplifyText(prior)}` }
  }
  if (action === 'too-high') {
    const line = guide === 'larry'
      ? 'Okay. We can keep this real simple. Are you somewhere safe right now?'
      : 'Okay. We can keep this simple. Are you somewhere safe right now?'
    return { content: line, choices: TOO_HIGH_CHOICES.map((choice) => ({ ...choice })), lowEffortMode: true }
  }
  return null
}

export const guideAccessibilityInternals = {
  normalize,
  simplifyText,
  recentUserTopics,
  previousAssistant,
}
