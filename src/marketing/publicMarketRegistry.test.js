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
import {
  GLOBAL_MARKET_PAGE_CONTENT,
  US_REGIONAL_MARKET_CONTENT,
  buildUSMarketPageModel,
  validateUSMarketDelta,
} from './marketPageInheritance.js'
import {
  CONTENT_REVIEW_STATUS,
  US_MARKET_CONTENT_PACKETS,
  getApprovedUSMarketDelta,
  getUSMarketContentPacket,
  isApprovedUSMarketContentPacket,
} from './usMarketContentPackets.js'

const registrySource = fs.readFileSync(new URL('./publicMarketRegistry.js', import.meta.url), 'utf8')
const marketTemplateSource = fs.readFileSync(new URL('./USMarketPageTemplate.jsx', import.meta.url), 'utf8')
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

test('U.S. market page inheritance owns global and regional truth once', () => {
  assert.equal(GLOBAL_MARKET_PAGE_CONTENT.privacyHeading, 'Private by design')
  assert.equal(GLOBAL_MARKET_PAGE_CONTENT.boundaryHeading, 'A record, not a recommendation')
  assert.match(GLOBAL_MARKET_PAGE_CONTENT.boundaryBody, /does not provide medical advice/i)
  assert.match(GLOBAL_MARKET_PAGE_CONTENT.boundaryBody, /does not.*decide what you should buy or use/i)
  assert.match(US_REGIONAL_MARKET_CONTENT.contextBody, /rules vary by state/i)
  assert.match(US_REGIONAL_MARKET_CONTENT.contextBody, /does not treat a selected market as proof/i)
})

test('state content packets exist only as fail-closed review gates', () => {
  assert.deepEqual(
    US_MARKET_CONTENT_PACKETS.map((packet) => packet.marketId),
    ['US-PA', 'US-NY', 'US-NJ', 'US-MA']
  )

  for (const packet of US_MARKET_CONTENT_PACKETS) {
    assert.equal(packet.reviewStatus, CONTENT_REVIEW_STATUS.REVIEW_REQUIRED)
    assert.equal(packet.reviewReference, null)
    assert.equal(packet.contentVersion, null)
    assert.equal(packet.reviewedAt, null)
    assert.equal(packet.delta, null)
    assert.equal(isApprovedUSMarketContentPacket(packet), false)
    assert.equal(getApprovedUSMarketDelta(packet.marketId), null)
  }

  assert.equal(getUSMarketContentPacket('US-CT'), null)
  assert.equal(getUSMarketContentPacket('US-ZZ'), null)
})

test('reusable U.S. market page model requires approved content plus a matching market delta', () => {
  const pa = getPublicMarketRecord('/us/pennsylvania')
  const delta = {
    marketId: 'US-PA',
    marketName: 'Pennsylvania',
    heroTitle: 'Synthetic reviewed hero for test only',
    heroBody: 'Synthetic reviewed support copy for test only.',
    useCaseTitle: 'Synthetic reviewed use case',
    useCaseBody: 'Synthetic reviewed use-case copy for test only.',
    ageProgramText: 'Synthetic reviewed age/program note.',
    footerNote: '',
  }
  const approvedPacket = {
    marketId: 'US-PA',
    route: '/us/pennsylvania',
    reviewStatus: CONTENT_REVIEW_STATUS.APPROVED,
    reviewReference: 'synthetic-test-review',
    contentVersion: 'test-v1',
    reviewedAt: '2026-10-04',
    delta,
  }

  assert.equal(validateUSMarketDelta(pa, delta), true)
  assert.equal(validateUSMarketDelta(pa, { ...delta, marketId: 'US-NY' }), false)
  assert.equal(validateUSMarketDelta(pa, { ...delta, heroBody: '' }), false)
  assert.equal(validateUSMarketDelta(getPublicMarketRecord('/us'), delta), false)
  assert.equal(isApprovedUSMarketContentPacket(approvedPacket), true)

  const model = buildUSMarketPageModel(pa, approvedPacket)
  assert.equal(model.marketId, 'US-PA')
  assert.equal(model.ctaHref, '/app?market=US-PA')
  assert.deepEqual(model.breadcrumb, ['My420Journal', 'United States', 'Pennsylvania'])
  assert.equal(model.inheritedGlobal, GLOBAL_MARKET_PAGE_CONTENT)
  assert.equal(model.inheritedRegional, US_REGIONAL_MARKET_CONTENT)
  assert.equal(buildUSMarketPageModel(pa, { ...approvedPacket, reviewStatus: CONTENT_REVIEW_STATUS.REVIEW_REQUIRED }), null)
  assert.equal(buildUSMarketPageModel(pa, { ...approvedPacket, route: '/us/new-york' }), null)
  assert.equal(buildUSMarketPageModel(pa, null), null)
})

test('U.S. market template exists but remains unpublished and unregistered', () => {
  assert.match(marketTemplateSource, /MarketingLayout/)
  assert.match(marketTemplateSource, /FeatureGrid/)
  assert.match(marketTemplateSource, /buildUSMarketPageModel/)
  assert.match(marketTemplateSource, /Read the Privacy Notice/)
  assert.match(marketTemplateSource, /Open My420Journal/)
  assert.equal(appSource.includes('USMarketPageTemplate'), false)

  for (const record of PUBLIC_MARKET_REGISTRY.filter((item) => item.parentRegion === 'US')) {
    assert.equal(appSource.includes(`path="${record.route}"`), false)
  }
})

test('registry routes and identifiers are unique and lookup fails closed', () => {
  const routes = PUBLIC_MARKET_REGISTRY.map((record) => record.route)
  const ids = PUBLIC_MARKET_REGISTRY.map((record) => record.id)

  assert.equal(new Set(routes).size, routes.length)
  assert.equal(new Set(ids).size, ids.length)
  assert.equal(getPublicMarketRecord('/not-a-market'), null)
  assert.equal(getPublicMarketRecord(null), null)
})
