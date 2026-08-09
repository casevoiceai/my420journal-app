import test from 'node:test'
import assert from 'node:assert/strict'

import {
  advanceWeedGoblinsRun,
  advanceWeedGoblinsSessionText,
  createWeedGoblinsRun,
  getAvailableActions,
} from './weedGoblinsEngine.js'
import {
  prepareWeedGoblinsChoiceTurn,
  resolveWeedGoblinsPreparedMechanics,
} from './weedGoblinsChatController.js'
import {
  clearWeedGoblinsActiveRun,
  readWeedGoblinsActiveRun,
  saveWeedGoblinsActiveRun,
  weedGoblinsActiveRunStorageKey,
} from './weedGoblinsPersistence.js'
import {
  createEmptyWeedGoblinsCampaignState,
  readWeedGoblinsCampaignState,
  saveWeedGoblinsRunSummary,
  weedGoblinsCampaignStorageKey,
} from './weedGoblinsLocalDataAdapter.js'

function createMemoryStorage(initial = {}) {
  const values = { ...initial }
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
    dump() {
      return { ...values }
    },
  }
}

function createMockStore(userId = 'local-user') {
  return {
    auth: {
      async getUser() {
        return { data: { user: { id: userId } }, error: null }
      },
    },
  }
}

function stateAtRoute(seed = 'persistence-route') {
  let state = createWeedGoblinsRun({ seed })
  state = advanceWeedGoblinsRun(state, 'session:continue')
  state = advanceWeedGoblinsSessionText(state, 'Fenna Duskrow')
  state = advanceWeedGoblinsRun(state, 'session:race:human')
  state = advanceWeedGoblinsRun(state, 'session:weapon:sword')
  state = advanceWeedGoblinsRun(state, 'background:tracker')
  state = advanceWeedGoblinsRun(state, 'session:pronoun:they')
  return advanceWeedGoblinsRun(state, 'session:look:tall-weathered')
}

test('active run round-trips engine state, transcript, choices, RNG, and Help locally', () => {
  const storage = createMemoryStorage()
  const userId = 'user-1'
  const state = stateAtRoute('active-round-trip')
  const choices = getAvailableActions(state)
  const messages = [
    { direction: 'incoming', kind: 'message', text: 'Rattlebridge waits ahead.', source: 'test' },
    { direction: 'outgoing', kind: 'message', text: 'I inspect the bridge.', source: 'player-text', actionId: 'free-text' },
  ]
  const contaminatedState = {
    ...state,
    journalSnapshot: {
      notes: 'PRIVATE JOURNAL NOTE MUST NOT PERSIST',
      voice_transcript: 'PRIVATE TRANSCRIPT MUST NOT PERSIST',
    },
  }

  saveWeedGoblinsActiveRun({
    storage,
    userId,
    state: contaminatedState,
    messages,
    choices,
    helpLevel: 2,
    helpMessage: { level: 2, text: 'Look at the alarm lines.', solvesObstacle: false },
  })

  const raw = storage.getItem(weedGoblinsActiveRunStorageKey(userId))
  assert.ok(raw)
  assert.equal(raw.includes('PRIVATE JOURNAL NOTE MUST NOT PERSIST'), false)
  assert.equal(raw.includes('PRIVATE TRANSCRIPT MUST NOT PERSIST'), false)

  const restored = readWeedGoblinsActiveRun({ storage, userId })
  assert.equal(restored.state.seed, state.seed)
  assert.equal(restored.state.rngState, state.rngState)
  assert.equal(restored.state.sceneId, state.sceneId)
  assert.equal(restored.state.currentRoomId, state.currentRoomId)
  assert.deepEqual(restored.state.roomState, state.roomState)
  assert.equal(restored.messages.length, 2)
  assert.equal(restored.choices.length, choices.length)
  assert.equal(restored.helpLevel, 2)
  assert.equal(restored.helpMessage.text, 'Look at the alarm lines.')
})

test('pending explicit D20 turn resumes before the roll and produces the same deterministic result', () => {
  const storage = createMemoryStorage()
  const state = stateAtRoute('pending-roll-round-trip')
  const action = getAvailableActions(state).find((candidate) => candidate.id === 'route:quiet')
  const prepared = prepareWeedGoblinsChoiceTurn({ state, action })
  assert.equal(prepared.requiresRoll, true)

  saveWeedGoblinsActiveRun({
    storage,
    userId: 'user-2',
    state,
    messages: [prepared.outgoingMessage, prepared.setupMessage, prepared.rollTriggerMessage],
    choices: [],
    pendingTurn: prepared,
  })

  const restored = readWeedGoblinsActiveRun({ storage, userId: 'user-2' })
  assert.equal(restored.pendingTurn.requiresRoll, true)
  assert.equal(restored.pendingTurn.before.seed, state.seed)
  assert.equal(restored.pendingTurn.before.rngState, state.rngState)

  const originalMechanics = resolveWeedGoblinsPreparedMechanics({ preparedTurn: prepared })
  const restoredMechanics = resolveWeedGoblinsPreparedMechanics({ preparedTurn: restored.pendingTurn })
  assert.deepEqual(restoredMechanics.checkEvent.rolls, originalMechanics.checkEvent.rolls)
  assert.equal(restoredMechanics.checkEvent.roll, originalMechanics.checkEvent.roll)
  assert.equal(restoredMechanics.after.rngState, originalMechanics.after.rngState)
  assert.equal(restoredMechanics.after.sceneId, originalMechanics.after.sceneId)
})

test('completed or explicitly cleared runs do not remain resumable', () => {
  const storage = createMemoryStorage()
  const userId = 'user-3'
  const state = stateAtRoute('clear-active')
  saveWeedGoblinsActiveRun({ storage, userId, state, messages: [], choices: [] })
  assert.ok(readWeedGoblinsActiveRun({ storage, userId }))

  saveWeedGoblinsActiveRun({ storage, userId, state: { ...state, status: 'completed' } })
  assert.equal(readWeedGoblinsActiveRun({ storage, userId }), null)

  saveWeedGoblinsActiveRun({ storage, userId, state, messages: [], choices: [] })
  clearWeedGoblinsActiveRun({ storage, userId })
  assert.equal(readWeedGoblinsActiveRun({ storage, userId }), null)
})

test('corrupt or wrong-version active data is ignored safely', () => {
  const userId = 'user-4'
  const key = weedGoblinsActiveRunStorageKey(userId)
  assert.equal(readWeedGoblinsActiveRun({ storage: createMemoryStorage({ [key]: '{broken' }), userId }), null)
  assert.equal(readWeedGoblinsActiveRun({
    storage: createMemoryStorage({ [key]: JSON.stringify({ version: 999, state: {} }) }),
    userId,
  }), null)
})

test('completed Chapter 1 runs persist branch/reward campaign memory and deduplicate the same seed', async () => {
  const storage = createMemoryStorage()
  const store = createMockStore('campaign-user')
  const runSummary = {
    seed: 'campaign-run-1',
    adventureId: 'goblin-highlands-session-1',
    backgroundId: 'tracker',
    stolenItem: 'the Amber Field Satchel',
    routeId: 'quiet',
    midpointChoice: 'help',
    chapterOneBranches: {
      nibTreatment: 'safe',
      tributeArrangement: 'exposed',
      kingTreatment: 'spared',
      stolenItemCondition: 'intact',
    },
    chapterOneRewards: ['black-root seal', 'goblin favor', 'highland charm'],
    ending: 'recovery',
    outcomeSummary: 'recovered the Amber Field Satchel',
    trouble: 0,
    manaRemaining: 1,
    complicationCount: 0,
    narrationTier: 'normal',
  }

  const first = await saveWeedGoblinsRunSummary({ runSummary, store, storage })
  assert.equal(first.summary.seed, 'campaign-run-1')
  assert.deepEqual(first.summary.chapterOneBranches, runSummary.chapterOneBranches)
  assert.deepEqual(first.summary.chapterOneRewards, runSummary.chapterOneRewards)
  assert.equal(first.campaignState.completedRunCount, 1)
  assert.equal(first.campaignState.chapterOne.completedRunCount, 1)
  assert.equal(first.campaignState.chapterOne.lastEnding, 'recovery')
  assert.equal(first.campaignState.chapterOne.latestBranches.nibTreatment, 'safe')
  assert.deepEqual(first.campaignState.chapterOne.rewards, ['black-root seal', 'goblin favor', 'highland charm'])

  const second = await saveWeedGoblinsRunSummary({ runSummary, store, storage })
  assert.equal(second.history.length, 1)
  assert.equal(second.campaignState.completedRunCount, 1)
  assert.equal(second.campaignState.chapterOne.completedRunCount, 1)

  const readBack = await readWeedGoblinsCampaignState({ store, storage })
  assert.deepEqual(readBack, second.campaignState)
  assert.ok(storage.getItem(weedGoblinsCampaignStorageKey('campaign-user')))
})

test('empty campaign state has no invented later-chapter mechanics', () => {
  assert.deepEqual(createEmptyWeedGoblinsCampaignState(), {
    version: 1,
    completedRunCount: 0,
    chapterOne: {
      completedRunCount: 0,
      lastRunSeed: '',
      lastEnding: '',
      lastStolenItem: '',
      latestBranches: {
        nibTreatment: 'ignored',
        tributeArrangement: 'unknown',
        kingTreatment: 'unresolved',
        stolenItemCondition: 'not-recovered',
      },
      rewards: [],
    },
  })
})
