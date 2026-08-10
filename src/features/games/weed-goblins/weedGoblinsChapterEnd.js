import {
  WEED_GOBLINS_PROGRESSION_CATALOG,
  calculateWeedGoblinsProgression,
  weedGoblinsProgressionMetadata,
} from './weedGoblinsProgression.js'

function safeRuns(previousRuns) {
  return Array.isArray(previousRuns) ? previousRuns.filter((run) => run && typeof run === 'object') : []
}

function currentRunHistory(state, previousRuns) {
  const runs = safeRuns(previousRuns)
  if (!state?.runSummary) return runs
  return [...runs, state.runSummary]
}

function outcomeCopy(state) {
  const stolenItem = typeof state?.stolenItem === 'string' && state.stolenItem.trim()
    ? state.stolenItem.trim()
    : 'the stolen item'

  if (state?.ending === 'escape') {
    return {
      outcomeKind: 'failed',
      title: 'This run failed',
      body: `You escaped the Highlands without recovering ${stolenItem}. That attempt is over, but the chapter is still playable.`,
    }
  }

  if (state?.ending === 'bargain') {
    return {
      outcomeKind: 'completed',
      title: 'Run complete',
      body: `You recovered ${stolenItem} by bargain and closed this attempt with the goblins still owing you a story.`,
    }
  }

  if (state?.ending === 'recovery') {
    return {
      outcomeKind: 'completed',
      title: 'Run complete',
      body: `You recovered ${stolenItem} from the Highlands. This attempt is complete.`,
    }
  }

  const summary = typeof state?.runSummary?.outcomeSummary === 'string'
    ? state.runSummary.outcomeSummary.trim()
    : ''
  return {
    outcomeKind: 'completed',
    title: 'Run complete',
    body: summary || 'This attempt is complete.',
  }
}

export function buildWeedGoblinsChapterEndState(state, previousRuns = []) {
  if (!state || state.status !== 'completed') return null

  const metadata = weedGoblinsProgressionMetadata(state.adventureId)
  const outcome = outcomeCopy(state)
  if (!metadata) {
    return Object.freeze({
      ...outcome,
      continuationKind: 'edge',
      continuation: 'You have reached the edge of the Weed Goblins content currently built into this playtest.',
      buttonLabel: 'Replay this chapter',
      nextChapter: null,
    })
  }

  const progression = calculateWeedGoblinsProgression(currentRunHistory(state, previousRuns))
  const currentChapter = progression.chapters.find(
    (chapter) => chapter.number === metadata.chapterNumber,
  ) || null
  const nextBuiltChapter = WEED_GOBLINS_PROGRESSION_CATALOG.chapters.find(
    (chapter) => chapter.number === metadata.chapterNumber + 1,
  ) || null
  const nextProgressChapter = nextBuiltChapter
    ? progression.chapters.find((chapter) => chapter.number === nextBuiltChapter.number) || null
    : null

  if (!nextBuiltChapter) {
    return Object.freeze({
      ...outcome,
      continuationKind: 'edge',
      continuation: 'You have reached the edge of the Weed Goblins content currently built into this playtest.',
      buttonLabel: `Replay Chapter ${metadata.chapterNumber}: ${metadata.chapterTitle}`,
      nextChapter: null,
    })
  }

  if (nextProgressChapter?.unlocked) {
    return Object.freeze({
      ...outcome,
      continuationKind: 'next-chapter',
      continuation: `Chapter ${nextBuiltChapter.number}: ${nextBuiltChapter.title} is unlocked and is the next built chapter.`,
      buttonLabel: `Continue to Chapter ${nextBuiltChapter.number}: ${nextBuiltChapter.title}`,
      nextChapter: Object.freeze({
        number: nextBuiltChapter.number,
        title: nextBuiltChapter.title,
      }),
    })
  }

  const completedHere = Number(currentChapter?.completedRunCount) || 0
  const remainingRuns = Math.max(0, 5 - completedHere)
  const runWord = remainingRuns === 1 ? 'run' : 'runs'
  return Object.freeze({
    ...outcome,
    continuationKind: 'chapter-replay',
    continuation: `Chapter ${nextBuiltChapter.number}: ${nextBuiltChapter.title} is built but not unlocked yet. Complete ${remainingRuns} more ${runWord} in Chapter ${metadata.chapterNumber} to open it.`,
    buttonLabel: `Play Chapter ${metadata.chapterNumber} again`,
    nextChapter: Object.freeze({
      number: nextBuiltChapter.number,
      title: nextBuiltChapter.title,
    }),
  })
}
