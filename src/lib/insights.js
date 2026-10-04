function numericRating(value) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null
}

function average(values = []) {
  const nums = values.filter((value) => Number.isFinite(value))
  if (!nums.length) return null
  return nums.reduce((sum, value) => sum + value, 0) / nums.length
}

function startOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

export function timeBucket(createdAt) {
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return null
  const hour = d.getHours()
  if (hour >= 5 && hour < 12) return 'Morning'
  if (hour >= 12 && hour < 17) return 'Afternoon'
  if (hour >= 17 && hour < 21) return 'Evening'
  return 'Night'
}

export function countByValue(items = []) {
  const counts = new Map()
  items.filter(Boolean).forEach((item) => counts.set(item, (counts.get(item) || 0) + 1))
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
}

function flattenTags(entries, key) {
  return entries.flatMap((entry) => Array.isArray(entry?.[key]) ? entry[key] : [])
}

function normalizedProductName(entry) {
  return String(entry?.product_name || entry?.strain_name || '').trim()
}

function productEvidence(entries) {
  const groups = new Map()
  for (const entry of entries) {
    const label = normalizedProductName(entry)
    if (!label) continue
    const key = label.toLocaleLowerCase()
    if (!groups.has(key)) groups.set(key, { label, sessions: 0, ratings: [] })
    const group = groups.get(key)
    group.sessions += 1
    const rating = numericRating(entry.rating)
    if (rating !== null) group.ratings.push(rating)
  }

  const all = [...groups.values()].map((group) => ({
    ...group,
    ratedSessions: group.ratings.length,
    averageRating: average(group.ratings),
  }))

  const mostRepeated = all
    .filter((group) => group.sessions >= 2)
    .sort((a, b) => b.sessions - a.sessions || b.ratedSessions - a.ratedSessions || a.label.localeCompare(b.label))[0] || null

  const highestRatedRepeat = all
    .filter((group) => group.ratedSessions >= 2)
    .sort((a, b) => b.averageRating - a.averageRating || b.ratedSessions - a.ratedSessions || b.sessions - a.sessions || a.label.localeCompare(b.label))[0] || null

  return { all, mostRepeated, highestRatedRepeat }
}

export function analyzeInsights(entries = [], now = new Date()) {
  const cannabisEntries = entries.filter((entry) => !entry?.entry_type || entry.entry_type === 'cannabis')
  const thisWeekStart = startOfWeek(now)
  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)

  const thisWeek = cannabisEntries.filter((entry) => {
    const d = new Date(entry.created_at)
    return !Number.isNaN(d.getTime()) && d >= thisWeekStart
  })
  const lastWeek = cannabisEntries.filter((entry) => {
    const d = new Date(entry.created_at)
    return !Number.isNaN(d.getTime()) && d >= lastWeekStart && d < thisWeekStart
  })

  const ratings = cannabisEntries.map((entry) => numericRating(entry.rating)).filter((value) => value !== null)
  const sleepRatings = cannabisEntries.map((entry) => numericRating(entry.sleep_quality)).filter((value) => value !== null)
  const completedFollowups = cannabisEntries.filter((entry) => entry.update_completed === true).length
  const moodCounts = countByValue(cannabisEntries.map((entry) => entry.mood_face))
  const sideEffectCounts = countByValue(flattenTags(cannabisEntries, 'side_effects'))
  const productCounts = countByValue(cannabisEntries.map(normalizedProductName))
  const timeCounts = countByValue(cannabisEntries.map((entry) => timeBucket(entry.created_at)))
  const products = productEvidence(cannabisEntries)

  return {
    total: cannabisEntries.length,
    thisWeek: thisWeek.length,
    lastWeek: lastWeek.length,
    completedFollowups,
    followupRate: cannabisEntries.length ? completedFollowups / cannabisEntries.length : null,
    ratedSessions: ratings.length,
    averageRating: average(ratings),
    sleepRatedSessions: sleepRatings.length,
    averageSleepQuality: average(sleepRatings),
    productCounts,
    topLoggingTime: timeCounts[0] || null,
    bodyCounts: countByValue(flattenTags(cannabisEntries, 'body_tags')),
    mindCounts: countByValue(flattenTags(cannabisEntries, 'mind_tags')),
    moodTagCounts: countByValue(flattenTags(cannabisEntries, 'mood_tags')),
    moodOutcomeCounts: moodCounts,
    sideEffectCounts,
    categoryCounts: countByValue(cannabisEntries.map((entry) => entry.category)),
    strainTypeCounts: countByValue(cannabisEntries.map((entry) => entry.strain_type)),
    mostRepeatedProduct: products.mostRepeated,
    highestRatedRepeatProduct: products.highestRatedRepeat,
  }
}
