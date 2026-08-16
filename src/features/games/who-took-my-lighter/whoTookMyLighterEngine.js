export const WHO_TOOK_MY_LIGHTER_GAME_ID = 'who-took-my-lighter'
export const WHO_TOOK_MY_LIGHTER_RUN_VERSION = 1

export const SUSPECT_ARCHETYPES = Object.freeze({
  collector: Object.freeze({
    id: 'collector',
    name: 'The Collector',
    personality: 'Methodical, possessive about small objects, and offended by disorder.',
    tellRule: 'When cornered, starts sorting nearby objects into exact rows.',
    signatureMarker: 'a tiny numbered inventory tag',
    baselineAttitude: 'precise',
    contradictionStyle: 'stops arguing and starts counting details aloud',
  }),
  host: Object.freeze({
    id: 'host',
    name: 'The Host',
    personality: 'Polite, observant, and determined to keep the room calm.',
    tellRule: 'When hiding something, becomes excessively concerned with everyone being comfortable.',
    signatureMarker: 'a folded paper coaster',
    baselineAttitude: 'courteous',
    contradictionStyle: 'answers the contradiction with a calmer, narrower version of the story',
  }),
  tinkerer: Object.freeze({
    id: 'tinkerer',
    name: 'The Tinkerer',
    personality: 'Always fixing something, usually with parts left over.',
    tellRule: 'When nervous, explains how an object works even when nobody asked.',
    signatureMarker: 'a short copper wire clipping',
    baselineAttitude: 'technical',
    contradictionStyle: 'tries to explain the contradiction as a mechanical misunderstanding',
  }),
  regular: Object.freeze({
    id: 'regular',
    name: 'The Regular',
    personality: 'Familiar with everyone, casually confident, remembers old routines.',
    tellRule: 'When lying, gives one unnecessary historical detail.',
    signatureMarker: 'a faded paper matchbook sleeve',
    baselineAttitude: 'familiar',
    contradictionStyle: 'adds an older story that accidentally makes the new story worse',
  }),
  neighbor: Object.freeze({
    id: 'neighbor',
    name: 'The Neighbor',
    personality: 'Helpful, curious, and always somehow already nearby.',
    tellRule: 'When pressed, asks a question instead of answering the last one.',
    signatureMarker: 'a blue thread snagged from a sleeve',
    baselineAttitude: 'helpful',
    contradictionStyle: 'answers with a question, then realizes the question revealed too much',
  }),
  minimalist: Object.freeze({
    id: 'minimalist',
    name: 'The Minimalist',
    personality: 'Owns almost nothing and has strong views about everybody else owning too much.',
    tellRule: 'When uncomfortable, describes the missing object as unnecessary.',
    signatureMarker: 'a clean white label with nothing written on it',
    baselineAttitude: 'dry',
    contradictionStyle: 'concedes the fact but argues the object never mattered in the first place',
  }),
})

export const MISSING_OBJECTS = Object.freeze([
  Object.freeze({ id: 'lighter', label: 'the lighter', sceneLabel: 'a brass lighter with a dent near the hinge' }),
  Object.freeze({ id: 'labeled-jar', label: 'the perfectly labeled jar', sceneLabel: 'a perfectly labeled little jar' }),
  Object.freeze({ id: 'custom-tray', label: 'the custom tray', sceneLabel: 'a small custom tray with an absurdly formal inscription' }),
  Object.freeze({ id: 'emergency-case', label: 'the emergency case', sceneLabel: 'a palm-sized emergency case with three unnecessary latches' }),
])

export const MOTIVES = Object.freeze([
  Object.freeze({ id: 'borrowed', label: 'borrowed it and planned to put it back' }),
  Object.freeze({ id: 'moved-for-safekeeping', label: 'moved it for safekeeping and then refused to admit it' }),
  Object.freeze({ id: 'mistaken-ownership', label: 'decided it was theirs after a very weak chain of reasoning' }),
  Object.freeze({ id: 'prove-a-point', label: 'hid it to prove a point that stopped making sense almost immediately' }),
])

export const APPROVED_TOPICS = Object.freeze([
  Object.freeze({ id: 'where', label: 'Where were you when it disappeared?' }),
  Object.freeze({ id: 'object', label: 'What do you know about the missing object?' }),
  Object.freeze({ id: 'others', label: 'Who else should I be looking at?' }),
])

const LOCATIONS = Object.freeze([
  'side-table',
  'coat-rack',
  'kitchen-counter',
  'window-seat',
])

const PERSONALIZATION_KEYS = Object.freeze([
  'categoryBands',
  'effectTags',
  'profileLabels',
  'entryBand',
  'runBand',
])

function hashSeed(seed) {
  const text = String(seed ?? WHO_TOOK_MY_LIGHTER_GAME_ID)
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

function sanitizeString(value, maxLength = 48) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().slice(0, maxLength)
  return trimmed || null
}

function sanitizeStringArray(value, maxItems = 3) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => sanitizeString(item))
    .filter(Boolean)
    .slice(0, maxItems)
}

export function sanitizeWhoTookMyLighterPersonalization(input = {}) {
  const safe = {}
  for (const key of PERSONALIZATION_KEYS) {
    if (key === 'entryBand' || key === 'runBand') {
      const value = sanitizeString(input?.[key])
      if (value) safe[key] = value
      continue
    }
    const values = sanitizeStringArray(input?.[key])
    if (values.length > 0) safe[key] = values
  }
  return safe
}

function personalizationSeedPart(personalization) {
  const safe = sanitizeWhoTookMyLighterPersonalization(personalization)
  return JSON.stringify(safe)
}

function createAlibi(suspect, isCulprit, location) {
  const claim = isCulprit
    ? `I never went near the ${location} after everyone settled in.`
    : `I was away from the ${location} when the object disappeared.`
  return Object.freeze({
    claim,
    truthful: !isCulprit,
  })
}

function createTopicResponses(suspect, caseContext, isCulprit) {
  return Object.freeze({
    where: isCulprit
      ? `${suspect.name} says, "${caseContext.alibi.claim}"`
      : `${suspect.name} gives a short account that matches the rest of the timeline.`,
    object: isCulprit
      ? `${suspect.name} describes ${caseContext.missingObject.label} with more precision than the scene required.`
      : `${suspect.name} says ${caseContext.missingObject.label} was still present the last time they noticed it.`,
    others: `${suspect.name} names another person in the room, but offers no new evidence against them.`,
  })
}

function createCaseEvidence({ culprit, redHerring, culpritLocation, redHerringLocation }) {
  return Object.freeze([
    Object.freeze({
      id: 'scene-context',
      label: 'The disturbed surface',
      location: 'side-table',
      role: 'context',
      targetSuspectId: null,
      independentGroup: 'scene',
      text: 'The place where the object should have been is clean except for one fresh disturbance. Somebody moved it deliberately.',
    }),
    Object.freeze({
      id: 'physical-marker',
      label: 'A physical marker',
      location: culpritLocation,
      role: 'supports-culprit',
      targetSuspectId: culprit.id,
      independentGroup: 'physical',
      text: `Near the ${culpritLocation} is ${culprit.signatureMarker}, something consistently associated with ${culprit.name}.`,
    }),
    Object.freeze({
      id: 'timeline-conflict',
      label: 'A timeline conflict',
      location: 'kitchen-counter',
      role: 'supports-culprit',
      targetSuspectId: culprit.id,
      independentGroup: 'timeline',
      text: `A mundane timestamped room event places someone at the ${culpritLocation} after ${culprit.name} claimed nobody from their side of the room went near it.`,
    }),
    Object.freeze({
      id: 'red-herring-clear',
      label: 'A clearing detail',
      location: redHerringLocation,
      role: 'clears-red-herring',
      targetSuspectId: redHerring.id,
      independentGroup: 'clearance',
      text: `A second detail accounts for ${redHerring.signatureMarker} at the ${redHerringLocation} during the relevant window, weakening the case against ${redHerring.name}.`,
    }),
  ])
}

export function createWhoTookMyLighterCase({ seed = WHO_TOOK_MY_LIGHTER_GAME_ID, personalization = {} } = {}) {
  const safePersonalization = sanitizeWhoTookMyLighterPersonalization(personalization)
  const caseSeed = `${String(seed)}|${personalizationSeedPart(safePersonalization)}`
  const rng = createRng(caseSeed)
  const activeSuspects = pickUnique(Object.values(SUSPECT_ARCHETYPES), 4, rng)
  const culprit = pick(activeSuspects, rng)
  const redHerring = pick(activeSuspects.filter((suspect) => suspect.id !== culprit.id), rng)
  const missingObject = pick(MISSING_OBJECTS, rng)
  const motive = pick(MOTIVES, rng)
  const culpritLocation = pick(LOCATIONS.filter((location) => location !== 'side-table'), rng)
  const redHerringLocation = pick(LOCATIONS.filter((location) => location !== culpritLocation), rng)
  const evidence = createCaseEvidence({ culprit, redHerring, culpritLocation, redHerringLocation })
  const suspectStates = {}

  for (const suspect of activeSuspects) {
    const isCulprit = suspect.id === culprit.id
    const alibi = createAlibi(suspect, isCulprit, culpritLocation)
    const contradictionEvidenceIds = isCulprit
      ? evidence.filter((item) => item.role === 'supports-culprit').map((item) => item.id)
      : []
    const clearingEvidenceIds = suspect.id === redHerring.id ? ['red-herring-clear'] : []
    suspectStates[suspect.id] = Object.freeze({
      id: suspect.id,
      name: suspect.name,
      personality: suspect.personality,
      tellRule: suspect.tellRule,
      signatureMarker: suspect.signatureMarker,
      baselineAttitude: suspect.baselineAttitude,
      contradictionStyle: suspect.contradictionStyle,
      alibi,
      contradictionEvidenceIds: Object.freeze(contradictionEvidenceIds),
      clearingEvidenceIds: Object.freeze(clearingEvidenceIds),
      topicResponses: createTopicResponses(suspect, { missingObject, alibi }, isCulprit),
    })
  }

  const caseDefinition = Object.freeze({
    version: WHO_TOOK_MY_LIGHTER_RUN_VERSION,
    gameId: WHO_TOOK_MY_LIGHTER_GAME_ID,
    caseSeed,
    seed: String(seed),
    personalization: Object.freeze(safePersonalization),
    missingObject: Object.freeze({ ...missingObject }),
    activeSuspectIds: Object.freeze(activeSuspects.map((suspect) => suspect.id)),
    culpritId: culprit.id,
    redHerringId: redHerring.id,
    motive: Object.freeze({ ...motive }),
    suspects: Object.freeze(suspectStates),
    evidence,
  })

  const validation = validateWhoTookMyLighterCase(caseDefinition)
  if (!validation.valid) {
    throw new Error(`Invalid Who Took My Lighter? case: ${validation.errors.join('; ')}`)
  }

  return caseDefinition
}

export function validateWhoTookMyLighterCase(caseDefinition) {
  const errors = []
  if (!caseDefinition || caseDefinition.gameId !== WHO_TOOK_MY_LIGHTER_GAME_ID) {
    errors.push('invalid game id')
    return { valid: false, errors }
  }
  if (!Array.isArray(caseDefinition.activeSuspectIds) || caseDefinition.activeSuspectIds.length !== 4) {
    errors.push('case must contain four active suspects')
  }
  if (!caseDefinition.activeSuspectIds?.includes(caseDefinition.culpritId)) {
    errors.push('culprit must be an active suspect')
  }
  const supportEvidence = caseDefinition.evidence?.filter(
    (item) => item.role === 'supports-culprit' && item.targetSuspectId === caseDefinition.culpritId,
  ) ?? []
  const independentGroups = new Set(supportEvidence.map((item) => item.independentGroup))
  if (supportEvidence.length < 2 || independentGroups.size < 2) {
    errors.push('case must contain two independent culprit-supporting evidence paths')
  }
  const clearEvidence = caseDefinition.evidence?.filter(
    (item) => item.role === 'clears-red-herring' && item.targetSuspectId === caseDefinition.redHerringId,
  ) ?? []
  if (clearEvidence.length < 1) {
    errors.push('case must contain evidence that weakens or clears the red herring')
  }
  if (caseDefinition.redHerringId === caseDefinition.culpritId) {
    errors.push('red herring cannot be the culprit')
  }
  return { valid: errors.length === 0, errors }
}

function createMemory(activeSuspectIds) {
  return Object.fromEntries(activeSuspectIds.map((suspectId) => [suspectId, {
    interviewed: false,
    topicsAsked: [],
    presentedEvidenceIds: [],
    contradictionTriggered: false,
    responseState: 'unseen',
    revisitCount: 0,
    lastEvidenceCountAtInterview: 0,
  }]))
}

function openingText(caseDefinition) {
  return `Something small is missing: ${caseDefinition.missingObject.sceneLabel}. Four people were close enough to matter. Nobody is treating this as a small problem.`
}

export function createWhoTookMyLighterRun(options = {}) {
  const caseDefinition = createWhoTookMyLighterCase(options)
  return {
    version: WHO_TOOK_MY_LIGHTER_RUN_VERSION,
    gameId: WHO_TOOK_MY_LIGHTER_GAME_ID,
    status: 'active',
    phase: 'scene',
    caseDefinition,
    evidenceCollected: [],
    memory: createMemory(caseDefinition.activeSuspectIds),
    accusation: null,
    completionSummary: null,
    history: [],
    narration: [openingText(caseDefinition)],
  }
}

function cloneRun(run) {
  return {
    ...run,
    evidenceCollected: [...run.evidenceCollected],
    memory: Object.fromEntries(Object.entries(run.memory).map(([key, value]) => [key, {
      ...value,
      topicsAsked: [...value.topicsAsked],
      presentedEvidenceIds: [...value.presentedEvidenceIds],
    }])),
    history: [...run.history],
    narration: [...run.narration],
    accusation: run.accusation ? { ...run.accusation } : null,
    completionSummary: run.completionSummary ? { ...run.completionSummary } : null,
  }
}

function evidenceById(caseDefinition, evidenceId) {
  return caseDefinition.evidence.find((item) => item.id === evidenceId)
}

function suspectById(caseDefinition, suspectId) {
  return caseDefinition.suspects[suspectId]
}

function interviewedCount(run) {
  return Object.values(run.memory).filter((entry) => entry.interviewed).length
}

export function canAccuseWhoTookMyLighter(run) {
  return run.status === 'active'
    && run.phase === 'interrogation'
    && run.evidenceCollected.length >= 2
    && interviewedCount(run) >= 2
}

export function getWhoTookMyLighterActions(run) {
  if (!run || run.status !== 'active') return []
  if (run.phase === 'scene') {
    return [{ id: 'begin:investigation', label: 'Examine the scene' }]
  }

  const actions = []
  const uncollectedEvidence = run.caseDefinition.evidence.filter(
    (item) => !run.evidenceCollected.includes(item.id),
  )
  for (const evidence of uncollectedEvidence) {
    actions.push({ id: `inspect:${evidence.id}`, label: `Inspect: ${evidence.label}` })
  }

  if (run.phase === 'evidence') {
    if (run.evidenceCollected.length >= 1) {
      actions.push({ id: 'begin:interrogations', label: 'Start interviews' })
    }
    return actions
  }

  for (const suspectId of run.caseDefinition.activeSuspectIds) {
    const suspect = suspectById(run.caseDefinition, suspectId)
    const memory = run.memory[suspectId]
    if (!memory.interviewed) {
      actions.push({ id: `interview:${suspectId}`, label: `Interview ${suspect.name}` })
      continue
    }
    if (run.evidenceCollected.length > memory.lastEvidenceCountAtInterview) {
      actions.push({ id: `revisit:${suspectId}`, label: `Return to ${suspect.name}` })
    }
    for (const topic of APPROVED_TOPICS) {
      if (!memory.topicsAsked.includes(topic.id)) {
        actions.push({ id: `ask:${suspectId}:${topic.id}`, label: `${suspect.name}: ${topic.label}` })
      }
    }
    for (const evidenceId of run.evidenceCollected) {
      if (!memory.presentedEvidenceIds.includes(evidenceId)) {
        const evidence = evidenceById(run.caseDefinition, evidenceId)
        actions.push({ id: `present:${suspectId}:${evidenceId}`, label: `Show ${suspect.name}: ${evidence.label}` })
      }
    }
  }

  if (canAccuseWhoTookMyLighter(run)) {
    for (const suspectId of run.caseDefinition.activeSuspectIds) {
      const suspect = suspectById(run.caseDefinition, suspectId)
      actions.push({ id: `accuse:${suspectId}`, label: `Accuse ${suspect.name}` })
    }
  }

  return actions
}

function ensureAvailable(run, actionId) {
  const available = new Set(getWhoTookMyLighterActions(run).map((action) => action.id))
  if (!available.has(actionId)) {
    throw new Error(`Action is not available: ${actionId}`)
  }
}

function pushHistory(run, event) {
  run.history.push(Object.freeze({ sequence: run.history.length + 1, ...event }))
}

function handleInspect(next, evidenceId) {
  const evidence = evidenceById(next.caseDefinition, evidenceId)
  next.evidenceCollected.push(evidenceId)
  pushHistory(next, { type: 'evidence', evidenceId })
  next.narration.push(evidence.text)
}

function handleInterview(next, suspectId, revisit = false) {
  const suspect = suspectById(next.caseDefinition, suspectId)
  const memory = next.memory[suspectId]
  if (revisit) {
    memory.revisitCount += 1
    memory.lastEvidenceCountAtInterview = next.evidenceCollected.length
    pushHistory(next, { type: 'revisit', suspectId, evidenceCount: next.evidenceCollected.length })
    next.narration.push(`${suspect.name} looks over the newer evidence and waits for the next question.`)
    return
  }
  memory.interviewed = true
  memory.responseState = 'baseline'
  memory.lastEvidenceCountAtInterview = next.evidenceCollected.length
  pushHistory(next, { type: 'interview', suspectId, evidenceCount: next.evidenceCollected.length })
  next.narration.push(`${suspect.name} agrees to answer questions. Their manner is ${suspect.baselineAttitude}.`)
}

function handleAsk(next, suspectId, topicId) {
  const suspect = suspectById(next.caseDefinition, suspectId)
  const memory = next.memory[suspectId]
  memory.topicsAsked.push(topicId)
  pushHistory(next, { type: 'topic', suspectId, topicId })
  next.narration.push(suspect.topicResponses[topicId])
}

function handlePresent(next, suspectId, evidenceId) {
  const suspect = suspectById(next.caseDefinition, suspectId)
  const memory = next.memory[suspectId]
  memory.presentedEvidenceIds.push(evidenceId)
  const isContradiction = suspect.contradictionEvidenceIds.includes(evidenceId)
  const isClearing = suspect.clearingEvidenceIds.includes(evidenceId)

  if (isContradiction) {
    memory.contradictionTriggered = true
    memory.responseState = 'contradicted'
    next.narration.push(`${suspect.name} ${suspect.contradictionStyle}. The earlier answer no longer fits cleanly.`)
  } else if (isClearing) {
    memory.responseState = 'alibi-strengthened'
    next.narration.push(`The evidence strengthens ${suspect.name}'s alibi and makes the case against them weaker.`)
  } else {
    next.narration.push(`${suspect.name} studies the evidence. It does not directly contradict their earlier answer.`)
  }
  pushHistory(next, { type: 'present-evidence', suspectId, evidenceId, contradiction: isContradiction, clearing: isClearing })
}

export function createWhoTookMyLighterCompletionSummary(run) {
  if (!run?.accusation || run.status !== 'completed') return null
  return Object.freeze({
    gameId: WHO_TOOK_MY_LIGHTER_GAME_ID,
    version: WHO_TOOK_MY_LIGHTER_RUN_VERSION,
    caseSeed: run.caseDefinition.caseSeed,
    culpritArchetypeId: run.caseDefinition.culpritId,
    accusedArchetypeId: run.accusation.suspectId,
    correct: run.accusation.correct,
    missingObjectId: run.caseDefinition.missingObject.id,
    motiveId: run.caseDefinition.motive.id,
    evidenceCount: run.evidenceCollected.length,
    interviewedCount: interviewedCount(run),
    contradictionCount: Object.values(run.memory).filter((entry) => entry.contradictionTriggered).length,
  })
}

function handleAccusation(next, suspectId) {
  const correct = suspectId === next.caseDefinition.culpritId
  const culprit = suspectById(next.caseDefinition, next.caseDefinition.culpritId)
  const decisiveEvidenceIds = next.caseDefinition.evidence
    .filter((item) => item.role === 'supports-culprit' && item.targetSuspectId === next.caseDefinition.culpritId)
    .map((item) => item.id)

  next.accusation = {
    suspectId,
    correct,
    actualCulpritId: next.caseDefinition.culpritId,
    decisiveEvidenceIds,
  }
  next.status = 'completed'
  next.phase = 'reveal'
  pushHistory(next, { type: 'accusation', suspectId, correct })
  next.narration.push(
    correct
      ? `Correct. ${culprit.name} took ${next.caseDefinition.missingObject.label}. The physical marker and timeline conflict point to the same person.`
      : `Incorrect. ${culprit.name} took ${next.caseDefinition.missingObject.label}. The physical marker and timeline conflict were the decisive pair.`,
  )
  next.completionSummary = createWhoTookMyLighterCompletionSummary(next)
}

export function advanceWhoTookMyLighterRun(run, actionId) {
  if (!run || run.gameId !== WHO_TOOK_MY_LIGHTER_GAME_ID) {
    throw new Error('Invalid Who Took My Lighter? run')
  }
  ensureAvailable(run, actionId)
  const next = cloneRun(run)

  if (actionId === 'begin:investigation') {
    next.phase = 'evidence'
    pushHistory(next, { type: 'phase', phase: 'evidence' })
    next.narration.push('The scene is small enough to search carefully. Start with what can actually be observed.')
    return next
  }

  if (actionId === 'begin:interrogations') {
    next.phase = 'interrogation'
    pushHistory(next, { type: 'phase', phase: 'interrogation' })
    next.narration.push('There is enough to begin asking questions. Evidence can still be collected as the interviews continue.')
    return next
  }

  const [verb, first, second] = actionId.split(':')
  if (verb === 'inspect') {
    handleInspect(next, first)
    return next
  }
  if (verb === 'interview') {
    handleInterview(next, first, false)
    return next
  }
  if (verb === 'revisit') {
    handleInterview(next, first, true)
    return next
  }
  if (verb === 'ask') {
    handleAsk(next, first, second)
    return next
  }
  if (verb === 'present') {
    handlePresent(next, first, second)
    return next
  }
  if (verb === 'accuse') {
    handleAccusation(next, first)
    return next
  }

  throw new Error(`Unknown action: ${actionId}`)
}

export function playWhoTookMyLighterActions(run, actionIds = []) {
  return actionIds.reduce((state, actionId) => advanceWhoTookMyLighterRun(state, actionId), run)
}

export function serializeWhoTookMyLighterRun(run) {
  if (!run || run.gameId !== WHO_TOOK_MY_LIGHTER_GAME_ID) {
    throw new Error('Cannot serialize invalid Who Took My Lighter? run')
  }
  return JSON.stringify(run)
}

export function restoreWhoTookMyLighterRun(serialized) {
  const parsed = typeof serialized === 'string' ? JSON.parse(serialized) : serialized
  if (!parsed || parsed.gameId !== WHO_TOOK_MY_LIGHTER_GAME_ID || parsed.version !== WHO_TOOK_MY_LIGHTER_RUN_VERSION) {
    throw new Error('Cannot restore incompatible Who Took My Lighter? run')
  }
  const validation = validateWhoTookMyLighterCase(parsed.caseDefinition)
  if (!validation.valid) {
    throw new Error(`Cannot restore invalid Who Took My Lighter? case: ${validation.errors.join('; ')}`)
  }
  return parsed
}
