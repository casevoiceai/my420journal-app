import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createWeedGoblinsChatSession,
  getWeedGoblinsQuickReplies,
  resolveWeedGoblinsTransitionMessages,
  selectWeedGoblinsChatChoice,
} from './weedGoblinsChatController.js'

function generatedNarration(calls = []) {
  return async ({ hook }) => {
    calls.push(`${hook.moment}:${hook.outcome}`)
    return {
      text: `Narrated ${hook.moment} ${hook.outcome}.`,
      source: 'ai',
    }
  }
}

async function advanceWithMessages(state, messages, actionId, generateNarration) {
  const action = getWeedGoblinsQuickReplies(state).find((candidate) => candidate.id === actionId)
  assert.ok(action, `Missing action ${actionId}`)

  const transition = selectWeedGoblinsChatChoice(state, action)
  const incoming = await resolveWeedGoblinsTransitionMessages({
    before: transition.before,
    after: transition.after,
    generateNarration,
  })

  return {
    state: transition.after,
    messages: [...messages, transition.outgoingMessage, ...incoming],
    outgoing: transition.outgoingMessage,
    incoming,
  }
}

test('choice selection advances state and preserves outgoing-then-incoming bubble order', async () => {
  const session = await createWeedGoblinsChatSession({
    seed: 'recovery-1',
    generateNarration: generatedNarration(),
  })

  assert.equal(session.messages.at(-1).direction, 'incoming')
  const background = session.choices.find((choice) => choice.id === 'background:hauler')
  assert.ok(background)

  const transition = selectWeedGoblinsChatChoice(session.state, background)
  assert.equal(transition.after.sceneId, 'choose-route')
  assert.equal(transition.outgoingMessage.direction, 'outgoing')
  assert.equal(transition.outgoingMessage.text, 'Highlands Hauler')

  const incoming = await resolveWeedGoblinsTransitionMessages({
    before: transition.before,
    after: transition.after,
    generateNarration: generatedNarration(),
  })
  const combined = [...session.messages, transition.outgoingMessage, ...incoming]

  assert.equal(combined.at(-incoming.length - 1).direction, 'outgoing')
  assert.equal(combined.at(-incoming.length).direction, 'incoming')
})

test('resolved check bubble carries only the final selected D20 number', async () => {
  const session = await createWeedGoblinsChatSession({
    seed: 'recovery-1',
    generateNarration: generatedNarration(),
  })
  const background = session.choices.find((choice) => choice.id === 'background:hauler')
  const backgroundTransition = selectWeedGoblinsChatChoice(session.state, background)
  const route = getWeedGoblinsQuickReplies(backgroundTransition.after)
    .find((choice) => choice.id === 'route:ridge')

  const routeTransition = selectWeedGoblinsChatChoice(backgroundTransition.after, route)
  const checkEvent = routeTransition.after.history
    .slice(routeTransition.before.history.length)
    .find((event) => event.type === 'check')
  assert.ok(checkEvent)

  const incoming = await resolveWeedGoblinsTransitionMessages({
    before: routeTransition.before,
    after: routeTransition.after,
    generateNarration: generatedNarration(),
  })
  const diceMessage = incoming.find((message) => message.die !== null)

  assert.ok(diceMessage)
  assert.equal(diceMessage.direction, 'incoming')
  assert.equal(diceMessage.die, checkEvent.roll)
  assert.equal(Array.isArray(diceMessage.die), false)
})

test('chat controller can drive the existing engine through one complete recovery run', async () => {
  const calls = []
  const generateNarration = generatedNarration(calls)
  const session = await createWeedGoblinsChatSession({
    seed: 'recovery-1',
    generateNarration,
  })

  let state = session.state
  let messages = session.messages
  for (const actionId of [
    'background:hauler',
    'route:ridge',
    'goblin:strike',
    'midpoint:skip',
    'boss:overpower',
  ]) {
    const advanced = await advanceWithMessages(state, messages, actionId, generateNarration)
    state = advanced.state
    messages = advanced.messages
  }

  assert.equal(state.status, 'completed')
  assert.equal(state.ending, 'recovery')
  assert.equal(messages.some((message) => message.direction === 'outgoing'), true)
  assert.equal(messages.some((message) => message.die !== null), true)
  assert.equal(calls.includes('scene-intro:intro'), true)
  assert.equal(calls.includes('action-success:success'), true)
  assert.equal(calls.includes('midpoint-outcome:midpoint'), true)
  assert.equal(calls.includes('run-ending:recovery'), true)
})
