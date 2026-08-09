import test from 'node:test'
import assert from 'node:assert/strict'

import {
  advanceWeedGoblinsRun,
  advanceWeedGoblinsSessionText,
  createWeedGoblinsRun,
} from './weedGoblinsEngine.js'
import {
  findWeedGoblinsDiscoverableMatches,
  getWeedGoblinsDiscoverables,
} from './weedGoblinsDiscoverables.js'

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
  for (let index = 0; index < 100; index += 1) {
    let state = stateAtRoute(`discoverable-midpoint-${index}`)
    state = advanceWeedGoblinsRun(state, 'route:quiet')
    if (state.status !== 'active') continue
    state = advanceWeedGoblinsRun(state, 'goblin:guard')
    if (state.status === 'active' && state.sceneId === 'midpoint') return state
  }
  throw new Error('Could not find active midpoint seed.')
}

test('Windcut Trail exposes the footprint and route scene exposes Rattlebridge clues', () => {
  const opening = createWeedGoblinsRun({ seed: 'discoverable-opening' })
  assert.ok(getWeedGoblinsDiscoverables(opening).some((item) => item.id === 'windcut:goblin-footprint'))
  assert.equal(getWeedGoblinsDiscoverables(opening).some((item) => item.id === 'rattlebridge:alarm-lines'), false)

  const route = stateAtRoute('discoverable-route')
  assert.ok(getWeedGoblinsDiscoverables(route).some((item) => item.id === 'rattlebridge:alarm-lines'))
})

test('matcher chooses the longest non-overlapping discoverable phrase', () => {
  const route = stateAtRoute('discoverable-longest')
  const matches = findWeedGoblinsDiscoverableMatches(
    'The bottle-cap alarm lines on Rattlebridge shake once.',
    route,
  )

  assert.equal(matches.length, 2)
  assert.equal(matches[0].text, 'bottle-cap alarm lines')
  assert.equal(matches[0].discoverable.id, 'rattlebridge:alarm-lines')
  assert.equal(matches[1].text, 'Rattlebridge')
})

test('Cloudberry Shelf exposes Nib, tripwire, tribute token, and runes', () => {
  const midpoint = stateAtMidpoint()
  const ids = getWeedGoblinsDiscoverables(midpoint).map((item) => item.id)

  assert.ok(ids.includes('cloudberry:nib'))
  assert.ok(ids.includes('cloudberry:tripwire'))
  assert.ok(ids.includes('cloudberry:tribute-token'))
  assert.ok(ids.includes('cloudberry:trail-runes'))
})

test('Stash Hall exposes the King, seal, and exact stolen item as discoverables', () => {
  const midpoint = stateAtMidpoint()
  const boss = advanceWeedGoblinsRun(midpoint, 'midpoint:skip')
  const ids = getWeedGoblinsDiscoverables(boss).map((item) => item.id)

  assert.ok(ids.includes('stash-hall:king'))
  assert.ok(ids.includes('stash-hall:black-root-seal'))
  assert.ok(ids.includes('stash-hall:stolen-item'))

  const matches = findWeedGoblinsDiscoverableMatches(
    `The Goblin King keeps ${boss.stolenItem} beside a black-root seal.`,
    boss,
  )
  assert.ok(matches.some((match) => match.discoverable.id === 'stash-hall:stolen-item'))
})

test('discoverable action metadata can expose engine or free-text follow-ups', () => {
  const midpoint = stateAtMidpoint()
  const byId = Object.fromEntries(getWeedGoblinsDiscoverables(midpoint).map((item) => [item.id, item]))

  assert.deepEqual(byId['cloudberry:nib'].action, {
    kind: 'engine',
    id: 'midpoint:help',
    label: 'Help Nib with the tripwire',
  })
  assert.equal(byId['cloudberry:tripwire'].action.kind, 'free-text')
  assert.equal(typeof byId['cloudberry:tripwire'].action.playerAction, 'string')
})
