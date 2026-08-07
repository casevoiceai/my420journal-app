function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function safePositiveInteger(value) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < 1) return null
  return number
}

function freezeQuest(quest, chapter) {
  const id = cleanText(quest?.id)
  const title = cleanText(quest?.title)
  const adventureId = cleanText(quest?.adventureId)
  const number = safePositiveInteger(quest?.number)
  if (!id || !title || !adventureId || number === null) {
    throw new Error('Each quest needs an id, number, title, and adventureId.')
  }
  return Object.freeze({
    id,
    number,
    title,
    adventureId,
    chapterId: chapter.id,
    chapterNumber: chapter.number,
    chapterTitle: chapter.title,
  })
}

function freezeChapter(chapter) {
  const id = cleanText(chapter?.id)
  const title = cleanText(chapter?.title)
  const number = safePositiveInteger(chapter?.number)
  if (!id || !title || number === null || !Array.isArray(chapter?.quests) || chapter.quests.length === 0) {
    throw new Error('Each chapter needs an id, number, title, and at least one quest.')
  }
  const chapterIdentity = Object.freeze({ id, number, title })
  return Object.freeze({
    ...chapterIdentity,
    quests: Object.freeze(chapter.quests.map((quest) => freezeQuest(quest, chapterIdentity))),
  })
}

export function createGameProgressionCatalog({ gameId, chapters } = {}) {
  const safeGameId = cleanText(gameId)
  if (!safeGameId || !Array.isArray(chapters) || chapters.length === 0) {
    throw new Error('A game progression catalog needs a gameId and at least one chapter.')
  }
  return Object.freeze({
    gameId: safeGameId,
    chapters: Object.freeze(chapters.map(freezeChapter)),
  })
}

export function findQuestByAdventureId(catalog, adventureId) {
  const target = cleanText(adventureId)
  if (!catalog?.chapters || !target) return null
  for (const chapter of catalog.chapters) {
    const quest = chapter.quests.find((candidate) => candidate.adventureId === target)
    if (quest) return quest
  }
  return null
}

export function progressionMetadataForAdventure(catalog, adventureId) {
  const quest = findQuestByAdventureId(catalog, adventureId)
  if (!quest) return null
  return Object.freeze({
    gameId: catalog.gameId,
    chapterId: quest.chapterId,
    chapterNumber: quest.chapterNumber,
    chapterTitle: quest.chapterTitle,
    questId: quest.id,
    questNumber: quest.number,
    questTitle: quest.title,
  })
}

export function attachProgressionMetadata(catalog, runSummary) {
  if (!runSummary || typeof runSummary !== 'object' || Array.isArray(runSummary)) return runSummary
  const metadata = progressionMetadataForAdventure(catalog, runSummary.adventureId)
  return metadata ? { ...runSummary, ...metadata } : { ...runSummary }
}

function chapterForRun(catalog, run) {
  if (!run || typeof run !== 'object') return null
  if (cleanText(run.gameId) && cleanText(run.gameId) !== catalog.gameId) return null

  const chapterId = cleanText(run.chapterId)
  if (chapterId) {
    return catalog.chapters.find((chapter) => chapter.id === chapterId) || null
  }

  const inferredQuest = findQuestByAdventureId(catalog, run.adventureId)
  return inferredQuest
    ? catalog.chapters.find((chapter) => chapter.id === inferredQuest.chapterId) || null
    : null
}

function runBelongsToChapter(catalog, run, chapter) {
  return chapterForRun(catalog, run)?.id === chapter.id
}

export function calculateGameProgression({
  catalog,
  previousRuns = [],
  classifyCompletedRunCount,
} = {}) {
  if (!catalog?.chapters || typeof classifyCompletedRunCount !== 'function') {
    throw new Error('Progression requires a catalog and completed-run classifier.')
  }

  const runs = Array.isArray(previousRuns) ? previousRuns : []
  const highestRecordedChapterNumber = runs.reduce((highest, run) => {
    const chapter = chapterForRun(catalog, run)
    return chapter ? Math.max(highest, chapter.number) : highest
  }, 0)

  const chapters = catalog.chapters.map((chapter) => {
    const completedRunCount = runs.filter((run) => runBelongsToChapter(catalog, run, chapter)).length
    const milestone = classifyCompletedRunCount(completedRunCount) || {}
    return Object.freeze({
      ...chapter,
      completedRunCount,
      finishedEnough: milestone.finishedEnough === true,
      mastered: milestone.mastered === true,
      milestoneTier: cleanText(milestone.tier),
      unlocked: false,
    })
  })

  const unlockedChapters = []
  for (let index = 0; index < chapters.length; index += 1) {
    const chapter = chapters[index]
    const previousChapter = index > 0 ? chapters[index - 1] : null
    const alreadyReached = chapter.number <= highestRecordedChapterNumber
    const unlocked = index === 0
      || alreadyReached
      || (previousChapter?.unlocked === true && previousChapter.finishedEnough === true)
    const resolved = Object.freeze({ ...chapter, unlocked })
    chapters[index] = resolved
    if (unlocked) unlockedChapters.push(resolved)
  }

  const currentChapter = unlockedChapters.at(-1) || chapters[0] || null
  const nextChapterReference = unlockedChapters.length > 1
    ? unlockedChapters.at(-1)
    : null

  return Object.freeze({
    gameId: catalog.gameId,
    chapters: Object.freeze(chapters),
    unlockedChapters: Object.freeze(unlockedChapters),
    currentChapter,
    nextChapterReference,
  })
}
