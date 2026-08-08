# Weed Goblins Interface Design

## Locked presentation

Weed Goblins is presented as a compact tabletop fantasy adventure. It must read immediately as a game, not as a private text conversation or a generic chat screen.

The screen always exposes four layers:

1. The quest header names Weed Goblins, the current chapter, quest, and scene.
2. The objective states what the Goblin King stole and that the player must take it back.
3. The character bar shows Strength, Defense, Mana, and Trouble whenever a background has been selected.
4. The adventure log records S.T.O.N.E.R.'s narration, the player's moves, rolls, and outcomes.

Fantasy presentation uses dark woodland color, warm gold accents, serif story text, bordered panels, and a visible d20. No contact name, avatar, message status, phone-chat composer, or speech-bubble layout belongs in this game.

## Player actions

Every deterministic engine action must remain visible as a full action card in every active scene. Free-text support adds a custom-action field below those cards. It never replaces or hides the built-in actions.

Each action card includes:

- the action name;
- its immediate fictional intent;
- the relevant check, Mana cost, advantage, or no-roll consequence;
- a clear pressed, disabled, and keyboard-focus state.

Selecting a card must immediately record the player's move in the adventure log and advance the engine. A failure to resolve must produce a visible error and restore the available actions. No interaction failure may be swallowed silently.

## Dice

A pending roll appears as a dedicated d20 control inside the adventure log. The player explicitly activates it. The resolved face then shows the selected number before the narrated outcome.

Fixed engine actions that already resolve their check immediately may keep the final die attached to their narrated result. Free-text checks retain the explicit setup, roll, result, and outcome sequence.

## Narration typography

Narration uses ordinary periods, commas, colons, and semicolons. Generated narration must not contain em dashes or en dashes. The Worker prompt prohibits them and client validation rejects them before display.

## Responsive behavior

On phones, actions stack as full-width cards and the status bar uses four compact columns. On larger screens, actions use a two-column grid and the adventure is centered in a bounded game frame. The story log and action panel may scroll independently so controls remain reachable on short screens.
