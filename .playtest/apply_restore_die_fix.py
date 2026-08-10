from pathlib import Path

FILES = [
    Path('src/features/games/weed-goblins/weedGoblinsPersistenceChapterOne.js'),
    Path('src/features/games/weed-goblins/weedGoblinsPersistenceThroughChapterTwo.js'),
    Path('src/features/games/weed-goblins/weedGoblinsPersistence.js'),
]

SAFE_INTEGER_OLD = """function safeInteger(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {\n  const number = Number(value)\n  if (!Number.isInteger(number)) return null\n  return Math.min(max, Math.max(min, number))\n}\n"""

SAFE_INTEGER_NEW = """function safeInteger(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {\n  if (value === null || value === undefined || value === '') return null\n  const number = Number(value)\n  if (!Number.isInteger(number)) return null\n  return Math.min(max, Math.max(min, number))\n}\n"""

for path in FILES:
    text = path.read_text()
    if SAFE_INTEGER_OLD not in text:
        raise SystemExit(f'safeInteger target missing in {path}')
    text = text.replace(SAFE_INTEGER_OLD, SAFE_INTEGER_NEW, 1)

    if path.name in {'weedGoblinsPersistenceChapterOne.js', 'weedGoblinsPersistenceThroughChapterTwo.js'}:
        old = """  const kind = cleanText(message.kind, 40) || 'message'\n  const die = safeInteger(message.die, { min: 1, max: 20 })\n"""
        new = """  const kind = cleanText(message.kind, 40) || 'message'\n  const rawDie = safeInteger(message.die, { min: 1, max: 20 })\n  const die = kind !== 'roll-result' && rawDie === 1 ? null : rawDie\n"""
        if old not in text:
            raise SystemExit(f'message sanitizer target missing in {path}')
        text = text.replace(old, new, 1)
    else:
        old = """function sanitizeMessage(message) {\n  if (!message || typeof message !== 'object' || Array.isArray(message)) return null\n  const die = safeInteger(message.die, { min: 1, max: 20 })\n"""
        new = """function sanitizeMessage(message) {\n  if (!message || typeof message !== 'object' || Array.isArray(message)) return null\n  const kind = cleanText(message.kind, 40) || 'message'\n  const rawDie = safeInteger(message.die, { min: 1, max: 20 })\n  const die = kind !== 'roll-result' && rawDie === 1 ? null : rawDie\n"""
        if old not in text:
            raise SystemExit(f'message sanitizer target missing in {path}')
        text = text.replace(old, new, 1)
        old_kind = """    kind: cleanText(message.kind, 40) || 'message',\n"""
        if old_kind not in text:
            raise SystemExit(f'kind return target missing in {path}')
        text = text.replace(old_kind, """    kind,\n""", 1)

    path.write_text(text)

print('RESTORE_DIE_FIX_APPLIED')
