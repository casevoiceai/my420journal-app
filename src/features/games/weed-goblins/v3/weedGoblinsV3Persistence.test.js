import test from 'node:test'
import assert from 'node:assert/strict'
import { createMemoryWeedGoblinsV3Persistence } from './weedGoblinsV3Persistence.js'
import { createWeedGoblinsV3State } from './weedGoblinsV3State.js'

test('V3 memory persistence saves independent snapshots', async () => {
  const persistence = createMemoryWeedGoblinsV3Persistence()
  const state = createWeedGoblinsV3State({ seed: 'persist', runId: 'run', campaignId: 'campaign' })
  await persistence.save(state)
  const restored = await persistence.load()
  assert.deepEqual(restored, state)
  restored.player.name = 'Changed'
  const again = await persistence.load()
  assert.equal(again.player.name, '')
  await persistence.clear()
  assert.equal(await persistence.load(), null)
})
