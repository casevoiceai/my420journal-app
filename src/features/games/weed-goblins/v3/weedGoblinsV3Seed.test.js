import test from 'node:test'
import assert from 'node:assert/strict'
import { seededOrder, seededUnit } from './weedGoblinsV3Seed.js'

test('same seed and namespace is deterministic', () => {
  assert.equal(seededUnit('mossgate', 'questions'), seededUnit('mossgate', 'questions'))
})

test('seeded order is reproducible and does not mutate input', () => {
  const input = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
  const first = seededOrder(input, { seed: 'abc', namespace: 'x' }).map((item) => item.id)
  const second = seededOrder(input, { seed: 'abc', namespace: 'x' }).map((item) => item.id)
  assert.deepEqual(first, second)
  assert.deepEqual(input.map((item) => item.id), ['a', 'b', 'c', 'd'])
})
