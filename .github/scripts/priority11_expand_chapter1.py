from pathlib import Path
import re

ROOT = Path('src/features/games/weed-goblins')


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}_COUNT_{count}')
    return text.replace(old, new, 1)


def replace_function(text, name, next_name, replacement):
    pattern = rf"function {re.escape(name)}\(.*?(?=\nfunction {re.escape(next_name)}\()"
    updated, count = re.subn(pattern, replacement.rstrip() + '\n\n', text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'FUNCTION_{name}_COUNT_{count}')
    return updated


# Canonical Chapter 1 content registry.
(ROOT / 'weedGoblinsChapterOne.js').write_text(r'''export const CHAPTER_ONE_NPCS = Object.freeze({
  goblinKing: Object.freeze({
    id: 'goblin-king',
    name: 'Goblin King',
    role: 'Theatrical ruler of the Highlands who is more frightened than he admits.',
  }),
  nib: Object.freeze({
    id: 'nib',
    name: 'Nib',
    role: 'Young scout who wants a promotion and does not want anyone hurt.',
  }),
  grubbin: Object.freeze({
    id: 'grubbin',
    name: 'Grubbin',
    role: 'Stash keeper who resents the King for sending the best goods away as tribute.',
  }),
  oldTatter: Object.freeze({
    id: 'old-tatter',
    name: 'Old Tatter',
    role: 'Retired raider who recognizes the black-root seal.',
  }),
})

export const CHAPTER_ONE_NPC_LIST = Object.freeze(Object.values(CHAPTER_ONE_NPCS))

export const CHAPTER_ONE_PUZZLES = Object.freeze({
  rattlebridgeAlarmLines: Object.freeze({
    id: 'rattlebridge-alarm-lines',
    name: 'Rattlebridge alarm lines',
    roomId: 'rattlebridge',
  }),
  pictureTributeLedger: Object.freeze({
    id: 'picture-tribute-ledger',
    name: 'picture tribute ledger',
    roomId: 'highland-camp',
  }),
  carvedFaceStashLatch: Object.freeze({
    id: 'carved-face-stash-latch',
    name: 'carved-face stash latch',
    roomId: 'kings-stash-hall',
  }),
})

export const CHAPTER_ONE_REWARDS = Object.freeze({
  blackRootSeal: 'black-root seal',
  goblinFavor: 'goblin favor',
  highlandCharm: 'highland charm',
})

export const CHAPTER_ONE_BRANCH_VALUES = Object.freeze({
  nibTreatment: Object.freeze(['safe', 'bait', 'ignored']),
  tributeArrangement: Object.freeze(['exposed', 'protected', 'unknown']),
  kingTreatment: Object.freeze(['spared', 'humiliated', 'unresolved']),
  stolenItemCondition: Object.freeze(['intact', 'altered', 'not-recovered']),
})
''')

# Engine expansion without changing existing DC constants/stat math.
engine_path = ROOT / 'weedGoblinsEngine.js'
engine = engine_path.read_text()
engine = replace_once(
    engine,
    "} from './weedGoblinsRooms.js'\n",
    "} from './weedGoblinsRooms.js'\nimport { CHAPTER_ONE_REWARDS } from './weedGoblinsChapterOne.js'\n",
    'ENGINE_IMPORT',
)
engine = replace_once(
    engine,
    "  'You reach the correct tactical position one minute after it stops being the correct tactical position.',\n])",
    "  'You reach the correct tactical position one minute after it stops being the correct tactical position.',\n  'The picture tribute ledger flips itself to a page consisting entirely of accusing little arrows.',\n  'One carved face on the stash latch bites your glove and then looks smug about the paperwork.',\n])",
    'COMPLICATIONS',
)
engine = replace_once(
    engine,
    "  midpoint: 'midpoint',\n  boss: 'goblin-king',",
    "  midpoint: 'midpoint',\n  camp: 'highland-camp',\n  latch: 'stash-latch',\n  boss: 'goblin-king',",
    'SCENES',
)
engine = replace_once(
    engine,
    "function enterGoblinKingScene(state) {",
    "function enterHighlandCamp(state) {\n  return enterRoom(\n    cloneState(state, { sceneId: SCENES.camp }),\n    CHAPTER_ONE_ROOMS.highlandCamp.id,\n  )\n}\n\nfunction enterStashLatch(state) {\n  return enterRoom(\n    cloneState(state, { sceneId: SCENES.latch }),\n    CHAPTER_ONE_ROOMS.kingsStashHall.id,\n  )\n}\n\nfunction enterGoblinKingScene(state) {",
    'ROOM_ENTRY_HELPERS',
)
engine = replace_once(
    engine,
    "  if (String(actionId).startsWith('midpoint:')) return NATURAL_ONE_COMPLICATIONS[3]\n  if (String(actionId).startsWith('boss:')) return NATURAL_ONE_COMPLICATIONS[4]",
    "  if (String(actionId).startsWith('midpoint:')) return NATURAL_ONE_COMPLICATIONS[3]\n  if (String(actionId).startsWith('boss:')) return NATURAL_ONE_COMPLICATIONS[4]\n  if (String(actionId).startsWith('camp:')) return NATURAL_ONE_COMPLICATIONS[5]\n  if (String(actionId).startsWith('latch:')) return NATURAL_ONE_COMPLICATIONS[6]",
    'COMPLICATION_MAPPING',
)
engine = replace_once(
    engine,
    "function completeRun(state, ending, reason = null) {",
    r'''function stolenItemConditionForRun(state, ending) {
  if (ending === ENDINGS.escape) return 'not-recovered'
  return state.trouble >= 2 ? 'altered' : 'intact'
}

function chapterOneRewardsForRun(state) {
  const rewards = [CHAPTER_ONE_REWARDS.blackRootSeal]
  if (state.flags.goblinFavor) rewards.push(CHAPTER_ONE_REWARDS.goblinFavor)
  if (state.flags.hasHighlandCharm) rewards.push(CHAPTER_ONE_REWARDS.highlandCharm)
  return rewards
}

function completeRun(state, ending, reason = null) {''',
    'RUN_SUMMARY_HELPERS',
)
engine = replace_once(
    engine,
    "    midpointChoice: state.flags.midpointChoice,\n    ending,",
    "    midpointChoice: state.flags.midpointChoice,\n    chapterOneBranches: {\n      nibTreatment: state.flags.nibTreatment || 'ignored',\n      tributeArrangement: state.flags.tributeArrangement || 'unknown',\n      kingTreatment: state.flags.kingTreatment || 'unresolved',\n      stolenItemCondition: stolenItemConditionForRun(state, ending),\n    },\n    chapterOneRewards: chapterOneRewardsForRun(state),\n    ending,",
    'RUN_SUMMARY_FIELDS',
)
engine = replace_once(
    engine,
    "      goblinAlly: false,\n      bossDcModifier: 0,\n      sessionZeroComplete: false,",
    "      goblinAlly: false,\n      goblinFavor: false,\n      hasHighlandCharm: false,\n      blackRootSealKnown: false,\n      nibTreatment: null,\n      tributeArrangement: null,\n      kingTreatment: null,\n      latchOutcome: null,\n      bossDcModifier: 0,\n      sessionZeroComplete: false,",
    'INITIAL_FLAGS',
)

old_midpoint_preview = r'''  if (state.sceneId === SCENES.midpoint) {
    if (id === 'midpoint:help' || id === 'midpoint:skip') return noRollPreview()
    if (id === 'midpoint:read-runes') {
      return checkPreview(state, { stat: 'defense', dc: DIFFICULTY.standard, manaCost: 1 })
    }
    if (id === 'midpoint:take-token') {
      return checkPreview(state, {
        stat: 'defense',
        dc: DIFFICULTY.easy,
        manaCost: optionalManaCost(options),
      })
    }
    if (id.startsWith('free-text:midpoint:')) {
      const style = id.slice('free-text:midpoint:'.length)
      const manaCost = style === 'mana' ? 1 : 0
      const stat = style === 'strength' ? 'strength' : 'defense'
      return checkPreview(state, { stat, dc: DIFFICULTY.standard, manaCost })
    }
    return noRollPreview()
  }

  if (state.sceneId === SCENES.boss) {'''
new_midpoint_preview = r'''  if (state.sceneId === SCENES.midpoint) {
    if (['midpoint:help', 'midpoint:bait-nib', 'midpoint:skip'].includes(id)) return noRollPreview()
    if (id === 'midpoint:read-runes') {
      return checkPreview(state, { stat: 'defense', dc: DIFFICULTY.standard, manaCost: 1 })
    }
    if (id === 'midpoint:take-charm') {
      return checkPreview(state, {
        stat: 'defense',
        dc: DIFFICULTY.easy,
        manaCost: optionalManaCost(options),
      })
    }
    if (id.startsWith('free-text:midpoint:')) {
      const style = id.slice('free-text:midpoint:'.length)
      const manaCost = style === 'mana' ? 1 : 0
      const stat = style === 'strength' ? 'strength' : 'defense'
      return checkPreview(state, { stat, dc: DIFFICULTY.standard, manaCost })
    }
    return noRollPreview()
  }

  if (state.sceneId === SCENES.camp) {
    if (['camp:question-grubbin', 'camp:ask-old-tatter', 'camp:move-on'].includes(id)) {
      return noRollPreview()
    }
    if (id === 'camp:force-ledger') {
      return checkPreview(state, { stat: 'strength', dc: DIFFICULTY.standard, manaCost: optionalManaCost(options) })
    }
    if (['camp:expose-tribute', 'camp:protect-tribute'].includes(id)) {
      return checkPreview(state, { stat: 'defense', dc: DIFFICULTY.standard, manaCost: optionalManaCost(options) })
    }
    return noRollPreview()
  }

  if (state.sceneId === SCENES.latch) {
    if (id === 'latch:use-charm') return noRollPreview()
    if (id === 'latch:channel') {
      return checkPreview(state, { stat: 'defense', dc: DIFFICULTY.standard, manaCost: 1 })
    }
    if (id === 'latch:force') {
      return checkPreview(state, { stat: 'strength', dc: DIFFICULTY.standard, manaCost: optionalManaCost(options) })
    }
    if (id === 'latch:read-face') {
      return checkPreview(state, { stat: 'defense', dc: DIFFICULTY.standard, manaCost: optionalManaCost(options) })
    }
    return noRollPreview()
  }

  if (state.sceneId === SCENES.boss) {'''
engine = replace_once(engine, old_midpoint_preview, new_midpoint_preview, 'PREVIEW_SCENES')

old_midpoint_actions = r'''  if (state.sceneId === SCENES.midpoint) {
    const actions = [
      { id: 'midpoint:help', label: 'Help Nib untangle a snapped tripwire' },
      { id: 'midpoint:take-token', label: 'Take the unattended tribute token' },
      { id: 'midpoint:skip', label: 'Keep moving' },
    ]
    if (state.stats.manaPool >= 1) {
      actions.push({ id: 'midpoint:read-runes', label: 'Spend 1 Mana for advantage while reading the old trail-runes at Cloudberry Shelf' })
    }
    return actions
  }

  if (state.sceneId === SCENES.boss) {
    const actions = [
      { id: 'boss:overpower', label: 'Overpower the Goblin King' },
      { id: 'boss:outlast', label: 'Outlast the Goblin King' },
    ]'''
new_midpoint_actions = r'''  if (state.sceneId === SCENES.midpoint) {
    const actions = [
      { id: 'midpoint:help', label: 'Keep Nib safe and help with the snapped tripwire' },
      { id: 'midpoint:bait-nib', label: 'Use Nib as bait to draw the patrol away' },
      { id: 'midpoint:take-charm', label: 'Take the unattended highland charm' },
      { id: 'midpoint:skip', label: 'Keep moving' },
    ]
    if (state.stats.manaPool >= 1) {
      actions.push({ id: 'midpoint:read-runes', label: 'Spend 1 Mana for advantage while reading the old trail-runes at Cloudberry Shelf' })
    }
    return actions
  }

  if (state.sceneId === SCENES.camp) {
    return [
      { id: 'camp:expose-tribute', label: 'Use the picture ledger to expose the tribute arrangement' },
      { id: 'camp:protect-tribute', label: 'Alter the picture ledger to protect the tribute arrangement' },
      { id: 'camp:question-grubbin', label: 'Ask Grubbin why the best goods leave camp' },
      { id: 'camp:ask-old-tatter', label: 'Ask Old Tatter about the black-root seal' },
      { id: 'camp:move-on', label: 'Leave the ledger alone and head for the Stash Hall' },
      { id: 'camp:force-ledger', label: 'Pull the tribute ledger loose and take the evidence with you' },
    ]
  }

  if (state.sceneId === SCENES.latch) {
    const actions = [
      { id: 'latch:read-face', label: 'Read the carved faces and set the latch correctly' },
      { id: 'latch:force', label: 'Force the carved-face latch open' },
    ]
    if (state.stats.manaPool >= 1) {
      actions.push({ id: 'latch:channel', label: 'Spend 1 Mana for advantage while reading the latch' })
    }
    if (state.flags.hasHighlandCharm) {
      actions.push({ id: 'latch:use-charm', label: 'Fit the highland charm into the latch' })
    }
    return actions
  }

  if (state.sceneId === SCENES.boss) {
    const actions = [
      { id: 'boss:overpower', label: 'Humiliate the Goblin King and take it back' },
      { id: 'boss:outlast', label: 'Spare the Goblin King, but make him surrender it' },
    ]'''
engine = replace_once(engine, old_midpoint_actions, new_midpoint_actions, 'AVAILABLE_SCENES')

old_midpoint_advance = r'''  if (state.sceneId === SCENES.midpoint) {
    if (actionId === 'midpoint:help') {
      return enterGoblinKingScene(
        appendEvent(
          cloneState(state, {
            flags: { midpointChoice: 'help', goblinAlly: true },
          }),
          { type: 'choice', sceneId: SCENES.midpoint, actionId },
          'You help a nervous young scout named Nib untangle a snapped tripwire. Nib is grateful, and a little surprised anyone bothered.',
        ),
      )
    }

    if (actionId === 'midpoint:read-runes') {
      const result = resolveCheck(
        cloneState(state, { flags: { midpointChoice: 'read-runes' } }),
        {
          actionId,
          stat: 'defense',
          dc: DIFFICULTY.standard,
          manaCost: 1,
          successText: "The old trail-runes at Cloudberry Shelf explain the Stash Hall's entrance in unnecessary detail. I approve of the detail.",
          failureText: 'The runes include a footnote you interpret as optional. The entrance does not.',
        },
      )
      if (result.state.status === 'completed') return result.state
      return enterGoblinKingScene(
        cloneState(result.state, {
          flags: { bossDcModifier: result.success ? -2 : 1 },
        }),
      )
    }

    if (actionId === 'midpoint:take-token') {
      const result = resolveCheck(
        cloneState(state, { flags: { midpointChoice: 'take-token' } }),
        {
          actionId,
          stat: 'defense',
          dc: DIFFICULTY.easy,
          successText: 'You take the unattended tribute token without waking the small but judgmental bell.',
          failureText: 'The bell announces your decision to the entire camp.',
          manaCost: optionalManaCost(options),
        },
      )
      if (result.state.status === 'completed') return result.state
      return enterGoblinKingScene(
        cloneState(result.state, {
          flags: { bossDcModifier: result.success ? -1 : 1 },
        }),
      )
    }

    return enterGoblinKingScene(
      appendEvent(
        cloneState(state, { flags: { midpointChoice: 'skip' } }),
        { type: 'choice', sceneId: SCENES.midpoint, actionId },
        'You continue without interfering. This is a valid choice. I have no additional comment. I have several comments.',
      ),
    )
  }

  if (state.sceneId === SCENES.boss) {'''
new_midpoint_advance = r'''  if (state.sceneId === SCENES.midpoint) {
    if (actionId === 'midpoint:help') {
      return enterHighlandCamp(
        appendEvent(
          cloneState(state, {
            flags: {
              midpointChoice: 'help',
              goblinAlly: true,
              goblinFavor: true,
              nibTreatment: 'safe',
            },
          }),
          { type: 'choice', sceneId: SCENES.midpoint, actionId },
          'You keep Nib out of the patrol path and help untangle the snapped tripwire. He immediately starts practicing how he will describe this during his promotion review.',
        ),
      )
    }

    if (actionId === 'midpoint:bait-nib') {
      return enterHighlandCamp(
        appendEvent(
          cloneState(state, {
            flags: {
              midpointChoice: 'bait-nib',
              nibTreatment: 'bait',
              bossDcModifier: -1,
            },
          }),
          { type: 'choice', sceneId: SCENES.midpoint, actionId },
          'Nib draws the patrol away while loudly insisting this absolutely counts toward a promotion. The path to Highland Camp opens behind him.',
        ),
      )
    }

    if (actionId === 'midpoint:read-runes') {
      const result = resolveCheck(
        cloneState(state, { flags: { midpointChoice: 'read-runes', nibTreatment: 'ignored' } }),
        {
          actionId,
          stat: 'defense',
          dc: DIFFICULTY.standard,
          manaCost: 1,
          successText: "The old trail-runes at Cloudberry Shelf explain the Stash Hall's entrance in unnecessary detail. The goblins included a diagram and then argued with it in the margin.",
          failureText: 'The runes include a footnote you interpret as optional. The entrance does not.',
        },
      )
      if (result.state.status === 'completed') return result.state
      return enterHighlandCamp(
        cloneState(result.state, {
          flags: { bossDcModifier: result.success ? -2 : 1 },
        }),
      )
    }

    if (actionId === 'midpoint:take-charm') {
      const result = resolveCheck(
        cloneState(state, { flags: { midpointChoice: 'take-charm', nibTreatment: 'ignored' } }),
        {
          actionId,
          stat: 'defense',
          dc: DIFFICULTY.easy,
          successText: 'You lift the unattended highland charm without waking the small but judgmental bell beside it.',
          failureText: 'The bell announces your interest in the highland charm to everyone with ears and several things without them.',
          manaCost: optionalManaCost(options),
        },
      )
      if (result.state.status === 'completed') return result.state
      return enterHighlandCamp(
        cloneState(result.state, {
          flags: {
            hasHighlandCharm: result.success,
            bossDcModifier: result.success ? -1 : 1,
          },
        }),
      )
    }

    return enterHighlandCamp(
      appendEvent(
        cloneState(state, { flags: { midpointChoice: 'skip', nibTreatment: 'ignored' } }),
        { type: 'choice', sceneId: SCENES.midpoint, actionId },
        'You leave Nib, the charm, and the trail-runes where they are and keep moving toward Highland Camp.',
      ),
    )
  }

  if (state.sceneId === SCENES.camp) {
    if (actionId === 'camp:question-grubbin') {
      return enterStashLatch(
        appendEvent(
          cloneState(state, {
            flags: { tributeArrangement: 'exposed', blackRootSealKnown: true },
          }),
          { type: 'choice', sceneId: SCENES.camp, actionId },
          "Grubbin, the stash keeper, points at the picture ledger and complains that the King keeps sending the best goods away as tribute. Every outgoing crate carries the same black-root seal.",
        ),
      )
    }

    if (actionId === 'camp:ask-old-tatter') {
      return enterStashLatch(
        appendEvent(
          cloneState(state, { flags: { tributeArrangement: 'unknown', blackRootSealKnown: true } }),
          { type: 'choice', sceneId: SCENES.camp, actionId },
          "Old Tatter turns the ledger over once, taps the black-root seal with a scarred finger, and identifies it as an old tribute mark from beyond the Highlands.",
        ),
      )
    }

    if (actionId === 'camp:move-on') {
      return enterStashLatch(
        appendEvent(
          cloneState(state, { flags: { tributeArrangement: 'unknown' } }),
          { type: 'choice', sceneId: SCENES.camp, actionId },
          "You leave Grubbin, Old Tatter, and the picture ledger to their argument and take the uphill path to the King's Stash Hall.",
        ),
      )
    }

    const exposing = actionId === 'camp:expose-tribute' || actionId === 'camp:force-ledger'
    const protecting = actionId === 'camp:protect-tribute'
    const result = resolveCheck(state, {
      actionId,
      stat: actionId === 'camp:force-ledger' ? 'strength' : 'defense',
      dc: DIFFICULTY.standard,
      successText: exposing
        ? 'The picture tribute ledger gives up its pattern: the best goods are leaving Highland Camp under the black-root seal.'
        : 'You alter the picture ledger just enough that the tribute arrangement becomes somebody else’s administrative problem.',
      failureText: exposing
        ? 'The picture ledger refuses to become evidence neatly, but the black-root seal on its cover is impossible to miss.'
        : 'Your attempt to protect the tribute arrangement leaves a correction so obvious that Grubbin winces professionally.',
      manaCost: optionalManaCost(options),
    })
    if (result.state.status === 'completed') return result.state
    return enterStashLatch(
      cloneState(result.state, {
        flags: {
          tributeArrangement: protecting ? 'protected' : 'exposed',
          blackRootSealKnown: true,
          goblinFavor: protecting && result.success ? true : result.state.flags.goblinFavor,
          bossDcModifier: result.state.flags.bossDcModifier + (result.success ? -1 : 1),
        },
      }),
    )
  }

  if (state.sceneId === SCENES.latch) {
    if (actionId === 'latch:use-charm') {
      return enterGoblinKingScene(
        appendEvent(
          cloneState(state, { flags: { latchOutcome: 'charm', bossDcModifier: state.flags.bossDcModifier - 1 } }),
          { type: 'choice', sceneId: SCENES.latch, actionId },
          'The highland charm fits into the carved-face latch like the goblins designed a master key and then forgot to mention it.',
        ),
      )
    }

    const isForce = actionId === 'latch:force'
    const isMana = actionId === 'latch:channel'
    const result = resolveCheck(state, {
      actionId,
      stat: isForce ? 'strength' : 'defense',
      dc: DIFFICULTY.standard,
      manaCost: isMana ? 1 : optionalManaCost(options),
      successText: isForce
        ? 'The carved-face latch gives way with all four faces looking personally offended.'
        : 'You rotate the carved faces into the one expression the goblins apparently consider trustworthy. The latch clicks open.',
      failureText: isForce
        ? 'The carved faces hold. One of them appears to enjoy this more than the others.'
        : 'The carved faces settle into the wrong order and a tiny wooden tongue sticks out from the center of the latch.',
    })
    if (result.state.status === 'completed') return result.state
    return enterGoblinKingScene(
      cloneState(result.state, {
        flags: {
          latchOutcome: result.success ? 'opened-cleanly' : 'opened-with-trouble',
          bossDcModifier: result.state.flags.bossDcModifier + (result.success ? -1 : 1),
        },
      }),
    )
  }

  if (state.sceneId === SCENES.boss) {'''
engine = replace_once(engine, old_midpoint_advance, new_midpoint_advance, 'ADVANCE_SCENES')
engine = replace_once(
    engine,
    "      return completeRun(state, ENDINGS.bargain, 'goblin clerk testimony')",
    "      return completeRun(\n        cloneState(state, { flags: { kingTreatment: 'spared', goblinFavor: true } }),\n        ENDINGS.bargain,\n        'goblin ally testimony',\n      )",
    'BARGAIN_BRANCH',
)
engine = replace_once(
    engine,
    "      if (result.success) return completeRun(result.state, ENDINGS.recovery, 'mana-assisted victory')",
    "      if (result.success) {\n        return completeRun(\n          cloneState(result.state, { flags: { kingTreatment: 'spared' } }),\n          ENDINGS.recovery,\n          'mana-assisted victory',\n        )\n      }",
    'SPELL_BRANCH',
)
engine = replace_once(
    engine,
    "    if (result.success) return completeRun(result.state, ENDINGS.recovery, `${stat} victory`)",
    "    if (result.success) {\n      return completeRun(\n        cloneState(result.state, {\n          flags: {\n            kingTreatment: isOverpower ? 'humiliated' : 'spared',\n            goblinFavor: isOverpower ? result.state.flags.goblinFavor : true,\n          },\n        }),\n        ENDINGS.recovery,\n        `${stat} victory`,\n      )\n    }",
    'BOSS_TREATMENT',
)
engine = replace_once(
    engine,
    "  return enterGoblinKingScene(result.state)\n}",
    "  return enterHighlandCamp(result.state)\n}",
    'FREE_TEXT_MIDPOINT_DESTINATION',
)
engine_path.write_text(engine)

# Contextual choices. Engine choices remain authoritative; suggestions only fill unused UI slots.
(ROOT / 'weedGoblinsChoices.js').write_text(r'''const MAX_GAMEPLAY_CHOICES = 5

function suggestedChoice(id, label, playerAction) {
  return Object.freeze({ id, label, playerAction, inputMode: 'free-text' })
}

function routeSuggestions() {
  return [
    suggestedChoice('suggested:route:mana-crossing', 'Use Mana to read the safest crossing', 'Use Mana to read the safest way across Rattlebridge'),
    suggestedChoice('suggested:route:break-alarm', 'Break through an alarm line', 'Break an alarm line and push across Rattlebridge'),
    suggestedChoice('suggested:route:side-ropes', 'Crawl along the side ropes', 'Sneak across Rattlebridge along the side ropes'),
  ]
}

function goblinSuggestions(state) {
  const goblin = state?.goblinName || 'the goblin'
  return [
    suggestedChoice('suggested:goblin:persuade', `Talk your way past ${goblin}`, `Persuade ${goblin} to let me pass`),
    suggestedChoice('suggested:goblin:distract', `Distract ${goblin}`, `Distract ${goblin} and slip past`),
    suggestedChoice('suggested:goblin:charge', `Rush past ${goblin}`, `Shove past ${goblin} and keep moving`),
  ]
}

function midpointSuggestions() {
  return [
    suggestedChoice('suggested:midpoint:climb-around', 'Climb around the tripwire', 'Carefully climb around the tripwire at Cloudberry Shelf'),
    suggestedChoice('suggested:midpoint:force-line', 'Force the snagged line loose', 'Pull the snagged tripwire loose with force'),
  ]
}

function latchSuggestions() {
  return [
    suggestedChoice('suggested:latch:listen', 'Listen to the latch', 'Listen closely while moving one carved face at a time'),
    suggestedChoice('suggested:latch:jam', 'Jam the mechanism', 'Jam the carved-face latch and pry the door open'),
  ]
}

function bossSuggestions(state) {
  const stolenItem = state?.stolenItem || 'my stolen item'
  return [
    suggestedChoice('suggested:boss:persuade', 'Talk him into giving it back', `Persuade the Goblin King to give ${stolenItem} back`),
    suggestedChoice('suggested:boss:procedure', 'Bluff him with goblin procedure', 'Bluff the Goblin King with an invented goblin procedure'),
  ]
}

function suggestionsForState(state) {
  if (state?.sceneId === 'choose-route') return routeSuggestions()
  if (state?.sceneId === 'goblin-encounter') return goblinSuggestions(state)
  if (state?.sceneId === 'midpoint') return midpointSuggestions()
  if (state?.sceneId === 'stash-latch') return latchSuggestions()
  if (state?.sceneId === 'goblin-king') return bossSuggestions(state)
  return []
}

export function composeWeedGoblinsContextualChoices(state, engineActions = []) {
  const base = Array.isArray(engineActions) ? engineActions : []
  const suggestions = suggestionsForState(state)
  if (suggestions.length === 0) return Object.freeze([...base].slice(0, MAX_GAMEPLAY_CHOICES))
  return Object.freeze([...base, ...suggestions].slice(0, MAX_GAMEPLAY_CHOICES))
}

export function isWeedGoblinsSuggestedChoice(choice) {
  return Boolean(choice && choice.inputMode === 'free-text' && typeof choice.playerAction === 'string' && choice.playerAction.trim())
}
''')

# Free-text coverage for the new gameplay scenes and canonical NPC names.
free_path = ROOT / 'weedGoblinsFreeTextInterpreter.js'
free = free_path.read_text()
free = replace_once(
    free,
    "import { CHAPTER_ONE_ROOM_LIST } from './weedGoblinsRooms.js'\n",
    "import { CHAPTER_ONE_ROOM_LIST } from './weedGoblinsRooms.js'\nimport { CHAPTER_ONE_NPC_LIST } from './weedGoblinsChapterOne.js'\n",
    'FREE_IMPORT',
)
free = replace_once(
    free,
    "  'midpoint',\n  'goblin-king',",
    "  'midpoint',\n  'highland-camp',\n  'stash-latch',\n  'goblin-king',",
    'FREE_SCENES',
)
free = replace_once(
    free,
    "const BARGAIN_SIGNAL = /\\b(?:bargain|negotiate|make a deal|offer terms|invoke (?:the )?(?:clerk|witness)|call (?:the )?(?:clerk|witness)|ask (?:the )?clerk to testify|testimony)\\b/i\n",
    "const BARGAIN_SIGNAL = /\\b(?:bargain|negotiate|make a deal|offer terms|invoke (?:the )?(?:clerk|witness)|call (?:the )?(?:clerk|witness)|ask (?:the )?clerk to testify|testimony)\\b/i\nconst EXPOSE_TRIBUTE_SIGNAL = /\\b(?:expose|reveal|prove|show)\\b[^.!?]{0,80}\\b(?:tribute|ledger|arrangement)\\b/i\nconst PROTECT_TRIBUTE_SIGNAL = /\\b(?:protect|hide|cover|alter|change)\\b[^.!?]{0,80}\\b(?:tribute|ledger|arrangement)\\b/i\nconst GRUBBIN_SIGNAL = /\\bGrubbin\\b/i\nconst OLD_TATTER_SIGNAL = /\\bOld Tatter\\b/i\nconst LATCH_SIGNAL = /\\b(?:latch|carved faces?|carved-face)\\b/i\n",
    'FREE_SIGNALS',
)
free = replace_once(
    free,
    "  if (exactActionId === 'boss:bargain') return 'use the goblin clerk as a witness and press for a formal bargain'\n",
    "  if (exactActionId === 'boss:bargain') return 'use the goblin ally as a witness and press for a formal bargain'\n  if (exactActionId === 'camp:question-grubbin') return 'ask Grubbin what the picture tribute ledger is hiding'\n  if (exactActionId === 'camp:ask-old-tatter') return 'ask Old Tatter to identify the black-root seal'\n  if (exactActionId === 'camp:expose-tribute') return 'use the picture tribute ledger to expose the tribute arrangement'\n  if (exactActionId === 'camp:protect-tribute') return 'alter the picture tribute ledger to protect the tribute arrangement'\n  if (exactActionId === 'latch:use-charm') return 'fit the highland charm into the carved-face stash latch'\n",
    'FREE_EXACT_INTERPRETATIONS',
)
free = replace_once(
    free,
    "  if (state.sceneId === 'goblin-king') {\n",
    "  if (state.sceneId === 'highland-camp') {\n    if (style === 'strength') return 'take direct physical control of the picture tribute ledger'\n    if (style === 'mana') return 'use the available magic to decode the picture tribute ledger'\n    return 'work carefully through the picture tribute ledger and its tribute pattern'\n  }\n\n  if (state.sceneId === 'stash-latch') {\n    if (style === 'strength') return 'force the carved-face stash latch open'\n    if (style === 'mana') return 'use the available magic to read the carved-face stash latch'\n    return 'study the carved faces and open the stash latch carefully'\n  }\n\n  if (state.sceneId === 'goblin-king') {\n",
    'FREE_INTERPRETED_SCENES',
)
free = replace_once(
    free,
    "  if (state.sceneId === 'goblin-king' && BARGAIN_SIGNAL.test(text) && state.flags?.goblinAlly) {\n    return { kind: 'existing-action', style: 'non-check', actionId: 'boss:bargain' }\n  }\n\n  return null",
    r'''  if (state.sceneId === 'highland-camp') {
    if (GRUBBIN_SIGNAL.test(text)) {
      return { kind: 'existing-action', style: 'non-check', actionId: 'camp:question-grubbin' }
    }
    if (OLD_TATTER_SIGNAL.test(text)) {
      return { kind: 'existing-action', style: 'non-check', actionId: 'camp:ask-old-tatter' }
    }
    if (PROTECT_TRIBUTE_SIGNAL.test(text)) {
      return { kind: 'existing-action', style: 'defense', actionId: 'camp:protect-tribute' }
    }
    if (EXPOSE_TRIBUTE_SIGNAL.test(text)) {
      return { kind: 'existing-action', style: 'defense', actionId: 'camp:expose-tribute' }
    }
  }

  if (state.sceneId === 'stash-latch' && CHARM_SIGNAL.test(text) && state.flags?.hasHighlandCharm) {
    return { kind: 'existing-action', style: 'non-check', actionId: 'latch:use-charm' }
  }

  if (state.sceneId === 'goblin-king' && BARGAIN_SIGNAL.test(text) && state.flags?.goblinAlly) {
    return { kind: 'existing-action', style: 'non-check', actionId: 'boss:bargain' }
  }

  return null''',
    'FREE_EXACT_SCENES',
)
free = replace_once(
    free,
    "  if (state.sceneId === 'goblin-king') {\n    if (style === 'strength') return { kind: 'check', style, actionId: 'boss:overpower', manaUnavailable }",
    "  if (state.sceneId === 'highland-camp') {\n    if (style === 'strength') return { kind: 'check', style, actionId: 'camp:force-ledger', manaUnavailable }\n    if (style === 'mana') {\n      return { kind: 'check', style, actionId: 'camp:expose-tribute', manaUnavailable, engineOptions: Object.freeze({ useManaAdvantage: true }) }\n    }\n    return { kind: 'check', style: 'defense', actionId: 'camp:expose-tribute', manaUnavailable }\n  }\n\n  if (state.sceneId === 'stash-latch') {\n    if (style === 'strength') return { kind: 'check', style, actionId: 'latch:force', manaUnavailable }\n    if (style === 'mana') return { kind: 'check', style, actionId: 'latch:channel', manaUnavailable }\n    return { kind: 'check', style: 'defense', actionId: 'latch:read-face', manaUnavailable }\n  }\n\n  if (state.sceneId === 'goblin-king') {\n    if (style === 'strength') return { kind: 'check', style, actionId: 'boss:overpower', manaUnavailable }",
    'FREE_ACTION_SCENES',
)
free = replace_once(
    free,
    "    ...CHAPTER_ONE_ROOM_LIST.map((room) => room.name),\n  ].filter(Boolean)",
    "    ...CHAPTER_ONE_ROOM_LIST.map((room) => room.name),\n    ...CHAPTER_ONE_NPC_LIST.map((npc) => npc.name),\n  ].filter(Boolean)",
    'FREE_ALLOWED_NAMES',
)
free_path.write_text(free)

# Built-in check setup wording for new checks.
controller_path = ROOT / 'weedGoblinsChatController.js'
controller = controller_path.read_text()
controller = replace_once(
    controller,
    "  if (action.id === 'midpoint:take-token') return 'take the unattended tribute token without waking the bell'\n",
    "  if (action.id === 'midpoint:take-charm') return 'take the unattended highland charm without waking the bell'\n  if (action.id === 'camp:expose-tribute') return 'use the picture tribute ledger to expose the tribute arrangement'\n  if (action.id === 'camp:protect-tribute') return 'alter the picture tribute ledger to protect the tribute arrangement'\n  if (action.id === 'camp:force-ledger') return 'pull the picture tribute ledger loose and take the evidence'\n  if (action.id === 'latch:read-face') return 'read the carved faces and open the Stash Hall latch'\n  if (action.id === 'latch:force') return 'force the carved-face Stash Hall latch open'\n  if (action.id === 'latch:channel') return 'use Mana to read the carved-face Stash Hall latch'\n",
    'CONTROLLER_INTENTS',
)
controller_path.write_text(controller)

# Discoverables for every canonical room/NPC/puzzle/reward clue.
(ROOT / 'weedGoblinsDiscoverables.js').write_text(r'''import { CHAPTER_ONE_ROOMS, getWeedGoblinsRoomVisit } from './weedGoblinsRooms.js'

function freezeAction(action) {
  return action ? Object.freeze({ ...action }) : null
}

function discoverable({ id, title, terms, body, action = null }) {
  return Object.freeze({ id, title, terms: Object.freeze([...terms]), body, action: freezeAction(action) })
}

const WINDCUT_DISCOVERABLES = Object.freeze([
  discoverable({
    id: 'windcut:goblin-footprint', title: 'Fresh Goblin Footprint',
    terms: ['fresh goblin footprint', 'goblin footprint'],
    body: 'The print is fresh, deep, and headed into the Highlands. It is the first physical sign that the theft has a trail you can follow.',
    action: { kind: 'free-text', label: 'Inspect the footprint', playerAction: 'Look closely at the fresh goblin footprint' },
  }),
])

const RATTLEBRIDGE_DISCOVERABLES = Object.freeze([
  discoverable({ id: 'rattlebridge:bridge', title: 'Rattlebridge', terms: ['Rattlebridge'], body: 'A narrow crossing rigged with improvised alarm lines. Quiet and direct approaches create different risks.' }),
  discoverable({
    id: 'rattlebridge:alarm-lines', title: 'Bottle-Cap Alarm Lines', terms: ['bottle-cap alarm lines', 'bottle cap alarms', 'alarm lines'],
    body: 'Thin lines run through the crossing and into bottle-cap alarms. The mechanism is simple. The goblins are still extremely proud of it.',
    action: { kind: 'free-text', label: 'Inspect the alarm lines', playerAction: 'Look closely at the bottle-cap alarm lines on Rattlebridge' },
  }),
])

const CLOUDBERRY_DISCOVERABLES = Object.freeze([
  discoverable({ id: 'cloudberry:nib', title: 'Nib', terms: ['Nib'], body: 'A young goblin scout who wants a promotion and would prefer nobody get hurt while earning it.', action: { kind: 'engine', id: 'midpoint:help', label: 'Keep Nib safe' } }),
  discoverable({ id: 'cloudberry:tripwire', title: 'Snapped Tripwire', terms: ['snapped tripwire', 'tripwire'], body: 'The line is tangled rather than mysterious. Nib is trying to fix it before a patrol notices.', action: { kind: 'free-text', label: 'Examine the tripwire', playerAction: 'Look closely at the snapped tripwire' } }),
  discoverable({ id: 'cloudberry:highland-charm', title: 'Highland Charm', terms: ['highland charm'], body: 'A small local charm hanging beside a judgmental bell. It looks shaped for something more specific than decoration.', action: { kind: 'engine', id: 'midpoint:take-charm', label: 'Take the highland charm' } }),
  discoverable({ id: 'cloudberry:trail-runes', title: 'Old Trail-Runes', terms: ['old trail-runes', 'trail-runes', 'runes'], body: 'Old markings at Cloudberry Shelf describe the Stash Hall approach in more detail than anyone needed.', action: { kind: 'engine', id: 'midpoint:read-runes', label: 'Read the trail-runes' } }),
])

const HIGHLAND_CAMP_DISCOVERABLES = Object.freeze([
  discoverable({ id: 'camp:grubbin', title: 'Grubbin', terms: ['Grubbin'], body: 'The stash keeper. He knows where the best goods go and resents the King for sending them away as tribute.', action: { kind: 'engine', id: 'camp:question-grubbin', label: 'Question Grubbin' } }),
  discoverable({ id: 'camp:old-tatter', title: 'Old Tatter', terms: ['Old Tatter'], body: 'A retired raider who has seen enough goblin schemes to recognize the black-root seal on sight.', action: { kind: 'engine', id: 'camp:ask-old-tatter', label: 'Ask Old Tatter about the seal' } }),
  discoverable({ id: 'camp:picture-ledger', title: 'Picture Tribute Ledger', terms: ['picture tribute ledger', 'picture ledger', 'tribute ledger'], body: 'A ledger built from pictures, arrows, crate marks, and the assumption that nobody will ask why the best goods keep leaving camp.', action: { kind: 'free-text', label: 'Study the ledger', playerAction: 'Study the picture tribute ledger and work out where the tribute goes' } }),
  discoverable({ id: 'camp:black-root-seal', title: 'Black-Root Seal', terms: ['black-root seal'], body: 'A tribute mark tied to shipments leaving the Highlands. Old Tatter recognizes it as something older and larger than the King’s operation.' }),
])

const STASH_HALL_DISCOVERABLES = Object.freeze([
  discoverable({ id: 'stash-hall:latch', title: 'Carved-Face Stash Latch', terms: ['carved-face latch', 'carved face latch', 'carved faces', 'stash latch'], body: 'Four rotating goblin faces control the Stash Hall door. Their expressions appear to be an actual locking system.', action: { kind: 'free-text', label: 'Inspect the carved faces', playerAction: 'Inspect the carved faces on the Stash Hall latch' } }),
  discoverable({ id: 'stash-hall:king', title: 'The Goblin King', terms: ['Goblin King'], body: 'Loud, theatrical, and much more frightened by the tribute system around him than he wants you to notice.' }),
  discoverable({ id: 'stash-hall:black-root-seal', title: 'Black-Root Seal', terms: ['black-root seal'], body: 'The same mark appears on tribute crates connected to something beyond the Goblin King. It points toward the larger collection network.', action: { kind: 'free-text', label: 'Inspect the seal', playerAction: 'Look closely at the black-root seal on the tribute crates' } }),
])

function hasVisited(state, roomId) {
  return getWeedGoblinsRoomVisit(state, roomId)?.visited === true
}

function stolenItemDiscoverable(state) {
  const stolenItem = typeof state?.stolenItem === 'string' ? state.stolenItem.trim() : ''
  if (!stolenItem) return null
  return discoverable({ id: 'stash-hall:stolen-item', title: 'Your Stolen Item', terms: [stolenItem], body: 'This is the item that brought you into the Highlands. Recovering it, bargaining for it, or escaping without it determines how this run closes.' })
}

export function getWeedGoblinsDiscoverables(state) {
  if (!state) return Object.freeze([])
  const items = []
  if (hasVisited(state, CHAPTER_ONE_ROOMS.windcutTrail.id)) items.push(...WINDCUT_DISCOVERABLES)
  if (state.sceneId === 'choose-route' || hasVisited(state, CHAPTER_ONE_ROOMS.rattlebridge.id)) items.push(...RATTLEBRIDGE_DISCOVERABLES)
  if (hasVisited(state, CHAPTER_ONE_ROOMS.cloudberryShelf.id)) items.push(...CLOUDBERRY_DISCOVERABLES)
  if (hasVisited(state, CHAPTER_ONE_ROOMS.highlandCamp.id)) items.push(...HIGHLAND_CAMP_DISCOVERABLES)
  if (hasVisited(state, CHAPTER_ONE_ROOMS.kingsStashHall.id)) {
    items.push(...STASH_HALL_DISCOVERABLES)
    const stolenItem = stolenItemDiscoverable(state)
    if (stolenItem) items.push(stolenItem)
  }
  return Object.freeze(items)
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function findWeedGoblinsDiscoverableMatches(text, state) {
  const source = typeof text === 'string' ? text : ''
  if (!source) return Object.freeze([])
  const candidates = getWeedGoblinsDiscoverables(state)
    .flatMap((item) => item.terms.map((term) => ({ item, term })))
    .filter(({ term }) => term)
    .sort((left, right) => right.term.length - left.term.length)
  const claimed = new Array(source.length).fill(false)
  const matches = []
  for (const candidate of candidates) {
    const pattern = new RegExp(escapeRegExp(candidate.term), 'gi')
    for (const match of source.matchAll(pattern)) {
      const start = match.index ?? -1
      const end = start + match[0].length
      if (start < 0 || claimed.slice(start, end).some(Boolean)) continue
      for (let index = start; index < end; index += 1) claimed[index] = true
      matches.push(Object.freeze({ start, end, text: match[0], discoverable: candidate.item }))
    }
  }
  return Object.freeze(matches.sort((left, right) => left.start - right.start))
}
''')

# Help for Cloudberry, Highland Camp, latch, and King.
help_path = ROOT / 'weedGoblinsHelp.js'
help_text = help_path.read_text()
help_text = replace_once(
    help_text,
    "  midpoint: 'Some choices need a roll and some do not. Earlier choices can also create allies or make the next problem easier. Help is here if you get stuck.',\n  'goblin-king':",
    "  midpoint: 'Some choices need a roll and some do not. You can keep Nib safe, use him as bait, take the highland charm, read the trail-runes, or move on.',\n  'highland-camp': 'Highland Camp is a social puzzle as much as a physical one. Grubbin, Old Tatter, and the picture tribute ledger each expose a different part of what the King is doing.',\n  'stash-latch': 'The carved-face latch is a real obstacle. You can read it, force it, use Mana, or use the highland charm if you brought it.',\n  'goblin-king':",
    'HELP_AUTO',
)
help_text = replace_once(
    help_text,
    "  midpoint: 'There are several kinds of leverage here. Nib, the tribute token, the trail-runes, and simply moving on do not pay off in the same way.',\n  'goblin-king':",
    "  midpoint: 'There are several kinds of leverage here. Nib, the highland charm, the trail-runes, and simply moving on do not pay off in the same way.',\n  'highland-camp': 'The picture tribute ledger can expose or protect the tribute arrangement. Grubbin knows the shipments. Old Tatter knows the black-root seal.',\n  'stash-latch': 'The carved faces are a lock, not decoration. Use your better stat, spend Mana for advantage, or use the highland charm if you have it.',\n  'goblin-king':",
    'HELP_LEVEL1',
)
help_text = replace_once(
    help_text,
    "  midpoint: 'Helping Nib requires no roll and makes an ally. The tribute token and trail-runes can change the pressure at the Goblin King. Reading the runes costs Mana.',\n  'goblin-king':",
    "  midpoint: 'Keeping Nib safe requires no roll and makes an ally. Using Nib as bait creates immediate leverage but no ally. The highland charm and trail-runes can make later problems easier.',\n  'highland-camp': 'Expose or protect the tribute arrangement with a Defense check. Asking Grubbin or Old Tatter requires no roll and still moves you toward the Stash Hall.',\n  'stash-latch': 'Reading the latch uses Defense. Forcing it uses Strength. The Mana option costs 1 Mana and gives advantage. The highland charm opens it without a roll.',\n  'goblin-king':",
    'HELP_LEVEL2',
)
help_text = replace_once(
    help_text,
    "  if (state.sceneId === 'goblin-king') {",
    r'''  if (state.sceneId === 'highland-camp') {
    return 'Ask Old Tatter about the black-root seal. It requires no roll, gives you the key Chapter 1 clue, and moves you to the Stash Hall.'
  }

  if (state.sceneId === 'stash-latch') {
    if (state.flags?.hasHighlandCharm) {
      return 'Use the highland charm. It opens the carved-face latch without a roll.'
    }
    const best = strongestBuiltInCheck(state)
    const bestLabel = best?.action?.label || 'the latch option that uses your stronger stat'
    return `Use “${bestLabel}.” That is your strongest built-in chance with the resources you have right now.`
  }

  if (state.sceneId === 'goblin-king') {''',
    'HELP_DIRECT_NEW_SCENES',
)
help_path.write_text(help_text)

# Narration context: current Session Zero names/routes plus new rooms and branch state.
narr_path = ROOT / 'weedGoblinsNarrationHooks.js'
narr = narr_path.read_text()
narr = replace_function(narr, 'continuityAnchorsForState', 'storySoFarForState', r'''function continuityAnchorsForState(state) {
  const anchors = []
  const backgroundName = cleanText(state?.background?.name, 100)
  const routeName = routeNameForState(state)
  if (backgroundName) anchors.push(backgroundName)
  if (routeName) anchors.push(routeName)
  if (state?.flags?.nibTreatment === 'safe') anchors.push('Nib')
  if (state?.flags?.hasHighlandCharm) anchors.push('highland charm')
  if (state?.flags?.blackRootSealKnown) anchors.push('black-root seal')
  if (state?.flags?.tributeArrangement === 'exposed') anchors.push('picture tribute ledger')
  if (state?.flags?.tributeArrangement === 'protected') anchors.push('protected tribute arrangement')
  return Object.freeze([...new Set(anchors)].slice(0, 6))
}''')
narr = replace_function(narr, 'storySoFarForState', 'tensionLevelForScene', r'''function storySoFarForState(state) {
  const parts = [openingObjectiveForState(state)]
  if (state?.background?.name) parts.push(`The player chose ${state.background.name}.`)
  const routeName = routeNameForState(state)
  if (routeName) parts.push(`The player took ${routeName}.`)
  if (state?.flags?.midpointChoice) parts.push(`At Cloudberry Shelf, the player chose ${cleanText(state.flags.midpointChoice, 80)}.`)
  if (state?.flags?.nibTreatment) parts.push(`Nib was treated as ${cleanText(state.flags.nibTreatment, 40)}.`)
  if (state?.flags?.tributeArrangement) parts.push(`The tribute arrangement is ${cleanText(state.flags.tributeArrangement, 40)}.`)
  if (state?.flags?.hasHighlandCharm) parts.push('The player carries the highland charm.')
  if (state?.flags?.blackRootSealKnown) parts.push('Old Tatter or the ledger identified the black-root seal.')
  const latestEvent = state?.history?.at(-1)
  if (latestEvent?.outcome) parts.push(`The latest authoritative outcome was ${cleanText(latestEvent.outcome, 40)}.`)
  else if (latestEvent?.ending) parts.push(`The authoritative ending is ${cleanText(latestEvent.ending, 40)}.`)
  parts.push(`Current Trouble is ${Number(state?.trouble) || 0}.`)
  const resolvedChecks = (state?.history || []).filter((event) => event?.type === 'check').slice(-4)
  for (const event of resolvedChecks) {
    const result = event.naturalOne ? 'natural-1 complication' : cleanText(event.outcome, 40)
    parts.push(`${cleanText(event.actionId, 80) || 'A prior action'} resolved as ${result}.`)
  }
  if (state?.flags?.goblinAlly) parts.push('Nib is now a goblin ally.')
  return cleanText(parts.join(' '), 600)
}''')
narr = replace_function(narr, 'tensionLevelForScene', 'choiceContextForScene', r'''function tensionLevelForScene(sceneId) {
  return ({
    'choose-background': 'opening',
    'choose-route': 'commitment',
    'goblin-encounter': 'rising',
    midpoint: 'high',
    'highland-camp': 'high',
    'stash-latch': 'high',
    'goblin-king': 'climax',
    ending: 'resolution',
  })[sceneId] || 'rising'
}''')
narr = replace_function(narr, 'choiceContextForScene', 'scenePurposeForScene', r'''function choiceContextForScene(state) {
  if (state?.sceneId === 'choose-background') {
    return 'Highland Tracker favors Strength, Trail Warden favors Defense, and Fen Diviner carries the deepest Mana pool.'
  }
  if (state?.sceneId === 'choose-route') {
    const quiet = cleanText(state?.adventure?.routes?.quiet?.name, 100) || 'The Quiet Crossing'
    const loud = cleanText(state?.adventure?.routes?.loud?.name, 100) || 'The Direct Crossing'
    return `${quiet} crosses Rattlebridge using care and Defense; ${loud} crosses it using Strength before the alarm lines can react.`
  }
  if (state?.sceneId === 'goblin-encounter') {
    return `${cleanText(state?.goblinName, 100) || 'A goblin'} blocks the clear passage; the player may confront, endure, distract, negotiate with, or otherwise act on that obstacle.`
  }
  if (state?.sceneId === 'midpoint') {
    return 'At Cloudberry Shelf, Nib is caught up with a snapped tripwire. The player can keep him safe, use him as bait, take a highland charm, read old trail-runes, or move on.'
  }
  if (state?.sceneId === 'highland-camp') {
    return 'At Highland Camp, Grubbin guards a picture tribute ledger and resents the outgoing tribute. Old Tatter can identify the black-root seal. The player can expose, protect, question, investigate, or leave the arrangement alone.'
  }
  if (state?.sceneId === 'stash-latch') {
    return 'A carved-face latch seals the King’s Stash Hall. It can be read carefully, forced, read with Mana, or opened with the highland charm if the player has it.'
  }
  if (state?.sceneId === 'goblin-king') {
    return `The Goblin King controls ${cleanText(state?.stolenItem, 160) || 'the stolen item'} in the Stash Hall; the player can humiliate him with Strength, spare him through Defense, use Mana, bargain if Nib is an ally, or attempt another concrete action.`
  }
  return ''
}''')
narr = replace_function(narr, 'scenePurposeForScene', 'sceneFallbackForState', r'''function scenePurposeForScene(sceneId) {
  return ({
    'choose-background': 'Make the three character approaches legible before the player chooses one.',
    'choose-route': 'Turn preparation into a committed Rattlebridge crossing with different visible risks.',
    'goblin-encounter': 'Put a named goblin obstacle between the player and Cloudberry Shelf.',
    midpoint: 'Make the Nib decision and local leverage matter before Highland Camp.',
    'highland-camp': 'Reveal the tribute arrangement through Grubbin, Old Tatter, and the picture tribute ledger.',
    'stash-latch': 'Make the carved-face latch the final obstacle before the King.',
    'goblin-king': 'Bring the stolen item, the antagonist, and accumulated branch state together for the climax.',
    ending: 'Resolve the exact objective established at the opening.',
  })[sceneId] || 'Continue the same causal story from the authoritative state.'
}''')
narr = replace_function(narr, 'sceneFallbackForState', 'getNarrationStoryContext', r'''function sceneFallbackForState(state) {
  if (state?.sceneId === 'choose-background') return 'Three ways of meeting trouble wait at Windcut Trail: tracking it, holding against it, or reading the strange signs around it.'
  if (state?.sceneId === 'choose-route') return 'Rattlebridge narrows ahead, bottle-cap alarm lines trembling across both the quiet path and the direct one.'
  if (state?.sceneId === 'goblin-encounter') {
    const goblin = cleanText(state?.goblinName, 100) || 'a goblin sentry'
    return `${goblin} plants one boot across the only clear passage beyond Rattlebridge.`
  }
  if (state?.sceneId === 'midpoint') return 'At Cloudberry Shelf, Nib is tangled beside a snapped tripwire while a highland charm and old trail-runes sit within reach.'
  if (state?.sceneId === 'highland-camp') return 'At Highland Camp, Grubbin keeps one hand on a picture tribute ledger while Old Tatter studies the black-root seal stamped across its cover.'
  if (state?.sceneId === 'stash-latch') return 'Four carved goblin faces stare from the Stash Hall latch, each rotated to a different expression.'
  if (state?.sceneId === 'goblin-king') {
    const stolenItem = cleanText(state?.stolenItem, 160) || 'the stolen field reliquary'
    return `The Goblin King's hand settles on ${stolenItem} as the Stash Hall doors close behind you.`
  }
  return ''
}''')
narr_path.write_text(narr)

# Current room tests updated for the complete five-room path.
(ROOT / 'weedGoblinsRooms.test.js').write_text(r'''import test from 'node:test'
import assert from 'node:assert/strict'

import { advanceWeedGoblinsRun, advanceWeedGoblinsSessionText, createWeedGoblinsRun, getAvailableActions } from './weedGoblinsEngine.js'
import { prepareWeedGoblinsChoiceTurn, resolveWeedGoblinsPreparedMechanics } from './weedGoblinsChatController.js'
import { CHAPTER_ONE_ROOM_LIST, CHAPTER_ONE_ROOMS, getCurrentWeedGoblinsRoom, getWeedGoblinsRoomVisit } from './weedGoblinsRooms.js'

function stateAtRoute(seed = 'room-system') {
  let state = createWeedGoblinsRun({ seed })
  state = advanceWeedGoblinsRun(state, 'session:continue')
  state = advanceWeedGoblinsSessionText(state, 'Fenna Duskrow')
  state = advanceWeedGoblinsRun(state, 'session:race:human')
  state = advanceWeedGoblinsRun(state, 'session:weapon:sword')
  state = advanceWeedGoblinsRun(state, 'background:tracker')
  state = advanceWeedGoblinsRun(state, 'session:pronoun:they')
  state = advanceWeedGoblinsRun(state, 'session:look:tall-weathered')
  return state
}

function stateAfterGoblin() {
  for (let index = 0; index < 200; index += 1) {
    let state = stateAtRoute(`room-goblin-${index}`)
    state = advanceWeedGoblinsRun(state, 'route:quiet')
    if (state.status !== 'active') continue
    state = advanceWeedGoblinsRun(state, 'goblin:guard')
    if (state.status === 'active' && state.sceneId === 'midpoint') return state
  }
  throw new Error('Could not find a deterministic active midpoint seed.')
}

test('Chapter 1 room registry contains the five canonical locations in order', () => {
  assert.deepEqual(CHAPTER_ONE_ROOM_LIST.map((room) => room.name), ['Windcut Trail', 'Rattlebridge', 'Cloudberry Shelf', 'Highland Camp', "King's Stash Hall"])
})

test('a new run begins at Windcut Trail and only that room is visited', () => {
  const state = createWeedGoblinsRun({ seed: 'room-start' })
  assert.equal(state.currentRoomId, CHAPTER_ONE_ROOMS.windcutTrail.id)
  assert.equal(getCurrentWeedGoblinsRoom(state)?.name, 'Windcut Trail')
  assert.equal(getWeedGoblinsRoomVisit(state, CHAPTER_ONE_ROOMS.windcutTrail.id)?.visitCount, 1)
  assert.equal(getWeedGoblinsRoomVisit(state, CHAPTER_ONE_ROOMS.rattlebridge.id)?.visited, false)
  assert.equal(getWeedGoblinsRoomVisit(state, CHAPTER_ONE_ROOMS.highlandCamp.id)?.visited, false)
})

test('Rattlebridge is entered only after the explicit crossing roll resolves', () => {
  const state = stateAtRoute('room-rattlebridge')
  const action = getAvailableActions(state).find((candidate) => candidate.id === 'route:quiet')
  const prepared = prepareWeedGoblinsChoiceTurn({ state, action })
  assert.equal(getWeedGoblinsRoomVisit(prepared.before, CHAPTER_ONE_ROOMS.rattlebridge.id)?.visited, false)
  const mechanics = resolveWeedGoblinsPreparedMechanics({ preparedTurn: prepared })
  assert.equal(mechanics.after.currentRoomId, CHAPTER_ONE_ROOMS.rattlebridge.id)
})

test('the expanded Chapter 1 path visits Cloudberry Shelf, Highland Camp, then the Stash Hall', () => {
  const midpoint = stateAfterGoblin()
  assert.equal(midpoint.currentRoomId, CHAPTER_ONE_ROOMS.cloudberryShelf.id)
  const camp = advanceWeedGoblinsRun(midpoint, 'midpoint:skip')
  assert.equal(camp.sceneId, 'highland-camp')
  assert.equal(camp.currentRoomId, CHAPTER_ONE_ROOMS.highlandCamp.id)
  const latch = advanceWeedGoblinsRun(camp, 'camp:ask-old-tatter')
  assert.equal(latch.sceneId, 'stash-latch')
  assert.equal(latch.currentRoomId, CHAPTER_ONE_ROOMS.kingsStashHall.id)
  const boss = advanceWeedGoblinsRun(latch, 'latch:read-face')
  if (boss.status === 'active') assert.equal(boss.sceneId, 'goblin-king')
  assert.equal(getWeedGoblinsRoomVisit(latch, CHAPTER_ONE_ROOMS.highlandCamp.id)?.visited, true)
  assert.equal(getWeedGoblinsRoomVisit(latch, CHAPTER_ONE_ROOMS.kingsStashHall.id)?.visited, true)
})
''')

# Discoverable regression tests updated for Highland Camp and the latch.
(ROOT / 'weedGoblinsDiscoverables.test.js').write_text(r'''import test from 'node:test'
import assert from 'node:assert/strict'

import { advanceWeedGoblinsRun, advanceWeedGoblinsSessionText, createWeedGoblinsRun } from './weedGoblinsEngine.js'
import { findWeedGoblinsDiscoverableMatches, getWeedGoblinsDiscoverables } from './weedGoblinsDiscoverables.js'

function stateAtRoute(seed = 'discoverables') {
  let state = createWeedGoblinsRun({ seed })
  state = advanceWeedGoblinsRun(state, 'session:continue')
  state = advanceWeedGoblinsSessionText(state, 'Sable Underhollow')
  state = advanceWeedGoblinsRun(state, 'session:race:human')
  state = advanceWeedGoblinsRun(state, 'session:weapon:sword')
  state = advanceWeedGoblinsRun(state, 'background:tracker')
  state = advanceWeedGoblinsRun(state, 'session:pronoun:they')
  return advanceWeedGoblinsRun(state, 'session:look:tall-weathered')
}

function stateAtMidpoint() {
  for (let index = 0; index < 200; index += 1) {
    let state = stateAtRoute(`discoverable-midpoint-${index}`)
    state = advanceWeedGoblinsRun(state, 'route:quiet')
    if (state.status !== 'active') continue
    state = advanceWeedGoblinsRun(state, 'goblin:guard')
    if (state.status === 'active' && state.sceneId === 'midpoint') return state
  }
  throw new Error('Could not find active midpoint seed.')
}

test('Windcut Trail and Rattlebridge expose their canonical clues', () => {
  const opening = createWeedGoblinsRun({ seed: 'discoverable-opening' })
  assert.ok(getWeedGoblinsDiscoverables(opening).some((item) => item.id === 'windcut:goblin-footprint'))
  const route = stateAtRoute('discoverable-route')
  assert.ok(getWeedGoblinsDiscoverables(route).some((item) => item.id === 'rattlebridge:alarm-lines'))
})

test('Cloudberry Shelf exposes Nib, tripwire, highland charm, and runes', () => {
  const ids = getWeedGoblinsDiscoverables(stateAtMidpoint()).map((item) => item.id)
  for (const id of ['cloudberry:nib', 'cloudberry:tripwire', 'cloudberry:highland-charm', 'cloudberry:trail-runes']) assert.ok(ids.includes(id), id)
})

test('Highland Camp exposes Grubbin, Old Tatter, the picture ledger, and black-root seal', () => {
  const camp = advanceWeedGoblinsRun(stateAtMidpoint(), 'midpoint:skip')
  const ids = getWeedGoblinsDiscoverables(camp).map((item) => item.id)
  for (const id of ['camp:grubbin', 'camp:old-tatter', 'camp:picture-ledger', 'camp:black-root-seal']) assert.ok(ids.includes(id), id)
})

test('Stash Hall threshold exposes the carved-face latch and exact stolen item', () => {
  const camp = advanceWeedGoblinsRun(stateAtMidpoint(), 'midpoint:skip')
  const latch = advanceWeedGoblinsRun(camp, 'camp:ask-old-tatter')
  const ids = getWeedGoblinsDiscoverables(latch).map((item) => item.id)
  assert.ok(ids.includes('stash-hall:latch'))
  assert.ok(ids.includes('stash-hall:stolen-item'))
  const matches = findWeedGoblinsDiscoverableMatches(`Old Tatter points at the black-root seal beside the carved-face latch.`, latch)
  assert.ok(matches.some((match) => match.discoverable.id === 'camp:old-tatter'))
  assert.ok(matches.some((match) => match.discoverable.id === 'stash-hall:latch'))
})

test('matcher still chooses longest non-overlapping phrases', () => {
  const route = stateAtRoute('discoverable-longest')
  const matches = findWeedGoblinsDiscoverableMatches('The bottle-cap alarm lines on Rattlebridge shake once.', route)
  assert.equal(matches[0].text, 'bottle-cap alarm lines')
  assert.equal(matches[0].discoverable.id, 'rattlebridge:alarm-lines')
})
''')

# Dedicated current-canon Priority 11 tests; avoids relying on older pre-Session-Zero engine tests.
(ROOT / 'weedGoblinsChapterOne.test.js').write_text(r'''import test from 'node:test'
import assert from 'node:assert/strict'

import { advanceWeedGoblinsRun, advanceWeedGoblinsSessionText, createWeedGoblinsRun, getAvailableActions, getWeedGoblinsActionCheckPreview } from './weedGoblinsEngine.js'
import { getWeedGoblinsQuickReplies, prepareWeedGoblinsFreeTextTurn, resolveWeedGoblinsPreparedMechanics } from './weedGoblinsChatController.js'
import { CHAPTER_ONE_BRANCH_VALUES, CHAPTER_ONE_NPCS, CHAPTER_ONE_PUZZLES, CHAPTER_ONE_REWARDS } from './weedGoblinsChapterOne.js'
import { CHAPTER_ONE_ROOMS } from './weedGoblinsRooms.js'
import { getNarrationStoryContext } from './weedGoblinsNarrationHooks.js'

const fallbackNarration = async ({ hook }) => ({ text: hook.fallbackText, source: 'test-fallback' })

function stateAtRoute(seed) {
  let state = createWeedGoblinsRun({ seed })
  state = advanceWeedGoblinsRun(state, 'session:continue')
  state = advanceWeedGoblinsSessionText(state, 'Rell Marrowlight')
  state = advanceWeedGoblinsRun(state, 'session:race:human')
  state = advanceWeedGoblinsRun(state, 'session:weapon:sword')
  state = advanceWeedGoblinsRun(state, 'background:tracker')
  state = advanceWeedGoblinsRun(state, 'session:pronoun:they')
  return advanceWeedGoblinsRun(state, 'session:look:tall-weathered')
}

function stateAtMidpoint(prefix = 'chapter-one-midpoint') {
  for (let index = 0; index < 300; index += 1) {
    let state = stateAtRoute(`${prefix}-${index}`)
    state = advanceWeedGoblinsRun(state, 'route:quiet')
    if (state.status !== 'active') continue
    state = advanceWeedGoblinsRun(state, 'goblin:guard')
    if (state.status === 'active' && state.sceneId === 'midpoint' && state.trouble <= 1) return state
  }
  throw new Error('Could not find a deterministic active midpoint seed.')
}

function stateAtLatch(prefix = 'chapter-one-latch') {
  const midpoint = stateAtMidpoint(prefix)
  const camp = advanceWeedGoblinsRun(midpoint, 'midpoint:help')
  return advanceWeedGoblinsRun(camp, 'camp:ask-old-tatter')
}

function stateAtBoss(prefix = 'chapter-one-boss') {
  for (let index = 0; index < 300; index += 1) {
    const latch = stateAtLatch(`${prefix}-${index}`)
    const boss = advanceWeedGoblinsRun(latch, 'latch:read-face')
    if (boss.status === 'active' && boss.sceneId === 'goblin-king') return boss
  }
  throw new Error('Could not find a deterministic active Goblin King seed.')
}

test('canonical Chapter 1 content registry locks NPCs, puzzles, rewards, and branch values', () => {
  assert.deepEqual(Object.values(CHAPTER_ONE_NPCS).map((npc) => npc.name), ['Goblin King', 'Nib', 'Grubbin', 'Old Tatter'])
  assert.deepEqual(Object.values(CHAPTER_ONE_PUZZLES).map((puzzle) => puzzle.name), ['Rattlebridge alarm lines', 'picture tribute ledger', 'carved-face stash latch'])
  assert.deepEqual(Object.values(CHAPTER_ONE_REWARDS), ['black-root seal', 'goblin favor', 'highland charm'])
  assert.deepEqual(CHAPTER_ONE_BRANCH_VALUES.nibTreatment, ['safe', 'bait', 'ignored'])
  assert.deepEqual(CHAPTER_ONE_BRANCH_VALUES.tributeArrangement, ['exposed', 'protected', 'unknown'])
  assert.deepEqual(CHAPTER_ONE_BRANCH_VALUES.kingTreatment, ['spared', 'humiliated', 'unresolved'])
  assert.deepEqual(CHAPTER_ONE_BRANCH_VALUES.stolenItemCondition, ['intact', 'altered', 'not-recovered'])
})

test('Cloudberry gives the explicit keep-Nib-safe versus use-Nib-as-bait branch', () => {
  const midpoint = stateAtMidpoint('nib-branch')
  const safe = advanceWeedGoblinsRun(midpoint, 'midpoint:help')
  const bait = advanceWeedGoblinsRun(midpoint, 'midpoint:bait-nib')
  assert.equal(safe.sceneId, 'highland-camp')
  assert.equal(safe.flags.nibTreatment, 'safe')
  assert.equal(safe.flags.goblinAlly, true)
  assert.equal(safe.flags.goblinFavor, true)
  assert.equal(bait.flags.nibTreatment, 'bait')
  assert.equal(bait.flags.goblinAlly, false)
})

test('Highland Camp contains the tribute branch and Old Tatter identifies the black-root seal', () => {
  const camp = advanceWeedGoblinsRun(stateAtMidpoint('camp-branch'), 'midpoint:skip')
  assert.equal(camp.currentRoomId, CHAPTER_ONE_ROOMS.highlandCamp.id)
  const actions = getAvailableActions(camp)
  for (const id of ['camp:expose-tribute', 'camp:protect-tribute', 'camp:question-grubbin', 'camp:ask-old-tatter']) assert.ok(actions.some((action) => action.id === id), id)
  const tatter = advanceWeedGoblinsRun(camp, 'camp:ask-old-tatter')
  assert.equal(tatter.flags.blackRootSealKnown, true)
  assert.match(tatter.narration.at(-1), /black-root seal/i)
  assert.equal(tatter.sceneId, 'stash-latch')
})

test('picture ledger expose/protect choices preserve the player branch regardless of roll outcome', () => {
  const campA = advanceWeedGoblinsRun(stateAtMidpoint('ledger-expose'), 'midpoint:skip')
  const exposed = advanceWeedGoblinsRun(campA, 'camp:expose-tribute')
  assert.equal(exposed.flags.tributeArrangement, 'exposed')
  if (exposed.status === 'active') assert.equal(exposed.sceneId, 'stash-latch')

  const campB = advanceWeedGoblinsRun(stateAtMidpoint('ledger-protect'), 'midpoint:skip')
  const protectedState = advanceWeedGoblinsRun(campB, 'camp:protect-tribute')
  assert.equal(protectedState.flags.tributeArrangement, 'protected')
  if (protectedState.status === 'active') assert.equal(protectedState.sceneId, 'stash-latch')
})

test('the highland charm is a real reward that can open the carved-face latch without a roll', () => {
  let charmState = null
  for (let index = 0; index < 300; index += 1) {
    const midpoint = stateAtMidpoint(`charm-${index}`)
    const result = advanceWeedGoblinsRun(midpoint, 'midpoint:take-charm')
    if (result.status === 'active' && result.flags.hasHighlandCharm) {
      charmState = result
      break
    }
  }
  assert.ok(charmState)
  const latch = advanceWeedGoblinsRun(charmState, 'camp:ask-old-tatter')
  const preview = getWeedGoblinsActionCheckPreview(latch, 'latch:use-charm')
  assert.equal(preview.requiresRoll, false)
  const boss = advanceWeedGoblinsRun(latch, 'latch:use-charm')
  assert.equal(boss.sceneId, 'goblin-king')
})

test('new gameplay scenes keep custom text and 4 to 5 visible replies', async () => {
  const camp = advanceWeedGoblinsRun(stateAtMidpoint('custom-camp'), 'midpoint:skip')
  const campChoices = getWeedGoblinsQuickReplies(camp)
  assert.ok(campChoices.length >= 4 && campChoices.length <= 5)
  const campPlan = await prepareWeedGoblinsFreeTextTurn({ state: camp, playerAction: 'I ask Old Tatter what the seal means', generateNarration: fallbackNarration })
  assert.equal(campPlan.plan.actionId, 'camp:ask-old-tatter')
  assert.equal(campPlan.requiresRoll, false)

  const latch = advanceWeedGoblinsRun(camp, 'camp:ask-old-tatter')
  const latchChoices = getWeedGoblinsQuickReplies(latch)
  assert.ok(latchChoices.length >= 4 && latchChoices.length <= 5)
  const latchPlan = await prepareWeedGoblinsFreeTextTurn({ state: latch, playerAction: 'I force the carved-face latch open', generateNarration: fallbackNarration })
  assert.equal(latchPlan.plan.actionId, 'latch:force')
  assert.equal(latchPlan.requiresRoll, true)
  const mechanics = resolveWeedGoblinsPreparedMechanics({ preparedTurn: latchPlan })
  assert.ok(mechanics.checkEvent)
  assert.equal(mechanics.checkEvent.dc, 12)
})

test('Goblin King choices make spare versus humiliate explicit without changing the boss DC system', () => {
  const boss = stateAtBoss('king-branch')
  const actions = getAvailableActions(boss)
  assert.match(actions.find((action) => action.id === 'boss:overpower').label, /Humiliate/)
  assert.match(actions.find((action) => action.id === 'boss:outlast').label, /Spare/)
  assert.equal(getWeedGoblinsActionCheckPreview(boss, 'boss:overpower').dc, Math.max(9, 16 + boss.flags.bossDcModifier))
})

test('completed Chapter 1 summary carries rewards and branch state while exact ending text stays locked', () => {
  let completed = null
  for (let index = 0; index < 500; index += 1) {
    const boss = stateAtBoss(`summary-${index}`)
    const result = advanceWeedGoblinsRun(boss, 'boss:outlast')
    if (result.status === 'completed' && result.ending === 'recovery') {
      completed = result
      break
    }
  }
  assert.ok(completed)
  assert.equal(completed.runSummary.chapterOneBranches.nibTreatment, 'safe')
  assert.equal(completed.runSummary.chapterOneBranches.kingTreatment, 'spared')
  assert.ok(['intact', 'altered'].includes(completed.runSummary.chapterOneBranches.stolenItemCondition))
  assert.ok(completed.runSummary.chapterOneRewards.includes(CHAPTER_ONE_REWARDS.blackRootSeal))
  assert.ok(completed.runSummary.chapterOneRewards.includes(CHAPTER_ONE_REWARDS.goblinFavor))
  assert.equal(completed.narration.at(-1), `You recover ${completed.stolenItem} from the King's Stash Hall. The Goblin King insists he is a king. His fear, and the black-root seal stamped on every crate around you, say otherwise.`)
})

test('narration context knows Highland Camp and the carved-face latch', () => {
  const camp = advanceWeedGoblinsRun(stateAtMidpoint('narration-context'), 'midpoint:skip')
  const campContext = getNarrationStoryContext(camp)
  assert.match(campContext.choiceContext, /Grubbin/)
  assert.match(campContext.choiceContext, /Old Tatter/)
  assert.match(campContext.choiceContext, /picture tribute ledger/)
  const latch = advanceWeedGoblinsRun(camp, 'camp:ask-old-tatter')
  const latchContext = getNarrationStoryContext(latch)
  assert.match(latchContext.choiceContext, /carved-face latch/)
  assert.ok(latchContext.continuityAnchors.includes('black-root seal'))
})
''')

print('PRIORITY11_REWRITE_COMPLETE')
