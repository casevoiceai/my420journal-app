export const SOURCE_APP_VERSION = 'my420journal-web'

const CATEGORIES_WITH_STRAIN = new Set(['Flower', 'Vape', 'Extract'])

function toText(value) {
  return typeof value === 'string' ? value : ''
}

function cleanWhitespace(value) {
  return toText(value).replace(/\s+/g, ' ').trim()
}

function cleanForKey(value) {
  return cleanWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeProductKey(productName) {
  return cleanForKey(productName) || null
}

export function normalizeProductName(productName) {
  return cleanForKey(productName) || null
}

export function normalizeDispensaryName(dispensaryName) {
  return cleanForKey(dispensaryName) || null
}

export function normalizeCategory(category) {
  return cleanWhitespace(category) || null
}

export function normalizeStrainType(strainType, category) {
  if (!CATEGORIES_WITH_STRAIN.has(category)) return null
  return cleanWhitespace(strainType) || null
}

function parseNumber(value) {
  const match = toText(value).match(/\d+(?:\.\d+)?/)
  if (!match) return null
  const parsed = Number.parseFloat(match[0])
  return Number.isFinite(parsed) ? parsed : null
}

function parseGrams(amount) {
  const text = toText(amount).toLowerCase()
  const numeric = parseNumber(text)

  if (text.includes('eighth')) return 3.5
  if (text.includes('quarter')) return 7
  if (text.includes('half') && (text.includes('ounce') || text.includes('oz'))) return 14
  if (text.includes('ounce') || text.includes('oz')) return numeric ? numeric * 28 : null
  if (text.includes('g') || text.includes('gram')) return numeric

  return numeric
}

function parseMilligrams(amount) {
  const text = toText(amount).toLowerCase()
  if (!text.includes('mg') && !text.includes('milligram')) return null
  return parseNumber(text)
}

function parseMilliliters(amount) {
  const text = toText(amount).toLowerCase()
  if (!text.includes('ml') && !text.includes('milliliter')) return null
  return parseNumber(text)
}

function bucketGramAmount(prefix, amount) {
  const grams = parseGrams(amount)
  if (grams == null) return `${prefix}_amount_unknown`
  if (grams < 1) return `${prefix}_lt_1g`
  if (grams <= 3.5) return `${prefix}_1g_to_3_5g`
  if (grams < 7) return `${prefix}_3_5g_to_7g`
  return `${prefix}_7g_plus`
}

function bucketMilligramAmount(prefix, amount) {
  const mg = parseMilligrams(amount)
  if (mg == null) return `${prefix}_amount_unknown`
  if (mg <= 10) return `${prefix}_0_10mg`
  if (mg <= 50) return `${prefix}_11_50mg`
  return `${prefix}_51mg_plus`
}

function bucketMilliliterAmount(prefix, amount) {
  const ml = parseMilliliters(amount)
  if (ml == null) return `${prefix}_amount_unknown`
  if (ml <= 1) return `${prefix}_0_1ml`
  if (ml <= 5) return `${prefix}_1_5ml`
  return `${prefix}_5ml_plus`
}

export function bucketAmount(amount, category) {
  const cleanCategory = normalizeCategory(category)
  const text = toText(amount).toLowerCase()

  if (!cleanWhitespace(amount)) return 'amount_unknown'

  if (cleanCategory === 'Flower') return bucketGramAmount('flower', amount)
  if (cleanCategory === 'Extract') return bucketGramAmount('extract', amount)

  if (cleanCategory === 'Vape') {
    if (text.includes('disposable')) return 'vape_disposable'
    if (text.includes('cart') || text.includes('cartridge')) {
      const grams = parseGrams(amount)
      if (grams == null) return 'vape_cartridge_unknown'
      if (grams <= 0.5) return 'vape_cartridge_0_5g'
      return 'vape_cartridge_1g_plus'
    }
    return bucketGramAmount('vape', amount)
  }

  if (cleanCategory === 'Orally Administered') {
    if (text.includes('piece')) return 'edible_piece_count'
    return bucketMilligramAmount('edible', amount)
  }

  if (cleanCategory === 'Tinctures') return bucketMilliliterAmount('tincture', amount)

  return 'amount_other'
}

function safeDate(value) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return new Date()
  return date
}

function isoWeekParts(value) {
  const date = safeDate(value)
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = utcDate.getUTCDay() || 7
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day)

  const year = utcDate.getUTCFullYear()
  const yearStart = new Date(Date.UTC(year, 0, 1))
  const week = Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7)

  return { year, week }
}

export function bucketEntryLoggedAt(dateValue) {
  const { year, week } = isoWeekParts(dateValue)
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function bucketRegion() {
  // The current app stores exact dispensary address and GPS coordinates, but no safe coarse region field.
  // This first version does not derive or upload region data from exact location details.
  return null
}
