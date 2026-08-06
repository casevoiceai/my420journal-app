# Weed Goblins Session 1 Prototype Contract

## Canonical premise

S.T.O.N.E.R. narrates a D20 fantasy adventure in the Goblin Highlands. The Goblin King stole something important. The player retrieves it through a short branching run. Characters use exactly three named stats: Strength, Defense, and Mana Pool.

## Session 1 rules

- One complete run contains: background choice, route check, goblin encounter, midpoint decision, Goblin King confrontation, and ending.
- Checks are `d20 + Strength` or `d20 + Defense` against DC 9 (easy), 12 (standard), 15 (hard), or 16 (Goblin King).
- Natural 20 removes one Trouble after the check.
- Mana Pool is spendable, not added directly to ordinary checks. Spending Mana grants advantage: roll two D20s, take the higher result, add the relevant stat, and compare it with the unchanged target DC.
- A Mana-assisted check is never an automatic success. It can fail normally, and it can produce a natural-1 complication if both advantage dice are 1.
- Strike and Outlast remain ordinary rollable actions that do not require Mana. The engine may also accept optional Mana assistance for an ordinary check, but the unassisted action remains available.
- A failed dangerous check adds one Trouble. Three Trouble ends the run in the escape/defeat ending.
- A natural-1 complication costs two Trouble by design, making it more costly than an ordinary failed check. Its special cap prevents that complication from ending the run by itself.
- The three Session 1 endings are recovery, bargain, and escape.
- The engine is deterministic for a supplied seed and has no React, network, AI, storage, or journal-database access.

## Natural-1 complication pattern

A selected natural 1 always follows a dedicated complication path, not the standard failure path. With advantage, this means both D20s were 1. The complication is a specific comedic, non-fatal setback narrated in S.T.O.N.E.R.'s dry, earnest voice.

A natural-1 complication:

- never kills or seriously harms the player character;
- never ends the run by itself, even when Trouble was already high;
- adds two Trouble by design, rather than the one Trouble added by an ordinary failed check;
- creates an absurd, mildly costly setback such as lost time, a worse tactical position, or a change to an item's condition;
- uses a concrete narration line distinct from the scene's ordinary failure text;
- records `outcome: complication` on the check event so later narration can recognize it.

The deterministic engine implements the two-Trouble cost as `min(2, current Trouble + 2)`. This preserves the locked two-Trouble penalty while ensuring that the complication cannot cross the three-Trouble defeat threshold by itself.

Locked tone examples, not an exhaustive future content list:

- "The stone gate moves exactly far enough to block the route you were using. This is measurable progress."
- "Your boot remains in the fen. This is not serious, but it does change the schedule."
- "A goblin stamps your sleeve TEMPORARY ASSISTANT. The stamp is permanent for the rest of the afternoon."
- "The field reliquary acquires a dent shaped exactly like a goblin's opinion. Its contents remain secure."
- "You reach the correct tactical position one minute after it stops being the correct tactical position."

## Character backgrounds

- Highlands Hauler: Strength 3, Defense 1, Mana Pool 2.
- Cautious Keeper: Strength 1, Defense 3, Mana Pool 2.
- Fog-Table Adept: Strength 1, Defense 2, Mana Pool 4.

Each background is a cannabis-culture reference delivered with complete earnestness by S.T.O.N.E.R. It affects only fictional game mechanics and makes no health or real-world product claims.

## Locked future narration decisions

### Goblin King performance voice

S.T.O.N.E.R. remains the narrator of Weed Goblins. When AI narration is added in a future session, S.T.O.N.E.R. performs the Goblin King as a distinct character voice the way a tabletop DM performs a villain differently from ordinary narration. The Goblin King is theatrical, a little too pleased with himself, and confident he has already won. This is a performed fictional character voice, not a separate AI guide or identity. Session 1 does not generate Goblin King dialogue.

### Callback escalation

Callback eligibility is based on completed Weed Goblins runs by the same player:

- 0 to 4 prior completed runs: normal narration.
- 5 to 9 prior completed runs: narration may begin referencing that the player seems experienced without explaining how it knows.
- 10 or more prior completed runs: one character may briefly break the fourth wall once in a run, then immediately act as though it did not happen. S.T.O.N.E.R. never comments on the moment.

Session 1 only calculates and reports the applicable `narrationTier`. It does not generate callback or fourth-wall narration text.

## Local-data boundary

The pure engine never reads local storage or journal records itself. A separate local-data adapter may read the active user's local `entries` table and produce only this sanitized snapshot:

- up to five product display names;
- up to three product categories;
- up to five top effect tags;
- up to five top recorded terpene labels;
- up to three dispensary names;
- the total local entry count;
- up to ten sanitized previous Weed Goblins run summaries.

The adapter must never include raw notes, voice transcripts, health information, exact amounts, exact dates or timestamps, addresses or coordinates, price, or Layer 2 data. Note and sleep rows are included only in the total count and are not eligible product entries. A user with zero local entries receives a valid empty snapshot. A user with only note or sleep rows receives empty personalization lists with the total count preserved, so the engine still uses fixed fictional fallback content.
