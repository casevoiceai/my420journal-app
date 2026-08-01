import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildCombinationKey,
  buildFoldGroups,
  buildPoolKey,
  normalizeContribution,
} from './index.js'

test('normalizes the existing app payload without adding personal fields', () => {
  const contribution = normalizeContribution({
    product_key: '  Red Berry  ',
    product_name_normalized: 'Red Berry',
    category: 'flower',
    entry_logged_at_bucket: 'night',
    source_app_version: 'my420journal-web',
    body_tags: ['Relaxed', '', 42],
  })

  assert.equal(contribution.product_key, 'red berry')
  assert.equal(contribution.product_category, 'flower')
  assert.equal(contribution.time_bucket, 'night')
  assert.equal(contribution.app_version, 'my420journal-web')
  assert.deepEqual(contribution.body_tags, ['Relaxed'])
  assert.equal(Object.hasOwn(contribution, 'anonymous_contributor_id'), false)
})

test('combination keys are deterministic and contain no contributor ID', () => {
  const contribution = normalizeContribution({
    product_key: 'red berry',
    product_name_normalized: 'Red Berry',
    body_tags: ['Relaxed'],
    mood_tags: ['Happy'],
  })

  const first = buildCombinationKey(contribution)
  const second = buildCombinationKey({ ...contribution })

  assert.equal(first, second)
  assert.equal(first.includes('anonymous_contributor_id'), false)
  assert.equal(first.includes('contributor_id'), false)
})

test('pool keys preserve product and product-region query scopes', () => {
  assert.equal(
    buildPoolKey('product', 'red berry'),
    '{"scope":"product","product_key":"red berry"}'
  )
  assert.equal(
    buildPoolKey('product_region', 'red berry', 'pa-ne'),
    '{"scope":"product_region","product_key":"red berry","region_bucket":"pa-ne"}'
  )
})

test('fold grouping de-duplicates contributors within one aging batch', () => {
  const base = {
    product_key: 'red berry',
    product_name_normalized: 'Red Berry',
    brand_name: null,
    product_category: 'flower',
    strain_type: 'indica',
    region_bucket: 'pa-ne',
    body_tags_json: '["Relaxed"]',
    mind_tags_json: '[]',
    mood_tags_json: '[]',
    mood_face: 'good',
    amount_bucket: 'small',
    time_bucket: 'night',
    app_version: 'my420journal-web',
  }

  const rows = [
    {
      ...base,
      contributor_id: 'device-a',
      combination_key: 'combo-a',
    },
    {
      ...base,
      contributor_id: 'device-a',
      combination_key: 'combo-b',
      mood_face: 'meh',
    },
    {
      ...base,
      contributor_id: 'device-b',
      combination_key: 'combo-c',
      mood_face: 'off',
    },
  ]

  const groups = buildFoldGroups(rows)
  const productPool = groups.find((group) => group.aggregate_scope === 'product')
  const regionPool = groups.find((group) => group.aggregate_scope === 'product_region')

  assert.equal(productPool.total_count, 3)
  assert.equal(productPool.distinct_contributor_count, 2)
  assert.equal(regionPool.total_count, 3)
  assert.equal(regionPool.distinct_contributor_count, 2)
})
