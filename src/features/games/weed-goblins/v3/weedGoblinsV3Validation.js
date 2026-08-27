const SCENES = new Set([
  'starter:welcome', 'starter:name', 'starter:ancestry-browse', 'starter:identity-questions',
  'starter:armory-intro', 'starter:weapon-browse', 'starter:background-browse',
  'starter:departure', 'starter:theft-threshold', 'starter:complete',
])

export function validateV3State(state) {
  if (!state || state.version !== 3) throw new Error('Invalid Weed Goblins V3 version.')
  if (!SCENES.has(state.sceneId)) throw new Error(`Invalid V3 scene: ${state.sceneId}`)
  if (!state.runId || !state.campaignId || !state.seed) throw new Error('V3 state requires run, campaign, and seed identifiers.')
  if (!state.player || !Array.isArray(state.player.characterFacts)) throw new Error('V3 player state is malformed.')
  if (!state.previewing || !Array.isArray(state.inspected.weaponIds)) throw new Error('V3 preview/inspection state is malformed.')
  if (!Array.isArray(state.selectedQuestionIds) || !state.questionAnswers || typeof state.questionAnswers !== 'object') throw new Error('V3 question state is malformed.')
  return true
}
