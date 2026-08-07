# Weed Goblins Future Interface Design

## Status and scope

This document locks the interface direction for a future Weed Goblins build phase. It is a design reference only. It does not authorize or include UI implementation, React components, styling work, animation work, or production integration.

## Core presentation

Weed Goblins presents as a real text-message conversation rather than a visible game interface.

S.T.O.N.E.R.'s narration appears as incoming message bubbles:

- left-aligned;
- styled like messages from a normal saved contact;
- visually consistent with an ordinary private text conversation;
- used for narration, consequences, complications, dice outcomes in context, and ending text.

The player's selected choice appears as an outgoing message bubble:

- right-aligned;
- styled like a message the player typed and sent;
- inserted into the conversation immediately after selection;
- preserved in the conversation history so the exchange reads naturally from top to bottom.

## Player choices

Available choices are presented as tappable suggestion chips above the message input area.

The interaction pattern should match the quick-reply suggestions already familiar from messaging applications such as iMessage and WhatsApp. Choices must not appear as a game-style menu, numbered command list, large action buttons, or a separate control panel.

When the player selects a suggestion chip:

1. the chip selection is accepted as the player's response;
2. the selected text becomes a right-aligned outgoing message bubble;
3. the suggestion chips are replaced by the next relevant set of choices when the engine advances.

The message input area may be visually present to preserve the appearance of a normal conversation, but free-text input is not implied or required by this design decision.

## Dice display

Dice results use a small die-shaped icon attached to the message associated with the check.

The locked launch behavior is:

- the icon has a minimal visual footprint;
- it is static;
- it appears blank while the roll is unresolved;
- after resolution, it displays only the final selected D20 number;
- it does not animate;
- it does not open a large dice panel or create a game-like visual interruption.

For a Mana-assisted advantage roll, the default conversation view still displays only the final selected number. Any future way to inspect both underlying rolls must remain secondary and must not make the ordinary conversation view look like a game screen.

## Optional future dice animation

A separate setting may later enable an animated rolling-die effect for the same small icon.

That setting must be:

- off by default;
- explicitly optional;
- treated as future scope;
- intended for situations where discretion is not a concern;
- implemented without changing the default static launch experience.

Animated dice are not part of the initial interface build.

## Locked design goal

Someone looking at the player's phone screen from a normal glancing distance should see what looks like a text conversation, not a visible game.

Every future interface decision should be evaluated against that requirement. Game mechanics may be present, but their visual treatment must remain subordinate to the appearance of an ordinary messaging exchange.
