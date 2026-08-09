import * as prior from './weedGoblinsChatControllerThroughChapterTwo.js'
import {
  buildChapterThreePersonalization,
  createChapterThreeRunFromSessionZero,
} from './weedGoblinsChapterThreeRuntime.js'
import * as chapterThree from './weedGoblinsChapterThreeChatController.js'
import { calculateWeedGoblinsProgression } from './weedGoblinsProgression.js'

export {
  createIncomingChatMessage,
  createOutgoingChoiceMessage,
  createOutgoingTextMessage,
  createRollResultMessage,
  createRollTriggerMessage,
} from './weedGoblinsChatControllerThroughChapterTwo.js'

const TARGET_CHAPTER_THREE = 3

function isChapterThreeState(state) {
  return state?.chapterNumber === TARGET_CHAPTER_THREE
    || state?.adventureId === 'withered-grove-session-1'
}

function isChapterThreeSessionZero(state) {
  return state?.targetChapterNumber === TARGET_CHAPTER_THREE && !isChapterThreeState(state)
}

function chapterThreeShouldStart(previousRuns = []) {
  const progression = calculateWeedGoblinsProgression(previousRuns)
  const playable = progression.nextChapterReference || progression.currentChapter
  return playable?.number === TARGET_CHAPTER_THREE
}

function safePreviousRuns(previousRuns = []) {
  if (!Array.isArray(previousRuns)) return []
  return previousRuns.slice(-10).map((run) => ({
    adventureId: typeof run?.adventureId === 'string' ? run.adventureId : '',
    seed: typeof run?.seed === 'string' ? run.seed : '',
    ending: typeof run?.ending === 'string' ? run.ending : '',
    outcomeSummary: typeof run?.outcomeSummary === 'string' ? run.outcomeSummary : '',
    rootcoinRemaining: Number.isInteger(Number(run?.rootcoinRemaining))
      ? Math.max(0, Math.min(99, Number(run.rootcoinRemaining)))
      : undefined,
    chapterTwoRewards: Array.isArray(run?.chapterTwoRewards)
      ? run.chapterTwoRewards.filter((value) => typeof value === 'string').slice(0, 8)
      : [],
    chapterThreeRewards: Array.isArray(run?.chapterThreeRewards)
      ? run.chapterThreeRewards.filter((value) => typeof value === 'string').slice(0, 8)
      : [],
  }))
}

function tagChapterThreeSessionState(state, {
  journalSnapshot = {},
  previousRuns = [],
} = {}) {
  return {
    ...state,
    targetChapterNumber: TARGET_CHAPTER_THREE,
    chapterThreePersonalization: buildChapterThreePersonalization(journalSnapshot),
    chapterThreePreviousRuns: safePreviousRuns(previousRuns),
  }
}

function preserveTargetTags(before, after) {
  if (!isChapterThreeSessionZero(before) || !after) return after
  return {
    ...after,
    targetChapterNumber: TARGET_CHAPTER_THREE,
    chapterThreePersonalization: before.chapterThreePersonalization,
    chapterThreePreviousRuns: before.chapterThreePreviousRuns,
  }
}

function maybeEnterChapterThree(state) {
  if (!isChapterThreeSessionZero(state)) return state
  if (!state.flags?.sessionZeroComplete || state.sceneId !== 'choose-route') return state
  return createChapterThreeRunFromSessionZero(state, {
    previousRuns: state.chapterThreePreviousRuns || [],
    personalization: state.chapterThreePersonalization,
  })
}

function targetSessionPrompt(state) {
  const prompts = {
    'session-zero-name': 'Start with your name. Type one, or ask me for a few ideas.',
    'session-zero-race': 'What are you?',
    'session-zero-weapon': 'What do you carry?',
    'choose-background': 'How do you handle yourself when the road turns ugly?',
    'session-zero-pronoun': "What do I call you when I'm not using your name?",
    'session-zero-look': 'Paint yourself for me.',
  }
  return prompts[state?.sceneId]
    || 'Character setup stays the same. Once this is settled, the Gray Verge is waiting at the edge of the Withered Grove.'
}

function targetSessionTransitionMessages(after) {
  const message = prior.createIncomingChatMessage(targetSessionPrompt(after), {
    source: 'chapter-three-session-zero',
  })
  return message ? [message] : []
}

function convertPreparedTargetTurn(prepared) {
  if (!prepared?.before || !isChapterThreeSessionZero(prepared.before)) return prepared
  const taggedAfter = prepared.after
    ? maybeEnterChapterThree(preserveTargetTags(prepared.before, prepared.after))
    : prepared.after
  return Object.freeze({
    ...prepared,
    before: preserveTargetTags(prepared.before, prepared.before),
    after: taggedAfter,
  })
}

export async function createWeedGoblinsChatSession(options = {}) {
  const previousRuns = Array.isArray(options.previousRuns) ? options.previousRuns : []
  if (!chapterThreeShouldStart(previousRuns)) return prior.createWeedGoblinsChatSession(options)

  const legacySession = await prior.createWeedGoblinsChatSession(options)
  const state = tagChapterThreeSessionState(legacySession.state, options)
  const messages = [
    prior.createIncomingChatMessage(
      'The Living Root Map has a destination now. Before we step into the Gray Verge, I need to know who is walking in.',
      { source: 'chapter-three-session-zero' },
    ),
    prior.createIncomingChatMessage(
      'Name, kind, weapon, approach, pronouns, and look. Then we follow the gray roots into the Withered Grove.',
      { source: 'chapter-three-session-zero' },
    ),
  ].filter(Boolean)
  return {
    state,
    messages,
    choices: prior.getWeedGoblinsQuickReplies(state),
  }
}

export function getWeedGoblinsQuickReplies(state) {
  if (isChapterThreeState(state)) return chapterThree.getChapterThreeQuickReplies(state)
  return prior.getWeedGoblinsQuickReplies(state)
}

export function isWeedGoblinsFreeTextScene(state) {
  if (isChapterThreeState(state)) return chapterThree.isChapterThreeFreeTextScene(state)
  if (isChapterThreeSessionZero(state)) return false
  return prior.isWeedGoblinsFreeTextScene(state)
}

export function isWeedGoblinsSessionTextScene(state) {
  if (isChapterThreeState(state)) return false
  return prior.isWeedGoblinsSessionTextScene(state)
}

export function selectWeedGoblinsChatChoice(state, action) {
  if (isChapterThreeState(state)) return chapterThree.selectChapterThreeChatChoice(state, action)
  const result = prior.selectWeedGoblinsChatChoice(state, action)
  if (!isChapterThreeSessionZero(state)) return result
  const after = maybeEnterChapterThree(preserveTargetTags(state, result.after))
  return { ...result, before: state, after }
}

export function prepareWeedGoblinsChoiceTurn({ state, action } = {}) {
  if (isChapterThreeState(state)) return chapterThree.prepareChapterThreeChoiceTurn({ state, action })
  return convertPreparedTargetTurn(prior.prepareWeedGoblinsChoiceTurn({ state, action }))
}

export async function prepareWeedGoblinsQuickReplyTurn(options = {}) {
  if (isChapterThreeState(options.state)) return chapterThree.prepareChapterThreeQuickReplyTurn(options)
  const prepared = await prior.prepareWeedGoblinsQuickReplyTurn(options)
  return convertPreparedTargetTurn(prepared)
}

export function submitWeedGoblinsSessionText(state, value) {
  if (isChapterThreeState(state)) {
    throw new Error(`Session text input is not available in scene ${state?.sceneId ?? '(missing)'}.`)
  }
  const transition = prior.submitWeedGoblinsSessionText(state, value)
  if (!isChapterThreeSessionZero(state)) return transition
  const tagged = preserveTargetTags(state, transition.after)
  return {
    ...transition,
    before: state,
    after: maybeEnterChapterThree(tagged),
  }
}

export async function prepareWeedGoblinsFreeTextTurn(options = {}) {
  if (isChapterThreeState(options.state)) return chapterThree.prepareChapterThreeFreeTextTurn(options)
  return prior.prepareWeedGoblinsFreeTextTurn(options)
}

export function resolveWeedGoblinsPreparedMechanics(options = {}) {
  if (isChapterThreeState(options.preparedTurn?.before)) {
    return chapterThree.resolveChapterThreePreparedMechanics(options)
  }
  return prior.resolveWeedGoblinsPreparedMechanics(options)
}

export async function narrateWeedGoblinsResolvedTurn(options = {}) {
  if (isChapterThreeState(options.preparedTurn?.before)) {
    return chapterThree.narrateChapterThreeResolvedTurn(options)
  }
  return prior.narrateWeedGoblinsResolvedTurn(options)
}

export async function resolveWeedGoblinsPreparedTurn(options = {}) {
  if (isChapterThreeState(options.preparedTurn?.before)) {
    return chapterThree.resolveChapterThreePreparedTurn(options)
  }
  return prior.resolveWeedGoblinsPreparedTurn(options)
}

export async function resolveWeedGoblinsTransitionMessages(options = {}) {
  const { before, after } = options
  if (isChapterThreeState(after)) {
    if (isChapterThreeSessionZero(before)) {
      return chapterThree.createChapterThreeOpeningMessages({
        state: after,
        blockedRealNames: options.blockedRealNames,
        generateNarration: options.generateNarration,
      })
    }
    return chapterThree.resolveChapterThreeTransitionMessages(options)
  }
  if (isChapterThreeSessionZero(before) || isChapterThreeSessionZero(after)) {
    return targetSessionTransitionMessages(after)
  }
  return prior.resolveWeedGoblinsTransitionMessages(options)
}

export async function resolveWeedGoblinsTransitionWithStaticFallback(options = {}) {
  try {
    return await resolveWeedGoblinsTransitionMessages(options)
  } catch {
    if (isChapterThreeState(options.after)) {
      return chapterThree.resolveChapterThreeTransitionWithStaticFallback(options)
    }
    if (isChapterThreeSessionZero(options.before) || isChapterThreeSessionZero(options.after)) {
      return targetSessionTransitionMessages(options.after)
    }
    return prior.resolveWeedGoblinsTransitionWithStaticFallback(options)
  }
}
