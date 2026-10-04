export const CONTENT_REVIEW_STATUS = Object.freeze({
  REVIEW_REQUIRED: 'review_required',
  APPROVED: 'approved',
})

const packets = [
  { marketId: 'US-PA', route: '/us/pennsylvania' },
  { marketId: 'US-NY', route: '/us/new-york' },
  { marketId: 'US-NJ', route: '/us/new-jersey' },
  { marketId: 'US-MA', route: '/us/massachusetts' },
].map((record) => Object.freeze({
  ...record,
  reviewStatus: CONTENT_REVIEW_STATUS.REVIEW_REQUIRED,
  reviewReference: null,
  contentVersion: null,
  reviewedAt: null,
  delta: null,
}))

export const US_MARKET_CONTENT_PACKETS = Object.freeze(packets)

export function getUSMarketContentPacket(marketId) {
  if (typeof marketId !== 'string') return null
  return US_MARKET_CONTENT_PACKETS.find((packet) => packet.marketId === marketId) || null
}

export function isApprovedUSMarketContentPacket(packet) {
  if (!packet || packet.reviewStatus !== CONTENT_REVIEW_STATUS.APPROVED) return false

  return Boolean(
    typeof packet.reviewReference === 'string'
    && packet.reviewReference.trim()
    && typeof packet.contentVersion === 'string'
    && packet.contentVersion.trim()
    && typeof packet.reviewedAt === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(packet.reviewedAt)
    && packet.delta
    && typeof packet.delta === 'object'
  )
}

export function getApprovedUSMarketDelta(marketId) {
  const packet = getUSMarketContentPacket(marketId)
  return isApprovedUSMarketContentPacket(packet) ? packet.delta : null
}
