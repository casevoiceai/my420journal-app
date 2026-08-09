const MAX_GAMEPLAY_CHOICES = 5

function suggestedChoice(id, label, playerAction) {
  return Object.freeze({
    id,
    label,
    playerAction,
    inputMode: 'free-text',
  })
}

function routeSuggestions() {
  return [
    suggestedChoice(
      'suggested:route:mana-crossing',
      'Use Mana to read the safest crossing',
      'Use Mana to read the safest way across Rattlebridge',
    ),
    suggestedChoice(
      'suggested:route:break-alarm',
      'Break through an alarm line',
      'Break an alarm line and push across Rattlebridge',
    ),
    suggestedChoice(
      'suggested:route:side-ropes',
      'Crawl along the side ropes',
      'Sneak across Rattlebridge along the side ropes',
    ),
  ]
}

function goblinSuggestions(state) {
  const goblin = state?.goblinName || 'the goblin'
  return [
    suggestedChoice(
      'suggested:goblin:persuade',
      `Talk your way past ${goblin}`,
      `Persuade ${goblin} to let me pass`,
    ),
    suggestedChoice(
      'suggested:goblin:distract',
      `Distract ${goblin}`,
      `Distract ${goblin} and slip past`,
    ),
    suggestedChoice(
      'suggested:goblin:charge',
      `Rush past ${goblin}`,
      `Shove past ${goblin} and keep moving`,
    ),
  ]
}

function midpointSuggestions() {
  return [
    suggestedChoice(
      'suggested:midpoint:climb-around',
      'Climb around the tripwire',
      'Carefully climb around the tripwire at Cloudberry Shelf',
    ),
    suggestedChoice(
      'suggested:midpoint:force-line',
      'Force the snagged line loose',
      'Pull the snagged tripwire loose with force',
    ),
  ]
}

function bossSuggestions(state) {
  const stolenItem = state?.stolenItem || 'my stolen item'
  return [
    suggestedChoice(
      'suggested:boss:persuade',
      'Talk him into giving it back',
      `Persuade the Goblin King to give ${stolenItem} back`,
    ),
    suggestedChoice(
      'suggested:boss:procedure',
      'Bluff him with goblin procedure',
      'Bluff the Goblin King with an invented goblin procedure',
    ),
  ]
}

function suggestionsForState(state) {
  if (state?.sceneId === 'choose-route') return routeSuggestions()
  if (state?.sceneId === 'goblin-encounter') return goblinSuggestions(state)
  if (state?.sceneId === 'midpoint') return midpointSuggestions()
  if (state?.sceneId === 'goblin-king') return bossSuggestions(state)
  return []
}

export function composeWeedGoblinsContextualChoices(state, engineActions = []) {
  const base = Array.isArray(engineActions) ? engineActions : []
  const suggestions = suggestionsForState(state)
  if (suggestions.length === 0) return Object.freeze([...base])

  return Object.freeze([
    ...base,
    ...suggestions,
  ].slice(0, MAX_GAMEPLAY_CHOICES))
}

export function isWeedGoblinsSuggestedChoice(choice) {
  return Boolean(
    choice
      && choice.inputMode === 'free-text'
      && typeof choice.playerAction === 'string'
      && choice.playerAction.trim(),
  )
}
