from pathlib import Path

path = Path('server/weed-goblins-narration-worker/index.test.js')
text = path.read_text()

old = '''test('system prompt requires varied human cadence and sensory grounding', () => {
  for (const required of [
    'Write like someone improvising coherently out loud',
    'One GM turn is one coherent messenger bubble, usually two to five sentences',
    'Fragments are punctuation for dramatic effect, not the default structure.',
    'roughly one sentence in four or five may break grammatical completeness',
    'This is a rhythm tool, not a content tool.',
    'Do not open narration with "I watch"',
    'two or more connected physical details',
    'sound, smell, temperature, weather on skin, footing, texture, weight, distance, posture, object behavior, and NPC behavior',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})'''

new = '''test('system prompt uses an actual-play conversational register instead of literary density', () => {
  for (const required of [
    'ACTUAL PLAY CORE VOICE',
    'Never introduce yourself, name yourself, explain your role',
    'loose, quick, present-tense, and conversational',
    'Narration can contain the joke.',
    'Spoken messiness is allowed.',
    'Cut atmospheric density hard.',
    'Do not luxuriate in weather, landscape, texture, implied history, or lyrical imagery.',
    'Sound spoken first. Do not polish every turn into a miniature paragraph.',
    'Sensory detail is optional.',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
  assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes('patient, lush, curious'), false)
  assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes('Do not optimize for concision. Optimize for immersion.'), false)
})'''

if old not in text:
    raise SystemExit('old literary cadence regression test not found')

path.write_text(text.replace(old, new, 1))
print('ACTUAL_PLAY_TEST_CONTRACT_UPDATED')
