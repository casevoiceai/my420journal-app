import { getConfiguredMarketConfigById } from './marketConfig.js'

export function getMarketSuggestion(search) {
  if (typeof search !== 'string' || !search) return null

  const params = new URLSearchParams(search)
  const values = params.getAll('market')
  if (values.length !== 1) return null

  const marketId = values[0]
  if (!marketId) return null

  return getConfiguredMarketConfigById(marketId)
}
