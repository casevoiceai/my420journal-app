import test from 'node:test'
import assert from 'node:assert/strict'

import {
  calculateGameProgression,
  createGameProgressionCatalog,
} from '../gameProgression.js'
import {
  NARRATION_TIERS,
  calculateNarrationTier,
} from './weedGoblinsEngine.js'
import {
  saveWeedGoblinsRunSummary,
  weedGoblinsRunStorageKey,
} from './weedGoblinsLocalDataAdapter.js'
import {
  WEED_GOBLINS_CHAPTER_TWO,
  WEED_GOBLINS_PROGRESS_LABEL,
  WEED_GOBLINS_PROGRESSION_CATALOG,
  calculateWeedGoblinsProgression,
  weedGoblinsProgressionMetadata,
} from './weedGoblinsProgression.js'

function createWritableMemoryStorage() {
  const values = {}
  return {
    getItem(key) {
      return Object.hasOwn(values, key) ? values[key] : null
    },
    setItem(key, value) {
      values[key] = String(value)
    },
  }
}

function createAuthOnlyStore(userId = 'user-1') {
  return {
    auth: {
      async getUser() {
        return { data: { user: { id: userId } }, error: null }
      },
    },
  }
}

function completedChapterOneRuns(count) {
  return Array.from({ length: count }, () => ({
    adventureId: 'goblin-highlands-session-1',
    ending: 'recovery',
  }))
}

function classifyLikeNarrationCallbacks(completedRunCount) {
  const tier = calculateNarrationTier(completedRunCount)
  return {
    tier,
    finishedEnough: tier !== NARRATION_TIERS.normal,
    mastered: tier === NARRATION_TIERS.fourthWall,
  }
}

test('formalizes Weed Goblins Chapter 1 and Chapter 2 without exposing Chapter 2 early', () => {
  assert.equal(WEED_GOBLINS_PROGRESSION_CATALOG.gameId, 'weed-goblins')
  assert.equal(WEED_GOBLINS_PROGRESSION_CATALOG.chapters.length, 2)
  assert.equal(WEED_GOBLINS_PROGRESSION_CATALOG.chapters[0].number, 1)
  assert.equal(WEED_GOBLINS_PROGRESSION_CATALOG.chapters[0].title, 'The Goblin Highlands')
  assert.equal(WEED_GOBLINS_PROGRESSION_CATALOG.chapters[0].quests[0].adventureId, 'goblin-highlands-session-1')
  assert.equal(WEED_GOBLINS_CHAPTER_TWO.number, 2)
  assert.equal(WEED_GOBLINS_CHAPTER_TWO.title, 'The Hollow Market')
  assert.equal(WEED_GOBLINS_CHAPTER_TWO.quests[0].adventureId, 'hollow-market-session-1')
  assert.equal(WEED_GOBLINS_PROGRESS_LABEL, 'Chapter 1: The Goblin Highlands')

  const fresh = calculateWeedGoblinsProgression([])
  assert.deepEqual(fresh.unlockedChapters.map((chapter) => chapter.id), ['chapter-1'])
  assert.equal(fresh.nextChapterReference, null)
})

test('adds chapter and quest identity to both canonical adventures', () => {
  assert.deepEqual(
    weedGoblinsProgressionMetadata('goblin-highlands-session-1'),
    {
      gameId: 'weed-goblins',
      chapterId: 'chapter-1',
      chapterNumber: 1,
      chapterTitle: 'The Goblin Highlands',
      questId: 'quest-1',
      questNumber: 1,
      questTitle: 'Weed Goblins',
    },
  )
  assert.deepEqual(
    weedGoblinsProgressionMetadata('hollow-market-session-1'),
    {
      gameId: 'weed-goblins',
      chapterId: 'chapter-2',
      chapterNumber: 2,
      chapterTitle: 'The Hollow Market',
      questId: 'quest-2',
      questNumber: 1,
      questTitle: 'The Hollow Market',
    },
  )
})

test('saves chapter and quest metadata in the existing Weed Goblins history key', async () => {
  const userId = 'user-1'
  const storage = createWritableMemoryStorage()
  const result = await saveWeedGoblinsRunSummary({
    runSummary: {
      adventureId: 'goblin-highlands-session-1',
      backgroundId: 'tracker',
      ending: 'recovery',
      outcomeSummary: 'recovered the field reliquary',
      trouble: 0,
      manaRemaining: 1,
    },
    store: createAuthOnlyStore(userId),
    storage,
  })

  assert.equal(result.summary.chapterId, 'chapter-1')
  assert.equal(result.summary.chapterNumber, 1)
  assert.equal(result.summary.questId, 'quest-1')
  assert.equal(result.summary.questNumber, 1)

  const stored = JSON.parse(storage.getItem(weedGoblinsRunStorageKey(userId)))
  assert.equal(stored.length, 1)
  assert.equal(stored[0].gameId, 'weed-goblins')
  assert.equal(stored[0].chapterTitle, 'The Goblin Highlands')
  assert.equal(stored[0].questTitle, 'Weed Goblins')
})

test('five Chapter 1 runs unlock Hollow Market as a genuine next chapter signal', () => {
  const fresh = calculateWeedGoblinsProgression(completedChapterOneRuns(0))
  const four = calculateWeedGoblinsProgression(completedChapterOneRuns(4))
  const five = calculateWeedGoblinsProgression(completedChapterOneRuns(5))
  const ten = calculateWeedGoblinsProgression(completedChapterOneRuns(10))

  assert.deepEqual(fresh.unlockedChapters.map((chapter) => chapter.id), ['chapter-1'])
  assert.equal(fresh.currentChapter.finishedEnough, false)
  assert.equal(fresh.nextChapterReference, null)

  assert.deepEqual(four.unlockedChapters.map((chapter) => chapter.id), ['chapter-1'])
  assert.equal(four.nextChapterReference, null)

  assert.deepEqual(five.unlockedChapters.map((chapter) => chapter.id), ['chapter-1', 'chapter-2'])
  assert.equal(five.currentChapter.id, 'chapter-1')
  assert.equal(five.currentChapter.finishedEnough, true)
  assert.equal(five.currentChapter.milestoneTier, NARRATION_TIERS.experiencedCallback)
  assert.equal(five.nextChapterReference.id, 'chapter-2')
  assert.equal(five.nextChapterReference.completedRunCount, 0)

  assert.deepEqual(ten.unlockedChapters.map((chapter) => chapter.id), ['chapter-1', 'chapter-2'])
  assert.equal(ten.currentChapter.id, 'chapter-1')
  assert.equal(ten.currentChapter.mastered, true)
  assert.equal(ten.nextChapterReference.id, 'chapter-2')
})

test('once Hollow Market has a completed run it becomes the chapter actually being worked through', () => {
  const progression = calculateWeedGoblinsProgression([
    ...completedChapterOneRuns(5),
    { adventureId: 'hollow-market-session-1', ending: 'recovery' },
  ])

  assert.equal(progression.currentChapter.id, 'chapter-2')
  assert.equal(progression.currentChapter.completedRunCount, 1)
  assert.equal(progression.currentChapter.finishedEnough, false)
  assert.equal(progression.nextChapterReference, null)
})

test('generic progression core keeps newly unlocked unplayed chapter distinct from current chapter', () => {
  const catalog = createGameProgressionCatalog({
    gameId: 'progression-test',
    chapters: [
      {
        id: 'chapter-1',
        number: 1,
        title: 'Chapter One',
        quests: [{ id: 'quest-1', number: 1, title: 'Quest One', adventureId: 'chapter-one-quest' }],
      },
      {
        id: 'chapter-2',
        number: 2,
        title: 'Chapter Two',
        quests: [{ id: 'quest-2', number: 1, title: 'Quest Two', adventureId: 'chapter-two-quest' }],
      },
    ],
  })
  const progression = calculateGameProgression({
    catalog,
    previousRuns: Array.from({ length: 5 }, () => ({ adventureId: 'chapter-one-quest' })),
    classifyCompletedRunCount: classifyLikeNarrationCallbacks,
  })

  assert.deepEqual(progression.unlockedChapters.map((chapter) => chapter.id), ['chapter-1', 'chapter-2'])
  assert.equal(progression.chapters[0].finishedEnough, true)
  assert.equal(progression.chapters[1].completedRunCount, 0)
  assert.equal(progression.currentChapter.id, 'chapter-1')
  assert.equal(progression.nextChapterReference.id, 'chapter-2')
  assert.notEqual(progression.currentChapter.id, progression.nextChapterReference.id)
})

test('generic progression core unlocks sequentially without another storage model', () => {
  const catalog = createGameProgressionCatalog({
    gameId: 'progression-test',
    chapters: [
      {
        id: 'stage-a',
        number: 1,
        title: 'Stage A',
        quests: [{ id: 'task-a', number: 1, title: 'Task A', adventureId: 'fixture-a' }],
      },
      {
        id: 'stage-b',
        number: 2,
        title: 'Stage B',
        quests: [{ id: 'task-b', number: 1, title: 'Task B', adventureId: 'fixture-b' }],
      },
    ],
  })

  const before = calculateGameProgression({
    catalog,
    previousRuns: Array.from({ length: 4 }, () => ({ adventureId: 'fixture-a' })),
    classifyCompletedRunCount: classifyLikeNarrationCallbacks,
  })
  const after = calculateGameProgression({
    catalog,
    previousRuns: Array.from({ length: 5 }, () => ({ adventureId: 'fixture-a' })),
    classifyCompletedRunCount: classifyLikeNarrationCallbacks,
  })
  const laterWindow = calculateGameProgression({
    catalog,
    previousRuns: [
      ...Array.from({ length: 5 }, () => ({ adventureId: 'fixture-a' })),
      ...Array.from({ length: 10 }, () => ({ adventureId: 'fixture-b' })),
    ],
    classifyCompletedRunCount: classifyLikeNarrationCallbacks,
  })

  assert.deepEqual(before.unlockedChapters.map((chapter) => chapter.id), ['stage-a'])
  assert.equal(before.nextChapterReference, null)
  assert.deepEqual(after.unlockedChapters.map((chapter) => chapter.id), ['stage-a', 'stage-b'])
  assert.equal(after.currentChapter.id, 'stage-a')
  assert.equal(after.nextChapterReference.id, 'stage-b')
  assert.deepEqual(laterWindow.unlockedChapters.map((chapter) => chapter.id), ['stage-a', 'stage-b'])
  assert.equal(laterWindow.currentChapter.id, 'stage-b')
  assert.equal(laterWindow.nextChapterReference, null)
})
