import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const appSource = readFileSync(new URL('../../App.jsx', import.meta.url), 'utf8')
const homeSource = readFileSync(new URL('../../screens/Home.jsx', import.meta.url), 'utf8')
const gamesSource = readFileSync(new URL('../../screens/Games.jsx', import.meta.url), 'utf8')

const GAME_ROUTES = [
  '/games/weed-goblins',
  '/games/who-took-my-lighter',
  '/games/the-new-place',
]

test('Home exposes the private Play Games hub', () => {
  assert.match(homeSource, />\s*Play Games\s*</)
  assert.match(homeSource, /navigate\(['"]\/games['"]\)/)
})

test('Games hub exposes all three Phase 1 games', () => {
  for (const route of GAME_ROUTES) {
    assert.ok(gamesSource.includes(`path: '${route}'`), `Missing Games hub link for ${route}`)
  }
})

test('App router mounts all three Phase 1 games', () => {
  assert.match(appSource, /import WhoTookMyLighter from ['"]\.\/features\/games\/who-took-my-lighter\/WhoTookMyLighter['"]/)
  assert.match(appSource, /import TheNewPlace from ['"]\.\/features\/games\/the-new-place\/TheNewPlace['"]/)

  for (const route of GAME_ROUTES) {
    assert.ok(appSource.includes(`path="${route}"`), `Missing App route for ${route}`)
  }
})
