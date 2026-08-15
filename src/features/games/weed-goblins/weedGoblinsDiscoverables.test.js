import test from 'node:test'
import assert from 'node:assert/strict'

import { advanceWeedGoblinsRun, advanceWeedGoblinsSessionText, createWeedGoblinsRun } from './weedGoblinsEngine.js'
import { findWeedGoblinsDiscoverableMatches, getWeedGoblinsDiscoverables } from './weedGoblinsDiscoverables.js'

function stateAtRoute(seed = 'discoverables') {
  let state = createWeedGoblinsRun({ seed })
  state = advanceWeedGoblinsRun(state, 'session:continue')
  state = advanceWeedGoblinsSessionText(state, 'Sable Underhollow')
  state = advanceWeedGoblinsRun(state, 'session:race:human')
  state = advanceWeedGoblinsRun(state, 'session:weapon:sword')
  state = advanceWeedGoblinsRun(state, 'background:tracker')
  state = advanceWeedGoblinsRun(state, 'session:pronoun:they')
  return advanceWeedGoblinsRun(state, 'session:look:tall-weathered')
}

function stateAtMidpoint() {
  for (let index = 0; index < 200; index += 1) {
    let state = stateAtRoute(`discoverable-midpoint-${index}`)
    state = advanceWeedGoblinsRun(state, 'route:quiet')
    if (state.status !== 'active') continue
    state = advanceWeedGoblinsRun(state, 'goblin:guard')
    if (state.status === 'active' && state.sceneId === 'midpoint') return state
  }
  throw new Error('Could not find active midpoint seed.')
}

test('Windcut Trail and Rattlebridge expose their canonical clues', () => {
  const opening = createWeedGoblinsRun({ seed: 'discoverable-opening' })
  assert.ok(getWeedGoblinsDiscoverables(opening).some((item) => item.id === 'windcut:goblin-footprint'))
  const route = stateAtRoute('discoverable-route')
  assert.ok(getWeedGoblinsDiscoverables(route).some((item) => item.id === 'rattlebridge:alarm-lines'))
})

test('Cloudberry Shelf exposes Nib, tripwire, highland charm, and runes', () => {
  const ids = getWeedGoblinsDiscoverables(stateAtMidpoint()).map((item) => item.id)
  for (const id of ['cloudberry:nib', 'cloudberry:tripwire', 'cloudberry:highland-charm', 'cloudberry:trail-runes']) assert.ok(ids.includes(id), id)
})

test('Highland Camp exposes Grubbin, Old Tatter, the picture ledger, and black-root seal', () => {
  const camp = advanceWeedGoblinsRun(stateAtMidpoint(), 'midpoint:skip')
  const ids = getWeedGoblinsDiscoverables(camp).map((item) => item.id)
  for (const id of ['camp:grubbin', 'camp:old-tatter', 'camp:picture-ledger', 'camp:black-root-seal']) assert.ok(ids.includes(id), id)
})

test('Stash Hall threshold exposes the carved-face latch and exact stolen item', () => {
  const camp = advanceWeedGoblinsRun(stateAtMidpoint(), 'midpoint:skip')
  const latch = advanceWeedGoblinsRun(camp, 'camp:ask-old-tatter')
  const ids = getWeedGoblinsDiscoverables(latch).map((item) => item.id)
  assert.ok(ids.includes('stash-hall:latch'))
  assert.ok(ids.includes('stash-hall:stolen-item'))
  const matches = findWeedGoblinsDiscoverableMatches(`Old Tatter points at the black-root seal beside the carved-face latch.`, latch)
  assert.ok(matches.some((match) => match.discoverable.id === 'camp:old-tatter'))
  assert.ok(matches.some((match) => match.discoverable.id === 'stash-hall:latch'))
})

test('matcher still chooses longest non-overlapping phrases', () => {
  const route = stateAtRoute('discoverable-longest')
  const matches = findWeedGoblinsDiscoverableMatches('The bottle-cap alarm lines on Rattlebridge shake once.', route)
  assert.equal(matches[0].text, 'bottle-cap alarm lines')
  assert.equal(matches[0].discoverable.id, 'rattlebridge:alarm-lines')
})
