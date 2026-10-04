import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveDispensaryName } from './dispensaryInput.js'

test('manual dispensary text is preserved when no place result is selected', () => {
  assert.equal(resolveDispensaryName(null, '  QA Test Dispensary  '), 'QA Test Dispensary')
})

test('selected dispensary name wins over stale manual text', () => {
  assert.equal(
    resolveDispensaryName({ name: 'Selected Shop', place_id: 'abc' }, 'Typed Shop'),
    'Selected Shop',
  )
})

test('empty dispensary input remains null', () => {
  assert.equal(resolveDispensaryName(null, '   '), null)
})
