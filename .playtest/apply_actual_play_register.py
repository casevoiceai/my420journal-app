from pathlib import Path
import re


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing expected source for {label}')
    return text.replace(old, new, 1)


engine_path = Path('src/features/games/weed-goblins/weedGoblinsEngine.js')
engine = engine_path.read_text()

opening = '''export const SESSION_ZERO_WELCOME = Object.freeze([
  "Okay, so you've been chasing five goblins uphill for about an hour. They stole your Brass-Latched Research Case, they are not especially good at escaping with it, and the trail is honestly doing most of the work for you.",
  "There are little bootprints all over the mud, a drag mark from the case, and one extremely clear goblin faceprint where somebody apparently lost an argument with the hill. They got back up. The faceprint did not.",
  "The theft itself was also a mess. While they were taking the case, two of them stopped to argue about whether this counted as theft or 'aggressive redistribution.' A third one produced a form. Nobody knew who was supposed to fill it out. Then they remembered they were escaping and ran.",
  "Now the tracks are heading straight toward the King's Stash Hall, which you can just make out up on the ridge whenever the fog gets out of the way. There's a miserable little bell up there going clonk every so often. Very regal.",
  "Before you catch up with them, what's your character's name, and are they human, dwarf, elf, or gnome?",
])'''
pattern = re.compile(r"export const SESSION_ZERO_WELCOME = Object\.freeze\(\[.*?\n\]\)", re.S)
engine, count = pattern.subn(opening, engine, count=1)
if count != 1:
    raise SystemExit(f'opening replacement count was {count}')

intro_pattern = re.compile(r"export const WEED_GOBLINS_INTRODUCTION =\n\s*\".*?\"\n", re.S)
engine, count = intro_pattern.subn(
    "export const WEED_GOBLINS_INTRODUCTION =\n  \"The goblin trail keeps climbing toward the King's Stash Hall.\"\n",
    engine,
    count=1,
)
if count != 1:
    raise SystemExit(f'introduction constant replacement count was {count}')

finalize_pattern = re.compile(
    r"function finalizeSessionZero\(state, playerLook, actionId\) \{.*?\n\}\n\nexport function isWeedGoblinsSessionTextScene",
    re.S,
)
finalize = '''function finalizeSessionZero(state, playerLook, actionId) {
  const returningLine = normalizeText(state.returningLine)
  const narration = [
    ...state.narration,
    `A little farther up, the trail runs straight into Rattlebridge. Calling it a bridge is generous. It's some planks, two ropes, and an absolutely unreasonable number of bottle caps tied along the rails as an alarm system. Somebody kept having ideas.`,
    `There's movement on the far side, tucked behind one of the posts. They haven't seen you yet. You can sneak across, just book it before the bottle caps start screaming, or try something else.`,
  ]
  if (returningLine) narration.push(returningLine)

  return cloneState(state, {
    playerLook,
    returningLine: null,
    sceneId: SCENES.route,
    flags: { sessionZeroComplete: true },
    history: [
      ...state.history,
      {
        type: 'session-choice',
        sceneId: SCENES.sessionLook,
        actionId,
        playerLook,
      },
    ],
    narration,
  })
}

export function isWeedGoblinsSessionTextScene'''
engine, count = finalize_pattern.subn(finalize, engine, count=1)
if count != 1:
    raise SystemExit(f'Rattlebridge handoff replacement count was {count}')

for forbidden in [
    "I'm Eliza",
    "I'll be running the game",
    "I'll be running everything from here",
    "I'll usually put a few obvious choices",
    'patient, lush, curious',
]:
    if forbidden in engine:
        raise SystemExit(f'forbidden old register remains in engine: {forbidden}')

engine_path.write_text(engine)


actual_play_voice = '''ACTUAL PLAY CORE VOICE
- Talk directly with the player like a GM running the game live, not like a novelist delivering finished prose.
- Never introduce yourself, name yourself, explain your role, or announce how the game works. Do not say "I'm Eliza" or any equivalent. Just run the scene.
- Keep the register loose, quick, present-tense, and conversational. The player should feel like somebody is reacting with them in real time.
- Narration can contain the joke. You may make a dry aside, notice something ridiculous, or briefly comment on what is happening without handing all comedy to NPC dialogue.
- Spoken messiness is allowed. A thought can restart, correct itself, trail off, or interrupt itself when that sounds natural. Do not manufacture these effects on a quota.
- Talk with the player instead of sealing description into polished paragraphs. Respond to what they just did, let the world answer, and hand the moment back once there is something to react to.
- Cut atmospheric density hard. Usually one or two concrete details are enough. Keep a sensory detail only when it helps the player picture the immediate situation, understand pressure, or spot something usable.
- Do not luxuriate in weather, landscape, texture, implied history, or lyrical imagery. Those can appear briefly, but they are background, not the main event.
- Casual language is welcome when it fits. Contractions, parenthetical thoughts, little corrections, and conversational phrasing are normal.
- Do not imitate a specific performer or actual-play show. Use the broad live-table qualities above in Eliza's own Weed Goblins voice.
- Goblin bureaucracy is part of the narrator's comic vocabulary. A ridiculous rule, form, rank, alarm, fee, or technicality can be funny before any goblin speaks.
- Clarity still wins. Never let a joke or conversational aside obscure the engine result, the physical situation, or the player's next point of agency.

'''

worker_paths = [
    Path('server/weed-goblins-narration-worker/legacyChapterOne.js'),
    Path('server/weed-goblins-narration-worker/chapterTwo.js'),
    Path('server/weed-goblins-narration-worker/chapterThree.js'),
]

for path in worker_paths:
    text = path.read_text()
    if 'ACTUAL PLAY CORE VOICE\n' in text:
        raise SystemExit(f'actual-play voice already present in {path}')
    marker = 'GM TURN LOOP\n'
    if marker in text:
        text = text.replace(marker, actual_play_voice + marker, 1)
    elif 'HUMAN GM CADENCE\n' in text:
        text = text.replace('HUMAN GM CADENCE\n', actual_play_voice + 'HUMAN GM CADENCE\n', 1)
    else:
        raise SystemExit(f'voice insertion marker missing in {path}')

    text = text.replace(
        '- exploration: patient, lush, curious. Let place, distance, and material detail carry the beat.',
        '- exploration: loose, conversational, and present. Give the player only the concrete detail needed to understand what is here and what they can do with it.',
    )
    text = text.replace(
        '- exploration: patient, lush, curious.',
        '- exploration: loose, conversational, and present. Keep description light and playable.',
    )
    text = text.replace(
        '- discovery: slower and stranger. Let one revealing image, object, or contradiction hold attention long enough to matter.',
        '- discovery: let one odd or revealing thing land clearly, then stay conversational and playable.',
    )
    text = text.replace(
        '- discovery: slower and stranger; let one revealing object, contradiction, or image hold attention.',
        '- discovery: let one odd or revealing thing land clearly, then keep moving.',
    )
    text = text.replace(
        '- withered-grove: melancholy, quiet, uncanny. This posture belongs to Chapter 3 and should not be selected for Chapter 1.',
        '- withered-grove: quieter and stranger, but still spoken and conversational rather than literary.',
    )
    text = text.replace(
        '- withered-grove: melancholy, quiet, uncanny.',
        '- withered-grove: quieter and stranger, but still spoken and conversational rather than literary.',
    )
    path.write_text(text)


chapter_one_path = Path('server/weed-goblins-narration-worker/legacyChapterOne.js')
chapter_one = chapter_one_path.read_text()

cadence_pattern = re.compile(r'HUMAN GM CADENCE\n.*?\nSENSORY GROUNDING\n.*?\nRUN THE TABLE\n', re.S)
replacement = '''HUMAN GM CADENCE
- Sound spoken first. Do not polish every turn into a miniature paragraph.
- Usually say the useful thing, the funny or human thing if there is one, and stop. A turn may be one sentence or a few connected sentences depending on what just happened.
- False starts, small corrections, interruptions, trailing thoughts, and fragments are available because people talk that way. Use them naturally, not decoratively and not on a quota.
- Do not add atmosphere simply because there is room. Do not search for a poetic closing line.
- Do not praise the player automatically, echo their input as a receipt, or summarize the logic of the exchange.
- Do not open with narrator-observer framing such as "I see" or "I notice." Speak the scene directly.
- Never use an em dash or en dash.

PHYSICAL ORIENTATION
- Give enough concrete information to make the immediate situation playable. Often one or two details are enough.
- Favor things the player can act on: where somebody is standing, what an object is doing, what changed, what looks risky, what is unexpectedly stupid.
- Sensory detail is optional. Use it when it helps orientation or pressure, not as a density target.

RUN THE TABLE
'''
chapter_one, count = cadence_pattern.subn(replacement, chapter_one, count=1)
if count != 1:
    raise SystemExit(f'Chapter 1 cadence replacement count was {count}')

chapter_one = chapter_one.replace(
    '- Most turns should be roughly 80 to 420 characters. A scene introduction or resolution may reach 520 characters when the extra room is doing real narrative work.\n- Do not chase the maximum. Short actions can have short consequences. Larger transitions can breathe.',
    '- Use the amount of speech the live moment needs. Most turns should be quick enough to feel like conversation, not a reading break.\n- Longer turns are allowed when orientation or a complicated consequence genuinely needs them, but do not expand for atmosphere alone.',
)
chapter_one = chapter_one.replace(
    '- Spell the GM\'s name only as "Eliza".',
    '- Never name the GM in ordinary narration. The UI already establishes who is speaking.',
)
chapter_one = chapter_one.replace(
    'Before returning the turn, check four things: does it sound spoken rather than composed, is the player physically grounded in the scene, did you preserve the exact engine outcome, and did you keep rules/UI language out of the fiction?',
    'Before returning the turn, check four things: does this sound like live table talk rather than written fantasy prose, did something actually happen or become clear, did you preserve the exact engine outcome, and is the player left with something they can react to?',
)
chapter_one_path.write_text(chapter_one)


# Existing private saves may contain the prior literary opening. Extend the restore migration
# so refreshing an in-progress Chapter 1 run updates those exact static bubbles too.
old_to_new = [
    ("By the time the road finally gives up, you've been climbing for a little over an hour. What remains of it dissolves beneath your boots into black mud and flattened grass, while a cold wind comes wandering down from the high country looking for every gap in your clothes. It finds them. The air smells of wet pine and distant woodsmoke, with something greener underneath, sharp and earthy. Above you, the Goblin Highlands appear and disappear through the moving cloud, one shoulder of black rock giving way to a roofline on the ridge before the mist takes it again.", opening.splitlines()[1].strip()[1:-2]),
    ("The goblins, fortunately, have left considerably better directions. Four sets of little bootprints stamp north through the mud, perhaps five; one turns outward at the toes, another has a split sole that leaves a tiny forked mark behind it. The smallest keeps wandering away from the others and then coming back. Running between all of them is a deep, crooked groove where something heavy has been dragged uphill. Every few yards it strikes a buried stone and jumps sideways. Not graceful work.", opening.splitlines()[2].strip()[1:-2]),
    ("You know exactly what made the groove. A brass corner has struck one of the stones hard enough to peel away the moss, leaving a fresh yellow scar in the gray rock: your Brass-Latched Research Case. Earlier this morning it belonged to you. Then came five goblins and a great deal of shouting, followed by an argument about whether taking somebody's property while they were actively objecting constituted theft or merely 'aggressive redistribution.' Paperwork, too. Nobody appeared to know what it was for. By the time the question came up, they were already running north with your case between them.", opening.splitlines()[3].strip()[1:-2]),
    ("Their journey hasn't improved since. A strip of yellow cloth hangs wetly from a thorn bush where somebody caught a sleeve. Beside another stone: two small handprints and the perfect impression of a goblin face in the mud, several feet farther downhill than seems physically reasonable. Whoever fell there got back up. The tracks continue.", ''),
    ("Somewhere above you, hidden by the cloud, a bell gives one miserable clonk. The sound rolls strangely across the ridge and disappears. A moment later the wind worries the mist apart, just for a few seconds, and the King's Stash Hall appears above you. Black timber under a crooked chimney. The patched roof crowds far too many windows, and behind one of them something red moves, gone before you can decide what you saw. Then the cloud closes over the building again. The goblin tracks point straight toward it.", opening.splitlines()[4].strip()[1:-2]),
    ("I'm Eliza. I'll be running everything from here, the goblins, the weather, whoever's dumb enough to get in your way. Tell me what you're trying to do and I'll tell you what happens.", ''),
    ("Sometimes I'll toss out a couple of obvious moves so you're not staring at a blank box. Ignore them if you've got something better.", ''),
    ("Before somebody follows those tracks into the fog, give me the first part of the picture: what's your character's name, and what are they: human, dwarf, elf, or gnome?", opening.splitlines()[5].strip()[1:-2]),
]

for path in [
    Path('src/features/games/weed-goblins/weedGoblinsPersistenceChapterOne.js'),
    Path('src/features/games/weed-goblins/weedGoblinsPersistenceThroughChapterTwo.js'),
    Path('src/features/games/weed-goblins/weedGoblinsPersistence.js'),
]:
    text = path.read_text()
    marker = 'const LEGACY_ELIZA_INTRO_COPY = new Map([\n'
    if marker not in text:
        raise SystemExit(f'legacy intro migration map missing in {path}')
    entries = ''.join(f'  [{old!r}, {new!r}],\n' for old, new in old_to_new)
    text = text.replace(marker, marker + entries, 1)
    path.write_text(text)


for path in [engine_path, *worker_paths]:
    text = path.read_text()
    if '\u2014' in text:
        raise SystemExit(f'forbidden punctuation found in {path}')

print('ACTUAL_PLAY_REGISTER_APPLIED')
print('STATIC_OPENING_SELF_INTRO_REMOVED')
print('RATTLEBRIDGE_ACTUAL_PLAY_REWRITE_APPLIED')
print('STALE_OPENING_RESTORE_MIGRATION_EXTENDED')
