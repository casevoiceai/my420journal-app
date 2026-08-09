from pathlib import Path

worker_path = Path('server/weed-goblins-narration-worker/legacyChapterOne.js')
worker = worker_path.read_text()
worker = worker.replace(
    '- A trailing or interrupted thought may use a single em dash when the spoken rhythm genuinely cuts off. Use that sparingly, not as routine clause punctuation. Do not use an en dash.',
    '- A trailing or interrupted thought must use sentence shape, a period, an ellipsis, or a deliberate fragment. Never use an em dash or en dash.',
)
worker = worker.replace(
    '- Em dashes are permitted only for a deliberate interrupted or trailing spoken thought. Do not use them as routine connective punctuation, and do not use en dashes.',
    '- Never use an em dash or en dash. Create interruption and trailing rhythm with sentence structure, periods, ellipses, or fragments instead.',
)
if 'Never use an em dash or en dash.' not in worker:
    raise SystemExit('hard no-dash rule was not applied to worker prompt')
worker_path.write_text(worker)

validator_path = Path('src/features/games/weed-goblins/weedGoblinsNarrationValidation.js')
validator = validator_path.read_text()
validator = validator.replace("const BANNED_DASH_SIGNAL = /[\\u2013]/", "const BANNED_DASH_SIGNAL = /[\\u2013\\u2014]/")
validator = validator.replace("reasons.push('uses an en dash')", "reasons.push('uses an em dash or en dash')")
validator_path.write_text(validator)

voice_test_path = Path('server/weed-goblins-narration-worker/voice-audit.test.js')
voice_test = voice_test_path.read_text()
voice_test = voice_test.replace(
    "assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /single em dash when the spoken rhythm genuinely cuts off/)",
    "assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /period, an ellipsis, or a deliberate fragment/)",
)
old = "test('validator permits a deliberate em-dash trail-off but still rejects an en dash', () => {"
if old in voice_test:
    start = voice_test.index(old)
    next_test = voice_test.find("\ntest(", start + len(old))
    end = len(voice_test) if next_test == -1 else next_test + 1
    replacement = '''test('validator rejects both em dash and en dash punctuation', () => {\n  const emDash = validateGeneratedNarration(\n    'Something red moves behind the window \\u2014 then the cloud closes over it.',\n    { moment: 'scene-intro', outcome: 'intro', introKind: 'scene-transition' },\n  )\n  assert.ok(emDash.reasons.includes('uses an em dash or en dash'))\n\n  const enDash = validateGeneratedNarration(\n    'The bridge is narrow \\u2013 narrower than it looked from the trail.',\n    { moment: 'scene-intro', outcome: 'intro', introKind: 'scene-transition' },\n  )\n  assert.ok(enDash.reasons.includes('uses an em dash or en dash'))\n})\n\n'''
    voice_test = voice_test[:start] + replacement + voice_test[end:]
elif "test('validator rejects both em dash and en dash punctuation'" not in voice_test:
    voice_test += '''\ntest('validator rejects both em dash and en dash punctuation', () => {\n  const emDash = validateGeneratedNarration(\n    'Something red moves behind the window \\u2014 then the cloud closes over it.',\n    { moment: 'scene-intro', outcome: 'intro', introKind: 'scene-transition' },\n  )\n  assert.ok(emDash.reasons.includes('uses an em dash or en dash'))\n\n  const enDash = validateGeneratedNarration(\n    'The bridge is narrow \\u2013 narrower than it looked from the trail.',\n    { moment: 'scene-intro', outcome: 'intro', introKind: 'scene-transition' },\n  )\n  assert.ok(enDash.reasons.includes('uses an em dash or en dash'))\n})\n'''
voice_test_path.write_text(voice_test)
