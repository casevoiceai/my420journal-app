import test from 'node:test'
import assert from 'node:assert/strict'

import {
  normalizeWhoTookMyLighterGuideKey,
  readSelectedWhoTookMyLighterGuide,
  whoTookMyLighterGuideLine,
  whoTookMyLighterGuideMeta,
  whoTookMyLighterGuideMomentForRun,
} from './whoTookMyLighterGuide.js'

test('supports every guide currently selectable in the journal', () => {
  for (const key of ['bud', 'sunny', 'larry', 'herb', 'mary', 'stoner', 'unit', 'tool']) {
    assert.equal(normalizeWhoTookMyLighterGuideKey(key), key)
    assert.ok(whoTookMyLighterGuideMeta(key).name)
    assert.ok(whoTookMyLighterGuideLine(key, 'opening'))
  }
  assert.equal(normalizeWhoTookMyLighterGuideKey('unknown'), 'bud')
})

test('guide lines vary by selected guide without containing case facts', () => {
  const bud = whoTookMyLighterGuideLine('bud', 'opening')
  const stoner = whoTookMyLighterGuideLine('stoner', 'opening')
  assert.notEqual(bud, stoner)
  assert.equal(/culpritId|caseSeed|rawNotes/.test(`${bud}${stoner}`), false)
})

test('maps structured engine events to guide moments', () => {
  assert.equal(whoTookMyLighterGuideMomentForRun(null, {}), 'opening')
  assert.equal(whoTookMyLighterGuideMomentForRun({}, { history: [{ type: 'evidence' }] }), 'evidence')
  assert.equal(whoTookMyLighterGuideMomentForRun({}, { history: [{ type: 'present-evidence', contradiction: true }] }), 'contradiction')
  assert.equal(whoTookMyLighterGuideMomentForRun({}, { history: [{ type: 'accusation', correct: true }] }), 'correct')
  assert.equal(whoTookMyLighterGuideMomentForRun({}, { history: [{ type: 'accusation', correct: false }] }), 'wrong')
})

test('reads the selected guide from the local profile using only guide_selected', async () => {
  const store = {
    auth: { async getUser() { return { data: { user: { id: 'u1' } }, error: null } } },
    from(table) {
      assert.equal(table, 'user_profiles')
      return {
        select(columns) {
          assert.equal(columns, 'guide_selected')
          return {
            eq(column, value) {
              assert.equal(column, 'user_id')
              assert.equal(value, 'u1')
              return {
                async maybeSingle() { return { data: { guide_selected: 'herb' }, error: null } },
              }
            },
          }
        },
      }
    },
  }
  const guide = await readSelectedWhoTookMyLighterGuide({ store })
  assert.equal(guide.key, 'herb')
  assert.equal(guide.name, 'Herb N. Spices')
})

test('dev mode uses the same current Sunny default as the Guide screen', async () => {
  const guide = await readSelectedWhoTookMyLighterGuide({ devMode: true })
  assert.equal(guide.key, 'sunny')
})
