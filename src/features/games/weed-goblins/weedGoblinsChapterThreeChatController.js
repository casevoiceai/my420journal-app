import {
  createIncomingChatMessage,
  createOutgoingChoiceMessage,
  createOutgoingTextMessage,
  createRollResultMessage,
  createRollTriggerMessage,
} from './weedGoblinsChatControllerChapterOne.js'
import {
  CHAPTER_THREE_SCENES,
  advanceChapterThreeFreeTextPlan,
  advanceChapterThreeRun,
  chapterThreeDangerTierForState,
  getChapterThreeActionCheckPreview,
  getChapterThreeAvailableActions,
  getChapterThreePlanCheckPreview,
  interpretChapterThreeFreeText,
  isChapterThreeFreeTextScene,
} from './weedGoblinsChapterThreeRuntime.js'
import { generateChapterThreeNarration } from './weedGoblinsChapterThreeNarration.js'

function cleanText(value, maxLength = 500) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
    : ''
}

function checkInstructionText(preview) {
  if (!preview?.requiresRoll) return ''
  const statLabel = preview.stat === 'strength' ? 'Strength' : 'Defense'
  const diePhrase = preview.advantage ? 'on either die' : 'on the die'
  const advantageText = preview.advantage
    ? `You're spending ${preview.manaCost} Mana, so you roll with advantage. `
    : ''
  const tierText = preview.dangerTier
    ? `${preview.dangerTier.charAt(0).toUpperCase()}${preview.dangerTier.slice(1)} danger. `
    : ''
  return `${tierText}${advantageText}This is DC ${preview.dc}. Your ${statLabel} is +${preview.statBonus}, so you need ${preview.requiredDie} or better ${diePhrase}. Roll it.`
}

function createCheckSetupMessage(action, preview) {
  return createIncomingChatMessage(
    `You're trying to ${action.label.toLowerCase()}. ${checkInstructionText(preview)}`,
    { source: 'engine-check-setup', kind: 'check-setup' },
  )
}

function narrationDelta(before, after) {
  const beforeCount = Array.isArray(before?.narration) ? before.narration.length : 0
  const afterNarration = Array.isArray(after?.narration) ? after.narration : []
  return afterNarration.slice(beforeCount).map((line) => cleanText(line, 600)).filter(Boolean)
}

function latestCheckEvent(before, after) {
  const beforeCount = Array.isArray(before?.history) ? before.history.length : 0
  return (after?.history || [])
    .slice(beforeCount)
    .find((event) => event?.type === 'check') || null
}

function sceneChoiceContext(state) {
  return getChapterThreeAvailableActions(state)
    .map((choice) => choice.label)
    .slice(0, 5)
    .join('; ')
}

function storySoFar(state) {
  const chapter = state?.chapterThree || {}
  const rewards = Array.isArray(state?.inventory) ? state.inventory.join(', ') : ''
  return cleanText(
    `Withered Grove state: room ${state?.currentRoomId || 'unknown'}; false cure ${chapter.falseCureKnown ? 'known' : 'not yet proven'}; Kip warning ${chapter.kipWarningHeeded ? 'heeded' : 'not heeded'}; memory rings ${chapter.memoryRingsSolved ? 'solved' : 'unsolved'}; water stones ${chapter.waterStonesBalanced ? 'balanced' : 'unbalanced'}; Stalker blind spot ${chapter.stalkerBlindSpotKnown ? 'known' : 'unknown'}; nursery ${chapter.nurseryOutcome || 'not yet resolved'}; Nightly Draw ${chapter.nightlyDrawOutcome || 'not yet resolved'}; grove ${chapter.groveState || 'withering'}; rewards ${rewards || 'none'}; wound ${state?.wound || 'None'}; Trouble ${Number(state?.trouble) || 0}.`,
    600,
  )
}

function tensionLevel(state) {
  if (state?.sceneId === CHAPTER_THREE_SCENES.nightlyDraw) return 'peak'
  if (state?.sceneId === CHAPTER_THREE_SCENES.groveDecision) return 'decision'
  if ([CHAPTER_THREE_SCENES.stalkerTrail, CHAPTER_THREE_SCENES.sleepingNursery, CHAPTER_THREE_SCENES.siphonWell].includes(state?.sceneId)) return 'high'
  return 'rising'
}

function makeHook(state, {
  moment,
  outcome,
  actionId = '',
  fallbackText = '',
  playerAction = '',
  interpretedAction = '',
  requiresRoll = false,
  checkEvent = null,
  previousSceneId = '',
} = {}) {
  const dangerTier = checkEvent?.dangerTier || chapterThreeDangerTierForState(state)?.id || ''
  return Object.freeze({
    moment,
    outcome,
    sceneId: state?.sceneId || '',
    previousSceneId,
    actionId,
    dangerTier,
    fallbackText: cleanText(fallbackText, 300),
    authoritativeText: cleanText(fallbackText, 300),
    storySoFar: storySoFar(state),
    choiceContext: sceneChoiceContext(state),
    scenePurpose: 'Advance the Withered Grove ecological consequence chapter while preserving the deterministic engine result and player agency.',
    tensionLevel: tensionLevel(state),
    playerAction: cleanText(playerAction, 160),
    interpretedAction: cleanText(interpretedAction, 200),
    requiresRoll,
    roll: checkEvent?.roll ?? null,
    rolls: Array.isArray(checkEvent?.rolls) ? checkEvent.rolls : [],
    success: checkEvent?.success === true,
    naturalOne: checkEvent?.naturalOne === true,
  })
}

async function generatedMessage({
  hook,
  state,
  blockedRealNames = [],
  generateNarration = generateChapterThreeNarration,
}) {
  const result = await generateNarration({ hook, state, blockedRealNames })
  return createIncomingChatMessage(result.text, { source: result.source })
}

export function getChapterThreeQuickReplies(state) {
  return getChapterThreeAvailableActions(state)
}

export function isChapterThreeSessionTextScene() {
  return false
}

export { isChapterThreeFreeTextScene }

export function selectChapterThreeChatChoice(state, action) {
  const selected = getChapterThreeAvailableActions(state).find((candidate) => candidate.id === action?.id)
  if (!selected) throw new Error(`Choice ${action?.id ?? '(missing)'} is not available.`)
  return {
    before: state,
    after: advanceChapterThreeRun(state, selected.id),
    outgoingMessage: createOutgoingChoiceMessage(selected),
  }
}

export function prepareChapterThreeChoiceTurn({ state, action } = {}) {
  const selected = getChapterThreeAvailableActions(state).find((candidate) => candidate.id === action?.id)
  if (!selected) throw new Error(`Choice ${action?.id ?? '(missing)'} is not available.`)
  const preview = getChapterThreeActionCheckPreview(state, selected.id)
  const outgoingMessage = createOutgoingChoiceMessage(selected)
  if (!preview.requiresRoll) {
    return Object.freeze({
      before: state,
      after: advanceChapterThreeRun(state, selected.id),
      plan: null,
      checkPreview: preview,
      requiresRoll: false,
      outgoingMessage,
      setupMessage: null,
      rollTriggerMessage: null,
    })
  }
  const plan = Object.freeze({
    kind: 'built-in-choice',
    actionId: selected.id,
    playerAction: selected.label,
    narrationPlayerAction: selected.label,
    interpretedAction: selected.detail || selected.label,
    style: preview.manaCost > 0 ? 'mana' : preview.stat,
    check: selected.check,
  })
  return Object.freeze({
    before: state,
    plan,
    checkPreview: preview,
    requiresRoll: true,
    outgoingMessage,
    setupMessage: createCheckSetupMessage(selected, preview),
    rollTriggerMessage: createRollTriggerMessage(),
  })
}

export async function prepareChapterThreeQuickReplyTurn({ state, action } = {}) {
  return prepareChapterThreeChoiceTurn({ state, action })
}

export async function prepareChapterThreeFreeTextTurn({
  state,
  playerAction,
  blockedRealNames = [],
  generateNarration = generateChapterThreeNarration,
} = {}) {
  if (!isChapterThreeFreeTextScene(state)) {
    throw new Error(`Free text is not available in scene ${state?.sceneId ?? '(missing)'}.`)
  }
  const plan = interpretChapterThreeFreeText(state, playerAction)
  const preview = plan.kind === 'mapped-action'
    ? getChapterThreeActionCheckPreview(state, plan.actionId)
    : getChapterThreePlanCheckPreview(state, plan)
  const outgoingMessage = createOutgoingTextMessage(playerAction)

  if (!preview.requiresRoll) {
    const after = advanceChapterThreeFreeTextPlan(state, plan)
    const fallbackText = narrationDelta(state, after).at(-1)
      || `You ${cleanText(plan.interpretedAction, 180)}. The grove reacts without requiring a roll or granting an automatic outcome.`
    const hook = makeHook(after, {
      moment: 'player-action-response',
      outcome: 'response',
      actionId: plan.actionId || 'custom:narrative',
      fallbackText,
      playerAction,
      interpretedAction: plan.interpretedAction,
      requiresRoll: false,
      previousSceneId: state.sceneId,
    })
    const response = await generatedMessage({ hook, state: after, blockedRealNames, generateNarration })
    return Object.freeze({
      before: state,
      after,
      plan,
      checkPreview: preview,
      requiresRoll: false,
      outgoingMessage,
      setupMessage: response,
      rollTriggerMessage: null,
      responseMessage: response,
    })
  }

  const setupFallback = `You try to ${cleanText(plan.interpretedAction, 180)}. ${checkInstructionText(preview)}`
  const hook = makeHook(state, {
    moment: 'player-action-attempt',
    outcome: 'attempt',
    actionId: plan.actionId || 'custom:check',
    fallbackText: setupFallback,
    playerAction,
    interpretedAction: plan.interpretedAction,
    requiresRoll: true,
  })
  const generated = await generatedMessage({ hook, state, blockedRealNames, generateNarration })
  const setupMessage = createIncomingChatMessage(
    `${generated?.text || setupFallback} ${checkInstructionText(preview)}`,
    { source: generated?.source || 'static-fallback', kind: 'check-setup' },
  )

  return Object.freeze({
    before: state,
    plan,
    checkPreview: preview,
    requiresRoll: true,
    outgoingMessage,
    setupMessage,
    rollTriggerMessage: createRollTriggerMessage(),
  })
}

export function resolveChapterThreePreparedMechanics({ preparedTurn } = {}) {
  if (!preparedTurn?.before || !preparedTurn?.plan) throw new Error('A prepared Weed Goblins turn is required.')
  const before = preparedTurn.before
  const after = preparedTurn.plan.kind === 'built-in-choice'
    ? advanceChapterThreeRun(before, preparedTurn.plan.actionId)
    : advanceChapterThreeFreeTextPlan(before, preparedTurn.plan)
  const checkEvent = latestCheckEvent(before, after)
  return Object.freeze({
    before,
    after,
    plan: preparedTurn.plan,
    checkPreview: preparedTurn.checkPreview,
    checkEvent,
    rollResultMessage: checkEvent ? createRollResultMessage(checkEvent.roll, checkEvent.rolls) : null,
  })
}

export async function narrateChapterThreeResolvedTurn({
  preparedTurn,
  mechanics,
  blockedRealNames = [],
  generateNarration = generateChapterThreeNarration,
} = {}) {
  if (!preparedTurn?.before || !mechanics?.after) throw new Error('Resolved Chapter 3 mechanics are required.')
  const after = mechanics.after
  const checkEvent = mechanics.checkEvent
  const fallbackText = narrationDelta(preparedTurn.before, after).at(-1)
    || (checkEvent?.success ? 'Your move works.' : 'The move fails forward and the grove changes around it.')
  const moment = after.status === 'completed'
    ? 'chapter-ending'
    : checkEvent?.naturalOne
      ? 'natural-one-complication'
      : checkEvent?.success
        ? 'action-success'
        : 'ordinary-failure'
  const outcome = after.status === 'completed'
    ? after.ending || 'completed'
    : checkEvent?.naturalOne
      ? 'complication'
      : checkEvent?.success
        ? 'success'
        : 'failure'
  const hook = makeHook(after, {
    moment,
    outcome,
    actionId: preparedTurn.plan.actionId || 'custom:check',
    fallbackText,
    playerAction: preparedTurn.plan.narrationPlayerAction || preparedTurn.plan.playerAction,
    interpretedAction: preparedTurn.plan.interpretedAction,
    requiresRoll: true,
    checkEvent,
    previousSceneId: preparedTurn.before.sceneId,
  })
  const message = await generatedMessage({ hook, state: after, blockedRealNames, generateNarration })
  return message ? [message] : []
}

export async function resolveChapterThreePreparedTurn({
  preparedTurn,
  blockedRealNames = [],
  generateNarration = generateChapterThreeNarration,
} = {}) {
  if (!preparedTurn?.requiresRoll) {
    return {
      before: preparedTurn?.before,
      after: preparedTurn?.after || preparedTurn?.before,
      plan: preparedTurn?.plan || null,
      checkPreview: preparedTurn?.checkPreview || null,
      checkEvent: null,
      rollResultMessage: null,
      outcomeMessages: preparedTurn?.responseMessage ? [preparedTurn.responseMessage] : [],
    }
  }
  const mechanics = resolveChapterThreePreparedMechanics({ preparedTurn })
  const outcomeMessages = await narrateChapterThreeResolvedTurn({
    preparedTurn,
    mechanics,
    blockedRealNames,
    generateNarration,
  })
  return { ...mechanics, outcomeMessages }
}

export async function resolveChapterThreeTransitionMessages({
  before,
  after,
  blockedRealNames = [],
  generateNarration = generateChapterThreeNarration,
} = {}) {
  if (!before || !after) return []
  const lines = narrationDelta(before, after)
  if (lines.length === 0) return []
  const messages = lines.slice(0, -1).map((line) => createIncomingChatMessage(line)).filter(Boolean)
  const fallbackText = lines.at(-1)
  const hook = makeHook(after, {
    moment: after.status === 'completed' ? 'chapter-ending' : 'scene-intro',
    outcome: after.status === 'completed' ? after.ending || 'completed' : 'intro',
    actionId: after.history?.at(-1)?.actionId || '',
    fallbackText,
    requiresRoll: false,
    previousSceneId: before.sceneId,
  })
  const generated = await generatedMessage({ hook, state: after, blockedRealNames, generateNarration })
  if (generated) messages.push(generated)
  return messages
}

export async function resolveChapterThreeTransitionWithStaticFallback(options = {}) {
  try {
    return await resolveChapterThreeTransitionMessages(options)
  } catch {
    const lines = narrationDelta(options.before, options.after)
    return lines.map((line) => createIncomingChatMessage(line, { source: 'static-fallback' })).filter(Boolean)
  }
}

export async function createChapterThreeOpeningMessages({
  state,
  blockedRealNames = [],
  generateNarration = generateChapterThreeNarration,
} = {}) {
  if (!state || state.chapterNumber !== 3) return []
  const fallbackText = state.narration?.at(-1)
    || 'The Gray Verge begins where the color stops. Full daylight and running water have not kept the grove from turning gray from the roots up.'
  const hook = makeHook(state, {
    moment: 'scene-intro',
    outcome: 'intro',
    actionId: 'chapter-three:start',
    fallbackText,
    requiresRoll: false,
  })
  const generated = await generatedMessage({ hook, state, blockedRealNames, generateNarration })
  return generated ? [generated] : [createIncomingChatMessage(fallbackText)]
}
