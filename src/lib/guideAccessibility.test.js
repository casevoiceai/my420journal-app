import test from 'node:test'
import assert from 'node:assert/strict'
import { accessibilityAction, buildAccessibilityTurn } from './guideAccessibility.js'

const history = [
  { role: 'assistant', content: 'Hey. What happened?' },
  { role: 'user', content: 'My boss embarrassed me in front of everybody.' },
  { role: 'assistant', content: 'Yeah. That would get under my skin too. What part is sticking with you?' },
]

test('recognizes the four low-effort hot actions', () => {
  assert.equal(accessibilityAction('Give me choices.'), 'choices')
  assert.equal(accessibilityAction('I forgot what we were talking about.'), 'recap')
  assert.equal(accessibilityAction('Make that simpler.'), 'simplify')
  assert.equal(accessibilityAction("I'm too high."), 'too-high')
})
test('recap quotes only user-authored conversation content', () => {
  const turn = buildAccessibilityTurn({ guide: 'larry', messages: [...history, { role: 'user', content: 'I forgot what we were talking about.' }], action: 'recap' })
  assert.match(turn.content, /My boss embarrassed me/i)
  assert.doesNotMatch(turn.content, /invent|mistake|lesson/i)
})

test('simplify does not add claims beyond the prior Guide response', () => {
  const turn = buildAccessibilityTurn({ guide: 'larry', messages: [...history, { role: 'user', content: 'Make that simpler.' }], action: 'simplify' })
  assert.match(turn.content, /Short version:/)
  assert.match(turn.content, /get under my skin|sticking with you/i)
})

test('too-high action is short, safety-oriented, and offers a free-text escape', () => {
  const turn = buildAccessibilityTurn({ guide: 'larry', messages: history, action: 'too-high' })
  assert.equal(turn.lowEffortMode, true)
  assert.match(turn.content, /somewhere safe/i)
  assert.equal(turn.choices.length, 4)
  assert.equal(turn.choices[3].freeText, true)
})
test('general choices remain broad conversation intentions', () => {
  const turn = buildAccessibilityTurn({ guide: 'larry', messages: [{ role: 'user', content: 'Who was Napoleon?' }], action: 'choices' })
  assert.equal(turn.choices.length, 4)
  assert.match(turn.choices[0].label, /Keep talking/i)
  assert.match(turn.choices[2].label, /Change gears/i)
  assert.equal(turn.choices[3].freeText, true)
})
test('direct Give me choices works inside an emotional thread', async () => {
  const { supportChoiceTurn } = await import('./guideSafety.js')
  const messages = [
    { role: 'user', content: 'I had a really shitty day.' },
    { role: 'assistant', content: 'Yeah. What happened?' },
    { role: 'user', content: 'Give me choices.' },
  ]
  const turn = supportChoiceTurn('larry', messages)
  assert.equal(turn.choices.length, 4)
  assert.match(turn.choices[0].label, /vent/i)
  assert.equal(turn.choices[3].freeText, true)
})

test('direct Give me choices outside an emotional thread does not use support choices', async () => {
  const { supportChoiceTurn } = await import('./guideSafety.js')
  const turn = supportChoiceTurn('larry', [
    { role: 'assistant', content: 'Napoleon was a French military leader.' },
    { role: 'user', content: 'Give me choices.' },
  ])
  assert.equal(turn, null)
})
