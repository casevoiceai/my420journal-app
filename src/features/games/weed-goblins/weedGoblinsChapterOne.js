export const CHAPTER_ONE_NPCS = Object.freeze({
  goblinKing: Object.freeze({
    id: 'goblin-king',
    name: 'Goblin King',
    role: 'Theatrical ruler of the Highlands who is more frightened than he admits.',
  }),
  nib: Object.freeze({
    id: 'nib',
    name: 'Nib',
    role: 'Young scout who wants a promotion and does not want anyone hurt.',
  }),
  grubbin: Object.freeze({
    id: 'grubbin',
    name: 'Grubbin',
    role: 'Stash keeper who resents the King for sending the best goods away as tribute.',
  }),
  oldTatter: Object.freeze({
    id: 'old-tatter',
    name: 'Old Tatter',
    role: 'Retired raider who recognizes the black-root seal.',
  }),
})

export const CHAPTER_ONE_NPC_LIST = Object.freeze(Object.values(CHAPTER_ONE_NPCS))

export const CHAPTER_ONE_PUZZLES = Object.freeze({
  rattlebridgeAlarmLines: Object.freeze({
    id: 'rattlebridge-alarm-lines',
    name: 'Rattlebridge alarm lines',
    roomId: 'rattlebridge',
  }),
  pictureTributeLedger: Object.freeze({
    id: 'picture-tribute-ledger',
    name: 'picture tribute ledger',
    roomId: 'highland-camp',
  }),
  carvedFaceStashLatch: Object.freeze({
    id: 'carved-face-stash-latch',
    name: 'carved-face stash latch',
    roomId: 'kings-stash-hall',
  }),
})

export const CHAPTER_ONE_REWARDS = Object.freeze({
  blackRootSeal: 'black-root seal',
  goblinFavor: 'goblin favor',
  highlandCharm: 'highland charm',
})

export const CHAPTER_ONE_BRANCH_VALUES = Object.freeze({
  nibTreatment: Object.freeze(['safe', 'bait', 'ignored']),
  tributeArrangement: Object.freeze(['exposed', 'protected', 'unknown']),
  kingTreatment: Object.freeze(['spared', 'humiliated', 'unresolved']),
  stolenItemCondition: Object.freeze(['intact', 'altered', 'not-recovered']),
})
