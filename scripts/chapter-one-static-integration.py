from pathlib import Path


def replace(path, old, new):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"Expected patch text missing in {path}: {old[:120]!r}")
    p.write_text(text.replace(old, new, 1))


runtime = 'src/features/games/weed-goblins/weedGoblinsChapterOneStaticRuntime.js'
replace(runtime, "'boss:outlast': { stat: 'defense', tierId: 'wither', dcOverride:", "'boss:outlast': { stat: 'defense', tierId: 'harvest', dcOverride:")
replace(runtime, "'boss:overpower': { stat: 'strength', tierId: 'wither', dcOverride:", "'boss:overpower': { stat: 'strength', tierId: 'harvest', dcOverride:")
replace(runtime, "'boss:spell': { stat: 'defense', tierId: 'wither', manaCost: 2, dcOverride:", "'boss:spell': { stat: 'defense', tierId: 'harvest', manaCost: 2, dcOverride:")
replace(
    runtime,
    "  const outcome = naturalOne ? 'naturalOne' : success ? 'success' : 'failure'\n  const trouble = success ? working.trouble : troubleAfterFailure(working, naturalOne)",
    "  const outcome = naturalOne ? 'naturalOne' : success ? 'success' : 'failure'\n  const narrationKey = actionId === 'sneak:title-deputy' || actionId === 'sneak:title-duke' ? 'sneak:title' : actionId\n  const narrationOutcome = naturalOne && !CHAPTER_ONE_ACTION_OUTCOMES[narrationKey]?.naturalOne ? 'failure' : outcome\n  const trouble = success ? working.trouble : troubleAfterFailure(working, naturalOne)",
)
replace(
    runtime,
    "  next = addOutcome(next, actionId === 'sneak:title-deputy' || actionId === 'sneak:title-duke' ? 'sneak:title' : actionId, outcome, {\n    type: 'check', stat: config.stat, dc, dangerTier: config.tierId, rolls, roll: sharedResult.roll,",
    "  next = addOutcome(next, narrationKey, narrationOutcome, {\n    stat: config.stat, dc, dangerTier: config.tierId, rolls, roll: sharedResult.roll,",
)

persistence = 'src/features/games/weed-goblins/weedGoblinsPersistenceChapterOne.js'
replace(persistence, 'export const WEED_GOBLINS_ACTIVE_RUN_VERSION = 1', 'export const WEED_GOBLINS_ACTIVE_RUN_VERSION = 2')
replace(
    persistence,
    "    nameSuggestionsVisible: flags.nameSuggestionsVisible === true,\n  }",
    "    nameSuggestionsVisible: flags.nameSuggestionsVisible === true,\n    voluntarilySurrendered: flags.voluntarilySurrendered === true,\n  }",
)
replace(
    persistence,
    "    stolenItem: cleanText(state.stolenItem, 200),\n    goblinName:",
    "    stolenItem: cleanText(state.stolenItem, 200),\n    stolenItemStatus: cleanText(state.stolenItemStatus, 60) || null,\n    chapterOne: safeJsonClone(state.chapterOne, 50_000) || {},\n    goblinName:",
)

adapter = 'src/features/games/weed-goblins/weedGoblinsLocalDataAdapterChapterOne.js'
replace(adapter, "  'stolenItem',\n  'routeId',", "  'stolenItem',\n  'stolenItemStatus',\n  'routeId',")

through2 = 'src/features/games/weed-goblins/weedGoblinsChatControllerThroughChapterTwo.js'
replace(
    through2,
    "    outcomeSummary: typeof run?.outcomeSummary === 'string' ? run.outcomeSummary : '',\n    rootcoinRemaining:",
    "    outcomeSummary: typeof run?.outcomeSummary === 'string' ? run.outcomeSummary : '',\n    stolenItemStatus: typeof run?.stolenItemStatus === 'string' ? run.stolenItemStatus : '',\n    rootcoinRemaining:",
)
replace(
    through2,
    "  if (!state.flags?.sessionZeroComplete || state.sceneId !== 'choose-route') return state",
    "  if (!state.flags?.sessionZeroComplete || state.sceneId !== 'windcut-trail') return state",
)

controller3 = 'src/features/games/weed-goblins/weedGoblinsChatController.js'
replace(
    controller3,
    "    outcomeSummary: typeof run?.outcomeSummary === 'string' ? run.outcomeSummary : '',\n    rootcoinRemaining:",
    "    outcomeSummary: typeof run?.outcomeSummary === 'string' ? run.outcomeSummary : '',\n    stolenItemStatus: typeof run?.stolenItemStatus === 'string' ? run.stolenItemStatus : '',\n    rootcoinRemaining:",
)
replace(
    controller3,
    "  if (!state.flags?.sessionZeroComplete || state.sceneId !== 'choose-route') return state",
    "  if (!state.flags?.sessionZeroComplete || state.sceneId !== 'windcut-trail') return state",
)

chapter2 = 'src/features/games/weed-goblins/weedGoblinsChapterTwoRuntime.js'
marker = "function inheritedInventory(previousRuns = []) {"
helper = "function latestChapterOneRun(previousRuns = []) {\n  if (!Array.isArray(previousRuns)) return null\n  for (let index = previousRuns.length - 1; index >= 0; index -= 1) {\n    if (previousRuns[index]?.adventureId === 'goblin-highlands-session-1') return previousRuns[index]\n  }\n  return null\n}\n\n"
replace(chapter2, marker, helper + marker)
replace(
    chapter2,
    "    chapterTwo: {\n      lanternSolved: false,",
    "    chapterTwo: {\n      chapterOneStolenItemStatus: cleanText(latestChapterOneRun(previousRuns)?.stolenItemStatus, 60) || null,\n      lanternSolved: false,",
)

engine = 'src/features/games/weed-goblins/weedGoblinsEngine.js'
replace(
    engine,
    "import { CHAPTER_ONE_REWARDS } from './weedGoblinsChapterOne.js'",
    "import { CHAPTER_ONE_REWARDS, CHAPTER_ONE_SCENE_TEXT, SESSION_ZERO_QUESTIONS, SESSION_ZERO_WELCOME as STATIC_SESSION_ZERO_WELCOME } from './weedGoblinsChapterOne.js'",
)
old_intro = '''export const WEED_GOBLINS_INTRODUCTION =
  "Welcome to the Goblin Highlands. I'll be your narrator. I'm Eliza. Your boot stops beside a fresh goblin footprint pressed deep into the mud of Windcut Trail. Somewhere above, the King's Stash Hall closes its doors."

export const WEED_GOBLINS_RETURNING_LINE =
  "You've been to the Goblin Highlands before. Last time you [outcome]. I'm curious whether you'll make the same choices."


export const SESSION_ZERO_WELCOME = Object.freeze([
  "The road gives out right here, where the Highlands start. One boot's already sunk in the mud.",
  "But first, I need to know who's walking into that story. Every traveler who comes up this road carries a name, a look, a kind, and a way of meeting trouble. Let's settle those now.",
])

const SESSION_RACE_QUESTION =
  'One more thing before the road takes you anywhere. What are you?'

const SESSION_WEAPON_QUESTION =
  'And what do you carry?'

const SESSION_CLASS_QUESTION =
  'How do you handle yourself when the road turns ugly?'

const SESSION_PRONOUN_QUESTION =
  "Last bit of bookkeeping. What do I call you, when I'm not using your name?"

const SESSION_LOOK_QUESTION =
  'Paint yourself for me.'
'''
new_intro = '''export const WEED_GOBLINS_INTRODUCTION = CHAPTER_ONE_SCENE_TEXT.windcutTrail[0]

export const WEED_GOBLINS_RETURNING_LINE =
  "You've been to the Goblin Highlands before. Last time you [outcome]. I'm curious whether you'll make the same choices."

export const SESSION_ZERO_WELCOME = STATIC_SESSION_ZERO_WELCOME

const SESSION_RACE_QUESTION = 'Human, dwarf, elf, or gnome?'
const SESSION_WEAPON_QUESTION = SESSION_ZERO_QUESTIONS.weapon
const SESSION_CLASS_QUESTION = SESSION_ZERO_QUESTIONS.background
const SESSION_PRONOUN_QUESTION = SESSION_ZERO_QUESTIONS.pronoun
const SESSION_LOOK_QUESTION = SESSION_ZERO_QUESTIONS.look
'''
replace(engine, old_intro, new_intro)
replace(
    engine,
    "  const narration = [\n    ...state.narration,\n    \"Everything I need. Windcut Trail won\\'t wait for the rest.\",\n    WEED_GOBLINS_INTRODUCTION,\n  ]",
    "  const narration = [...state.narration, WEED_GOBLINS_INTRODUCTION]",
)

Path('src/features/games/weed-goblins/weedGoblinsChapterOneStatic.test.js').write_text(r'''import test from 'node:test'
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
''')
