import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const accessFunctionSource = readFileSync(
  new URL('../../functions/api/private-testing-access.js', import.meta.url),
  'utf8',
)

test('V3 founder preview access redirects directly to Weed Goblins, not the marketing splash', () => {
  assert.match(accessFunctionSource, /Location:\s*['"]\/games\/weed-goblins['"]/)
  assert.doesNotMatch(accessFunctionSource, /Location:\s*['"]\/['"]\s*,/)
})
