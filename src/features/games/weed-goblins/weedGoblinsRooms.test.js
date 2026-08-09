import test from 'node:test'
import assert from 'node:assert/strict'

import { advanceWeedGoblinsRun, advanceWeedGoblinsSessionText, createWeedGoblinsRun, getAvailableActions } from './weedGoblinsEngine.js'
import { prepareWeedGoblinsChoiceTurn, resolveWeedGoblinsPreparedMechanics } from './weedGoblinsChatController.js'
import { CHAPTER_ONE_ROOM_LIST, CHAPTER_ONE_ROOMS, getCurrentWeedGoblinsRoom, getWeedGoblinsRoomVisit } from './weedGoblinsRooms.js'

function stateAtRoute(seed = 'room-system') {
  let state = createWeedGoblinsRun({ seed })
  state = advanceWeedGoblinsRun(state, 'session:continue')
  state = advanceWeedGoblinsSessionText(state, 'Fenna Duskrow')
  state = advanceWeedGoblinsRun(state, 'session:race:human')
  state = advanceWeedGoblinsRun(state, 'session:weapon:sword')
  state = advanceWeedGoblinsRun(state, 'background:tracker')
  state = advanceWeedGoblinsRun(state, 'session:pronoun:they')
  state = advanceWeedGoblinsRun(state, 'session:look:tall-weathered')
  return state
}

function stateAfterGoblin() {
  for (let index = 0; index < 200; index += 1) {
    let state = stateAtRoute(`room-goblin-${index}`)
    state = advanceWeedGoblinsRun(state, 'route:quiet')
    if (state.status !== 'active') continue
    state = advanceWeedGoblinsRun(state, 'goblin:guard')
    if (state.status === 'active' && state.sceneId === 'midpoint') return state
  }
  throw new Error('Could not find a deterministic active midpoint seed.')
}

test('Chapter 1 room registry contains the five canonical locations in order', () => {
  assert.deepEqual(CHAPTER_ONE_ROOM_LIST.map((room) => room.name), ['Windcut Trail', 'Rattlebridge', 'Cloudberry Shelf', 'Highland Camp', "King's Stash Hall"])
})

test('a new run begins at Windcut Trail and only that room is visited', () => {
  const state = createWeedGoblinsRun({ seed: 'room-start' })
  assert.equal(state.currentRoomId, CHAPTER_ONE_ROOMS.windcutTrail.id)
  assert.equal(getCurrentWeedGoblinsRoom(state)?.name, 'Windcut Trail')
  assert.equal(getWeedGoblinsRoomVisit(state, CHAPTER_ONE_ROOMS.windcutTrail.id)?.visitCount, 1)
  assert.equal(getWeedGoblinsRoomVisit(state, CHAPTER_ONE_ROOMS.rattlebridge.id)?.visited, false)
  assert.equal(getWeedGoblinsRoomVisit(state, CHAPTER_ONE_ROOMS.highlandCamp.id)?.visited, false)
})

test('Rattlebridge is entered only after the explicit crossing roll resolves', () => {
  const state = stateAtRoute('room-rattlebridge')
  const action = getAvailableActions(state).find((candidate) => candidate.id === 'route:quiet')
  const prepared = prepareWeedGoblinsChoiceTurn({ state, action })
  assert.equal(getWeedGoblinsRoomVisit(prepared.before, CHAPTER_ONE_ROOMS.rattlebridge.id)?.visited, false)
  const mechanics = resolveWeedGoblinsPreparedMechanics({ preparedTurn: prepared })
  assert.equal(mechanics.after.currentRoomId, CHAPTER_ONE_ROOMS.rattlebridge.id)
})

test('the expanded Chapter 1 path visits Cloudberry Shelf, Highland Camp, then the Stash Hall', () => {
  const midpoint = stateAfterGoblin()
  assert.equal(midpoint.currentRoomId, CHAPTER_ONE_ROOMS.cloudberryShelf.id)
  const camp = advanceWeedGoblinsRun(midpoint, 'midpoint:skip')
  assert.equal(camp.sceneId, 'highland-camp')
  assert.equal(camp.currentRoomId, CHAPTER_ONE_ROOMS.highlandCamp.id)
  const latch = advanceWeedGoblinsRun(camp, 'camp:ask-old-tatter')
  assert.equal(latch.sceneId, 'stash-latch')
  assert.equal(latch.currentRoomId, CHAPTER_ONE_ROOMS.kingsStashHall.id)
  const boss = advanceWeedGoblinsRun(latch, 'latch:read-face')
  if (boss.status === 'active') assert.equal(boss.sceneId, 'goblin-king')
  assert.equal(getWeedGoblinsRoomVisit(latch, CHAPTER_ONE_ROOMS.highlandCamp.id)?.visited, true)
  assert.equal(getWeedGoblinsRoomVisit(latch, CHAPTER_ONE_ROOMS.kingsStashHall.id)?.visited, true)
})
