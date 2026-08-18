# Weed Goblins — Founder-Controlled RPG Experience Spec v2

Status: CONTROLLING for the RPG rebuild on `feature/weed-goblins-rpg-vertical-slice`.

This file supersedes the messenger/chat/session-zero experience previously implemented for Weed Goblins. Historical code may remain in the repository for rollback or reference, but it is not authoritative for v2 behavior.

## Core experience

Weed Goblins is a text-based fantasy CYOA with real D20 tabletop mechanics. The player should feel both that Eliza is DMing a strange goblin campaign and that they are playing a polished digital adventure. It is not an AI texting simulator.

The Chapter 1 vertical slice is:

Windcut Trail → meaningful route choice → distributed character creation → Rattlebridge → Highland Sneak encounter → Cloudberry Shelf.

Do not extend this slice to Highland Camp, Stash Hall, or the Goblin King until the founder approves the slice in play.

## Eliza

Eliza is the Dungeon Master. She describes the world, plays NPCs and enemies, explains rulings when needed, adjudicates genuinely freeform intent, and narrates already-resolved mechanics.

The engine owns canon, stats, inventory, HP, Mana, wounds, difficulty, dice, outcomes, enemy capabilities, position, faction knowledge, and persistent world state. Eliza may not change those facts for prose convenience.

First-ever campaign introduction is exactly:

“Hi, I’m Eliza, and I’ll be your Dungeon Master. If this is your first time playing, don’t worry about knowing the rules. Just tell me what you want to do when I ask, and I’ll walk you through anything else as we go.

All right. The Goblin Highlands.”

Returning campaigns skip the tutorial portion.

Remote AI narration is disabled in this vertical slice. The adapter boundary may exist, but founder testing must remain functional with local authored/rule-based narration only.

## Prose contract

Default narration is normal connected prose in real paragraphs with varied sentence length. Serial one-line fragments and fake-cinematic stacking are prohibited except for a rare deliberately earned dramatic beat.

Humor belongs in the world. Eliza takes the world seriously even when goblin circumstances are ridiculous. Do not force a joke every paragraph, explain jokes, congratulate choices, or use product/tutorial language inside narration.

The target is easy-to-read fantasy adventure that becomes delightfully strange, not stoner caricature and not comedy-copywriting.

## Interaction model

Primary input is 3–4 contextual CYOA actions. Freeform text is an escape hatch for actions not represented by a button.

Buttons represent concrete character actions or dialogue, not abstract UI categories such as Attack / Defend / Magic.

A choice is committed when selected. Dice, costs, resources, inventory changes, promises, and consequences are final. Refresh may resume a committed state but never reroll or rewind it.

## Distributed character creation

There is no session-zero questionnaire.

Order:

1. The story begins.
2. Player makes the first meaningful route choice.
3. Name and race are established.
4. Weapon is established when equipment becomes relevant.
5. Background is established before the first substantial uncertain check.
6. Appearance/pronouns may be established later only when fiction naturally calls for them.

No D20 roll occurs before background selection.

Races: Human, Dwarf, Elf, Gnome.

Weapons: Sword, Bow, Battle Axe, Bo Staff, Mace, Daggers.

Backgrounds:

- Highland Tracker: Strength 3, Defense 1, Mana 2, Max HP 14, base Guard 11, signature `Push Through`.
- Trail Warden: Strength 1, Defense 3, Mana 2, Max HP 16, base Guard 13, signature `Hold the Line`.
- Fen Diviner: Strength 1, Defense 2, Mana 4, Max HP 12, base Guard 12, magical capability +2 at Level 1, signature `Read the Wrong Map Right`.

Race gives situational traits, not raw stat bonuses.

## Core D20 rules

Checks: d20 + relevant modifier versus DC. Meet or beat succeeds.

Working DC ladder:

- Routine: no roll
- Easy: 8
- Moderate: 11
- Hard: 14
- Severe: 17
- Extreme: 20

Advantage: roll 2d20, keep high. Disadvantage: keep low. They cancel. Ordinary sources do not stack.

Nat 20 is contextually stronger. Nat 1 creates a strong contextual complication. Nat 1 does not automatically add two Trouble and does not automatically cause death.

Failure always changes the situation. No identical immediate retry unless fiction materially changes.

Before any player roll, the game establishes action, stat, DC/target if known, advantage/disadvantage, cost, success stakes, and failure risk. These cannot be changed after the die is known.

## Dice ownership

Player visibly rolls:

- player checks
- player attacks
- player resistance
- player damage after a successful damaging attack

Eliza/DM visibly rolls enemy attacks, enemy damage, enemy resistance, and other NPC dice. Player never presses the enemy roll button.

The mechanical result is committed before its animation/render. Refresh must reveal the same committed result.

## Weapons

Starting weapon is permanent for the campaign. It may be repaired, upgraded, altered, enchanted, or renamed, but the base weapon type is not swapped.

Base Level 1 damage:

- Sword: d8
- Bow: d8
- Battle Axe: d10
- Bo Staff: d8
- Mace: d8
- Daggers: 2d4

Each weapon must support at least two physically legitimate Level 1 approaches so no weapon/background combination is a trap. The approach changes fiction and tactical effect; the player may not simply choose their best stat without justification.

Forceful Strength-based damaging attacks add Strength to damage. Precision/Defense attacks normally do not add Defense to damage unless an ability explicitly says otherwise.

A successful ordinary damaging attack deals at least 1 HP after ordinary modifiers/resistance unless an explicit barrier, immunity, or reaction prevents damage.

Weapon identities:

- Sword: adaptable, counters/defensive maneuvers.
- Bow: range and positional pressure; impaired while Engaged.
- Battle Axe: force, breach, environmental destruction.
- Bo Staff: control, shove, reposition, defensive space.
- Mace: impact, disruption, Guard/structure pressure.
- Daggers: fast close precision, reposition, later multi-hit paths.

## Mana and magic

Mana powers special abilities. Cost is committed before the roll and is not refunded on failure.

Tracker/Warden Mana represents extraordinary technique. Diviner Mana powers actual magic.

Fen Diviner magic is freeform rather than a fixed spell list. At Level 1, minor harmless magic may cost 0, useful small effects usually cost 1, strong encounter-changing effects usually cost 2 and may require a check. Effects beyond current Level are reduced to a legitimate scale or refused.

Magic cannot resurrect permanent death, erase committed history, grant unlimited permanent resources, bypass Level, or rewrite hard canon.

## HP, wounds, and defeat

HP is normal combat durability.

Wound severity: None → Scraped → Bruised → Broken → Downed.

Ordinary HP loss does not automatically create a wound. Wounds come from severe circumstances, critical effects where fiction supports them, environmental harm, authored abilities, or 0 HP.

Ordinary Chapter 1 encounters are nonlethal. Reaching 0 HP in an ordinary encounter produces Downed and a serious story consequence such as defeat, capture, displacement, confiscation, or lost position. It does not reload a checkpoint.

Permanent death is reserved for clearly lethal/boss situations later in the campaign. Permanent player death archives the run; a new character begins Level 1 Chapter 1. No resurrection.

## Trouble and pressure

Trouble is chapter-wide external danger:

0 Controlled
1 Complicated
2 Dangerous
3 Hot

Trouble 3 is not game over.

Specific pressures are separate, for example Alarm Quiet / Threatened / Raised / Disabled, stealth Unseen / Suspicious / Spotted, and pursuit/time states.

## Opening routes

Route 1 — Direct pursuit:

- fastest
- least information
- maintains pressure on thieves
- Rattlebridge begins with the guard more prepared and the alarm potentially already Threatened

Route 2 — Investigate campsite/tracks:

- costs time
- reveals targeted-theft evidence, lookout evidence, crooked-root evidence, and related discoveries
- Rattlebridge begins with better knowledge and no automatic detection

Route 3 — High/alternate approach:

- Hard environmental approach
- success grants unusual/elevated position and Unseen state
- failure still reaches Rattlebridge with changed position, time, Trouble, HP, or stealth; never a reset

## Rattlebridge

Rattlebridge is a state-driven encounter, not a fixed scene conveyor.

Highland Sneak Level 1 baseline:

- HP 12
- Strength 1
- Defense 2
- Guard 12
- initiative d20 + 2
- Hookknife attack d20 + 2
- Hookknife damage d4 Physical
- objective: protect the crossing and get a warning through

The Sneak evaluates alarm status, whether it knows the player is present, immediate danger, access to alarm, escape/report route, morale, and bargaining opportunity. It does not default to attacking every turn.

Alarm states:

Quiet → Threatened → Raised

or Quiet/Threatened → Disabled.

The alarm is deliberately a two-step threat. A Sneak generally must begin the warning process, then complete it on a later action unless interrupted, blocked, disabled, bargained with, or the situation changes. Direct-pursuit entry may begin at Threatened. Investigation/high-route entries normally do not.

A Sneak that escapes without raising the alarm starts an off-screen report process. Factions are not omniscient; knowledge spreads through witnesses, survivors, reports, rumors, evidence, or communication.

Valid Rattlebridge resolution families include stealth/bypass, alarm manipulation, social, combat, environmental action, and freeform play. These are capabilities, not menu tabs.

## Combat

Real fights use initiative. Ordinary small fights should usually resolve in roughly 3–5 rounds, though control, morale, surrender, clever environmental solutions, or unusual builds may vary.

No grid. Use encounter-specific zones such as Engaged, Near, Far, Cover, Elevated, Bridge Edge.

Initiative is normally d20 + Defense. Similar minor enemies may share initiative; named/elites use separate turns.

One meaningful primary action per turn. Movement may bundle with that action when reasonable. Substantial/dangerous movement can itself be the primary action/check.

Enemy morale is descriptive: Confident → Shaken → Breaking. Enemies can retreat, surrender, bargain, protect objectives, or flee.

Combat intent is inferred from what the player actually does: subdue, drive off, or kill. Do not show a generic combat-intent modal unless freeform input is genuinely ambiguous.

## Knowledge and exploration

Tell the player automatically what the character reasonably notices. Subtle information may require investigation, race/background ability, tools, or a D20 check.

No repeated “search room” grind. Required progress cannot depend on one missable clue.

Discoveries store concise meaningful knowledge. Threads store unresolved objectives, obligations, promises, and favors without becoming a quest checklist.

Map shows only discovered places/routes and distinguishes confirmed, reported, and rumored information where relevant.

## Persistence architecture

V2 persistence is local-first and uses IndexedDB, not the legacy single localStorage session blob.

Three layers:

1. Current Snapshot — what is true now.
2. Immutable Decision/Roll Ledger — committed decisions, costs, rolls, promises, and state mutations.
3. Adventure History — readable Eliza/player presentation.

The transcript is never authoritative state.

A state-changing roll transaction follows:

Intent → ruling/stakes fixed → player commits → random result generated and persisted → state mutation committed → narration rendered.

The old v1/v2/v3 chat prototype localStorage records are not automatically migrated into this RPG campaign.

## Privacy boundary

Only the already-approved structured local personalization snapshot may enter Weed Goblins. Do not use or persist raw journal notes, transcripts, health information, exact amounts, dates, prices, precise location, or Shared Journey/Layer 2 data.

## Vertical-slice acceptance

Automated tests may prove mechanics, state integrity, privacy boundaries, deterministic/committed roll behavior, route divergence, alarm behavior, defeat behavior, and build integrity. Automated tests may not claim the game is fun or the prose is good.

Founder play must eventually cover:

1. noncombat/investigation path
2. real combat path
3. intentional failed check
4. intentional ordinary 0 HP defeat

No merge or production deployment from this branch without separate explicit founder authorization.
