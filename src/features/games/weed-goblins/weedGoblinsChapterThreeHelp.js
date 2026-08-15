import { CHAPTER_THREE_SCENES } from './weedGoblinsChapterThreeRuntime.js'

function response(level, text, solvesObstacle = false) {
  return Object.freeze({ level, text, solvesObstacle })
}

export function getChapterThreeAutomaticGuidance() {
  return ''
}

export function getChapterThreeHelpContextKey(state) {
  if (!state || state.chapterNumber !== 3) return 'chapter-3:unknown'
  return `chapter-3:${state.sceneId || 'unknown'}`
}

function bestStalkerStat(state) {
  const strength = Number(state?.stats?.strength) || 0
  const defense = Number(state?.stats?.defense) || 0
  return defense >= strength ? 'Defense' : 'Strength'
}

export function getChapterThreeHelpResponse(state, requestedLevel = 1) {
  const level = Math.max(1, Math.min(3, Number(requestedLevel) || 1))
  const sceneId = state?.sceneId

  if (sceneId === CHAPTER_THREE_SCENES.grayVerge) {
    if (level === 1) return response(level, 'Compare what is still alive with what is turning gray. Someone here has already noticed the pattern.')
    if (level === 2) return response(level, 'Corla’s living patch is useful evidence. Watch what nearby trees lose when that patch gains new growth.')
    return response(level, 'The apparent cure is borrowing growth from neighboring trees. Compare the living patch directly to the gray roots to prove it.', true)
  }

  if (sceneId === CHAPTER_THREE_SCENES.memoryRings) {
    if (level === 1) return response(level, 'The rings are not asking when a memory happened. They are asking how a tree becomes a tree.')
    if (level === 2) return response(level, 'Start with the smallest stage of growth and move outward toward the mature tree.')
    return response(level, 'Read them in this order: seed, sapling, canopy.', true)
  }

  if (sceneId === CHAPTER_THREE_SCENES.waterStones) {
    if (level === 1) return response(level, 'There are three stones and three separate needs. Starving one channel solves the wrong problem.')
    if (level === 2) return response(level, 'Preservation, evacuation, and access each need enough water to remain usable.')
    return response(level, 'Put one water stone on preservation, one on evacuation, and one on access.', true)
  }

  if (sceneId === CHAPTER_THREE_SCENES.stalkerTrail) {
    if (level === 1) return response(level, 'You do not have to defeat the Withering Stalker. Learn what it notices before committing to a crossing.')
    if (level === 2) return response(level, 'It reacts to motion and bright magic. Stillness and thick resin trunks create gaps in what it can track.')
    return response(level, `Stay still and watch it first. Once its blind spot is known, use ${bestStalkerStat(state)} for the safer route your character is better at.`, true)
  }

  if (sceneId === CHAPTER_THREE_SCENES.sleepingNursery) {
    if (level === 1) return response(level, 'Earlier choices can make this rescue easier. Check whether you preserved an evacuation route or believed Kip’s timing.')
    if (level === 2) return response(level, 'Balanced water stones can move the root-beds. Kip’s schedule can also tell you when the root pull pauses.')
    return response(level, state?.chapterThree?.waterStonesBalanced
      ? 'Use the evacuation water channel. It rescues the sleeping root-beds without adding an unnecessary roll.'
      : state?.chapterThree?.kipWarningHeeded
        ? 'Move the root-beds on Kip’s whispered count. His schedule gives you the safe intervals.'
        : 'You did not preserve either shortcut. Choose the Strength or Defense rescue that best matches your stats.', true)
  }

  if (sceneId === CHAPTER_THREE_SCENES.siphonWell) {
    if (level === 1) return response(level, 'The goal is preparation, not shutting the whole network down before the Nightly Draw begins.')
    if (level === 2) return response(level, 'Use what you learned earlier. Balanced water can buffer the first pull, and Kip’s numbers can reveal its timing.')
    return response(level, 'Prepare one reliable buffer or timing advantage now. The Nightly Draw is the Wither-tier test that follows.', true)
  }

  if (sceneId === CHAPTER_THREE_SCENES.nightlyDraw) {
    if (level === 1) return response(level, 'This is the peak danger scene. Survival exposes the conduit pattern; you are not required to destroy the whole network here.')
    if (level === 2) return response(level, 'Use a prepared channel if you earned one. Otherwise choose the stronger of Strength or Defense, or spend Mana for advantage if available.')
    return response(level, `Your best base stat here is ${bestStalkerStat(state)}. A prepared channel can reduce the immediate danger tier; Mana can grant advantage but never guarantees success.`, true)
  }

  if (sceneId === CHAPTER_THREE_SCENES.groveDecision) {
    if (level === 1) return response(level, 'There is no mechanically correct final branch. This choice decides what the campaign remembers about the grove.')
    if (level === 2) return response(level, 'Healing preserves connection, quarantine contains corruption, burning weakens the network at a trust cost, redirecting keeps a trail into the enemy, and ignoring Kip leaves the grove drained.')
    return response(level, 'Choose the consequence you want to carry forward. The branches are intentionally different, not ranked from correct to incorrect.', true)
  }

  return response(level, 'Look at the current room, what you have already learned, and which earlier consequence is available to use now.')
}
