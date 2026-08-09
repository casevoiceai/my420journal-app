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
import { CHAPTER_ONE_ROOM_LIST } from './weedGoblinsRooms.js'

function finishSessionZero(seed, backgroundId) {
  let state = createWeedGoblinsRun({ seed })
  state = advanceWeedGoblinsRun(state, 'session:continue')
  state = advanceWeedGoblinsSessionText(state, 'Sable Underhollow')
  state = advanceWeedGoblinsRun(state, 'session:race:human')
  state = advanceWeedGoblinsRun(state, 'session:weapon:sword')
  state = advanceWeedGoblinsRun(state, `background:${backgroundId}`)
  state = advanceWeedGoblinsRun(state, 'session:pronoun:they')
  return advanceWeedGoblinsRun(state, 'session:look:tall-weathered')
}

function playVisibleChoice(state, actionId, options = {}) {
  const action = getAvailableActions(state).find((candidate) => candidate.id === actionId)
  if (!action) return null
  const prepared = prepareWeedGoblinsChoiceTurn({ state, action })
  if (!prepared.requiresRoll) return prepared.after
  const preparedWithOptions = options && Object.keys(options).length > 0
    ? {
        ...prepared,
        plan: {
          ...prepared.plan,
          engineOptions: options,
        },
      }
    : prepared
  return resolveWeedGoblinsPreparedMechanics({ preparedTurn: preparedWithOptions }).after
}

function runPlan(seed, plan) {
  let state = finishSessionZero(seed, plan.background)
  for (const step of plan.steps) {
    if (state.status === 'completed') break
    const actionId = typeof step === 'string' ? step : step.id
    const options = typeof step === 'string' ? {} : step.options || {}
    state = playVisibleChoice(state, actionId, options)
    if (!state) return null
  }
  return state
}

function findCompletedRun(name, plan, predicate, limit = 5000) {
  for (let index = 0; index < limit; index += 1) {
    const state = runPlan(`${name}-${index}`, plan)
    if (state?.status === 'completed' && predicate(state)) return state
  }
  throw new Error(`Could not complete replay profile: ${name}`)
}

function visitedAllChapterOneRooms(state) {
  return CHAPTER_ONE_ROOM_LIST.every((room) => state.roomState?.[room.id]?.visited === true)
}

function branchSignature(state) {
  const branches = state.runSummary.chapterOneBranches
  return [
    state.runSummary.backgroundId,
    state.runSummary.routeId,
    state.runSummary.midpointChoice,
    branches.nibTreatment,
    branches.tributeArrangement,
    branches.kingTreatment,
    branches.stolenItemCondition,
    state.runSummary.ending,
    [...state.runSummary.chapterOneRewards].sort().join('+'),
  ].join('|')
}

const REPLAY_PROFILES = Object.freeze([
  {
    name: 'ally-bargain',
    plan: {
      background: 'tracker',
      steps: [
        'route:quiet',
        'goblin:guard',
        'midpoint:help',
        'camp:ask-old-tatter',
        'latch:read-face',
        'boss:bargain',
      ],
    },
    predicate: (state) => state.ending === 'bargain'
      && state.runSummary.chapterOneBranches.nibTreatment === 'safe'
      && state.runSummary.chapterOneBranches.tributeArrangement === 'unknown'
      && state.runSummary.chapterOneBranches.kingTreatment === 'spared'
      && state.runSummary.chapterOneRewards.includes('goblin favor'),
  },
  {
    name: 'bait-humiliate',
    plan: {
      background: 'tracker',
      steps: [
        'route:loud',
        'goblin:strike',
        'midpoint:bait-nib',
        'camp:question-grubbin',
        'latch:force',
        'boss:overpower',
      ],
    },
    predicate: (state) => state.ending === 'recovery'
      && state.runSummary.chapterOneBranches.nibTreatment === 'bait'
      && state.runSummary.chapterOneBranches.tributeArrangement === 'exposed'
      && state.runSummary.chapterOneBranches.kingTreatment === 'humiliated',
  },
  {
    name: 'charm-protect-spare',
    plan: {
      background: 'warden',
      steps: [
        'route:quiet',
        'goblin:guard',
        'midpoint:take-charm',
        'camp:protect-tribute',
        'latch:use-charm',
        'boss:outlast',
      ],
    },
    predicate: (state) => state.ending === 'recovery'
      && state.runSummary.chapterOneBranches.tributeArrangement === 'protected'
      && state.runSummary.chapterOneBranches.kingTreatment === 'spared'
      && state.runSummary.chapterOneRewards.includes('highland charm'),
  },
  {
    name: 'diviner-runes-spell',
    plan: {
      background: 'diviner',
      steps: [
        'route:quiet',
        'goblin:guard',
        'midpoint:read-runes',
        'camp:ask-old-tatter',
        'latch:read-face',
        'boss:spell',
      ],
    },
    predicate: (state) => state.ending === 'recovery'
      && state.runSummary.backgroundId === 'diviner'
      && state.runSummary.midpointChoice === 'read-runes'
      && state.runSummary.chapterOneBranches.kingTreatment === 'spared',
  },
  {
    name: 'boss-escape',
    plan: {
      background: 'warden',
      steps: [
        'route:quiet',
        'goblin:guard',
        'midpoint:skip',
        'camp:move-on',
        'latch:read-face',
        'boss:overpower',
      ],
    },
    predicate: (state) => state.ending === 'escape'
      && state.runSummary.chapterOneBranches.nibTreatment === 'ignored'
      && state.runSummary.chapterOneBranches.tributeArrangement === 'unknown'
      && state.runSummary.chapterOneBranches.stolenItemCondition === 'not-recovered',
  },
])

test('five materially different Chapter 1 replays complete through the real explicit-choice/D20 path', () => {
  const completed = REPLAY_PROFILES.map((profile) => ({
    profile,
    state: findCompletedRun(profile.name, profile.plan, profile.predicate),
  }))

  assert.equal(completed.length, 5)
  assert.equal(new Set(completed.map(({ state }) => branchSignature(state))).size, 5)
  assert.ok(completed.some(({ state }) => state.ending === 'bargain'))
  assert.ok(completed.some(({ state }) => state.ending === 'escape'))
  assert.ok(completed.some(({ state }) => state.ending === 'recovery'))

  for (const { profile, state } of completed) {
    assert.equal(profile.predicate(state), true, profile.name)
    assert.equal(state.sceneId, 'ending')
    assert.ok(visitedAllChapterOneRooms(state), `${profile.name} did not visit all five rooms`)
    assert.equal(state.runSummary.chapterNumber, 1)
    assert.ok(state.runSummary.chapterOneRewards.includes('black-root seal'))
    assert.ok(state.narration.at(-1).includes(state.stolenItem))
  }
})

test('the five replay profiles exercise materially different Chapter 1 decisions', () => {
  const actionSets = REPLAY_PROFILES.map(({ plan }) => new Set(plan.steps.map((step) => (
    typeof step === 'string' ? step : step.id
  ))))

  assert.ok(actionSets.some((actions) => actions.has('midpoint:help')))
  assert.ok(actionSets.some((actions) => actions.has('midpoint:bait-nib')))
  assert.ok(actionSets.some((actions) => actions.has('midpoint:take-charm')))
  assert.ok(actionSets.some((actions) => actions.has('midpoint:read-runes')))
  assert.ok(actionSets.some((actions) => actions.has('camp:protect-tribute')))
  assert.ok(actionSets.some((actions) => actions.has('camp:question-grubbin')))
  assert.ok(actionSets.some((actions) => actions.has('camp:ask-old-tatter')))
  assert.ok(actionSets.some((actions) => actions.has('latch:use-charm')))
  assert.ok(actionSets.some((actions) => actions.has('latch:force')))
  assert.ok(actionSets.some((actions) => actions.has('boss:bargain')))
  assert.ok(actionSets.some((actions) => actions.has('boss:overpower')))
  assert.ok(actionSets.some((actions) => actions.has('boss:outlast')))
  assert.ok(actionSets.some((actions) => actions.has('boss:spell')))
})
