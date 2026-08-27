// Preview-only founder-acceptance fallback for known private Cloudflare Pages branches.
// The raw code is never stored in Git. Only its SHA-256 hash lives here.
// Production continues to use JOURNAL_ACCESS_CODE and never reaches this fallback.
export const PHASE1_PREVIEW_HOST = 'feature-phase1-log-talk-play.my420journal-app.pages.dev'
export const WEED_GOBLINS_V3_PREVIEW_HOST = 'feature-weed-goblins-v3-star.my420journal-app.pages.dev'

// Founder-acceptance preview code hash. The raw code is handed off separately.
export const PHASE1_PREVIEW_ACCESS_CODE_SHA256 = '7b8255e8e54c192b3e5badfe34566390c03fbaf57a5f8db7f1320f3286d91028'

export function getPhase1PreviewAccessCodeHash(hostname) {
  const host = String(hostname ?? '').trim().toLowerCase()
  const allowedHosts = [PHASE1_PREVIEW_HOST, WEED_GOBLINS_V3_PREVIEW_HOST]
  return allowedHosts.includes(host) ? PHASE1_PREVIEW_ACCESS_CODE_SHA256 : ''
}
