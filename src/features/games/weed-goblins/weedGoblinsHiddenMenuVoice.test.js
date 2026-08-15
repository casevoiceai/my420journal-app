import test from 'node:test'
import assert from 'node:assert/strict'

import {
  advanceWeedGoblinsRun,
  advanceWeedGoblinsSessionText,
  createWeedGoblinsRun,
} from './weedGoblinsEngine.js'
import { buildWeedGoblinsCharacterSummary } from './weedGoblinsCharacterSummary.js'
import {
  appendWeedGoblinsVoiceTranscript,
  getBrowserSpeechRecognition,
} from './weedGoblinsVoiceInput.js'

function configuredState() {
  let state = createWeedGoblinsRun({ seed: 'hidden-menu' })
  state = advanceWeedGoblinsRun(state, 'session:continue')
  state = advanceWeedGoblinsSessionText(state, 'Fenna Duskrow')
  state = advanceWeedGoblinsRun(state, 'session:race:dwarf')
  state = advanceWeedGoblinsRun(state, 'session:weapon:daggers')
  state = advanceWeedGoblinsRun(state, 'background:warden')
  state = advanceWeedGoblinsRun(state, 'session:pronoun:she')
  return advanceWeedGoblinsRun(state, 'session:look:broad-scarred')
}

test('character summary exposes only current authoritative character and room state', () => {
  const state = configuredState()
  const summary = buildWeedGoblinsCharacterSummary(state)

  assert.equal(summary.name, 'Fenna Duskrow')
  assert.equal(summary.race, 'Dwarf')
  assert.equal(summary.pronoun, 'She')
  assert.equal(summary.weapon, 'Daggers')
  assert.equal(summary.className, 'Trail Warden')
  assert.equal(summary.ability, 'Hold the Line')
  assert.equal(summary.strength, 1)
  assert.equal(summary.defense, 3)
  assert.equal(summary.mana, 2)
  assert.equal(summary.maxMana, 2)
  assert.equal(summary.trouble, 0)
  assert.equal(summary.location, 'Windcut Trail')
  assert.match(summary.objective, /Goblin King/)
})

test('voice transcript appends to editable draft instead of replacing it', () => {
  assert.equal(
    appendWeedGoblinsVoiceTranscript('Ask Nib', 'about the tripwire'),
    'Ask Nib about the tripwire',
  )
})

test('voice transcript normalizes spoken whitespace and respects composer limit', () => {
  assert.equal(
    appendWeedGoblinsVoiceTranscript('', '  inspect   the   bridge  '),
    'inspect the bridge',
  )
  assert.equal(appendWeedGoblinsVoiceTranscript('12345', '67890', 8), '12345 67')
})

test('speech recognition capability detection accepts standard and webkit APIs', () => {
  class StandardRecognition {}
  class WebkitRecognition {}

  assert.equal(getBrowserSpeechRecognition({ SpeechRecognition: StandardRecognition }), StandardRecognition)
  assert.equal(getBrowserSpeechRecognition({ webkitSpeechRecognition: WebkitRecognition }), WebkitRecognition)
  assert.equal(getBrowserSpeechRecognition({}), null)
  assert.equal(getBrowserSpeechRecognition(null), null)
})
