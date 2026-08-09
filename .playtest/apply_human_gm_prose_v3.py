from pathlib import Path
import re


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f"missing expected source for {label}")
    return text.replace(old, new, 1)


engine_path = Path('src/features/games/weed-goblins/weedGoblinsEngine.js')
engine = engine_path.read_text()

old_welcome = '''export const SESSION_ZERO_WELCOME = Object.freeze([\n  "The road gives out right here, where the Highlands start. One boot's already sunk in the mud.",\n  "But first, I need to know who's walking into that story. Every traveler who comes up this road carries a name, a look, a kind, and a way of meeting trouble. Let's settle those now.",\n])'''
new_welcome = '''export const SESSION_ZERO_WELCOME = Object.freeze([\n  "All right. Here's where we're starting. The road has been climbing for about an hour, and now it's mostly mud and wet grass. The Goblin Highlands are up ahead, half-hidden in low cloud.",\n  "You've been following tracks the whole way. Little bootprints, four or five sets, fresh enough that you haven't lost them yet.",\n  "They're the same goblins who stole {stolenItem} from you earlier today. You watched them run north with it. So, yes, you're here to get your stuff back.",\n  "The tracks are pointing toward the King's Stash Hall. You don't know yet if that's where they're taking it, or why they wanted it in the first place. But it's the only lead you've got.",\n  "I'm Eliza. I'll run the world, the goblins, and everybody else you meet. You tell me what your character wants to do; I'll tell you how the world answers.",\n  "If you've never played a tabletop game like this before, you're fine. I'll give you a few obvious choices when they're useful, but you aren't stuck with them. You can type or say something else and I'll work with it.",\n  "And if something needs a roll, I'll stop and tell you what matters before you roll it. No guessing. Before we head up the trail, though, I need to know who I'm looking at. What's your name?",\n])'''
engine = replace_once(engine, old_welcome, new_welcome, 'full Session Zero opening')
engine = replace_once(
    engine,
    '    narration: [...SESSION_ZERO_WELCOME],',
    "    narration: SESSION_ZERO_WELCOME.map((line) => line.replace('{stolenItem}', stolen.value)),",
    'dynamic stolen item in opening',
)

engine = replace_once(
    engine,
    "const SESSION_RACE_QUESTION =\n  'One more thing before the road takes you anywhere. What are you?'",
    "const SESSION_RACE_QUESTION =\n  'What are you playing: human, dwarf, elf, or gnome?'",
    'race question',
)
engine = replace_once(
    engine,
    "const SESSION_WEAPON_QUESTION =\n  'And what do you carry?'",
    "const SESSION_WEAPON_QUESTION =\n  'What are you carrying for when this gets ugly?'",
    'weapon question',
)
engine = replace_once(
    engine,
    "const SESSION_CLASS_QUESTION =\n  'How do you handle yourself when the road turns ugly?'",
    "const SESSION_CLASS_QUESTION =\n  \"And when trouble starts, what's your instinct? Track the problem, hold your ground, or lean on magic?\"",
    'class question',
)
engine = replace_once(
    engine,
    "const SESSION_PRONOUN_QUESTION =\n  \"Last bit of bookkeeping. What do I call you, when I'm not using your name?\"",
    "const SESSION_PRONOUN_QUESTION =\n  'What pronouns should I use for your character?'",
    'pronoun question',
)
engine = replace_once(
    engine,
    "const SESSION_LOOK_QUESTION =\n  'Paint yourself for me.'",
    "const SESSION_LOOK_QUESTION =\n  \"Last one before we get moving. What's the first thing I'd notice about your character if I saw them on the road?\"",
    'look question',
)

old_name_pair = '''        `${playerName}. Written down.`,\n        SESSION_RACE_QUESTION,'''
new_name_pair = '''        `${playerName}. Got it.`,\n        SESSION_RACE_QUESTION,'''
if engine.count(old_name_pair) != 2:
    raise SystemExit(f'expected two name-reaction blocks, found {engine.count(old_name_pair)}')
engine = engine.replace(old_name_pair, new_name_pair)

finalize_pattern = re.compile(r"function finalizeSessionZero\(state, playerLook, actionId\) \{.*?\n\}\n\nexport function isWeedGoblinsSessionTextScene", re.S)
finalize_replacement = '''function finalizeSessionZero(state, playerLook, actionId) {\n  const returningLine = normalizeText(state.returningLine)\n  const playerName = normalizeText(state.playerName) || 'you'\n  const narration = [\n    ...state.narration,\n    `Okay. That's enough for me to see ${playerName} now.`,\n    `Back on the trail, the goblin tracks drop toward Rattlebridge, a narrow plank bridge over a cut full of fog. Somebody has strung bottle caps along both rails as alarms.`,\n    `On the far side, a goblin-shaped shadow ducks behind a post a half-second too late. You can take it slow and quiet, cross fast before the alarms catch up, or try something else.`,\n  ]\n  if (returningLine) narration.push(returningLine)\n\n  return cloneState(state, {\n    playerLook,\n    returningLine: null,\n    sceneId: SCENES.route,\n    flags: { sessionZeroComplete: true },\n    history: [\n      ...state.history,\n      {\n        type: 'session-choice',\n        sceneId: SCENES.sessionLook,\n        actionId,\n        playerLook,\n      },\n    ],\n    narration,\n  })\n}\n\nexport function isWeedGoblinsSessionTextScene'''
engine, count = finalize_pattern.subn(finalize_replacement, engine, count=1)
if count != 1:
    raise SystemExit(f'finalizeSessionZero replacement count was {count}')
engine_path.write_text(engine)


controller_path = Path('src/features/games/weed-goblins/weedGoblinsChatControllerChapterOne.js')
controller = controller_path.read_text()
check_pattern = re.compile(r"function checkInstructionText\(preview\) \{.*?\n\}\n\nfunction choiceIntentForSetup", re.S)
check_replacement = '''function checkInstructionText(preview) {\n  if (!preview?.requiresRoll) return ''\n  const statLabel = preview.stat === 'strength' ? 'Strength' : 'Defense'\n  if (preview.advantage) {\n    return `Okay, this one's risky. ${statLabel} check, DC ${preview.dc}. You're spending ${preview.manaCost} Mana, so roll two D20s and keep the higher. With +${preview.statBonus}, you need ${preview.requiredDie} or better on either die.`\n  }\n  return `Okay, this one's risky. ${statLabel} check, DC ${preview.dc}. You've got +${preview.statBonus}, so you need ${preview.requiredDie} or better on the die.`\n}\n\nfunction choiceIntentForSetup'''
controller, count = check_pattern.subn(check_replacement, controller, count=1)
if count != 1:
    raise SystemExit(f'checkInstructionText replacement count was {count}')

fallback_pattern = re.compile(r"function contextualFallback\(hook, plan\) \{.*?\n\}", re.S)
controller, count = fallback_pattern.subn("function contextualFallback(hook) {\n  return hook.fallbackText\n}", controller, count=1)
if count != 1:
    raise SystemExit(f'contextualFallback replacement count was {count}')
controller_path.write_text(controller)


help_path = Path('src/features/games/weed-goblins/weedGoblinsHelpChapterOne.js')
help_text = help_path.read_text()
replacements = {
    "'session-zero-welcome': 'This plays like texting. Tap a reply to answer me; when a message box is open, you can type or use the microphone instead.'": "'session-zero-welcome': \"Hit Continue when you're ready. We'll build your character next, and you can ask for Help anywhere you get stuck.\"",
    "'session-zero-name': 'Type a name in the message box. If you want suggestions, ask for help instead of forcing yourself to invent one on command.'": "'session-zero-name': \"Type whatever name you want. If you want a few ideas, use Help and I'll give you some.\"",
    "'session-zero-race': 'Choose a race by tapping one of the replies. This is character flavor, not a hidden test.'": "'session-zero-race': \"Pick the one that fits the character you have in mind. There isn't a wrong answer here.\"",
    "'session-zero-weapon': 'Pick the weapon you want your character to carry. It changes how some actions are described, not your core stats.'": "'session-zero-weapon': 'Pick what you want to carry. This mostly changes how your actions look in the story.'",
    "'choose-background': 'Your class sets Strength, Defense, and Mana. Hold the E beside my name if you want to see the detailed character information without leaving the conversation.'": "'choose-background': 'This choice does affect your Strength, Defense, and Mana. Hold the E beside my name if you want to see the numbers.'",
    "'session-zero-pronoun': 'Choose a pronoun, or skip it. This only changes how the story refers to your character.'": "'session-zero-pronoun': 'Choose one or skip it. This just tells me how to refer to your character.'",
    "'session-zero-look': 'Pick one of the descriptions or type your own. The message box works the same way it will during the adventure.'": "'session-zero-look': 'Pick one of these or type your own description.'",
    "'choose-route': 'From here on, the replies are suggested moves, not limits. You can type or speak another idea. If a roll is needed, I will tell you the DC and what you need on the die before you roll.'": "'choose-route': \"Now we're actually playing. The blue replies are ideas, not limits; type or speak another plan whenever you want.\"",
}
for old, new in replacements.items():
    help_text = replace_once(help_text, old, new, f'guidance: {old[:35]}')
help_path.write_text(help_text)


worker_path = Path('server/weed-goblins-narration-worker/legacyChapterOne.js')
worker = worker_path.read_text()
voice_insert = '''HUMAN GM PROSE\n- Sound like one person continuing one conversation, not a sequence of self-contained fantasy blurbs.\n- Sentence rhythm matters: mix short and medium sentences, use contractions, and let one thought carry naturally into the next. Do not manufacture voice by piling up clipped fragments.\n- Do not write slogan-like or quotable lines just to sound clever. Do not force a joke into every beat.\n- When a new beat follows prior narration, continue from the last concrete fact instead of restarting with fresh atmosphere.\n- The player's action is the center of the response. Answer what they did, show the world change, then stop when control should return to them.\n- Warmth comes from attention, clarity, and specific reactions, not from praising the player or overexplaining the rules.\n- Avoid generic fantasy filler, ornamental metaphors, stacked adjectives, symmetrical lists, rhetorical flourishes, and AI-summary sentences.\n- Never say "I resolve", "I process", "I interpret", "written down", "logged", "recorded", or similar machinery language.\n\nFIRST-TIME PLAYER\n- The static opening already gives the player enough story and basic play guidance before character creation. Do not apologize for that amount of context or try to compress it into a slogan.\n- During play, explain a mechanic only when it becomes relevant. The deterministic UI handles exact DC/stat/roll numbers.\n- Keep the fiction friendly and legible for someone playing their first tabletop-style game.\n\n'''
marker = 'GM FIRST\n'
if marker not in worker:
    raise SystemExit('GM FIRST marker missing from Chapter 1 prompt')
worker = worker.replace(marker, voice_insert + marker, 1)
worker_path.write_text(worker)

print('HUMAN_GM_PROSE_V3_APPLIED')
