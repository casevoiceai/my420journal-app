from pathlib import Path
import re

engine_path = Path('src/features/games/weed-goblins/weedGoblinsEngine.js')
engine = engine_path.read_text()

approved_opening = '''export const SESSION_ZERO_WELCOME = Object.freeze([
  "By the time the road finally gives up, you've been climbing for a little over an hour. What remains of it dissolves beneath your boots into black mud and flattened grass, while a cold wind comes wandering down from the high country looking for every gap in your clothes. It finds them. The air smells of wet pine and distant woodsmoke, with something greener underneath, sharp and earthy. Above you, the Goblin Highlands appear and disappear through the moving cloud, one shoulder of black rock giving way to a roofline on the ridge before the mist takes it again.",
  "The goblins, fortunately, have left considerably better directions. Four sets of little bootprints stamp north through the mud, perhaps five; one turns outward at the toes, another has a split sole that leaves a tiny forked mark behind it. The smallest keeps wandering away from the others and then coming back. Running between all of them is a deep, crooked groove where something heavy has been dragged uphill. Every few yards it strikes a buried stone and jumps sideways. Not graceful work.",
  "You know exactly what made the groove. A brass corner has struck one of the stones hard enough to peel away the moss, leaving a fresh yellow scar in the gray rock: your Brass-Latched Research Case. Earlier this morning it belonged to you. Then came five goblins and a great deal of shouting, followed by an argument about whether taking somebody's property while they were actively objecting constituted theft or merely 'aggressive redistribution.' Paperwork, too. Nobody appeared to know what it was for. By the time the question came up, they were already running north with your case between them.",
  "Their journey hasn't improved since. A strip of yellow cloth hangs wetly from a thorn bush where somebody caught a sleeve. Beside another stone: two small handprints and the perfect impression of a goblin face in the mud, several feet farther downhill than seems physically reasonable. Whoever fell there got back up. The tracks continue.",
  "Somewhere above you, hidden by the cloud, a bell gives one miserable clonk. The sound rolls strangely across the ridge and disappears. A moment later the wind worries the mist apart, just for a few seconds, and the King's Stash Hall appears above you. Black timber under a crooked chimney. The patched roof crowds far too many windows, and behind one of them something red moves, gone before you can decide what you saw. Then the cloud closes over the building again. The goblin tracks point straight toward it.",
  "I'm Eliza, and I'll be running the game. You tell me what your character tries; when a rule matters, I'll explain it right where it comes up.",
  "I'll usually put a few obvious choices in front of you so you're never left guessing what you can try, but they're suggestions, not limits. If you want something else, just say what you're doing.",
  "Before somebody follows those tracks into the fog, give me the first part of the picture: what's your character's name, and what are they: human, dwarf, elf, or gnome?",
])'''

pattern = re.compile(r"export const SESSION_ZERO_WELCOME = Object\.freeze\(\[.*?\n\]\)", re.S)
engine, count = pattern.subn(approved_opening, engine, count=1)
if count != 1:
    raise SystemExit(f'expected one Session Zero opening block, found {count}')

engine = engine.replace(
    "    narration: SESSION_ZERO_WELCOME.map((line) => line.replaceAll('{stolenItem}', stolen.value)),",
    "    narration: [...SESSION_ZERO_WELCOME],",
)

engine = engine.replace(
    '    stolenItem: stolen.value,',
    "    stolenItem: 'the Brass-Latched Research Case',",
    1,
)

for forbidden in [
    'Before we make your character, let me give you the setup',
    "You haven't caught up yet, but you haven't lost them either",
    'the Carefully Labeled Moon Jar',
    'Out of the story',
    'Back to the Highlands',
]:
    if forbidden in approved_opening:
        raise SystemExit(f'forbidden old opening text remained: {forbidden}')

if '\u2014' in approved_opening:
    raise SystemExit('forbidden punctuation present in approved opening')

engine_path.write_text(engine)

controller_path = Path('src/features/games/weed-goblins/weedGoblinsChatControllerChapterOne.js')
controller = controller_path.read_text()
old = "  const clean = cleanText(text)\n"
new = "  const clean = cleanText(text, 1000)\n"
if old not in controller:
    raise SystemExit('incoming message length source not found')
controller = controller.replace(old, new, 1)
controller_path.write_text(controller)

print('APPROVED_KINGS_STASH_OPENING_APPLIED')
print('APPROVED_INCOMING_BUBBLE_LIMIT=1000')
