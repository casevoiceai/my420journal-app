// Preview-only founder-acceptance fallback for the Phase 1 integration branch.
// The raw code is never stored in Git. Only its SHA-256 hash lives here.
// Production continues to use JOURNAL_ACCESS_CODE and never reaches this fallback.
export const PHASE1_PREVIEW_HOST = 'feature-phase1-log-talk-play.my420journal-app.pages.dev'

// Replaced by the temporary verification workflow with the generated code hash.
export const PHASE1_PREVIEW_ACCESS_CODE_SHA256 = '0000000000000000000000000000000000000000000000000000000000000000'

export function getPhase1PreviewAccessCodeHash(hostname) {
  const host = String(hostname ?? '').trim().toLowerCase()
  return host === PHASE1_PREVIEW_HOST ? PHASE1_PREVIEW_ACCESS_CODE_SHA256 : ''
}
