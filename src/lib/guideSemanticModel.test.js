import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeSemanticDecision, semanticDecisionToCanonicalQuestion } from './guideSemanticModel.js'

test('normalizes an arbitrary relationship phrasing into one controlled intent', () => {
  const decision = normalizeSemanticDecision({
    route: 'character', intent: 'former_spouse_status', entity: 'Larry ex', confidence: 0.94,
  })
  assert.equal(decision.route, 'character')
  assert.equal(decision.intent, 'former_spouse_status')
  assert.equal(semanticDecisionToCanonicalQuestion(decision), 'are you divorced or widowed?')
})

test('journal semantic decisions become canonical local-journal questions', () => {
  assert.equal(semanticDecisionToCanonicalQuestion({ route: 'journal', intent: 'product_effects', entity: 'Blue Dream', confidence: 1 }), 'what effects did I record for Blue Dream?')
  assert.equal(semanticDecisionToCanonicalQuestion({ route: 'journal', intent: 'compare_products', entity: 'Blue Dream', secondary_entity: 'Gelato', confidence: 1 }), 'compare Blue Dream versus Gelato')
})

test('cannabis semantic decisions become reviewed B-layer questions', () => {
  assert.equal(semanticDecisionToCanonicalQuestion({ route: 'cannabis', intent: 'cannabis_lineage', entity: 'Blue Dream', confidence: 1 }), 'where did Blue Dream come from?')
  assert.equal(semanticDecisionToCanonicalQuestion({ route: 'cannabis', intent: 'cannabis_type', entity: 'Blue Dream', confidence: 1 }), 'what kind of strain is Blue Dream?')
})
