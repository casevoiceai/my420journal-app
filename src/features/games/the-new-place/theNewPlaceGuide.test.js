import test from 'node:test'
import assert from 'node:assert/strict'
import { readSelectedTheNewPlaceGuide, theNewPlaceGuideLine, theNewPlaceGuideMeta, theNewPlaceGuideMoment } from './theNewPlaceGuide.js'

test('supports every guide currently selectable in the journal', () => {
  for (const key of ['bud','sunny','larry','herb','mary','stoner','unit','tool']) {
    assert.equal(theNewPlaceGuideMeta(key).key, key)
    assert.ok(theNewPlaceGuideLine(key, 'opening'))
  }
})

test('maps engine events to business-narration moments', () => {
  assert.equal(theNewPlaceGuideMoment(null, {}), 'opening')
  assert.equal(theNewPlaceGuideMoment({}, { history: [{ type: 'decision' }] }), 'decision')
  assert.equal(theNewPlaceGuideMoment({}, { history: [{ type: 'report', inconsistent: false }] }), 'report')
  assert.equal(theNewPlaceGuideMoment({}, { history: [{ type: 'report', inconsistent: true }] }), 'inconsistency')
  assert.equal(theNewPlaceGuideMoment({}, { history: [{ type: 'inspector' }] }), 'inspector')
  assert.equal(theNewPlaceGuideMoment({}, { history: [{ type: 'completion' }] }), 'completion')
})

test('selected-guide lookup requests only guide_selected', async () => {
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
                async maybeSingle() {
                  return { data: { guide_selected: 'mary' }, error: null }
                },
              }
            },
          }
        },
      }
    },
  }
  const guide = await readSelectedTheNewPlaceGuide({ store })
  assert.equal(guide.key, 'mary')
})
