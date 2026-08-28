import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

function read(relativePath) {
  return fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

const hero = read('../marketing/MarketingHero.jsx')
const features = read('../marketing/MarketingFeatures.jsx')
const privacy = read('../marketing/MarketingPrivacy.jsx')
const faq = read('../marketing/MarketingFAQ.jsx')
const settings = read('../screens/Settings.jsx')
const onboarding = read('../screens/Onboarding.jsx')
const newEntry = read('../screens/NewEntry.jsx')
const readme = read('../../README.md')
const allClaims = [hero, features, privacy, faq, settings, onboarding, newEntry, readme].join(String.fromCharCode(10))

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
  assert.equal(onboarding.includes("tag: 'DISPENSARY HISTORY'"), true)
  assert.equal(newEntry.includes('Camera scanning is not available yet.'), true)
})
