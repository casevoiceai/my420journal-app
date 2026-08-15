export const CHAPTER_ONE_ROOMS = Object.freeze({
  windcutTrail: Object.freeze({
    id: 'windcut-trail',
    name: 'Windcut Trail',
    chapterId: 'chapter-1',
    chapterNumber: 1,
  }),
  rattlebridge: Object.freeze({
    id: 'rattlebridge',
    name: 'Rattlebridge',
    chapterId: 'chapter-1',
    chapterNumber: 1,
  }),
  cloudberryShelf: Object.freeze({
    id: 'cloudberry-shelf',
    name: 'Cloudberry Shelf',
    chapterId: 'chapter-1',
    chapterNumber: 1,
  }),
  highlandCamp: Object.freeze({
    id: 'highland-camp',
    name: 'Highland Camp',
    chapterId: 'chapter-1',
    chapterNumber: 1,
  }),
  kingsStashHall: Object.freeze({
    id: 'kings-stash-hall',
    name: "King's Stash Hall",
    chapterId: 'chapter-1',
    chapterNumber: 1,
  }),
})

export const CHAPTER_ONE_ROOM_LIST = Object.freeze([
  CHAPTER_ONE_ROOMS.windcutTrail,
  CHAPTER_ONE_ROOMS.rattlebridge,
  CHAPTER_ONE_ROOMS.cloudberryShelf,
  CHAPTER_ONE_ROOMS.highlandCamp,
  CHAPTER_ONE_ROOMS.kingsStashHall,
])

const ROOM_BY_ID = new Map(CHAPTER_ONE_ROOM_LIST.map((room) => [room.id, room]))

export function getWeedGoblinsRoom(roomId) {
  return ROOM_BY_ID.get(String(roomId ?? '')) || null
}

function emptyRoomVisit(room) {
  return Object.freeze({
    roomId: room.id,
    visited: false,
    visitCount: 0,
  })
}

export function createWeedGoblinsRoomState(
  initialRoomId = CHAPTER_ONE_ROOMS.windcutTrail.id,
) {
  const initialRoom = getWeedGoblinsRoom(initialRoomId)
  if (!initialRoom) throw new Error(`Unknown Weed Goblins room: ${initialRoomId}`)

  const entries = Object.fromEntries(
    CHAPTER_ONE_ROOM_LIST.map((room) => [room.id, emptyRoomVisit(room)]),
  )
  entries[initialRoom.id] = Object.freeze({
    roomId: initialRoom.id,
    visited: true,
    visitCount: 1,
  })
  return Object.freeze(entries)
}

export function visitWeedGoblinsRoom(roomState, roomId) {
  const room = getWeedGoblinsRoom(roomId)
  if (!room) throw new Error(`Unknown Weed Goblins room: ${roomId}`)

  const base = roomState && typeof roomState === 'object'
    ? roomState
    : createWeedGoblinsRoomState()
  const previous = base[room.id] || emptyRoomVisit(room)

  return Object.freeze({
    ...base,
    [room.id]: Object.freeze({
      roomId: room.id,
      visited: true,
      visitCount: Number(previous.visitCount || 0) + 1,
    }),
  })
}

export function getCurrentWeedGoblinsRoom(state) {
  return getWeedGoblinsRoom(state?.currentRoomId)
}

export function getWeedGoblinsRoomVisit(state, roomId) {
  const room = getWeedGoblinsRoom(roomId)
  if (!room) return null
  const visit = state?.roomState?.[room.id]
  return visit || Object.freeze({ roomId: room.id, visited: false, visitCount: 0 })
}
