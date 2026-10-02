const VOICES = {
  bud: {
    greeting: 'Hey. Good to see you. Logging something, looking something up, or just checking in?',
    checkin: 'Doing alright. How are you doing? We can log something, look something up, or just check in.',
    questionPrompt: 'Sure. What is your question?',
    clarify: 'I am with you. Are you asking about something in your journal, or are we logging something new?',
    thanks: 'Anytime. That is what I am here for.',
    goodbye: 'Alright. Catch you next time.',
  },
  sunny: {
    greeting: 'Hey! Good to see you. Want to log something, look something up, or just check in?',
    checkin: 'I am good. How are you doing today? We can log something or just talk through what you recorded.',
    questionPrompt: 'Of course. What is your question?',
    clarify: 'I am with you. Is this about something you already recorded, or something new you want to talk through?',
    thanks: 'Of course. I am glad I could help.',
    goodbye: 'Take care of yourself. I will be here when you come back.',
  },
  larry: {
    greeting: 'Hey. Good to see you. Logging something, looking something up, or just checking in?',
    checkin: 'Still kicking. How are you doing? We can log something, look something up, or just check in.',
    questionPrompt: 'Sure. Fire away. What is your question?',
    clarify: 'I am with you. Is this about something in your journal, or are we logging something new?',
    thanks: 'You got it.',
    goodbye: 'Alright. Stay easy. I will be here.',
  },
  herb: {
    greeting: 'Hey. What are we working with today: a product, an effect, or an old entry?',
    checkin: 'Doing well. How are you? We can look at a product, an effect, or something you already recorded.',
    questionPrompt: 'Sure. What is the question?',
    clarify: 'I am with you. Are we looking at a product you recorded, an effect, or a new experience?',
    thanks: 'Happy to help.',
    goodbye: 'Good session. Come back when you have more to compare.',
  },
  mary: {
    greeting: 'Hey. How are you doing? We can log something, review your journal, or just check in.',
    checkin: 'I am here and doing well. How are you feeling today?',
    questionPrompt: 'Of course. What is your question?',
    clarify: 'I am with you. Is this about something in your journal, or something new you want to talk through?',
    thanks: 'You are welcome. Take care of yourself.',
    goodbye: 'Take care. I will be here when you need your journal again.',
  },
}

const HELP = 'I can help you log an experience, pull up what you recorded, compare two products already in your journal, or count your entries.'
const FALLBACK = "I'm not sure what you want me to do with that. I can help you log an experience, look something up in your journal, compare two recorded products, or check in."
const RECOMMENDATION_REFUSAL = "I don't choose products for you. I can show you what you recorded about products you have already tried."
const MEDICAL_REFUSAL = "I can't diagnose, prescribe, or tell you what dose to use. I can help you review what you recorded in your own journal."
const GENERAL_CANNABIS_BOUNDARY = "I can chat with you about what you have recorded in your journal, but I do not have general cannabis facts built into the Guide yet. If your question is about something you logged, tell me the product or entry."

const EFFECT_WORDS = [
  ['relaxed', 'Relaxed'], ['heavy', 'Heavy'], ['floaty', 'Floaty'], ['pain relief', 'Pain Relief'],
  ['energized', 'Energized'], ['tense', 'Tense'], ['tingly', 'Tingly'], ['numb', 'Numb'],
  ['tired', 'Tired'], ['sleepy', 'Sleepy'], ['focused', 'Focused'], ['clear', 'Clear'],
  ['scattered', 'Scattered'], ['introspective', 'Introspective'], ['creative', 'Creative'],
  ['anxious', 'Anxious'], ['giggly', 'Giggly'], ['racing', 'Racing'], ['foggy', 'Foggy'],
  ['paranoid', 'Paranoid'], ['happy', 'Happy'], ['uplifted', 'Uplifted'], ['calm', 'Calm'],
  ['motivated', 'Motivated'], ['content', 'Content'], ['irritable', 'Irritable'],
  ['disconnected', 'Disconnected'], ['everything is funny', 'Everything Is Funny'],
]

function voiceFor(guide) {
  return VOICES[guide] || VOICES.bud
}

function clean(value = '') {
  return String(value).trim().replace(/\s+/g, ' ')
}

function lower(value = '') {
  return clean(value).toLowerCase()
}

function entryProduct(entry) {
  return clean(entry?.product_name || '')
}

function productCatalog(entries = []) {
  const names = new Map()
  for (const entry of entries) {
    const name = entryProduct(entry)
    if (name) names.set(name.toLowerCase(), name)
  }
  return [...names.values()].sort((a, b) => b.length - a.length)
}

function productsInText(text, entries = []) {
  const haystack = lower(text)
  return productCatalog(entries).filter((name) => haystack.includes(name.toLowerCase()))
}

function latestProductFromHistory(messages = [], entries = []) {
  for (let i = messages.length - 2; i >= 0; i -= 1) {
    const found = productsInText(messages[i]?.content, entries)
    if (found.length) return found[0]
  }
  return null
}

function formatDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function tagSummary(entries) {
  const counts = new Map()
  for (const entry of entries) {
    for (const tag of [...(entry.body_tags || []), ...(entry.mind_tags || []), ...(entry.mood_tags || [])]) {
      counts.set(tag, (counts.get(tag) || 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([tag, count]) => count > 1 ? `${tag} (${count})` : tag)
}

function entriesForProduct(product, entries = []) {
  const needle = lower(product)
  return entries
    .filter((entry) => lower(entryProduct(entry)) === needle)
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
}

function summarizeProduct(product, entries = []) {
  const matches = entriesForProduct(product, entries)
  if (!matches.length) return `I do not see ${product} in your local journal.`
  const latest = matches[0]
  const parts = [`You have ${matches.length} ${matches.length === 1 ? 'entry' : 'entries'} for ${product}.`]
  const date = formatDate(latest.created_at)
  if (date) parts.push(`Latest: ${date}.`)
  if (latest.amount) parts.push(`Amount: ${latest.amount}.`)
  if (latest.category) parts.push(`Category: ${latest.category}.`)
  const tags = tagSummary(matches)
  if (tags.length) parts.push(`Recorded effects: ${tags.join(', ')}.`)
  if (latest.notes) parts.push(`Latest note: Ã¢â‚¬Å“${clean(latest.notes).slice(0, 220)}Ã¢â‚¬Â`)
  return parts.join(' ')
}

function summarizeLatest(entries = []) {
  const sorted = [...entries].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
  const latest = sorted[0]
  if (!latest) return 'Your local journal does not have any entries yet.'
  const product = entryProduct(latest) || 'that entry'
  const parts = [`Your latest entry is ${product}.`]
  const date = formatDate(latest.created_at)
  if (date) parts.push(`Recorded ${date}.`)
  if (latest.amount) parts.push(`Amount: ${latest.amount}.`)
  const tags = tagSummary([latest])
  if (tags.length) parts.push(`Effects: ${tags.join(', ')}.`)
  if (latest.notes) parts.push(`Note: Ã¢â‚¬Å“${clean(latest.notes).slice(0, 220)}Ã¢â‚¬Â`)
  return parts.join(' ')
}

function compareProducts(first, second, entries = []) {
  const a = entriesForProduct(first, entries)
  const b = entriesForProduct(second, entries)
  if (!a.length || !b.length) return 'I need both products to exist in your local journal before I can compare what you recorded.'
  const aTags = tagSummary(a)
  const bTags = tagSummary(b)
  const aText = `${first}: ${a.length} ${a.length === 1 ? 'entry' : 'entries'}${aTags.length ? `; effects ${aTags.join(', ')}` : ''}.`
  const bText = `${second}: ${b.length} ${b.length === 1 ? 'entry' : 'entries'}${bTags.length ? `; effects ${bTags.join(', ')}` : ''}.`
  return `${aText} ${bText} That is a comparison of your recorded history, not a recommendation.`
}

function detectedEffects(text) {
  const haystack = lower(text)
  return EFFECT_WORDS.filter(([needle]) => haystack.includes(needle)).map(([, label]) => label)
}

function questionTopic(text) {
  const source = clean(text)
  const patterns = [
    /\b(?:i\s+(?:have|got)\s+|i['’]ve\s+got\s+)?(?:a\s+)?question\s+about\s+(.{2,100})$/i,
    /\bcan\s+i\s+ask\s+(?:you\s+)?(?:a\s+)?question\s+about\s+(.{2,100})$/i,
    /\bcan\s+i\s+ask\s+(?:you\s+)?about\s+(.{2,100})$/i,
  ]
  for (const pattern of patterns) {
    const match = source.match(pattern)
    if (!match) continue
    return clean(match[1].split(/\b(?:because|but|and then)\b/i)[0].replace(/[.!?]+$/, '')) || null
  }
  return null
}

function directAboutTopic(text) {
  const source = clean(text)
  const match = source.match(/\b(?:what\s+do\s+you\s+know\s+about|tell\s+me\s+about|what\s+about)\s+(.{2,100})$/i)
  if (!match) return null
  return clean(match[1].replace(/[.!?]+$/, '')) || null
}

function topicFromHistory(messages = [], entries = []) {
  for (let i = messages.length - 2; i >= 0; i -= 1) {
    if (messages[i]?.role !== 'user') continue
    const content = messages[i]?.content || ''
    const known = productsInText(content, entries)
    if (known.length) return known[0]
    const topic = questionTopic(content) || directAboutTopic(content) || introducedProduct(content)
    if (topic) return topic
  }
  return null
}

function canonicalJournalProduct(topic, entries = []) {
  if (!topic) return null
  const needle = lower(topic)
  return productCatalog(entries).find((name) => lower(name) === needle) || null
}

function topicQuestionPrompt(guide, topic, entries = []) {
  const known = canonicalJournalProduct(topic, entries)
  const label = known || topic
  if (guide === 'larry') return `Sure. What do you want to know about ${label}?`
  if (guide === 'sunny') return `Of course. What do you want to know about ${label}?`
  if (guide === 'mary') return `Of course. What would you like to know about ${label}?`
  if (guide === 'herb') return `Sure. What do you want to know about ${label}?`
  return `Sure. What do you want to know about ${label}?`
}

function topicBoundary(topic) {
  if (!topic) return GENERAL_CANNABIS_BOUNDARY
  return `I can talk with you about ${topic} from your journal, but I do not have general cannabis facts built into the Guide yet. If you logged it, ask me what you recorded, how it felt, when you used it, or how often.`
}

function answerJournalTopicQuestion(text, topic, entries = []) {
  if (!topic) return null
  const product = canonicalJournalProduct(topic, entries) || topic
  const matches = entriesForProduct(product, entries)
  const t = lower(text)
  const asksJournalFact = /\b(did i like|what did i think|how was it|what effects|how did it (?:feel|make me feel)|what did i feel|how many times|when did i|when was the last|last time|how much|what amount|what did i (?:write|say|note)|what were my notes)\b/.test(t)
  if (!asksJournalFact) return null
  if (!matches.length) return `I do not see ${product} in your local journal yet.`

  const latest = matches[0]
  if (/\bhow many times\b/.test(t)) {
    return `You have ${matches.length} ${matches.length === 1 ? 'entry' : 'entries'} for ${product}.`
  }
  if (/\bwhen did i|when was the last|last time\b/.test(t)) {
    const date = formatDate(latest.created_at)
    return date ? `Your latest ${product} entry was recorded ${date}.` : `I found ${product}, but that entry does not have a usable date.`
  }
  if (/\bhow much|what amount\b/.test(t)) {
    return latest.amount ? `Your latest ${product} entry records ${latest.amount}.` : `Your latest ${product} entry does not have an amount recorded.`
  }
  if (/\bwhat did i (?:write|say|note)|what were my notes\b/.test(t)) {
    return latest.notes ? `Your latest note for ${product}: "${clean(latest.notes).slice(0, 220)}"` : `Your latest ${product} entry does not have a note.`
  }
  if (/\bwhat effects|how did it (?:feel|make me feel)|what did i feel\b/.test(t)) {
    const tags = tagSummary(matches)
    return tags.length ? `For ${product}, you recorded: ${tags.join(', ')}.` : `I found ${product}, but I do not see Body, Mind, or Mood effect tags recorded for it.`
  }
  return summarizeProduct(product, entries)
}

function previousAssistant(messages = []) {
  for (let i = messages.length - 2; i >= 0; i -= 1) {
    if (messages[i]?.role === 'assistant') return lower(messages[i].content)
  }
  return ''
}

function introducedProduct(text) {
  const match = clean(text).match(/\b(?:i\s+(?:got|tried|had|used|bought)|log|logging)\s+(.{2,90})/i)
  if (!match) return null
  return clean(match[1].split(/\b(?:and it|and i|which|that)\b/i)[0].replace(/[.!?]+$/, '')) || null
}

function productStart(guide, product) {
  if (guide === 'sunny') return `Okay, ${product}. Tell me how it felt, and we can keep the details you actually want to remember.`
  if (guide === 'herb') return `Got it: ${product}. What do you want to capture first: amount, category, effects, or notes?`
  if (guide === 'mary') return `Okay. ${product}. What did you notice in your body, mind, or mood?`
  if (guide === 'larry') return `Alright. ${product}. What happened with it? Amount, how you used it, effects, or whatever made it worth remembering.`
  return `Got it: ${product}. What happened with it? You can tell me the amount, category, effects, or notes.`
}

function effectReply(guide, effects) {
  const list = effects.join(', ')
  if (guide === 'larry') return `Got it. I heard ${list}. Those are worth keeping. What else happened with the experience?`
  if (guide === 'sunny') return `I heard ${list}. What else did you notice in your body, mind, or mood?`
  if (guide === 'herb') return `Recorded in this conversation: ${list}. Any other effects or product details you want to capture?`
  if (guide === 'mary') return `I heard ${list}. Anything else you noticed physically, mentally, or emotionally?`
  return `I heard ${list}. What else do you want to remember about the experience?`
}

function checkinFollowup(guide, text) {
  const t = lower(text)
  const rough = /\b(bad|rough|awful|terrible|stressed|anxious|tired|sad|not good)\b/.test(t)
  if (rough && guide === 'larry') return 'Sounds like a rough one. Want to just check in, or is there something from today you want in the journal?'
  if (rough) return 'I hear you. Want to just check in, or is there something from today you want to record?'
  if (guide === 'larry') return 'Good. What are we doing today: logging something, looking something up, or just hanging out for a minute?'
  return 'Good to hear. Want to log something, look something up, or just check in?'
}

export function buildGuideResponse({ guide = 'bud', messages = [], entries = [] } = {}) {
  const voice = voiceFor(guide)
  const latestMessage = messages[messages.length - 1]?.content || ''
  const text = lower(latestMessage)
  const mentioned = productsInText(latestMessage, entries)
  const explicitTopic = questionTopic(latestMessage)
  const aboutTopic = directAboutTopic(latestMessage)
  const conversationTopic = mentioned[0] || explicitTopic || aboutTopic || topicFromHistory(messages, entries) || latestProductFromHistory(messages, entries)
  const recentProduct = mentioned[0] || canonicalJournalProduct(conversationTopic, entries) || latestProductFromHistory(messages, entries)
  const effects = detectedEffects(latestMessage)
  const prev = previousAssistant(messages)

  if (!text) return voice.greeting
  if (/\b(diagnose|diagnosis|prescribe|prescription|dose|dosage|treat|treatment)\b/.test(text)) return MEDICAL_REFUSAL
  if (/\b(recommend|recommendation|what should i buy|what should i get|best strain|best product|should i use)\b/.test(text)) return RECOMMENDATION_REFUSAL
  if (/^(hi|hey|hello|yo|hiya|sup|what's up|whats up)[.!? ]*$/.test(text)) return voice.greeting
  if (/\bhow are you\b|\bhow're you\b|\bhow you doing\b/.test(text)) return voice.checkin
  if (explicitTopic) return topicQuestionPrompt(guide, explicitTopic, entries)
  if (/\b(?:i\s+(?:have|got)\s+|i['’]ve\s+got\s+)?(?:a\s+)?question\b|\bcan\s+i\s+ask\s+you\s+something\b/.test(text)) return voice.questionPrompt
  if (/^(thanks|thank you|thx|appreciate it)[.!? ]*$/.test(text)) return voice.thanks
  if (/^(bye|goodbye|later|see you|see ya|good night)[.!? ]*$/.test(text)) return voice.goodbye
  if (/\b(help|what can you do|what do you do)\b/.test(text)) return HELP

  if (/\bhow many (?:journal )?entries\b|\bentry count\b/.test(text)) {
    return entries.length === 1 ? 'You have 1 entry in your local journal.' : `You have ${entries.length} entries in your local journal.`
  }
  if (/\b(latest|last|most recent) (?:journal )?entry\b/.test(text)) return summarizeLatest(entries)

  if (/\b(compare|versus| vs\.? )\b/.test(` ${text} `)) {
    if (mentioned.length >= 2) return compareProducts(mentioned[0], mentioned[1], entries)
    if (mentioned.length === 1) return `I found ${mentioned[0]}. Name the other product from your journal and I can compare the recorded history.`
    return 'Name two products that are already in your journal and I can compare the effects you recorded for each.'
  }

  const topicAnswer = answerJournalTopicQuestion(latestMessage, conversationTopic, entries)
  if (topicAnswer) return topicAnswer

  if (/\b(what did i think|what did i record|what did i log|tell me about|show me|remember|did i like)\b/.test(text)) {
    if (recentProduct) return summarizeProduct(recentProduct, entries)
    if (conversationTopic) return summarizeProduct(conversationTopic, entries)
    return 'Name a product from your journal and I can show you exactly what you recorded about it.'
  }

  if (mentioned.length && /\b(tried|used|bought|got|had|smoked|vaped|ate|logging|log)\b/.test(text)) {
    return productStart(guide, mentioned[0])
  }
  const introduced = introducedProduct(latestMessage)
  if (introduced) return productStart(guide, introduced)

  if (effects.length) return effectReply(guide, effects)

  if (/\bhow (?:have )?i been feeling\b|\bwhat effects have i logged\b/.test(text)) {
    const tags = tagSummary(entries)
    if (!tags.length) return 'I do not have enough recorded Body, Mind, or Mood tags in your local journal to summarize yet.'
    return `Across your local journal, the effects you recorded most often are: ${tags.join(', ')}.`
  }

  if (/\bhow many times\b/.test(text) && conversationTopic) {
    const product = canonicalJournalProduct(conversationTopic, entries) || conversationTopic
    const count = entriesForProduct(product, entries).length
    if (!count) return `I do not see ${product} in your local journal yet.`
    return `You have ${count} ${count === 1 ? 'entry' : 'entries'} for ${product}.`
  }

  if (/how are you|how are you doing|how are you feeling/.test(prev) && (/\b(i am|i'm|im|feeling|doing)\b/.test(text) || /^(good|great|fine|okay|ok|bad|rough|awful|terrible|not good)[.!? ]*$/.test(text))) {
    return checkinFollowup(guide, latestMessage)
  }

  if (aboutTopic) {
    const known = canonicalJournalProduct(aboutTopic, entries)
    return known ? summarizeProduct(known, entries) : topicBoundary(aboutTopic)
  }

  if (prev === lower(voice.questionPrompt) || /what do you want to know about/.test(prev) || /what would you like to know about/.test(prev)) {
    return conversationTopic ? topicBoundary(conversationTopic) : GENERAL_CANNABIS_BOUNDARY
  }

  if (/\?$/.test(clean(latestMessage)) && conversationTopic) return topicBoundary(conversationTopic)

  return voice.clarify || FALLBACK
}

export const guideEngineInternals = {
  productsInText,
  detectedEffects,
  summarizeProduct,
  summarizeLatest,
  compareProducts,
}
