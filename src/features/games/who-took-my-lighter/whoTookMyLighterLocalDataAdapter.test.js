import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildWhoTookMyLighterPersonalization,
  loadWhoTookMyLighterActiveRun,
  readWhoTookMyLighterLocalContext,
  readWhoTookMyLighterRunHistory,
  saveWhoTookMyLighterActiveRun,
  saveWhoTookMyLighterCompletion,
  sanitizeWhoTookMyLighterCompletionSummary,
  whoTookMyLighterActiveStorageKey,
} from './whoTookMyLighterLocalDataAdapter.js'
import {
  advanceWhoTookMyLighterRun,
  createWhoTookMyLighterRun,
} from './whoTookMyLighterEngine.js'

function createStorage() {
  const values = new Map()
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null },
    setItem(key, value) { values.set(key, String(value)) },
    removeItem(key) { values.delete(key) },
  }
}

function createStore({ userId = 'user-1', entries = [] } = {}) {
  return {
    auth: {
      async getUser() { return { data: { user: userId ? { id: userId } : null }, error: null } },
    },
    from(table) {
      assert.equal(table, 'entries')
      return {
        select(columns) {
          assert.equal(columns, 'category, body_tags, mind_tags, mood_tags, terpenes')
          return {
            async eq(column, value) {
              assert.equal(column, 'user_id')
              assert.equal(value, userId)
              return { data: entries, error: null }
            },
          }
        },
      }
    },
  }
}

test('builds only coarse structured personalization from allowed entry fields', () => {
  const personalization = buildWhoTookMyLighterPersonalization({
    entries: [
      {
        category: 'Flower',
        body_tags: ['Relaxed', 'Heavy'],
        mind_tags: ['Quiet'],
        mood_tags: ['Happy'],
        terpenes: { Myrcene: 1, Caryophyllene: 0.5 },
        notes: 'must not appear',
        dispensary_name: 'must not appear',
        price: 99,
      },
      {
        category: 'Flower',
        body_tags: ['Relaxed'],
        mind_tags: ['Quiet'],
        mood_tags: [],
        terpenes: { Myrcene: 1 },
      },
    ],
    completedRuns: [{}, {}, {}],
  })

  assert.deepEqual(personalization.categoryBands, ['Flower'])
  assert.deepEqual(personalization.effectTags.slice(0, 2), ['Relaxed', 'Quiet'])
  assert.equal(personalization.profileLabels[0], 'Myrcene')
  assert.equal(personalization.entryBand, '1-9')
  assert.equal(personalization.runBand, '3-4')
  const serialized = JSON.stringify(personalization)
  assert.equal(serialized.includes('must not appear'), false)
  assert.equal(serialized.includes('price'), false)
})

test('reads local context by selecting only structured allowed columns', async () => {
  const storage = createStorage()
  const entries = [{
    category: 'Vape',
    body_tags: ['Light'],
    mind_tags: ['Focused'],
    mood_tags: [],
    terpenes: { Limonene: 1 },
  }]
  const context = await readWhoTookMyLighterLocalContext({
    store: createStore({ entries }),
    storage,
  })
  assert.equal(context.userId, 'user-1')
  assert.deepEqual(context.personalization.categoryBands, ['Vape'])
  assert.deepEqual(context.completedRuns, [])
  assert.equal(context.activeRun, null)
})

test('active run persists and restores under a user-scoped local key', () => {
  const storage = createStorage()
  let run = createWhoTookMyLighterRun({ seed: 'persist-adapter' })
  run = advanceWhoTookMyLighterRun(run, 'begin:investigation')
  saveWhoTookMyLighterActiveRun({ run, storage, userId: 'abc' })
  assert.ok(storage.getItem(whoTookMyLighterActiveStorageKey('abc')))
  assert.deepEqual(loadWhoTookMyLighterActiveRun({ storage, userId: 'abc' }), run)
  assert.equal(loadWhoTookMyLighterActiveRun({ storage, userId: 'other' }), null)
})

test('completion history keeps only whitelisted compact fields and clears active run', () => {
  const storage = createStorage()
  let run = createWhoTookMyLighterRun({ seed: 'complete-adapter' })
  run = advanceWhoTookMyLighterRun(run, 'begin:investigation')
  run = advanceWhoTookMyLighterRun(run, 'inspect:scene-context')
  run = advanceWhoTookMyLighterRun(run, 'begin:interrogations')
  const [first, second] = run.caseDefinition.activeSuspectIds
  run = advanceWhoTookMyLighterRun(run, `interview:${first}`)
  run = advanceWhoTookMyLighterRun(run, `interview:${second}`)
  run = advanceWhoTookMyLighterRun(run, 'inspect:physical-marker')
  saveWhoTookMyLighterActiveRun({ run, storage, userId: 'abc' })
  run = advanceWhoTookMyLighterRun(run, `accuse:${run.caseDefinition.culpritId}`)

  const history = saveWhoTookMyLighterCompletion({
    completionSummary: { ...run.completionSummary, rawNotes: 'private', exactPrice: 44 },
    storage,
    userId: 'abc',
  })
  assert.equal(history.length, 1)
  assert.equal('rawNotes' in history[0], false)
  assert.equal('exactPrice' in history[0], false)
  assert.equal(loadWhoTookMyLighterActiveRun({ storage, userId: 'abc' }), null)
  assert.deepEqual(readWhoTookMyLighterRunHistory({ storage, userId: 'abc' }), history)
})

test('completion sanitizer rejects non-WTML summaries', () => {
  assert.equal(sanitizeWhoTookMyLighterCompletionSummary({ gameId: 'other', caseSeed: 'x' }), null)
})
