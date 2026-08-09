from pathlib import Path
import re


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f"missing expected source for {label}")
    return text.replace(old, new, 1)


engine_path = Path('src/features/games/weed-goblins/weedGoblinsEngine.js')
engine = engine_path.read_text()

old_welcome = '''export const SESSION_ZERO_WELCOME = Object.freeze([\n  "The road gives out right here, where the Highlands start. One boot's already sunk in the mud.",\n  "But first, I need to know who's walking into that story. Every traveler who comes up this road carries a name, a look, a kind, and a way of meeting trouble. Let's settle those now.",\n])'''
new_welcome = '''export const SESSION_ZERO_WELCOME = Object.freeze([\n  "Before we make your character, let me give you the setup so you know what you're walking into. Earlier today, a small group of goblins stole {stolenItem}. Your character saw which way they went and has been following them ever since. You haven't caught up yet, but you haven't lost them either.",\n  "The trail has brought you to Windcut Trail, an old road that climbs into the Goblin Highlands and starts breaking down into mud and grass as the ground gets steeper. Four or five sets of small bootprints keep heading north. Somewhere beyond the ridge is the King's Stash Hall, and right now that's the only solid lead you have.",\n  "You don't know why they wanted {stolenItem}, whether the Goblin King sent them, or whether there's something larger behind the theft. Your character doesn't know either. For now, the job is simple enough: follow the trail, find the goblins, and get your property back. We'll find out what the rest of it means as you play.",\n  "If this is your first time with a D&D-style game, don't worry about the rules. You don't need them all up front. Tell me what you want your character to do, and I'll handle the world around you. When there are a few obvious ways forward, I'll give you some, but they're suggestions. If you want to try something else, just say it.",\n  "When something is uncertain enough to need a roll, I'll tell you what you're rolling and what number you're trying to beat before you roll. We can learn the rules when they actually come up. So now that you know the situation, let's make the person who's walking into it. What's your character's name?",\n])'''
engine = replace_once(engine, old_welcome, new_welcome, 'Session Zero opening')
engine = replace_once(
    engine,
    '    narration: [...SESSION_ZERO_WELCOME],',
    "    narration: SESSION_ZERO_WELCOME.map((line) => line.replaceAll('{stolenItem}', stolen.value)),",
    'dynamic stolen item in opening',
)

engine = replace_once(
    engine,
    "const SESSION_RACE_QUESTION =\n  'One more thing before the road takes you anywhere. What are you?'",
    "const SESSION_RACE_QUESTION =\n  'And what are they: human, dwarf, elf, or gnome?'",
    'race question',
)
engine = replace_once(
    engine,
    "const SESSION_WEAPON_QUESTION =\n  'And what do you carry?'",
    "const SESSION_WEAPON_QUESTION =\n  'What do they carry for a weapon?'",
    'weapon question',
)
engine = replace_once(
    engine,
    "const SESSION_CLASS_QUESTION =\n  'How do you handle yourself when the road turns ugly?'",
    "const SESSION_CLASS_QUESTION =\n  \"When trouble starts, what are they best at: tracking and pushing through, holding their ground, or working with magic?\"",
    'class question',
)
engine = replace_once(
    engine,
    "const SESSION_PRONOUN_QUESTION =\n  \"Last bit of bookkeeping. What do I call you, when I'm not using your name?\"",
    "const SESSION_PRONOUN_QUESTION =\n  'What pronouns should I use for them?'",
    'pronoun question',
)
engine = replace_once(
    engine,
    "const SESSION_LOOK_QUESTION =\n  'Paint yourself for me.'",
    "const SESSION_LOOK_QUESTION =\n  \"Last thing: what do they look like? Give me the first thing I'd notice if I saw them coming up the trail.\"",
    'look question',
)

reaction_replacements = {
    "reaction: 'Human. Ground you can stand on, more or less.'": "reaction: 'Human. All right.'",
    'reaction: "Dwarf. I\'d hate to be the door between you and wherever you\'re going."': "reaction: 'A dwarf. All right.'",
    'reaction: "Elf. You\'re already listening to something I haven\'t said yet."': "reaction: 'An elf. Got it.'",
    'reaction: "Gnome. Small target, and somehow that\'s never once made you careful."': "reaction: 'A gnome. Got it.'",
    'reaction: "A sword rides easy on your hip, like it\'s been there longer than you have."': "reaction: 'A sword. Okay.'",
    "reaction: 'A bow, restrung recently. You checked the tension twice before deciding it was fine.'": "reaction: 'A bow. Got it.'",
    "reaction: 'The axe leaves a groove in the dirt when you set it down for a second.'": "reaction: 'A battle axe. All right.'",
    "reaction: 'You spin the staff once, out of habit more than need.'": "reaction: 'A staff. Got it.'",
    "reaction: 'The mace is heavier than it looks, and you clearly stopped noticing that a while ago.'": "reaction: 'A mace. Okay.'",
    "reaction: 'Two daggers. I only spotted where you keep the second one because I was watching for it.'": "reaction: 'Daggers. Got it.'",
}
for old, new in reaction_replacements.items():
    engine = replace_once(engine, old, new, f'reaction: {old[:30]}')

old_name_pair = '''        `${playerName}. Written down.`,\n        SESSION_RACE_QUESTION,'''
new_name_pair = '''        `${playerName}. All right.`,\n        SESSION_RACE_QUESTION,'''
if engine.count(old_name_pair) != 2:
    raise SystemExit(f'expected two name-reaction blocks, found {engine.count(old_name_pair)}')
engine = engine.replace(old_name_pair, new_name_pair)

finalize_pattern = re.compile(r"function finalizeSessionZero\(state, playerLook, actionId\) \{.*?\n\}\n\nexport function isWeedGoblinsSessionTextScene", re.S)
finalize_replacement = '''function finalizeSessionZero(state, playerLook, actionId) {\n  const returningLine = normalizeText(state.returningLine)\n  const playerName = normalizeText(state.playerName) || 'your character'\n  const narration = [\n    ...state.narration,\n    `All right. I know who ${playerName} is now. Let's put them on the trail.`,\n    `The goblin tracks carry on through Windcut Trail until the ground drops toward Rattlebridge, a narrow plank bridge over a fog-filled cut. Somebody has tied bottle caps along both rails as an alarm. On the far side, you catch a quick bit of movement behind one of the posts.`,\n    `You haven't been spotted yet. You can try to cross quietly, move fast before the alarm has time to matter, or try something else if you've got another idea. What do you want to do?`,\n  ]\n  if (returningLine) narration.push(returningLine)\n\n  return cloneState(state, {\n    playerLook,\n    returningLine: null,\n    sceneId: SCENES.route,\n    flags: { sessionZeroComplete: true },\n    history: [\n      ...state.history,\n      {\n        type: 'session-choice',\n        sceneId: SCENES.sessionLook,\n        actionId,\n        playerLook,\n      },\n    ],\n    narration,\n  })\n}\n\nexport function isWeedGoblinsSessionTextScene'''
engine, count = finalize_pattern.subn(finalize_replacement, engine, count=1)
if count != 1:
    raise SystemExit(f'finalizeSessionZero replacement count was {count}')
engine_path.write_text(engine)


controller_path = Path('src/features/games/weed-goblins/weedGoblinsChatControllerChapterOne.js')
controller = controller_path.read_text()
check_pattern = re.compile(r"function checkInstructionText\(preview\) \{.*?\n\}\n\nfunction choiceIntentForSetup", re.S)
check_replacement = '''function checkInstructionText(preview) {\n  if (!preview?.requiresRoll) return ''\n  const statLabel = preview.stat === 'strength' ? 'Strength' : 'Defense'\n  if (preview.advantage) {\n    return `That needs a roll. It's a ${statLabel} check, DC ${preview.dc}. You're spending ${preview.manaCost} Mana, so roll two D20s and keep the higher. With +${preview.statBonus}, you need ${preview.requiredDie} or better on either die.`\n  }\n  return `That needs a roll. It's a ${statLabel} check, DC ${preview.dc}. You've got +${preview.statBonus}, so you need ${preview.requiredDie} or better on the die.`\n}\n\nfunction choiceIntentForSetup'''
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
    "'session-zero-welcome': 'This plays like texting. Tap a reply to answer me; when a message box is open, you can type or use the microphone instead.'": "'session-zero-welcome': \"Whenever you're ready, we'll build your character and get onto the trail. If anything doesn't make sense, use Help and I'll walk you through it.\"",
    "'session-zero-name': 'Type a name in the message box. If you want suggestions, ask for help instead of forcing yourself to invent one on command.'": "'session-zero-name': \"Give your character any name you like. If you want a few ideas, use Help and I'll give you some.\"",
    "'session-zero-race': 'Choose a race by tapping one of the replies. This is character flavor, not a hidden test.'": "'session-zero-race': \"Pick whichever one fits the character you have in mind. There isn't a wrong answer here.\"",
    "'session-zero-weapon': 'Pick the weapon you want your character to carry. It changes how some actions are described, not your core stats.'": "'session-zero-weapon': 'Choose what you want them carrying. This mostly changes how their actions look in the story.'",
    "'choose-background': 'Your class sets Strength, Defense, and Mana. Hold the E beside my name if you want to see the detailed character information without leaving the conversation.'": "'choose-background': 'This one does affect Strength, Defense, and Mana. Hold the E beside my name if you want to see the numbers before you choose.'",
    "'session-zero-pronoun': 'Choose a pronoun, or skip it. This only changes how the story refers to your character.'": "'session-zero-pronoun': 'Choose one or skip it. This just tells me how to refer to your character in the story.'",
    "'session-zero-look': 'Pick one of the descriptions or type your own. The message box works the same way it will during the adventure.'": "'session-zero-look': 'Pick one of these descriptions or write your own.'",
    "'choose-route': 'From here on, the replies are suggested moves, not limits. You can type or speak another idea. If a roll is needed, I will tell you the DC and what you need on the die before you roll.'": "'choose-route': \"We're in the adventure now. The blue replies are just a few obvious options. If you want to do something else, say it.\"",
}
for old, new in replacements.items():
    help_text = replace_once(help_text, old, new, f'guidance: {old[:35]}')
help_path.write_text(help_text)


worker_path = Path('server/weed-goblins-narration-worker/legacyChapterOne.js')
worker = worker_path.read_text()
voice_insert = '''HUMAN TABLE GM PROSE\n- Sound like a friendly human GM speaking across a table, not a copywriter, narrator bot, or cinematic trailer.\n- A normal GM turn may be two to four connected sentences when the scene needs that much room. Do not compress a complete thought into clipped fragments just to sound punchy.\n- Let sentences connect normally. Use contractions, ordinary transitions, and mixed sentence lengths. The prose should be easy to follow aloud.\n- Do not manufacture personality with slogans, aphorisms, stacked jokes, dramatic fragments, or a clever final sentence.\n- Do not restart the atmosphere every turn. Continue from the concrete situation already established.\n- The player's action is the center of the response. Answer what they did, show what changed, give the world or NPC a natural reaction when useful, and stop when the player has a new decision.\n- Warmth comes from patience, clarity, and responding to the actual player. Do not praise them automatically and do not sound like customer support.\n- For a first-time player, it is okay to briefly step out of the fiction to explain a rule in plain language. Then return to the scene.\n- Avoid generic fantasy filler, ornamental metaphors, symmetrical lists, rhetorical flourishes, and summary sentences that explain what the scene 'means'.\n- Never say "I resolve", "I process", "I interpret", "written down", "logged", "recorded", or similar machinery language.\n\n'''
marker = 'GM FIRST\n'
if marker not in worker:
    raise SystemExit('GM FIRST marker missing from Chapter 1 prompt')
worker = worker.replace(marker, voice_insert + marker, 1)

worker = replace_once(
    worker,
    '''OUTPUT CONTRACT\n- Return exactly one narration line with no label, markdown, explanation, options list, or alternate draft.\n- Write one or two focused sentences on that line. Never exceed 300 characters, and scene-intro/choice-presentation must not exceed 240.\n- Use the space for concrete action, required continuity, and immediate stakes. Remove repetition, throat-clearing, decorative clauses, and generic filler.''',
    '''OUTPUT CONTRACT\n- Return exactly one narration line with no label, markdown, options list, or alternate draft.\n- Write the amount a human GM would naturally say before handing the turn back. Usually two to four connected sentences. One sentence is fine when the moment is genuinely brief.\n- Never exceed 650 characters. Scene introductions may use up to 500 when orientation or continuity genuinely needs the room.\n- Favor clarity, continuity, and natural spoken rhythm over compression. Remove repetition and generic filler, but do not strip away the context a new player needs to understand the scene.''',
    'expanded human GM output contract',
)

worker = replace_once(
    worker,
    '''SCENE-SETTING METHOD\n- Apply this method to scene-intro with introKind highlands-opening, choice-presentation, or scene-transition.\n- Pick one immediate image: the first specific thing the player would notice right now.\n- Describe that one image in the fewest useful words, then make it carry the useful pressure of the scene.\n- Default to direct second person: "Your boot stops beside a fresh goblin footprint" rather than "I watch your boot stop beside a fresh goblin footprint."\n- Never inventory scenery, stack unrelated sensory facts, or bury the decision point under atmosphere.''',
    '''SCENE-SETTING METHOD\n- Apply this method to scene-intro with introKind highlands-opening, choice-presentation, or scene-transition.\n- Orient the player first: where they are, what has changed since the last beat, and what is immediately relevant. A first-time player should never have to reconstruct the scene from fragments.\n- Use two or three concrete details when they belong to the same place or action. Let them form one coherent picture rather than a list of atmosphere.\n- Connect description to the player's situation. Terrain, sound, objects, and NPC behavior matter because they affect what the player can understand or do next.\n- Default to direct second person during active play.\n- End once the situation and the next point of agency are clear. Do not add a dramatic button line after the scene is already understandable.''',
    'human scene-setting method',
)

worker_path.write_text(worker)

print('HUMAN_GM_PROSE_V4_APPLIED')
