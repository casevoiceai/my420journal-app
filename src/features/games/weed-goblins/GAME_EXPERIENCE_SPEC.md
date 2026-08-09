# Weed Goblins Game Experience Specification

Status: controlling product and implementation reference for the Weed Goblins player experience.

This document supersedes earlier presentation assumptions that treated Weed Goblins as a visibly branded fantasy-game screen. The game remains mechanically a tabletop-style fantasy adventure, but the player-facing shell is deliberately a stealth messenger.

## 1. Core product rule

Weed Goblins must look, at a glance, like an ordinary text-message conversation while operating underneath as a branching tabletop adventure.

The messenger appearance is not a cosmetic theme. It is a product requirement.

Normal play should expose only what is needed to continue the conversation:

- Eliza as the contact/GM at the top;
- Eliza's incoming message bubbles;
- the player's outgoing message bubbles;
- approximately four or five contextual response choices under the latest conversation state;
- one standard-looking text composer beneath those choices;
- optional voice-to-text into that composer;
- temporary roll controls only when a roll is actually required.

Visible RPG HUD treatment must not dominate the ordinary screen.

## 2. Messenger anatomy

### Header

The ordinary header should be minimal:

- back/exit control;
- Eliza's name;
- small E-circle identity mark beside Eliza;
- no permanent visible chapter/quest/stat HUD.

The E-circle has a hidden secondary interaction: press-and-hold opens the character/status menu.

### Conversation

Eliza messages appear as incoming bubbles on the left.

The player's selected button choice or typed action appears as an outgoing bubble on the right.

Do not label every turn with phrases such as `Eliza narrates` or `Your move`. The bubble direction already communicates speaker identity.

The transcript is the story. It should read like a message exchange, not an adventure log or RPG combat log.

### Choice area

The current response choices live in a fixed interaction area beneath the newest conversation state.

They do not persist as giant permanent cards throughout the transcript.

Target approximately four or five meaningful choices per gameplay decision when the current state supports that many.

Choices should be concise enough to scan quickly while still naming a concrete in-world action.

### Composer

The composer is always the open-ended alternative to the listed choices when free-form gameplay is allowed.

The player may ignore every suggested response and type another action.

Voice-to-text should place editable text into the same composer. Speech recognition must not automatically submit the result.

## 3. Player action contract

Buttons are the primary interaction method throughout the game.

Each meaningful Eliza/game response should repopulate the choice area from current state.

Choices must reflect the actual fiction: room, visible objects, NPCs, discovered clues, inventory, prior consequences, danger, and available resources.

The choices are not merely mechanical labels such as `Strength`, `Defense`, or `Mana`. They should describe what the player is doing in the world.

Examples:

- Cross quietly.
- Cut the alarm line.
- Distract Bracken.
- Inspect the bottle-cap bells.
- Look for another way across.

Selecting a choice must create the same kind of outgoing player bubble that typed input creates.

## 4. Free-form action contract

Typed input functions as an additional "anything else" choice.

The player may attempt actions not listed by the button system.

Examples:

- Throw my boot at the bell.
- Ask Nib what the King is afraid of.
- Crawl under the bridge.
- Inspect the black-root seal.

The AI interpretation layer may determine the player's likely intent and map it to a playable action category.

The AI must not become authoritative about:

- whether the action is legal;
- the DC;
- the roll result;
- success or failure;
- Trouble or wound changes;
- inventory changes;
- persistent campaign consequences;
- endings.

Those remain engine-owned facts.

Free-form input should be available throughout actual gameplay unless a specific interaction state intentionally disables it, such as while a roll is pending.

## 5. Unified tabletop roll lifecycle

All actions requiring a check must use one consistent lifecycle whether they originated from a button or from typed input.

Required sequence:

1. The player declares the action.
2. The player's action appears as an outgoing bubble.
3. Eliza recaps what she understands the player is trying to do.
4. Eliza explains any immediately relevant situational factor, class/background benefit, item effect, Mana option, advantage, disadvantage, or other modifier that the player needs to understand.
5. Eliza states the exact target number required to succeed.
6. A temporary `ROLL D20` control appears.
7. The player explicitly activates the roll.
8. The die result is shown.
9. The deterministic engine resolves the result.
10. Eliza narrates the authoritative outcome.
11. The next contextual choices appear.

Example GM setup:

> You're trying to cut the alarm line before the bridge swings you back into Bracken. Your Tracker training helps here, so you have advantage. You need a 12 or better. Roll it.

The UI must not secretly resolve a check at the moment a normal action button is tapped.

Actions that genuinely require no roll may proceed without the D20 step.

## 6. Eliza's role

Eliza is the GameMaster.

She is not merely a narrator and must never sound like a generic AI assistant describing program state.

Her job includes:

- establishing the immediate scene clearly;
- making the fictional world react to the player;
- interpreting unexpected player ideas fairly;
- deciding, through the engine contract, when uncertainty warrants a roll;
- explaining mechanics in natural GM language;
- presenting stakes before a roll;
- keeping pacing moving;
- portraying NPCs distinctly;
- preserving continuity;
- making failure move the story forward;
- encouraging agency without praising every decision;
- helping new players learn how to play.

Eliza should embody an original professional-GM personality informed by strong real-world GM practices: immersive scene control, character focus, improvisation, player agency, cinematic pacing, tactical clarity, accessible teaching, and willingness to let unexpected player ideas change the scene.

Do not imitate any real person's exact wording or protected performance voice.

## 7. Eliza tone

Target world/narration weirdness: approximately 7.25 out of 10.

The game should be clearly weird and funny while remaining easy to follow.

Humor may move between:

- dry absurdity;
- fantasy satire;
- lowbrow or juvenile humor when appropriate;
- literate/highbrow humor;
- anticlimax;
- bureaucracy treated as life-or-death seriousness;
- occasional surreal observation.

Story clarity always outranks the joke.

Eliza should not make every sentence a punchline.

The strongest recurring comedic method is to treat ridiculous facts as completely ordinary facts of the world.

The player must still understand:

- where they are;
- what just happened;
- what matters;
- what they can do;
- what the stakes are.

## 8. Goblin performance rules

Goblins may be substantially more chaotic than Eliza.

Their comedy may include:

- petty bureaucracy;
- pointless procedures;
- strange ranks and job titles;
- aggressive commitment to rules that make little sense;
- contradictory customs;
- absurd food and ingredients;
- theatrical overconfidence;
- arguments over technicalities;
- petty promotions and rivalries;
- occasional fourth-wall breaks.

Different goblins must still feel like different characters rather than one shared joke voice.

Goblin absurdity should grow from character motives and social systems whenever possible, not random nonsense inserted into every line.

## 9. Rooms and persistent world state

The game must distinguish `room` from `scene`.

A room is a persistent physical location in the adventure.

A scene is the current story/interaction beat occurring within or across rooms.

Chapter 1 canonical rooms:

1. Windcut Trail
2. Rattlebridge
3. Cloudberry Shelf
4. Highland Camp
5. King's Stash Hall

The engine should eventually track, at minimum:

- currentRoomId;
- currentSceneId;
- room state;
- NPCs currently present;
- objects currently present;
- discovered/undiscovered interactables;
- resolved clues;
- persistent consequences in that room;
- whether the current moment is eligible for a future Adventure Snapshot.

The user does not need a retro text-adventure map on the normal screen.

## 10. Discoverables and highlighted text

Eliza may highlight words or phrases in story messages when doing so will encourage exploration or help maintain interest.

Eligible highlight types include:

- locations;
- NPCs;
- objects;
- clues;
- rumors;
- breadcrumbs;
- unfamiliar game terms;
- suspicious details;
- lore terms;
- environmental details the character could reasonably investigate.

The GM/narration layer has discretion over which elements deserve highlighting.

Tapping highlighted text opens a small temporary popup above the messenger.

Closing the popup leaves the conversation untouched.

A highlighted element may:

- provide extra descriptive information;
- expose a clue;
- reveal another response choice;
- start a simple investigation interaction;
- require a roll;
- add a remembered breadcrumb.

Highlighting exists to communicate that the world is explorable and that the player's attention matters.

## 11. Puzzle design

Puzzles should be deliberately easy.

Target: approximately third-grade solvability for a relaxed or stoned adult.

The reward should come from noticing and interacting, not from prolonged logic work.

Good puzzle patterns include:

- noticing the obvious control for a trap;
- remembering a ridiculous password;
- matching a simple image or symbol;
- using a visible item in an intuitive way;
- asking the right NPC about an obvious contradiction;
- spotting a straightforward environmental clue.

Do not create puzzles whose intended fun depends on obscure trivia, difficult ciphers, long arithmetic, pixel hunting, or repeated blind guessing.

## 12. Tutorial model

Automatic beginner teaching belongs in Chapters 1 and 2.

Eliza should teach while GMing, not switch into a separate tutorial-screen voice.

Early guidance may explain things such as:

- that the player can choose a listed response or type their own;
- when a roll is required;
- what the target number means;
- how advantage works;
- what Mana can do;
- what a highlighted term means;
- that Help is available;
- that the E-circle hides more detailed character information.

Starting in Chapter 3, automatic beginner guidance should be suppressed unless a specific mechanic genuinely needs explanation.

The Help control remains available after Chapter 2.

## 13. Graduated Help system

Help state is tied to the current obstacle or decision problem and resets when that obstacle changes.

### Help level 1

Give a small reminder or nudge.

Do not solve the problem.

### Help level 2

Give a stronger directional hint.

The player should be very close to understanding the intended path.

### Help level 3

Use the Eliza easter egg.

Eliza briefly breaks the fourth wall, jokingly checks whether the player is okay, rambles about being up late writing this particular section and apparently making it incomprehensible for some people, then gives the correct answer directly with no more guessing.

The exact joke should vary enough not to become a canned repeated paragraph.

The third hint may solve the immediate hurdle. It must not automatically execute the player's action for them.

## 14. Hidden E-circle character/status menu

Normal play should not display a permanent visible character sheet or stat bar.

Press-and-hold the E-circle beside Eliza's name to open the hidden menu.

The menu may contain:

- player name;
- race;
- appearance/pronouns as applicable;
- class/background;
- weapon;
- Strength;
- Defense;
- Mana;
- Trouble and later wound state;
- inventory;
- special items;
- current objective;
- relevant discovered campaign information.

The interaction must be discoverable to the player through Chapter 1 onboarding without making the normal messenger look like an RPG dashboard.

Closing the menu returns immediately to the conversation.

## 15. Voice-to-text

A microphone control should be integrated with the message composer.

Required behavior:

1. Player activates microphone.
2. Speech recognition produces text.
3. Recognized text appears in the normal composer.
4. Player may edit it.
5. Player presses Send.

Do not automatically submit speech recognition output.

Voice input is merely another way to fill the same custom-action field.

## 16. Chapter 1 canonical content requirements

The rebuilt Chapter 1 must remain compatible with the canonical campaign bible.

Required locations:

- Windcut Trail;
- Rattlebridge;
- Cloudberry Shelf;
- Highland Camp;
- King's Stash Hall.

Required important NPCs/content include:

- Goblin King;
- Nib;
- Grubbin;
- Old Tatter;
- Highland Sneaks;
- Cliff Kites;
- King's Root-Crowned Club.

Required simple puzzle/breadcrumb content includes:

- Rattlebridge alarm lines;
- carved-face stash latch;
- picture-based tribute ledger pointing toward the Hollow Market.

Required meaningful branch categories include:

- spare or humiliate the King;
- expose or protect the tribute arrangement;
- keep Nib safe or use Nib as bait;
- recover the stolen item intact, altered, or not at all.

Required Chapter 1 reward/state candidates include:

- remembered stolen-item condition;
- black-root seal;
- goblin favor;
- highland charm.

Chapter 1 must ultimately support at least five meaningfully different completed runs.

## 17. Replay and memory behavior

Replay memory should feel selective and deliberate.

Do not dump previous-run history into every scene.

When Eliza recalls a previous run, choose the one prior fact that matters most to the current moment.

Replay should affect actual state where appropriate: relationships, item condition, discovered information, prices, available allies, danger, rewards, and later chapter options.

A callback is useful only if it makes the world feel like it remembers the player.

## 18. Active-run persistence

Closing the app must not destroy an unfinished adventure.

The game should eventually persist enough state to resume exactly where the user left off, including:

- deterministic engine state;
- current room;
- current scene;
- conversation transcript;
- current contextual choices;
- inventory;
- discovered clues;
- room-state changes;
- RNG state;
- pending roll state;
- Help level for the current obstacle.

Persisted state must remain within the existing privacy and local-data rules of my420journal.

## 19. Privacy boundary

The existing local-first personalization boundary remains controlling.

The game may use only approved sanitized journal-derived fields already allowed by the adapter contract.

Do not send raw notes, voice transcripts, health information, exact amounts, dates/timestamps, real dispensary names/addresses, prices, Layer 2 data, or other unrestricted journal content into the game narration system.

New game features must not weaken that boundary.

## 20. Future campaign systems

Before Chapter 2 becomes production content, the reusable engine should be capable of supporting:

- persistent campaign state;
- persistent inventory;
- Rootcoin;
- danger tiers: Sprout, Bloom, Harvest, Wither;
- wound states: Scraped, Bruised, Broken, Downed;
- Body/Mind/Mood reward/effect mapping;
- selective replay memory;
- data-driven chapter definitions.

Do not build Chapters 2–12 as another series of large scene-specific `if`/`else` blocks.

## 21. Chapter authoring format goal

A chapter should eventually be representable as structured data/configuration covering:

- chapter identity;
- rooms;
- scenes;
- NPCs;
- objects;
- discoverables;
- contextual choices;
- checks;
- puzzles;
- rewards;
- hints;
- entry conditions;
- exit conditions;
- persistent consequences;
- snapshot points.

The engine should execute those definitions rather than requiring each chapter to invent a new runtime architecture.

## 22. Adventure Snapshot hooks

Do not build the Story-Picture Builder yet.

Build snapshot eligibility into the room/scene architecture now.

A future snapshot record should be able to identify:

- chapter;
- room;
- scene;
- important characters present;
- important objects;
- environment state;
- meaningful consequence/state;
- whether the moment is eligible for an adventure image.

This should support a future Disneyland-ride-photo-style story image without requiring the image system to infer location from an unstructured transcript.

## 23. Narration staging rule

A new Eliza system prompt or major narration-contract change must not first be evaluated on the production Worker.

Use a separately named staging narration Worker and a Pages Preview path that calls staging.

Production remains untouched until live AI-generated gameplay has been tested and approved.

## 24. Build order

Follow this order unless a later explicit decision changes it:

1. Definitive Game Experience Spec and replacement of obsolete UI presentation rules.
2. Messenger UI rebuild.
3. Unified button/custom-action to GM setup to explicit D20 to outcome lifecycle.
4. Persistent room system.
5. Dynamic four-to-five choices and full-game custom input.
6. Discoverables/highlight popups.
7. Hidden E character menu and voice-to-text.
8. Chapter 1-2 tutorial/Help engine including the three-tap easter egg.
9. Staging narration Worker and Pages Preview connection.
10. Rewrite Eliza GM prompt and goblin voice rules, then live-test on staging.
11. Expand Chapter 1 to full canonical locations, NPCs, puzzles, rewards, and branches.
12. Add active-run save/resume and persistent campaign state.
13. Validate five materially different Chapter 1 runs.
14. Only then begin Chapter 2.

## 25. Non-goals for the current foundation pass

Do not:

- turn Weed Goblins into a Zork-style parser interface;
- expose a permanent RPG HUD in normal messenger view;
- remove the response buttons;
- make free text the sole interaction method;
- let AI decide authoritative mechanics or outcomes;
- make puzzles difficult;
- start Chapter 2 before the reusable Chapter 1 platform is stable;
- deploy an untested narration prompt directly to production.
