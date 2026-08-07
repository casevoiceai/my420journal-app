import {
  advanceWeedGoblinsFreeTextMidpointCheck,
  advanceWeedGoblinsRun,
  createWeedGoblinsRun,
  getAvailableActions,
} from './weedGoblinsEngine.js'
import { generateNarrationFromHook } from './weedGoblinsAiComplication.js'
import {
  createInitialNarrationHook,
  getNarrationHooksForTransition,
} from './weedGoblinsNarrationHooks.js'
import {
  buildPlayerActionResponseFallback,
  buildPlayerActionSetupFallback,
  interpretWeedGoblinsFreeText,
  isWeedGoblinsFreeTextScene,
} from './weedGoblinsFreeTextInterpreter.js'

function cleanText(value, maxLength = 500) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
    : ''
}

function resolvedDieValue(value) {
  const number = Number(value)
  return Number.isInteger(number) && number >= 1 && number <= 20 ? number : null
}

export function createIncomingChatMessage(text, {
  die = null,
  source = 'static',
  kind = 'message',
} = {}) {
  const clean = cleanText(text)
  if (!clean && kind !== 'roll-result') return null
  return Object.freeze({
    direction: 'incoming',
    kind,
    text: clean,
    die: resolvedDieValue(die),
    source,
  })
}

export function createOutgoingChoiceMessage(action) {
  if (!action?.id || !action?.label) throw new Error('A valid Weed Goblins choice is required.')
  return Object.freeze({
    direction: 'outgoing',
    kind: 'message',
    text: cleanText(action.label),
    actionId: cleanText(action.id, 100),
    die: null,
    source: 'player-choice',
  })
}

export function createOutgoingTextMessage(value) {
  const text = cleanText(value, 160)
  if (!text) throw new Error('A player action is required.')
  return Object.freeze({
    direction: 'outgoing',
    kind: 'message',
    text,
    actionId: 'free-text',
    die: null,
    source: 'player-text',
  })
}

export function createRollTriggerMessage() {
  return Object.freeze({
    direction: 'incoming',
    kind: 'roll-trigger',
    text: 'Roll d20',
    die: null,
    source: 'roll-trigger',
  })
}

export function createRollResultMessage(value) {
  const die = resolvedDieValue(value)
  if (die === null) throw new Error('A resolved D20 value is required.')
  return Object.freeze({
    direction: 'incoming',
    kind: 'roll-result',
    text: '',
    die,
    source: 'engine-roll',
  })
}

export function getWeedGoblinsQuickReplies(state) {
  return isWeedGoblinsFreeTextScene(state) ? [] : getAvailableActions(state)
}

export { isWeedGoblinsFreeTextScene }

function playerContextForPlan(plan) {
  return {
    playerAction: cleanText(plan?.playerAction, 160),
    narrationPlayerAction: cleanText(plan?.narrationPlayerAction, 160),
    interpretedAction: cleanText(plan?.interpretedAction, 200),
    settingGuardrail: plan?.settingGuardrail === true,
    settingCategory: cleanText(plan?.settingCategory, 80),
    inputGuardrail: plan?.inputGuardrail === true,
  }
}

function contextualFallback(hook, plan) {
  if (!plan) return hook.fallbackText
  const action = plan.narrationPlayerAction
    ? `"${plan.narrationPlayerAction}"`
    : plan.interpretedAction
  if (!action) return hook.fallbackText
  return cleanText(`I resolve ${action} through the scene: ${hook.fallbackText}`, 300)
}

function hookWithPlayerContext(hook, plan) {
  if (!plan || hook.moment === 'goblin-king-taunt') return hook
  const fallbackText = contextualFallback(hook, plan)
  return Object.freeze({
    ...hook,
    ...playerContextForPlan(plan),
    fallbackText,
    authoritativeText: fallbackText,
  })
}

async function generatedMessageForHook({
  hook,
  state,
  blockedRealNames,
  generateNarration,
  die = hook.selectedRoll,
}) {
  const result = await generateNarration({
    hook,
    event: hook.event,
    state,
    blockedRealNames,
  })
  return createIncomingChatMessage(result.text, {
    die,
    source: result.source,
  })
}

export async function createWeedGoblinsChatSession({
  seed = 'weed-goblins-chat-ui',
  journalSnapshot = {},
  previousRuns = [],
  priorCompletedRunCount = previousRuns.length,
  blockedRealNames = [],
  generateNarration = generateNarrationFromHook,
} = {}) {
  const state = createWeedGoblinsRun({
    seed,
    journalSnapshot,
    previousRuns,
    priorCompletedRunCount,
  })

  const messages = state.narration
    .slice(0, -1)
    .map((line) => createIncomingChatMessage(line))
    .filter(Boolean)

  const openingHook = createInitialNarrationHook(state)
  const openingMessage = await generatedMessageForHook({
    hook: openingHook,
    state,
    blockedRealNames,
    generateNarration,
  })
  if (openingMessage) messages.push(openingMessage)

  return {
    state,
    messages,
    choices: getWeedGoblinsQuickReplies(state),
  }
}

export function selectWeedGoblinsChatChoice(state, action) {
  if (!state) throw new Error('A Weed Goblins run state is required.')
  const available = getAvailableActions(state)
  const selected = available.find((candidate) => candidate.id === action?.id)
  if (!selected) throw new Error(`Choice ${action?.id ?? '(missing)'} is not available.`)

  const before = state
  const after = advanceWeedGoblinsRun(state, selected.id)
  return {
    before,
    after,
    outgoingMessage: createOutgoingChoiceMessage(selected),
  }
}

function attemptHookForPlan(state, plan) {
  const fallbackText = buildPlayerActionSetupFallback(plan)
  return Object.freeze({
    moment: 'player-action-attempt',
    outcome: 'attempt',
    fallbackText,
    authoritativeText: fallbackText,
    sceneId: cleanText(state.sceneId, 80),
    actionId: cleanText(plan.actionId || 'free-text:narrative', 80),
    stat: '',
    dc: 0,
    rolls: [],
    selectedRoll: null,
    troubleBefore: Number(state.trouble) || 0,
    troubleAfter: Number(state.trouble) || 0,
    fictionalStolenItem: cleanText(state.stolenItem, 160),
    fictionalGoblinName: cleanText(state.goblinName, 100),
    fictionalLocationName: cleanText(state.fictionalLocationName, 120),
    narrationTier: cleanText(state.narrationTier, 50) || 'normal',
    allowCallback: false,
    allowFourthWall: false,
    ...playerContextForPlan(plan),
  })
}

function responseHookForPlan(state, plan) {
  const fallbackText = buildPlayerActionResponseFallback(plan)
  return Object.freeze({
    moment: 'player-action-response',
    outcome: 'response',
    fallbackText,
    authoritativeText: fallbackText,
    sceneId: cleanText(state.sceneId, 80),
    actionId: 'free-text:narrative',
    stat: '',
    dc: 0,
    rolls: [],
    selectedRoll: null,
    troubleBefore: Number(state.trouble) || 0,
    troubleAfter: Number(state.trouble) || 0,
    fictionalStolenItem: cleanText(state.stolenItem, 160),
    fictionalGoblinName: cleanText(state.goblinName, 100),
    fictionalLocationName: cleanText(state.fictionalLocationName, 120),
    narrationTier: cleanText(state.narrationTier, 50) || 'normal',
    allowCallback: false,
    allowFourthWall: false,
    ...playerContextForPlan(plan),
  })
}

export async function prepareWeedGoblinsFreeTextTurn({
  state,
  playerAction,
  blockedRealNames = [],
  generateNarration = generateNarrationFromHook,
} = {}) {
  if (!isWeedGoblinsFreeTextScene(state)) {
    throw new Error(`Free-text input is not available in scene ${state?.sceneId ?? '(missing)'}.`)
  }

  const plan = interpretWeedGoblinsFreeText(state, playerAction, { blockedRealNames })
  if (plan.kind === 'empty') throw new Error('A player action is required.')

  const hook = attemptHookForPlan(state, plan)
  const setupMessage = await generatedMessageForHook({
    hook,
    state,
    blockedRealNames,
    generateNarration,
    die: null,
  })
  const requiresRoll = plan.style !== 'non-check'

  return Object.freeze({
    before: state,
    plan,
    requiresRoll,
    outgoingMessage: createOutgoingTextMessage(plan.playerAction),
    setupMessage,
    rollTriggerMessage: requiresRoll ? createRollTriggerMessage() : null,
  })
}

function advancePreparedPlan(before, plan) {
  if (plan.kind === 'narrative-only') return before
  if (plan.kind === 'midpoint-check') {
    return advanceWeedGoblinsFreeTextMidpointCheck(before, plan.style)
  }
  if (!plan.actionId) throw new Error('The interpreted player action has no engine path.')
  return advanceWeedGoblinsRun(before, plan.actionId)
}

function resolvedCheckEvent(before, after) {
  return after.history
    .slice(before.history.length)
    .find((event) => event.type === 'check') || null
}

export function resolveWeedGoblinsPreparedMechanics({ preparedTurn } = {}) {
  if (!preparedTurn?.before || !preparedTurn?.plan) {
    throw new Error('A prepared Weed Goblins free-text turn is required.')
  }
  const before = preparedTurn.before
  const after = advancePreparedPlan(before, preparedTurn.plan)
  const checkEvent = resolvedCheckEvent(before, after)
  return Object.freeze({
    before,
    after,
    checkEvent,
    rollResultMessage: checkEvent ? createRollResultMessage(checkEvent.roll) : null,
  })
}

export async function narrateWeedGoblinsResolvedTurn({
  preparedTurn,
  mechanics,
  blockedRealNames = [],
  generateNarration = generateNarrationFromHook,
} = {}) {
  if (!preparedTurn?.plan || !mechanics?.before || !mechanics?.after) {
    throw new Error('Prepared turn and resolved mechanics are required.')
  }

  if (preparedTurn.plan.kind === 'narrative-only') {
    const message = await generatedMessageForHook({
      hook: responseHookForPlan(mechanics.after, preparedTurn.plan),
      state: mechanics.after,
      blockedRealNames,
      generateNarration,
      die: null,
    })
    return message ? [message] : []
  }

  if (mechanics.after.status === 'completed') {
    const endingHook = getNarrationHooksForTransition(mechanics.before, mechanics.after)
      .find((hook) => hook.moment === 'run-ending')
    if (!endingHook) return []
    const message = await generatedMessageForHook({
      hook: hookWithPlayerContext(endingHook, preparedTurn.plan),
      state: mechanics.after,
      blockedRealNames,
      generateNarration,
      die: null,
    })
    return message ? [message] : []
  }

  return resolveWeedGoblinsTransitionMessages({
    before: mechanics.before,
    after: mechanics.after,
    blockedRealNames,
    generateNarration,
    playerActionPlan: preparedTurn.plan,
    suppressDice: true,
    suppressManaAccounting: true,
  })
}

export async function resolveWeedGoblinsPreparedTurn({
  preparedTurn,
  blockedRealNames = [],
  generateNarration = generateNarrationFromHook,
} = {}) {
  const mechanics = resolveWeedGoblinsPreparedMechanics({ preparedTurn })
  const outcomeMessages = await narrateWeedGoblinsResolvedTurn({
    preparedTurn,
    mechanics,
    blockedRealNames,
    generateNarration,
  })
  return {
    ...mechanics,
    outcomeMessages,
  }
}

export async function resolveWeedGoblinsTransitionMessages({
  before,
  after,
  blockedRealNames = [],
  generateNarration = generateNarrationFromHook,
  playerActionPlan = null,
  suppressDice = false,
  suppressManaAccounting = false,
} = {}) {
  if (!before || !after) throw new Error('Both Weed Goblins transition states are required.')

  const hooks = getNarrationHooksForTransition(before, after)
  const narrationLines = after.narration.slice(before.narration.length)
  const messages = []
  let hookIndex = 0

  for (const line of narrationLines) {
    if (suppressManaAccounting && /^You spend \d+ Mana\./.test(line)) continue

    const rawHook = hooks[hookIndex]
    if (rawHook && cleanText(line, 300) === rawHook.fallbackText) {
      const hook = hookWithPlayerContext(rawHook, playerActionPlan)
      const generated = await generatedMessageForHook({
        hook,
        state: after,
        blockedRealNames,
        generateNarration,
        die: suppressDice ? null : hook.selectedRoll,
      })
      if (generated) messages.push(generated)
      hookIndex += 1
      continue
    }

    const staticMessage = createIncomingChatMessage(line)
    if (staticMessage) messages.push(staticMessage)
  }

  return messages
}

export async function resolveWeedGoblinsTransitionWithStaticFallback(options = {}) {
  try {
    return await resolveWeedGoblinsTransitionMessages(options)
  } catch {
    return resolveWeedGoblinsTransitionMessages({
      ...options,
      generateNarration: async ({ hook }) => ({
        text: hook.fallbackText,
        source: 'static-fallback',
      }),
    })
  }
}
