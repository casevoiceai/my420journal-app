import { CHAPTER_ONE_ROOMS, getWeedGoblinsRoomVisit } from './weedGoblinsRooms.js'

function freezeAction(action) {
  return action ? Object.freeze({ ...action }) : null
}

function discoverable({ id, title, terms, body, action = null }) {
  return Object.freeze({ id, title, terms: Object.freeze([...terms]), body, action: freezeAction(action) })
}

const WINDCUT_DISCOVERABLES = Object.freeze([
  discoverable({
    id: 'windcut:goblin-footprint', title: 'Fresh Goblin Footprint',
    terms: ['fresh goblin footprint', 'goblin footprint'],
    body: 'The print is fresh, deep, and headed into the Highlands. It is the first physical sign that the theft has a trail you can follow.',
    action: { kind: 'free-text', label: 'Inspect the footprint', playerAction: 'Look closely at the fresh goblin footprint' },
  }),
])

const RATTLEBRIDGE_DISCOVERABLES = Object.freeze([
  discoverable({ id: 'rattlebridge:bridge', title: 'Rattlebridge', terms: ['Rattlebridge'], body: 'A narrow crossing rigged with improvised alarm lines. Quiet and direct approaches create different risks.' }),
  discoverable({
    id: 'rattlebridge:alarm-lines', title: 'Bottle-Cap Alarm Lines', terms: ['bottle-cap alarm lines', 'bottle cap alarms', 'alarm lines'],
    body: 'Thin lines run through the crossing and into bottle-cap alarms. The mechanism is simple. The goblins are still extremely proud of it.',
    action: { kind: 'free-text', label: 'Inspect the alarm lines', playerAction: 'Look closely at the bottle-cap alarm lines on Rattlebridge' },
  }),
])

const CLOUDBERRY_DISCOVERABLES = Object.freeze([
  discoverable({ id: 'cloudberry:nib', title: 'Nib', terms: ['Nib'], body: 'A young goblin scout who wants a promotion and would prefer nobody get hurt while earning it.', action: { kind: 'engine', id: 'midpoint:help', label: 'Keep Nib safe' } }),
  discoverable({ id: 'cloudberry:tripwire', title: 'Snapped Tripwire', terms: ['snapped tripwire', 'tripwire'], body: 'The line is tangled rather than mysterious. Nib is trying to fix it before a patrol notices.', action: { kind: 'free-text', label: 'Examine the tripwire', playerAction: 'Look closely at the snapped tripwire' } }),
  discoverable({ id: 'cloudberry:highland-charm', title: 'Highland Charm', terms: ['highland charm'], body: 'A small local charm hanging beside a judgmental bell. It looks shaped for something more specific than decoration.', action: { kind: 'engine', id: 'midpoint:take-charm', label: 'Take the highland charm' } }),
  discoverable({ id: 'cloudberry:trail-runes', title: 'Old Trail-Runes', terms: ['old trail-runes', 'trail-runes', 'runes'], body: 'Old markings at Cloudberry Shelf describe the Stash Hall approach in more detail than anyone needed.', action: { kind: 'engine', id: 'midpoint:read-runes', label: 'Read the trail-runes' } }),
])

const HIGHLAND_CAMP_DISCOVERABLES = Object.freeze([
  discoverable({ id: 'camp:grubbin', title: 'Grubbin', terms: ['Grubbin'], body: 'The stash keeper. He knows where the best goods go and resents the King for sending them away as tribute.', action: { kind: 'engine', id: 'camp:question-grubbin', label: 'Question Grubbin' } }),
  discoverable({ id: 'camp:old-tatter', title: 'Old Tatter', terms: ['Old Tatter'], body: 'A retired raider who has seen enough goblin schemes to recognize the black-root seal on sight.', action: { kind: 'engine', id: 'camp:ask-old-tatter', label: 'Ask Old Tatter about the seal' } }),
  discoverable({ id: 'camp:picture-ledger', title: 'Picture Tribute Ledger', terms: ['picture tribute ledger', 'picture ledger', 'tribute ledger'], body: 'A ledger built from pictures, arrows, crate marks, and the assumption that nobody will ask why the best goods keep leaving camp.', action: { kind: 'free-text', label: 'Study the ledger', playerAction: 'Study the picture tribute ledger and work out where the tribute goes' } }),
  discoverable({ id: 'camp:black-root-seal', title: 'Black-Root Seal', terms: ['black-root seal'], body: 'A tribute mark tied to shipments leaving the Highlands. Old Tatter recognizes it as something older and larger than the King’s operation.' }),
])

const STASH_HALL_DISCOVERABLES = Object.freeze([
  discoverable({ id: 'stash-hall:latch', title: 'Carved-Face Stash Latch', terms: ['carved-face latch', 'carved face latch', 'carved faces', 'stash latch'], body: 'Four rotating goblin faces control the Stash Hall door. Their expressions appear to be an actual locking system.', action: { kind: 'free-text', label: 'Inspect the carved faces', playerAction: 'Inspect the carved faces on the Stash Hall latch' } }),
  discoverable({ id: 'stash-hall:king', title: 'The Goblin King', terms: ['Goblin King'], body: 'Loud, theatrical, and much more frightened by the tribute system around him than he wants you to notice.' }),
  discoverable({ id: 'stash-hall:black-root-seal', title: 'Black-Root Seal', terms: ['black-root seal'], body: 'The same mark appears on tribute crates connected to something beyond the Goblin King. It points toward the larger collection network.', action: { kind: 'free-text', label: 'Inspect the seal', playerAction: 'Look closely at the black-root seal on the tribute crates' } }),
])

function hasVisited(state, roomId) {
  return getWeedGoblinsRoomVisit(state, roomId)?.visited === true
}

function stolenItemDiscoverable(state) {
  const stolenItem = typeof state?.stolenItem === 'string' ? state.stolenItem.trim() : ''
  if (!stolenItem) return null
  return discoverable({ id: 'stash-hall:stolen-item', title: 'Your Stolen Item', terms: [stolenItem], body: 'This is the item that brought you into the Highlands. Recovering it, bargaining for it, or escaping without it determines how this run closes.' })
}

export function getWeedGoblinsDiscoverables(state) {
  if (!state) return Object.freeze([])
  const items = []
  if (hasVisited(state, CHAPTER_ONE_ROOMS.windcutTrail.id)) items.push(...WINDCUT_DISCOVERABLES)
  if (state.sceneId === 'choose-route' || hasVisited(state, CHAPTER_ONE_ROOMS.rattlebridge.id)) items.push(...RATTLEBRIDGE_DISCOVERABLES)
  if (hasVisited(state, CHAPTER_ONE_ROOMS.cloudberryShelf.id)) items.push(...CLOUDBERRY_DISCOVERABLES)
  if (hasVisited(state, CHAPTER_ONE_ROOMS.highlandCamp.id)) items.push(...HIGHLAND_CAMP_DISCOVERABLES)
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
      matches.push(Object.freeze({ start, end, text: match[0], discoverable: candidate.item }))
    }
  }
  return Object.freeze(matches.sort((left, right) => left.start - right.start))
}
