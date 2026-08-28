import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

import {
  PUBLIC_MARKET_ARCHITECTURE_VERSION,
  PUBLIC_MARKET_REGISTRY,
  PUBLICATION_STATUS,
  getProductionPublicMarketRoutes,
  getPublicMarketRecord,
  isProductionPublicMarketRoute,
} from './publicMarketRegistry.js'

const registrySource = fs.readFileSync(new URL('./publicMarketRegistry.js', import.meta.url), 'utf8')
const appSource = fs.readFileSync(new URL('../App.jsx', import.meta.url), 'utf8')

const EXPECTED_STATUS_BY_ROUTE = new Map([
  ['/us', 'review_gate'],
  ['/us/pennsylvania', 'review_gate'],
  ['/us/new-york', 'review_gate'],
  ['/us/new-jersey', 'review_gate'],
  ['/us/massachusetts', 'review_gate'],
  ['/us/connecticut', 'hold'],
  ['/nl/amsterdam', 'reserved'],
  ['/de', 'reserved'],
  ['/uk', 'reserved'],
])

test('public market registry is a separate V1 publication-control system', () => {
  assert.equal(PUBLIC_MARKET_ARCHITECTURE_VERSION, 'MY420JOURNAL_PUBLIC_WEBSITE_INFORMATION_ARCHITECTURE_V1')
  assert.equal(PUBLIC_MARKET_REGISTRY.length, EXPECTED_STATUS_BY_ROUTE.size)
  assert.equal(registrySource.includes("from '../lib/marketConfig"), false)
  assert.equal(registrySource.includes('isMarketEnabled'), false)

  for (const record of PUBLIC_MARKET_REGISTRY) {
    assert.equal(EXPECTED_STATUS_BY_ROUTE.get(record.route), record.publicationStatus)
    assert.equal('accessStatus' in record, false)
    assert.equal('ageThreshold' in record, false)
    assert.equal('ageAssuranceMode' in record, false)
    assert.equal('marketType' in record, false)
  }
})

test('all V1 market routes fail closed and none are production-routable', () => {
  assert.deepEqual(getProductionPublicMarketRoutes(), [])

  for (const record of PUBLIC_MARKET_REGISTRY) {
    assert.notEqual(record.publicationStatus, PUBLICATION_STATUS.ACTIVE)
    assert.equal(record.indexable, false)
    assert.equal(record.reviewReference, null)
    assert.equal(record.releaseVersion, null)
    assert.equal(record.releaseDate, null)
    assert.equal(isProductionPublicMarketRoute(record), false)
  }
})

test('current production router does not register any gated market route', () => {
  for (const record of PUBLIC_MARKET_REGISTRY) {
    assert.equal(
      appSource.includes(`path="${record.route}"`),
      false,
      `gated market route is registered in App.jsx: ${record.route}`
    )
  }
})

test('status map preserves review gates, Connecticut hold, and reserved international routes', () => {
  assert.equal(getPublicMarketRecord('/us').publicationStatus, PUBLICATION_STATUS.REVIEW_GATE)
  assert.equal(getPublicMarketRecord('/us/pennsylvania').publicationStatus, PUBLICATION_STATUS.REVIEW_GATE)
  assert.equal(getPublicMarketRecord('/us/new-york').publicationStatus, PUBLICATION_STATUS.REVIEW_GATE)
  assert.equal(getPublicMarketRecord('/us/new-jersey').publicationStatus, PUBLICATION_STATUS.REVIEW_GATE)
  assert.equal(getPublicMarketRecord('/us/massachusetts').publicationStatus, PUBLICATION_STATUS.REVIEW_GATE)
  assert.equal(getPublicMarketRecord('/us/connecticut').publicationStatus, PUBLICATION_STATUS.HOLD)
  assert.equal(getPublicMarketRecord('/nl/amsterdam').publicationStatus, PUBLICATION_STATUS.RESERVED)
  assert.equal(getPublicMarketRecord('/de').publicationStatus, PUBLICATION_STATUS.RESERVED)
  assert.equal(getPublicMarketRecord('/uk').publicationStatus, PUBLICATION_STATUS.RESERVED)
})

test('only reviewed U.S. state records carry current app market suggestion IDs', () => {
  const expectedMarketIds = {
    '/us': null,
    '/us/pennsylvania': 'US-PA',
    '/us/new-york': 'US-NY',
    '/us/new-jersey': 'US-NJ',
    '/us/massachusetts': 'US-MA',
    '/us/connecticut': 'US-CT',
    '/nl/amsterdam': null,
    '/de': null,
    '/uk': null,
  }

  for (const record of PUBLIC_MARKET_REGISTRY) {
    assert.equal(record.marketId, expectedMarketIds[record.route])
  }
})

test('production-route helper requires active status plus recorded release metadata', () => {
  const base = {
    route: '/example',
    publicationStatus: PUBLICATION_STATUS.ACTIVE,
    indexable: true,
    reviewReference: null,
    releaseVersion: null,
    releaseDate: null,
  }

  assert.equal(isProductionPublicMarketRoute(base), false)
  assert.equal(isProductionPublicMarketRoute({ ...base, reviewReference: 'review-v1' }), false)
  assert.equal(isProductionPublicMarketRoute({
    ...base,
    reviewReference: 'review-v1',
    releaseVersion: '1.0',
  }), false)
  assert.equal(isProductionPublicMarketRoute({
    ...base,
    reviewReference: 'review-v1',
    releaseVersion: '1.0',
    releaseDate: 'August 27, 2026',
  }), false)
  assert.equal(isProductionPublicMarketRoute({
    ...base,
    reviewReference: 'review-v1',
    releaseVersion: '1.0',
    releaseDate: '2026-08-27',
  }), true)
})

test('registry routes and identifiers are unique and lookup fails closed', () => {
  const routes = PUBLIC_MARKET_REGISTRY.map((record) => record.route)
  const ids = PUBLIC_MARKET_REGISTRY.map((record) => record.id)

  assert.equal(new Set(routes).size, routes.length)
  assert.equal(new Set(ids).size, ids.length)
  assert.equal(getPublicMarketRecord('/not-a-market'), null)
  assert.equal(getPublicMarketRecord(null), null)
})
