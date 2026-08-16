import test from 'node:test'
import assert from 'node:assert/strict'
import { advanceTheNewPlaceRun, createTheNewPlaceRun, getTheNewPlaceActions } from './theNewPlaceEngine.js'
import {
  buildTheNewPlaceCompletionSummary,
  buildTheNewPlacePersonalization,
  loadTheNewPlaceActiveRun,
  readTheNewPlaceLocalContext,
  readTheNewPlaceRunHistory,
  saveTheNewPlaceActiveRun,
  saveTheNewPlaceCompletion,
} from './theNewPlaceLocalDataAdapter.js'

function storage() {
  const map = new Map()
  return { getItem: (k) => map.get(k) ?? null, setItem: (k,v) => map.set(k,String(v)), removeItem: (k) => map.delete(k) }
}

function store(entries = []) {
  return {
    auth: { async getUser() { return { data: { user: { id: 'u1' } }, error: null } } },
    from(table) {
      assert.equal(table, 'entries')
      return { select(columns) {
        assert.equal(columns, 'category, body_tags, mind_tags, mood_tags, terpenes')
        return { async eq(column, value) { assert.equal(column, 'user_id'); assert.equal(value, 'u1'); return { data: entries, error: null } } }
      } }
    },
  }
}

function finish(run) {
  let next = run
  while (next.status === 'active') {
    next = advanceTheNewPlaceRun(next, getTheNewPlaceActions(next)[0].id)
    next = advanceTheNewPlaceRun(next, 'report:operations')
  }
  return next
}

test('builds only coarse allowed personalization', () => {
  const result = buildTheNewPlacePersonalization({ entries: [{ category: 'Flower', body_tags: ['Relaxed'], mind_tags: ['Quiet'], mood_tags: [], terpenes: { Myrcene: 1 }, notes: 'private', price: 99 }], completedRuns: [{}, {}] })
  assert.deepEqual(result.categoryBands, ['Flower'])
  assert.deepEqual(result.effectTags, ['Relaxed', 'Quiet'])
  assert.deepEqual(result.profileLabels, ['Myrcene'])
  assert.equal(result.runBand, '1-2')
  assert.equal(JSON.stringify(result).includes('private'), false)
})

test('local context queries only allowed structured columns', async () => {
  const context = await readTheNewPlaceLocalContext({ store: store([{ category: 'Vape', body_tags: [], mind_tags: [], mood_tags: [], terpenes: {} }]), storage: storage() })
  assert.equal(context.userId, 'u1')
  assert.deepEqual(context.personalization.categoryBands, ['Vape'])
})

test('active week persists and restores locally by user', () => {
  const s = storage()
  const run = createTheNewPlaceRun({ seed: 'persist' })
  saveTheNewPlaceActiveRun({ run, storage: s, userId: 'u1' })
  assert.deepEqual(loadTheNewPlaceActiveRun({ storage: s, userId: 'u1' }), run)
  assert.equal(loadTheNewPlaceActiveRun({ storage: s, userId: 'u2' }), null)
})

test('completion summary is compact and history clears active week', () => {
  const s = storage()
  let run = createTheNewPlaceRun({ seed: 'complete' })
  saveTheNewPlaceActiveRun({ run, storage: s, userId: 'u1' })
  run = finish(run)
  const summary = buildTheNewPlaceCompletionSummary(run)
  assert.deepEqual(Object.keys(summary).sort(), ['average','compliance','funds','gameId','inspectorFocusId','inspectorOutcome','inventory','outcomeId','reportConsistency','satisfaction','version','weekSeed'].sort())
  const history = saveTheNewPlaceCompletion({ run, storage: s, userId: 'u1' })
  assert.equal(history.length, 1)
  assert.equal(loadTheNewPlaceActiveRun({ storage: s, userId: 'u1' }), null)
  assert.deepEqual(readTheNewPlaceRunHistory({ storage: s, userId: 'u1' }), history)
})
