import { DIFFICULTY } from './weedGoblinsEngine.js'

export const WEED_GOBLINS_DANGER_TIERS = Object.freeze({
  sprout: Object.freeze({ id: 'sprout', label: 'Sprout', dc: DIFFICULTY.easy }),
  bloom: Object.freeze({ id: 'bloom', label: 'Bloom', dc: DIFFICULTY.standard }),
  harvest: Object.freeze({ id: 'harvest', label: 'Harvest', dc: DIFFICULTY.hard }),
  wither: Object.freeze({ id: 'wither', label: 'Wither', dc: DIFFICULTY.goblinKing }),
})

export function getWeedGoblinsDangerTier(tierId) {
  return WEED_GOBLINS_DANGER_TIERS[String(tierId ?? '')] || WEED_GOBLINS_DANGER_TIERS.bloom
}

export function getWeedGoblinsDangerCheckPreview({
  tierId,
  stat,
  stats = {},
  manaCost = 0,
} = {}) {
  const tier = getWeedGoblinsDangerTier(tierId)
  const statBonus = Number(stats?.[stat]) || 0
  const safeManaCost = Math.max(0, Number(manaCost) || 0)
  return Object.freeze({
    requiresRoll: true,
    stat,
    dc: tier.dc,
    statBonus,
    requiredDie: Math.min(20, Math.max(2, tier.dc - statBonus)),
    manaCost: safeManaCost,
    advantage: safeManaCost > 0,
    dangerTier: tier.id,
  })
}

export function resolveWeedGoblinsDangerRoll({
  tierId,
  statBonus = 0,
  rolls = [],
} = {}) {
  const tier = getWeedGoblinsDangerTier(tierId)
  const safeRolls = Array.isArray(rolls)
    ? rolls.map(Number).filter((value) => Number.isInteger(value) && value >= 1 && value <= 20).slice(0, 2)
    : []
  if (safeRolls.length === 0) throw new Error('At least one d20 roll is required.')
  const roll = Math.max(...safeRolls)
  const total = roll + (Number(statBonus) || 0)
  const naturalOne = roll === 1
  const success = roll === 20 || total >= tier.dc
  return Object.freeze({
    tier,
    rolls: Object.freeze(safeRolls),
    roll,
    total,
    naturalOne,
    success,
    outcome: naturalOne ? 'complication' : success ? 'success' : 'failure',
  })
}
