# Weed Goblins — RPG UI Design v2

Status: CONTROLLING for the RPG vertical slice. Supersedes the messenger/chat UI.

## Design goal

The screen should feel like a readable fantasy adventure that tightens into a tabletop RPG interface when dice/combat matter. It must not look like Eliza and the player are texting each other.

## Main exploration screen

Use a centered adventure-book reading column on the existing dark my420journal shell.

Top bar:

- Back to Games control
- Chapter label and location
- compact E character-sheet button

Do not show online status, typing indicator, avatar conversation chrome, microphone, message bubbles, or fake timestamps.

The primary content area contains sequential story entries:

- Eliza narration in normal paragraphs
- committed player action as a compact labeled choice/action record, not a chat bubble
- roll/ruling cards only when mechanics occur
- contextual CYOA buttons below the current scene
- a plain freeform action field below the buttons

Only the current unresolved interaction is actionable. Prior history remains scrollable and readable but inert.

## Typography/prose rendering

Narration uses normal paragraphs with comfortable line length and spacing. Never render each sentence as its own block.

The UI must not encourage micro-paragraph generation. A narration entry can contain multiple paragraphs, but paragraph boundaries come from authored/narrator content, not automatic sentence splitting.

## Choice presentation

Normally show 3–4 contextual action buttons. Buttons should be short concrete actions or actual dialogue, for example:

- Follow them before they reach the bridge
- Check the campsite and tracks first
- Take the high trail above the gorge

Do not use abstract repeated buttons such as Attack, Defend, Magic, Search, Continue.

Freeform remains available under choices as an escape hatch. No microphone in v2.

## Distributed character creation

Character details appear only when relevant to play.

After the first route choice, ask for name and race in the story flow. When equipment matters, show the six weapon choices. Before the first substantial uncertain check, show the three background choices with concise mechanical summaries.

Do not show a separate character-creation page or a multi-question form.

## Ruling and dice card

Before a player roll, show a compact ruling card with:

- action
- relevant stat or capability
- DC/target if the character knows it
- advantage/disadvantage and reason
- Mana/item cost if any
- success stakes
- failure risk

Then show a single `Roll D20` control.

After commit, reveal:

- die result
- modifier
- total
- target
- success/failure

If a successful attack deals damage, show a separate player-controlled damage roll afterward.

Enemy/DM rolls animate visibly but have no player roll button. Clearly label them as DM rolls.

## Combat mode

Combat remains on the same page and in the same reading history. Do not switch to a dashboard.

When combat is active, add a compact status strip:

Player:
- HP / Max HP
- Mana / Max Mana
- wound/condition when relevant
- position

Enemy:
- name/type
- descriptive health state, not exact HP
- known/estimated Guard if learned
- position
- visible condition/morale when perceivable
- telegraphed intent when perceivable

Contextual actions remain below the current combat beat. Choices must change with position, alarm state, enemy intent, weapon, background, Mana, and prior actions.

## Enemy information

Do not expose exact enemy HP by default. Use descriptive states such as Unhurt, Hurt, Badly Wounded, Near Defeat, Down.

Exact enemy Guard is learned through fighting, observation, or investigation rather than always shown from the first frame.

## E character sheet

The E control opens an overlay/drawer with these sections:

1. Character
   - name, race, Level, background
   - Strength, Defense, Guard
   - HP/Max HP, Mana/Max Mana
   - wound/injury detail, conditions
2. Gear & Pack
   - permanent weapon and condition
   - protective gear and condition
   - significant pack slots
   - story items, Rootcoin
3. Abilities
   - background signature
   - race traits
   - permanent unlocks
4. Threads
   - unresolved known obligations/objectives/promises
5. Discoveries
   - meaningful learned information and rumor/confirmed state
6. People / Factions / Map
   - descriptive relationship states
   - faction knowledge/reputation where known
   - discovered geography only

The E sheet is not the main game screen.

## Mobile behavior

Mobile is the primary layout. Reading column fills the viewport with comfortable side padding. Choice buttons are full-width/tappable. Dice/ruling cards stack vertically. E opens as a full-height sheet or drawer.

Desktop may widen the reading column modestly but should remain a reading experience, not become a multi-column dashboard.

## Accessibility

- minimum comfortable tap targets
- high contrast
- visible focus states
- dice result always represented in text, not animation alone
- status changes announced accessibly where practical
- reduced-motion preference disables decorative roll animation

## Forbidden legacy UI

The following are explicitly superseded and must not appear in v2:

- incoming/outgoing message bubbles
- `Eliza is typing`
- chat composer with send-arrow chrome
- microphone/voice button
- fake online/presence indicators
- transcript as authoritative state
- permanent `Attack / Defend / Magic` action bar
- automatic one-sentence-per-paragraph rendering

## Founder validation boundary

The opening reading cadence and distributed creation through route → name/race → weapon were founder-approved in live play. Combat presentation, dice feel, and the Rattlebridge consequence flow remain subject to founder play validation after implementation.
