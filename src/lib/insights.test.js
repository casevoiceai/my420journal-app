import test from 'node:test'
import assert from 'node:assert/strict'
import { analyzeInsights, countByValue, timeBucket } from './insights.js'

test('countByValue ignores empty values and sorts by count', () => {
  assert.deepEqual(countByValue(['Calm', '', null, 'Relaxed', 'Calm']), [['Calm', 2], ['Relaxed', 1]])
})

test('timeBucket reflects the local logging hour', () => {
  const morning = new Date(2026, 9, 4, 8, 0).toISOString()
  const night = new Date(2026, 9, 4, 23, 0).toISOString()
  assert.equal(timeBucket(morning), 'Morning')
  assert.equal(timeBucket(night), 'Night')
})

test('analyzeInsights uses only cannabis entries and preserves sample counts', () => {
  const entries = [
    { entry_type: 'cannabis', product_name: 'Red Berries', rating: 5, sleep_quality: 4, update_completed: true, mood_face: 'good', side_effects: [], body_tags: ['Relaxed'], mind_tags: ['Focused'], mood_tags: ['Calm'], category: 'Flower', strain_type: 'Hybrid', created_at: '2026-10-04T01:00:00-04:00' },
    { entry_type: 'cannabis', product_name: 'Red Berries', rating: 4, sleep_quality: 5, update_completed: true, mood_face: 'good', side_effects: ['Dry mouth'], body_tags: ['Relaxed'], mind_tags: ['Focused'], mood_tags: ['Calm'], category: 'Vape', strain_type: 'Hybrid', created_at: '2026-10-03T20:00:00-04:00' },
    { entry_type: 'cannabis', product_name: 'Strawberry Cream', rating: 1, update_completed: true, mood_face: 'off', side_effects: [], body_tags: [], mind_tags: [], mood_tags: ['Disappointed'], category: 'Flower', strain_type: 'Hybrid', created_at: '2026-09-20T20:00:00-04:00' },
    { entry_type: 'note', title: 'Ignore me', rating: 5, created_at: '2026-10-04T12:00:00-04:00' },
  ]

  const result = analyzeInsights(entries, new Date('2026-10-04T12:00:00-04:00'))
  assert.equal(result.total, 3)
  assert.equal(result.completedFollowups, 3)
  assert.equal(result.ratedSessions, 3)
  assert.equal(result.averageRating, 10 / 3)
  assert.equal(result.averageSleepQuality, 4.5)
  assert.deepEqual(result.bodyCounts[0], ['Relaxed', 2])
  assert.deepEqual(result.moodOutcomeCounts[0], ['good', 2])
  assert.deepEqual(result.sideEffectCounts[0], ['Dry mouth', 1])
  assert.equal(result.mostRepeatedProduct.label, 'Red Berries')
  assert.equal(result.mostRepeatedProduct.sessions, 2)
  assert.equal(result.highestRatedRepeatProduct.label, 'Red Berries')
  assert.equal(result.highestRatedRepeatProduct.averageRating, 4.5)
  assert.equal(result.highestRatedRepeatProduct.ratedSessions, 2)
})

test('repeat-product rating evidence requires at least two rated sessions for the same product', () => {
  const result = analyzeInsights([
    { product_name: 'One Off', rating: 5, created_at: '2026-10-04T12:00:00-04:00' },
    { product_name: 'Repeated', rating: 4, created_at: '2026-10-03T12:00:00-04:00' },
    { product_name: 'Repeated', created_at: '2026-10-02T12:00:00-04:00' },
  ], new Date('2026-10-04T12:00:00-04:00'))

  assert.equal(result.mostRepeatedProduct.label, 'Repeated')
  assert.equal(result.highestRatedRepeatProduct, null)
})
