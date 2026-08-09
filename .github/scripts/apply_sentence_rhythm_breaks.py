from pathlib import Path

branch_prompt = Path('server/weed-goblins-narration-worker/legacyChapterOne.js')
text = branch_prompt.read_text()
old = '''- Fragments are punctuation for dramatic effect, not the default structure. A short fragment can sharpen an image, land a joke, create suspense, or change tempo inside a substantial bubble. A standalone fragment is rare and must earn the interruption. Never stack fragment after fragment merely to manufacture drama.\n- Do not make every sentence complete, equally weighted, or approximately the same length.\n'''
new = '''- Fragments are punctuation for dramatic effect, not the default structure. A short fragment can sharpen an image, land a joke, create suspense, or change tempo inside a substantial bubble. A standalone fragment is rare and must earn the interruption. Never stack fragment after fragment merely to manufacture drama.\n- Vary sentence completeness inside a substantial bubble. When there is a natural stress point, roughly one sentence in four or five may break grammatical completeness: a noun phrase, a clipped observation, an interrupted clause, or a thought that trails off. Do not force a break just to hit a quota.\n- Put the incomplete beat where a human speaker would actually shorten up: the highest tension, the sharpest visual detail, the sudden realization, or the dry punch of the joke. Let the surrounding sentences stay fuller and more descriptive.\n- This is a rhythm tool, not a content tool. Create the fragment or trail-off by reshaping information already present in the beat. Do not invent new plot facts, sensory details, or consequences merely to manufacture a break.\n- A trailing or interrupted thought may use a single em dash when the spoken rhythm genuinely cuts off. Use that sparingly, not as routine clause punctuation. Do not use an en dash.\n- Do not make every sentence complete, equally weighted, or approximately the same length.\n'''
if old not in text:
    raise SystemExit('cadence target not found')
text = text.replace(old, new, 1)
old_output = '- Do not use em dashes or en dashes. Use normal spoken punctuation.\n'
new_output = '- Em dashes are permitted only for a deliberate interrupted or trailing spoken thought. Do not use them as routine connective punctuation, and do not use en dashes.\n'
if old_output not in text:
    raise SystemExit('dash output target not found')
text = text.replace(old_output, new_output, 1)
branch_prompt.write_text(text)

validator = Path('src/features/games/weed-goblins/weedGoblinsNarrationValidation.js')
text = validator.read_text()
text = text.replace("const BANNED_DASH_SIGNAL = /[\\u2013\\u2014]/", "const BANNED_DASH_SIGNAL = /[\\u2013]/", 1)
text = text.replace("if (BANNED_DASH_SIGNAL.test(text)) reasons.push('uses an em dash or en dash')", "if (BANNED_DASH_SIGNAL.test(text)) reasons.push('uses an en dash')", 1)
validator.write_text(text)

voice_test = Path('server/weed-goblins-narration-worker/voice-audit.test.js')
text = voice_test.read_text()
anchor = '''test('prompt limits hedge explanations and breaks the repeated triad cadence', () => {\n'''
insert = '''test('prompt varies sentence completeness without undoing coherent bubble chunking', () => {\n  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /roughly one sentence in four or five may break grammatical completeness/)\n  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /highest tension, the sharpest visual detail, the sudden realization, or the dry punch of the joke/)\n  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /This is a rhythm tool, not a content tool/)\n  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /single em dash when the spoken rhythm genuinely cuts off/)\n  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /Do not force a break just to hit a quota/)\n})\n\ntest('validator permits a deliberate em-dash trail-off but still rejects an en dash', () => {\n  const emDash = validateGeneratedNarration(\n    'The bottle-cap line trembles once, then goes still. Something moved beneath the bridge—',\n    { moment: 'scene-intro', outcome: 'intro', introKind: 'scene-transition' },\n  )\n  assert.equal(emDash.valid, true, emDash.reasons.join('; '))\n\n  const enDash = validateGeneratedNarration(\n    'The bridge is quiet – too quiet to trust.',\n    { moment: 'scene-intro', outcome: 'intro', introKind: 'scene-transition' },\n  )\n  assert.ok(enDash.reasons.includes('uses an en dash'))\n})\n\n'''
if anchor not in text:
    raise SystemExit('voice test anchor not found')
text = text.replace(anchor, insert + anchor, 1)
voice_test.write_text(text)

index_test = Path('server/weed-goblins-narration-worker/index.test.js')
text = index_test.read_text()
old_req = '''    'Fragments are punctuation for dramatic effect, not the default structure.',\n    'Do not open narration with "I watch"',\n'''
new_req = '''    'Fragments are punctuation for dramatic effect, not the default structure.',\n    'roughly one sentence in four or five may break grammatical completeness',\n    'This is a rhythm tool, not a content tool.',\n    'Do not open narration with "I watch"',\n'''
if old_req not in text:
    raise SystemExit('index test target not found')
text = text.replace(old_req, new_req, 1)
index_test.write_text(text)
