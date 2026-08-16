import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createWeedGoblinsChatSession,
  getWeedGoblinsQuickReplies,
  prepareWeedGoblinsChoiceTurn,
  prepareWeedGoblinsFreeTextTurn,
  resolveWeedGoblinsPreparedMechanics,
  selectWeedGoblinsChatChoice,
  submitWeedGoblinsSessionText,
} from './weedGoblinsChatController.js'
import {
  advanceWeedGoblinsRun,
  advanceWeedGoblinsSessionText,
  createWeedGoblinsRun,
} from './weedGoblinsChapterOneStaticRuntime.js'
import {
  clearWeedGoblinsActiveRun,
  readWeedGoblinsActiveRun,
  saveWeedGoblinsActiveRun,
  weedGoblinsActiveRunStorageKey,
} from './weedGoblinsPersistence.js'
import {
  buildWeedGoblinsPersonalizationSnapshot,
  saveWeedGoblinsRunSummary,
  weedGoblinsRunStorageKey,
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

function finishCharacter(seed = 'current-runtime') {
  let state = createWeedGoblinsRun({ seed })
  state = advanceWeedGoblinsSessionText(state, 'Rell Marrowlight')
  state = advanceWeedGoblinsRun(state, 'session:race:human')
  state = advanceWeedGoblinsRun(state, 'session:weapon:sword')
  state = advanceWeedGoblinsRun(state, 'background:tracker')
  state = advanceWeedGoblinsRun(state, 'session:pronoun:they')
  return advanceWeedGoblinsRun(state, 'session:look:tall-weathered')
}

function stateAtCloudberry(prefix = 'current-cloudberry') {
  for (let index = 0; index < 500; index += 1) {
    let state = finishCharacter(`${prefix}-${index}`)
    state = advanceWeedGoblinsRun(state, 'windcut:head-rattlebridge')
    state = advanceWeedGoblinsRun(state, 'route:quiet')
    if (state.status !== 'active') continue
    state = advanceWeedGoblinsRun(state, 'gear:tar')
    state = advanceWeedGoblinsRun(state, 'sneak:fee-paid')
    if (state.status === 'active' && state.sceneId === 'cloudberry-shelf') return state
  }
  throw new Error('Could not find an active current-runtime Cloudberry seed.')
}

function stateAtCamp(prefix = 'current-camp') {
  let state = stateAtCloudberry(prefix)
  state = advanceWeedGoblinsRun(state, 'cloudberry:help-nib')
  state = advanceWeedGoblinsRun(state, 'cloudberry:talk-nib')
  state = advanceWeedGoblinsRun(state, 'nib:promotion')
  state = advanceWeedGoblinsRun(state, 'nib:return')
  state = advanceWeedGoblinsRun(state, 'cloudberry:leave')
  return advanceWeedGoblinsRun(state, 'smell:syrup')
}

function stateAtBoss(prefix = 'current-boss') {
  let state = stateAtCloudberry(prefix)
  state = advanceWeedGoblinsRun(state, 'cloudberry:help-nib')
  state = advanceWeedGoblinsRun(state, 'cloudberry:talk-nib')
  state = advanceWeedGoblinsRun(state, 'nib:promotion')
  state = advanceWeedGoblinsRun(state, 'nib:return')
  state = advanceWeedGoblinsRun(state, 'cloudberry:look-around')
  state = advanceWeedGoblinsRun(state, 'cloudberry:press')
  state = advanceWeedGoblinsRun(state, 'press:inspect-mark')
  state = advanceWeedGoblinsRun(state, 'press:return')
  state = advanceWeedGoblinsRun(state, 'cloudberry:skybell')
  state = advanceWeedGoblinsRun(state, 'skybell:inspect-mark')
  state = advanceWeedGoblinsRun(state, 'skybell:return')
  state = advanceWeedGoblinsRun(state, 'cloudberry:return-main')
  state = advanceWeedGoblinsRun(state, 'cloudberry:leave')
  state = advanceWeedGoblinsRun(state, 'smell:syrup')
  state = advanceWeedGoblinsRun(state, 'camp:ask-tatter')
  state = advanceWeedGoblinsRun(state, 'camp:study-ledger')
  state = advanceWeedGoblinsRun(state, 'camp:ask-collector')
  state = advanceWeedGoblinsRun(state, 'camp:leave-ledger')
  state = advanceWeedGoblinsRun(state, 'camp:head-hall')
  state = advanceWeedGoblinsRun(state, 'latch:set-worried')
  return state
}

test('live controller starts directly at name entry and reaches five Windcut choices', async () => {
  let session = await createWeedGoblinsChatSession({ seed: 'current-session-zero' })
  assert.equal(session.state.sceneId, 'session-zero-name')
  assert.equal(session.choices.some((choice) => choice.id === 'session:continue'), false)

  let transition = submitWeedGoblinsSessionText(session.state, 'Rell')
  session.state = transition.after
  for (const actionId of [
    'session:race:human',
    'session:weapon:sword',
    'background:tracker',
    'session:pronoun:they',
    'session:look:tall-weathered',
  ]) {
    const choice = getWeedGoblinsQuickReplies(session.state).find((item) => item.id === actionId)
    assert.ok(choice, `${actionId} should be available`)
    session.state = selectWeedGoblinsChatChoice(session.state, choice).after
  }

  assert.equal(session.state.sceneId, 'windcut-trail')
  assert.equal(getWeedGoblinsQuickReplies(session.state).length, 5)
})

test('live controller stages an explicit D20 check before deterministic mechanics resolve', () => {
  let state = finishCharacter('current-roll-cycle')
  const headToBridge = getWeedGoblinsQuickReplies(state).find((choice) => choice.id === 'windcut:head-rattlebridge')
  state = selectWeedGoblinsChatChoice(state, headToBridge).after
  assert.equal(state.sceneId, 'rattlebridge-alarm')

  const quiet = getWeedGoblinsQuickReplies(state).find((choice) => choice.id === 'route:quiet')
  const prepared = prepareWeedGoblinsChoiceTurn({ state, action: quiet })
  assert.equal(prepared.requiresRoll, true)
  assert.equal(prepared.before, state)
  assert.equal(prepared.after, undefined)
  assert.match(prepared.setupMessage.text, /Defense is \+\d+/)
  assert.match(prepared.setupMessage.text, /You need \d+ or better/)
  assert.equal(prepared.rollTriggerMessage.text, 'Roll d20')

  const mechanics = resolveWeedGoblinsPreparedMechanics({ preparedTurn: prepared })
  assert.ok(mechanics.checkEvent)
  assert.equal(mechanics.checkEvent.actionId, 'route:quiet')
  assert.ok(mechanics.checkEvent.roll >= 1 && mechanics.checkEvent.roll <= 20)
  assert.notEqual(mechanics.after.rngState, state.rngState)
})

test('current free text maps Old Tatter wording to the canonical camp action', async () => {
  const state = stateAtCamp('current-free-text')
  assert.equal(state.sceneId, 'highland-camp')
  const prepared = await prepareWeedGoblinsFreeTextTurn({
    state,
    playerAction: 'Ask Old Tatter about the black-root seal.',
  })
  assert.equal(prepared.plan.kind, 'existing-action')
  assert.equal(prepared.plan.actionId, 'camp:ask-tatter')
})

test('current active run round-trips locally while private journal contamination is stripped', () => {
  const storage = createMemoryStorage()
  const userId = 'current-active-user'
  const state = finishCharacter('current-persist')
  const contaminated = {
    ...state,
    journalSnapshot: {
      notes: 'PRIVATE NOTE MUST NOT PERSIST',
      voice_transcript: 'PRIVATE TRANSCRIPT MUST NOT PERSIST',
      medical_history: 'PRIVATE HEALTH MUST NOT PERSIST',
    },
  }
  const choices = getWeedGoblinsQuickReplies(state)

  saveWeedGoblinsActiveRun({
    storage,
    userId,
    state: contaminated,
    messages: [{ direction: 'incoming', kind: 'message', text: 'Windcut waits.', source: 'test' }],
    choices,
    helpLevel: 1,
  })

  const raw = storage.getItem(weedGoblinsActiveRunStorageKey(userId))
  assert.ok(raw)
  for (const forbidden of ['PRIVATE NOTE MUST NOT PERSIST', 'PRIVATE TRANSCRIPT MUST NOT PERSIST', 'PRIVATE HEALTH MUST NOT PERSIST', 'journalSnapshot']) {
    assert.equal(raw.includes(forbidden), false)
  }

  const restored = readWeedGoblinsActiveRun({ storage, userId })
  assert.equal(restored.state.seed, state.seed)
  assert.equal(restored.state.rngState, state.rngState)
  assert.equal(restored.state.sceneId, state.sceneId)
  assert.equal(restored.choices.length, choices.length)

  clearWeedGoblinsActiveRun({ storage, userId })
  assert.equal(readWeedGoblinsActiveRun({ storage, userId }), null)
})

test('pending current D20 turn resumes before the roll and resolves identically', () => {
  const storage = createMemoryStorage()
  let state = finishCharacter('current-pending-roll')
  state = selectWeedGoblinsChatChoice(
    state,
    getWeedGoblinsQuickReplies(state).find((choice) => choice.id === 'windcut:head-rattlebridge'),
  ).after
  const action = getWeedGoblinsQuickReplies(state).find((choice) => choice.id === 'route:quiet')
  const prepared = prepareWeedGoblinsChoiceTurn({ state, action })

  saveWeedGoblinsActiveRun({
    storage,
    userId: 'pending-user',
    state,
    messages: [prepared.outgoingMessage, prepared.setupMessage, prepared.rollTriggerMessage],
    choices: [],
    pendingTurn: prepared,
  })

  const restored = readWeedGoblinsActiveRun({ storage, userId: 'pending-user' })
  assert.equal(restored.pendingTurn.requiresRoll, true)
  const original = resolveWeedGoblinsPreparedMechanics({ preparedTurn: prepared })
  const resumed = resolveWeedGoblinsPreparedMechanics({ preparedTurn: restored.pendingTurn })
  assert.deepEqual(resumed.checkEvent.rolls, original.checkEvent.rolls)
  assert.equal(resumed.checkEvent.roll, original.checkEvent.roll)
  assert.equal(resumed.after.rngState, original.after.rngState)
  assert.equal(resumed.after.sceneId, original.after.sceneId)
})

test('current personalization snapshot keeps structured flavor and excludes raw private fields', () => {
  const rawEntry = {
    user_id: 'privacy-user',
    product_name: 'Blue Dream',
    category: 'Flower',
    dispensary_name: 'North Ridge Collective',
    body_tags: ['Relaxed'],
    mind_tags: ['Creative'],
    mood_tags: ['Calm'],
    terpenes: { 'Beta Myrcene': '1.25' },
    notes: 'PRIVATE NOTE',
    voice_transcript: 'PRIVATE TRANSCRIPT',
    medical_history: 'PRIVATE HEALTH',
    amount: '3.5g',
    created_at: '2026-08-15T20:00:00-04:00',
    dispensary_address: '123 Private Street',
    price: '45.00',
    shared_contribution: { secret: 'LAYER2 SECRET' },
  }
  const snapshot = buildWeedGoblinsPersonalizationSnapshot({ entries: [rawEntry] })
  const serialized = JSON.stringify(snapshot)
  assert.deepEqual(snapshot.productNames, ['Blue Dream'])
  assert.equal(snapshot.fictionalLocationNames.length, 1)
  assert.equal(snapshot.fictionalLocationNames[0] === rawEntry.dispensary_name, false)
  for (const forbidden of ['North Ridge Collective', 'PRIVATE NOTE', 'PRIVATE TRANSCRIPT', 'PRIVATE HEALTH', '3.5g', '2026-08-15', '123 Private Street', '45.00', 'LAYER2 SECRET']) {
    assert.equal(serialized.includes(forbidden), false)
  }
})

test('current completed run history stores progression metadata and excludes injected private fields', async () => {
  const storage = createMemoryStorage()
  const store = createMockStore('history-user')
  const completed = advanceWeedGoblinsRun(stateAtBoss('current-history'), 'boss:evidence')
  assert.equal(completed.status, 'completed')

  const result = await saveWeedGoblinsRunSummary({
    runSummary: {
      ...completed.runSummary,
      notes: 'PRIVATE RUN NOTE',
      rawJournal: 'PRIVATE JOURNAL SNAPSHOT',
    },
    store,
    storage,
  })
  assert.equal(result.summary.seed, completed.seed)
  assert.equal(result.summary.gameId, 'weed-goblins')
  assert.equal(result.summary.chapterNumber, 1)
  assert.equal(result.summary.questNumber, 1)
  const raw = storage.getItem(weedGoblinsRunStorageKey('history-user'))
  assert.ok(raw)
  assert.equal(raw.includes('PRIVATE RUN NOTE'), false)
  assert.equal(raw.includes('PRIVATE JOURNAL SNAPSHOT'), false)
  assert.equal(raw.includes(completed.seed), true)
})

test('current replay paths can produce materially different completed summaries', () => {
  const bargain = advanceWeedGoblinsRun(stateAtBoss('current-replay-bargain'), 'boss:evidence')
  let court = stateAtBoss('current-replay-court')
  court = advanceWeedGoblinsRun(court, 'boss:challenge-court')
  court = advanceWeedGoblinsRun(court, 'court:break-line')

  assert.equal(bargain.status, 'completed')
  assert.equal(court.status, 'completed')
  assert.notEqual(bargain.runSummary.reason, court.runSummary.reason)
  assert.notDeepEqual(bargain.runSummary.chapterOneBranches, court.runSummary.chapterOneBranches)
})
