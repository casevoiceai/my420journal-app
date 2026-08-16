// Preview-only founder-acceptance fallback for the Phase 1 integration branch.
// The raw code is never stored in Git. Only its SHA-256 hash lives here.
// Production continues to use JOURNAL_ACCESS_CODE and never reaches this fallback.
export const PHASE1_PREVIEW_HOST = 'feature-phase1-log-talk-play.my420journal-app.pages.dev'

// Founder-acceptance preview code hash. The raw code is handed off separately.
export const PHASE1_PREVIEW_ACCESS_CODE_SHA256 = '8516fb8cbabfa1286ab973e597441280a4138f33f87abea02f4cccb5c45821f2'

export function getPhase1PreviewAccessCodeHash(hostname) {
  const host = String(hostname ?? '').trim().toLowerCase()
  return host === PHASE1_PREVIEW_HOST ? PHASE1_PREVIEW_ACCESS_CODE_SHA256 : ''
}
