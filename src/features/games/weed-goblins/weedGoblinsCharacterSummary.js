import { CHAPTER_TWO_LOCATIONS } from './weedGoblinsChapterTwo.js'
import { CHAPTER_THREE_LOCATIONS } from './weedGoblinsChapterThree.js'
import { buildWeedGoblinsCharacterSummary as buildChapterOneSummary } from './weedGoblinsCharacterSummaryChapterOne.js'

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function baseSummary(state, roomName, objective) {
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
    rootcoin: Number(state.rootcoin) || 0,
    wound: clean(state.wound) || 'None',
    location: roomName || '',
    objective,
  })
}

export function buildWeedGoblinsCharacterSummary(state) {
  if (state?.chapterNumber === 3) {
    const room = Object.values(CHAPTER_THREE_LOCATIONS).find((candidate) => candidate.id === state.currentRoomId)
    const groveState = clean(state.chapterThree?.groveState)
    return baseSummary(
      state,
      room?.name,
      groveState
        ? `Carry the ${groveState} grove consequence forward and follow the Living Root Map toward the Sunken Greenhouse.`
        : 'Learn what is siphoning growth from the Withered Grove, rescue the nursery, survive the Nightly Draw, and decide what happens to the root network.',
    )
  }
  if (state?.chapterNumber === 2) {
    const room = Object.values(CHAPTER_TWO_LOCATIONS).find((candidate) => candidate.id === state.currentRoomId)
    return baseSummary(
      state,
      room?.name,
      'Trace the Cultivator’s tithe through the Hollow Market and leave with the Harvest Ledger trail to the Withered Grove.',
    )
  }
  return buildChapterOneSummary(state)
}
