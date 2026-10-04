import { isApprovedUSMarketContentPacket } from './usMarketContentPackets.js'

export const GLOBAL_MARKET_PAGE_CONTENT = Object.freeze({
  productHeading: 'What My420Journal does',
  privacyHeading: 'Private by design',
  privacyBody: 'Your private journal stays in this browser on this device. Optional network features are disclosed separately, and the full journal database is not uploaded to Conversational Guides.',
  boundaryHeading: 'A record, not a recommendation',
  boundaryBody: 'My420Journal helps you record and look back at information you chose to save. It does not provide medical advice, sell cannabis, connect you to a purchase, or decide what you should buy or use.',
  ctaHeading: 'Open My420Journal',
  privacyHref: '/privacy',
})

export const US_REGIONAL_MARKET_CONTENT = Object.freeze({
  regionLabel: 'United States',
  contextBody: 'Cannabis rules vary by state and use case. My420Journal does not treat a selected market as proof that cannabis activity is legal, and it does not treat adult-use and medical-program contexts as interchangeable.',
})

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function validateUSMarketDelta(record, delta) {
  if (!record || record.parentRegion !== 'US' || !record.marketId) return false
  if (!delta || typeof delta !== 'object') return false
  if (clean(delta.marketId) !== record.marketId) return false

  return Boolean(
    clean(delta.marketName)
    && clean(delta.heroTitle)
    && clean(delta.heroBody)
    && clean(delta.useCaseTitle)
    && clean(delta.useCaseBody)
  )
}

export function buildUSMarketPageModel(record, packet) {
  if (!isApprovedUSMarketContentPacket(packet)) return null
  if (packet.marketId !== record?.marketId || packet.route !== record?.route) return null

  const delta = packet.delta
  if (!validateUSMarketDelta(record, delta)) return null

  return Object.freeze({
    route: record.route,
    marketId: record.marketId,
    publicationStatus: record.publicationStatus,
    breadcrumb: Object.freeze(['My420Journal', US_REGIONAL_MARKET_CONTENT.regionLabel, clean(delta.marketName)]),
    marketName: clean(delta.marketName),
    heroTitle: clean(delta.heroTitle),
    heroBody: clean(delta.heroBody),
    useCaseTitle: clean(delta.useCaseTitle),
    useCaseBody: clean(delta.useCaseBody),
    ageProgramText: clean(delta.ageProgramText),
    footerNote: clean(delta.footerNote),
    inheritedGlobal: GLOBAL_MARKET_PAGE_CONTENT,
    inheritedRegional: US_REGIONAL_MARKET_CONTENT,
    ctaHref: `/app?market=${encodeURIComponent(record.marketId)}`,
  })
}
