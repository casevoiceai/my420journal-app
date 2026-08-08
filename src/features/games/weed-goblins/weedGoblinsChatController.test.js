import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createWeedGoblinsChatSession,
  getWeedGoblinsQuickReplies,
  narrateWeedGoblinsResolvedTurn,
  prepareWeedGoblinsFreeTextTurn,
  resolveWeedGoblinsPreparedMechanics,
  resolveWeedGoblinsPreparedTurn,
  resolveWeedGoblinsTransitionMessages,
  selectWeedGoblinsChatChoice,
} from './weedGoblinsChatController.js'

function generatedNarration(calls = []) {
  return async ({ hook, event }) => {
    calls.push({
      moment: hook.moment,
      outcome: hook.outcome,
      event,
      playerAction: hook.playerAction || '',
      narrationPlayerAction: hook.narrationPlayerAction || '',
      settingGuardrail: hook.settingGuardrail === true,
      introKind: hook.introKind || '',
      openingObjective: hook.openingObjective || '',
      storySoFar: hook.storySoFar || '',
      choiceContext: hook.choiceContext || '',
      scenePurpose: hook.scenePurpose || '',
      tensionLevel: hook.tensionLevel || '',
      requiresRoll: hook.requiresRoll === true,
    })
    return {
      text: hook.fallbackText,
      source: 'ai',
    }
  }
}

test('opens with scene, premise, and visible stakes before exposing background choices', async () => {
  const calls = []
  const session = await createWeedGoblinsChatSession({
    seed: 'opening-structure',
    generateNarration: generatedNarration(calls),
  })

  assert.deepEqual(calls.slice(-3).map((call) => [call.moment, call.introKind]), [
    ['scene-intro', 'highlands-opening'],
    ['premise-statement', 'premise-statement'],
    ['scene-intro', 'choice-presentation'],
  ])
  assert.match(session.messages.at(-2).text, /Goblin King stole .+ from you/)
  assert.match(session.messages.at(-2).text, /get it back/)
  assert.match(session.messages.at(-1).text, /scarred trailhead table/)
  assert.equal(session.choices.length, 3)
  assert.equal(calls.at(-1).tensionLevel, 'opening')
})

test('adds a scene-transition beat with visible next-choice stakes after an outcome', async () => {
  const calls = []
  const generateNarration = generatedNarration(calls)
  const session = await createWeedGoblinsChatSession({
    seed: 'transition-structure',
    generateNarration,
  })
  const background = session.choices.find((choice) => choice.id === 'background:hauler')
  const transition = selectWeedGoblinsChatChoice(session.state, background)
  const messages = await resolveWeedGoblinsTransitionMessages({
    before: transition.before,
    after: transition.after,
    generateNarration,
  })

  assert.equal(messages.length, 2)
  assert.match(messages[0].text, /Highlands Hauler/)
  assert.match(messages[1].text, /split marker/)
  const sceneCall = calls.at(-1)
  assert.equal(sceneCall.introKind, 'scene-transition')
  assert.match(sceneCall.storySoFar, /Highlands Hauler/)
  assert.match(sceneCall.choiceContext, /Direct Ridge/)
  assert.equal(sceneCall.tensionLevel, 'commitment')
})

async function stateAtGoblin(generateNarration = generatedNarration()) {
  const session = await createWeedGoblinsChatSession({
    seed: 'recovery-1',
    generateNarration,
  })
  const background = session.choices.find((choice) => choice.id === 'background:hauler')
  const backgroundTransition = selectWeedGoblinsChatChoice(session.state, background)
  const route = getWeedGoblinsQuickReplies(backgroundTransition.after)
    .find((choice) => choice.id === 'route:ridge')
  const routeTransition = selectWeedGoblinsChatChoice(backgroundTransition.after, route)
  return routeTransition.after
}

test('free-text submit stages outgoing, setup, and roll trigger without advancing the engine', async () => {
  const calls = []
  const state = await stateAtGoblin(generatedNarration(calls))
  const historyLength = state.history.length
  const rngState = state.rngState

  const prepared = await prepareWeedGoblinsFreeTextTurn({
    state,
    playerAction: 'I shove the goblin into the paperwork cart',
    generateNarration: generatedNarration(calls),
  })

  assert.equal(prepared.plan.style, 'strength')
  assert.equal(prepared.plan.actionId, 'goblin:strike')
  assert.equal(prepared.requiresRoll, true)
  assert.equal(prepared.outgoingMessage.direction, 'outgoing')
  assert.equal(prepared.outgoingMessage.text, 'I shove the goblin into the paperwork cart')
  assert.equal(prepared.setupMessage.direction, 'incoming')
  assert.equal(prepared.setupMessage.die, null)
  assert.equal(prepared.rollTriggerMessage.kind, 'roll-trigger')
  assert.equal(prepared.before.history.length, historyLength)
  assert.equal(prepared.before.rngState, rngState)
  assert.equal(calls.some((call) => call.moment === 'player-action-attempt'), true)
  assert.equal(calls.find((call) => call.moment === 'player-action-attempt').requiresRoll, true)
})

test('roll tap resolves mechanics before outcome narration and produces the five bubble sequence', async () => {
  const calls = []
  const generateNarration = generatedNarration(calls)
  const state = await stateAtGoblin(generateNarration)
  const prepared = await prepareWeedGoblinsFreeTextTurn({
    state,
    playerAction: 'I shove the goblin into the paperwork cart',
    generateNarration,
  })
  const callsBeforeRoll = calls.length

  const mechanics = resolveWeedGoblinsPreparedMechanics({ preparedTurn: prepared })
  const checkEvent = mechanics.after.history
    .slice(state.history.length)
    .find((event) => event.type === 'check')

  assert.ok(checkEvent)
  assert.equal(calls.length, callsBeforeRoll)
  assert.equal(mechanics.rollResultMessage.kind, 'roll-result')
  assert.equal(mechanics.rollResultMessage.die, checkEvent.roll)
  assert.equal(mechanics.rollResultMessage.text, '')

  const outcomeMessages = await narrateWeedGoblinsResolvedTurn({
    preparedTurn: prepared,
    mechanics,
    generateNarration,
  })
  assert.equal(outcomeMessages.length >= 1, true)
  assert.equal(outcomeMessages[0].die, null)
  assert.equal(calls.length > callsBeforeRoll, true)

  const turn = [
    prepared.outgoingMessage,
    prepared.setupMessage,
    prepared.rollTriggerMessage,
    mechanics.rollResultMessage,
    outcomeMessages[0],
  ]
  assert.deepEqual(turn.map((message) => message.kind), [
    'message',
    'message',
    'roll-trigger',
    'roll-result',
    'message',
  ])
})

test('free-text scenes keep every engine action available as a real game control', async () => {
  const state = await stateAtGoblin()
  assert.deepEqual(
    getWeedGoblinsQuickReplies(state).map((action) => action.id),
    ['goblin:strike', 'goblin:guard', 'goblin:channel'],
  )
})

test('a built-in action in a free-text scene resolves and advances the adventure', async () => {
  const state = await stateAtGoblin()
  const strike = getWeedGoblinsQuickReplies(state)
    .find((action) => action.id === 'goblin:strike')
  const transition = selectWeedGoblinsChatChoice(state, strike)
  const messages = await resolveWeedGoblinsTransitionMessages({
    before: transition.before,
    after: transition.after,
    generateNarration: generatedNarration(),
  })

  assert.equal(transition.outgoingMessage.text, strike.label)
  assert.equal(transition.after.sceneId, 'midpoint')
  assert.equal(messages.length > 0, true)
  assert.equal(getWeedGoblinsQuickReplies(transition.after).length >= 3, true)
})

test('simple narrative beat stays in the same scene and consumes no roll', async () => {
  const state = await stateAtGoblin()
  const prepared = await prepareWeedGoblinsFreeTextTurn({
    state,
    playerAction: 'I wave at the goblin and say hello',
    generateNarration: generatedNarration(),
  })

  assert.equal(prepared.requiresRoll, false)
  assert.equal(prepared.rollTriggerMessage, null)

  const resolved = await resolveWeedGoblinsPreparedTurn({
    preparedTurn: prepared,
    generateNarration: generatedNarration(),
  })
  assert.equal(resolved.after, state)
  assert.equal(resolved.rollResultMessage, null)
  assert.equal(resolved.outcomeMessages.length, 1)
  assert.equal(resolved.outcomeMessages[0].die, null)
})

test('non-check midpoint action proceeds without a roll step and still enters the Goblin King scene', async () => {
  const goblin = await stateAtGoblin()
  const goblinPrepared = await prepareWeedGoblinsFreeTextTurn({
    state: goblin,
    playerAction: 'I shove the goblin aside',
    generateNarration: generatedNarration(),
  })
  const goblinResolved = await resolveWeedGoblinsPreparedTurn({
    preparedTurn: goblinPrepared,
    generateNarration: generatedNarration(),
  })
  assert.equal(goblinResolved.after.sceneId, 'midpoint')

  const midpointPrepared = await prepareWeedGoblinsFreeTextTurn({
    state: goblinResolved.after,
    playerAction: 'I help the clerk gather the scattered forms',
    generateNarration: generatedNarration(),
  })
  assert.equal(midpointPrepared.requiresRoll, false)
  assert.equal(midpointPrepared.rollTriggerMessage, null)

  const midpointResolved = await resolveWeedGoblinsPreparedTurn({
    preparedTurn: midpointPrepared,
    generateNarration: generatedNarration(),
  })
  assert.equal(midpointResolved.rollResultMessage, null)
  assert.equal(midpointResolved.after.sceneId, 'goblin-king')
  assert.equal(midpointResolved.after.flags.goblinAlly, true)
  assert.equal(midpointResolved.outcomeMessages.some((message) => /Goblin King/i.test(message.text)), true)
})

test('completed boss free-text check shows one final authoritative outcome bubble after the die', async () => {
  const calls = []
  const generateNarration = generatedNarration(calls)
  let state = await stateAtGoblin(generateNarration)

  let prepared = await prepareWeedGoblinsFreeTextTurn({
    state,
    playerAction: 'I shove the goblin aside',
    generateNarration,
  })
  let resolved = await resolveWeedGoblinsPreparedTurn({ preparedTurn: prepared, generateNarration })
  state = resolved.after

  prepared = await prepareWeedGoblinsFreeTextTurn({
    state,
    playerAction: 'I keep moving',
    generateNarration,
  })
  resolved = await resolveWeedGoblinsPreparedTurn({ preparedTurn: prepared, generateNarration })
  state = resolved.after
  assert.equal(state.sceneId, 'goblin-king')

  prepared = await prepareWeedGoblinsFreeTextTurn({
    state,
    playerAction: 'I overpower the Goblin King with a hard shove',
    generateNarration,
  })
  resolved = await resolveWeedGoblinsPreparedTurn({ preparedTurn: prepared, generateNarration })

  assert.equal(resolved.after.status, 'completed')
  assert.equal(resolved.after.ending, 'recovery')
  assert.ok(resolved.rollResultMessage)
  assert.equal(resolved.outcomeMessages.length, 1)
  assert.equal(calls.some((call) => call.moment === 'run-ending'), true)
})

test('fixed route checks retain their existing attached die behavior', async () => {
  const calls = []
  const session = await createWeedGoblinsChatSession({
    seed: 'scan-28',
    generateNarration: generatedNarration(calls),
  })
  const background = session.choices.find((choice) => choice.id === 'background:hauler')
  const backgroundTransition = selectWeedGoblinsChatChoice(session.state, background)
  const route = getWeedGoblinsQuickReplies(backgroundTransition.after)
    .find((choice) => choice.id === 'route:ridge')
  const routeTransition = selectWeedGoblinsChatChoice(backgroundTransition.after, route)

  const incoming = await resolveWeedGoblinsTransitionMessages({
    before: routeTransition.before,
    after: routeTransition.after,
    generateNarration: generatedNarration(calls),
  })

  assert.equal(incoming.some((message) => message.die === 1), true)
  const checkEvent = routeTransition.after.history
    .slice(routeTransition.before.history.length)
    .find((event) => event.type === 'check')
  const complicationCall = calls.find((call) => call.moment === 'natural-one-complication')
  assert.equal(complicationCall.event, checkEvent)
})

test('passes the original ordinary-failure event into narration generation', async () => {
  const calls = []
  const generateNarration = generatedNarration(calls)
  const session = await createWeedGoblinsChatSession({
    seed: 'recovery-1',
    generateNarration,
  })
  const background = session.choices.find((choice) => choice.id === 'background:hauler')
  const backgroundTransition = selectWeedGoblinsChatChoice(session.state, background)
  const route = getWeedGoblinsQuickReplies(backgroundTransition.after)
    .find((choice) => choice.id === 'route:ridge')
  const routeTransition = selectWeedGoblinsChatChoice(backgroundTransition.after, route)

  await resolveWeedGoblinsTransitionMessages({
    before: routeTransition.before,
    after: routeTransition.after,
    generateNarration,
  })

  const checkEvent = routeTransition.after.history
    .slice(routeTransition.before.history.length)
    .find((event) => event.type === 'check')
  const failureCall = calls.find((call) => call.moment === 'ordinary-failure')
  assert.equal(checkEvent.outcome, 'failure')
  assert.equal(failureCall.event, checkEvent)
})
