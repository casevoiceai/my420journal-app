export const THE_NEW_PLACE_GAME_ID = 'the-new-place'
export const THE_NEW_PLACE_RUN_VERSION = 1

export const THE_NEW_PLACE_DAYS = Object.freeze([
  Object.freeze({ id: 'monday', label: 'Monday', title: 'Take Over', issueType: 'inventory' }),
  Object.freeze({ id: 'tuesday', label: 'Tuesday', title: 'First Consequence', issueType: 'staffing' }),
  Object.freeze({ id: 'wednesday', label: 'Wednesday', title: 'Pressure Builds', issueType: 'inventory' }),
  Object.freeze({ id: 'thursday', label: 'Thursday', title: 'Consistency Test', issueType: 'reporting' }),
  Object.freeze({ id: 'friday', label: 'Friday', title: 'Management Review', issueType: 'staffing' }),
  Object.freeze({ id: 'saturday', label: 'Saturday', title: 'Inspector Day', issueType: 'reporting' }),
  Object.freeze({ id: 'sunday', label: 'Sunday', title: 'Reckoning', issueType: 'inventory' }),
])

export const FICTIONAL_PRODUCTS = Object.freeze([
  Object.freeze({ id: 'amber-ledger', name: 'Amber Ledger', category: 'amber-profile' }),
  Object.freeze({ id: 'quiet-signal', name: 'Quiet Signal', category: 'violet-profile' }),
  Object.freeze({ id: 'field-note', name: 'Field Note', category: 'green-profile' }),
  Object.freeze({ id: 'copper-index', name: 'Copper Index', category: 'copper-profile' }),
])

export const STAFF_CARDS = Object.freeze([
  Object.freeze({ id: 'organizer', name: 'The Organizer', strength: 'inventory', limitation: 'satisfaction' }),
  Object.freeze({ id: 'people-person', name: 'The People Person', strength: 'satisfaction', limitation: 'compliance' }),
  Object.freeze({ id: 'counter', name: 'The Counter', strength: 'funds', limitation: 'satisfaction' }),
  Object.freeze({ id: 'steady-hand', name: 'The Steady Hand', strength: 'compliance', limitation: 'funds' }),
])

export const OPENING_PROBLEMS = Object.freeze([
  Object.freeze({ id: 'thin-stock', label: 'One shelf is much thinner than the previous owner admitted.', metric: 'inventory', delta: -10 }),
  Object.freeze({ id: 'tight-funds', label: 'The store opens with less fictional operating credit than expected.', metric: 'funds', delta: -10 }),
  Object.freeze({ id: 'uneven-service', label: 'Regulars are patient, but satisfaction is already uneven.', metric: 'satisfaction', delta: -10 }),
  Object.freeze({ id: 'messy-records', label: 'The previous filing system is technically a system.', metric: 'compliance', delta: -10 }),
])

export const REPORT_FRAMES = Object.freeze([
  Object.freeze({ id: 'operations', label: 'Operations first', emphasis: 'what the store did' }),
  Object.freeze({ id: 'demand', label: 'Demand first', emphasis: 'what customers asked for' }),
  Object.freeze({ id: 'controls', label: 'Controls first', emphasis: 'what was checked and recorded' }),
])

const PERSONALIZATION_KEYS = Object.freeze([
  'categoryBands',
  'effectTags',
  'profileLabels',
  'entryBand',
  'runBand',
])

const DAY_STRATEGIES = Object.freeze({
  monday: Object.freeze([
    Object.freeze({ id: 'stock-first', label: 'Fix the thin spots first', restock: 'high', fundsDelta: -3, satisfactionDelta: 1, delayed: { targetDay: 3, metric: 'satisfaction', delta: 5, reason: 'Monday stock coverage pays off during Wednesday pressure.' } }),
    Object.freeze({ id: 'cash-first', label: 'Protect operating credit', restock: 'none', fundsDelta: 5, satisfactionDelta: -1, delayed: { targetDay: 2, metric: 'inventory', delta: -5, reason: 'Monday restraint leaves Tuesday with less inventory flexibility.' } }),
    Object.freeze({ id: 'service-first', label: 'Protect customer experience', restock: 'balanced', fundsDelta: -4, satisfactionDelta: 5, delayed: { targetDay: 4, metric: 'funds', delta: 3, reason: 'Monday service work produces a small Thursday return.' } }),
  ]),
  tuesday: Object.freeze([]),
  wednesday: Object.freeze([
    Object.freeze({ id: 'protect-funds', label: 'Protect funds through the supply problem', restock: 'none', fundsDelta: 6, satisfactionDelta: -2 }),
    Object.freeze({ id: 'protect-coverage', label: 'Protect inventory coverage', restock: 'balanced', fundsDelta: -5, satisfactionDelta: 1 }),
    Object.freeze({ id: 'protect-demand', label: 'Follow the strongest fictional demand', restock: 'high', fundsDelta: -4, satisfactionDelta: 4 }),
  ]),
  thursday: Object.freeze([
    Object.freeze({ id: 'reconcile-stock', label: 'Reconcile inventory before anything else', restock: 'low', complianceDelta: 4, inventoryDelta: 4 }),
    Object.freeze({ id: 'repair-reporting', label: 'Repair the reporting trail', restock: 'none', complianceDelta: 8, fundsDelta: -1 }),
    Object.freeze({ id: 'keep-floor-moving', label: 'Keep the floor moving', restock: 'balanced', satisfactionDelta: 4, complianceDelta: -2 }),
  ]),
  friday: Object.freeze([]),
  saturday: Object.freeze([
    Object.freeze({ id: 'high-demand-first', label: 'Put the strongest-demand category first', restock: 'high', fundsDelta: -4, satisfactionDelta: 5 }),
    Object.freeze({ id: 'balanced-floor', label: 'Keep every fictional category covered', restock: 'balanced', fundsDelta: -4, inventoryDelta: 3 }),
    Object.freeze({ id: 'protect-reserve', label: 'Protect the reserve and sell what is already here', restock: 'none', fundsDelta: 5, satisfactionDelta: -3 }),
  ]),
  sunday: Object.freeze([
    Object.freeze({ id: 'close-balanced', label: 'Close the week balanced', restock: 'low', inventoryDelta: 2, complianceDelta: 2 }),
    Object.freeze({ id: 'close-cash', label: 'Close with the strongest reserve', restock: 'none', fundsDelta: 5, satisfactionDelta: -1 }),
    Object.freeze({ id: 'close-service', label: 'Close by protecting satisfaction', restock: 'balanced', fundsDelta: -3, satisfactionDelta: 4 }),
  ]),
})

function hashSeed(seed) {
  const text = String(seed ?? THE_NEW_PLACE_GAME_ID)
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createRng(seed) {
  let state = hashSeed(seed) || 0x9e3779b9
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function pick(items, rng) {
  return items[Math.floor(rng() * items.length)]
}

function pickUnique(items, count, rng) {
  const pool = [...items]
  const selected = []
  while (selected.length < count && pool.length > 0) {
    const index = Math.floor(rng() * pool.length)
    selected.push(pool.splice(index, 1)[0])
  }
  return selected
}

function cleanText(value, maxLength = 48) {
  if (typeof value !== 'string') return null
  const text = value.trim().slice(0, maxLength)
  return text || null
}

function cleanArray(value) {
  if (!Array.isArray(value)) return []
  return value.map((item) => cleanText(item)).filter(Boolean).slice(0, 3)
}

export function sanitizeTheNewPlacePersonalization(input = {}) {
  const safe = {}
  for (const key of PERSONALIZATION_KEYS) {
    if (key === 'entryBand' || key === 'runBand') {
      const text = cleanText(input?.[key])
      if (text) safe[key] = text
    } else {
      const values = cleanArray(input?.[key])
      if (values.length) safe[key] = values
    }
  }
  return safe
}

function bounded(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

function buildDemandSchedule(rng, highDemandProductId) {
  return THE_NEW_PLACE_DAYS.map((day, dayIndex) => {
    const demand = {}
    for (const product of FICTIONAL_PRODUCTS) {
      const base = 1 + Math.floor(rng() * 2)
      const highBonus = product.id === highDemandProductId ? 1 + (dayIndex === 5 ? 2 : 0) : 0
      demand[product.id] = base + highBonus
    }
    return Object.freeze(demand)
  })
}

function buildStartingInventory(rng) {
  return Object.fromEntries(FICTIONAL_PRODUCTS.map((product) => [
    product.id,
    5 + Math.floor(rng() * 4),
  ]))
}

function deriveInventoryHealth(inventory, demand) {
  const available = Object.values(inventory).reduce((sum, count) => sum + count, 0)
  const expected = Object.values(demand).reduce((sum, count) => sum + count, 0)
  if (expected <= 0) return 100
  return bounded(50 + ((available - expected) * 6))
}

function storeName(rng) {
  const first = ['Lantern', 'Copper', 'Field', 'Quiet', 'North', 'Archive']
  const second = ['Counter', 'Room', 'Index', 'House', 'Shelf', 'Place']
  return `The ${pick(first, rng)} ${pick(second, rng)}`
}

export function createTheNewPlaceWeekDefinition({ seed = THE_NEW_PLACE_GAME_ID, personalization = {} } = {}) {
  const safePersonalization = sanitizeTheNewPlacePersonalization(personalization)
  const weekSeed = `${String(seed)}|${JSON.stringify(safePersonalization)}`
  const rng = createRng(weekSeed)
  const highDemandProduct = pick(FICTIONAL_PRODUCTS, rng)
  const openingProblem = pick(OPENING_PROBLEMS, rng)
  const selectedStaff = pickUnique(STAFF_CARDS, 3, rng)
  const demandSchedule = buildDemandSchedule(rng, highDemandProduct.id)
  const startingInventory = buildStartingInventory(rng)

  return Object.freeze({
    gameId: THE_NEW_PLACE_GAME_ID,
    version: THE_NEW_PLACE_RUN_VERSION,
    seed: String(seed),
    weekSeed,
    personalization: Object.freeze(safePersonalization),
    storeName: storeName(rng),
    openingProblem: Object.freeze({ ...openingProblem }),
    highDemandProductId: highDemandProduct.id,
    selectedStaffIds: Object.freeze(selectedStaff.map((staff) => staff.id)),
    startingInventory: Object.freeze({ ...startingInventory }),
    demandSchedule: Object.freeze(demandSchedule),
  })
}

function staffById(id) {
  return STAFF_CARDS.find((staff) => staff.id === id)
}

function currentDay(run) {
  return THE_NEW_PLACE_DAYS[run.dayIndex]
}

function pushHistory(run, event) {
  run.history.push(Object.freeze({ sequence: run.history.length + 1, ...event }))
}

function applyMetric(run, metric, delta) {
  run.metrics[metric] = bounded(run.metrics[metric] + delta)
}

function applyOpeningProblem(metrics, problem) {
  const next = { ...metrics }
  next[problem.metric] = bounded(next[problem.metric] + problem.delta)
  return next
}

function delayedForDay(run, dayIndex) {
  return run.delayedConsequences.filter((item) => item.targetDay === dayIndex && !item.resolved)
}

function resolveDelayedConsequences(run, dayIndex) {
  for (const item of delayedForDay(run, dayIndex)) {
    applyMetric(run, item.metric, item.delta)
    item.resolved = true
    pushHistory(run, { type: 'delayed-consequence', dayIndex, metric: item.metric, delta: item.delta, sourceDay: item.sourceDay })
    run.narration.push(item.reason)
  }
}

function restock(run, mode) {
  const high = run.weekDefinition.highDemandProductId
  const inventoryBefore = Object.values(run.inventory).reduce((sum, count) => sum + count, 0)
  let fictionalCost = 0
  if (mode === 'high') {
    run.inventory[high] += 4
    fictionalCost = 6
  } else if (mode === 'balanced') {
    for (const product of FICTIONAL_PRODUCTS) run.inventory[product.id] += 1
    fictionalCost = 6
  } else if (mode === 'low') {
    run.inventory[high] += 2
    fictionalCost = 3
  }
  run.metrics.funds = bounded(run.metrics.funds - fictionalCost)
  return {
    unitsAdded: Object.values(run.inventory).reduce((sum, count) => sum + count, 0) - inventoryBefore,
    fictionalCost,
  }
}

function processDemand(run) {
  const demand = run.weekDefinition.demandSchedule[run.dayIndex]
  let requested = 0
  let fulfilled = 0
  let fictionalRevenue = 0
  for (const product of FICTIONAL_PRODUCTS) {
    const wanted = demand[product.id] || 0
    const sold = Math.min(run.inventory[product.id], wanted)
    run.inventory[product.id] -= sold
    requested += wanted
    fulfilled += sold
    fictionalRevenue += sold * 2
  }
  run.metrics.funds = bounded(run.metrics.funds + fictionalRevenue)
  const fulfillmentRate = requested > 0 ? fulfilled / requested : 1
  applyMetric(run, 'satisfaction', Math.round((fulfillmentRate - 0.75) * 16))
  run.metrics.inventory = deriveInventoryHealth(run.inventory, demand)
  return { requested, fulfilled, fictionalRevenue }
}

function decisionStrategiesForRun(run) {
  const day = currentDay(run)
  if (day.id === 'tuesday' || day.id === 'friday') {
    return run.weekDefinition.selectedStaffIds.map((staffId) => {
      const staff = staffById(staffId)
      return {
        id: `staff-${staffId}`,
        label: `${day.id === 'tuesday' ? 'Assign' : 'Reassign'} ${staff.name}`,
        staffId,
        restock: staff.strength === 'inventory' ? 'low' : 'none',
        [`${staff.strength}Delta`]: 5,
        [`${staff.limitation}Delta`]: -2,
      }
    })
  }
  return DAY_STRATEGIES[day.id] || []
}

function getStrategy(run, strategyId) {
  return decisionStrategiesForRun(run).find((strategy) => strategy.id === strategyId)
}

function reportText(run, frameId) {
  const facts = run.currentDayResult
  const frame = REPORT_FRAMES.find((item) => item.id === frameId)
  if (!facts || !frame) return ''
  if (frameId === 'operations') {
    return `Operations: ${facts.restockedUnits} fictional units were added, ${facts.fulfilled} of ${facts.requested} requested units were fulfilled, and the day closed with the recorded state shown here.`
  }
  if (frameId === 'demand') {
    return `Demand: the store fulfilled ${facts.fulfilled} of ${facts.requested} requested fictional units; the report emphasizes where customer demand shaped the day.`
  }
  return `Controls: the same day is recorded with ${facts.restockedUnits} restocked units, ${facts.fulfilled} fulfilled requests, and the resulting inventory and compliance state preserved in the record.`
}

function reportInconsistency(run, issueType, frameId) {
  const prior = run.reportHistory.find((item) => item.issueType === issueType)
  return Boolean(prior && prior.frameId !== frameId)
}

function inspectorResult(run) {
  const inventoryScore = run.metrics.inventory
  const consistencyScore = bounded(100 - (run.reportInconsistencyCount * 22))
  const filingScore = run.metrics.compliance
  const candidates = [
    { id: 'inventory-reconciliation', score: inventoryScore },
    { id: 'report-consistency', score: consistencyScore },
    { id: 'fictional-filing-accuracy', score: filingScore },
  ]
  candidates.sort((a, b) => a.score - b.score || a.id.localeCompare(b.id))
  const focus = candidates[0]
  const outcome = focus.score >= 70 ? 'clean' : focus.score >= 45 ? 'noted' : 'corrective'
  return Object.freeze({ focusId: focus.id, score: focus.score, outcome })
}

function finalOutcome(run) {
  const consistencyScore = bounded(100 - (run.reportInconsistencyCount * 22))
  const average = Math.round((
    run.metrics.funds
    + run.metrics.inventory
    + run.metrics.satisfaction
    + run.metrics.compliance
    + consistencyScore
  ) / 5)
  const outcomeId = average >= 70 ? 'improved-week' : average >= 50 ? 'stable-week' : 'strained-surviving-week'
  return Object.freeze({
    outcomeId,
    average,
    funds: run.metrics.funds,
    inventory: run.metrics.inventory,
    satisfaction: run.metrics.satisfaction,
    compliance: run.metrics.compliance,
    reportConsistency: consistencyScore,
    inspectorOutcome: run.inspector?.outcome || 'not-reached',
    inspectorFocusId: run.inspector?.focusId || 'not-reached',
    tracedConsequences: run.history
      .filter((event) => event.type === 'delayed-consequence')
      .slice(-2)
      .map((event) => `${event.sourceDay}:${event.metric}:${event.delta}`),
  })
}

export function createTheNewPlaceRun(options = {}) {
  const weekDefinition = createTheNewPlaceWeekDefinition(options)
  const baseMetrics = applyOpeningProblem({ funds: 62, inventory: 62, satisfaction: 62, compliance: 70 }, weekDefinition.openingProblem)
  baseMetrics.inventory = deriveInventoryHealth(weekDefinition.startingInventory, weekDefinition.demandSchedule[0])
  return {
    gameId: THE_NEW_PLACE_GAME_ID,
    version: THE_NEW_PLACE_RUN_VERSION,
    status: 'active',
    phase: 'decision',
    dayIndex: 0,
    weekDefinition,
    inventory: { ...weekDefinition.startingInventory },
    metrics: baseMetrics,
    reportHistory: [],
    reportInconsistencyCount: 0,
    delayedConsequences: [],
    staffAssignments: [],
    currentDayResult: null,
    inspector: null,
    finalSummary: null,
    history: [],
    narration: [
      `${weekDefinition.storeName} opens Monday with one immediate problem: ${weekDefinition.openingProblem.label}`,
    ],
  }
}

function cloneRun(run) {
  return {
    ...run,
    inventory: { ...run.inventory },
    metrics: { ...run.metrics },
    reportHistory: run.reportHistory.map((item) => ({ ...item })),
    delayedConsequences: run.delayedConsequences.map((item) => ({ ...item })),
    staffAssignments: run.staffAssignments.map((item) => ({ ...item })),
    currentDayResult: run.currentDayResult ? { ...run.currentDayResult } : null,
    inspector: run.inspector ? { ...run.inspector } : null,
    finalSummary: run.finalSummary ? { ...run.finalSummary, tracedConsequences: [...run.finalSummary.tracedConsequences] } : null,
    history: [...run.history],
    narration: [...run.narration],
  }
}

export function getTheNewPlaceActions(run) {
  if (!run || run.status !== 'active') return []
  if (run.phase === 'decision') {
    return decisionStrategiesForRun(run).map((strategy) => ({
      id: `decision:${strategy.id}`,
      label: strategy.label,
    }))
  }
  if (run.phase === 'report') {
    return REPORT_FRAMES.map((frame) => ({
      id: `report:${frame.id}`,
      label: frame.label,
    }))
  }
  return []
}

function ensureAction(run, actionId) {
  const allowed = new Set(getTheNewPlaceActions(run).map((action) => action.id))
  if (!allowed.has(actionId)) throw new Error(`Action is not available: ${actionId}`)
}

function applyDecision(next, strategyId) {
  const day = currentDay(next)
  const strategy = getStrategy(next, strategyId)
  if (!strategy) throw new Error(`Unknown strategy: ${strategyId}`)
  const beforeMetrics = { ...next.metrics }
  const beforeInventory = { ...next.inventory }
  const restockResult = restock(next, strategy.restock || 'none')

  for (const metric of ['funds', 'inventory', 'satisfaction', 'compliance']) {
    const delta = Number(strategy[`${metric}Delta`] || 0)
    if (delta) applyMetric(next, metric, delta)
  }

  if (strategy.staffId) {
    next.staffAssignments.push({ dayId: day.id, staffId: strategy.staffId })
  }
  if (strategy.delayed) {
    next.delayedConsequences.push({ ...strategy.delayed, sourceDay: day.id, resolved: false })
  }

  const demand = processDemand(next)
  next.currentDayResult = {
    dayId: day.id,
    issueType: day.issueType,
    strategyId,
    requested: demand.requested,
    fulfilled: demand.fulfilled,
    fictionalRevenue: demand.fictionalRevenue,
    restockedUnits: restockResult.unitsAdded,
    fictionalRestockCost: restockResult.fictionalCost,
    beforeMetrics,
    afterMetrics: { ...next.metrics },
    beforeInventory,
    afterInventory: { ...next.inventory },
  }
  next.phase = 'report'
  pushHistory(next, { type: 'decision', dayId: day.id, strategyId })
  next.narration.push(
    `${day.label}: ${strategy.label}. The store fulfilled ${demand.fulfilled} of ${demand.requested} fictional unit requests. The result is now fixed in the day's record.`,
  )
}

function applyReport(next, frameId) {
  const day = currentDay(next)
  const inconsistent = reportInconsistency(next, day.issueType, frameId)
  if (inconsistent) {
    next.reportInconsistencyCount += 1
    applyMetric(next, 'compliance', -3)
  }
  const text = reportText(next, frameId)
  next.reportHistory.push({
    dayId: day.id,
    issueType: day.issueType,
    frameId,
    inconsistentWithPrior: inconsistent,
    factualSnapshot: {
      requested: next.currentDayResult.requested,
      fulfilled: next.currentDayResult.fulfilled,
      restockedUnits: next.currentDayResult.restockedUnits,
    },
  })
  pushHistory(next, { type: 'report', dayId: day.id, frameId, inconsistent })
  next.narration.push(text)

  if (day.id === 'saturday') {
    next.inspector = inspectorResult(next)
    pushHistory(next, { type: 'inspector', dayId: day.id, ...next.inspector })
    next.narration.push(
      `The fictional inspector focuses on ${next.inspector.focusId}. Result: ${next.inspector.outcome}.`,
    )
  }

  if (day.id === 'sunday') {
    next.status = 'completed'
    next.phase = 'complete'
    next.finalSummary = finalOutcome(next)
    pushHistory(next, { type: 'completion', outcomeId: next.finalSummary.outcomeId, average: next.finalSummary.average })
    next.narration.push(
      `Sunday closes the week as ${next.finalSummary.outcomeId}. The place is still standing.`,
    )
    return
  }

  next.dayIndex += 1
  next.phase = 'decision'
  next.currentDayResult = null
  resolveDelayedConsequences(next, next.dayIndex)
  const nextDay = currentDay(next)
  next.narration.push(`${nextDay.label}: ${nextDay.title}. The current state carries forward exactly as the prior days left it.`)
}

export function advanceTheNewPlaceRun(run, actionId) {
  if (!run || run.gameId !== THE_NEW_PLACE_GAME_ID) throw new Error('Invalid The New Place run')
  ensureAction(run, actionId)
  const next = cloneRun(run)
  const [verb, value] = actionId.split(':')
  if (verb === 'decision') {
    applyDecision(next, value)
    return next
  }
  if (verb === 'report') {
    applyReport(next, value)
    return next
  }
  throw new Error(`Unknown action: ${actionId}`)
}

export function playTheNewPlaceActions(run, actions = []) {
  return actions.reduce((state, actionId) => advanceTheNewPlaceRun(state, actionId), run)
}

export function serializeTheNewPlaceRun(run) {
  if (!run || run.gameId !== THE_NEW_PLACE_GAME_ID) throw new Error('Cannot serialize invalid The New Place run')
  return JSON.stringify(run)
}

export function restoreTheNewPlaceRun(serialized) {
  const parsed = typeof serialized === 'string' ? JSON.parse(serialized) : serialized
  if (!parsed || parsed.gameId !== THE_NEW_PLACE_GAME_ID || parsed.version !== THE_NEW_PLACE_RUN_VERSION) {
    throw new Error('Cannot restore incompatible The New Place run')
  }
  if (!parsed.weekDefinition || !Array.isArray(parsed.weekDefinition.demandSchedule) || parsed.weekDefinition.demandSchedule.length !== 7) {
    throw new Error('Cannot restore invalid The New Place week')
  }
  return parsed
}
