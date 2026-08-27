import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getMarketConfig,
  isMarketEnabled,
} from './marketConfig.js'
import {
  clearResidenceState,
  getResidenceState,
  isAgeAssuranceCurrent,
  markAgeAssurance,
  saveResidenceSelection,
} from './residence.js'

class MemoryStorage {
  constructor() { this.map = new Map() }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null }
  setItem(key, value) { this.map.set(String(key), String(value)) }
  removeItem(key) { this.map.delete(String(key)) }
}

function setup() {
  globalThis.localStorage = new MemoryStorage()
}

test('Pennsylvania uses the reviewed adult medical-patient 18+ configuration', () => {
  const config = getMarketConfig('US', 'PA')
  assert.equal(config.accessStatus, 'private_test')
  assert.equal(config.marketType, 'medical_adult_patient')
  assert.equal(config.ageThreshold, 18)
  assert.equal(config.ageAssuranceMode, 'confirmation')
  assert.equal(isMarketEnabled(config), true)
})

test('NY, NJ, and MA use the reviewed 21+ adult-use configuration', () => {
  for (const region of ['NY', 'NJ', 'MA']) {
    const config = getMarketConfig('US', region)
    assert.equal(config.accessStatus, 'private_test')
    assert.equal(config.marketType, 'adult_use')
    assert.equal(config.ageThreshold, 21)
    assert.equal(config.ageAssuranceMode, 'confirmation')
  }
})

test('Connecticut and unreviewed markets fail closed', () => {
  const ct = getMarketConfig('US', 'CT')
  const ca = getMarketConfig('US', 'CA')
  const nl = getMarketConfig('NL')

  assert.equal(ct.accessStatus, 'hold')
  assert.equal(isMarketEnabled(ct), false)
  assert.equal(ca.accessStatus, 'not_reviewed')
  assert.equal(isMarketEnabled(ca), false)
  assert.equal(nl.accessStatus, 'reserved')
  assert.equal(isMarketEnabled(nl), false)
})

test('residence storage contains only market configuration fields and no identity', () => {
  setup()
  const { state } = saveResidenceSelection('US', 'PA')

  assert.equal(state.home_country, 'US')
  assert.equal(state.home_region, 'PA')
  assert.equal(state.market_id, 'US-PA')
  assert.equal('name' in state, false)
  assert.equal('email' in state, false)
  assert.equal('birth_date' in state, false)
  assert.equal('dob' in state, false)
  assert.equal('address' in state, false)
  assert.equal('latitude' in state, false)
  assert.equal('longitude' in state, false)
})

test('age assurance stores a confirmation result, not date of birth', () => {
  setup()
  const { config } = saveResidenceSelection('US', 'NY')
  const result = markAgeAssurance(config)
  const state = getResidenceState()

  assert.equal(result.ok, true)
  assert.equal(state.age_assurance.status, 'confirmed')
  assert.equal(state.age_assurance.threshold, 21)
  assert.equal(state.age_assurance.mode, 'confirmation')
  assert.equal(isAgeAssuranceCurrent(config, state), true)
  assert.equal('birth_date' in state.age_assurance, false)
  assert.equal('dob' in state.age_assurance, false)
})

test('changing residence clears an earlier age assurance', () => {
  setup()
  const ny = saveResidenceSelection('US', 'NY').config
  markAgeAssurance(ny)
  assert.equal(Boolean(getResidenceState().age_assurance), true)

  saveResidenceSelection('US', 'NJ')
  assert.equal(getResidenceState().age_assurance, null)

  clearResidenceState()
  assert.equal(getResidenceState(), null)
})
