import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'
import featureCard1Image from './FeatureCard1.png'
import featureCard2Image from './ProcessStep2.png'
import featureCard3Image from './FeatureCard3.png'

const featureCards = [
  {
    title: 'Record the details that matter',
    mobileLines: [
      'Product. Amount. Method. What happened.',
      'Keep the details you will actually want later.',
      'Manual entry is available now. Label scanning is still planned.',
    ],
    desktopLines: [
      'Product. Amount. Method. What happened.',
      'Keep the details you will actually want later.',
      'Manual entry is available now. Label scanning is still planned.',
    ],
    image: featureCard1Image,
  },
  {
    title: 'Draft by voice',
    mobileLines: [
      'Speak a draft instead of typing.',
      'Review it. Edit it. Save it when it is right.',
      'Voice input depends on your browser and device.',
    ],
    desktopLines: [
      'Speak a draft instead of typing.',
      'Review it. Edit it. Save it when it is right.',
      'Voice input depends on your browser and device.',
    ],
    image: featureCard2Image,
  },
  {
    title: 'Keep it private, even on-screen',
    mobileLines: [
      'Your journal stays in this browser on this device.',
      'Privacy skins are planned to make the screen look more neutral.',
      'They change the look, not where your journal is stored.',
    ],
    desktopLines: [
      'Your journal stays in this browser on this device.',
      'Privacy skins are planned to make the screen look more neutral.',
      'They change the look, not where your journal is stored.',
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
            <span>A record you can use later.</span>{' '}
            <span>Privacy you control now.</span>
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
