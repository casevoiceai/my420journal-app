const PRODUCT_ENTRY_TYPES = new Set(['', 'cannabis'])
const NON_PRODUCT_NAMES = new Set(['sleep start', 'sleep end', 'nap'])

function cleanText(value, maxLength = 240) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength)
}

function entryTime(entry) {
  const time = Date.parse(entry?.created_at || '')
  return Number.isFinite(time) ? time : 0
}

function latestUserMessage(messages = []) {
  if (!Array.isArray(messages)) return ''
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === 'user') return cleanText(messages[index]?.content, 500)
  }
  return ''
}

export function isLocalGuideProductEntry(entry) {
  if (!entry) return false
  const entryType = cleanText(entry.entry_type, 40).toLowerCase()
  const productName = cleanText(entry.product_name, 160)
  if (!productName) return false
  if (!PRODUCT_ENTRY_TYPES.has(entryType)) return false
  return !NON_PRODUCT_NAMES.has(productName.toLowerCase())
}

export function getLocalGuideProductEntries(entries = []) {
  if (!Array.isArray(entries)) return []
  return entries
    .filter(isLocalGuideProductEntry)
    .sort((a, b) => entryTime(b) - entryTime(a))
}

function getSortedEntries(entries = []) {
  if (!Array.isArray(entries)) return []
  return [...entries].sort((a, b) => entryTime(b) - entryTime(a))
}

function latestProductReply(guide, productName) {
  const name = cleanText(productName, 160)
  const replies = {
    bud: `Your latest product log is ${name}.`,
    sunny: `You just logged ${name}.`,
    larry: `Latest entry in your product log: ${name}.`,
    herb: `Your most recent product entry lists ${name}.`,
    mary: `The last product you logged was ${name}.`,
    stoner: `Latest product: ${name}.`,
    unit: `Latest product: ${name}.`,
    tool: `Latest product: ${name}.`,
  }
  return replies[guide] || `Your latest product log is ${name}.`
}

function recentProductsReply(guide, entries) {
  const seen = new Set()
  const names = []
  for (const entry of entries) {
    const name = cleanText(entry.product_name, 160)
    const key = name.toLowerCase()
    if (!name || seen.has(key)) continue
    seen.add(key)
    names.push(name)
    if (names.length === 5) break
  }
  if (names.length === 0) return noProductReply(guide)
  if (guide === 'sunny') return `Your recent product logs are ${names.join(', ')}.`
  if (guide === 'herb') return `Your five most recent distinct product entries are ${names.join(', ')}.`
  return `Recent products in your journal: ${names.join(', ')}.`
}

function noProductReply(guide) {
  if (guide === 'sunny') return `I don't have a product log to pull from yet.`
  return `I don't have a product entry in your local journal yet.`
}

function recommendationBoundaryReply() {
  return `I can help you review what you've logged, but I don't recommend products or tell you what to buy, use, or take.`
}

function medicalBoundaryReply() {
  return `I can reflect what you've logged, but I can't diagnose, treat, prescribe, or turn your journal into medical advice.`
}

function journalEntryLabel(entry) {
  const type = cleanText(entry?.entry_type, 40).toLowerCase()
  if (type === 'note') return cleanText(entry?.product_name, 160) || 'a note'
  if (type === 'sleep_start') return 'Sleep Start'
  if (type === 'sleep_end') return 'Sleep End'
  if (type === 'nap') return 'Nap'
  return cleanText(entry?.product_name, 160) || 'an entry'
}

function findMentionedProduct(prompt, productEntries) {
  const lowerPrompt = prompt.toLowerCase()
  return [...productEntries]
    .sort((a, b) => cleanText(b.product_name).length - cleanText(a.product_name).length)
    .find((entry) => lowerPrompt.includes(cleanText(entry.product_name).toLowerCase())) || null
}

function uniqueTags(entry) {
  const tags = [
    ...(Array.isArray(entry?.body_tags) ? entry.body_tags : []),
    ...(Array.isArray(entry?.mind_tags) ? entry.mind_tags : []),
    ...(Array.isArray(entry?.mood_tags) ? entry.mood_tags : []),
  ]
  const seen = new Set()
  return tags
    .map((tag) => cleanText(tag, 80))
    .filter((tag) => {
      const key = tag.toLowerCase()
      if (!tag || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function productDetailReply(entry, prompt) {
  const name = cleanText(entry.product_name, 160)
  const details = []
  const category = cleanText(entry.category, 80)
  const strainType = cleanText(entry.strain_type, 80)
  const mood = cleanText(entry.mood_face, 40)
  const tags = uniqueTags(entry)
  if (category) details.push(`category: ${category}`)
  if (strainType) details.push(`type: ${strainType}`)
  if (mood) details.push(`mood: ${mood}`)
  if (tags.length) details.push(`tags: ${tags.join(', ')}`)
  if (/\b(?:note|notes|wrote|write)\b/i.test(prompt)) {
    const note = cleanText(entry.notes, 240)
    if (note) details.push(`note: ${note}`)
  }
  if (details.length === 0) return `You logged ${name}, but that entry doesn't have more structured details for me to reflect.`
  return `For ${name}, you logged ${details.join('; ')}.`
}

function fallbackReply(guide) {
  if (guide === 'sunny') {
    return `I can look at what you've actually logged here. Ask me about your latest product, recent products, or what you recorded about a product.`
  }
  return `I can review what is actually in your local journal. Ask about your latest product, recent products, or a specific product you logged.`
}

export function createLocalGuideReply({ guide = 'guide', messages = [], entries = [] } = {}) {
  const prompt = latestUserMessage(messages)
  const productEntries = getLocalGuideProductEntries(entries)
  const sortedEntries = getSortedEntries(entries)

  if (/\b(?:recommend|recommendation|what should i (?:buy|use|take|try)|which .{0,40} should i (?:buy|use|take|try)|best (?:product|strain)|tell me what to (?:buy|use|take|try))\b/i.test(prompt)) {
    return recommendationBoundaryReply()
  }

  if (/\b(?:diagnos(?:e|is|ing)?|treat(?:ment|ing)?|cure|prescrib(?:e|ing)?|medical advice|dosage? for)\b/i.test(prompt)) {
    return medicalBoundaryReply()
  }

  if (/\b(?:what (?:product|strain|thing) did i (?:just |last |most recently )?log|what was the (?:last|latest|most recent) (?:product|strain)|latest product|last product|most recent product)\b/i.test(prompt)) {
    return productEntries.length ? latestProductReply(guide, productEntries[0].product_name) : noProductReply(guide)
  }

  if (/\b(?:what did i (?:just|last) log|what(?:'s| is) my latest (?:log|entry)|latest journal entry|last journal entry)\b/i.test(prompt)) {
    if (sortedEntries.length === 0) return `I don't have a journal entry to pull from yet.`
    return `Your latest journal entry is ${journalEntryLabel(sortedEntries[0])}.`
  }

  if (/\b(?:what (?:products|strains) have i logged|what have i logged|recent products|recent product logs|show (?:me )?my recent)\b/i.test(prompt)) {
    return recentProductsReply(guide, productEntries)
  }

  const mentionedProduct = findMentionedProduct(prompt, productEntries)
  if (mentionedProduct && /\b(?:log|logged|record|recorded|note|notes|feel|felt|effect|effects|notice|noticed|about|remember)\b/i.test(prompt)) {
    return productDetailReply(mentionedProduct, prompt)
  }

  return fallbackReply(guide)
}
