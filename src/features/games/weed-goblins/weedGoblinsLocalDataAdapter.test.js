import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildWeedGoblinsPersonalizationSnapshot,
  createEmptyWeedGoblinsPersonalizationSnapshot,
  readWeedGoblinsPersonalizationSnapshot,
  weedGoblinsRunStorageKey,
} from './weedGoblinsLocalDataAdapter.js'

function createMockStore({ userId = 'user-1', entries = [] } = {}) {
  return {
    auth: {
      async getUser() {
        return { data: { user: userId ? { id: userId } : null }, error: null }
      },
    },
    from(table) {
      assert.equal(table, 'entries')
      let selectedUserId = null
      return {
        select(columns) {
          assert.equal(columns, '*')
          return this
        },
        eq(column, value) {
          assert.equal(column, 'user_id')
          selectedUserId = value
          return Promise.resolve({
            data: entries.filter((entry) => entry.user_id === selectedUserId),
            error: null,
          })
        },
      }
    },
  }
}

function createMemoryStorage(values = {}) {
  return {
    getItem(key) {
      return Object.hasOwn(values, key) ? values[key] : null
    },
  }
}

test('caps products, categories, and dispensaries at the locked limits', () => {
  const entries = [
    ['Blue Dream', 'Flower', 'Restore Scranton'],
    ['Northern Lights', 'Vape', 'Justice Grown'],
    ['Lemon Cherry Gelato', 'Extract', 'Columbia Care'],
    ['Animal Face', 'Tinctures', 'Ethos'],
    ['Purple Punch', 'Topicals', 'Beyond Hello'],
    ['Wedding Cake', 'Flower', 'AYR'],
    ['Runtz', 'Vape', 'Trulieve'],
  ].map(([product_name, category, dispensary_name], index) => ({
    id: `entry-${index}`,
    user_id: 'user-1',
    product_name,
    category,
    dispensary_name,
    body_tags: index < 4 ? ['Relaxed'] : ['Heavy'],
    mind_tags: ['Creative'],
    mood_tags: ['Calm'],
    terpenes: index < 5
      ? { 'Beta Myrcene': '1.2', Limonene: '0.7' }
      : { Linalool: '0.4' },
  }))

  const snapshot = buildWeedGoblinsPersonalizationSnapshot({ entries })

  assert.equal(snapshot.productNames.length, 5)
  assert.equal(snapshot.productCategories.length, 3)
  assert.equal(snapshot.dispensaryNames.length, 3)
  assert.deepEqual(snapshot.productNames, [
    'Blue Dream',
    'Northern Lights',
    'Lemon Cherry Gelato',
    'Animal Face',
    'Purple Punch',
  ])
  assert.deepEqual(snapshot.productCategories, ['Flower', 'Vape', 'Extract'])
  assert.deepEqual(snapshot.dispensaryNames, [
    'Restore Scranton',
    'Justice Grown',
    'Columbia Care',
  ])
  assert.equal(snapshot.entryCount, 7)
  assert.equal(snapshot.effectTags[0], 'Creative')
  assert.equal(snapshot.terpeneLabels[0], 'Beta Myrcene')
})

test('produces the valid empty snapshot when there are zero local entries', async () => {
  const snapshot = await readWeedGoblinsPersonalizationSnapshot({
    store: createMockStore({ entries: [] }),
    storage: createMemoryStorage(),
  })

  assert.deepEqual(snapshot, createEmptyWeedGoblinsPersonalizationSnapshot())
})

test('never includes excluded raw-entry fields in the sanitized snapshot', () => {
  const rawEntry = {
    id: 'entry-sensitive',
    user_id: 'user-1',
    product_name: 'Blue Dream',
    category: 'Flower',
    dispensary_name: 'Restore Scranton',
    body_tags: ['Relaxed'],
    mind_tags: ['Creative'],
    mood_tags: ['Calm'],
    terpenes: { 'Beta Myrcene': '1.25' },
    notes: 'private pain and health note',
    voice_transcript: 'private voice transcript',
    medical_history: 'private health information',
    amount: '3.5g',
    exact_amount_mg: 3500,
    created_at: '2026-08-06T02:58:00-04:00',
    updated_at: '2026-08-06T03:00:00-04:00',
    dispensary_address: '123 Private Street',
    dispensary_lat: 41.5,
    dispensary_lng: -75.5,
    price: '45.00',
    shared_contribution: { product_key: 'layer-2-secret' },
    anonymous_contributor_id: 'layer-2-id',
  }

  const snapshot = buildWeedGoblinsPersonalizationSnapshot({ entries: [rawEntry] })
  const serialized = JSON.stringify(snapshot)

  assert.deepEqual(Object.keys(snapshot), [
    'productNames',
    'productCategories',
    'effectTags',
    'terpeneLabels',
    'dispensaryNames',
    'entryCount',
    'previousRuns',
  ])

  for (const forbiddenValue of [
    'private pain and health note',
    'private voice transcript',
    'private health information',
    '3.5g',
    '3500',
    '2026-08-06',
    '123 Private Street',
    '41.5',
    '-75.5',
    '45.00',
    'layer-2-secret',
    'layer-2-id',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false)
  }
})

test('reads the actual localStore entries query shape and sanitized prior run key', async () => {
  const userId = 'user-1'
  const entries = [
    {
      user_id: userId,
      product_name: 'Northern Lights',
      category: 'Flower',
      dispensary_name: 'Restore Scranton',
      body_tags: ['Relaxed'],
      terpenes: { 'Beta Myrcene': '1.1' },
    },
    {
      user_id: userId,
      entry_type: 'note',
      product_name: 'Private note title',
      notes: 'Do not include this.',
    },
    {
      user_id: 'someone-else',
      product_name: 'Other User Product',
    },
  ]
  const storage = createMemoryStorage({
    [weedGoblinsRunStorageKey(userId)]: JSON.stringify([
      {
        outcomeSummary: 'recovered the Northern Lights Field Reliquary',
        ending: 'recovery',
        created_at: '2026-08-06T02:58:00-04:00',
        notes: 'must not survive',
      },
    ]),
  })

  const snapshot = await readWeedGoblinsPersonalizationSnapshot({
    store: createMockStore({ userId, entries }),
    storage,
  })

  assert.deepEqual(snapshot.productNames, ['Northern Lights'])
  assert.equal(snapshot.entryCount, 1)
  assert.deepEqual(snapshot.previousRuns, [
    {
      ending: 'recovery',
      outcomeSummary: 'recovered the Northern Lights Field Reliquary',
    },
  ])
  assert.equal(JSON.stringify(snapshot).includes('Private note title'), false)
  assert.equal(JSON.stringify(snapshot).includes('must not survive'), false)
  assert.equal(JSON.stringify(snapshot).includes('2026-08-06'), false)
})
