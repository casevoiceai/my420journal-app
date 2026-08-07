import {
  attachProgressionMetadata,
  calculateGameProgression,
  createGameProgressionCatalog,
  progressionMetadataForAdventure,
} from '../gameProgression.js'
import {
  NARRATION_TIERS,
  calculateNarrationTier,
} from './weedGoblinsEngine.js'

export const WEED_GOBLINS_PROGRESSION_CATALOG = createGameProgressionCatalog({
  gameId: 'weed-goblins',
  chapters: [
    {
      id: 'chapter-1',
      number: 1,
      title: 'The Goblin Highlands',
      quests: [
        {
          id: 'quest-1',
          number: 1,
          title: 'Weed Goblins',
          adventureId: 'goblin-highlands-session-1',
        },
      ],
    },
  ],
})

export const WEED_GOBLINS_CHAPTER_ONE = WEED_GOBLINS_PROGRESSION_CATALOG.chapters[0]
export const WEED_GOBLINS_QUEST_ONE = WEED_GOBLINS_CHAPTER_ONE.quests[0]
export const WEED_GOBLINS_PROGRESS_LABEL =
  `Chapter ${WEED_GOBLINS_CHAPTER_ONE.number}: ${WEED_GOBLINS_CHAPTER_ONE.title}`

function classifyCompletedRunCount(completedRunCount) {
  const tier = calculateNarrationTier(completedRunCount)
  return {
    tier,
    finishedEnough: tier !== NARRATION_TIERS.normal,
    mastered: tier === NARRATION_TIERS.fourthWall,
  }
}

export function weedGoblinsProgressionMetadata(adventureId) {
  return progressionMetadataForAdventure(WEED_GOBLINS_PROGRESSION_CATALOG, adventureId)
}

export function attachWeedGoblinsProgressionMetadata(runSummary) {
  return attachProgressionMetadata(WEED_GOBLINS_PROGRESSION_CATALOG, runSummary)
}

export function calculateWeedGoblinsProgression(previousRuns = []) {
  return calculateGameProgression({
    catalog: WEED_GOBLINS_PROGRESSION_CATALOG,
    previousRuns,
    classifyCompletedRunCount,
  })
}
