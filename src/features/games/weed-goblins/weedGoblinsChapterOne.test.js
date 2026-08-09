import test from 'node:test'
import assert from 'node:assert/strict'

import { advanceWeedGoblinsRun, advanceWeedGoblinsSessionText, createWeedGoblinsRun, getAvailableActions, getWeedGoblinsActionCheckPreview } from './weedGoblinsEngine.js'
import { getWeedGoblinsQuickReplies, prepareWeedGoblinsFreeTextTurn, resolveWeedGoblinsPreparedMechanics } from './weedGoblinsChatController.js'
import { CHAPTER_ONE_BRANCH_VALUES, CHAPTER_ONE_NPCS, CHAPTER_ONE_PUZZLES, CHAPTER_ONE_REWARDS } from './weedGoblinsChapterOne.js'
import { CHAPTER_ONE_ROOMS } from './weedGoblinsRooms.js'
import { getNarrationStoryContext } from './weedGoblinsNarrationHooks.js'

const fallbackNarration = async ({ hook }) => ({ text: hook.fallbackText, source: 'test-fallback' })

function stateAtRoute(seed) {
  let state = createWeedGoblinsRun({ seed })
  state = advanceWeedGoblinsRun(state, 'session:continue')
  state = advanceWeedGoblinsSessionText(state, 'Rell Marrowlight')
  state = advanceWeedGoblinsRun(state, 'session:race:human')
  state = advanceWeedGoblinsRun(state, 'session:weapon:sword')
  state = advanceWeedGoblinsRun(state, 'background:tracker')
  state = advanceWeedGoblinsRun(state, 'session:pronoun:they')
  return advanceWeedGoblinsRun(state, 'session:look:tall-weathered')
}

function stateAtMidpoint(prefix = 'chapter-one-midpoint') {
  for (let index = 0; index < 300; index += 1) {
    let state = stateAtRoute(`${prefix}-${index}`)
    state = advanceWeedGoblinsRun(state, 'route:quiet')
    if (state.status !== 'active') continue
    state = advanceWeedGoblinsRun(state, 'goblin:guard')
    if (state.status === 'active' && state.sceneId === 'midpoint' && state.trouble <= 1) return state
  }
  throw new Error('Could not find a deterministic active midpoint seed.')
}

function stateAtLatch(prefix = 'chapter-one-latch') {
  const midpoint = stateAtMidpoint(prefix)
  const camp = advanceWeedGoblinsRun(midpoint, 'midpoint:help')
  return advanceWeedGoblinsRun(camp, 'camp:ask-old-tatter')
}

function stateAtBoss(prefix = 'chapter-one-boss') {
  for (let index = 0; index < 300; index += 1) {
    const latch = stateAtLatch(`${prefix}-${index}`)
    const boss = advanceWeedGoblinsRun(latch, 'latch:read-face')
    if (boss.status === 'active' && boss.sceneId === 'goblin-king') return boss
  }
  throw new Error('Could not find a deterministic active Goblin King seed.')
}

test('canonical Chapter 1 content registry locks NPCs, puzzles, rewards, and branch values', () => {
  assert.deepEqual(Object.values(CHAPTER_ONE_NPCS).map((npc) => npc.name), ['Goblin King', 'Nib', 'Grubbin', 'Old Tatter'])
  assert.deepEqual(Object.values(CHAPTER_ONE_PUZZLES).map((puzzle) => puzzle.name), ['Rattlebridge alarm lines', 'picture tribute ledger', 'carved-face stash latch'])
  assert.deepEqual(Object.values(CHAPTER_ONE_REWARDS), ['black-root seal', 'goblin favor', 'highland charm'])
  assert.deepEqual(CHAPTER_ONE_BRANCH_VALUES.nibTreatment, ['safe', 'bait', 'ignored'])
  assert.deepEqual(CHAPTER_ONE_BRANCH_VALUES.tributeArrangement, ['exposed', 'protected', 'unknown'])
  assert.deepEqual(CHAPTER_ONE_BRANCH_VALUES.kingTreatment, ['spared', 'humiliated', 'unresolved'])
  assert.deepEqual(CHAPTER_ONE_BRANCH_VALUES.stolenItemCondition, ['intact', 'altered', 'not-recovered'])
})

test('Cloudberry gives the explicit keep-Nib-safe versus use-Nib-as-bait branch', () => {
  const midpoint = stateAtMidpoint('nib-branch')
  const safe = advanceWeedGoblinsRun(midpoint, 'midpoint:help')
  const bait = advanceWeedGoblinsRun(midpoint, 'midpoint:bait-nib')
  assert.equal(safe.sceneId, 'highland-camp')
  assert.equal(safe.flags.nibTreatment, 'safe')
  assert.equal(safe.flags.goblinAlly, true)
  assert.equal(safe.flags.goblinFavor, true)
  assert.equal(bait.flags.nibTreatment, 'bait')
  assert.equal(bait.flags.goblinAlly, false)
})

test('Highland Camp contains the tribute branch and Old Tatter identifies the black-root seal', () => {
  const camp = advanceWeedGoblinsRun(stateAtMidpoint('camp-branch'), 'midpoint:skip')
  assert.equal(camp.currentRoomId, CHAPTER_ONE_ROOMS.highlandCamp.id)
  const actions = getAvailableActions(camp)
  for (const id of ['camp:expose-tribute', 'camp:protect-tribute', 'camp:question-grubbin', 'camp:ask-old-tatter']) assert.ok(actions.some((action) => action.id === id), id)
  const tatter = advanceWeedGoblinsRun(camp, 'camp:ask-old-tatter')
  assert.equal(tatter.flags.blackRootSealKnown, true)
  assert.match(tatter.narration.at(-1), /black-root seal/i)
  assert.equal(tatter.sceneId, 'stash-latch')
})

test('picture ledger expose/protect choices preserve the player branch regardless of roll outcome', () => {
  const campA = advanceWeedGoblinsRun(stateAtMidpoint('ledger-expose'), 'midpoint:skip')
  const exposed = advanceWeedGoblinsRun(campA, 'camp:expose-tribute')
  assert.equal(exposed.flags.tributeArrangement, 'exposed')
  if (exposed.status === 'active') assert.equal(exposed.sceneId, 'stash-latch')

  const campB = advanceWeedGoblinsRun(stateAtMidpoint('ledger-protect'), 'midpoint:skip')
  const protectedState = advanceWeedGoblinsRun(campB, 'camp:protect-tribute')
  assert.equal(protectedState.flags.tributeArrangement, 'protected')
  if (protectedState.status === 'active') assert.equal(protectedState.sceneId, 'stash-latch')
})

test('the highland charm is a real reward that can open the carved-face latch without a roll', () => {
  let charmState = null
  for (let index = 0; index < 300; index += 1) {
    const midpoint = stateAtMidpoint(`charm-${index}`)
    const result = advanceWeedGoblinsRun(midpoint, 'midpoint:take-charm')
    if (result.status === 'active' && result.flags.hasHighlandCharm) {
      charmState = result
      break
    }
  }
  assert.ok(charmState)
  const latch = advanceWeedGoblinsRun(charmState, 'camp:ask-old-tatter')
  const preview = getWeedGoblinsActionCheckPreview(latch, 'latch:use-charm')
  assert.equal(preview.requiresRoll, false)
  const boss = advanceWeedGoblinsRun(latch, 'latch:use-charm')
  assert.equal(boss.sceneId, 'goblin-king')
})

test('new gameplay scenes keep custom text and 4 to 5 visible replies', async () => {
  const camp = advanceWeedGoblinsRun(stateAtMidpoint('custom-camp'), 'midpoint:skip')
  const campChoices = getWeedGoblinsQuickReplies(camp)
  assert.ok(campChoices.length >= 4 && campChoices.length <= 5)
  const campPlan = await prepareWeedGoblinsFreeTextTurn({ state: camp, playerAction: 'I ask Old Tatter what the seal means', generateNarration: fallbackNarration })
  assert.equal(campPlan.plan.actionId, 'camp:ask-old-tatter')
  assert.equal(campPlan.requiresRoll, false)

  const latch = advanceWeedGoblinsRun(camp, 'camp:ask-old-tatter')
  const latchChoices = getWeedGoblinsQuickReplies(latch)
  assert.ok(latchChoices.length >= 4 && latchChoices.length <= 5)
  const latchPlan = await prepareWeedGoblinsFreeTextTurn({ state: latch, playerAction: 'I force the carved-face latch open', generateNarration: fallbackNarration })
  assert.equal(latchPlan.plan.actionId, 'latch:force')
  assert.equal(latchPlan.requiresRoll, true)
  const mechanics = resolveWeedGoblinsPreparedMechanics({ preparedTurn: latchPlan })
  assert.ok(mechanics.checkEvent)
  assert.equal(mechanics.checkEvent.dc, 12)
})

test('Goblin King choices make spare versus humiliate explicit without changing the boss DC system', () => {
  const boss = stateAtBoss('king-branch')
  const actions = getAvailableActions(boss)
  assert.match(actions.find((action) => action.id === 'boss:overpower').label, /Humiliate/)
  assert.match(actions.find((action) => action.id === 'boss:outlast').label, /Spare/)
  assert.equal(getWeedGoblinsActionCheckPreview(boss, 'boss:overpower').dc, Math.max(9, 16 + boss.flags.bossDcModifier))
})

test('completed Chapter 1 summary carries rewards and branch state while exact ending text stays locked', () => {
  let completed = null
  for (let index = 0; index < 500; index += 1) {
    const boss = stateAtBoss(`summary-${index}`)
    const result = advanceWeedGoblinsRun(boss, 'boss:outlast')
    if (result.status === 'completed' && result.ending === 'recovery') {
      completed = result
      break
    }
  }
  assert.ok(completed)
  assert.equal(completed.runSummary.chapterOneBranches.nibTreatment, 'safe')
  assert.equal(completed.runSummary.chapterOneBranches.kingTreatment, 'spared')
  assert.ok(['intact', 'altered'].includes(completed.runSummary.chapterOneBranches.stolenItemCondition))
  assert.ok(completed.runSummary.chapterOneRewards.includes(CHAPTER_ONE_REWARDS.blackRootSeal))
  assert.ok(completed.runSummary.chapterOneRewards.includes(CHAPTER_ONE_REWARDS.goblinFavor))
  assert.equal(completed.narration.at(-1), `You recover ${completed.stolenItem} from the King's Stash Hall. The Goblin King insists he is a king. His fear, and the black-root seal stamped on every crate around you, say otherwise.`)
})

test('narration context knows Highland Camp and the carved-face latch', () => {
  const camp = advanceWeedGoblinsRun(stateAtMidpoint('narration-context'), 'midpoint:skip')
  const campContext = getNarrationStoryContext(camp)
  assert.match(campContext.choiceContext, /Grubbin/)
  assert.match(campContext.choiceContext, /Old Tatter/)
  assert.match(campContext.choiceContext, /picture tribute ledger/)
  const latch = advanceWeedGoblinsRun(camp, 'camp:ask-old-tatter')
  const latchContext = getNarrationStoryContext(latch)
  assert.match(latchContext.choiceContext, /carved-face latch/)
  assert.ok(latchContext.continuityAnchors.includes('black-root seal'))
})
