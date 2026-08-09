import { CHAPTER_ONE_ROOMS, getWeedGoblinsRoomVisit } from './weedGoblinsRooms.js'

function freezeAction(action) {
  return action ? Object.freeze({ ...action }) : null
}

function discoverable({ id, title, terms, body, action = null }) {
  return Object.freeze({
    id,
    title,
    terms: Object.freeze([...terms]),
    body,
    action: freezeAction(action),
  })
}

const WINDCUT_DISCOVERABLES = Object.freeze([
  discoverable({
    id: 'windcut:goblin-footprint',
    title: 'Fresh Goblin Footprint',
    terms: ['fresh goblin footprint', 'goblin footprint'],
    body: 'The print is fresh, deep, and headed into the Highlands. It is the first physical sign that the theft has a trail you can actually follow.',
    action: {
      kind: 'free-text',
      label: 'Inspect the footprint',
      playerAction: 'Look closely at the fresh goblin footprint',
    },
  }),
])

const RATTLEBRIDGE_DISCOVERABLES = Object.freeze([
  discoverable({
    id: 'rattlebridge:bridge',
    title: 'Rattlebridge',
    terms: ['Rattlebridge'],
    body: 'A narrow crossing rigged so movement can wake a collection of improvised alarms. Quiet and direct approaches both work, but they create different risks.',
  }),
  discoverable({
    id: 'rattlebridge:alarm-lines',
    title: 'Bottle-Cap Alarm Lines',
    terms: ['bottle-cap alarm lines', 'bottle cap alarms', 'alarm lines'],
    body: 'Thin lines run through the crossing and into small bottle-cap alarms. They are simple enough to understand at a glance, which does not make them less annoying.',
    action: {
      kind: 'free-text',
      label: 'Inspect the alarm lines',
      playerAction: 'Look closely at the bottle-cap alarm lines on Rattlebridge',
    },
  }),
])

const CLOUDBERRY_DISCOVERABLES = Object.freeze([
  discoverable({
    id: 'cloudberry:nib',
    title: 'Nib',
    terms: ['Nib'],
    body: 'A young goblin scout who wants a promotion and, inconveniently for goblin tradition, would prefer nobody get hurt while earning it.',
    action: {
      kind: 'engine',
      id: 'midpoint:help',
      label: 'Help Nib with the tripwire',
    },
  }),
  discoverable({
    id: 'cloudberry:tripwire',
    title: 'Snapped Tripwire',
    terms: ['snapped tripwire', 'tripwire'],
    body: 'The line is tangled rather than mysterious. Fixing or bypassing it is more a question of approach than secret knowledge.',
    action: {
      kind: 'free-text',
      label: 'Examine the tripwire',
      playerAction: 'Look closely at the snapped tripwire',
    },
  }),
  discoverable({
    id: 'cloudberry:tribute-token',
    title: 'Tribute Token',
    terms: ['tribute token'],
    body: 'An unattended token tied to the goblins’ tribute system. Taking it may create leverage later, provided the nearby bell does not decide to become involved.',
    action: {
      kind: 'engine',
      id: 'midpoint:take-token',
      label: 'Take the tribute token',
    },
  }),
  discoverable({
    id: 'cloudberry:trail-runes',
    title: 'Old Trail-Runes',
    terms: ['old trail-runes', 'trail-runes', 'runes'],
    body: 'Old markings at Cloudberry Shelf describe the way ahead in more detail than anybody strictly needed. Reading them can change how difficult the Stash Hall approach becomes.',
    action: {
      kind: 'engine',
      id: 'midpoint:read-runes',
      label: 'Read the trail-runes',
    },
  }),
])

const STASH_HALL_DISCOVERABLES = Object.freeze([
  discoverable({
    id: 'stash-hall:king',
    title: 'The Goblin King',
    terms: ['Goblin King'],
    body: 'Loud, theatrical, and much more frightened by the tribute system around him than he wants you to notice.',
  }),
  discoverable({
    id: 'stash-hall:black-root-seal',
    title: 'Black-Root Seal',
    terms: ['black-root seal'],
    body: 'The same mark appears on tribute crates connected to something beyond the Goblin King. It is a breadcrumb toward the larger collection network.',
    action: {
      kind: 'free-text',
      label: 'Inspect the seal',
      playerAction: 'Look closely at the black-root seal on the tribute crates',
    },
  }),
])

function hasVisited(state, roomId) {
  return getWeedGoblinsRoomVisit(state, roomId)?.visited === true
}

function stolenItemDiscoverable(state) {
  const stolenItem = typeof state?.stolenItem === 'string' ? state.stolenItem.trim() : ''
  if (!stolenItem) return null
  return discoverable({
    id: 'stash-hall:stolen-item',
    title: 'Your Stolen Item',
    terms: [stolenItem],
    body: 'This is the item that brought you into the Highlands. Recovering it, bargaining for it, or escaping without it determines how this run closes.',
  })
}

export function getWeedGoblinsDiscoverables(state) {
  if (!state) return Object.freeze([])
  const items = []

  if (hasVisited(state, CHAPTER_ONE_ROOMS.windcutTrail.id)) {
    items.push(...WINDCUT_DISCOVERABLES)
  }
  if (
    state.sceneId === 'choose-route'
    || hasVisited(state, CHAPTER_ONE_ROOMS.rattlebridge.id)
  ) {
    items.push(...RATTLEBRIDGE_DISCOVERABLES)
  }
  if (hasVisited(state, CHAPTER_ONE_ROOMS.cloudberryShelf.id)) {
    items.push(...CLOUDBERRY_DISCOVERABLES)
  }
  if (hasVisited(state, CHAPTER_ONE_ROOMS.kingsStashHall.id)) {
    items.push(...STASH_HALL_DISCOVERABLES)
    const stolenItem = stolenItemDiscoverable(state)
    if (stolenItem) items.push(stolenItem)
  }

  return Object.freeze(items)
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function findWeedGoblinsDiscoverableMatches(text, state) {
  const source = typeof text === 'string' ? text : ''
  if (!source) return Object.freeze([])

  const candidates = getWeedGoblinsDiscoverables(state)
    .flatMap((item) => item.terms.map((term) => ({ item, term })))
    .filter(({ term }) => term)
    .sort((left, right) => right.term.length - left.term.length)

  const claimed = new Array(source.length).fill(false)
  const matches = []

  for (const candidate of candidates) {
    const pattern = new RegExp(escapeRegExp(candidate.term), 'gi')
    for (const match of source.matchAll(pattern)) {
      const start = match.index ?? -1
      const end = start + match[0].length
      if (start < 0 || claimed.slice(start, end).some(Boolean)) continue
      for (let index = start; index < end; index += 1) claimed[index] = true
      matches.push(Object.freeze({
        start,
        end,
        text: match[0],
        discoverable: candidate.item,
      }))
    }
  }

  return Object.freeze(matches.sort((left, right) => left.start - right.start))
}
