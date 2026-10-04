import test from 'node:test'
import assert from 'node:assert/strict'
import { needsPostUseFollowUp } from './journalFollowUp.js'

test('incomplete cannabis entries need a post-use follow-up', () => {
  assert.equal(needsPostUseFollowUp({ entry_type: 'cannabis', update_completed: false }), true)
  assert.equal(needsPostUseFollowUp({ entry_type: 'cannabis' }), true)
  assert.equal(needsPostUseFollowUp({ update_completed: null }), true)
})

test('completed cannabis entries and non-cannabis entries do not need the cannabis follow-up', () => {
  assert.equal(needsPostUseFollowUp({ entry_type: 'cannabis', update_completed: true }), false)
  assert.equal(needsPostUseFollowUp({ entry_type: 'note', update_completed: false }), false)
  assert.equal(needsPostUseFollowUp({ entry_type: 'sleep_start', update_completed: false }), false)
  assert.equal(needsPostUseFollowUp(null), false)
})
