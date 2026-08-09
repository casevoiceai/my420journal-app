import {
  advanceWeedGoblinsFreeTextMidpointCheck,
  advanceWeedGoblinsRun,
  advanceWeedGoblinsSessionText,
  createWeedGoblinsRun,
  getAvailableActions,
  getWeedGoblinsActionCheckPreview,
  isWeedGoblinsSessionTextScene,
} from './weedGoblinsEngine.js'
import { generateNarrationFromHook } from './weedGoblinsAiComplication.js'
import {
  createSceneTransitionNarrationHook,
  getNarrationStoryContext,
  getNarrationHooksForTransition,
} from './weedGoblinsNarrationHooks.js'
import {
  buildPlayerActionResponseFallback,
  buildPlayerActionSetupFallback,
  interpretWeedGoblinsFreeText,
  isWeedGoblinsFreeTextScene,
} from './weedGoblinsFreeTextInterpreter.js'
import {
  composeWeedGoblinsContextualChoices,
  isWeedGoblinsSuggestedChoice,
} from './weedGoblinsChoices.js'

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

function checkInstructionText(preview) {
  if (!preview?.requiresRoll) return ''
  const statLabel = preview.stat === 'strength' ? 'Strength' : 'Defense'
  const diePhrase = preview.advantage ? 'on either die' : 'on the die'
  const advantageText = preview.advantage
    ? ` You're spending ${preview.manaCost} Mana, so roll with advantage.`
    : ''
  return `Out of the story for a second: this is a ${statLabel} check, DC ${preview.dc}. You're +${preview.statBonus}, so you need ${preview.requiredDie} or better ${diePhrase}.${advantageText} Roll the d20.`
}

function choiceIntentForSetup(state, action) {
  if (action.id === 'route:quiet') return 'cross Rattlebridge quietly without setting off the bottle-cap alarms'
  if (action.id === 'route:loud') return 'cross Rattlebridge directly before the alarm lines can react'
  if (action.id === 'goblin:strike') return `force your way past ${state.goblinName}`
  if (action.id === 'goblin:guard') return `hold your ground and outlast ${state.goblinName}`
  if (action.id === 'goblin:channel') return `confuse ${state.goblinName} with the magic available to you`
  if (action.id === 'midpoint:take-charm') return 'take the unattended highland charm without waking the bell'
  if (action.id === 'camp:expose-tribute') return 'use the picture tribute ledger to expose the tribute arrangement'
  if (action.id === 'camp:protect-tribute') return 'alter the picture tribute ledger to protect the tribute arrangement'
  if (action.id === 'camp:force-ledger') return 'pull the picture tribute ledger loose and take the evidence'
  if (action.id === 'latch:read-face') return 'read the carved faces and open the Stash Hall latch'
  if (action.id === 'latch:force') return 'force the carved-face Stash Hall latch open'
  if (action.id === 'latch:channel') return 'use Mana to read the carved-face Stash Hall latch'
  if (action.id === 'midpoint:read-runes') return 'read the old trail-runes at Cloudberry Shelf before moving on'
  if (action.id === 'boss:overpower') return `take ${state.stolenItem} back by overpowering the Goblin King`
  if (action.id === 'boss:outlast') return `outlast the Goblin King long enough to break his control of the room`
  if (action.id === 'boss:spell') return `use your Mana to turn the confrontation with the Goblin King`
  return `carry out ${action.label}`
}

function createChoiceCheckSetupMessage(state, action, preview) {
  const intent = choiceIntentForSetup(state, action)
  return createIncomingChatMessage(
    `You're trying to ${intent}. ${checkInstructionText(preview)}`,
    { source: 'engine-check-setup', kind: 'check-setup' },
  )
}

function appendCheckInstructions(setupMessage, preview) {
  const instructions = checkInstructionText(preview)
  if (!instructions) return setupMessage
  return createIncomingChatMessage(
    `${setupMessage?.text || ''} ${instructions}`,
    { source: setupMessage?.source || 'engine-check-setup', kind: 'check-setup' },
  )
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

export function createRollResultMessage(value, rolls = []) {
  const die = resolvedDieValue(value)
  if (die === null) throw new Error('A resolved D20 value is required.')
  const safeRolls = Array.isArray(rolls)
    ? rolls.map(resolvedDieValue).filter((roll) => roll !== null)
    : []
  return Object.freeze({
    direction: 'incoming',
    kind: 'roll-result',
    text: '',
    die,
    rolls: Object.freeze(safeRolls.length > 0 ? safeRolls : [die]),
    source: 'engine-roll',
  })
}

export function getWeedGoblinsQuickReplies(state) {
  return composeWeedGoblinsContextualChoices(state, getAvailableActions(state))
}

export { isWeedGoblinsFreeTextScene, isWeedGoblinsSessionTextScene }

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

function sessionZeroCharacterContext(state) {
  const name = cleanText(state?.playerName, 160)
  const race = cleanText(state?.playerRace, 80)
  const weapon = cleanText(state?.playerWeapon, 80)
  const pronoun = cleanText(state?.playerPronoun, 40) || 'unspecified'
  const look = cleanText(state?.playerLook, 160)
  if (!name && !race && !weapon && !look) return ''
  return cleanText(
    `Player character: name ${name || 'unspecified'}; kind ${race || 'unspecified'}; weapon ${weapon || 'unspecified'}; pronoun ${pronoun}; look ${look || 'unspecified'}. These are flavor only and do not change mechanics or outcomes.`,
    360,
  )
}

function storyContextWithCharacter(state, baseContext = getNarrationStoryContext(state)) {
  const characterContext = sessionZeroCharacterContext(state)
  if (!characterContext) return baseContext
  return {
    ...baseContext,
    storySoFar: cleanText(`${characterContext} ${baseContext.storySoFar || ''}`, 600),
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

function hookWithPlayerContext(hook, plan, state) {
  const hookWithCharacter = {
    ...hook,
    ...storyContextWithCharacter(state, hook),
  }
  if (!plan || hook.moment === 'goblin-king-taunt') {
    return Object.freeze(hookWithCharacter)
  }
  const fallbackText = contextualFallback(hook, plan)
  return Object.freeze({
    ...hookWithCharacter,
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
} = {}) {
  const state = createWeedGoblinsRun({
    seed,
    journalSnapshot,
    previousRuns,
    priorCompletedRunCount,
  })

  const messages = state.narration
    .map((line) => createIncomingChatMessage(line))
    .filter(Boolean)

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

export function prepareWeedGoblinsChoiceTurn({ state, action } = {}) {
  if (!state) throw new Error('A Weed Goblins run state is required.')
  const available = getAvailableActions(state)
  const selected = available.find((candidate) => candidate.id === action?.id)
  if (!selected) throw new Error(`Choice ${action?.id ?? '(missing)'} is not available.`)

  const before = state
  const checkPreview = getWeedGoblinsActionCheckPreview(state, selected.id)
  const outgoingMessage = createOutgoingChoiceMessage(selected)

  if (!checkPreview.requiresRoll) {
    return Object.freeze({
      before,
      after: advanceWeedGoblinsRun(state, selected.id),
      plan: null,
      checkPreview,
      requiresRoll: false,
      outgoingMessage,
      setupMessage: null,
      rollTriggerMessage: null,
    })
  }

  const intent = choiceIntentForSetup(state, selected)
  const plan = Object.freeze({
    kind: 'built-in-choice',
    style: checkPreview.manaCost > 0 ? 'mana' : checkPreview.stat,
    actionId: selected.id,
    playerAction: selected.label,
    narrationPlayerAction: selected.label,
    interpretedAction: intent,
    settingGuardrail: false,
    settingCategory: '',
    inputGuardrail: false,
    manaUnavailable: false,
  })

  return Object.freeze({
    before,
    plan,
    checkPreview,
    requiresRoll: true,
    outgoingMessage,
    setupMessage: createChoiceCheckSetupMessage(state, selected, checkPreview),
    rollTriggerMessage: createRollTriggerMessage(),
  })
}

export async function prepareWeedGoblinsQuickReplyTurn({
  state,
  action,
  blockedRealNames = [],
  generateNarration = generateNarrationFromHook,
} = {}) {
  if (isWeedGoblinsSuggestedChoice(action)) {
    return prepareWeedGoblinsFreeTextTurn({
      state,
      playerAction: action.playerAction,
      blockedRealNames,
      generateNarration,
    })
  }
  return prepareWeedGoblinsChoiceTurn({ state, action })
}

export function submitWeedGoblinsSessionText(state, value) {
  if (!isWeedGoblinsSessionTextScene(state)) {
    throw new Error(`Session text input is not available in scene ${state?.sceneId ?? '(missing)'}.`)
  }
  const text = cleanText(value, 160)
  const before = state
  const after = advanceWeedGoblinsSessionText(state, text)
  return {
    before,
    after,
    outgoingMessage: text ? createOutgoingTextMessage(text) : null,
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
    previousSceneId: cleanText(state.sceneId, 80),
    ...storyContextWithCharacter(state),
    narrationTier: cleanText(state.narrationTier, 50) || 'normal',
    allowCallback: false,
    allowFourthWall: false,
    requiresRoll: plan.style !== 'non-check',
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
    previousSceneId: cleanText(state.sceneId, 80),
    ...storyContextWithCharacter(state),
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
  const generatedSetupMessage = await generatedMessageForHook({
    hook,
    state,
    blockedRealNames,
    generateNarration,
    die: null,
  })
  const requiresRoll = plan.style !== 'non-check'
  const checkPreview = requiresRoll
    ? getWeedGoblinsActionCheckPreview(state, plan.actionId, plan.engineOptions || {})
    : null
  const setupMessage = requiresRoll
    ? appendCheckInstructions(generatedSetupMessage, checkPreview)
    : generatedSetupMessage

  return Object.freeze({
    before: state,
    plan,
    checkPreview,
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
  return advanceWeedGoblinsRun(before, plan.actionId, plan.engineOptions || {})
}

function resolvedCheckEvent(before, after) {
  return after.history
    .slice(before.history.length)
    .find((event) => event.type === 'check') || null
}

export function resolveWeedGoblinsPreparedMechanics({ preparedTurn } = {}) {
  if (!preparedTurn?.before || !preparedTurn?.plan) {
    throw new Error('A prepared Weed Goblins turn is required.')
  }
  const before = preparedTurn.before
  const after = advancePreparedPlan(before, preparedTurn.plan)
  const checkEvent = resolvedCheckEvent(before, after)
  return Object.freeze({
    before,
    after,
    checkEvent,
    rollResultMessage: checkEvent
      ? createRollResultMessage(checkEvent.roll, checkEvent.rolls)
      : null,
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

  const playerActionPlan = preparedTurn.plan.kind === 'built-in-choice'
    ? null
    : preparedTurn.plan

  if (mechanics.after.status === 'completed') {
    const endingHook = getNarrationHooksForTransition(mechanics.before, mechanics.after)
      .find((hook) => hook.moment === 'run-ending')
    if (!endingHook) return []
    const message = await generatedMessageForHook({
      hook: hookWithPlayerContext(endingHook, playerActionPlan, mechanics.after),
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
    playerActionPlan,
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
  const sessionZeroCompleted = before.flags?.sessionZeroComplete !== true
    && after.flags?.sessionZeroComplete === true
  const sessionZeroStillOpen = after.flags?.sessionZeroComplete !== true
  const transitionHook = sessionZeroStillOpen || sessionZeroCompleted
    ? null
    : createSceneTransitionNarrationHook(before, after)
  let transitionInserted = false

  async function insertTransitionMessage() {
    if (!transitionHook || transitionInserted) return
    const generated = await generatedMessageForHook({
      hook: transitionHook,
      state: after,
      blockedRealNames,
      generateNarration,
      die: null,
    })
    if (generated) messages.push(generated)
    transitionInserted = true
  }

  for (const line of narrationLines) {
    if (suppressManaAccounting && /^You spend \d+ Mana\./.test(line)) continue

    const rawHook = hooks[hookIndex]
    if (rawHook && cleanText(line, 300) === rawHook.fallbackText) {
      if (rawHook.moment === 'goblin-king-taunt') {
        await insertTransitionMessage()
      }
      const hook = hookWithPlayerContext(rawHook, playerActionPlan, after)
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

  await insertTransitionMessage()

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
