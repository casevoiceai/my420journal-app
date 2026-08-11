import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CHAPTER_ONE_ENDINGS,
  CHAPTER_ONE_NPCS,
  CHAPTER_ONE_NPC_TOPICS,
  CHAPTER_ONE_OPTIONAL_SCENES,
  CHAPTER_ONE_REWARD_DETAILS,
  CHAPTER_ONE_SCENE_TEXT,
  CHAPTER_ONE_SECRETS,
  CHAPTER_ONE_STOLEN_ITEM_STATUSES,
  SESSION_ZERO_QUESTIONS,
  SESSION_ZERO_WELCOME,
} from './weedGoblinsChapterOne.js'
import {
  advanceWeedGoblinsRun,
  advanceWeedGoblinsSessionText,
  createWeedGoblinsRun,
  getAvailableActions,
  getWeedGoblinsActionCheckPreview,
} from './weedGoblinsChapterOneStaticRuntime.js'
import { DIFFICULTY, SESSION_ZERO_WELCOME as ENGINE_SESSION_ZERO_WELCOME } from './weedGoblinsEngine.js'
import { createChapterTwoRunFromSessionZero } from './weedGoblinsChapterTwoRuntime.js'

function finishCharacter(seed) {
  let s = createWeedGoblinsRun({ seed })
  s = advanceWeedGoblinsSessionText(s, 'Rell Marrowlight')
  s = advanceWeedGoblinsRun(s, 'session:race:human')
  s = advanceWeedGoblinsRun(s, 'session:weapon:sword')
  s = advanceWeedGoblinsRun(s, 'background:tracker')
  s = advanceWeedGoblinsRun(s, 'session:pronoun:they')
  return advanceWeedGoblinsRun(s, 'session:look:tall-weathered')
}
function stateAtCloudberry(prefix) {
  for (let i = 0; i < 500; i += 1) {
    let s = finishCharacter(`${prefix}-${i}`)
    s = advanceWeedGoblinsRun(s, 'windcut:head-rattlebridge')
    s = advanceWeedGoblinsRun(s, 'route:quiet')
    if (s.status !== 'active') continue
    s = advanceWeedGoblinsRun(s, 'gear:tar')
    s = advanceWeedGoblinsRun(s, 'sneak:fee-paid')
    if (s.status === 'active' && s.sceneId === 'cloudberry-shelf') return s
  }
  throw new Error('Could not find active Cloudberry seed')
}
function stateAtBoss(prefix = 'boss') {
  let s = stateAtCloudberry(prefix)
  s = advanceWeedGoblinsRun(s, 'cloudberry:help-nib')
  s = advanceWeedGoblinsRun(s, 'cloudberry:talk-nib')
  s = advanceWeedGoblinsRun(s, 'nib:promotion')
  s = advanceWeedGoblinsRun(s, 'nib:return')
  s = advanceWeedGoblinsRun(s, 'cloudberry:look-around')
  s = advanceWeedGoblinsRun(s, 'cloudberry:press')
  s = advanceWeedGoblinsRun(s, 'press:inspect-mark')
  s = advanceWeedGoblinsRun(s, 'press:return')
  s = advanceWeedGoblinsRun(s, 'cloudberry:skybell')
  s = advanceWeedGoblinsRun(s, 'skybell:inspect-mark')
  s = advanceWeedGoblinsRun(s, 'skybell:return')
  s = advanceWeedGoblinsRun(s, 'cloudberry:return-main')
  s = advanceWeedGoblinsRun(s, 'cloudberry:leave')
  s = advanceWeedGoblinsRun(s, 'smell:syrup')
  s = advanceWeedGoblinsRun(s, 'camp:ask-tatter')
  s = advanceWeedGoblinsRun(s, 'camp:study-ledger')
  s = advanceWeedGoblinsRun(s, 'camp:ask-collector')
  s = advanceWeedGoblinsRun(s, 'camp:leave-ledger')
  s = advanceWeedGoblinsRun(s, 'camp:head-hall')
  s = advanceWeedGoblinsRun(s, 'latch:set-worried')
  return s
}

test('complete static Chapter 1 registry is present', () => {
  assert.equal(CHAPTER_ONE_SECRETS.length, 10)
  assert.equal(Object.keys(CHAPTER_ONE_OPTIONAL_SCENES).length, 2)
  assert.equal(Object.keys(CHAPTER_ONE_NPCS).length, 4)
  for (const topics of Object.values(CHAPTER_ONE_NPC_TOPICS)) assert.ok(topics.length >= 3 && topics.length <= 5)
  assert.equal(Object.keys(CHAPTER_ONE_ENDINGS).length, 4)
  assert.equal(CHAPTER_ONE_SCENE_TEXT.windcutTrail.length, 3)
  assert.equal(SESSION_ZERO_WELCOME.at(-1), SESSION_ZERO_QUESTIONS.nameAndRace)
  assert.deepEqual(ENGINE_SESSION_ZERO_WELCOME, SESSION_ZERO_WELCOME)
  assert.equal(CHAPTER_ONE_REWARD_DETAILS.highlandCharm.relationship, 'additive')
  assert.match(CHAPTER_ONE_REWARD_DETAILS.highlandCharm.canonFunction, /alarm or ambush/i)
  assert.match(CHAPTER_ONE_REWARD_DETAILS.highlandCharm.chapterOneFunction, /latch/i)
})
test('Chapter 1 controller has no narration Worker call', () => {
  const source = readFileSync(new URL('./weedGoblinsChatControllerChapterOne.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /generateNarrationFromHook|weedGoblinsAiComplication|generateNarration\s*\(/)
})
test('Session Zero reaches static Windcut Trail with no onboarding bridge', () => {
  let s = createWeedGoblinsRun({ seed: 'session-static' })
  assert.equal(s.sceneId, 'session-zero-name')
  assert.doesNotMatch(s.narration.join(' '), /I'm Eliza|before we start|here's how|you don't need to know/i)
  s = advanceWeedGoblinsSessionText(s, 'Rell')
  s = advanceWeedGoblinsRun(s, 'session:race:human')
  s = advanceWeedGoblinsRun(s, 'session:weapon:sword')
  s = advanceWeedGoblinsRun(s, 'background:tracker')
  s = advanceWeedGoblinsRun(s, 'session:pronoun:they')
  s = advanceWeedGoblinsRun(s, 'session:look:tall-weathered')
  assert.equal(s.sceneId, 'windcut-trail')
  assert.equal(s.stolenItem, 'the Brass-Latched Research Case')
  assert.equal(getAvailableActions(s).length, 5)
})
test('both optional Cloudberry scenes are playable in one run and callbacks persist', () => {
  const boss = stateAtBoss('optional')
  assert.equal(boss.chapterOne.optionalVisited.press, true)
  assert.equal(boss.chapterOne.optionalVisited.skyBell, true)
  assert.ok(boss.chapterOne.discoveredSecrets.includes(2))
  assert.ok(boss.chapterOne.discoveredSecrets.includes(5))
  assert.equal(boss.chapterOne.gearMark, 'Your cloak hem, black with bridge tar,')
  assert.equal(boss.chapterOne.campSmell, 'Burnt cloudberry syrup')
  assert.equal(boss.sceneId, 'goblin-king')
})
test('only whole-court challenge uses Wither in Chapter 1', () => {
  let boss = stateAtBoss('wither')
  assert.equal(getWeedGoblinsActionCheckPreview(boss, 'boss:outlast').dangerTier, 'harvest')
  boss = advanceWeedGoblinsRun(boss, 'boss:challenge-court')
  for (const id of ['court:break-line', 'court:hold-room']) {
    const preview = getWeedGoblinsActionCheckPreview(boss, id)
    assert.equal(preview.dangerTier, 'wither')
    assert.equal(preview.dc, DIFFICULTY.goblinKing)
  }
})
test('explicit Chapter 1 stolen-item status crosses into Chapter 2', () => {
  const bargain = advanceWeedGoblinsRun(stateAtBoss('bargain'), 'boss:evidence')
  assert.equal(bargain.runSummary.stolenItemStatus, CHAPTER_ONE_STOLEN_ITEM_STATUSES.bargainedBack)
  const chapterTwo = createChapterTwoRunFromSessionZero(finishCharacter('chapter-two'), { previousRuns: [{ adventureId: 'goblin-highlands-session-1', stolenItemStatus: 'recovered-altered' }] })
  assert.equal(chapterTwo.chapterTwo.chapterOneStolenItemStatus, 'recovered-altered')
  assert.ok(Object.values(CHAPTER_ONE_STOLEN_ITEM_STATUSES).includes(CHAPTER_ONE_STOLEN_ITEM_STATUSES.voluntarilySurrendered))
})
