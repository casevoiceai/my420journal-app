# Weed Goblins Interface Design

Status: controlling UI reference for implementation. Read `GAME_EXPERIENCE_SPEC.md` first; that file is the definitive product and interaction specification.

## Locked presentation

Weed Goblins is a stealth tabletop adventure presented through an ordinary-looking messenger interface.

It must NOT read immediately as a visibly branded fantasy RPG screen.

The normal screen contains:

1. a minimal messenger header with Eliza's name and small E-circle;
2. Eliza's incoming bubbles on the left;
3. the player's outgoing bubbles on the right;
4. approximately four or five contextual response choices under the newest conversation state;
5. a standard-looking text composer beneath the choices;
6. a microphone control that transcribes into the editable composer;
7. a temporary D20 control only when a roll is required.

Do not permanently expose a chapter/quest HUD, objective panel, Strength/Defense/Mana/Trouble bar, Adventure Log heading, giant RPG action cards, `Eliza narrates` labels, or `Your move` labels in ordinary play.

The plain messenger appearance is intentional so the game can be played discreetly inside my420journal.

## Header and hidden character menu

The normal header should remain visually simple.

The E-circle beside Eliza's name is a hidden secondary control. Press-and-hold opens the character/status menu.

That menu may show character identity, race, appearance/pronouns, class/background, weapon, Strength, Defense, Mana, Trouble or wound state, inventory, special items, current objective, and other deeper game information.

Closing the menu returns directly to the conversation.

## Player actions

Buttons remain the primary gameplay interaction.

After each meaningful game response, the choice area should repopulate with approximately four or five concise, context-specific actions when the fiction supports that many.

Choices should describe in-world actions rather than raw mechanical categories.

Selecting a choice adds that choice to the transcript as a normal outgoing player bubble.

Choice buttons live in the active control area below the latest messages. They do not persist as large permanent cards throughout the transcript.

The composer is the additional open-ended choice. The player may ignore all supplied options and type another action.

## Voice input

Voice-to-text fills the same custom-action composer.

Speech recognition output must remain editable before the player sends it.

Never submit recognized speech automatically.

## Dice

All checks, whether started by a response button or typed action, use the same explicit tabletop lifecycle:

1. player declares action;
2. Eliza explains what the player is attempting and the relevant circumstances;
3. Eliza states any immediately relevant advantage/disadvantage/resource effect;
4. Eliza states the exact number needed to succeed;
5. a temporary `ROLL D20` control appears;
6. the player explicitly rolls;
7. the result is displayed;
8. the engine resolves the authoritative result;
9. Eliza narrates the outcome;
10. new contextual choices appear.

A check must not secretly resolve when a normal response button is tapped.

A genuine no-roll action may proceed without showing the D20 control.

## Highlighted discoverables

Eliza may highlight useful or interesting words and phrases in her story bubbles: people, places, objects, clues, rumors, breadcrumbs, unfamiliar game terms, or suspicious details.

Tapping a highlight opens a small temporary information popup over the messenger. Closing it leaves the transcript unchanged.

A discoverable may simply explain something or may expose a new choice, clue, investigation path, or roll.

## Help

Help is contextual to the current obstacle.

- First use: gentle nudge.
- Second use: stronger direction.
- Third use: Eliza's fourth-wall easter egg and direct solution to the immediate hurdle.

Automatic beginner guidance is expected in Chapters 1 and 2 and fades starting in Chapter 3. The Help control remains available.

## Rooms and snapshot readiness

The UI may show subtle room-transition information when useful, but normal play remains a messenger.

The underlying game must distinguish persistent physical rooms from transient scenes so later exploration, clues, NPC state, persistence, and Adventure Snapshot generation have a deterministic location.

Chapter 1 canonical rooms are Windcut Trail, Rattlebridge, Cloudberry Shelf, Highland Camp, and King's Stash Hall.

## Narration typography

Narration should prioritize readability in a compact message bubble.

Use ordinary punctuation and short paragraphs/sentences appropriate to messaging. Generated narration must not contain em dashes or en dashes under the existing narration-validation contract unless a later explicit decision changes that rule.

## Responsive behavior

Mobile is the primary presentation target.

The conversation should remain readable with the on-screen keyboard open. Current choices and the composer must remain reachable on short screens. Long transcripts should scroll naturally like a messenger conversation.

Desktop may widen the conversation column but should preserve the same messenger hierarchy rather than introducing a separate visible RPG dashboard.
