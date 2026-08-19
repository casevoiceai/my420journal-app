import {
  SOURCE_APP_VERSION,
  bucketAmount,
  bucketEntryLoggedAt,
  bucketRegion,
  normalizeCategory,
  normalizeDispensaryName,
  normalizeProductKey,
  normalizeProductName,
  normalizeStrainType,
} from './sharedContributionBuckets.js'
import { getSharedPrivacyState } from './sharedPrivacy.js'

const VALID_MOOD_FACES = new Set(['good', 'meh', 'off', 'eww'])

function firstValue(source, names) {
  for (const name of names) {
    const value = source?.[name]
    if (value !== undefined && value !== null) return value
  }
  return null
}

function cleanString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function cleanTagArray(value) {
  if (!Array.isArray(value)) return []
  return value
    .filter((tag) => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function cleanMoodFace(value) {
  const moodFace = cleanString(value)
  return VALID_MOOD_FACES.has(moodFace) ? moodFace : null
}

function getLoggedAt(entry) {
  return firstValue(entry, [
    'entry_logged_at',
    'logged_at',
    'created_at',
    'saved_at',
    'updated_at',
  ])
}

export function mapEntryToSharedContribution(entry = {}, sharedState = getSharedPrivacyState()) {
  const productName = firstValue(entry, ['product_name', 'productName'])
  const productKey = normalizeProductKey(productName)

  if (!productKey) return null

  const category = normalizeCategory(firstValue(entry, ['category']))
  const strainType = normalizeStrainType(firstValue(entry, ['strain_type', 'strainType']), category)
  const dispensaryName = firstValue(entry, ['dispensary_name', 'dispensaryName'])
  const amount = firstValue(entry, ['amount'])

  return {
    anonymous_contributor_id: sharedState?.anonymous_contributor_id || null,
    product_key: productKey,
    product_name_normalized: normalizeProductName(productName),
    brand_name: null,
    category,
    strain_type: strainType,
    dispensary_place_id: cleanString(firstValue(entry, ['dispensary_place_id', 'dispensaryPlaceId'])),
    dispensary_name_normalized: normalizeDispensaryName(dispensaryName),
    region_bucket: bucketRegion(entry),
    body_tags: cleanTagArray(firstValue(entry, ['body_tags', 'bodyTags'])),
    mind_tags: cleanTagArray(firstValue(entry, ['mind_tags', 'mindTags'])),
    mood_tags: cleanTagArray(firstValue(entry, ['mood_tags', 'moodTags'])),
    mood_face: cleanMoodFace(firstValue(entry, ['mood_face', 'moodFace'])),
    amount_bucket: bucketAmount(amount, category),
    entry_logged_at_bucket: bucketEntryLoggedAt(getLoggedAt(entry)),
    source_app_version: cleanString(firstValue(entry, ['source_app_version', 'sourceAppVersion'])) || SOURCE_APP_VERSION,
  }
}
