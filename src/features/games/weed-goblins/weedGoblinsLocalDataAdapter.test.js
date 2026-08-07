import test from 'node:test'
import assert from 'node:assert/strict'

import {
  advanceWeedGoblinsRun,
  createWeedGoblinsRun,
} from './weedGoblinsEngine.js'
import { generateNarrationFromHook } from './weedGoblinsAiComplication.js'
import { getNarrationHooksForTransition } from './weedGoblinsNarrationHooks.js'
import {
  buildEffectTraitFlavor,
  buildTerpeneEnvironmentFlavor,
  buildWeedGoblinsPersonalizationSnapshot,
  createEmptyWeedGoblinsPersonalizationSnapshot,
  fictionalizeDispensaryName,
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

function modelResponse(text) {
  return Promise.resolve(new Response(JSON.stringify({
    text,
    model: 'claude-haiku-4-5-20251001',
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }))
}

test('fictional dispensary transform is stable and differentiates names', () => {
  const first = fictionalizeDispensaryName('North Ridge Collective')
  const repeated = fictionalizeDispensaryName('North Ridge Collective')
  const different = fictionalizeDispensaryName('East Gate Supply')

  assert.equal(first, repeated)
  assert.notEqual(first, different)
  assert.match(first, /^The [A-Za-z-]+ [A-Za-z]+$/)
  assert.match(different, /^The [A-Za-z-]+ [A-Za-z]+$/)
})

test('effect and terpene flavor transforms are deterministic and fall back cleanly', () => {
  const bodyTags = ['Relaxed', 'Heavy', 'Creative']
  const mindTags = ['Focused', 'Creative', 'Calm']
  const myrceneProfile = ['Beta Myrcene', 'Limonene']
  const limoneneProfile = ['Limonene', 'Beta Myrcene']

  const bodyFlavor = buildEffectTraitFlavor(bodyTags, 'body')
  const repeatedBodyFlavor = buildEffectTraitFlavor(bodyTags, 'body')
  const mindFlavor = buildEffectTraitFlavor(mindTags, 'mind')
  const myrceneFlavor = buildTerpeneEnvironmentFlavor(myrceneProfile)
  const repeatedMyrceneFlavor = buildTerpeneEnvironmentFlavor(myrceneProfile)
  const limoneneFlavor = buildTerpeneEnvironmentFlavor(limoneneProfile)

  assert.equal(bodyFlavor, repeatedBodyFlavor)
  assert.notEqual(bodyFlavor, mindFlavor)
  assert.equal(myrceneFlavor, repeatedMyrceneFlavor)
  assert.notEqual(myrceneFlavor, limoneneFlavor)
  assert.equal(buildEffectTraitFlavor([], 'body'), '')
  assert.equal(buildTerpeneEnvironmentFlavor([]), '')
})

test('caps products, categories, and fictional locations at the locked limits', () => {
  const entries = [
    ['Blue Dream', 'Flower', 'North Ridge Collective'],
    ['Northern Lights', 'Vape', 'East Gate Supply'],
    ['Lemon Cherry Gelato', 'Extract', 'West Hollow Exchange'],
    ['Animal Face', 'Tinctures', 'South Arch Market'],
    ['Purple Punch', 'Topicals', 'Copper Lane Shop'],
    ['Wedding Cake', 'Flower', 'Moon Gate Supply'],
    ['Runtz', 'Vape', 'Moss Road Exchange'],
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
  assert.equal(snapshot.fictionalLocationNames.length, 3)
  assert.deepEqual(snapshot.productNames, [
    'Blue Dream',
    'Northern Lights',
    'Lemon Cherry Gelato',
    'Animal Face',
    'Purple Punch',
  ])
  assert.deepEqual(snapshot.productCategories, ['Flower', 'Vape', 'Extract'])
  assert.deepEqual(snapshot.fictionalLocationNames, [
    fictionalizeDispensaryName('North Ridge Collective'),
    fictionalizeDispensaryName('East Gate Supply'),
    fictionalizeDispensaryName('West Hollow Exchange'),
  ])
  assert.equal(snapshot.entryCount, 7)
  assert.equal(snapshot.effectTags[0], 'Creative')
  assert.equal(snapshot.terpeneLabels[0], 'Beta Myrcene')
  assert.equal(
    snapshot.effectTraitFlavor,
    buildEffectTraitFlavor(snapshot.effectTags, 'body'),
  )
  assert.equal(
    snapshot.terpeneEnvironmentFlavor,
    buildTerpeneEnvironmentFlavor(snapshot.terpeneLabels),
  )

  const serialized = JSON.stringify(snapshot)
  for (const rawName of entries.map((entry) => entry.dispensary_name)) {
    assert.equal(serialized.includes(rawName), false)
  }
})

test('produces the valid empty snapshot when there are zero local entries', async () => {
  const snapshot = await readWeedGoblinsPersonalizationSnapshot({
    store: createMockStore({ entries: [] }),
    storage: createMemoryStorage(),
  })

  assert.deepEqual(snapshot, createEmptyWeedGoblinsPersonalizationSnapshot())
  assert.equal(snapshot.effectTraitFlavor, '')
  assert.equal(snapshot.terpeneEnvironmentFlavor, '')
})

test('never includes excluded raw-entry fields or raw dispensary names in the sanitized snapshot', () => {
  const rawEntry = {
    id: 'entry-sensitive',
    user_id: 'user-1',
    product_name: 'Blue Dream',
    category: 'Flower',
    dispensary_name: 'North Ridge Collective',
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
    'effectTraitFlavor',
    'terpeneEnvironmentFlavor',
    'fictionalLocationNames',
    'entryCount',
    'previousRuns',
  ])
  assert.deepEqual(snapshot.fictionalLocationNames, [
    fictionalizeDispensaryName(rawEntry.dispensary_name),
  ])

  for (const forbiddenValue of [
    'North Ridge Collective',
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

test('effect and terpene flavor use only structured inputs and enter validated narration context', async () => {
  const rawEntry = {
    user_id: 'user-1',
    product_name: 'Blue Dream',
    category: 'Flower',
    dispensary_name: 'North Ridge Collective',
    body_tags: ['Relaxed', 'Heavy'],
    mind_tags: ['Creative'],
    mood_tags: ['Calm'],
    terpenes: { 'Beta Myrcene': '1.25', Limonene: '0.5' },
    notes: 'FREEFORM NOTE MUST NEVER BE READ',
    voice_transcript: 'FREEFORM TRANSCRIPT MUST NEVER BE READ',
    custom_freeform: 'NON-WHITELISTED FREEFORM FIELD MUST NEVER BE READ',
  }
  const snapshot = buildWeedGoblinsPersonalizationSnapshot({ entries: [rawEntry] })

  assert.ok(snapshot.effectTraitFlavor)
  assert.ok(snapshot.terpeneEnvironmentFlavor)
  assert.equal(snapshot.effectTraitFlavor.includes('Relaxed'), false)
  assert.equal(snapshot.effectTraitFlavor.includes('Heavy'), false)
  assert.equal(snapshot.terpeneEnvironmentFlavor.includes('Beta Myrcene'), false)
  assert.equal(snapshot.terpeneEnvironmentFlavor.includes('Limonene'), false)

  let state = createWeedGoblinsRun({ seed: 'recovery-1', journalSnapshot: snapshot })
  assert.equal(state.characterTraitFlavor, snapshot.effectTraitFlavor)
  assert.equal(state.environmentThemeFlavor, snapshot.terpeneEnvironmentFlavor)

  const forbiddenFreeform = [
    rawEntry.notes,
    rawEntry.voice_transcript,
    rawEntry.custom_freeform,
  ]
  for (const forbiddenValue of forbiddenFreeform) {
    assert.equal(state.characterTraitFlavor.includes(forbiddenValue), false)
    assert.equal(state.environmentThemeFlavor.includes(forbiddenValue), false)
    assert.equal(JSON.stringify(state).includes(forbiddenValue), false)
  }

  const beforeBackground = state
  state = advanceWeedGoblinsRun(state, 'background:hauler')
  const backgroundHook = getNarrationHooksForTransition(beforeBackground, state)[0]
  assert.equal(backgroundHook.moment, 'scene-intro')
  assert.equal(backgroundHook.authoritativeText.includes(snapshot.effectTraitFlavor), true)

  let backgroundRequestBody = null
  await generateNarrationFromHook({
    hook: backgroundHook,
    state,
    fetchImpl: async (_url, init) => {
      backgroundRequestBody = init.body
      return modelResponse('I record a deliberate field style before the route begins.')
    },
  })

  const beforeRoute = state
  state = advanceWeedGoblinsRun(state, 'route:ridge')
  const routeHook = getNarrationHooksForTransition(beforeRoute, state)[0]
  assert.equal(routeHook.authoritativeText.includes(snapshot.terpeneEnvironmentFlavor), true)

  let routeRequestBody = null
  await generateNarrationFromHook({
    hook: routeHook,
    state,
    fetchImpl: async (_url, init) => {
      routeRequestBody = init.body
      return modelResponse('I record the route crossing while the altered highland air remains strictly atmospheric.')
    },
  })

  for (const requestBody of [backgroundRequestBody, routeRequestBody]) {
    assert.ok(requestBody)
    for (const forbiddenValue of [
      ...forbiddenFreeform,
      'Relaxed',
      'Heavy',
      'Creative',
      'Calm',
      'Beta Myrcene',
      'Limonene',
    ]) {
      assert.equal(requestBody.includes(forbiddenValue), false)
    }
  }

  assert.equal(backgroundRequestBody.includes(snapshot.effectTraitFlavor), true)
  assert.equal(routeRequestBody.includes(snapshot.terpeneEnvironmentFlavor), true)
})

test('raw dispensary name cannot reach engine state or narration request context', async () => {
  const rawDispensaryName = 'North Ridge Collective'
  const snapshot = buildWeedGoblinsPersonalizationSnapshot({
    entries: [{
      user_id: 'user-1',
      product_name: 'Blue Dream',
      category: 'Flower',
      dispensary_name: rawDispensaryName,
    }],
  })
  const fictionalLocationName = fictionalizeDispensaryName(rawDispensaryName)

  assert.equal(JSON.stringify(snapshot).includes(rawDispensaryName), false)
  assert.deepEqual(snapshot.fictionalLocationNames, [fictionalLocationName])

  let state = createWeedGoblinsRun({ seed: 'recovery-1', journalSnapshot: snapshot })
  assert.equal(state.fictionalLocationName, fictionalLocationName)
  assert.equal(JSON.stringify(state).includes(rawDispensaryName), false)

  state = advanceWeedGoblinsRun(state, 'background:hauler')
  const beforeRoute = state
  state = advanceWeedGoblinsRun(state, 'route:ridge')
  const routeHook = getNarrationHooksForTransition(beforeRoute, state)[0]

  assert.equal(routeHook.fictionalLocationName, fictionalLocationName)
  assert.equal(
    routeHook.authoritativeText.toLocaleLowerCase('en-US').includes(
      fictionalLocationName.toLocaleLowerCase('en-US'),
    ),
    true,
  )
  assert.equal(routeHook.authoritativeText.includes(rawDispensaryName), false)

  let requestBody = null
  const result = await generateNarrationFromHook({
    hook: routeHook,
    state,
    blockedRealNames: [rawDispensaryName],
    fetchImpl: async (_url, init) => {
      requestBody = init.body
      return modelResponse(
        `I record your success as the route bends past ${fictionalLocationName}.`,
      )
    },
  })

  assert.equal(result.source, 'ai')
  assert.equal(requestBody.includes(rawDispensaryName), false)
  assert.equal(
    requestBody.toLocaleLowerCase('en-US').includes(
      fictionalLocationName.toLocaleLowerCase('en-US'),
    ),
    true,
  )
})

test('reads the actual localStore entries query shape and sanitized prior run key', async () => {
  const userId = 'user-1'
  const entries = [
    {
      user_id: userId,
      product_name: 'Northern Lights',
      category: 'Flower',
      dispensary_name: 'North Ridge Collective',
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
  assert.deepEqual(snapshot.fictionalLocationNames, [
    fictionalizeDispensaryName('North Ridge Collective'),
  ])
  assert.equal(snapshot.entryCount, 2)
  assert.deepEqual(snapshot.previousRuns, [
    {
      ending: 'recovery',
      outcomeSummary: 'recovered the Northern Lights Field Reliquary',
    },
  ])
  assert.equal(JSON.stringify(snapshot).includes('North Ridge Collective'), false)
  assert.equal(JSON.stringify(snapshot).includes('Private note title'), false)
  assert.equal(JSON.stringify(snapshot).includes('must not survive'), false)
  assert.equal(JSON.stringify(snapshot).includes('2026-08-06'), false)
})
