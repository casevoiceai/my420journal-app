from pathlib import Path

path = Path('src/features/games/weed-goblins/WeedGoblinsChat.jsx')
text = path.read_text()
old = "    setHelpMessage(null)\n    setFailedChoiceIds([])\n    if (speechRecognitionRef.current?.abort) speechRecognitionRef.current.abort()\n"
new = "    setHelpMessage(null)\n    setFailedChoiceIds([])\n    setBusy(false)\n    if (speechRecognitionRef.current?.abort) speechRecognitionRef.current.abort()\n"
if old not in text:
    raise SystemExit('restart hardening insertion point missing')
text = text.replace(old, new, 1)
path.write_text(text)
print('RESTART_BUSY_HARDENING_APPLIED')
