import {
  getAvailableActions,
  getWeedGoblinsActionCheckPreview,
} from './weedGoblinsEngine.js'

const TUTORIAL_MAX_CHAPTER = 2

const AUTOMATIC_GUIDANCE = Object.freeze({
  'session-zero-welcome': 'This plays like texting. Tap a reply to answer me; when a message box is open, you can type or use the microphone instead.',
  'session-zero-name': 'Type a name in the message box. If you want suggestions, ask for help instead of forcing yourself to invent one on command.',
  'session-zero-race': 'Choose a race by tapping one of the replies. This is character flavor, not a hidden test.',
  'session-zero-weapon': 'Pick the weapon you want your character to carry. It changes how some actions are described, not your core stats.',
  'choose-background': 'Your class sets Strength, Defense, and Mana. Hold the E beside my name if you want to see the detailed character information without leaving the conversation.',
  'session-zero-pronoun': 'Choose a pronoun, or skip it. This only changes how the story refers to your character.',
  'session-zero-look': 'Pick one of the descriptions or type your own. The message box works the same way it will during the adventure.',
  'choose-route': 'From here on, the replies are suggested moves, not limits. You can type or speak another idea. If a roll is needed, I will tell you the DC and what you need on the die before you roll.',
  'goblin-encounter': 'You can tap a suggested move, type your own, or tap an underlined story detail to inspect it. The world is meant to be poked at.',
  midpoint: 'Some choices need a roll and some do not. Earlier choices can also create allies or make the next problem easier. Help is here if you get stuck.',
  'goblin-king': 'This is a confrontation, not necessarily a fight. Your class, Mana, and earlier choices can all give you different ways through it.',
})

const LEVEL_ONE = Object.freeze({
  'choose-route': 'Rattlebridge gives you more than one workable way across. Think about whether your traveler is better at Strength, Defense, or spending Mana for a safer attempt.',
  'goblin-encounter': 'The goblin is blocking progress, but that does not mean your only useful verb is hit. Strength, patience, distraction, talking, and Mana can all be legitimate approaches.',
  midpoint: 'There are several kinds of leverage here. Nib, the tribute token, the trail-runes, and simply moving on do not pay off in the same way.',
  'goblin-king': 'You do not have to solve the Goblin King like a combat encounter. Look at what you are good at and remember what happened before you reached this room.',
})

const LEVEL_TWO = Object.freeze({
  'choose-route': 'Quiet Crossing uses Defense. Direct Crossing uses Strength. The Mana crossing gives advantage. If you forgot your numbers, hold the E beside my name.',
  'goblin-encounter': 'Strike uses Strength. Outlasting, bluffing, or distracting usually leans on Defense. The Mana option rolls with advantage when you can afford it.',
  midpoint: 'Helping Nib requires no roll and makes an ally. The tribute token and trail-runes can change the pressure at the Goblin King. Reading the runes costs Mana.',
  'goblin-king': 'Overpower uses Strength. Outlast uses Defense. The spell option costs Mana and gives advantage. If Nib became your ally, a no-roll bargain may also be available.',
})

const THIRD_HELP_OPENERS = Object.freeze([
  'Okay, third Help. You doing all right over there? I ask because I wrote this section far too late at night and apparently decided clarity was a luxury item. That one is on me. No more guessing:',
  'All right, we have reached Help number three. Before I blame you, I should disclose that this part was written at an hour when even the goblins had gone to bed. Past-me made choices. Here is the answer:',
  'Okay. Three Helps. I am going to check that you are still with me, then admit I was up absurdly late writing this bit and clearly thought confusion built character. It does not. Do this:',
])

function cleanChapterNumber(value) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : 1
}

export function shouldShowAutomaticWeedGoblinsGuidance(chapterNumber) {
  return cleanChapterNumber(chapterNumber) <= TUTORIAL_MAX_CHAPTER
}

export function getWeedGoblinsAutomaticGuidance(state, chapterNumber = 1) {
  if (!state || state.status === 'completed') return ''
  if (!shouldShowAutomaticWeedGoblinsGuidance(chapterNumber)) return ''
  return AUTOMATIC_GUIDANCE[state.sceneId] || ''
}

export function getWeedGoblinsHelpContextKey(state, chapterNumber = 1) {
  if (!state || state.status === 'completed') return ''
  return [
    cleanChapterNumber(chapterNumber),
    state.currentRoomId || 'no-room',
    state.sceneId || 'no-scene',
  ].join(':')
}

function checkSuccessProbability(preview) {
  if (!preview?.requiresRoll || !preview.requiredDie) return 0
  const single = Math.max(0, Math.min(1, (21 - preview.requiredDie) / 20))
  return preview.advantage ? 1 - ((1 - single) ** 2) : single
}

function strongestBuiltInCheck(state) {
  const checks = getAvailableActions(state)
    .map((action) => ({
      action,
      preview: getWeedGoblinsActionCheckPreview(state, action.id),
    }))
    .filter(({ preview }) => preview.requiresRoll)
    .map((entry) => ({ ...entry, probability: checkSuccessProbability(entry.preview) }))
    .sort((left, right) => right.probability - left.probability)
  return checks[0] || null
}

function directAnswerForState(state) {
  if (!state) return 'Pick one of the visible replies and keep moving. You are not supposed to guess a secret command.'

  if (state.sceneId === 'choose-route') {
    const best = strongestBuiltInCheck(state)
    const bestLabel = best?.action?.label || 'the crossing that uses your higher stat'
    const mana = Number(state.stats?.manaPool) || 0
    const manaNote = mana >= 1
      ? ' If you would rather spend 1 Mana, use the Mana crossing for advantage.'
      : ''
    return `For your current stats, the cleanest built-in choice is “${bestLabel}.”${manaNote} You may still type a different plan if you want.`
  }

  if (state.sceneId === 'goblin-encounter') {
    const best = strongestBuiltInCheck(state)
    const bestLabel = best?.action?.label || 'the move that uses your stronger stat'
    return `If you just want the best built-in mechanical chance, choose “${bestLabel}.” There is no hidden required solution; a typed bluff, distraction, or other sensible plan can work too.`
  }

  if (state.sceneId === 'midpoint') {
    return 'If you want the cleanest path forward, help Nib. It requires no roll, makes Nib an ally, and can unlock a bargain when you reach the Goblin King.'
  }

  if (state.sceneId === 'goblin-king') {
    if (state.flags?.goblinAlly) {
      return 'Use the bargain option. Nib being your ally is what makes that no-roll resolution available.'
    }
    const best = strongestBuiltInCheck(state)
    const bestLabel = best?.action?.label || 'the move that uses your strongest available check'
    return `You did not bring the no-roll bargain into this room, so use “${bestLabel}” for the strongest built-in chance. You can still type another concrete plan if you prefer.`
  }

  return 'Choose one of the visible replies or type what you want to try. There is no secret parser command you are expected to know.'
}

function stableVariantIndex(value) {
  const text = String(value ?? '')
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % THIRD_HELP_OPENERS.length
}

export function getWeedGoblinsHelpResponse(state, requestedLevel, chapterNumber = 1) {
  if (!state || state.status === 'completed') return null
  const level = Math.min(3, Math.max(1, Number(requestedLevel) || 1))
  const contextKey = getWeedGoblinsHelpContextKey(state, chapterNumber)

  if (level === 1) {
    return Object.freeze({
      level,
      contextKey,
      text: LEVEL_ONE[state.sceneId]
        || 'Start with what is physically in front of you. The visible replies are examples, and you can type another sensible action.',
      solvesObstacle: false,
    })
  }

  if (level === 2) {
    return Object.freeze({
      level,
      contextKey,
      text: LEVEL_TWO[state.sceneId]
        || 'Use the visible replies to compare the approaches. If one uses your stronger stat or avoids a roll entirely, that is usually the safer way forward.',
      solvesObstacle: false,
    })
  }

  const opener = THIRD_HELP_OPENERS[stableVariantIndex(`${contextKey}:${state.playerName || ''}`)]
  return Object.freeze({
    level,
    contextKey,
    text: `${opener} ${directAnswerForState(state)}`,
    solvesObstacle: true,
  })
}
