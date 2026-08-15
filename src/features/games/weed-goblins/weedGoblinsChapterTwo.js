export const CHAPTER_TWO = Object.freeze({
  id: 'chapter-2',
  number: 2,
  title: 'The Hollow Market',
  adventureId: 'hollow-market-session-1',
  campaignRole: 'The real start of the conspiracy arc, built around investigation, commerce, and social leverage.',
  corePremise: 'Beneath a collapsed root bridge lies a market that appears only when three smokeless lanterns are lit. Every major seller here pays a harvest tithe to the Cultivator, and stolen goods are converted into living black-root receipts that crawl into cracks in the floor.',
  chapterEnding: 'The Harvest Ledger shows the Cultivator has stopped requesting ordinary loot and points toward the Withered Grove.',
})

export const CHAPTER_TWO_LOCATIONS = Object.freeze({
  lanternMouth: Object.freeze({ id: 'lantern-mouth', name: 'Lantern Mouth' }),
  whisperRows: Object.freeze({ id: 'whisper-rows', name: 'Whisper Rows' }),
  rootExchange: Object.freeze({ id: 'root-exchange', name: 'Root Exchange' }),
  drainGate: Object.freeze({ id: 'drain-gate', name: 'Drain Gate' }),
})

export const CHAPTER_TWO_LOCATION_LIST = Object.freeze(Object.values(CHAPTER_TWO_LOCATIONS))

export const CHAPTER_TWO_NPCS = Object.freeze({
  grintleSixfinger: Object.freeze({
    id: 'grintle-sixfinger',
    name: 'Grintle Sixfinger',
    role: 'Market fixer missing two real fingers, replaced with brass. Deals in favors more than Rootcoin and knows who sent the Goblin King, for a price.',
  }),
  nettle: Object.freeze({
    id: 'nettle',
    name: 'Nettle',
    role: 'Quick, ageless-looking runner who trades information for food and is scared of anyone in a green cloak.',
  }),
  auntieResin: Object.freeze({
    id: 'auntie-resin',
    name: 'Auntie Resin',
    role: "Charm seller who can mask the player's item resonance and wants her confiscated nephew rescued in return.",
  }),
  coinWarden: Object.freeze({
    id: 'coin-warden',
    name: 'The Coin Warden',
    role: 'Market law enforced fairly, a wall to work around rather than fight.',
  }),
})

export const CHAPTER_TWO_NPC_LIST = Object.freeze(Object.values(CHAPTER_TWO_NPCS))

export const CHAPTER_TWO_THREATS = Object.freeze({
  rootCollector: Object.freeze({
    id: 'root-collector',
    name: 'Root Collector',
    description: "A tall figure bundled from receipts, roots, and masks, made of the market's own tithe system. It does not negotiate.",
    manaDots: 4,
  }),
})

export const CHAPTER_TWO_PUZZLES = Object.freeze({
  lanternOrder: Object.freeze({
    id: 'lantern-lighting-order',
    name: 'correct lantern-lighting order',
    locationId: CHAPTER_TWO_LOCATIONS.lanternMouth.id,
  }),
  livingLedger: Object.freeze({
    id: 'living-ledger',
    name: 'living ledger that rearranges itself when lied to',
    locationId: CHAPTER_TWO_LOCATIONS.rootExchange.id,
  }),
})

export const CHAPTER_TWO_MARKET_STATES = Object.freeze([
  'operational',
  'exposed',
  'burned',
  'regulated',
  'secretly-controlled-by-player',
])

export const CHAPTER_TWO_MAJOR_BRANCHES = Object.freeze({
  keepOperational: 'keep the market operational for a recurring supplier',
  exposeTithe: 'expose the tithe and trigger a revolt',
  burnOrFlood: 'burn or flood the market and scatter its criminals elsewhere',
  takeTradeRoute: 'quietly take one trade route for later leverage',
})

export const CHAPTER_TWO_REWARDS = Object.freeze({
  harvestLedger: 'Harvest Ledger',
  marketVeil: 'Market Veil',
  favorContract: 'favor contract',
  sixfingersMarker: "Sixfinger's Marker",
})

export const CHAPTER_TWO_CORE_BEATS = Object.freeze([
  'pay the entry price in coin, memory, or favor',
  'follow the tribute chain through merchants and living receipts',
  "survive the Root Collector's early arrival",
  'decide what to do with the ledger',
  'escape or settle with the Coin Warden',
])
