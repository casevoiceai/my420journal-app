import test from 'node:test'
import assert from 'node:assert/strict'

import {
  PERSONALIZATION_LIMITS,
  saveWeedGoblinsRunSummary,
  weedGoblinsRunStorageKey,
} from './weedGoblinsLocalDataAdapter.js'
import {
  loadConsoleLocalAdapterSnapshot,
  runInteractiveWeedGoblins,
  saveConsoleLocalAdapterRunSummary,
} from './weedGoblinsConsoleStatic.js'

const RUN_SUMMARY_FIELDS = Object.freeze([
  'adventureId',
  'backgroundId',
  'stolenItem',
  'routeId',
  'midpointChoice',
  'ending',
  'outcomeSummary',
  'trouble',
  'manaRemaining',
  'complicationCount',
  'narrationTier',
  'reason',
])

function createUserStore(userId = 'user-1') {
  return {
    auth: {
      async getUser() {
        return { data: { user: { id: userId } }, error: null }
      },
    },
  }
}

function createMemoryStorage(initialValues = {}) {
  const values = { ...initialValues }
  return {
    getItem(key) {
      return Object.hasOwn(values, key) ? values[key] : null
    },
    setItem(key, value) {
      values[key] = String(value)
    },
    removeItem(key) {
      delete values[key]
    },
  }
}

function createScriptedReadline(answers) {
  const queue = [...answers]
  return {
    async question() {
      if (queue.length === 0) throw new Error('Test input ended before the run was complete.')
      return queue.shift()
    },
    close() {},
  }
}

function completeSummary(index = 1) {
  return {
    adventureId: 'goblin-highlands-session-1',
    backgroundId: 'hauler',
    stolenItem: `the Test ${index} Field Reliquary`,
    routeId: 'ridge',
    midpointChoice: 'skip',
    ending: 'recovery',
    outcomeSummary: `recovered the Test ${index} Field Reliquary`,
    trouble: 0,
    manaRemaining: 2,
    complicationCount: 0,
    narrationTier: 'normal',
    reason: 'strength victory',
  }
}

test('completed run saves only the whitelisted summary fields', async () => {
  const userId = 'user-1'
  const storage = createMemoryStorage()
  const runSummary = {
    ...completeSummary(1),
    seed: 'must-not-be-saved',
    priorCompletedRunCount: 99,
    productNames: ['Private Product'],
    dispensaryNames: ['Private Dispensary'],
    personalizationSnapshot: { private: true },
    notes: 'PRIVATE NOTE MUST NOT BE SAVED',
  }

  const result = await saveWeedGoblinsRunSummary({
    runSummary,
    store: createUserStore(userId),
    storage,
    userId,
  })

  const stored = JSON.parse(storage.getItem(weedGoblinsRunStorageKey(userId)))
  assert.equal(stored.length, 1)
  assert.deepEqual(Object.keys(stored[0]), RUN_SUMMARY_FIELDS)
  assert.deepEqual(stored[0], result.summary)

  const serialized = JSON.stringify(stored)
  for (const forbidden of [
    'must-not-be-saved',
    'Private Product',
    'Private Dispensary',
    'PRIVATE NOTE MUST NOT BE SAVED',
    'personalizationSnapshot',
    'priorCompletedRunCount',
  ]) {
    assert.equal(serialized.includes(forbidden), false)
  }
})

test('saved history caps at 10 and drops the oldest run', async () => {
  const userId = 'user-1'
  const key = weedGoblinsRunStorageKey(userId)
  const existing = Array.from(
    { length: PERSONALIZATION_LIMITS.previousRuns },
    (_, index) => ({
      ...completeSummary(index + 1),
      extra: `old-extra-${index + 1}`,
    }),
  )
  const storage = createMemoryStorage({
    [key]: JSON.stringify(existing),
  })

  const result = await saveWeedGoblinsRunSummary({
    runSummary: completeSummary(11),
    store: createUserStore(userId),
    storage,
    userId,
  })

  assert.equal(result.history.length, PERSONALIZATION_LIMITS.previousRuns)
  assert.equal(result.history[0].outcomeSummary, completeSummary(2).outcomeSummary)
  assert.equal(result.history.at(-1).outcomeSummary, completeSummary(11).outcomeSummary)

  const stored = JSON.parse(storage.getItem(key))
  assert.equal(stored.length, PERSONALIZATION_LIMITS.previousRuns)
  assert.equal(stored[0].outcomeSummary, completeSummary(2).outcomeSummary)
  assert.equal(stored.at(-1).outcomeSummary, completeSummary(11).outcomeSummary)
  assert.equal(JSON.stringify(stored).includes('old-extra-'), false)
})

test('second local-adapter console run surfaces the first real saved outcome', async () => {
  const storage = createMemoryStorage()
  const choices = ['1', '1', '1', '3', '1']

  const firstSnapshot = await loadConsoleLocalAdapterSnapshot({ storage })
  assert.equal(firstSnapshot.previousRuns.length, 0)

  const firstRun = await runInteractiveWeedGoblins({
    seed: 'recovery-1',
    priorCompletedRunCount: firstSnapshot.previousRuns.length,
    journalSnapshot: firstSnapshot,
    previousRuns: firstSnapshot.previousRuns,
    sourceLabel: 'test local adapter',
    readline: createScriptedReadline(choices),
    onRunComplete: (state) => saveConsoleLocalAdapterRunSummary(
      state.runSummary,
      { storage },
    ),
  })

  assert.equal(firstRun.status, 'completed')
  assert.equal(firstRun.ending, 'recovery')

  const secondSnapshot = await loadConsoleLocalAdapterSnapshot({ storage })
  assert.equal(secondSnapshot.previousRuns.length, 1)
  assert.equal(
    secondSnapshot.previousRuns[0].outcomeSummary,
    firstRun.runSummary.outcomeSummary,
  )

  const secondRun = await runInteractiveWeedGoblins({
    seed: 'recovery-1',
    priorCompletedRunCount: secondSnapshot.previousRuns.length,
    journalSnapshot: secondSnapshot,
    previousRuns: secondSnapshot.previousRuns,
    sourceLabel: 'test local adapter',
    readline: createScriptedReadline(choices),
    onRunComplete: (state) => saveConsoleLocalAdapterRunSummary(
      state.runSummary,
      { storage },
    ),
  })

  assert.match(
    secondRun.narration[0],
    new RegExp(`Last time you ${firstRun.runSummary.outcomeSummary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
  )
})
