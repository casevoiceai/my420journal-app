# Weed Goblins Session 1 Prototype Contract

## Canonical premise

S.T.O.N.E.R. narrates a D20 fantasy adventure in the Goblin Highlands. The Goblin King stole something important. The player retrieves it through a short branching run. Characters use exactly three named stats: Strength, Defense, and Mana Pool.

## Session 1 rules

- One complete run contains: background choice, route check, goblin encounter, midpoint decision, Goblin King confrontation, and ending.
- Checks are `d20 + Strength` or `d20 + Defense` against DC 9 (easy), 12 (standard), 15 (hard), or 16 (Goblin King).
- Natural 20 removes one Trouble after the check. Natural 1 adds two Trouble instead of one.
- Mana Pool is spendable, not added directly to ordinary checks. Mana powers background abilities, magical choices, and optional rerolls.
- A failed dangerous check adds one Trouble. Three Trouble ends the run in the escape/defeat ending.
- The three Session 1 endings are recovery, bargain, and escape.
- The engine is deterministic for a supplied seed and has no React, network, AI, storage, or journal-database access.

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

The engine accepts an optional sanitized snapshot containing product names, dispensary names, effect tags, and prior Weed Goblins summaries. It also accepts an optional `priorCompletedRunCount` supplied by the app. It never reads local storage or journal records itself. Logged product names may seed the stolen item's fictional name. Empty snapshots use fixed fictional fallback content.
