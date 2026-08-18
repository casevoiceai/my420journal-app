export const WEED_GOBLINS_V2_VERSION = 2

export const DC = Object.freeze({
  easy: 8,
  moderate: 11,
  hard: 14,
  severe: 17,
  extreme: 20,
})

export const TROUBLE_LABELS = Object.freeze([
  'Controlled',
  'Complicated',
  'Dangerous',
  'Hot',
])

export const WOUNDS = Object.freeze([
  'None',
  'Scraped',
  'Bruised',
  'Broken',
  'Downed',
])

export const RACES = Object.freeze({
  human: Object.freeze({
    id: 'human',
    label: 'Human',
    traits: Object.freeze(['Adaptable', 'Reads unfamiliar social situations quickly']),
  }),
  dwarf: Object.freeze({
    id: 'dwarf',
    label: 'Dwarf',
    traits: Object.freeze(['Stonewise', 'Steady when bracing against force']),
  }),
  elf: Object.freeze({
    id: 'elf',
    label: 'Elf',
    traits: Object.freeze(['Keen distance vision', 'Natural low-light navigation']),
  }),
  gnome: Object.freeze({
    id: 'gnome',
    label: 'Gnome',
    traits: Object.freeze(['Mechanism sense', 'Notices magical oddities']),
  }),
})

export const WEAPONS = Object.freeze({
  sword: Object.freeze({
    id: 'sword',
    label: 'Sword',
    damage: Object.freeze([8]),
    forceStat: 'strength',
    precisionStat: 'defense',
    identity: 'adaptable',
  }),
  bow: Object.freeze({
    id: 'bow',
    label: 'Bow',
    damage: Object.freeze([8]),
    forceStat: 'strength',
    precisionStat: 'defense',
    identity: 'range',
  }),
  battleAxe: Object.freeze({
    id: 'battle-axe',
    label: 'Battle Axe',
    damage: Object.freeze([10]),
    forceStat: 'strength',
    precisionStat: 'defense',
    identity: 'breach',
  }),
  boStaff: Object.freeze({
    id: 'bo-staff',
    label: 'Bo Staff',
    damage: Object.freeze([8]),
    forceStat: 'strength',
    precisionStat: 'defense',
    identity: 'control',
  }),
  mace: Object.freeze({
    id: 'mace',
    label: 'Mace',
    damage: Object.freeze([8]),
    forceStat: 'strength',
    precisionStat: 'defense',
    identity: 'disruption',
  }),
  daggers: Object.freeze({
    id: 'daggers',
    label: 'Daggers',
    damage: Object.freeze([4, 4]),
    forceStat: 'strength',
    precisionStat: 'defense',
    identity: 'fast-close',
  }),
})

export const BACKGROUNDS = Object.freeze({
  tracker: Object.freeze({
    id: 'tracker',
    label: 'Highland Tracker',
    strength: 3,
    defense: 1,
    maxMana: 2,
    maxHp: 14,
    guard: 11,
    ability: 'Push Through',
    passive: 'Reads ordinary pursuit signs and terrain without a roll.',
  }),
  warden: Object.freeze({
    id: 'warden',
    label: 'Trail Warden',
    strength: 1,
    defense: 3,
    maxMana: 2,
    maxHp: 16,
    guard: 13,
    ability: 'Hold the Line',
    passive: 'Recognizes obvious cover, chokepoints, and defensive threats.',
  }),
  diviner: Object.freeze({
    id: 'diviner',
    label: 'Fen Diviner',
    strength: 1,
    defense: 2,
    maxMana: 4,
    maxHp: 12,
    guard: 12,
    magicalSkill: 2,
    ability: 'Read the Wrong Map Right',
    passive: 'Notices obvious magical irregularities without automatically understanding them.',
  }),
})

export const HIGHLAND_SNEAK = Object.freeze({
  id: 'highland-sneak',
  label: 'Highland Sneak',
  maxHp: 12,
  strength: 1,
  defense: 2,
  guard: 12,
  initiativeModifier: 2,
  attackModifier: 2,
  damage: Object.freeze([4]),
  damageType: 'Physical',
})

export const ROUTES = Object.freeze({
  direct: Object.freeze({
    id: 'direct',
    label: 'Follow them before they reach the bridge',
    timePressure: 'close',
    startingAlarm: 'threatened',
    startingStealth: 'spotted',
  }),
  investigate: Object.freeze({
    id: 'investigate',
    label: 'Check the campsite and tracks first',
    timePressure: 'delayed',
    startingAlarm: 'quiet',
    startingStealth: 'suspicious',
  }),
  high: Object.freeze({
    id: 'high',
    label: 'Take the high trail above the gorge',
    timePressure: 'normal',
    startingAlarm: 'quiet',
    startingStealth: 'unseen',
  }),
})

export const POSITIONS = Object.freeze({
  mainApproach: 'Main Approach',
  sideApproach: 'Side Approach',
  elevated: 'Elevated',
  near: 'Near',
  engaged: 'Engaged',
  cover: 'Cover',
  bridgeEdge: 'Bridge Edge',
  far: 'Far',
})

export function weaponById(id) {
  return Object.values(WEAPONS).find((weapon) => weapon.id === id) || null
}

export function backgroundById(id) {
  return BACKGROUNDS[id] || null
}

export function raceById(id) {
  return RACES[id] || null
}

export function clampTrouble(value) {
  return Math.max(0, Math.min(3, Number.isFinite(value) ? Math.floor(value) : 0))
}

export function healthState(currentHp, maxHp) {
  if (currentHp <= 0) return 'Down'
  const ratio = currentHp / Math.max(1, maxHp)
  if (ratio >= 0.8) return 'Unhurt'
  if (ratio >= 0.5) return 'Hurt'
  if (ratio >= 0.25) return 'Badly Wounded'
  return 'Near Defeat'
}

export function damageDiceLabel(dice) {
  if (!Array.isArray(dice) || dice.length === 0) return '0'
  if (dice.length === 1) return `d${dice[0]}`
  const same = dice.every((die) => die === dice[0])
  return same ? `${dice.length}d${dice[0]}` : dice.map((die) => `d${die}`).join(' + ')
}
