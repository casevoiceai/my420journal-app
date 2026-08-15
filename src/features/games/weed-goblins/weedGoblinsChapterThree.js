export const CHAPTER_THREE = Object.freeze({
  id: 'chapter-3',
  number: 3,
  title: 'The Withered Grove',
  adventureId: 'withered-grove-session-1',
  campaignRole: 'The first ecological consequence chapter, proving the Cultivator is physically feeding through the land.',
  corePremise: 'A grove that once produced glowing resin is turning gray from the roots up. Water and sunlight remain, but something underground is siphoning growth, memory, and magic into a deeper network.',
  chapterEnding: 'Bramblekin confirms the pull leads to the Sunken Greenhouse, a flooded place everyone stopped talking about. The threat is bigger than the goblins.',
})

export const CHAPTER_THREE_LOCATIONS = Object.freeze({
  grayVerge: Object.freeze({ id: 'gray-verge', name: 'Gray Verge' }),
  resinChapel: Object.freeze({ id: 'resin-chapel', name: 'Resin Chapel' }),
  thirstingRun: Object.freeze({ id: 'thirsting-run', name: 'Thirsting Run' }),
  sleepingNursery: Object.freeze({ id: 'sleeping-nursery', name: 'Sleeping Nursery' }),
  siphonWell: Object.freeze({ id: 'siphon-well', name: 'Siphon Well' }),
})

export const CHAPTER_THREE_LOCATION_LIST = Object.freeze(Object.values(CHAPTER_THREE_LOCATIONS))

export const CHAPTER_THREE_NPCS = Object.freeze({
  bramblekin: Object.freeze({
    id: 'bramblekin',
    name: 'Bramblekin',
    role: 'A grove spirit barely holding a shape who knows the pull comes from underground.',
  }),
  corla: Object.freeze({
    id: 'corla-the-forager',
    name: 'Corla the Forager',
    role: 'Practical and exhausted, keeping one living patch alive by hand and carrying one living seed in a locket.',
  }),
  kip: Object.freeze({
    id: 'kip',
    name: 'Kip',
    role: 'A young spriggan who hears the roots whisper schedules and numbers that adults dismissed as fear.',
  }),
})

export const CHAPTER_THREE_NPC_LIST = Object.freeze(Object.values(CHAPTER_THREE_NPCS))

export const CHAPTER_THREE_THREATS = Object.freeze({
  witheringStalker: Object.freeze({
    id: 'withering-stalker',
    name: 'Withering Stalker',
    description: 'A deer-shaped thing of dead branch and old root, silent and visible only when it moves.',
  }),
  rootLeeches: Object.freeze({
    id: 'root-leeches',
    name: 'Root Leeches',
    description: 'They attach beneath major roots and pull toward magic.',
  }),
})

export const CHAPTER_THREE_PUZZLES = Object.freeze({
  memoryRings: Object.freeze({
    id: 'grove-memory-rings',
    name: 'grove memory rings in growth order',
    locationId: CHAPTER_THREE_LOCATIONS.resinChapel.id,
  }),
  waterStones: Object.freeze({
    id: 'three-water-stones',
    name: 'three water stones balanced between preservation, evacuation, and access',
    locationId: CHAPTER_THREE_LOCATIONS.thirstingRun.id,
  }),
})

export const CHAPTER_THREE_GROVE_STATES = Object.freeze([
  'healing',
  'quarantined',
  'burned',
  'drained',
  'bonded-to-player',
])

export const CHAPTER_THREE_MAJOR_BRANCHES = Object.freeze({
  heal: 'heal the grove and keep the surviving roots connected',
  quarantine: 'quarantine the grove so the corruption cannot spread',
  controlledBurn: 'perform a controlled burn that costs trust but weakens the network',
  redirectSiphon: 'redirect the siphon and keep a traceable line into the enemy',
  leaveWarningsUnheeded: "leave Kip's warnings unheeded and let the Nightly Draw finish its work",
})

export const CHAPTER_THREE_REWARDS = Object.freeze({
  corlasLastSeed: "Corla's Last Seed",
  greyBarkShard: 'Grey Bark Shard',
  livingRootMap: 'Living Root Map',
})

export const CHAPTER_THREE_REWARD_EFFECT_GROUPS = Object.freeze({
  [CHAPTER_THREE_REWARDS.corlasLastSeed]: 'mood',
  [CHAPTER_THREE_REWARDS.greyBarkShard]: 'mind',
  [CHAPTER_THREE_REWARDS.livingRootMap]: 'mind',
})

export const CHAPTER_THREE_CORE_BEATS = Object.freeze([
  'discover that the apparent cure only borrows growth from one tree to another',
  'read the grove memory rings in growth order',
  'balance the three water stones between preservation, evacuation, and access',
  'learn and use the Withering Stalker blind spots',
  'rescue the Sleeping Nursery',
  'reach the Siphon Well before the Nightly Draw',
  'decide what happens to the grove and the siphon',
])

export const CHAPTER_THREE_SCENE_DEFINITIONS = Object.freeze({
  grayVerge: Object.freeze({
    id: 'chapter-3:gray-verge',
    locationId: CHAPTER_THREE_LOCATIONS.grayVerge.id,
    dangerTier: 'bloom',
    purpose: 'Establish the dying grove, meet Bramblekin, Corla, and Kip, and expose the false cure.',
    tensionLevel: 'rising',
    snapshotEligible: true,
    characters: Object.freeze(['Bramblekin', 'Corla the Forager', 'Kip']),
    objects: Object.freeze(['living patch', 'gray roots']),
  }),
  memoryRings: Object.freeze({
    id: 'chapter-3:memory-rings',
    locationId: CHAPTER_THREE_LOCATIONS.resinChapel.id,
    dangerTier: 'bloom',
    purpose: 'Read the grove memory rings in growth order and recover the Nightly Draw schedule.',
    tensionLevel: 'investigation',
    snapshotEligible: true,
    characters: Object.freeze(['Bramblekin']),
    objects: Object.freeze(['memory rings', 'resin chapel']),
  }),
  waterStones: Object.freeze({
    id: 'chapter-3:water-stones',
    locationId: CHAPTER_THREE_LOCATIONS.thirstingRun.id,
    dangerTier: 'harvest',
    purpose: 'Balance preservation, evacuation, and access with the three water stones.',
    tensionLevel: 'rising',
    snapshotEligible: true,
    characters: Object.freeze(['Corla the Forager', 'Kip']),
    objects: Object.freeze(['three water stones', 'thirsting channels']),
  }),
  stalkerTrail: Object.freeze({
    id: 'chapter-3:stalker-trail',
    locationId: CHAPTER_THREE_LOCATIONS.thirstingRun.id,
    dangerTier: 'harvest',
    purpose: "Observe and exploit the Withering Stalker's blind spots before crossing to the nursery.",
    tensionLevel: 'high',
    snapshotEligible: true,
    characters: Object.freeze(['Withering Stalker']),
    objects: Object.freeze(['dead-root cover', 'resin-bright trunks']),
  }),
  sleepingNursery: Object.freeze({
    id: 'chapter-3:sleeping-nursery',
    locationId: CHAPTER_THREE_LOCATIONS.sleepingNursery.id,
    dangerTier: 'harvest',
    purpose: 'Rescue the sleeping nursery from Root Leeches and the failing root network.',
    tensionLevel: 'high',
    snapshotEligible: true,
    characters: Object.freeze(['Kip', 'Root Leeches']),
    objects: Object.freeze(['sleeping root-beds', 'evacuation channel']),
  }),
  siphonWell: Object.freeze({
    id: 'chapter-3:siphon-well',
    locationId: CHAPTER_THREE_LOCATIONS.siphonWell.id,
    dangerTier: 'harvest',
    purpose: 'Reach the siphon, understand the conduit network, and prepare before the Nightly Draw.',
    tensionLevel: 'high',
    snapshotEligible: true,
    characters: Object.freeze(['Bramblekin', 'Corla the Forager']),
    objects: Object.freeze(['siphon conduits', 'black-root well']),
  }),
  nightlyDraw: Object.freeze({
    id: 'chapter-3:nightly-draw',
    locationId: CHAPTER_THREE_LOCATIONS.siphonWell.id,
    dangerTier: 'wither',
    purpose: 'Survive the Nightly Draw when every active conduit pulls at once.',
    tensionLevel: 'peak',
    snapshotEligible: true,
    characters: Object.freeze(['Bramblekin']),
    objects: Object.freeze(['active conduits', 'siphon well']),
  }),
  groveDecision: Object.freeze({
    id: 'chapter-3:grove-decision',
    locationId: CHAPTER_THREE_LOCATIONS.siphonWell.id,
    dangerTier: 'harvest',
    purpose: 'Choose the persistent fate of the grove and the Cultivator conduit.',
    tensionLevel: 'decision',
    snapshotEligible: true,
    characters: Object.freeze(['Bramblekin', 'Corla the Forager', 'Kip']),
    objects: Object.freeze(['siphon conduits', 'living seed']),
  }),
  ending: Object.freeze({
    id: 'chapter-3:ending',
    locationId: CHAPTER_THREE_LOCATIONS.siphonWell.id,
    dangerTier: 'sprout',
    purpose: 'Carry the remembered grove consequence and Living Root Map toward the Sunken Greenhouse.',
    tensionLevel: 'release',
    snapshotEligible: true,
    characters: Object.freeze(['Bramblekin']),
    objects: Object.freeze(['Living Root Map']),
  }),
})
