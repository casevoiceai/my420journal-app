import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { disableAutomaticTerpeneInferenceForPhase1 } from './phase1BuildBoundaries.js'

test('Phase 1 browser policy blocks microphone, geolocation, and camera', async () => {
  const headers = await readFile(new URL('../../public/_headers', import.meta.url), 'utf8')
  assert.match(headers, /connect-src 'self';/)
  assert.match(headers, /Permissions-Policy: geolocation=\(\), camera=\(\), microphone=\(\)/)
  assert.doesNotMatch(headers, /api\.web3forms\.com/)
  assert.doesNotMatch(headers, /my420journal-shared-worker/)
})

test('Phase 1 runtime removes browser speech-recognition APIs before the app loads', async () => {
  const boundaryScript = await readFile(new URL('../../public/phase1-boundaries.js', import.meta.url), 'utf8')
  const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8')

  assert.match(boundaryScript, /SpeechRecognition/)
  assert.match(boundaryScript, /webkitSpeechRecognition/)
  assert.match(html, /<script src="\/phase1-boundaries\.js"><\/script>/)
  assert.ok(html.indexOf('/phase1-boundaries.js') < html.indexOf('/src/main.jsx'))
})

test('Phase 1 build transform disables the NewEntry automatic terpene suggestion calculation', () => {
  const source = [
    'function screen() {',
    '  const suggestions = suggestTerpenes(productName)',
    '  return suggestions',
    '}',
  ].join('\n')

  const transformed = disableAutomaticTerpeneInferenceForPhase1(
    source,
    '/workspace/src/screens/NewEntry.jsx',
  )

  assert.ok(transformed)
  assert.doesNotMatch(transformed.code, /suggestTerpenes\(productName\)/)
  assert.match(transformed.code, /const suggestions = \[\]/)
})

test('Phase 1 terpene transform refuses to silently pass if the guarded source shape changes', () => {
  assert.throws(
    () => disableAutomaticTerpeneInferenceForPhase1(
      'const suggestions = someOtherSource(productName)',
      '/workspace/src/screens/NewEntry.jsx',
    ),
    /expected exactly one suggestion call/,
  )
})
