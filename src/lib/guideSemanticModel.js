const ROUTES = new Set(['journal', 'cannabis', 'character', 'general'])

const INTENTS = new Set([
  'latest_entry', 'entry_count', 'product_summary', 'product_effects',
  'product_count', 'product_latest', 'product_amount', 'product_notes', 'compare_products',
  'cannabis_summary', 'cannabis_lineage', 'cannabis_type', 'cannabis_aroma',
  'identity', 'age', 'birthday', 'hometown', 'residence', 'family', 'hobbies', 'dislikes',
  'former_spouse_summary', 'former_spouse_status', 'former_spouse_personality',
  'former_spouse_breakup', 'former_spouse_duration', 'former_spouse_current',
  'story', 'boredom', 'guide_relationship', 'topic_preference', 'general_chat', 'unknown',
])

function clean(value = '') {
  return String(value ?? '').trim().replace(/\s+/g, ' ')
}

export function normalizeSemanticDecision(value = {}) {
  const route = ROUTES.has(value.route) ? value.route : 'general'
  const intent = INTENTS.has(value.intent) ? value.intent : 'unknown'
  const entity = clean(value.entity) || null
  const secondaryEntity = clean(value.secondary_entity) || null
  const confidence = Number.isFinite(Number(value.confidence))
    ? Math.max(0, Math.min(1, Number(value.confidence)))
    : 0
  return { route, intent, entity, secondaryEntity, confidence }
}
function quoted(value) {
  return clean(value).replace(/[?.!]+$/, '')
}

export function semanticDecisionToCanonicalQuestion(decision = {}) {
  const d = normalizeSemanticDecision(decision)
  const e = quoted(d.entity || '')
  const e2 = quoted(d.secondaryEntity || '')

  const character = {
    identity: 'tell me about yourself', age: 'how old are you?', birthday: 'when is your birthday?',
    hometown: 'where are you from?', residence: 'where do you live?', family: 'tell me about your family',
    hobbies: 'what are your hobbies?', dislikes: 'what do you dislike?',
    former_spouse_summary: 'tell me about your ex', former_spouse_status: 'are you divorced or widowed?',
    former_spouse_personality: 'what was she like?', former_spouse_breakup: 'why did you divorce?',
    former_spouse_duration: 'how long were you married?', former_spouse_current: 'do you still talk?',
    story: 'tell me a story', boredom: "I'm bored",
    guide_relationship: e ? `what do you think of ${e}?` : '',
    topic_preference: e ? `do you like ${e}?` : '',
  }
  if (d.route === 'character' && character[d.intent]) return character[d.intent]

  if (d.route === 'journal') {
    if (d.intent === 'latest_entry') return 'show me my latest journal entry'
    if (d.intent === 'entry_count') return 'how many journal entries do I have?'
    if (d.intent === 'compare_products' && e && e2) return `compare ${e} versus ${e2}`
    if (!e) return ''
    if (d.intent === 'product_effects') return `what effects did I record for ${e}?`
    if (d.intent === 'product_count') return `how many times did I use ${e}?`
    if (d.intent === 'product_latest') return `when did I last use ${e}?`
    if (d.intent === 'product_amount') return `how much ${e} did I use?`
    if (d.intent === 'product_notes') return `what did I write about ${e}?`
    return `what did I record about ${e}?`
  }
  if (d.route === 'cannabis') {
    if (!e) return d.intent === 'cannabis_summary' ? 'tell me about cannabis' : ''
    if (d.intent === 'cannabis_lineage') return `where did ${e} come from?`
    if (d.intent === 'cannabis_type') return `what kind of strain is ${e}?`
    if (d.intent === 'cannabis_aroma') return `what does ${e} usually smell like?`
    return `tell me about ${e}`
  }
  return ''
}

export function buildSemanticClassifierPrompt({ guideName = 'Guide', recentMessages = [] } = {}) {
  const transcript = recentMessages.slice(-6).map((m) => `${m.role}: ${clean(m.content)}`).join('\n')
  return [
    'Classify the latest user message for a private local journal chatbot.',
    `Current Guide: ${guideName}.`,
    'Return JSON only with: route, intent, entity, secondary_entity, confidence.',
    'route must be journal, cannabis, character, or general.',
    'Use character for questions about the Guide as a person, biography, tastes, family, or relationships.',
    'Use journal only for the user\'s own stored experiences or entries.',
    'Use cannabis for general cannabis facts, cultivars, cannabinoids, terpenes, forms, history, or terminology.',
    'Use general for everything else: ordinary knowledge, opinions, conversation, jokes, culture, science, history, etc.',
    `Supported intents: ${Array.from(INTENTS).join(', ')}.`,
    'Do not answer the question. Do not invent facts. Only classify it.',
    transcript ? `Recent conversation:\n${transcript}` : '',
  ].filter(Boolean).join('\n')
}

export const semanticModelContract = Object.freeze({
  routes: [...ROUTES],
  intents: [...INTENTS],
})
