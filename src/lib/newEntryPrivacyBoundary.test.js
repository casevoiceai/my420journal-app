import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const newEntrySource = fs.readFileSync(new URL('../screens/NewEntry.jsx', import.meta.url), 'utf8')

test('new entry does not request precise browser geolocation', () => {
  assert.equal(newEntrySource.includes('navigator.geolocation'), false)
  assert.equal(newEntrySource.includes('getCurrentPosition'), false)
  assert.equal(newEntrySource.includes('pos.coords.latitude'), false)
  assert.equal(newEntrySource.includes('pos.coords.longitude'), false)
})
