import * as chapterOne from './weedGoblinsHelpChapterOne.js'
import {
  getChapterTwoAutomaticGuidance,
  getChapterTwoHelpContextKey,
  getChapterTwoHelpResponse,
} from './weedGoblinsChapterTwoHelp.js'
import {
  getChapterThreeHelpContextKey,
  getChapterThreeHelpResponse,
} from './weedGoblinsChapterThreeHelp.js'

export function shouldShowAutomaticWeedGoblinsGuidance(chapterNumber) {
  if (Number(chapterNumber) >= 3) return false
  return chapterOne.shouldShowAutomaticWeedGoblinsGuidance(chapterNumber)
}

export function getWeedGoblinsAutomaticGuidance(state, chapterNumber = 1) {
  if (state?.chapterNumber === 3) return null
  if (Number(chapterNumber) === 3) {
    return chapterOne.getWeedGoblinsAutomaticGuidance(state, chapterNumber)
  }
  if (state?.chapterNumber === 2 || Number(chapterNumber) === 2) {
    return getChapterTwoAutomaticGuidance(state)
  }
  return chapterOne.getWeedGoblinsAutomaticGuidance(state, chapterNumber)
}

export function getWeedGoblinsHelpContextKey(state, chapterNumber = 1) {
  if (state?.chapterNumber === 3) return getChapterThreeHelpContextKey(state)
  if (state?.chapterNumber === 2 || Number(chapterNumber) === 2) {
    return getChapterTwoHelpContextKey(state)
  }
  return chapterOne.getWeedGoblinsHelpContextKey(state, chapterNumber)
}

export function getWeedGoblinsHelpResponse(state, level = 1, chapterNumber = 1) {
  if (state?.chapterNumber === 3) return getChapterThreeHelpResponse(state, level)
  if (state?.chapterNumber === 2 || Number(chapterNumber) === 2) {
    return getChapterTwoHelpResponse(state, level)
  }
  return chapterOne.getWeedGoblinsHelpResponse(state, level, chapterNumber)
}
