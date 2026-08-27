import { seededOrder, seededUnit } from './weedGoblinsV3Seed.js'

function notLaterPool(question) {
  return !question.tags.includes('later-pool') && !question.tags.includes('later-sensitive')
}

export function selectStarterQuestions({ questions, ancestryId, seed, count = 3, priorIds = [] }) {
  const prior = new Set(priorIds)
  const valid = questions.filter((question) => notLaterPool(question) && (!question.ancestryId || question.ancestryId === ancestryId) && !prior.has(question.id))
  const ancestrySpecific = valid.filter((question) => question.ancestryId === ancestryId)
  const grounding = valid.filter((question) => !question.ancestryId && question.tags.includes('grounding'))
  const personality = valid.filter((question) => !question.ancestryId && (question.tags.includes('personality') || question.tags.includes('attitude')))
  const selected = []

  const takeFirst = (pool, namespace) => {
    const candidate = seededOrder(pool.filter((question) => !selected.includes(question)), { seed, namespace })[0]
    if (candidate) selected.push(candidate)
  }

  takeFirst(grounding, 'starter-question:grounding')
  if (ancestrySpecific.length > 0) takeFirst(ancestrySpecific, `starter-question:${ancestryId}`)
  takeFirst(personality, 'starter-question:personality')

  const remainder = seededOrder(valid.filter((question) => !selected.includes(question)), { seed, namespace: 'starter-question:remainder' })
  for (const question of remainder) {
    if (selected.length >= count) break
    selected.push(question)
  }
  return selected.slice(0, Math.max(1, count))
}

export function sableBanterIndex({ seed, weaponId, inspectedCount = 0, variantCount = 2 }) {
  return Math.floor(seededUnit(seed, `sable:${weaponId}:${inspectedCount}`) * Math.max(1, variantCount))
}

export function departureCallback({ state }) {
  const weapon = state.player.weaponId
  const fact = state.player.characterFacts?.find((item) => item.key === 'keepsake_type')
  const promise = state.player.characterFacts?.find((item) => item.key === 'departure_promise')
  const parts = []

  if (weapon === 'battle-axe') parts.push(`Sable watches the axe settle against your shoulder. “Try to remember that not every architectural disagreement requires a final argument.”`)
  else if (weapon === 'daggers') parts.push(`Sable nods toward the paired sheaths. “If you solve every problem at that distance, eventually one of the problems will know your birthday.”`)
  else if (weapon === 'bow') parts.push(`Sable gives the bowstring one final glance. “Distance is useful. So is remembering that roads have corners.”`)
  else if (weapon === 'bo-staff') parts.push(`Sable taps the staff once against the floor. “A sensible object. Which means I expect you to use it for something completely unreasonable.”`)
  else if (weapon === 'mace') parts.push(`Sable looks at the mace, then at the shop door. “Please wait until you are outside before discovering whether anything nearby is structurally important.”`)
  else parts.push(`Sable rests one hand on the counter. “A sword. Reliable, adaptable, and unlikely to develop opinions while you sleep. Luxury.”`)

  if (fact?.value === 'spoon') parts.push(`Sable's eyes flick briefly toward your pack. “And if the spoon becomes relevant, I would genuinely prefer the full story later.”`)
  if (promise?.value === 'alive') parts.push(`At the doorway Sable adds, quieter, “Whoever asked you to come back alive had the right idea.”`)
  return parts
}
