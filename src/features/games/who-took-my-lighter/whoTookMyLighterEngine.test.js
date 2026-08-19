import test from 'node:test'
import assert from 'node:assert/strict'

import {
  WHO_TOOK_MY_LIGHTER_GAME_ID,
  advanceWhoTookMyLighterRun,
  canAccuseWhoTookMyLighter,
  createWhoTookMyLighterCase,
  createWhoTookMyLighterRun,
  getWhoTookMyLighterActions,
  restoreWhoTookMyLighterRun,
  sanitizeWhoTookMyLighterPersonalization,
  serializeWhoTookMyLighterRun,
  validateWhoTookMyLighterCase,
} from './whoTookMyLighterEngine.js'

function actionIds(run) {
  return getWhoTookMyLighterActions(run).map((action) => action.id)
}

function openInterrogation(seed = 'case-a') {
  let run = createWhoTookMyLighterRun({ seed })
  run = advanceWhoTookMyLighterRun(run, 'begin:investigation')
  run = advanceWhoTookMyLighterRun(run, 'inspect:scene-context')
  run = advanceWhoTookMyLighterRun(run, 'begin:interrogations')
  return run
}

function prepareAccusation(seed = 'case-accuse') {
  let run = openInterrogation(seed)
  const [first, second] = run.caseDefinition.activeSuspectIds
  run = advanceWhoTookMyLighterRun(run, `interview:${first}`)
  run = advanceWhoTookMyLighterRun(run, `interview:${second}`)
  run = advanceWhoTookMyLighterRun(run, 'inspect:physical-marker')
  return run
}

test('same seed and safe personalization produce the same complete case definition', () => {
  const options = {
    seed: 'deterministic-1',
    personalization: {
      categoryBands: ['flower', 'edible'],
      effectTags: ['relaxed'],
      entryBand: '10-24',
    },
  }
  assert.deepEqual(createWhoTookMyLighterCase(options), createWhoTookMyLighterCase(options))
})

test('different seeds can produce materially different cases', () => {
  const first = createWhoTookMyLighterCase({ seed: 'different-a' })
  const second = createWhoTookMyLighterCase({ seed: 'different-b' })
  const firstSignature = [first.culpritId, first.missingObject.id, first.motive.id, ...first.activeSuspectIds]
  const secondSignature = [second.culpritId, second.missingObject.id, second.motive.id, ...second.activeSuspectIds]
  assert.notDeepEqual(firstSignature, secondSignature)
})

test('safe personalization changes case generation while restricted fields are discarded', () => {
  const sanitized = sanitizeWhoTookMyLighterPersonalization({
    categoryBands: ['flower'],
    effectTags: ['quiet'],
    profileLabels: ['profile-a'],
    entryBand: '25-49',
    rawNotes: 'private note must never survive',
    transcript: 'private transcript',
    exactPrice: '42.00',
    preciseLocation: 'private address',
    health: 'private health info',
  })
  assert.deepEqual(Object.keys(sanitized).sort(), ['categoryBands', 'effectTags', 'entryBand', 'profileLabels'])
  assert.equal(JSON.stringify(sanitized).includes('private'), false)

  const plain = createWhoTookMyLighterCase({ seed: 'personalization-change' })
  const personalized = createWhoTookMyLighterCase({
    seed: 'personalization-change',
    personalization: sanitized,
  })
  assert.notEqual(plain.caseSeed, personalized.caseSeed)
})

test('every generated case has two independent culprit paths and a clearing red-herring fact', () => {
  for (let index = 0; index < 250; index += 1) {
    const definition = createWhoTookMyLighterCase({ seed: `validation-${index}` })
    const validation = validateWhoTookMyLighterCase(definition)
    assert.equal(validation.valid, true, validation.errors.join('; '))

    const support = definition.evidence.filter(
      (item) => item.role === 'supports-culprit' && item.targetSuspectId === definition.culpritId,
    )
    assert.equal(support.length >= 2, true)
    assert.equal(new Set(support.map((item) => item.independentGroup)).size >= 2, true)
    assert.equal(
      definition.evidence.some(
        (item) => item.role === 'clears-red-herring' && item.targetSuspectId === definition.redHerringId,
      ),
      true,
    )
  }
})

test('culprit and case definition never change while the player investigates', () => {
  let run = openInterrogation('culprit-stability')
  const originalCase = run.caseDefinition
  const culpritId = run.caseDefinition.culpritId
  const firstSuspect = run.caseDefinition.activeSuspectIds[0]

  run = advanceWhoTookMyLighterRun(run, `interview:${firstSuspect}`)
  run = advanceWhoTookMyLighterRun(run, 'inspect:physical-marker')
  run = advanceWhoTookMyLighterRun(run, `revisit:${firstSuspect}`)

  assert.equal(run.caseDefinition.culpritId, culpritId)
  assert.deepEqual(run.caseDefinition, originalCase)
})

test('interview memory records approved topics without raw conversation', () => {
  let run = openInterrogation('topic-memory')
  const suspectId = run.caseDefinition.activeSuspectIds[0]
  run = advanceWhoTookMyLighterRun(run, `interview:${suspectId}`)
  run = advanceWhoTookMyLighterRun(run, `ask:${suspectId}:where`)

  assert.deepEqual(run.memory[suspectId].topicsAsked, ['where'])
  assert.equal('transcript' in run.memory[suspectId], false)
  assert.equal('rawText' in run.memory[suspectId], false)
})

test('a culprit contradiction depends on presenting collected evidence after the prior interview', () => {
  let run = openInterrogation('contradiction-path')
  const culpritId = run.caseDefinition.culpritId
  run = advanceWhoTookMyLighterRun(run, `interview:${culpritId}`)

  assert.equal(run.memory[culpritId].contradictionTriggered, false)
  run = advanceWhoTookMyLighterRun(run, 'inspect:physical-marker')
  assert.equal(actionIds(run).includes(`revisit:${culpritId}`), true)

  run = advanceWhoTookMyLighterRun(run, `revisit:${culpritId}`)
  assert.equal(run.memory[culpritId].revisitCount, 1)
  run = advanceWhoTookMyLighterRun(run, `present:${culpritId}:physical-marker`)

  assert.equal(run.memory[culpritId].contradictionTriggered, true)
  assert.equal(run.memory[culpritId].responseState, 'contradicted')
})

test('clearing evidence weakens the red herring rather than changing the culprit', () => {
  let run = openInterrogation('clear-red-herring')
  const redHerringId = run.caseDefinition.redHerringId
  const culpritId = run.caseDefinition.culpritId
  run = advanceWhoTookMyLighterRun(run, `interview:${redHerringId}`)
  run = advanceWhoTookMyLighterRun(run, 'inspect:red-herring-clear')
  run = advanceWhoTookMyLighterRun(run, `present:${redHerringId}:red-herring-clear`)

  assert.equal(run.memory[redHerringId].responseState, 'alibi-strengthened')
  assert.equal(run.memory[redHerringId].contradictionTriggered, false)
  assert.equal(run.caseDefinition.culpritId, culpritId)
})

test('accusation stays locked until the minimum investigation threshold is met', () => {
  let run = openInterrogation('threshold')
  const [first, second] = run.caseDefinition.activeSuspectIds
  run = advanceWhoTookMyLighterRun(run, `interview:${first}`)
  assert.equal(canAccuseWhoTookMyLighter(run), false)
  assert.equal(actionIds(run).some((id) => id.startsWith('accuse:')), false)

  run = advanceWhoTookMyLighterRun(run, `interview:${second}`)
  assert.equal(canAccuseWhoTookMyLighter(run), false)
  run = advanceWhoTookMyLighterRun(run, 'inspect:physical-marker')
  assert.equal(canAccuseWhoTookMyLighter(run), true)
  assert.equal(actionIds(run).filter((id) => id.startsWith('accuse:')).length, 4)
})

test('a correct accusation completes the case and records only compact summary fields', () => {
  let run = prepareAccusation('correct-ending')
  run = advanceWhoTookMyLighterRun(run, `accuse:${run.caseDefinition.culpritId}`)

  assert.equal(run.status, 'completed')
  assert.equal(run.phase, 'reveal')
  assert.equal(run.accusation.correct, true)
  assert.equal(getWhoTookMyLighterActions(run).length, 0)
  assert.equal(run.completionSummary.gameId, WHO_TOOK_MY_LIGHTER_GAME_ID)
  assert.equal(run.completionSummary.correct, true)
  assert.deepEqual(Object.keys(run.completionSummary).sort(), [
    'accusedArchetypeId',
    'caseSeed',
    'contradictionCount',
    'correct',
    'culpritArchetypeId',
    'evidenceCount',
    'gameId',
    'interviewedCount',
    'missingObjectId',
    'motiveId',
    'version',
  ])
})

test('a wrong accusation is a coherent completed outcome and reveals the actual culprit', () => {
  let run = prepareAccusation('wrong-ending')
  const wrongId = run.caseDefinition.activeSuspectIds.find((id) => id !== run.caseDefinition.culpritId)
  run = advanceWhoTookMyLighterRun(run, `accuse:${wrongId}`)

  assert.equal(run.status, 'completed')
  assert.equal(run.accusation.correct, false)
  assert.equal(run.accusation.actualCulpritId, run.caseDefinition.culpritId)
  assert.equal(run.accusation.decisiveEvidenceIds.length, 2)
  assert.match(run.narration.at(-1), /Incorrect\./)
})

test('active run serializes and restores at the exact investigation state', () => {
  let run = openInterrogation('persistence')
  const suspectId = run.caseDefinition.activeSuspectIds[0]
  run = advanceWhoTookMyLighterRun(run, `interview:${suspectId}`)
  run = advanceWhoTookMyLighterRun(run, `ask:${suspectId}:object`)
  run = advanceWhoTookMyLighterRun(run, 'inspect:physical-marker')

  const restored = restoreWhoTookMyLighterRun(serializeWhoTookMyLighterRun(run))
  assert.deepEqual(restored, run)
  assert.equal(actionIds(restored).includes(`revisit:${suspectId}`), true)
})

test('completed history stores structured identifiers rather than private journal text', () => {
  let run = prepareAccusation('history-whitelist')
  run = advanceWhoTookMyLighterRun(run, `accuse:${run.caseDefinition.culpritId}`)
  const serializedHistory = JSON.stringify(run.history)

  assert.equal(serializedHistory.includes('rawNotes'), false)
  assert.equal(serializedHistory.includes('transcript'), false)
  assert.equal(serializedHistory.includes('health'), false)
  assert.equal(run.history.every((event) => typeof event.type === 'string'), true)
})
