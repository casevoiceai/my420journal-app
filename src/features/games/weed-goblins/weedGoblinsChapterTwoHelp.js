import { CHAPTER_TWO_SCENES } from './weedGoblinsChapterTwoRuntime.js'

function strongestApproach(state) {
  const strength = Number(state?.stats?.strength) || 0
  const defense = Number(state?.stats?.defense) || 0
  if ((Number(state?.stats?.manaPool) || 0) > 0) {
    return 'If you want the safest single roll against the Collector, use the Mana option for advantage. The Collector does not negotiate.'
  }
  return defense >= strength
    ? 'Your Defense is currently higher. Use Slip between the Collector and the ledger or Take the ledger shelves upward.'
    : 'Your Strength is currently higher. Use Break its receipt-roots apart or Cut the black-root anchor lines.'
}

export function getChapterTwoHelpContextKey(state) {
  if (!state || state.chapterNumber !== 2) return ''
  return `chapter-2:${state.sceneId}:${state.chapterTwo?.marketState || 'operational'}:${state.chapterTwo?.receiptClue ? 'receipt' : 'no-receipt'}:${state.chapterTwo?.merchantClues?.length || 0}`
}

export function getChapterTwoAutomaticGuidance(state) {
  if (!state || state.chapterNumber !== 2 || state.status === 'completed') return ''
  return 'Chapter 2 uses Sprout, Bloom, Harvest, and Wither danger. Suggested moves are always available, you can still type or speak another idea, and any uncertain move stops on an explicit Roll D20 button before the result is resolved.'
}

export function getChapterTwoHelpResponse(state, level = 1) {
  const resolvedLevel = Math.max(1, Math.min(3, Number(level) || 1))
  let text = ''
  let solvesObstacle = false

  if (state?.sceneId === CHAPTER_TWO_SCENES.lanternOrder) {
    text = resolvedLevel === 1
      ? 'The lantern marks are the whole puzzle. The market wants an order, not a roll.'
      : resolvedLevel === 2
        ? 'The moth-marked lantern comes before the root-marked one.'
        : 'Use Moth, root, coin. That is the correct lantern order.'
    solvesObstacle = resolvedLevel === 3
  } else if (state?.sceneId === CHAPTER_TWO_SCENES.entryPrice) {
    text = resolvedLevel === 1
      ? 'Coin, memory, and favor are all valid prices. Asking the Warden explains the favor without committing you.'
      : resolvedLevel === 2
        ? 'Paying Rootcoin creates no debt. Memory uses only a fictional road-memory token, never journal content. Favor creates a future obligation.'
        : state.rootcoin > 0
          ? 'If you want the cleanest exit from this decision, pay one Rootcoin. It creates no later obligation.'
          : 'You have no Rootcoin. Choose the road-memory token to avoid a future favor, or choose favor if you want that obligation in the story.'
    solvesObstacle = resolvedLevel === 3
  } else if (state?.sceneId === CHAPTER_TWO_SCENES.whisperRows) {
    text = resolvedLevel === 1
      ? 'You need two kinds of proof before the Root Exchange matters: a merchant-side clue and the living receipt trail.'
      : resolvedLevel === 2
        ? 'Grintle, Nettle, or Auntie Resin can give the merchant-side clue. Inspecting the receipt gives the second half.'
        : 'Get at least one merchant clue, then Inspect the receipt beneath the recognized stall. Once both exist, the Root Exchange opens.'
    solvesObstacle = resolvedLevel === 3
  } else if (state?.sceneId === CHAPTER_TWO_SCENES.rootExchange) {
    text = resolvedLevel === 1
      ? 'The living ledger reacts to truth and lies differently. You already brought evidence from Whisper Rows.'
      : resolvedLevel === 2
        ? 'Telling the truth or matching the living receipt to the ledger resolves the puzzle without a roll. Lying or using Mana is riskier.'
        : 'Choose Tell the ledger exactly why you are here, or Match the living receipt to the ledger. Either resolves the ledger and triggers the Collector.'
    solvesObstacle = resolvedLevel === 3
  } else if (state?.sceneId === CHAPTER_TWO_SCENES.rootCollector) {
    text = resolvedLevel === 1
      ? 'This is Wither danger. The Root Collector is not a social obstacle and does not negotiate.'
      : resolvedLevel === 2
        ? 'Use your stronger stat, or spend Mana for advantage if that option is available. Failure moves the story forward but can leave you Downed.'
        : strongestApproach(state)
    solvesObstacle = resolvedLevel === 3
  } else if (state?.sceneId === CHAPTER_TWO_SCENES.ledgerDecision) {
    text = resolvedLevel === 1
      ? 'This is not a puzzle with one correct answer. Your choice becomes the persistent market state.'
      : resolvedLevel === 2
        ? 'Operational preserves a supplier. Exposed triggers revolt. Burn or flood scatters the market. Taking a route creates private leverage.'
        : 'Choose the market state you actually want to carry forward. There is no mechanically correct branch here, and Help will not pretend there is one.'
    solvesObstacle = resolvedLevel === 3
  } else if (state?.sceneId === CHAPTER_TWO_SCENES.drainGate) {
    text = resolvedLevel === 1
      ? 'The investigation is complete. This decision controls how you leave and what obligation follows you.'
      : resolvedLevel === 2
        ? 'Drain Gate and ledger proof avoid a new favor. Warden settlement is a roll. Future favor creates a favor contract. Rootcoin closes the account if you still have one.'
        : state.rootcoin > 0
          ? 'For the lowest-risk clean exit, Pay one Rootcoin and close the account. If you want a story obligation instead, choose the favor or Warden options.'
          : 'For the lowest-risk exit without Rootcoin, Leave through the Drain Gate or Put the Harvest Ledger on the table. Both complete the run without another roll.'
    solvesObstacle = resolvedLevel === 3
  } else {
    text = 'Use the visible choices as examples, or type what you want to try. If the move is uncertain, Eliza will stop before the result and give you the Roll D20 button.'
    solvesObstacle = resolvedLevel === 3
  }

  return { level: resolvedLevel, text, solvesObstacle }
}
