import test from 'node:test'
import assert from 'node:assert/strict'

import {
  enqueueSharedContribution,
  getQueuedSharedContributions,
  submitEntryContribution,
} from './sharedContributionQueue.js'

class MemoryStorage {
  constructor() {
    this.map = new Map()
  }

  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null
  }

  setItem(key, value) {
    this.map.set(key, String(value))
  }

  removeItem(key) {
    this.map.delete(key)
  }
}

test('Phase 1 Shared-off entry path clears stale queued contribution payloads and does not fetch', async () => {
  globalThis.localStorage = new MemoryStorage()

  const originalFetch = globalThis.fetch
  let fetchCalls = 0
  globalThis.fetch = async () => {
    fetchCalls += 1
    throw new Error('Phase 1 Shared-off path must not fetch')
  }

  try {
    const queued = enqueueSharedContribution({ product_key: 'legacy-test', effect_tags: ['Calm'] })
    assert.equal(queued.queued, true)
    assert.equal(getQueuedSharedContributions().length, 1)

    const result = await submitEntryContribution({ product_name: 'New local entry' })

    assert.equal(result.ok, true)
    assert.equal(result.status, 'shared_opt_in_disabled')
    assert.equal(result.skipped, true)
    assert.equal(fetchCalls, 0)
    assert.deepEqual(getQueuedSharedContributions(), [])
  } finally {
    globalThis.fetch = originalFetch
  }
})
