import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const newEntrySource = fs.readFileSync(new URL('../screens/NewEntry.jsx', import.meta.url), 'utf8')
const quickEntrySource = fs.readFileSync(new URL('../screens/QuickEntry.jsx', import.meta.url), 'utf8')

function assertNoPreciseGeolocation(source) {
  assert.equal(source.includes('navigator.geolocation'), false)
  assert.equal(source.includes('getCurrentPosition'), false)
  assert.equal(source.includes('pos.coords.latitude'), false)
  assert.equal(source.includes('pos.coords.longitude'), false)
  assert.equal(source.includes('getUserCoords'), false)
  assert.equal(source.includes('gpsCoords'), false)
  assert.equal(source.includes('travelRadius'), false)
  assert.equal(source.includes('lat: coords'), false)
  assert.equal(source.includes('lng: coords'), false)
}

test('entry flows do not request precise browser geolocation', () => {
  assertNoPreciseGeolocation(newEntrySource)
  assertNoPreciseGeolocation(quickEntrySource)
})
