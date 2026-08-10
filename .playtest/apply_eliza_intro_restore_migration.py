from pathlib import Path

FILES = [
    Path('src/features/games/weed-goblins/weedGoblinsPersistenceChapterOne.js'),
    Path('src/features/games/weed-goblins/weedGoblinsPersistenceThroughChapterTwo.js'),
    Path('src/features/games/weed-goblins/weedGoblinsPersistence.js'),
]

OLD_ONE = "I'm Eliza, and I'll be running the game. You tell me what your character tries; when a rule matters, I'll explain it right where it comes up."
NEW_ONE = "I'm Eliza. I'll be running everything from here, the goblins, the weather, whoever's dumb enough to get in your way. Tell me what you're trying to do and I'll tell you what happens."
OLD_TWO = "I'll usually put a few obvious choices in front of you so you're never left guessing what you can try, but they're suggestions, not limits. If you want something else, just say what you're doing."
NEW_TWO = "Sometimes I'll toss out a couple of obvious moves so you're not staring at a blank box. Ignore them if you've got something better."

HELPER = f'''const LEGACY_ELIZA_INTRO_COPY = new Map([\n  [{OLD_ONE!r}, {NEW_ONE!r}],\n  [{OLD_TWO!r}, {NEW_TWO!r}],\n])\n\nfunction migrateElizaIntroText(value, maxLength = 1000) {{\n  const clean = cleanText(value, maxLength)\n  return LEGACY_ELIZA_INTRO_COPY.get(clean) || clean\n}}\n\n'''

for path in FILES:
    text = path.read_text()
    marker = 'function safeJsonClone(value, maxBytes = 100_000) {'
    if marker not in text:
        raise SystemExit(f'safeJsonClone marker missing in {path}')
    text = text.replace(marker, HELPER + marker, 1)

    old_narration_multiline = '''    .map((line) => cleanText(line, 600))\n'''
    old_narration_inline = 'return narration.slice(-MAX_NARRATION_LINES).map((line) => cleanText(line, 600)).filter(Boolean)'
    if old_narration_multiline in text:
        text = text.replace(old_narration_multiline, '''    .map((line) => migrateElizaIntroText(line, 600))\n''', 1)
    elif old_narration_inline in text:
        text = text.replace(old_narration_inline, 'return narration.slice(-MAX_NARRATION_LINES).map((line) => migrateElizaIntroText(line, 600)).filter(Boolean)', 1)
    else:
        raise SystemExit(f'narration sanitizer target missing in {path}')

    message_target = '    text: cleanText(message.text, 1000),'
    if message_target not in text:
        raise SystemExit(f'message text target missing in {path}')
    text = text.replace(message_target, '    text: migrateElizaIntroText(message.text, 1000),', 1)

    path.write_text(text)

print('ELIZA_INTRO_RESTORE_MIGRATION_APPLIED')
