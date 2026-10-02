import test from 'node:test'
import assert from 'node:assert/strict'
import { answerCannabisKnowledge, lookupCannabisKnowledge } from './cannabisKnowledge.js'

test('explains THC without dosing or product advice', () => {
  const answer = answerCannabisKnowledge({ text: 'what is THC?', guide: 'herb' })
  assert.match(answer, /intoxication/i)
  assert.doesNotMatch(answer, /take|dose|buy/i)
})

test('does not turn terpene associations into deterministic effects', () => {
  const answer = answerCannabisKnowledge({ text: 'what does myrcene do?', guide: 'herb' })
  assert.match(answer, /aromatic|aroma/i)
  assert.match(answer, /does not reliably predict/i)
  assert.doesNotMatch(answer, /makes you sleepy|couch lock/i)
})

test('explains that indica and sativa are unreliable effect predictors', () => {
  const answer = answerCannabisKnowledge({ text: 'what is the difference between indica and sativa?', guide: 'larry' })
  assert.match(answer, /do not reliably map/i)
  assert.match(answer, /not.*dependable effect predictions/i)
})

test('explains inhaled versus ingested timing without dosing instructions', () => {
  const inhaled = answerCannabisKnowledge({ text: 'how long does smoking weed take to kick in?', guide: 'mary' })
  const edible = answerCannabisKnowledge({ text: 'how long do edibles take to kick in?', guide: 'mary' })
  assert.match(inhaled, /seconds to minutes/i)
  assert.match(edible, /30 minutes to 2 hours/i)
  assert.doesNotMatch(`${inhaled} ${edible}`, /take \d|mg|puff/i)
})

test('Blue Dream profile preserves uncertainty about exact origin and chemistry', () => {
  const answer = answerCannabisKnowledge({ text: 'tell me about Blue Dream', guide: 'larry' })
  assert.match(answer, /Santa Cruz/i)
  assert.match(answer, /Blueberry.*Haze/i)
  assert.match(answer, /no single original breeder|origin.*uncertain|not.*universally documented/i)
  assert.match(answer, /does not have one guaranteed THC percentage|grower and batch chemistry can vary/i)
})

test('remembered Blue Dream topic answers a pronoun follow-up', () => {
  const answer = answerCannabisKnowledge({ text: 'what kind of strain is it?', topic: 'Blue Dream', guide: 'sunny' })
  assert.match(answer, /Blue Dream|Santa Cruz|Blueberry/i)
})

test('knowledge records carry confidence and source metadata', () => {
  const hit = lookupCannabisKnowledge('what is the entourage effect?')
  assert.equal(hit.confidence, 'uncertain')
  assert.ok(hit.sources.includes('entourageReview'))
})

test('first cultivar pack answers common lineage questions without effect guarantees', () => {
  const cases = [
    ['Sour Diesel', /Chemdawg.*Super Skunk/i],
    ['Northern Lights', /Afghani.*Thai/i],
    ['Gelato', /Sunset Sherbet.*Thin Mint GSC/i],
    ['GSC', /OG Kush.*Durban/i],
    ['Pineapple Express', /Trainwreck.*Hawaiian/i],
    ['Jack Herer', /Haze.*Northern Lights #5.*Shiva Skunk/i],
    ['OG Kush', /murky|disputed|vary/i],
  ]
  for (const [name, expected] of cases) {
    const answer = answerCannabisKnowledge({ text: `tell me about ${name}`, guide: 'larry' })
    assert.match(answer, expected)
    assert.doesNotMatch(answer, /will make you|will help|good for your/i)
  }
})

test('cultivar formatter never leaks Blue Dream into another cultivar', () => {
  const answer = answerCannabisKnowledge({ text: 'tell me about Gelato', guide: 'herb' })
  assert.match(answer, /Gelato|Sunset Sherbet/i)
  assert.doesNotMatch(answer, /Blue Dream/i)
})

test('cultivar type question gives a label but not an effect promise', () => {
  const answer = answerCannabisKnowledge({ text: 'what kind of strain is Blue Dream?', guide: 'larry' })
  assert.match(answer, /commonly labeled hybrid/i)
  assert.match(answer, /not a reliable effect prediction/i)
})
