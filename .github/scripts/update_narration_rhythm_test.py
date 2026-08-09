from pathlib import Path

path = Path('server/weed-goblins-narration-worker/index.test.js')
text = path.read_text()

replacements = {
    "'A turn may be one to four sentences depending on the moment.',": "'One GM turn is one coherent messenger bubble, usually two to five sentences',",
    "'A brief fragment is allowed when it sounds natural',": "'Fragments are punctuation for dramatic effect, not the default structure.',",
}

for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f'Expected obsolete narration assertion not found: {old}')
    text = text.replace(old, new, 1)

path.write_text(text)
