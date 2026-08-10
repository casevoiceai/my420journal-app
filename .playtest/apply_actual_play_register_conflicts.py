from pathlib import Path


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing expected source for {label}')
    return text.replace(old, new, 1)


for path in [
    Path('server/weed-goblins-narration-worker/chapterTwo.js'),
    Path('server/weed-goblins-narration-worker/chapterThree.js'),
]:
    text = path.read_text()
    text = replace_once(
        text,
        '- Keep the current messenger chunking: exactly one narration line, one or two focused sentences, maximum 300 characters.',
        '- Return one GM turn in the messenger bubble. Use the amount of spoken language the live moment needs. The 300-character limit is a hard transport ceiling, not a sentence quota and not a target.',
        f'{path.name} rigid sentence quota',
    )

    if path.name == 'chapterThree.js':
        text = replace_once(
            text,
            '- withered-grove: quieter and stranger, but still spoken and conversational rather than literary. Let damaged life, exhausted care, and the wrongness beneath ordinary fieldwork set the rhythm.',
            '- withered-grove: quieter and stranger, but still spoken and conversational. Show one practical wrong thing the player can react to, then keep moving.',
            'Chapter 3 literary withered-grove posture',
        )
        text = replace_once(
            text,
            '- discovery: slower and stranger; let one revealing object, contradiction, root pattern, or image hold attention.',
            '- discovery: let one odd or revealing thing land clearly, then keep moving.',
            'Chapter 3 literary discovery posture',
        )

    for forbidden in [
        'one or two focused sentences',
        'patient, lush, curious',
        'melancholy, quiet, uncanny',
        'slower and stranger',
    ]:
        if forbidden in text:
            raise SystemExit(f'conflicting old register remains in {path}: {forbidden}')

    path.write_text(text)

print('ACTUAL_PLAY_REGISTER_CONFLICTS_REMOVED')
print('RIGID_SENTENCE_QUOTAS_REMOVED')
print('CHAPTER_THREE_LITERARY_POSTURES_REMOVED')
