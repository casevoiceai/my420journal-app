import {
  AGE_ASSURANCE_VERSION,
  MARKET_CONFIG_VERSION,
  getMarketConfig,
  isMarketEnabled,
} from './marketConfig.js'

const STORAGE_KEY = 'my420journal_market_v1'

function nowIso() {
  return new Date().toISOString()
}

function readState() {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeState(state) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getResidenceState() {
  return readState()
}

export function clearResidenceState() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

export function saveResidenceSelection(country, region = null) {
  const config = getMarketConfig(country, region)
  const previous = readState()
  const sameMarket = previous?.market_id === config.id
  const assuranceStillCompatible = sameMarket
    && previous?.age_assurance?.market_config_version === MARKET_CONFIG_VERSION

  const next = {
    version: MARKET_CONFIG_VERSION,
    home_country: config.country,
    home_region: config.region,
    market_id: config.id,
    selected_at: sameMarket && previous?.selected_at ? previous.selected_at : nowIso(),
    age_assurance: assuranceStillCompatible ? previous.age_assurance : null,
  }

  writeState(next)
  return { state: next, config }
}

export function markAgeAssurance(config, mode = config?.ageAssuranceMode) {
  if (!config?.id || !config?.ageThreshold || !mode) {
    return { ok: false, state: readState(), error: 'Age assurance configuration is incomplete.' }
  }

  const current = readState()
  if (!current || current.market_id !== config.id || current.version !== MARKET_CONFIG_VERSION) {
    return { ok: false, state: current, error: 'Residence must be selected before age assurance.' }
  }

  const next = {
    ...current,
    version: MARKET_CONFIG_VERSION,
    age_assurance: {
      version: AGE_ASSURANCE_VERSION,
      market_config_version: MARKET_CONFIG_VERSION,
      status: 'confirmed',
      mode,
      threshold: config.ageThreshold,
      market_id: config.id,
      confirmed_at: nowIso(),
    },
  }

  writeState(next)
  return { ok: true, state: next }
}

export function isAgeAssuranceCurrent(config, state = readState()) {
  const assurance = state?.age_assurance
  if (!config || !state || !assurance) return false
  return state.version === MARKET_CONFIG_VERSION
    && state.market_id === config.id
    && assurance.market_id === config.id
    && assurance.version === AGE_ASSURANCE_VERSION
    && assurance.market_config_version === MARKET_CONFIG_VERSION
    && assurance.status === 'confirmed'
    && assurance.threshold === config.ageThreshold
    && assurance.mode === config.ageAssuranceMode
}

export function hasCurrentMarketAccess(config, state) {
  return isMarketEnabled(config) && isAgeAssuranceCurrent(config, state)
}

export function getStoredMarketConfig() {
  const state = readState()
  if (!state?.home_country) return { state, config: null }
  return {
    state,
    config: getMarketConfig(state.home_country, state.home_region),
  }
}

export function hasStoredMarketAccess() {
  const { state, config } = getStoredMarketConfig()
  return hasCurrentMarketAccess(config, state)
}
