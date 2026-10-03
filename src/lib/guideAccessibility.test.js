import test from 'node:test'
import assert from 'node:assert/strict'
import { accessibilityAction, buildAccessibilityTurn, buildContextualBranches } from './guideAccessibility.js'

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


test('contextual RPG branches continue both statements and questions', () => {
  const statement = buildContextualBranches({ guide: 'larry', messages: [{ role: 'user', content: 'Tell me about Napoleon.' }], assistantText: 'Napoleon was Emperor of France.' })
  assert.equal(statement.length, 4)
  const turn = buildContextualBranches({ guide: 'larry', messages: [{ role: 'user', content: 'I like old records.' }], assistantText: 'Now you are speaking my language. What do you listen to most?' })
  assert.equal(turn.length, 4)
  assert.equal(turn[3].freeText, true)
  assert.match(turn[3].label, /say it myself/i)
})

test('Larry contextual branches include a Larry-flavored absurd option', () => {
  const turn = buildContextualBranches({ guide: 'larry', messages: [{ role: 'user', content: 'My cat knocked over my drink.' }], assistantText: 'That cat has opinions. What happened next?' })
  assert.match(turn[2].label, /Larry.*ridiculous/i)
  assert.match(turn[2].value, /playful/i)
})

test('serious conversation replaces the silly branch with a sensible option', () => {
  const turn = buildContextualBranches({ guide: 'larry', messages: [{ role: 'user', content: 'My friend died yesterday.' }], assistantText: 'I am sorry. Do you want to tell me about them?' })
  assert.doesNotMatch(turn[2].label, /ridiculous|silly/i)
  assert.match(turn[2].label, /stay with me/i)
})
test('long Guide questions surface Make that simpler contextually', () => {
  const longReply = `${'This is a fairly long explanation with several details. '.repeat(7)}What part do you want to dig into?`
  const turn = buildContextualBranches({ guide: 'herb', messages: [{ role: 'user', content: 'Explain this to me.' }], assistantText: longReply })
  assert.match(turn[1].label, /Make that simpler/i)
})

test('longer conversations can surface a recap branch', () => {
  const messages = [
    { role: 'user', content: 'First thing.' }, { role: 'assistant', content: 'Okay.' },
    { role: 'user', content: 'Second thing.' }, { role: 'assistant', content: 'Got it.' },
    { role: 'user', content: 'Third thing.' },
  ]
  const turn = buildContextualBranches({ guide: 'mary', messages, assistantText: 'Where do you want to go from here?' })
  assert.match(turn[1].label, /Remind me where we were/i)
})


test('contextual branches still appear when the Guide reply has no question mark', () => {
  const turn = buildContextualBranches({
    guide: 'larry',
    messages: [{ role: 'user', content: 'Coke or Pepsi?' }],
    assistantText: 'Coke. Pepsi always tasted like it was trying too hard.'
  })
  assert.equal(turn.length, 4)
  assert.equal(turn[3].freeText, true)
})

test('ordinary emotional support never gets the silly branch', () => {
  const turn = buildContextualBranches({
    guide: 'larry',
    messages: [{ role: 'user', content: "I'm anxious about my meeting tomorrow." }],
    assistantText: 'Ah, hell. That sounds rough. Want to tell me what has you worried?'
  })
  assert.doesNotMatch(turn[2].label, /ridiculous|silly/i)
  assert.match(turn[2].label, /stay with me/i)
})