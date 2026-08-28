export const PUBLIC_MARKET_ARCHITECTURE_VERSION = 'MY420JOURNAL_PUBLIC_WEBSITE_INFORMATION_ARCHITECTURE_V1'

export const PUBLICATION_STATUS = Object.freeze({
  ACTIVE: 'active',
  REVIEW_GATE: 'review_gate',
  HOLD: 'hold',
  RESERVED: 'reserved',
})

const registry = [
  {
    id: 'US',
    route: '/us',
    parentRegion: null,
    marketId: null,
    publicationStatus: PUBLICATION_STATUS.REVIEW_GATE,
    titleKey: 'united-states',
    contentDeltaKey: 'us-master',
    indexable: false,
    reviewReference: null,
    releaseVersion: null,
    releaseDate: null,
  },
  {
    id: 'US-PA',
    route: '/us/pennsylvania',
    parentRegion: 'US',
    marketId: 'US-PA',
    publicationStatus: PUBLICATION_STATUS.REVIEW_GATE,
    titleKey: 'pennsylvania',
    contentDeltaKey: 'us-pennsylvania',
    indexable: false,
    reviewReference: null,
    releaseVersion: null,
    releaseDate: null,
  },
  {
    id: 'US-NY',
    route: '/us/new-york',
    parentRegion: 'US',
    marketId: 'US-NY',
    publicationStatus: PUBLICATION_STATUS.REVIEW_GATE,
    titleKey: 'new-york',
    contentDeltaKey: 'us-new-york',
    indexable: false,
    reviewReference: null,
    releaseVersion: null,
    releaseDate: null,
  },
  {
    id: 'US-NJ',
    route: '/us/new-jersey',
    parentRegion: 'US',
    marketId: 'US-NJ',
    publicationStatus: PUBLICATION_STATUS.REVIEW_GATE,
    titleKey: 'new-jersey',
    contentDeltaKey: 'us-new-jersey',
    indexable: false,
    reviewReference: null,
    releaseVersion: null,
    releaseDate: null,
  },
  {
    id: 'US-MA',
    route: '/us/massachusetts',
    parentRegion: 'US',
    marketId: 'US-MA',
    publicationStatus: PUBLICATION_STATUS.REVIEW_GATE,
    titleKey: 'massachusetts',
    contentDeltaKey: 'us-massachusetts',
    indexable: false,
    reviewReference: null,
    releaseVersion: null,
    releaseDate: null,
  },
  {
    id: 'US-CT',
    route: '/us/connecticut',
    parentRegion: 'US',
    marketId: 'US-CT',
    publicationStatus: PUBLICATION_STATUS.HOLD,
    titleKey: 'connecticut',
    contentDeltaKey: 'us-connecticut',
    indexable: false,
    reviewReference: null,
    releaseVersion: null,
    releaseDate: null,
  },
  {
    id: 'NL-AMS',
    route: '/nl/amsterdam',
    parentRegion: 'NL',
    marketId: null,
    publicationStatus: PUBLICATION_STATUS.RESERVED,
    titleKey: 'amsterdam',
    contentDeltaKey: 'nl-amsterdam',
    indexable: false,
    reviewReference: null,
    releaseVersion: null,
    releaseDate: null,
  },
  {
    id: 'DE',
    route: '/de',
    parentRegion: null,
    marketId: null,
    publicationStatus: PUBLICATION_STATUS.RESERVED,
    titleKey: 'germany',
    contentDeltaKey: 'de-master',
    indexable: false,
    reviewReference: null,
    releaseVersion: null,
    releaseDate: null,
  },
  {
    id: 'GB',
    route: '/uk',
    parentRegion: null,
    marketId: null,
    publicationStatus: PUBLICATION_STATUS.RESERVED,
    titleKey: 'united-kingdom',
    contentDeltaKey: 'uk-master',
    indexable: false,
    reviewReference: null,
    releaseVersion: null,
    releaseDate: null,
  },
]

export const PUBLIC_MARKET_REGISTRY = Object.freeze(
  registry.map((record) => Object.freeze({ ...record }))
)

export function getPublicMarketRecord(route) {
  if (typeof route !== 'string') return null
  return PUBLIC_MARKET_REGISTRY.find((record) => record.route === route) || null
}

export function isProductionPublicMarketRoute(record) {
  if (!record || record.publicationStatus !== PUBLICATION_STATUS.ACTIVE) return false

  return Boolean(
    record.indexable === true
    && typeof record.reviewReference === 'string'
    && record.reviewReference.trim()
    && typeof record.releaseVersion === 'string'
    && record.releaseVersion.trim()
    && typeof record.releaseDate === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(record.releaseDate)
  )
}

export function getProductionPublicMarketRoutes() {
  return PUBLIC_MARKET_REGISTRY.filter(isProductionPublicMarketRoute)
}
