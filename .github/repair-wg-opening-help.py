from pathlib import Path
import re

chapter_path = Path('src/features/games/weed-goblins/weedGoblinsChapterOne.js')
chapter = chapter_path.read_text()

stale_opening = [
    'Welcome to the THC Trails.',
    'A bell, or maybe just the idea of a bell, rings three times.',
    'Half a beat later, it rings once more. Very regal.',
]
for line in stale_opening:
    if line not in chapter:
        raise SystemExit(f'expected stale opening line missing: {line}')

windcut_pattern = re.compile(r"  windcutTrail: Object\.freeze\(\[.*?\n  \]\),", re.S)
windcut_before_match = windcut_pattern.search(chapter)
if not windcut_before_match:
    raise SystemExit('Windcut investigation block missing before repair')
windcut_before = windcut_before_match.group(0)

approved_opening = '''export const SESSION_ZERO_WELCOME = Object.freeze([
  "You've been chasing five goblins uphill for about an hour. They stole your Brass-Latched Research Case, they are not especially good at escaping with it, and the trail is honestly doing most of the work for you.",
  "There are little bootprints all over the mud, a drag mark from the case, and one extremely clear goblin faceprint where somebody apparently lost an argument with the hill. They got back up. The faceprint did not.",
  "The theft itself was also a mess. While they were taking the case, two of them stopped to argue about whether this counted as theft or 'aggressive redistribution.' A third one produced a form. Nobody knew who was supposed to fill it out. Then they remembered they were escaping and ran.",
  "Now the tracks are heading straight toward the King's Stash Hall, which you can just make out up on the ridge whenever the fog gets out of the way. There's a miserable little bell up there going clonk every so often. Very regal.",
  "What's your character's name, and are they human, dwarf, elf, or gnome?",
])'''
opening_pattern = re.compile(r"export const SESSION_ZERO_WELCOME = Object\.freeze\(\[.*?\n\]\)", re.S)
chapter, count = opening_pattern.subn(approved_opening, chapter, count=1)
if count != 1:
    raise SystemExit(f'Session Zero opening replacement count was {count}')

windcut_after_match = windcut_pattern.search(chapter)
if not windcut_after_match or windcut_after_match.group(0) != windcut_before:
    raise SystemExit('Windcut investigation block changed during premise repair')
for line in stale_opening:
    if line in chapter:
        raise SystemExit(f'stale opening line survived: {line}')
chapter_path.write_text(chapter)

help_path = Path('src/features/games/weed-goblins/weedGoblinsHelpChapterOne.js')
help_text = help_path.read_text()
rejected = "  'session-zero-name': 'Type a name in the message box. If you want suggestions, ask for help instead of forcing yourself to invent one on command.',"
replacement = "  'session-zero-name': 'If you want name suggestions, I can give you a few.',"
if help_text.count(rejected) != 1:
    raise SystemExit('rejected session-zero-name Help line source count was not one')
help_text = help_text.replace(rejected, replacement, 1)
old_fallback = """      text: LEVEL_ONE[state.sceneId]
        || 'Start with what is physically in front of you. The visible replies are examples, and you can type another sensible action.',"""
new_fallback = """      text: LEVEL_ONE[state.sceneId]
        || AUTOMATIC_GUIDANCE[state.sceneId]
        || 'Start with what is physically in front of you. The visible replies are examples, and you can type another sensible action.',"""
if help_text.count(old_fallback) != 1:
    raise SystemExit('Level One Help fallback source count was not one')
help_text = help_text.replace(old_fallback, new_fallback, 1)
if 'Type a name in the message box.' in help_text or 'forcing yourself to invent one on command' in help_text:
    raise SystemExit('rejected UI-referencing Help copy remains')
help_path.write_text(help_text)

chat_path = Path('src/features/games/weed-goblins/WeedGoblinsChat.jsx')
chat = chat_path.read_text()
automatic_import = '  getWeedGoblinsAutomaticGuidance,\n'
if chat.count(automatic_import) != 1:
    raise SystemExit('automatic guidance import source count was not one')
chat = chat.replace(automatic_import, '', 1)
automatic_memo = """  const automaticGuidance = useMemo(
    () => getWeedGoblinsAutomaticGuidance(state, chapterNumber),
    [state, chapterNumber],
  )
"""
if chat.count(automatic_memo) != 1:
    raise SystemExit('automatic guidance memo source count was not one')
chat = chat.replace(automatic_memo, '', 1)
automatic_render = """          {!busy && automaticGuidance && !helpMessage && (
            <div className=\"weed-goblins-game__message-row is-incoming\">
              <article className=\"weed-goblins-game__message-bubble is-eliza weed-goblins-game__guidance-bubble\">
                <p>{automaticGuidance}</p>
              </article>
            </div>
          )}
"""
if chat.count(automatic_render) != 1:
    raise SystemExit('automatic guidance render source count was not one')
chat = chat.replace(automatic_render, '', 1)
if 'automaticGuidance' in chat or 'getWeedGoblinsAutomaticGuidance' in chat or 'weed-goblins-game__guidance-bubble' in chat:
    raise SystemExit('automatic idle guidance remains in chat UI')
if 'onClick={handleHelp}' not in chat:
    raise SystemExit('actual Help button handler is missing')
chat_path.write_text(chat)

print('APPROVED_R30_PREMISE_APPLIED=PASS')
print('WINDCUT_INVESTIGATION_UNTOUCHED=PASS')
print('HELP_COPY_NON_UI=PASS')
print('AUTOMATIC_IDLE_GUIDANCE_REMOVED=PASS')
print('HELP_BUTTON_REMAINS=PASS')
