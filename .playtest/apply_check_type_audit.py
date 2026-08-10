from pathlib import Path


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing expected source for {label}')
    return text.replace(old, new, 1)


# Chapter 1: keep Strength/Defense as the mechanical modifiers, but attach a
# separate fictional check type to every rolled action.
engine_path = Path('src/features/games/weed-goblins/weedGoblinsEngine.js')
engine = engine_path.read_text()

marker = "function noRollPreview() {\n"
chapter_one_types = '''function chapterOneCheckTypeForAction(actionId, stat) {
  const types = {
    'route:quiet': 'Stealth',
    'route:loud': 'Athletics',
    'goblin:channel': 'Deception',
    'goblin:strike': 'Strength',
    'goblin:guard': 'Defense',
    'midpoint:read-runes': 'Investigation',
    'midpoint:take-charm': 'Stealth',
    'free-text:midpoint:strength': 'Athletics',
    'free-text:midpoint:defense': 'Defense',
    'free-text:midpoint:mana': 'Arcana',
    'camp:force-ledger': 'Athletics',
    'camp:expose-tribute': 'Investigation',
    'camp:protect-tribute': 'Deception',
    'latch:read-face': 'Investigation',
    'latch:force': 'Athletics',
    'latch:channel': 'Investigation',
    'boss:overpower': 'Strength',
    'boss:outlast': 'Defense',
    'boss:spell': 'Persuasion',
  }
  return types[actionId] || (stat === 'strength' ? 'Athletics' : 'Defense')
}

'''
engine = replace_once(engine, marker, chapter_one_types + marker, 'Chapter 1 check type map')
engine = replace_once(
    engine,
    "    stat: null,\n    dc: null,",
    "    stat: null,\n    checkType: null,\n    dc: null,",
    'Chapter 1 no-roll check type',
)
engine = replace_once(
    engine,
    "function checkPreview(state, { stat, dc, manaCost = 0 }) {",
    "function checkPreview(state, { actionId = '', stat, dc, manaCost = 0 }) {",
    'Chapter 1 preview action id',
)
engine = replace_once(
    engine,
    "    stat,\n    dc,\n    statBonus,",
    "    stat,\n    checkType: chapterOneCheckTypeForAction(actionId, stat),\n    dc,\n    statBonus,",
    'Chapter 1 preview semantic check type',
)
engine = engine.replace('return checkPreview(state, { stat:', 'return checkPreview(state, { actionId: id, stat:')
engine = engine.replace('return checkPreview(state, {\n        stat:', 'return checkPreview(state, {\n        actionId: id,\n        stat:')
engine = engine.replace('return checkPreview(state, {\n      stat:', 'return checkPreview(state, {\n      actionId: id,\n      stat:')
# Route preview is formatted with an object whose first field is stat.
engine = engine.replace('return checkPreview(state, {\n      stat: route.stat,', 'return checkPreview(state, {\n      actionId: id,\n      stat: route.stat,')

for required in [
    "'latch:read-face': 'Investigation'",
    "'route:quiet': 'Stealth'",
    "'camp:protect-tribute': 'Deception'",
    "'boss:spell': 'Persuasion'",
    'checkType: chapterOneCheckTypeForAction(actionId, stat)',
]:
    if required not in engine:
        raise SystemExit(f'Chapter 1 semantic check type missing: {required}')
engine_path.write_text(engine)


# Chapter 2: central action-id mapping plus semantic inference for custom text.
chapter_two_path = Path('src/features/games/weed-goblins/weedGoblinsChapterTwoRuntime.js')
chapter_two = chapter_two_path.read_text()
chapter_two_marker = "function noRollPreview() {\n"
chapter_two_types = '''function chapterTwoCheckTypeForAction(actionId, stat) {
  const types = {
    'entry:negotiate': 'Persuasion',
    'trace:sixfinger': 'Persuasion',
    'trace:nettle': 'Stealth',
    'trace:receipt': 'Investigation',
    'collector:evade': 'Acrobatics',
    'collector:brace': 'Athletics',
    'collector:climb': 'Athletics',
    'collector:cut-roots': 'Athletics',
    'collector:mana': 'Acrobatics',
    'ledger:lie': 'Deception',
    'ledger:mana': 'Investigation',
    'ledger:burn-flood': 'Athletics',
    'ledger:take-route': 'Deception',
    'exit:settle': 'Persuasion',
  }
  return types[actionId] || (stat === 'strength' ? 'Athletics' : 'Defense')
}

function inferChapterTwoFreeTextCheckType(playerAction, stat) {
  const text = String(playerAction || '').toLowerCase()
  if (/\\b(?:read|inspect|study|decode|investigate|examine|trace|pattern|receipt|ledger)\\b/.test(text)) return 'Investigation'
  if (/\\b(?:sneak|quietly|silently|hide|shadow|follow unnoticed|without being seen)\\b/.test(text)) return 'Stealth'
  if (/\\b(?:convince|persuade|negotiate|bargain|reason|appeal|settle)\\b/.test(text)) return 'Persuasion'
  if (/\\b(?:lie|deceive|bluff|trick|mislead|fake|forge)\\b/.test(text)) return 'Deception'
  if (/\\b(?:read them|read him|read her|judge|motive|tell whether)\\b/.test(text)) return 'Insight'
  if (/\\b(?:force|break|smash|lift|brace|cut|climb|pull|push|overpower|burn|flood)\\b/.test(text)) return 'Athletics'
  if (/\\b(?:dodge|evade|duck|weave|thread|move between|slip between)\\b/.test(text)) return 'Acrobatics'
  if (/\\b(?:mana|magic|spell|arcane|channel)\\b/.test(text)) return 'Arcana'
  return stat === 'strength' ? 'Athletics' : 'Defense'
}

'''
chapter_two = replace_once(chapter_two, chapter_two_marker, chapter_two_types + chapter_two_marker, 'Chapter 2 check type map')
chapter_two = replace_once(
    chapter_two,
    "    stat: null,\n    dc: null,",
    "    stat: null,\n    checkType: null,\n    dc: null,",
    'Chapter 2 no-roll check type',
)
chapter_two = replace_once(
    chapter_two,
    "    stat,\n    dc: tier.dc,\n    statBonus,",
    "    stat,\n    checkType: chapterTwoCheckTypeForAction(selected.id, stat),\n    dc: tier.dc,\n    statBonus,",
    'Chapter 2 built-in preview check type',
)
# The plan preview has the same stat/dc/statBonus block later in the file.
chapter_two = replace_once(
    chapter_two,
    "    stat,\n    dc: tier.dc,\n    statBonus,",
    "    stat,\n    checkType: inferChapterTwoFreeTextCheckType(plan.playerAction, stat),\n    dc: tier.dc,\n    statBonus,",
    'Chapter 2 free-text preview check type',
)
chapter_two = replace_once(
    chapter_two,
    "    stat: preview.stat,\n    dc: preview.dc,",
    "    stat: preview.stat,\n    checkType: preview.checkType,\n    dc: preview.dc,",
    'Chapter 2 resolved event check type',
)
for required in [
    "'trace:nettle': 'Stealth'",
    "'ledger:lie': 'Deception'",
    "'exit:settle': 'Persuasion'",
    'checkType: chapterTwoCheckTypeForAction(selected.id, stat)',
    'checkType: inferChapterTwoFreeTextCheckType(plan.playerAction, stat)',
]:
    if required not in chapter_two:
        raise SystemExit(f'Chapter 2 semantic check type missing: {required}')
chapter_two_path.write_text(chapter_two)


# Chapter 3: same separation, with ecological and movement actions classified by fiction.
chapter_three_path = Path('src/features/games/weed-goblins/weedGoblinsChapterThreeRuntime.js')
chapter_three = chapter_three_path.read_text()
chapter_three_marker = "function noRollPreview() {\n"
chapter_three_types = '''function chapterThreeCheckTypeForAction(actionId, stat) {
  const types = {
    'stalker:stillness': 'Stealth',
    'stalker:break-cover': 'Athletics',
    'stalker:resin-shadow': 'Stealth',
    'stalker:mana-decoy': 'Deception',
    'nursery:lift-roots': 'Athletics',
    'nursery:thread-path': 'Acrobatics',
    'nursery:mana-lure': 'Deception',
    'siphon:read-conduits': 'Investigation',
    'siphon:brace-lines': 'Athletics',
    'siphon:mana-sense': 'Investigation',
    'draw:hold-lines': 'Athletics',
    'draw:ride-pulse': 'Acrobatics',
    'draw:cut-leech': 'Athletics',
    'draw:prepared-channel': 'Defense',
    'draw:mana-anchor': 'Defense',
    'decision:burn': 'Survival',
    'decision:redirect': 'Investigation',
  }
  return types[actionId] || (stat === 'strength' ? 'Athletics' : 'Defense')
}

function inferChapterThreeFreeTextCheckType(playerAction, stat) {
  const text = String(playerAction || '').toLowerCase()
  if (/\\b(?:read|inspect|study|decode|investigate|examine|trace|pattern|conduit|rings?|stones?)\\b/.test(text)) return 'Investigation'
  if (/\\b(?:sneak|quietly|silently|hide|shadow|cover|without being seen)\\b/.test(text)) return 'Stealth'
  if (/\\b(?:convince|persuade|negotiate|bargain|reason|appeal)\\b/.test(text)) return 'Persuasion'
  if (/\\b(?:lie|deceive|bluff|trick|mislead|decoy|lure)\\b/.test(text)) return 'Deception'
  if (/\\b(?:force|break|smash|lift|brace|cut|climb|pull|push|hold the line)\\b/.test(text)) return 'Athletics'
  if (/\\b(?:dodge|evade|duck|weave|thread|move between|ride the pulse)\\b/.test(text)) return 'Acrobatics'
  if (/\\b(?:burn|forage|survival|controlled fire)\\b/.test(text)) return 'Survival'
  if (/\\b(?:mana|magic|spell|arcane|channel)\\b/.test(text)) return 'Arcana'
  return stat === 'strength' ? 'Athletics' : 'Defense'
}

'''
chapter_three = replace_once(chapter_three, chapter_three_marker, chapter_three_types + chapter_three_marker, 'Chapter 3 check type map')
chapter_three = replace_once(
    chapter_three,
    "    stat: null,\n    dc: null,",
    "    stat: null,\n    checkType: null,\n    dc: null,",
    'Chapter 3 no-roll check type',
)
chapter_three = replace_once(
    chapter_three,
    "    stat,\n    dc: tier.dc,\n    statBonus,",
    "    stat,\n    checkType: chapterThreeCheckTypeForAction(selected.id, stat),\n    dc: tier.dc,\n    statBonus,",
    'Chapter 3 built-in preview check type',
)
chapter_three = replace_once(
    chapter_three,
    "    stat,\n    dc: tier.dc,\n    statBonus,",
    "    stat,\n    checkType: inferChapterThreeFreeTextCheckType(plan.playerAction, stat),\n    dc: tier.dc,\n    statBonus,",
    'Chapter 3 free-text preview check type',
)
chapter_three = replace_once(
    chapter_three,
    "    stat: preview.stat,\n    dc: preview.dc,",
    "    stat: preview.stat,\n    checkType: preview.checkType,\n    dc: preview.dc,",
    'Chapter 3 resolved event check type',
)
for required in [
    "'stalker:stillness': 'Stealth'",
    "'siphon:read-conduits': 'Investigation'",
    "'decision:burn': 'Survival'",
    'checkType: chapterThreeCheckTypeForAction(selected.id, stat)',
    'checkType: inferChapterThreeFreeTextCheckType(plan.playerAction, stat)',
]:
    if required not in chapter_three:
        raise SystemExit(f'Chapter 3 semantic check type missing: {required}')
chapter_three_path.write_text(chapter_three)


# Player-facing check text. This is deterministic UI/controller text, not Worker prose.
def patch_controller(path, chapter_label):
    text = path.read_text()
    old = "  const statLabel = preview.stat === 'strength' ? 'Strength' : 'Defense'\n"
    new = "  const statLabel = preview.stat === 'strength' ? 'Strength' : 'Defense'\n  const checkTypeLabel = preview.checkType || statLabel\n"
    text = replace_once(text, old, new, f'{chapter_label} check type display label')

    if chapter_label == 'Chapter 1':
        old_adv = "    return `That needs a roll. It's a ${statLabel} check, DC ${preview.dc}. You're spending ${preview.manaCost} Mana, so roll two D20s and keep the higher. With +${preview.statBonus}, you need ${preview.requiredDie} or better on either die.`"
        new_adv = "    const modifier = checkTypeLabel === statLabel ? `With +${preview.statBonus}` : `Using your ${statLabel} +${preview.statBonus}`\n    return `That needs a roll. It's a ${checkTypeLabel} check, DC ${preview.dc}. You're spending ${preview.manaCost} Mana, so roll two D20s and keep the higher. ${modifier}, you need ${preview.requiredDie} or better on either die.`"
        text = replace_once(text, old_adv, new_adv, 'Chapter 1 advantage check wording')
        old_plain = "  return `That needs a roll. It's a ${statLabel} check, DC ${preview.dc}. You've got +${preview.statBonus}, so you need ${preview.requiredDie} or better on the die.`"
        new_plain = "  const modifier = checkTypeLabel === statLabel ? `You've got +${preview.statBonus}` : `Using your ${statLabel} +${preview.statBonus}`\n  return `That needs a roll. It's a ${checkTypeLabel} check, DC ${preview.dc}. ${modifier}, so you need ${preview.requiredDie} or better on the die.`"
        text = replace_once(text, old_plain, new_plain, 'Chapter 1 normal check wording')
    else:
        old_return = "  return `${tierText}${advantageText}This is DC ${preview.dc}. Your ${statLabel} is +${preview.statBonus}, so you need ${preview.requiredDie} or better ${diePhrase}. Roll it.`"
        new_return = "  const modifierText = checkTypeLabel === statLabel\n    ? `Your ${statLabel} is +${preview.statBonus}`\n    : `This uses your ${statLabel} +${preview.statBonus}`\n  return `${tierText}${advantageText}${checkTypeLabel} check, DC ${preview.dc}. ${modifierText}, so you need ${preview.requiredDie} or better ${diePhrase}. Roll it.`"
        text = replace_once(text, old_return, new_return, f'{chapter_label} semantic check wording')

    if 'checkTypeLabel' not in text:
        raise SystemExit(f'{chapter_label} check type label was not installed')
    path.write_text(text)


patch_controller(Path('src/features/games/weed-goblins/weedGoblinsChatControllerChapterOne.js'), 'Chapter 1')
patch_controller(Path('src/features/games/weed-goblins/weedGoblinsChapterTwoChatController.js'), 'Chapter 2')
patch_controller(Path('src/features/games/weed-goblins/weedGoblinsChapterThreeChatController.js'), 'Chapter 3')

print('CHECK_TYPE_AUDIT_APPLIED')
