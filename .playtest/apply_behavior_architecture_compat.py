from pathlib import Path


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing expected source for {label}')
    return text.replace(old, new, 1)


chapter_one_path = Path('server/weed-goblins-narration-worker/legacyChapterOne.js')
chapter_one = chapter_one_path.read_text()
chapter_one = replace_once(
    chapter_one,
    '''GOBLIN PERFORMANCE
- Goblins can be more chaotic than Eliza, but behavior comes from a goal, need, fear, or contradiction before it comes from a personality label.''',
    '''GOBLIN PERFORMANCE
- Preserve these established performance anchors beneath the causal DNA:
  - The Goblin King is loud, ceremonial, theatrical, and more frightened than he admits.
  - Nib wants a promotion and does not want anyone hurt. Those desires pull against each other.
  - Grubbin is practical, competent, and resentful that the best goods are sent away as tribute.
  - Old Tatter is a retired raider who has seen enough nonsense to be difficult to impress and can recognize the black-root seal when the story reaches it.
- Goblins can be more chaotic than Eliza, but behavior comes from a goal, need, fear, or contradiction before it comes from a personality label.''',
    'Chapter 1 performance anchors',
)
chapter_one_path.write_text(chapter_one)

for path, state_label in [
    (Path('server/weed-goblins-narration-worker/chapterTwo.js'), 'market state'),
    (Path('server/weed-goblins-narration-worker/chapterThree.js'), 'grove state'),
]:
    text = path.read_text()
    old = f'- The engine owns legal actions, DCs, Strength, Defense, Mana, D20 rolls, Trouble, wounds, Rootcoin, inventory, rewards, room transitions, {state_label}, and endings. Never alter them.'
    new = f'- The engine owns every mechanic and result. That includes legal actions, DCs, Strength, Defense, Mana, D20 rolls, Trouble, wounds, Rootcoin, inventory, rewards, room transitions, {state_label}, and endings. Never alter them.'
    text = replace_once(text, old, new, f'{path.name} engine authority compatibility anchor')
    path.write_text(text)

index_test_path = Path('server/weed-goblins-narration-worker/index.test.js')
index_test = index_test_path.read_text()
old_test = '''test('system prompt requires varied human cadence and sensory grounding', () => {
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
new_test = '''test('system prompt uses an actual-play conversational register instead of literary density', () => {
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
index_test = replace_once(
    index_test,
    old_test,
    new_test,
    'actual-play index regression test',
)
index_test_path.write_text(index_test)

for path in [
    chapter_one_path,
    Path('server/weed-goblins-narration-worker/chapterTwo.js'),
    Path('server/weed-goblins-narration-worker/chapterThree.js'),
]:
    text = path.read_text()
    if '\u2014' in text or '\u2013' in text:
        raise SystemExit(f'forbidden dash character present after compatibility patch: {path}')

print('BEHAVIOR_ARCHITECTURE_COMPAT_APPLIED')
print('ACTUAL_PLAY_INDEX_TEST_UPDATED')
