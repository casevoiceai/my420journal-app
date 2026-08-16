import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createWeedGoblinsChatSession,
  getWeedGoblinsQuickReplies,
  prepareWeedGoblinsQuickReplyTurn,
  selectWeedGoblinsChatChoice,
  submitWeedGoblinsSessionText,
} from './weedGoblinsChatController.js'
import {
  clearWeedGoblinsActiveRun,
  readWeedGoblinsActiveRun,
  saveWeedGoblinsActiveRun,
  weedGoblinsActiveRunStorageKey,
} from './weedGoblinsPersistence.js'
import {
  readWeedGoblinsCampaignState,
  readWeedGoblinsLocalContext,
  saveWeedGoblinsRunSummary,
  weedGoblinsCampaignStorageKey,
  weedGoblinsRunStorageKey,
} from './weedGoblinsLocalDataAdapter.js'

function memoryStorage(initial = {}) {
  const values = { ...initial }
  return {
    getItem(key) { return Object.hasOwn(values, key) ? values[key] : null },
    setItem(key, value) { values[key] = String(value) },
    removeItem(key) { delete values[key] },
    dump() { return { ...values } },
  }
}

function mockStore(userId = 'chapter-two-user', entries = []) {
  return {
    auth: {
      async getUser() { return { data: { user: { id: userId } }, error: null } },
    },
    from() {
      return {
        select() {
          return {
            eq() { return Promise.resolve({ data: entries, error: null }) },
          }
        },
      }
    },
  }
}

function chapterOneRuns(count) {
  return Array.from({ length: count }, (_, index) => ({
    adventureId: 'goblin-highlands-session-1',
    seed: `chapter-one-${index}`,
    ending: 'recovery',
  }))
}

async function chapterTwoSessionZeroState() {
  const session = await createWeedGoblinsChatSession({
    seed: 'persist-chapter-two',
    previousRuns: chapterOneRuns(5),
    priorCompletedRunCount: 5,
    journalSnapshot: {
      productCategories: ['Vape'],
      notes: 'PRIVATE NOTE MUST NEVER PERSIST',
      voice_transcript: 'PRIVATE TRANSCRIPT MUST NEVER PERSIST',
    },
  })
  return session
}

function choose(state, id) {
  return selectWeedGoblinsChatChoice(state, { id }).after
}

async function playableState() {
  let { state } = await chapterTwoSessionZeroState()
  state = submitWeedGoblinsSessionText(state, 'Fenna Duskrow').after
  state = choose(state, 'session:race:human')
  state = choose(state, 'session:weapon:sword')
  state = choose(state, 'background:tracker')
  state = choose(state, 'session:pronoun:they')
  state = choose(state, 'session:look:tall-weathered')
  state = choose(state, 'lantern:moth-root-coin')
  return choose(state, 'entry:coin')
}

test('Chapter 2 target Session Zero round-trips without collapsing back into Chapter 1', async () => {
  const storage = memoryStorage()
  const session = await chapterTwoSessionZeroState()
  saveWeedGoblinsActiveRun({
    storage,
    userId: 'user-a',
    state: session.state,
    messages: session.messages,
    choices: session.choices,
  })
  const raw = storage.getItem(weedGoblinsActiveRunStorageKey('user-a'))
  assert.ok(raw)
  assert.equal(raw.includes('PRIVATE NOTE MUST NEVER PERSIST'), false)
  assert.equal(raw.includes('PRIVATE TRANSCRIPT MUST NEVER PERSIST'), false)

  const restored = readWeedGoblinsActiveRun({ storage, userId: 'user-a' })
  assert.equal(restored.state.targetChapterNumber, 2)
  assert.equal(restored.state.chapterTwoPersonalization.recognizedStall, 'mist-cartridge counter')
  assert.equal(restored.state.adventureId, 'goblin-highlands-session-1')
})

test('pending Chapter 2 D20 turn round-trips exact deterministic mechanics and Help state', async () => {
  const storage = memoryStorage()
  let state = await playableState()
  state = { ...state, rngState: 15360 }
  const action = getWeedGoblinsQuickReplies(state).find((candidate) => candidate.id === 'trace:sixfinger')
  const pendingTurn = await prepareWeedGoblinsQuickReplyTurn({ state, action })
  assert.equal(pendingTurn.requiresRoll, true)

  saveWeedGoblinsActiveRun({
    storage,
    userId: 'user-b',
    state,
    messages: [pendingTurn.outgoingMessage, pendingTurn.setupMessage, pendingTurn.rollTriggerMessage],
    choices: [],
    pendingTurn,
    helpLevel: 2,
    helpMessage: { level: 2, text: 'Trace both sides of the tithe chain.', solvesObstacle: false },
  })

  const restored = readWeedGoblinsActiveRun({ storage, userId: 'user-b' })
  assert.equal(restored.state.chapterNumber, 2)
  assert.equal(restored.state.rngState, state.rngState)
  assert.equal(restored.pendingTurn.before.rngState, state.rngState)
  assert.equal(restored.pendingTurn.plan.actionId, 'trace:sixfinger')
  assert.equal(restored.helpLevel, 2)
  assert.match(restored.helpMessage.text, /tithe chain/)
})

test('completed Chapter 2 campaign state persists branches, rewards, Rootcoin and wound without duplicate inflation', async () => {
  const storage = memoryStorage()
  const store = mockStore('user-c')
  const runSummary = {
    adventureId: 'hollow-market-session-1',
    seed: 'hollow-complete-1',
    backgroundId: 'tracker',
    ending: 'market-revolt',
    outcomeSummary: 'market-revolt; Harvest Ledger points to the Withered Grove',
    trouble: 1,
    manaRemaining: 1,
    complicationCount: 0,
    narrationTier: 'normal',
    rootcoinRemaining: 0,
    wound: 'Scraped',
    chapterTwoBranches: {
      entryPrice: 'coin',
      marketState: 'exposed',
      ledgerDisposition: 'exposed',
      collectorOutcome: 'evade',
      wardenSettlement: 'drain-exit',
      recognizedStall: 'mist-cartridge counter',
    },
    chapterTwoRewards: ['Harvest Ledger', 'Market Veil'],
  }

  const first = await saveWeedGoblinsRunSummary({ runSummary, store, storage })
  assert.equal(first.summary.chapterNumber, 2)
  assert.equal(first.campaignState.completedRunCount, 1)
  assert.equal(first.campaignState.chapterTwo.completedRunCount, 1)
  assert.equal(first.campaignState.chapterTwo.marketState, 'exposed')
  assert.deepEqual(first.campaignState.chapterTwo.rewards, ['Harvest Ledger', 'Market Veil'])
  assert.equal(first.campaignState.chapterTwo.rootcoin, 0)
  assert.equal(first.campaignState.chapterTwo.wound, 'Scraped')

  const second = await saveWeedGoblinsRunSummary({ runSummary, store, storage })
  assert.equal(second.history.length, 1)
  assert.equal(second.campaignState.completedRunCount, 1)
  assert.equal(second.campaignState.chapterTwo.completedRunCount, 1)

  const storedRuns = JSON.parse(storage.getItem(weedGoblinsRunStorageKey('user-c')))
  assert.equal(storedRuns[0].chapterTwoBranches.marketState, 'exposed')
  assert.deepEqual(storedRuns[0].chapterTwoRewards, ['Harvest Ledger', 'Market Veil'])
})

test('later Chapter 1 saves preserve the existing Chapter 2 campaign block', async () => {
  const storage = memoryStorage()
  const store = mockStore('user-d')
  await saveWeedGoblinsRunSummary({
    store,
    storage,
    runSummary: {
      adventureId: 'hollow-market-session-1',
      seed: 'hollow-first',
      ending: 'trade-route',
      outcomeSummary: 'trade-route; Harvest Ledger points to the Withered Grove',
      rootcoinRemaining: 2,
      wound: 'None',
      chapterTwoBranches: { marketState: 'secretly-controlled-by-player', entryPrice: 'favor' },
      chapterTwoRewards: ['Harvest Ledger', "Sixfinger's Marker"],
    },
  })
  await saveWeedGoblinsRunSummary({
    store,
    storage,
    runSummary: {
      adventureId: 'goblin-highlands-session-1',
      seed: 'chapter-one-later',
      backgroundId: 'tracker',
      ending: 'recovery',
      outcomeSummary: 'recovered the Amber Field Satchel',
    },
  })

  const campaign = await readWeedGoblinsCampaignState({ store, storage })
  assert.equal(campaign.completedRunCount, 2)
  assert.equal(campaign.chapterOne.completedRunCount, 1)
  assert.equal(campaign.chapterTwo.completedRunCount, 1)
  assert.equal(campaign.chapterTwo.marketState, 'secretly-controlled-by-player')
  assert.ok(campaign.chapterTwo.rewards.includes("Sixfinger's Marker"))
  assert.ok(storage.getItem(weedGoblinsCampaignStorageKey('user-d')))
})

test('local context exposes only safe enhanced Chapter 2 history to the next run', async () => {
  const storage = memoryStorage()
  const entries = [{
    user_id: 'user-e',
    entry_type: 'cannabis',
    product_name: 'PRIVATE REAL PRODUCT',
    category: 'Vape',
    notes: 'PRIVATE NOTE',
    voice_transcript: 'PRIVATE TRANSCRIPT',
  }]
  const store = mockStore('user-e', entries)
  await saveWeedGoblinsRunSummary({
    store,
    storage,
    runSummary: {
      adventureId: 'hollow-market-session-1',
      seed: 'hollow-context',
      ending: 'market-operational',
      outcomeSummary: 'Harvest Ledger points to the Withered Grove',
      rootcoinRemaining: 3,
      wound: 'Bruised',
      chapterTwoBranches: { marketState: 'operational', entryPrice: 'memory' },
      chapterTwoRewards: ['Harvest Ledger'],
    },
  })
  const context = await readWeedGoblinsLocalContext({ store, storage })
  const run = context.snapshot.previousRuns.find((candidate) => candidate.adventureId === 'hollow-market-session-1')
  assert.equal(run.rootcoinRemaining, 3)
  assert.equal(run.wound, 'Bruised')
  assert.deepEqual(run.chapterTwoRewards, ['Harvest Ledger'])
  assert.equal(JSON.stringify(run).includes('PRIVATE NOTE'), false)
  assert.equal(JSON.stringify(run).includes('PRIVATE TRANSCRIPT'), false)

  clearWeedGoblinsActiveRun({ storage, userId: 'user-e' })
})
