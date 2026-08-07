import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createWeedGoblinsChatSession,
  getWeedGoblinsQuickReplies,
  prepareWeedGoblinsFreeTextTurn,
  resolveWeedGoblinsPreparedTurn,
  resolveWeedGoblinsTransitionMessages,
  selectWeedGoblinsChatChoice,
} from './weedGoblinsChatController.js'

function generatedNarration(calls = []) {
  return async ({ hook }) => {
    calls.push({
      moment: hook.moment,
      outcome: hook.outcome,
      playerAction: hook.playerAction || '',
      narrationPlayerAction: hook.narrationPlayerAction || '',
      settingGuardrail: hook.settingGuardrail === true,
    })
    return {
      text: hook.fallbackText,
      source: 'ai',
    }
  }
}

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
})

test('roll tap produces a standalone resolved die bubble before outcome narration', async () => {
  const state = await stateAtGoblin()
  const prepared = await prepareWeedGoblinsFreeTextTurn({
    state,
    playerAction: 'I shove the goblin into the paperwork cart',
    generateNarration: generatedNarration(),
  })
  const resolved = await resolveWeedGoblinsPreparedTurn({
    preparedTurn: prepared,
    generateNarration: generatedNarration(),
  })
  const checkEvent = resolved.after.history
    .slice(state.history.length)
    .find((event) => event.type === 'check')

  assert.ok(checkEvent)
  assert.equal(resolved.rollResultMessage.kind, 'roll-result')
  assert.equal(resolved.rollResultMessage.die, checkEvent.roll)
  assert.equal(resolved.rollResultMessage.text, '')
  assert.equal(resolved.outcomeMessages.length >= 1, true)
  assert.equal(resolved.outcomeMessages[0].die, null)

  const turn = [
    prepared.outgoingMessage,
    prepared.setupMessage,
    prepared.rollTriggerMessage,
    resolved.rollResultMessage,
    resolved.outcomeMessages[0],
  ]
  assert.deepEqual(turn.map((message) => message.kind), [
    'message',
    'message',
    'roll-trigger',
    'roll-result',
    'message',
  ])
})

test('free-text scenes expose no mechanical quick-reply categories', async () => {
  const state = await stateAtGoblin()
  assert.deepEqual(getWeedGoblinsQuickReplies(state), [])
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
  const session = await createWeedGoblinsChatSession({
    seed: 'scan-28',
    generateNarration: generatedNarration(),
  })
  const background = session.choices.find((choice) => choice.id === 'background:hauler')
  const backgroundTransition = selectWeedGoblinsChatChoice(session.state, background)
  const route = getWeedGoblinsQuickReplies(backgroundTransition.after)
    .find((choice) => choice.id === 'route:ridge')
  const routeTransition = selectWeedGoblinsChatChoice(backgroundTransition.after, route)

  const incoming = await resolveWeedGoblinsTransitionMessages({
    before: routeTransition.before,
    after: routeTransition.after,
    generateNarration: generatedNarration(),
  })

  assert.equal(incoming.some((message) => message.die === 1), true)
})
