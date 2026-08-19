import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createLocalGuideReply,
  getLocalGuideProductEntries,
  isLocalGuideProductEntry,
} from './localGuide.js'

function userMessage(content) {
  return [{ role: 'user', content }]
}

const entries = [
  {
    id: 'older-product',
    user_id: 'user-a',
    product_name: 'Old Flower',
    entry_type: 'cannabis',
    category: 'Flower',
    strain_type: 'Hybrid',
    body_tags: ['Relaxed'],
    mind_tags: ['Creative'],
    mood_tags: ['Calm'],
    notes: 'A private note I chose to log.',
    created_at: '2026-08-15T18:00:00.000Z',
  },
  {
    id: 'sleep',
    user_id: 'user-a',
    product_name: 'Sleep End',
    entry_type: 'sleep_end',
    created_at: '2026-08-15T20:00:00.000Z',
  },
  {
    id: 'latest-product',
    user_id: 'user-a',
    product_name: 'Founder Test Flower',
    entry_type: '',
    mood_face: 'good',
    created_at: '2026-08-15T19:00:00.000Z',
  },
  {
    id: 'note',
    user_id: 'user-a',
    product_name: 'Morning thoughts',
    entry_type: 'note',
    notes: 'Not a product.',
    created_at: '2026-08-15T21:00:00.000Z',
  },
]

test('product entry classifier accepts cannabis and quick-entry products but rejects sleep and notes', () => {
  assert.equal(isLocalGuideProductEntry(entries[0]), true)
  assert.equal(isLocalGuideProductEntry(entries[2]), true)
  assert.equal(isLocalGuideProductEntry(entries[1]), false)
  assert.equal(isLocalGuideProductEntry(entries[3]), false)
})

test('product entries are ordered by created_at and exclude non-product journal records', () => {
  const products = getLocalGuideProductEntries(entries)
  assert.deepEqual(products.map((entry) => entry.product_name), ['Founder Test Flower', 'Old Flower'])
})

test('founder acceptance question returns the actual latest logged product', () => {
  const reply = createLocalGuideReply({
    guide: 'sunny',
    messages: userMessage('What product did I just log?'),
    entries,
  })
  assert.equal(reply, 'You just logged Founder Test Flower.')
})

test('latest journal entry can be distinguished from latest product entry', () => {
  const reply = createLocalGuideReply({
    guide: 'sunny',
    messages: userMessage('What did I just log?'),
    entries,
  })
  assert.equal(reply, 'Your latest journal entry is Morning thoughts.')
})

test('recent product recall lists only distinct product entries', () => {
  const reply = createLocalGuideReply({
    guide: 'bud',
    messages: userMessage('What products have I logged?'),
    entries: [...entries, { ...entries[0], id: 'duplicate', created_at: '2026-08-15T17:00:00.000Z' }],
  })
  assert.equal(reply, 'Recent products in your journal: Founder Test Flower, Old Flower.')
})

test('specific-product reflection uses only fields present in the local entry', () => {
  const reply = createLocalGuideReply({
    guide: 'herb',
    messages: userMessage('What did I log about Old Flower?'),
    entries,
  })
  assert.match(reply, /^For Old Flower, you logged /)
  assert.match(reply, /category: Flower/)
  assert.match(reply, /type: Hybrid/)
  assert.match(reply, /tags: Relaxed, Creative, Calm/)
  assert.equal(reply.includes('private note'), false)
})

test('notes are echoed only when the user specifically asks for the logged note', () => {
  const reply = createLocalGuideReply({
    guide: 'mary',
    messages: userMessage('What note did I log about Old Flower?'),
    entries,
  })
  assert.match(reply, /note: A private note I chose to log\./)
})

test('guide refuses product recommendations and medical interpretation instead of inventing advice', () => {
  const recommendation = createLocalGuideReply({
    guide: 'sunny',
    messages: userMessage('What should I use next?'),
    entries,
  })
  assert.match(recommendation, /don't recommend products/)

  const medical = createLocalGuideReply({
    guide: 'herb',
    messages: userMessage('Can you diagnose what this means?'),
    entries,
  })
  assert.match(medical, /can't diagnose, treat, prescribe/)
})

test('no-data and unsupported questions never fabricate journal facts', () => {
  const noData = createLocalGuideReply({
    guide: 'sunny',
    messages: userMessage('What product did I just log?'),
    entries: [],
  })
  assert.match(noData, /don't have a product log/)

  const unsupported = createLocalGuideReply({
    guide: 'sunny',
    messages: userMessage('Tell me something surprising.'),
    entries,
  })
  assert.equal(unsupported.includes('Founder Test Flower'), false)
  assert.match(unsupported, /what you've actually logged here/)
})
