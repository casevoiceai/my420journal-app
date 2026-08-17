import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const accessFunctionSource = readFileSync(
  new URL('../../functions/api/private-testing-access.js', import.meta.url),
  'utf8',
)

test('successful private testing access redirects into the app, not the marketing splash', () => {
  assert.match(accessFunctionSource, /Location:\s*['"]\/app['"]/)
  assert.doesNotMatch(accessFunctionSource, /Location:\s*['"]\/['"]\s*,/)
})
