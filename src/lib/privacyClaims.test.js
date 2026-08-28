import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

function read(relativePath) {
  return fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

const hero = read('../marketing/MarketingHero.jsx')
const layout = read('../marketing/MarketingLayout.jsx')
const process = read('../marketing/MarketingProcess.jsx')
const about = read('../marketing/MarketingAbout.jsx')
const features = read('../marketing/MarketingFeatures.jsx')
const privacy = read('../marketing/MarketingPrivacy.jsx')
const faq = read('../marketing/MarketingFAQ.jsx')
const settings = read('../screens/Settings.jsx')
const onboarding = read('../screens/Onboarding.jsx')
const newEntry = read('../screens/NewEntry.jsx')
const guide = read('../screens/Guide.jsx')
const home = read('../screens/Home.jsx')
const readme = read('../../README.md')
const allClaims = [hero, layout, process, about, features, privacy, faq, settings, onboarding, newEntry, guide, home, readme].join(String.fromCharCode(10))

const bannedClaims = [
  'Nothing leaves your device unless you choose to share it.',
  'Scan any label',
  'It reads the strain, dose, and method automatically.',
  'logged exactly as spoken',
  'No trace, ever.',
  'Everything in this app stays on this device only.',
  'No data was sent to any server.',
  'The only copy of your journal is on this device.',
  'Dispensary deals and trip planning.',
  'Tracks dispensary prices and deals near you',
  'keep an eye on prices',
  'No backup or cross-device sync is included in this build.',
  'I pulled up a few options near you.',
  'I know what you like. What do you need?',
  'I have been looking at your log.',
  'Want to pull up your full terpene history?',
  '(already thinking about your terpene profile)',
  'You look better than last week. Am I right?',
  'Tracks emotional patterns over time',
  'Builds your personal terpene response profile',
  'Connects usage patterns to wellness outcomes',
  'unlocks a different layer of the app',
  'What are we shopping for?',
  'Log something. I will look at it.',
  'Already have an account? Sign in',
  'opt-in Shared Signals feature.',
  'Ask your guide what stands out in your own entries.',
  "They never know more than what you've logged.",
  'Learn What Works',
  "See what worked and what's worth another try.",
  'You can scan a label instead of typing everything manually.',
  'He talks deals, trip planning, and budget',
  'Terpenes, cannabinoids, pattern analysis.',
  'as a hard rule across this app, not as a policy I could soften later.',
  'remembering what worked should not depend on guesswork.',
  'It is a hard rule built into how the app works, not a policy we can quietly change later.',
]

test('retired absolute and unimplemented feature claims do not return', () => {
  for (const claim of bannedClaims) {
    assert.equal(allClaims.includes(claim), false, `retired claim returned: ${claim}`)
  }
})

test('current disclosures describe the implemented privacy boundaries', () => {
  assert.equal(privacy.includes("heading: 'OPTIONAL NETWORK FEATURES'"), true)
  assert.equal(privacy.includes('Shared Journey / Layer 2 is currently OFF.'), true)
  assert.equal(privacy.includes('precise device GPS'), true)
  assert.equal(features.includes('Camera label scanning is not available yet.'), true)
  assert.equal(readme.includes('Local JSON backup export/import is included.'), true)
  assert.equal(settings.includes('anonymous local profile'), true)
  assert.equal(onboarding.includes("tag: 'PRACTICAL TRIP JOURNAL'"), true)
  assert.equal(newEntry.includes('Camera scanning is not available yet.'), true)
  assert.equal(onboarding.includes('choosing a guide does not unlock different app features'), true)
  assert.equal(onboarding.includes('does not build a terpene-response profile'), true)
  assert.equal(settings.includes('Practical trip-and-history tone.'), true)
  assert.equal(guide.includes('Ready to talk through what you logged?'), true)
  assert.equal(home.includes('What are we logging today?'), true)
  assert.equal(layout.includes('Open my journal'), true)
  assert.equal(layout.includes('Shared Journey / Layer 2 is currently off'), true)
  assert.equal(process.includes('does not independently read or analyze your journal history'), true)
  assert.equal(process.includes('does not tell you what to buy or use'), true)
  assert.equal(about.includes('camera label scanning is not available yet'), true)
  assert.equal(about.includes('does not pull live deals, prices, nearby options, or purchasing recommendations'), true)
  assert.equal(about.includes('does not independently analyze your journal history'), true)
  assert.equal(about.includes('Some optional features use network services'), true)
  assert.equal(about.includes('This is an engineering principle.'), true)
})
