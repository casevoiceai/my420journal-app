import test from 'node:test'
import assert from 'node:assert/strict'

import {
  THE_NEW_PLACE_DAYS,
  advanceTheNewPlaceRun,
  createTheNewPlaceRun,
  createTheNewPlaceWeekDefinition,
  getTheNewPlaceActions,
  restoreTheNewPlaceRun,
  sanitizeTheNewPlacePersonalization,
  serializeTheNewPlaceRun,
} from './theNewPlaceEngine.js'

function firstAction(run, prefix) {
  return getTheNewPlaceActions(run).find((action) => action.id.startsWith(prefix))?.id
}

function playDay(run, decisionId = null, reportId = 'report:operations') {
  const decision = decisionId || firstAction(run, 'decision:')
  let next = advanceTheNewPlaceRun(run, decision)
  next = advanceTheNewPlaceRun(next, reportId)
  return next
}

function playFullWeek(seed = 'week-full', chooser = () => null) {
  let run = createTheNewPlaceRun({ seed })
  while (run.status === 'active') {
    const choice = chooser(run) || firstAction(run, 'decision:')
    run = advanceTheNewPlaceRun(run, choice)
    run = advanceTheNewPlaceRun(run, 'report:operations')
  }
  return run
}

test('same seed and personalization produce the same fixed week definition', () => {
  const options = { seed: 'same-week', personalization: { categoryBands: ['flower'], entryBand: '10-24' } }
  assert.deepEqual(createTheNewPlaceWeekDefinition(options), createTheNewPlaceWeekDefinition(options))
})

test('different seeds can create materially different weeks', () => {
  const a = createTheNewPlaceWeekDefinition({ seed: 'week-a' })
  const b = createTheNewPlaceWeekDefinition({ seed: 'week-b' })
  assert.notDeepEqual(
    [a.storeName, a.openingProblem.id, a.highDemandProductId, a.selectedStaffIds],
    [b.storeName, b.openingProblem.id, b.highDemandProductId, b.selectedStaffIds],
  )
})

test('personalization sanitizer discards restricted private fields', () => {
  const safe = sanitizeTheNewPlacePersonalization({
    categoryBands: ['flower'], effectTags: ['quiet'], profileLabels: ['myrcene'], entryBand: '25-49',
    rawNotes: 'private', exactPrice: '40', dispensaryName: 'real place', health: 'private health',
  })
  assert.deepEqual(Object.keys(safe).sort(), ['categoryBands', 'effectTags', 'entryBand', 'profileLabels'])
  assert.equal(JSON.stringify(safe).includes('private'), false)
  assert.equal(JSON.stringify(safe).includes('real place'), false)
})

test('week always has seven connected days and each day requires decision then report', () => {
  let run = createTheNewPlaceRun({ seed: 'seven-days' })
  assert.equal(THE_NEW_PLACE_DAYS.length, 7)
  for (let day = 0; day < 7; day += 1) {
    assert.equal(run.dayIndex, day)
    assert.equal(run.phase, 'decision')
    run = advanceTheNewPlaceRun(run, firstAction(run, 'decision:'))
    assert.equal(run.phase, 'report')
    assert.equal(getTheNewPlaceActions(run).every((action) => action.id.startsWith('report:')), true)
    run = advanceTheNewPlaceRun(run, 'report:operations')
  }
  assert.equal(run.status, 'completed')
  assert.equal(run.phase, 'complete')
})

test('a Monday choice creates a delayed consequence later in the same week', () => {
  let run = createTheNewPlaceRun({ seed: 'monday-delay' })
  run = playDay(run, 'decision:stock-first')
  assert.equal(run.dayIndex, 1)
  assert.equal(run.history.some((event) => event.type === 'delayed-consequence'), false)
  run = playDay(run)
  assert.equal(run.dayIndex, 2)
  run = playDay(run)
  assert.equal(run.history.some((event) => event.type === 'delayed-consequence' && event.sourceDay === 'monday'), true)
})

test('inventory arithmetic never produces negative units across many weeks', () => {
  for (let index = 0; index < 100; index += 1) {
    let run = createTheNewPlaceRun({ seed: `inventory-${index}` })
    while (run.status === 'active') {
      run = advanceTheNewPlaceRun(run, firstAction(run, 'decision:'))
      for (const count of Object.values(run.inventory)) assert.equal(count >= 0, true)
      run = advanceTheNewPlaceRun(run, 'report:operations')
      for (const count of Object.values(run.inventory)) assert.equal(count >= 0, true)
    }
  }
})

test('business-state dimensions stay within zero to one hundred', () => {
  for (let index = 0; index < 100; index += 1) {
    const run = playFullWeek(`bounds-${index}`)
    for (const value of Object.values(run.metrics)) {
      assert.equal(value >= 0 && value <= 100, true)
    }
  }
})

test('Digilog report frames preserve the same factual snapshot', () => {
  const base = advanceTheNewPlaceRun(createTheNewPlaceRun({ seed: 'digilog-facts' }), 'decision:stock-first')
  const operations = advanceTheNewPlaceRun(base, 'report:operations')
  const demand = advanceTheNewPlaceRun(base, 'report:demand')
  assert.deepEqual(operations.reportHistory[0].factualSnapshot, demand.reportHistory[0].factualSnapshot)
  assert.notEqual(operations.reportHistory[0].frameId, demand.reportHistory[0].frameId)
})

test('report inconsistency detection is deterministic for repeated issue types', () => {
  let run = createTheNewPlaceRun({ seed: 'report-inconsistency' })
  run = playDay(run, 'decision:stock-first', 'report:operations')
  run = playDay(run, null, 'report:operations')
  run = playDay(run, null, 'report:demand')
  assert.equal(run.reportInconsistencyCount, 1)
  const wednesday = run.reportHistory.find((report) => report.dayId === 'wednesday')
  assert.equal(wednesday.inconsistentWithPrior, true)
})

test('staff assignment days use only the selected fictional staff cards', () => {
  let run = createTheNewPlaceRun({ seed: 'staff-days' })
  run = playDay(run)
  const tuesdayActions = getTheNewPlaceActions(run)
  assert.equal(tuesdayActions.length, 3)
  for (const action of tuesdayActions) {
    const staffId = action.id.replace('decision:staff-', '')
    assert.equal(run.weekDefinition.selectedStaffIds.includes(staffId), true)
  }
})

test('the fictional inspector focus derives from actual week state', () => {
  let run = createTheNewPlaceRun({ seed: 'inspector-state' })
  while (run.status === 'active' && run.dayIndex < 5) run = playDay(run)
  assert.equal(run.dayIndex, 5)
  run.metrics.inventory = 10
  run.metrics.compliance = 90
  run.reportInconsistencyCount = 0
  run = advanceTheNewPlaceRun(run, firstAction(run, 'decision:'))
  run = advanceTheNewPlaceRun(run, 'report:operations')
  assert.equal(run.inspector.focusId, 'inventory-reconciliation')
})

test('Sunday outcome is deterministic from the actual final state', () => {
  const a = playFullWeek('outcome-deterministic')
  const b = playFullWeek('outcome-deterministic')
  assert.deepEqual(a.finalSummary, b.finalSummary)
  assert.ok(['improved-week', 'stable-week', 'strained-surviving-week'].includes(a.finalSummary.outcomeId))
})

test('a poor week still reaches a coherent completed Sunday outcome', () => {
  let run = createTheNewPlaceRun({ seed: 'poor-week' })
  run.metrics = { funds: 5, inventory: 5, satisfaction: 5, compliance: 5 }
  while (run.status === 'active') {
    run = advanceTheNewPlaceRun(run, firstAction(run, 'decision:'))
    run = advanceTheNewPlaceRun(run, run.dayIndex % 2 === 0 ? 'report:operations' : 'report:demand')
  }
  assert.equal(run.status, 'completed')
  assert.equal(run.finalSummary.outcomeId, 'strained-surviving-week')
  assert.match(run.narration.at(-1), /still standing/)
})

test('active week serializes and restores at the exact decision point', () => {
  let run = createTheNewPlaceRun({ seed: 'resume-week' })
  run = playDay(run)
  run = advanceTheNewPlaceRun(run, firstAction(run, 'decision:'))
  assert.equal(run.phase, 'report')
  const restored = restoreTheNewPlaceRun(serializeTheNewPlaceRun(run))
  assert.deepEqual(restored, run)
  assert.equal(restored.phase, 'report')
})

test('generated week state contains no real dispensary, price, raw-note, or health fields', () => {
  const run = createTheNewPlaceRun({
    seed: 'privacy-week',
    personalization: {
      categoryBands: ['flower'],
      rawNotes: 'private note',
      exactPrice: '99',
      dispensaryName: 'real dispensary',
      health: 'private health',
    },
  })
  const serialized = JSON.stringify(run)
  for (const forbidden of ['private note', '99', 'real dispensary', 'private health', 'rawNotes', 'exactPrice', 'dispensaryName']) {
    assert.equal(serialized.includes(forbidden), false)
  }
})
