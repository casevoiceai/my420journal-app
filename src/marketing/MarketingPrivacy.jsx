import MarketingLayout from './MarketingLayout'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

const sections = [
  {
    heading: 'WHO WE ARE',
    paragraphs: [
      '420journal.app is a product of Vogtcom LLC, a Pennsylvania limited liability company based in Carbondale, Pennsylvania.',
      'Contact: casevoice.ai@gmail.com',
      '420journal.app is a private cannabis session journal. You log what you used, how you used it, and how it made you feel, in Body, Mind, and Mood terms. Your journal lives on your device.',
    ],
  },
  {
    heading: 'THE SHORT VERSION',
    paragraphs: [
      'Your journal data lives on your device. Nothing leaves your device without your permission. We do not sell your data. We do not share your individual session data with anyone. If you choose to turn on Shared Journey View, an anonymized signal from your sessions may contribute to a shared community pool, but your identity, your device, and your individual entries are never shown to anyone. You can opt out at any time.',
      'This is a cannabis product. Cannabis is legal for adults in Pennsylvania and in many other states. It remains federally illegal in the United States. You are responsible for knowing and following the laws in your jurisdiction.',
    ],
  },
  {
    heading: 'WHAT DATA WE COLLECT AND WHERE IT GOES',
    subsections: [
      {
        heading: 'Your journal data',
        paragraphs: [
          'Everything you log in the app, products used, dose, method, effects, notes, session ratings, is stored only on your device in local storage. It does not go to any Vogtcom server automatically. You can download a local backup of your own data at any time from Settings.',
        ],
      },
      {
        heading: 'Shared Journey View (opt-in only)',
        paragraphs: [
          'This feature is off by default. If you turn it on, entries you save going forward can contribute an anonymized signal to a shared community pool. Entries from before you opted in are not included.',
          "Your contribution is stored with a random identifier only, never your name, email, or device information. When someone views a community signal, they see only a combined result, such as a percentage of contributors who reported a certain effect for a certain product. No one, including Vogtcom staff, can view a single contributor's specific entry through this feature.",
          'A minimum number of contributors is required before any signal is shown for a given product or area. This exists to make it harder for a small group of contributions to be traced back to any one person.',
          'If you opt out, your future contributions stop immediately, and your existing anonymized contributions are removed from the shared pool within 24 hours.',
        ],
      },
      {
        heading: 'The dispensary data layer',
        paragraphs: [
          'Dispensaries that subscribe to mydispensarydata.com receive access to the same kind of aggregate signals described above. They do not receive individual user data, your name, your device identifier, or anything that could identify you personally. They receive only combined counts and percentages.',
        ],
      },
      {
        heading: 'What we do not collect',
        paragraphs: [
          'We do not collect your individual journal entries on any Vogtcom server unless you opt in to Shared Journey View.',
          'We do not require an account to use the app.',
          'We do not use advertising trackers in the journal.',
          'We do not sell your individual data.',
          'We do not share your individual data with dispensaries or any other third party.',
        ],
      },
    ],
  },
  {
    heading: 'FEDERAL LAW NOTICE',
    paragraphs: [
      'Cannabis is classified as a Schedule I controlled substance under federal law in the United States, regardless of state law. Your journal data exists on your device. If your device is seized pursuant to a legal process, data on your device may be accessible to law enforcement. You are responsible for knowing and following the cannabis laws in your jurisdiction. This app is intended for adults 21 and over.',
    ],
  },
  {
    heading: 'YOUR RIGHTS',
    paragraphs: [
      'Your journal data belongs to you. We do not claim any rights to it. To delete your journal data, use the delete or clear function within the app.',
      'If you have turned on Shared Journey View, you can turn it off at any time in Settings. Doing so stops all future contributions immediately and removes your existing contributions from the shared pool within 24 hours. Your individual device data is never affected by this setting.',
      'California residents have rights under the California Consumer Privacy Act regarding personal information. Because we do not store your individual journal data on any Vogtcom server unless you opt in, most CCPA rights apply specifically to the Shared Journey View feature, where you have the right to opt out at any time as described above.',
    ],
  },
  {
    heading: 'AGE RESTRICTION',
    paragraphs: [
      'This app is intended for adults 21 and over. By using this app you confirm that you are 21 or older and that cannabis use is legal in your jurisdiction.',
    ],
  },
  {
    heading: 'CHILDREN',
    paragraphs: [
      'This app is not directed at anyone under 21 and not intended for anyone under 18. We do not knowingly collect personal information from minors. If you believe a minor has used this app, contact us at casevoice.ai@gmail.com.',
    ],
  },
  {
    heading: 'COOKIES AND TRACKING',
    paragraphs: [
      'We do not use advertising cookies or third-party tracking pixels in the journal.',
    ],
  },
  {
    heading: 'CHANGES TO THIS POLICY',
    paragraphs: [
      'We will update this policy when our practices change and update the date at the top when we do.',
    ],
  },
  {
    heading: 'CONTACT US',
    paragraphs: [
      <>Vogtcom LLC<br />Carbondale, Pennsylvania<br />casevoice.ai@gmail.com</>,
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
              MY420JOURNAL PRIVACY POLICY
            </h1>
            <PolicyParagraph>Last updated: August 1, 2026</PolicyParagraph>

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

                {section.paragraphs?.map((paragraph, index) => (
                  <PolicyParagraph key={`${section.heading}-${index}`}>{paragraph}</PolicyParagraph>
                ))}

                {section.subsections?.map((subsection) => (
                  <section key={subsection.heading} style={{ marginTop: '26px' }}>
                    <h3 style={{
                      margin: '0 0 12px 0',
                      color: S.textPrimary,
                      fontFamily: marketingFonts.playfair,
                      fontSize: '24px',
                      lineHeight: 1.25,
                    }}>
                      {subsection.heading}
                    </h3>
                    {subsection.paragraphs.map((paragraph, index) => (
                      <PolicyParagraph key={`${subsection.heading}-${index}`}>{paragraph}</PolicyParagraph>
                    ))}
                  </section>
                ))}
              </section>
            ))}
          </article>
        </div>
      </section>
    </MarketingLayout>
  )
}
