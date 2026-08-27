import test from 'node:test'
import assert from 'node:assert/strict'
import { STARTER_BLOCKS } from './content/starterLandsBlocks.js'
import { createStoryRegistry, validateStoryBlock } from './weedGoblinsStoryRegistry.js'

test('starter registry has unique valid blocks', () => {
  const registry = createStoryRegistry(STARTER_BLOCKS)
  assert.equal(registry.all().length, new Set(STARTER_BLOCKS.map((block) => block.id)).size)
  for (const block of STARTER_BLOCKS) assert.equal(validateStoryBlock(block), true)
})

test('registry rejects duplicate ids', () => {
  assert.throws(() => createStoryRegistry([STARTER_BLOCKS[0], STARTER_BLOCKS[0]]), /Duplicate/)
})

test('eligibility respects required state paths', () => {
  const registry = createStoryRegistry(STARTER_BLOCKS)
  const empty = { player: { ancestryId: null, weaponId: null, backgroundId: null } }
  assert.equal(registry.eligible(empty).some((block) => block.id === 'starter:armory:arrival'), false)
  const ready = { player: { ancestryId: 'dwarf', weaponId: 'mace', backgroundId: 'tracker' } }
  assert.equal(registry.eligible(ready).some((block) => block.id === 'starter:armory:arrival'), true)
})
