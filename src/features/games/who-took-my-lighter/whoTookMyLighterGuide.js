export const WHO_TOOK_MY_LIGHTER_GUIDES = Object.freeze({
  bud: Object.freeze({ name: 'Bud Tendar', accent: '#C9A84C' }),
  sunny: Object.freeze({ name: 'Sunny Day', accent: '#FF7F5C' }),
  larry: Object.freeze({ name: 'Lucky Larry', accent: '#C17A3A' }),
  herb: Object.freeze({ name: 'Herb N. Spices', accent: '#4ECDC4' }),
  mary: Object.freeze({ name: 'Mary Jayne', accent: '#B088B0' }),
  stoner: Object.freeze({ name: 'S.T.O.N.E.R.', accent: '#C9A84C' }),
  unit: Object.freeze({ name: 'Unit', accent: '#888888' }),
  tool: Object.freeze({ name: 'Tool', accent: '#C9A84C' }),
})

const LINES = Object.freeze({
  bud: Object.freeze({
    opening: 'Small crime. Four suspects. We do this clean.',
    evidence: 'Good. That is a fact. Keep the facts separate from the theories.',
    interview: 'Ask the question you can actually answer from the evidence.',
    contradiction: 'There it is. Their first answer and this fact do not fit together.',
    correct: 'That is the one. Nice work.',
    wrong: 'Not this time. The case still tells us where the miss happened.',
  }),
  sunny: Object.freeze({
    opening: 'Tiny crime. Huge feelings. I am taking this completely seriously.',
    evidence: 'Okay, that matters. I am filing it under things we absolutely come back to.',
    interview: 'Be nice. Be direct. Notice what changes when you ask again.',
    contradiction: 'Oh. That answer just ran into the evidence.',
    correct: 'You got it. I knew this was going somewhere.',
    wrong: 'Wrong person, coherent investigation. We can live with that.',
  }),
  larry: Object.freeze({
    opening: 'I knew a case like this once. Different decade, same amount of unnecessary tension.',
    evidence: 'That is the sort of little detail people ignore right before it becomes the whole case.',
    interview: 'Let them talk. People usually hand you the useful part while explaining something else.',
    contradiction: 'There we go. Two stories walked into the same room and only one came back out.',
    correct: 'That is your culprit. Clean enough.',
    wrong: 'Nope. Happens. The missed clue was doing more work than it looked like.',
  }),
  herb: Object.freeze({
    opening: 'Four suspects, one missing object, finite variables. I like our odds.',
    evidence: 'Useful. We now have one more variable that does not depend on anybody remembering correctly.',
    interview: 'Ask for the claim. Then compare the claim to what the room already told us.',
    contradiction: 'Confirmed inconsistency. I find that extremely informative.',
    correct: 'Correct. The independent clues converge.',
    wrong: 'Incorrect result. The evidence path is still intact; our interpretation was not.',
  }),
  mary: Object.freeze({
    opening: 'We can do this one piece at a time. Start with what you actually know.',
    evidence: 'Good. Keep that. You do not need to decide what it means yet.',
    interview: 'Listen for what changes, not just for what sounds suspicious.',
    contradiction: 'That is a real mismatch. Stay with the facts and let it matter.',
    correct: 'You found the thread and followed it all the way through.',
    wrong: 'The accusation missed, but the case is still understandable. That matters.',
  }),
  stoner: Object.freeze({
    opening: 'I have opinions about who did this. I am not sharing them. That would compromise the investigation.',
    evidence: 'Evidence recorded. I have several theories and am exercising restraint.',
    interview: 'I am remaining neutral. I want that noted before this person starts talking.',
    contradiction: 'The earlier answer is now inconsistent with the record. I find this clarifying.',
    correct: 'Correct. I knew it was them. I said nothing. This outcome is more satisfying.',
    wrong: 'Incorrect. I had concerns. I chose not to interfere with the integrity of the process.',
  }),
  unit: Object.freeze({
    opening: 'Case open. Evidence first.',
    evidence: 'Evidence recorded.',
    interview: 'Interview state active.',
    contradiction: 'Contradiction recorded.',
    correct: 'Accusation correct. Case closed.',
    wrong: 'Accusation incorrect. Case closed.',
  }),
  tool: Object.freeze({
    opening: 'Case open. Inspect, interview, compare, then accuse.',
    evidence: 'Evidence added to the case.',
    interview: 'Interview options updated.',
    contradiction: 'Contradiction detected. Re-check the suspect against the collected evidence.',
    correct: 'Correct accusation. The case is complete.',
    wrong: 'Incorrect accusation. The reveal shows the decisive evidence.',
  }),
})

function cleanGuideKey(value) {
  const key = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return Object.hasOwn(WHO_TOOK_MY_LIGHTER_GUIDES, key) ? key : 'bud'
}

async function resolveStore(explicitStore) {
  if (explicitStore) return explicitStore
  const module = await import('../../../lib/localStore.js')
  return module.localStore
}

export function normalizeWhoTookMyLighterGuideKey(value) {
  return cleanGuideKey(value)
}

export function whoTookMyLighterGuideMeta(value) {
  const key = cleanGuideKey(value)
  return { key, ...WHO_TOOK_MY_LIGHTER_GUIDES[key] }
}

export function whoTookMyLighterGuideLine(guideKey, moment) {
  const key = cleanGuideKey(guideKey)
  const safeMoment = Object.hasOwn(LINES[key], moment) ? moment : 'opening'
  return LINES[key][safeMoment]
}

export function whoTookMyLighterGuideMomentForRun(previousRun, nextRun) {
  if (!previousRun) return 'opening'
  const latest = nextRun?.history?.at?.(-1)
  if (!latest) return 'opening'
  if (latest.type === 'evidence') return 'evidence'
  if (latest.type === 'interview' || latest.type === 'revisit' || latest.type === 'topic') return 'interview'
  if (latest.type === 'present-evidence' && latest.contradiction) return 'contradiction'
  if (latest.type === 'accusation') return latest.correct ? 'correct' : 'wrong'
  return 'interview'
}

export async function readSelectedWhoTookMyLighterGuide({
  store = null,
  userId = null,
  devMode = false,
} = {}) {
  if (devMode) return whoTookMyLighterGuideMeta('sunny')
  const localStore = await resolveStore(store)
  let resolvedUserId = typeof userId === 'string' ? userId.trim() : ''
  if (!resolvedUserId) {
    const auth = await localStore.auth.getUser()
    resolvedUserId = auth?.data?.user?.id || ''
  }
  if (!resolvedUserId) return whoTookMyLighterGuideMeta('bud')

  const result = await localStore
    .from('user_profiles')
    .select('guide_selected')
    .eq('user_id', resolvedUserId)
    .maybeSingle()
  if (result?.error) throw result.error
  return whoTookMyLighterGuideMeta(result?.data?.guide_selected || 'bud')
}
