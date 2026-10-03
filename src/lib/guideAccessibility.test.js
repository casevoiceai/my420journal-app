import test from 'node:test'
import assert from 'node:assert/strict'
import { accessibilityAction, buildAccessibilityTurn, buildContextualBranches, buildModelSuggestedBranches } from './guideAccessibility.js'

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

test('explicit Give me choices keeps the deliberate accessibility menu', () => {
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

test('complete statements do not force contextual branches', () => {
  const turn = buildContextualBranches({
    guide: 'larry', messages: [{ role: 'user', content: 'Coke or Pepsi?' }],
    assistantText: 'Coke. If you are making me choose, that is my answer.'
  })
  assert.equal(turn, null)
})

test('either-or Guide questions become response-specific branches without a synthetic free-text button', () => {
  const turn = buildContextualBranches({
    guide: 'larry', messages: [{ role: 'user', content: 'My boss embarrassed me in front of everybody.' }],
    assistantText: 'Was it the criticism itself, or the way they did it?'
  })
  assert.equal(turn.length, 3)
  assert.match(turn[0].label, /criticism itself/i)
  assert.match(turn[1].label, /way they did it/i)
  assert.match(turn[2].label, /stay with me/i)
  assert.equal(turn.some((x) => x.freeText), false)
})

test('low-stakes yes-no questions stay grounded instead of manufacturing a Guide theory', () => {
  const turn = buildContextualBranches({
    guide: 'larry', messages: [{ role: 'user', content: 'Tell me about old records.' }],
    assistantText: 'Do you want the ridiculous version?'
  })
  assert.equal(turn.length, 2)
  assert.match(turn[0].label, /Yeah/i)
  assert.match(turn[1].label, /Not really/i)
  assert.doesNotMatch(turn.map((x) => x.label).join(' '), /Larry.*ridiculous|theory/i)
})

test('plain harmless yes-no questions do not automatically get a joke branch', () => {
  const turn = buildContextualBranches({
    guide: 'larry', messages: [{ role: 'user', content: 'I liked that story.' }],
    assistantText: 'Do you agree?'
  })
  const labels = turn.map((x) => x.label).join(' ')
  assert.match(labels, /Yeah/i)
  assert.match(labels, /Not really/i)
  assert.doesNotMatch(labels, /ridiculous|silly/i)
})

test('serious conversation suppresses playful branching and keeps a low-effort option', () => {
  const turn = buildContextualBranches({
    guide: 'larry', messages: [{ role: 'user', content: 'My friend died yesterday.' }],
    assistantText: 'Do you want to tell me about them?'
  })
  const labels = turn.map((x) => x.label).join(' ')
  assert.doesNotMatch(labels, /ridiculous|silly/i)
  assert.match(labels, /stay with me/i)
})

test('long Guide responses do not manufacture a simplify control', () => {
  const longReply = `${'This is a fairly long explanation with several details. '.repeat(7)}That is the short version.`
  const turn = buildContextualBranches({ guide: 'herb', messages: [{ role: 'user', content: 'Explain this to me.' }], assistantText: longReply })
  assert.equal(turn, null)
})

test('longer conversations do not manufacture a recap control', () => {
  const messages = [
    { role: 'user', content: 'First thing.' }, { role: 'assistant', content: 'Okay.' },
    { role: 'user', content: 'Second thing.' }, { role: 'assistant', content: 'Got it.' },
    { role: 'user', content: 'Third thing.' },
  ]
  const turn = buildContextualBranches({ guide: 'mary', messages, assistantText: 'Fair enough.' })
  assert.equal(turn, null)
})

test('model-suggested branches keep specific labels and reject generic filler', () => {
  const turn = buildModelSuggestedBranches({
    messages: [{ role: 'user', content: 'I like old records.' }],
    assistantText: 'That tracks. What do you listen to when nobody else is around?',
    suggestions: ['Old soul records', 'Embarrassing pop', 'Tell me more']
  })
  assert.equal(turn.length, 2)
  assert.match(turn[0].label, /Old soul records/i)
  assert.match(turn[1].label, /Embarrassing pop/i)
  assert.equal(turn.some((x) => x.freeText), false)
})

test('model-suggested branches can use the full zero-to-five range without filler', () => {
  const turn = buildModelSuggestedBranches({
    messages: [{ role: 'user', content: 'Give me some real ways to answer that.' }],
    assistantText: 'There are a few genuinely different ways you could go here.',
    suggestions: ['Ask why', 'Compare them', 'Push back', 'Make a joke', 'Change the premise', 'Sixth option']
  })
  assert.equal(turn.length, 5)
  assert.equal(turn.some((x) => x.freeText), false)
})

test('model hints may create specific branches after a statement when the model finds a real fork', () => {
  const turn = buildModelSuggestedBranches({
    messages: [{ role: 'user', content: 'Coke or Pepsi?' }],
    assistantText: 'Coke. If you are making me choose, that is my answer.',
    suggestions: ['Defend Coke', 'Tell me why Pepsi loses']
  })
  assert.equal(turn.length, 2)
  assert.match(turn[0].label, /Defend Coke/i)
  assert.match(turn[1].label, /Pepsi loses/i)
  assert.equal(turn.some((x) => x.freeText), false)
})

test('complete statements with no model hints show no menu', () => {
  const turn = buildModelSuggestedBranches({
    messages: [{ role: 'user', content: 'Coke or Pepsi?' }],
    assistantText: 'Coke. If you are making me choose, that is my answer.',
    suggestions: []
  })
  assert.equal(turn, null)
})

test('ordinary emotional support offers useful choices without a joke branch', () => {
  const turn = buildContextualBranches({
    guide: 'larry',
    messages: [{ role: 'user', content: "I'm anxious about my meeting tomorrow." }],
    assistantText: 'Ah, hell. That sounds rough. Want to tell me what has you worried?'
  })
  const labels = turn.map((x) => x.label).join(' ')
  assert.match(labels, /vent/i)
  assert.match(labels, /sort it out/i)
  assert.match(labels, /stay with me/i)
  assert.doesNotMatch(labels, /ridiculous|silly/i)
  assert.equal(turn.some((x) => x.freeText), false)
})
