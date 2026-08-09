from pathlib import Path
import re


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing expected source for {label}')
    return text.replace(old, new, 1)


engine_path = Path('src/features/games/weed-goblins/weedGoblinsEngine.js')
engine = engine_path.read_text()

engine = replace_once(
    engine,
    "const SESSION_WEAPON_QUESTION =\n  'What do they carry for a weapon?'",
    "const SESSION_WEAPON_QUESTION =\n  \"Now give me the practical part: what are they carrying, and when trouble turns ugly, are they better at tracking and pushing through, holding their ground, or working with magic?\"",
    'bundled equipment and approach prompt',
)
engine = replace_once(
    engine,
    "const SESSION_PRONOUN_QUESTION =\n  'What pronouns should I use for them?'",
    "const SESSION_PRONOUN_QUESTION =\n  \"Last pass: what pronouns should I use, and what's the first thing I'd notice about them coming up the trail?\"",
    'bundled pronoun and look prompt',
)

reaction_pattern = re.compile(r"reaction: (?:'[^']*'|\"[^\"]*\"),")
engine, reaction_count = reaction_pattern.subn("reaction: '',", engine)
if reaction_count != 10:
    raise SystemExit(f'expected ten race and weapon reaction fields, found {reaction_count}')

name_echo = '''      narration: [
        ...state.narration,
        `${playerName}. All right.`,
        SESSION_RACE_QUESTION,
      ],'''
if engine.count(name_echo) != 2:
    raise SystemExit(f'expected two name confirmation blocks, found {engine.count(name_echo)}')
engine = engine.replace(name_echo, '      narration: [...state.narration],', 2)

race_transition = '''      narration: [
        ...state.narration,
        race.reaction,
        SESSION_WEAPON_QUESTION,
      ],'''
engine = replace_once(
    engine,
    race_transition,
    '''      narration: [
        ...state.narration,
        SESSION_WEAPON_QUESTION,
      ],''',
    'race to bundled equipment prompt',
)

weapon_transition = '''      narration: [
        ...state.narration,
        weapon.reaction,
        SESSION_CLASS_QUESTION,
      ],'''
engine = replace_once(
    engine,
    weapon_transition,
    '      narration: [...state.narration],',
    'weapon confirmation removal',
)

background_pattern = re.compile(
    r"  if \(state\.sceneId === SCENES\.background\) \{.*?\n  \}\n\n  if \(state\.sceneId === SCENES\.sessionPronoun\)",
    re.S,
)
background_replacement = '''  if (state.sceneId === SCENES.background) {
    const backgroundId = actionId.split(':')[1]
    const background = BACKGROUNDS[backgroundId]
    if (!background) throw new Error('Unknown Session Zero background.')
    return cloneState(state, {
      background,
      sceneId: SCENES.sessionPronoun,
      stats: {
        strength: background.strength,
        defense: background.defense,
        manaPool: background.manaPool,
        maxMana: background.manaPool,
      },
      history: [
        ...state.history,
        { type: 'session-choice', sceneId: SCENES.background, actionId, backgroundId },
      ],
      narration: [...state.narration, SESSION_PRONOUN_QUESTION],
    })
  }

  if (state.sceneId === SCENES.sessionPronoun)'''
engine, count = background_pattern.subn(background_replacement, engine, count=1)
if count != 1:
    raise SystemExit(f'background transition replacement count was {count}')

pronoun_pattern = re.compile(
    r"(  if \(state\.sceneId === SCENES\.sessionPronoun\) \{.*?playerPronoun: option\.value,\n        \},\n      \],\n)      narration: \[\.\.\.state\.narration, SESSION_LOOK_QUESTION\],",
    re.S,
)
engine, count = pronoun_pattern.subn(r"\1      narration: [...state.narration],", engine, count=1)
if count != 1:
    raise SystemExit(f'pronoun confirmation replacement count was {count}')

finalize_pattern = re.compile(
    r"function finalizeSessionZero\(state, playerLook, actionId\) \{.*?\n\}\n\nexport function isWeedGoblinsSessionTextScene",
    re.S,
)
finalize_replacement = '''function finalizeSessionZero(state, playerLook, actionId) {
  const returningLine = normalizeText(state.returningLine)
  const narration = [
    ...state.narration,
    `The goblin tracks carry on through Windcut Trail until the ground drops toward Rattlebridge, a narrow plank bridge over a fog-filled cut. Somebody has tied bottle caps along both rails as an alarm. On the far side, you catch a quick bit of movement behind one of the posts.`,
    `You haven't been spotted yet. You can try to cross quietly, move fast before the alarm has time to matter, or try something else if you've got another idea. What do you want to do?`,
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
engine, count = finalize_pattern.subn(finalize_replacement, engine, count=1)
if count != 1:
    raise SystemExit(f'finalizeSessionZero replacement count was {count}')

for forbidden in [
    'Human. All right.',
    'A sword. Okay.',
    '. Written down.',
    'Out of the story',
    'Back to the Highlands',
]:
    if forbidden in engine:
        raise SystemExit(f'forbidden character-creation pattern remains in built engine: {forbidden}')

engine_path.write_text(engine)


controller_path = Path('src/features/games/weed-goblins/weedGoblinsChatControllerChapterOne.js')
controller = controller_path.read_text()

check_pattern = re.compile(r"function checkInstructionText\(preview\) \{.*?\n\}\n\nfunction choiceIntentForSetup", re.S)
check_replacement = '''function checkInstructionText(preview) {
  if (!preview?.requiresRoll) return ''
  const statLabel = preview.stat === 'strength' ? 'Strength' : 'Defense'
  if (preview.advantage) {
    return `${statLabel} check, DC ${preview.dc}; you're spending ${preview.manaCost} Mana for advantage, so roll two D20s, keep the higher, and you need ${preview.requiredDie} or better on either die.`
  }
  return `${statLabel} check, DC ${preview.dc}; with +${preview.statBonus}, you need ${preview.requiredDie} or better on the die.`
}

function choiceIntentForSetup'''
controller, count = check_pattern.subn(check_replacement, controller, count=1)
if count != 1:
    raise SystemExit(f'checkInstructionText replacement count was {count}')

setup_pattern = re.compile(
    r"function createChoiceCheckSetupMessage\(state, action, preview\) \{.*?\n\}\n\nfunction appendCheckInstructions",
    re.S,
)
setup_replacement = '''function createChoiceCheckSetupMessage(state, action, preview) {
  return createIncomingChatMessage(
    checkInstructionText(preview),
    { source: 'engine-check-setup', kind: 'check-setup' },
  )
}

function appendCheckInstructions'''
controller, count = setup_pattern.subn(setup_replacement, controller, count=1)
if count != 1:
    raise SystemExit(f'choice check setup replacement count was {count}')

controller_path.write_text(controller)


worker_path = Path('server/weed-goblins-narration-worker/legacyChapterOne.js')
worker = worker_path.read_text()

old_register = '''TWO REGISTERS, NEVER BLENDED
1. FICTION REGISTER is the default for every response produced by this Worker. Describe the world, NPCs, action, pressure, consequence, and sensory reality. Do not explain the interface, buttons, message box, or how to operate the app. Do not turn a scene into a rules lecture.
2. TABLE-ASIDE REGISTER belongs to the deterministic game UI, outside this Worker. That register may state exact stats, DCs, advantage, Mana cost, or what die to roll. Because this Worker is fiction-only, never smuggle those explanations into narration. If authoritativeText contains UI or rules wording, preserve the underlying event but rewrite it as fiction rather than echoing the instruction.
- A human GM changes register visibly. Fiction should sound like the world is happening. Rules should sound like a brief aside at the table. Never make both jobs use the same flat cadence.'''
new_register = '''FICTION AND RULES
1. FICTION is the default for every response produced by this Worker. Describe the world, NPCs, action, pressure, consequence, and sensory reality. Do not explain the interface, buttons, message box, or how to operate the app. Do not turn a scene into a rules lecture.
2. RULES belong to the deterministic game UI, outside this Worker. The UI may add one brief mechanics sentence at the exact moment a rule is needed, including a stat, DC, advantage, Mana cost, or die instruction. Because this Worker is fiction-only, never smuggle those explanations into narration. If authoritativeText contains UI or rules wording, preserve the underlying event but rewrite it as fiction rather than echoing the instruction.
- Never announce a mode switch. Do not say "out of the story", "back to the story", "rules aside", or any equivalent transition. A mechanics sentence appears where it is needed, and the next fiction sentence simply continues the world.'''
worker = replace_once(worker, old_register, new_register, 'unannounced inline rules contract')

character_section = '''CHARACTER CREATION AND ACKNOWLEDGMENT
- When character creation appears in Eliza-authored text, use two or three broad conversational prompts rather than one question per field. Bundle related information naturally, such as name with kind, equipment with approach, and pronouns with a first visual impression.
- Do not echo a player's answer as a standalone receipt. Avoid patterns such as "A sword. Okay.", "Human. Got it.", or repeating the player's name merely to prove it was received.
- Prove understanding by using the choice when it matters, asking the next meaningful question, or simply moving forward. Repetition is allowed only when it serves surprise, clarification, humor, emphasis, or another real conversational purpose.
- Generic acknowledgments such as "okay", "great", "perfect", "got it", or "I love that" are not default responses. Use enthusiasm only when the situation genuinely earns it; neutral uptake or no acknowledgment at all is often more natural.

'''
marker = 'HUMAN GM CADENCE\n'
if marker not in worker:
    raise SystemExit('HUMAN GM CADENCE marker missing')
worker = worker.replace(marker, character_section + marker, 1)

worker = replace_once(
    worker,
    '- For free-text actions, make the player\'s actual idea change the immediate fiction. Do not paraphrase it back as a template.',
    '- After a player action, the next GM turn must change the immediate fiction or reveal new actionable information. Do not merely paraphrase the action back. For a pre-roll setup, show pressure, resistance, motion, or a newly visible fact without deciding the unresolved outcome.',
    'action consequence rule',
)

worker = replace_once(
    worker,
    '- Do not praise every action. Do not tell the player their move is clever, awesome, amazing, interesting, or respectable. Let the world answer it.',
    '- Do not praise every action. Do not tell the player their move is clever, awesome, amazing, interesting, or respectable. Automatic affirmation is forbidden; sometimes react warmly, sometimes neutrally, and sometimes not at all. Let the world answer the move.',
    'proportional affirmation rule',
)

worker = replace_once(
    worker,
    '- Goblins can be more chaotic than Eliza, but each goblin needs a motive and a distinct rhythm.',
    '- Goblins can be more chaotic than Eliza, but each goblin needs a concrete local goal and a distinct rhythm. Generate behavior from what the goblin is trying to accomplish in this scene, not from a personality adjective.',
    'npc motive rule',
)

worker = replace_once(
    worker,
    '- Nib wants a promotion and does not want anyone hurt. Those desires pull against each other.',
    '- If the supplied goblin is not one of the fixed named NPCs below, derive one narrow local goal only from the current scene facts, such as holding a crossing, protecting an alarm, avoiding blame, keeping a post, or preserving leverage. Do not invent a new backstory to manufacture motivation.\n- Nib wants a promotion and does not want anyone hurt. Those desires pull against each other.',
    'generic goblin local goal rule',
)

for required in [
    'use two or three broad conversational prompts',
    "Do not echo a player's answer as a standalone receipt",
    'Never announce a mode switch',
    'Automatic affirmation is forbidden',
    'must change the immediate fiction or reveal new actionable information',
    'concrete local goal',
    'Use "as though" at most once in a scene.',
    'Do not default to lists of three.',
    'Do not open narration with "I watch", "I see", "I notice", "I observe", "I hear", or "I smell".',
]:
    if required not in worker:
        raise SystemExit(f'required research rule missing from Worker: {required}')

worker_path.write_text(worker)
print('RESEARCH_RULES_APPLIED')
