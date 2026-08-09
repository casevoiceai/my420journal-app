from pathlib import Path
import re

index_path = Path('server/weed-goblins-narration-worker/index.test.js')
index_text = index_path.read_text()
index_text = index_text.replace('/single ordinary failure line/', '/next ordinary failure GM turn/')
index_text = index_text.replace('/single player action setup line/', '/next player action setup GM turn/')

start = index_text.index("test('system prompt defines Eliza as a real GM with an engine boundary'")
index_text = index_text[:start] + r'''test('system prompt defines Eliza as a real GM with a separate fiction register', () => {
  for (const required of [
    'You are Eliza, the GameMaster of Weed Goblins.',
    'TWO REGISTERS, NEVER BLENDED',
    'FICTION REGISTER',
    'TABLE-ASIDE REGISTER',
    'The deterministic engine owns legal actions, DCs, Strength, Defense, Mana, D20 results, Trouble, wounds, Rootcoin, inventory, rewards, rooms, campaign state, and endings.',
    'Dramatize the ruling, not the mathematics behind it.',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})

test('system prompt preserves 7.25 weirdness without forcing jokes', () => {
  for (const required of [
    'Target weirdness around 7.25 out of 10 across the world, not in every sentence.',
    'Story clarity outranks the joke.',
    'treats ridiculous facts as ordinary facts of life',
    'Do not stack three jokes to prove the game is whimsical.',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})

test('system prompt keeps goblins distinct and motivated', () => {
  for (const required of [
    'GOBLIN PERFORMANCE',
    'petty bureaucracy',
    'promotion rivalries',
    'The Goblin King is loud, ceremonial, theatrical, and more frightened than he admits.',
    'Nib wants a promotion and does not want anyone hurt.',
    'Grubbin is practical, competent',
    'Old Tatter is a retired raider',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})

test('system prompt requires varied human cadence and sensory grounding', () => {
  for (const required of [
    'Write like someone improvising coherently out loud',
    'A turn may be one to four sentences depending on the moment.',
    'A brief fragment is allowed when it sounds natural',
    'Do not open narration with "I watch"',
    'two or more connected physical details',
    'sound, smell, temperature, weather on skin, footing, texture, weight, distance, posture, object behavior, and NPC behavior',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})

test('system prompt keeps Eliza separate from S.T.O.N.E.R. and protects safety and canon', () => {
  for (const required of [
    'separate from S.T.O.N.E.R.',
    '1966 ELIZA chatbot',
    "ELIZA's Mirror",
    'Danger tiers are exactly Sprout, Bloom, Harvest, and Wither.',
    'Wound severity is exactly Scraped, Bruised, Broken, and Downed.',
    'Rootcoin is canonically tied to Ashka Greyroot',
    'Do not reveal Ashka Greyroot in Chapter 1 unless the authoritative context explicitly authorizes that reveal.',
    'Never introduce or repeat a real product',
    'When narrationTier is "normal"',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})

test('system prompt keeps opening, continuity, action, and ending contracts without the old narrator lock', () => {
  for (const required of [
    'scene-intro/highlands-opening:',
    'Establish the Highlands with physical orientation and sensory grounding.',
    'Do not introduce Eliza as "the narrator" inside the fiction.',
    'scene-intro/choice-presentation:',
    'Two or three connected details are welcome.',
    'When continuityAnchors is non-empty, naturally include at least one supplied anchor.',
    'player-action-attempt/attempt:',
    'The separate table-aside handles mechanics.',
    'goblin-king-taunt/taunt:',
    "Put fictionalStolenItem visibly under the King's control",
    'No roll has resolved yet.',
    'run-ending/recovery:',
    'run-ending/bargain:',
    'run-ending/escape:',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})
'''
index_path.write_text(index_text)

story_path = Path('server/weed-goblins-narration-worker/story-beats.test.js')
story = story_path.read_text()
start = story.index("test('system prompt defines one continuous one-shot contract for every moment'")
story = story[:start] + r'''test('system prompt defines one continuous human-GM story contract for every moment', () => {
  for (const required of [
    'continuous, specific, responsive, and human',
    'STORY LAW',
    'Keep the premise clear.',
    'Choices grow from visible pressure.',
    'Ground before explaining.',
    'Preserve causality.',
    'Escalate according to tensionLevel',
    'Close the loop.',
    'premise-statement/premise:',
    'scene-intro/highlands-opening:',
    'action-success/success:',
    'ordinary-failure/failure:',
    'natural-one-complication/complication:',
    'midpoint-outcome/midpoint:',
    'goblin-king-taunt/taunt:',
    'player-action-attempt/attempt:',
    'player-action-response/response:',
    'run-ending/recovery:',
    'run-ending/bargain:',
    'run-ending/escape:',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})
'''
story_path.write_text(story)

ai_path = Path('src/features/games/weed-goblins/weedGoblinsAiComplication.test.js')
ai = ai_path.read_text()
start = ai.index("test('highlands opening rejects thematic drift and retries with the canonical welcome and narrator identity'")
ai = ai[:start] + r'''test('highlands opening retries narrator-observer framing and accepts grounded direct narration', async () => {
  const requestBodies = []
  const drafts = [
    'I watch your boot stop beside a fresh goblin footprint while the wind moves through the wet grass.',
    'Cold rain beads on the grass and runs into the heel marks ahead of you. Four sets of little goblin prints cut uphill through the mud, still sharp at the edges. Fresh.',
  ]
  const hook = {
    moment: 'scene-intro',
    outcome: 'intro',
    introKind: 'highlands-opening',
    fallbackText: highlandsOpeningFallback,
    authoritativeText: highlandsOpeningFallback,
    event: { sceneId: 'choose-background', actionId: 'intro:highlands' },
  }

  const result = await generateSceneIntroNarration({
    event: hook.event,
    state,
    hook,
    staticFallbacks: [highlandsOpeningFallback],
    fetchImpl: async (_url, init) => {
      requestBodies.push(JSON.parse(init.body))
      return response(drafts[requestBodies.length - 1])
    },
  })

  assert.equal(result.source, 'ai')
  assert.equal(result.attempts, 2)
  assert.ok(result.validationFailures[0].reasons.includes(
    'uses narrator-observer framing instead of direct scene narration',
  ))
  assert.match(requestBodies[1].correctiveNote, /narrator-observer framing/i)
  assert.equal(result.text, drafts[1])
})

test('highlands opening rejects narrator self-commentary instead of scene-setting', () => {
  const validation = validateGeneratedNarration(
    "I've got a strange feeling, like something's been growing up here while nobody was looking.",
    { moment: 'scene-intro', outcome: 'intro', introKind: 'highlands-opening' },
  )

  assert.equal(validation.valid, false)
  assert.equal(
    validation.reasons.includes('uses narrator self-commentary instead of scene-setting'),
    true,
  )
})

test('highlands opening rejects UI instruction bleeding into narrator voice', () => {
  const validation = validateGeneratedNarration(
    'The goblin tracks climb into the wet grass. Hit Continue when you are ready.',
    { moment: 'scene-intro', outcome: 'intro', introKind: 'highlands-opening' },
  )

  assert.equal(validation.valid, false)
  assert.equal(
    validation.reasons.includes('contains UI instruction in the fiction register'),
    true,
  )
})

test('highlands opening accepts direct sensory narration with mixed rhythm', () => {
  const validation = validateGeneratedNarration(
    'Wind comes down off the ridge cold enough to sting your ears, carrying wet pine and woodsmoke. Four sets of little bootprints cut through the mud. Fresh. Rainwater has only just begun to gather in the heels.',
    { moment: 'scene-intro', outcome: 'intro', introKind: 'highlands-opening' },
  )

  assert.equal(validation.valid, true, validation.reasons.join('; '))
})
'''
ai_path.write_text(ai)
