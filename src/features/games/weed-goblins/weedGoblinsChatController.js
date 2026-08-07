import {
  advanceWeedGoblinsRun,
  createWeedGoblinsRun,
  getAvailableActions,
} from './weedGoblinsEngine.js'
import { generateNarrationFromHook } from './weedGoblinsAiComplication.js'
import {
  createInitialNarrationHook,
  getNarrationHooksForTransition,
} from './weedGoblinsNarrationHooks.js'

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
} = {}) {
  const clean = cleanText(text)
  if (!clean) return null
  return Object.freeze({
    direction: 'incoming',
    text: clean,
    die: resolvedDieValue(die),
    source,
  })
}

export function createOutgoingChoiceMessage(action) {
  if (!action?.id || !action?.label) throw new Error('A valid Weed Goblins choice is required.')
  return Object.freeze({
    direction: 'outgoing',
    text: cleanText(action.label),
    actionId: cleanText(action.id, 100),
    die: null,
    source: 'player-choice',
  })
}

export function getWeedGoblinsQuickReplies(state) {
  return getAvailableActions(state)
}

async function generatedMessageForHook({
  hook,
  state,
  blockedRealNames,
  generateNarration,
}) {
  const result = await generateNarration({
    hook,
    state,
    blockedRealNames,
  })
  return createIncomingChatMessage(result.text, {
    die: hook.selectedRoll,
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
  const available = getWeedGoblinsQuickReplies(state)
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

export async function resolveWeedGoblinsTransitionMessages({
  before,
  after,
  blockedRealNames = [],
  generateNarration = generateNarrationFromHook,
} = {}) {
  if (!before || !after) throw new Error('Both Weed Goblins transition states are required.')

  const hooks = getNarrationHooksForTransition(before, after)
  const narrationLines = after.narration.slice(before.narration.length)
  const messages = []
  let hookIndex = 0

  for (const line of narrationLines) {
    const hook = hooks[hookIndex]
    if (hook && cleanText(line, 300) === hook.fallbackText) {
      const generated = await generatedMessageForHook({
        hook,
        state: after,
        blockedRealNames,
        generateNarration,
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
