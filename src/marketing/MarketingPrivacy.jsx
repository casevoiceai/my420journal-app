import MarketingLayout from './MarketingLayout'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

const sections = [
  {
    heading: 'WHO WE ARE',
    paragraphs: [
      'My420Journal is a product of Vogtcom LLC, a Pennsylvania limited liability company. The canonical public website is my420journal.com.',
      'Contact: vogtcomllc@gmail.com',
    ],
  },
  {
    heading: 'THE SHORT VERSION',
    paragraphs: [
      'My420Journal is currently in a limited private testing phase. The private journal is designed to keep journal entries, notes, profile settings, and guide settings on the device in browser local storage.',
      'Shared Journey / Layer 2 is disabled while its privacy architecture is redesigned and reviewed. The current build does not intentionally submit new journal contributions to the shared-data service.',
    ],
  },
  {
    heading: 'LOCAL JOURNAL DATA',
    paragraphs: [
      'Journal entries and private notes are stored on the device in browser local storage. They are not automatically copied to a Vogtcom journal server.',
      'Browser local storage can be cleared by the user, browser, operating system, or device-management tools. Data on a device may also be accessible to another person with access to that device or through lawful device access. Local-first design reduces data exposure; it does not make device data impossible to access.',
    ],
  },
  {
    heading: 'LOCAL PROFILE — NO EMAIL OR PASSWORD REQUIRED',
    paragraphs: [
      'The private journal uses an anonymous local profile ID on the device. A name, email address, and password are not required to create or reopen the private journal.',
      'For an older private-testing profile that is already active on a device, My420Journal preserves the existing internal profile ID so its journal rows remain linked, while removing the old locally stored email and password-digest fields from that active profile. If more than one older local profile exists and no active profile is known, the user must choose which existing journal to resume; the others are preserved rather than deleted.',
      'The local profile is not a cloud account and does not provide cross-device sync.',
    ],
  },
  {
    heading: 'SHARED JOURNEY / LAYER 2',
    paragraphs: [
      'Shared Journey / Layer 2 is currently OFF. The opt-in control and shared-results experience are unavailable in the current build, and new shared contributions are blocked by the application submission path.',
      'If a tester previously opted in, the application disables that local opt-in when the app starts, clears pending shared-contribution retries, and attempts to send an opt-out deletion request using the previously generated anonymous contributor identifier. The current cleanup service schedules deletion after an accepted opt-out request.',
      'The Layer 2 source code and service history are being preserved for redesign and review. No claim is made that the previous Layer 2 implementation achieved legal anonymization.',
    ],
  },
  {
    heading: 'PARTNERS',
    paragraphs: [
      'No active partner data program is being offered in the current private-testing build. The partner program is on hold while Layer 2 is redesigned and reviewed.',
      'A dispensary, cannabis brand, or other partner does not receive access to a user\'s raw private journal or private notes through the private journal system.',
    ],
  },
  {
    heading: 'TRACKING',
    paragraphs: [
      'The private journal is not designed to use advertising trackers to build an advertising profile from private journal activity.',
      'Future public-site analytics, referral measurement, partner attribution, or age-assurance tools must remain separated from private journal contents and will require their own privacy review before activation.',
    ],
  },
  {
    heading: 'AGE AND LOCATION',
    paragraphs: [
      'Cannabis and cannabis-related rules vary by location and use case. My420Journal does not treat a user\'s location choice as proof that any cannabis activity is lawful.',
      'The current private-testing age flow is being revised into a market-specific age-assurance system. My420Journal does not currently require Vogtcom to store a government ID image as part of the private journal.',
    ],
  },
  {
    heading: 'YOUR CONTROLS',
    paragraphs: [
      'Users can delete journal entries through the app. Because the private journal is local-first, clearing browser site data can also remove local journal data.',
      'A PIN can be used as an additional in-app privacy control. A PIN does not replace device security and does not make data immune from device-level access.',
    ],
  },
  {
    heading: 'CHANGES TO THIS NOTICE',
    paragraphs: [
      'This notice will be updated when the product architecture, data flows, or public availability change. My420Journal remains in private testing while the current redesign is underway.',
    ],
  },
  {
    heading: 'CONTACT',
    paragraphs: [
      'Vogtcom LLC — Carbondale, Pennsylvania — vogtcomllc@gmail.com',
    ],
  },
]

function PolicyParagraph({ children }) {
  return (
    <p style={{
      margin: '0 0 18px 0',
      color: S.textSecondary,
      fontFamily: marketingFonts.inter,
      fontSize: '16px',
      lineHeight: 1.75,
    }}>
      {children}
    </p>
  )
}

export default function MarketingPrivacy() {
  return (
    <MarketingLayout>
      <section className="marketing-section marketing-section-bg-base">
        <div
          className="marketing-section-inner"
          style={{ maxWidth: marketingPage.contentWidth }}
        >
          <article style={{
            backgroundColor: S.surface,
            border: `1px solid ${S.border}`,
            borderRadius: marketingPage.radius,
            padding: 'clamp(24px, 5vw, 48px)',
            boxSizing: 'border-box',
          }}>
            <h1 style={{
              margin: '0 0 14px 0',
              color: S.textPrimary,
              fontFamily: marketingFonts.playfair,
              fontSize: 'clamp(38px, 7vw, 64px)',
              lineHeight: 1.04,
              letterSpacing: '-0.03em',
            }}>
              MY420JOURNAL PRIVACY NOTICE
            </h1>
            <PolicyParagraph>Last updated: August 27, 2026</PolicyParagraph>

            {sections.map((section) => (
              <section key={section.heading} style={{ marginTop: '34px' }}>
                <h2 style={{
                  margin: '0 0 16px 0',
                  color: S.gold,
                  fontFamily: marketingFonts.inter,
                  fontSize: '16px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  lineHeight: 1.4,
                }}>
                  {section.heading}
                </h2>
                {section.paragraphs.map((paragraph, index) => (
                  <PolicyParagraph key={`${section.heading}-${index}`}>{paragraph}</PolicyParagraph>
                ))}
              </section>
            ))}
          </article>
        </div>
      </section>
    </MarketingLayout>
  )
}
