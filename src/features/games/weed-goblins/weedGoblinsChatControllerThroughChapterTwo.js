import * as chapterOne from './weedGoblinsChatControllerChapterOne.js'
import {
  buildChapterTwoPersonalization,
  createChapterTwoRunFromSessionZero,
} from './weedGoblinsChapterTwoRuntime.js'
import * as chapterTwo from './weedGoblinsChapterTwoChatController.js'
import { calculateWeedGoblinsProgression } from './weedGoblinsProgression.js'

export {
  createIncomingChatMessage,
  createOutgoingChoiceMessage,
  createOutgoingTextMessage,
  createRollResultMessage,
  createRollTriggerMessage,
} from './weedGoblinsChatControllerChapterOne.js'

const TARGET_CHAPTER_TWO = 2

function isChapterTwoState(state) {
  return state?.chapterNumber === TARGET_CHAPTER_TWO
    || state?.adventureId === 'hollow-market-session-1'
}

function isChapterTwoSessionZero(state) {
  return state?.targetChapterNumber === TARGET_CHAPTER_TWO && !isChapterTwoState(state)
}

function chapterTwoShouldStart(previousRuns = []) {
  const progression = calculateWeedGoblinsProgression(previousRuns)
  const playable = progression.nextChapterReference || progression.currentChapter
  return playable?.number === TARGET_CHAPTER_TWO
}

function safePreviousRuns(previousRuns = []) {
  if (!Array.isArray(previousRuns)) return []
  return previousRuns.slice(-10).map((run) => ({
    adventureId: typeof run?.adventureId === 'string' ? run.adventureId : '',
    seed: typeof run?.seed === 'string' ? run.seed : '',
    ending: typeof run?.ending === 'string' ? run.ending : '',
    outcomeSummary: typeof run?.outcomeSummary === 'string' ? run.outcomeSummary : '',
    stolenItemStatus: typeof run?.stolenItemStatus === 'string' ? run.stolenItemStatus : '',
    rootcoinRemaining: Number.isInteger(Number(run?.rootcoinRemaining))
      ? Math.max(0, Math.min(99, Number(run.rootcoinRemaining)))
      : undefined,
    chapterTwoRewards: Array.isArray(run?.chapterTwoRewards)
      ? run.chapterTwoRewards.filter((value) => typeof value === 'string').slice(0, 8)
      : [],
  }))
}

function tagChapterTwoSessionState(state, {
  journalSnapshot = {},
  previousRuns = [],
} = {}) {
  return {
    ...state,
    targetChapterNumber: TARGET_CHAPTER_TWO,
    chapterTwoPersonalization: buildChapterTwoPersonalization(journalSnapshot),
    chapterTwoPreviousRuns: safePreviousRuns(previousRuns),
  }
}

function preserveTargetTags(before, after) {
  if (!isChapterTwoSessionZero(before) || !after) return after
  return {
    ...after,
    targetChapterNumber: TARGET_CHAPTER_TWO,
    chapterTwoPersonalization: before.chapterTwoPersonalization,
    chapterTwoPreviousRuns: before.chapterTwoPreviousRuns,
  }
}

function maybeEnterChapterTwo(state) {
  if (!isChapterTwoSessionZero(state)) return state
  if (!state.flags?.sessionZeroComplete || state.sceneId !== 'windcut-trail') return state
  return createChapterTwoRunFromSessionZero(state, {
    previousRuns: state.chapterTwoPreviousRuns || [],
    personalization: state.chapterTwoPersonalization,
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
    || 'Character setup stays the same. Once this is settled, the Hollow Market opens below the root bridge.'
}

function targetSessionTransitionMessages(after) {
  const message = chapterOne.createIncomingChatMessage(targetSessionPrompt(after), {
    source: 'chapter-two-session-zero',
  })
  return message ? [message] : []
}

function convertPreparedTargetTurn(prepared) {
  if (!prepared?.before || !isChapterTwoSessionZero(prepared.before)) return prepared
  const taggedAfter = prepared.after
    ? maybeEnterChapterTwo(preserveTargetTags(prepared.before, prepared.after))
    : prepared.after
  return Object.freeze({
    ...prepared,
    before: preserveTargetTags(prepared.before, prepared.before),
    after: taggedAfter,
  })
}

export async function createWeedGoblinsChatSession(options = {}) {
  const previousRuns = Array.isArray(options.previousRuns) ? options.previousRuns : []
  if (!chapterTwoShouldStart(previousRuns)) return chapterOne.createWeedGoblinsChatSession(options)

  const legacySession = await chapterOne.createWeedGoblinsChatSession(options)
  const state = tagChapterTwoSessionState(legacySession.state, options)
  const messages = [
    chapterOne.createIncomingChatMessage(
      'The Hollow Market is open to you now. Before we go below the collapsed root bridge, I need to know who is walking in.',
      { source: 'chapter-two-session-zero' },
    ),
    chapterOne.createIncomingChatMessage(
      'Same traveler rules as before: name, kind, weapon, approach, pronouns, and look. Then we find the three smokeless lanterns.',
      { source: 'chapter-two-session-zero' },
    ),
  ].filter(Boolean)
  return {
    state,
    messages,
    choices: chapterOne.getWeedGoblinsQuickReplies(state),
  }
}

export function getWeedGoblinsQuickReplies(state) {
  if (isChapterTwoState(state)) return chapterTwo.getChapterTwoQuickReplies(state)
  return chapterOne.getWeedGoblinsQuickReplies(state)
}

export function isWeedGoblinsFreeTextScene(state) {
  if (isChapterTwoState(state)) return chapterTwo.isChapterTwoFreeTextScene(state)
  if (isChapterTwoSessionZero(state)) return false
  return chapterOne.isWeedGoblinsFreeTextScene(state)
}

export function isWeedGoblinsSessionTextScene(state) {
  if (isChapterTwoState(state)) return false
  return chapterOne.isWeedGoblinsSessionTextScene(state)
}

export function selectWeedGoblinsChatChoice(state, action) {
  if (isChapterTwoState(state)) return chapterTwo.selectChapterTwoChatChoice(state, action)
  const result = chapterOne.selectWeedGoblinsChatChoice(state, action)
  if (!isChapterTwoSessionZero(state)) return result
  const after = maybeEnterChapterTwo(preserveTargetTags(state, result.after))
  return { ...result, before: state, after }
}

export function prepareWeedGoblinsChoiceTurn({ state, action } = {}) {
  if (isChapterTwoState(state)) return chapterTwo.prepareChapterTwoChoiceTurn({ state, action })
  return convertPreparedTargetTurn(chapterOne.prepareWeedGoblinsChoiceTurn({ state, action }))
}

export async function prepareWeedGoblinsQuickReplyTurn(options = {}) {
  if (isChapterTwoState(options.state)) return chapterTwo.prepareChapterTwoQuickReplyTurn(options)
  const prepared = await chapterOne.prepareWeedGoblinsQuickReplyTurn(options)
  return convertPreparedTargetTurn(prepared)
}

export function submitWeedGoblinsSessionText(state, value) {
  if (isChapterTwoState(state)) {
    throw new Error(`Session text input is not available in scene ${state?.sceneId ?? '(missing)'}.`)
  }
  const transition = chapterOne.submitWeedGoblinsSessionText(state, value)
  if (!isChapterTwoSessionZero(state)) return transition
  const tagged = preserveTargetTags(state, transition.after)
  return {
    ...transition,
    before: state,
    after: maybeEnterChapterTwo(tagged),
  }
}

export async function prepareWeedGoblinsFreeTextTurn(options = {}) {
  if (isChapterTwoState(options.state)) return chapterTwo.prepareChapterTwoFreeTextTurn(options)
  return chapterOne.prepareWeedGoblinsFreeTextTurn(options)
}

export function resolveWeedGoblinsPreparedMechanics(options = {}) {
  if (isChapterTwoState(options.preparedTurn?.before)) {
    return chapterTwo.resolveChapterTwoPreparedMechanics(options)
  }
  return chapterOne.resolveWeedGoblinsPreparedMechanics(options)
}

export async function narrateWeedGoblinsResolvedTurn(options = {}) {
  if (isChapterTwoState(options.preparedTurn?.before)) {
    return chapterTwo.narrateChapterTwoResolvedTurn(options)
  }
  return chapterOne.narrateWeedGoblinsResolvedTurn(options)
}

export async function resolveWeedGoblinsPreparedTurn(options = {}) {
  if (isChapterTwoState(options.preparedTurn?.before)) {
    return chapterTwo.resolveChapterTwoPreparedTurn(options)
  }
  return chapterOne.resolveWeedGoblinsPreparedTurn(options)
}

export async function resolveWeedGoblinsTransitionMessages(options = {}) {
  const { before, after } = options
  if (isChapterTwoState(after)) {
    if (isChapterTwoSessionZero(before)) {
      return chapterTwo.createChapterTwoOpeningMessages({
        state: after,
        blockedRealNames: options.blockedRealNames,
        generateNarration: options.generateNarration,
      })
    }
    return chapterTwo.resolveChapterTwoTransitionMessages(options)
  }
  if (isChapterTwoSessionZero(before) || isChapterTwoSessionZero(after)) {
    return targetSessionTransitionMessages(after)
  }
  return chapterOne.resolveWeedGoblinsTransitionMessages(options)
}

export async function resolveWeedGoblinsTransitionWithStaticFallback(options = {}) {
  try {
    return await resolveWeedGoblinsTransitionMessages(options)
  } catch {
    if (isChapterTwoState(options.after)) {
      return chapterTwo.resolveChapterTwoTransitionWithStaticFallback(options)
    }
    if (isChapterTwoSessionZero(options.before) || isChapterTwoSessionZero(options.after)) {
      return targetSessionTransitionMessages(options.after)
    }
    return chapterOne.resolveWeedGoblinsTransitionWithStaticFallback(options)
  }
}
