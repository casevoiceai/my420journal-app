import test from 'node:test'
import assert from 'node:assert/strict'
import { questionById } from './content/starterLandsQuestions.js'
import {
  answerCharacterQuestion,
  beginStarter,
  commitDeparture,
  confirmAncestry,
  confirmBackground,
  confirmWeapon,
  createWeedGoblinsV3State,
  enterArmory,
  previewAncestry,
  previewBackground,
  previewWeapon,
  setPlayerName,
} from './weedGoblinsV3State.js'

test('V3 starts in Starter Lands and ancestry preview does not commit', () => {
  let state = createWeedGoblinsV3State({ seed: 'state-test', runId: 'run', campaignId: 'campaign' })
  assert.equal(state.sceneId, 'starter:welcome')
  state = beginStarter(state)
  state = setPlayerName(state, 'Ace')
  state = previewAncestry(state, 'dwarf')
  assert.equal(state.previewing.ancestryId, 'dwarf')
  assert.equal(state.player.ancestryId, null)
  state = previewAncestry(state, 'elf')
  assert.equal(state.player.ancestryId, null)
  assert.deepEqual(state.inspected.ancestryIds, ['dwarf', 'elf'])
})

test('confirmation creates canon while weapon/background browsing stays reversible', () => {
  let state = createWeedGoblinsV3State({ seed: 'full-test', runId: 'run', campaignId: 'campaign' })
  state = setPlayerName(beginStarter(state), 'Ace')
  state = confirmAncestry(previewAncestry(state, 'gnome'))
  assert.equal(state.player.ancestryId, 'gnome')
  assert.equal(state.selectedQuestionIds.length, 3)

  for (const questionId of [...state.selectedQuestionIds]) {
    const question = questionById(questionId)
    state = answerCharacterQuestion(state, questionId, question.answers[0][0])
  }
  assert.equal(state.sceneId, 'starter:armory-intro')
  assert.equal(state.player.characterFacts.length, 3)

  state = enterArmory(state)
  state = previewWeapon(state, 'battle-axe')
  state = previewWeapon(state, 'bow')
  assert.equal(state.player.weaponId, null)
  state = confirmWeapon(state, 'bow')
  assert.equal(state.player.weaponId, 'bow')

  state = previewBackground(state, 'tracker')
  state = previewBackground(state, 'diviner')
  assert.equal(state.player.backgroundId, null)
  state = confirmBackground(state, 'diviner')
  assert.equal(state.player.backgroundId, 'diviner')
  assert.equal(state.player.maxMana, 4)

  state = commitDeparture(state)
  assert.equal(state.sceneId, 'starter:theft-threshold')
  assert.equal(state.currentLocation, 'Windcut Camp, Goblin Highlands')
})

test('departure refuses incomplete character', () => {
  const state = createWeedGoblinsV3State({ seed: 'incomplete', runId: 'run', campaignId: 'campaign' })
  assert.throws(() => commitDeparture(state), /not complete/i)
})
