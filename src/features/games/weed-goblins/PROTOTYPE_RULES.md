# Weed Goblins Session 1 Prototype Contract

## Canonical premise

STONER narrates a D20 fantasy adventure in the Goblin Highlands. The Goblin King stole something important. The player retrieves it through a short branching run. Characters use exactly three named stats: Strength, Defense, and Mana Pool.

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

Each background is a cannabis-culture reference delivered with complete earnestness by STONER. It affects only fictional game mechanics and makes no health or real-world product claims.

## Local-data boundary

The engine accepts an optional sanitized snapshot containing product names, dispensary names, effect tags, and prior Weed Goblins summaries. It never reads local storage or journal records itself. Logged product names may seed the stolen item's fictional name. Empty snapshots use fixed fictional fallback content.
