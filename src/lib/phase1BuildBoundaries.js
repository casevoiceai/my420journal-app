const NEW_ENTRY_SUFFIX = '/src/screens/NewEntry.jsx'
const TERPENE_SUGGESTION_CALL = 'const suggestions = suggestTerpenes(productName)'
const TERPENE_DISABLED_REPLACEMENT = 'const suggestions = [] // Phase 1 external test: automatic terpene inference disabled'

export function disableAutomaticTerpeneInferenceForPhase1(code, id = '') {
  const normalizedId = String(id).replaceAll('\\', '/')
  if (!normalizedId.endsWith(NEW_ENTRY_SUFFIX)) return null

  const occurrences = String(code).split(TERPENE_SUGGESTION_CALL).length - 1
  if (occurrences !== 1) {
    throw new Error(`Phase 1 terpene-inference lock expected exactly one suggestion call, found ${occurrences}.`)
  }

  return {
    code: String(code).replace(TERPENE_SUGGESTION_CALL, TERPENE_DISABLED_REPLACEMENT),
    map: null,
  }
}

export function phase1ExternalTestBoundariesPlugin() {
  return {
    name: 'phase1-external-test-boundaries',
    enforce: 'pre',
    transform(code, id) {
      return disableAutomaticTerpeneInferenceForPhase1(code, id)
    },
  }
}
