import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPostUseUpdatePatch, followUpMoodFace, needsPostUseFollowUp } from './journalFollowUp.js'

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

test('post-use update patch preserves original session fields by using separate follow-up fields', () => {
  const patch = buildPostUseUpdatePatch({
    rating: 4,
    sleepQuality: 3,
    moodFace: 'good',
    hasSideEffects: true,
    sideEffects: ['Dry Mouth'],
    notes: ' Later follow-up note ',
    updatedAt: '2026-10-04T12:00:00.000Z',
  })

  assert.equal(Object.hasOwn(patch, 'notes'), false)
  assert.equal(Object.hasOwn(patch, 'mood_face'), false)
  assert.equal(Object.hasOwn(patch, 'adverse_event_level'), false)
  assert.deepEqual(patch, {
    rating: 4,
    sleep_quality: 3,
    follow_up_mood_face: 'good',
    follow_up_adverse_event_level: null,
    side_effects: ['Dry Mouth'],
    follow_up_notes: 'Later follow-up note',
    update_completed: true,
    updated_at: '2026-10-04T12:00:00.000Z',
  })
})

test('follow-up mood uses the new field and supports completed legacy rows only', () => {
  assert.equal(followUpMoodFace({ mood_face: 'meh', follow_up_mood_face: 'good', update_completed: true }), 'good')
  assert.equal(followUpMoodFace({ mood_face: 'off', update_completed: true }), 'off')
  assert.equal(followUpMoodFace({ mood_face: 'meh', update_completed: false }), null)
  assert.equal(followUpMoodFace({ mood_face: 'meh' }), null)
})
