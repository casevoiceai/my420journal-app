from pathlib import Path


engine_path = Path('src/features/games/weed-goblins/weedGoblinsEngine.js')
engine = engine_path.read_text()

old_first = "Okay, so you've been chasing five goblins uphill for about an hour. They stole your Brass-Latched Research Case, they are not especially good at escaping with it, and the trail is honestly doing most of the work for you."
new_first = "You've been chasing five goblins uphill for about an hour. They stole your Brass-Latched Research Case, they are not especially good at escaping with it, and the trail is honestly doing most of the work for you."
old_question = "Before you catch up with them, what's your character's name, and are they human, dwarf, elf, or gnome?"
new_question = "What's your character's name, and are they human, dwarf, elf, or gnome?"

for old, new, label in [
    (old_first, new_first, 'opening first line'),
    (old_question, new_question, 'character question'),
]:
    count = engine.count(old)
    if count != 1:
        raise SystemExit(f'{label} replacement count was {count}')
    engine = engine.replace(old, new, 1)

for forbidden in [
    'Okay, so you',
    'Before you catch up with them',
    'you don\'t need to know the rules',
    'before we start',
]:
    if forbidden.lower() in engine.lower():
        raise SystemExit(f'forbidden onboarding bridge remains in engine: {forbidden}')

engine_path.write_text(engine)

# Existing R29 saves must migrate on ordinary restore/refresh. Do not require clearing storage.
for path in [
    Path('src/features/games/weed-goblins/weedGoblinsPersistenceChapterOne.js'),
    Path('src/features/games/weed-goblins/weedGoblinsPersistenceThroughChapterTwo.js'),
    Path('src/features/games/weed-goblins/weedGoblinsPersistence.js'),
]:
    text = path.read_text()
    marker = 'const LEGACY_ELIZA_INTRO_COPY = new Map([\n'
    if marker not in text:
        raise SystemExit(f'legacy intro migration map missing in {path}')
    migrations = ''.join([
        f'  [{old_first!r}, {new_first!r}],\n',
        f'  [{old_question!r}, {new_question!r}],\n',
    ])
    text = text.replace(marker, marker + migrations, 1)
    path.write_text(text)

print('ZERO_PREAMBLE_R30_APPLIED')
print('EXACT_CHARACTER_QUESTION_APPLIED')
print('R29_SAVE_REFRESH_MIGRATION_APPLIED')
