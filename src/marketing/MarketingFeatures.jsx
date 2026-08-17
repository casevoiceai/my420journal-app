import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'
import featureCard1Image from './FeatureCard1.png'
import featureCard2Image from './ProcessStep2.png'
import featureCard3Image from './FeatureCard3.png'

const featureCards = [
  {
    title: 'Scan any label',
    mobileLines: [
      'Point your camera at any label and let it capture the details.',
      'It reads the strain, dose, and method automatically.',
      'No manual typing, no guessing at what you jotted down later.',
    ],
    desktopLines: [
      'Point your camera at any label and let it capture the details.',
      'It reads the strain, dose, and method automatically.',
      'No manual typing, no guessing at what you jotted down later.',
    ],
    image: featureCard1Image,
  },
  {
    title: 'Log by voice',
    mobileLines: [
      'Say what happened out loud and let it become the entry.',
      'Your words get logged exactly as spoken, hands free.',
      "No typing, no forms, no digging for your phone's keyboard.",
    ],
    desktopLines: [
      'Say what happened out loud and let it become the entry.',
      'Your words get logged exactly as spoken, hands free.',
      "No typing, no forms, no digging for your phone's keyboard.",
    ],
    image: featureCard2Image,
  },
  {
    title: 'Private by default',
    mobileLines: [
      'Your private journal entries stay on your device.',
      'Optional Shared Journey contributions are off by default.',
      'Delete local entries any time. Shared contributions follow the separate rules in the Privacy Policy.',
    ],
    desktopLines: [
      'Your private journal entries stay on your device.',
      'Optional Shared Journey contributions are off by default.',
      'Delete local entries any time. Shared contributions follow the separate rules in the Privacy Policy.',
    ],
    image: featureCard3Image,
  },
]

export function FeatureGrid() {
  return (
    <section className="marketing-section marketing-section-bg-base">
      <div
        className="marketing-section-inner"
        style={{ maxWidth: '1600px' }}
      >
        <div style={{ marginBottom: '56px' }}>
          <h2
            className="marketing-features-heading"
            style={{
              margin: '0 0 14px 0',
              color: S.gold,
              fontFamily: marketingFonts.playfair,
              fontSize: 'clamp(34px, 6vw, 64px)',
              lineHeight: 1.02,
              letterSpacing: '-0.03em',
              textAlign: 'center',
            }}
          >
            <span>Small habits.</span>{' '}
            <span>Better visits.</span>
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(325px, 100%), 1fr))',
          gap: '18px',
          alignItems: 'stretch',
        }}>
          {featureCards.map((item) => (
            <article
              key={item.title}
              style={{
                backgroundColor: S.surface,
                border: `1px solid ${S.border}`,
                borderRadius: marketingPage.radius,
                padding: '18px',
                boxSizing: 'border-box',
                minWidth: 0,
              }}
            >
              <img
                src={item.image}
                alt={item.title}
                style={{
                  display: 'block',
                  width: '100%',
                  height: '350px',
                  objectFit: 'cover',
                  borderRadius: '14px',
                  border: `1px solid ${S.border}`,
                  boxSizing: 'border-box',
                }}
              />

              <h3 style={{
                margin: '16px 0 10px 0',
                color: S.textPrimary,
                fontFamily: marketingFonts.playfair,
                fontSize: '23px',
                lineHeight: 1.2,
                textAlign: 'center',
              }}>
                {item.title}
              </h3>

              <div className="card-copy-desktop" style={{ color: S.textPrimary }}>
                {item.desktopLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>

              <div className="card-copy-mobile" style={{ color: S.textPrimary }}>
                {item.mobileLines.map((line) => (
                  <p className="card-copy-mobile-line" key={line}>{line}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
