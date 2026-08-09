import { getCurrentWeedGoblinsRoom } from './weedGoblinsRooms.js'

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function buildWeedGoblinsCharacterSummary(state) {
  if (!state || typeof state !== 'object') return null
  const room = getCurrentWeedGoblinsRoom(state)
  const stolenItem = clean(state.stolenItem)

  return Object.freeze({
    name: clean(state.playerName) || 'Unnamed traveler',
    race: clean(state.playerRace) || 'Not chosen yet',
    pronoun: clean(state.playerPronoun) || '',
    look: clean(state.playerLook) || '',
    className: clean(state.background?.name) || 'Not chosen yet',
    ability: clean(state.background?.ability) || '',
    weapon: clean(state.playerWeapon) || 'Not chosen yet',
    strength: Number(state.stats?.strength) || 0,
    defense: Number(state.stats?.defense) || 0,
    mana: Number(state.stats?.manaPool) || 0,
    maxMana: Number(state.stats?.maxMana) || 0,
    trouble: Number(state.trouble) || 0,
    location: room?.name || '',
    objective: stolenItem
      ? `Take ${stolenItem} back from the Goblin King.`
      : 'Prepare for the Goblin Highlands.',
  })
}
