from pathlib import Path

path = Path('src/features/games/weed-goblins/WeedGoblinsChat.jsx')
text = path.read_text()
old = '''        setState(restored.state)
        setMessages(restored.messages)
        setChoices(restored.choices)
        setPendingTurn(restored.pendingTurn)'''
new = '''        setState(restored.state)
        setMessages(restored.messages)
        setChoices(restored.pendingTurn ? [] : getWeedGoblinsQuickReplies(restored.state))
        setPendingTurn(restored.pendingTurn)'''
if old not in text:
    raise SystemExit('restored choice source not found')
text = text.replace(old, new, 1)
if 'setChoices(restored.choices)' in text:
    raise SystemExit('stale restored choices remain')
path.write_text(text)
print('CHOICE_RESTORE_HARDENING_APPLIED')
