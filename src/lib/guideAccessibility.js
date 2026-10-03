import { emotionalThreadState } from './guideSafety.js'

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
