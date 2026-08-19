import {
  BACKGROUNDS,
  HIGHLAND_SNEAK,
  POSITIONS,
  ROUTES,
  WEED_GOBLINS_V2_VERSION,
  backgroundById,
  clampTrouble,
  raceById,
  weaponById,
} from './weedGoblinsV2Rules.js'

export const V2_SCENES = Object.freeze({
  windcut: 'windcut-trail',
  identity: 'identity',
  weapon: 'weapon',
  background: 'background',
  highRouteCheck: 'high-route-check',
  rattlebridge: 'rattlebridge',
  combat: 'rattlebridge-combat',
  cloudberry: 'cloudberry-shelf',
})

function nowIso(now = Date.now) {
  return new Date(now()).toISOString()
}

function cleanText(value, max = 160) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, max)
}

function eventId(state, prefix = 'event') {
  return `${prefix}:${state.ledger.length + 1}`
}

function withEvent(state, event) {
  return {
    ...state,
    ledger: [
      ...state.ledger,
      Object.freeze({
        id: event.id || eventId(state),
        sequence: state.ledger.length + 1,
        ...event,
      }),
    ],
  }
}

export function createWeedGoblinsV2State({
  campaignId = `weed-goblins-v2:${Date.now()}`,
  createdAt = new Date().toISOString(),
} = {}) {
  return {
    version: WEED_GOBLINS_V2_VERSION,
    campaignId,
    createdAt,
    updatedAt: createdAt,
    status: 'active',
    chapter: 1,
    level: 1,
    sceneId: V2_SCENES.windcut,
    currentLocation: 'Windcut Trail',
    route: null,
    trouble: 0,
    timePressure: 'normal',
    stealth: 'unknown',
    alarm: 'quiet',
    campAwareness: 'unaware',
    player: {
      name: null,
      raceId: null,
      weaponId: null,
      backgroundId: null,
      strength: 0,
      defense: 0,
      guard: 10,
      hp: 0,
      maxHp: 0,
      mana: 0,
      maxMana: 0,
      magicalSkill: 0,
      wound: 'None',
      injuryDetail: null,
      conditions: [],
    },
    inventory: {
      equippedWeaponId: null,
      weaponCondition: 'Good',
      protectiveGear: null,
      protectiveGearCondition: 'Good',
      pack: [],
      storyItems: [],
      rootcoin: 0,
    },
    discoveries: [],
    threads: [
      {
        id: 'recover-stash',
        label: 'Recover the stolen stash',
        status: 'current',
      },
    ],
    relationships: {},
    factions: {},
    map: {
      knownLocations: ['Windcut Trail'],
      knownRoutes: [],
    },
    world: {
      bridge: {
        alarm: 'quiet',
        alarmCondition: 'working',
      },
      sneak: {
        id: HIGHLAND_SNEAK.id,
        hp: HIGHLAND_SNEAK.maxHp,
        maxHp: HIGHLAND_SNEAK.maxHp,
        position: POSITIONS.near,
        morale: 'Confident',
        awareness: 'unaware',
        status: 'active',
        reportProcess: null,
      },
    },
    combat: null,
    pendingResolution: null,
    history: [],
    ledger: [],
  }
}

export function appendHistory(state, entry) {
  const next = {
    ...state,
    history: [
      ...state.history,
      {
        id: entry.id || `history:${state.history.length + 1}`,
        type: entry.type || 'narration',
        ...entry,
      },
    ],
  }
  return next
}

export function chooseOpeningRoute(state, routeId, { now = Date.now } = {}) {
  if (state.sceneId !== V2_SCENES.windcut) throw new Error('Opening route is not available now.')
  const route = ROUTES[routeId]
  if (!route) throw new Error(`Unknown route: ${routeId}`)

  let next = {
    ...state,
    sceneId: V2_SCENES.identity,
    route: route.id,
    timePressure: route.timePressure,
    updatedAt: nowIso(now),
    map: {
      ...state.map,
      knownRoutes: [...new Set([...state.map.knownRoutes, route.id])],
    },
  }

  if (route.id === 'investigate') {
    next = {
      ...next,
      discoveries: [
        ...next.discoveries,
        { id: 'targeted-theft', label: 'The goblins watched the campsite before the theft.', certainty: 'confirmed' },
        { id: 'crooked-root-mark', label: 'A crooked-root symbol appears on goblin gear and tracks.', certainty: 'confirmed' },
        { id: 'lookout-position', label: 'One thief used a lookout perch above the trail.', certainty: 'confirmed' },
      ],
      inventory: {
        ...next.inventory,
        storyItems: [...next.inventory.storyItems, 'Bent brass clasp with crooked-root mark'],
      },
    }
  }

  return withEvent(next, {
    id: eventId(state, 'choice'),
    type: 'choice',
    actionId: `route:${route.id}`,
    irreversible: true,
  })
}

export function establishIdentity(state, { name, raceId }, { now = Date.now } = {}) {
  if (state.sceneId !== V2_SCENES.identity) throw new Error('Identity is not available now.')
  const playerName = cleanText(name, 80)
  const race = raceById(raceId)
  if (playerName.length < 1) throw new Error('Character name is required.')
  if (!race) throw new Error('A valid race is required.')

  let next = {
    ...state,
    sceneId: V2_SCENES.weapon,
    updatedAt: nowIso(now),
    player: {
      ...state.player,
      name: playerName,
      raceId: race.id,
    },
  }

  if (state.route === 'investigate' && race.id === 'elf') {
    next = {
      ...next,
      discoveries: [
        ...next.discoveries,
        { id: 'brass-clasp-detail', label: 'The bent clasp carries the same crooked-root mark.', certainty: 'confirmed' },
      ],
    }
  }

  return withEvent(next, {
    id: eventId(state, 'identity'),
    type: 'identity',
    playerName,
    raceId: race.id,
    irreversible: true,
  })
}

export function chooseWeapon(state, weaponId, { now = Date.now } = {}) {
  if (state.sceneId !== V2_SCENES.weapon) throw new Error('Weapon selection is not available now.')
  const weapon = weaponById(weaponId)
  if (!weapon) throw new Error('A valid weapon is required.')

  const next = {
    ...state,
    sceneId: V2_SCENES.background,
    updatedAt: nowIso(now),
    player: {
      ...state.player,
      weaponId: weapon.id,
    },
    inventory: {
      ...state.inventory,
      equippedWeaponId: weapon.id,
    },
  }

  return withEvent(next, {
    id: eventId(state, 'weapon'),
    type: 'equipment-choice',
    weaponId: weapon.id,
    irreversible: true,
  })
}

export function chooseBackground(state, backgroundId, { now = Date.now } = {}) {
  if (state.sceneId !== V2_SCENES.background) throw new Error('Background selection is not available now.')
  const background = backgroundById(backgroundId)
  if (!background) throw new Error('A valid background is required.')

  const nextScene = state.route === 'high' ? V2_SCENES.highRouteCheck : V2_SCENES.rattlebridge
  const route = ROUTES[state.route]
  const position = state.route === 'high' ? POSITIONS.elevated : POSITIONS.mainApproach
  const alarm = route?.startingAlarm || 'quiet'

  const next = {
    ...state,
    sceneId: nextScene,
    currentLocation: nextScene === V2_SCENES.rattlebridge ? 'Rattlebridge' : 'High Trail',
    alarm,
    stealth: route?.startingStealth || 'suspicious',
    updatedAt: nowIso(now),
    player: {
      ...state.player,
      backgroundId: background.id,
      strength: background.strength,
      defense: background.defense,
      guard: background.guard,
      hp: background.maxHp,
      maxHp: background.maxHp,
      mana: background.maxMana,
      maxMana: background.maxMana,
      magicalSkill: background.magicalSkill || 0,
    },
    world: {
      ...state.world,
      bridge: {
        ...state.world.bridge,
        alarm,
      },
      sneak: {
        ...state.world.sneak,
        awareness: route?.startingStealth === 'spotted' ? 'aware' : 'unaware',
        position,
      },
    },
    map: {
      ...state.map,
      knownLocations: [...new Set([...state.map.knownLocations, nextScene === V2_SCENES.rattlebridge ? 'Rattlebridge' : 'High Trail'])],
    },
  }

  return withEvent(next, {
    id: eventId(state, 'background'),
    type: 'background-choice',
    backgroundId: background.id,
    irreversible: true,
  })
}

export function updateSnapshot(state, patch, { now = Date.now } = {}) {
  return {
    ...state,
    ...patch,
    trouble: patch.trouble === undefined ? state.trouble : clampTrouble(patch.trouble),
    updatedAt: nowIso(now),
  }
}

export function enterRattlebridge(state, patch = {}, options = {}) {
  const next = updateSnapshot(state, {
    ...patch,
    sceneId: V2_SCENES.rattlebridge,
    currentLocation: 'Rattlebridge',
    map: {
      ...state.map,
      knownLocations: [...new Set([...state.map.knownLocations, 'Rattlebridge'])],
    },
  }, options)
  return next
}

export function reachCloudberryShelf(state, patch = {}, { now = Date.now } = {}) {
  let next = updateSnapshot(state, {
    ...patch,
    sceneId: V2_SCENES.cloudberry,
    currentLocation: 'Cloudberry Shelf',
    combat: null,
    pendingResolution: null,
    map: {
      ...state.map,
      knownLocations: [...new Set([...state.map.knownLocations, 'Cloudberry Shelf'])],
    },
  }, { now })

  next = withEvent(next, {
    id: eventId(next, 'milestone'),
    type: 'milestone',
    location: 'Cloudberry Shelf',
    irreversible: true,
  })
  return next
}

export function validateV2State(state) {
  if (!state || state.version !== WEED_GOBLINS_V2_VERSION) return false
  if (!state.campaignId || !Array.isArray(state.ledger) || !Array.isArray(state.history)) return false
  if (!state.player || !state.world?.bridge || !state.world?.sneak) return false
  if (!Object.values(V2_SCENES).includes(state.sceneId)) return false
  if (!['quiet', 'threatened', 'raised', 'disabled'].includes(state.alarm)) return false
  if (!BACKGROUNDS[state.player.backgroundId] && state.player.backgroundId !== null) return false
  return true
}
