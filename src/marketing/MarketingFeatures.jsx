import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'
import featureCard1Image from './FeatureCard1.png'
import featureCard2Image from './ProcessStep2.png'
import featureCard3Image from './FeatureCard3.png'

const featureCards = [
  {
    title: 'Scan any label',
    body: <>
      Point your camera at any label and let it capture the details.<br className="desktop-card-break" />{' '}
      It reads the strain, dose, and method automatically.<br className="desktop-card-break" />{' '}
      No manual typing, no guessing at what you jotted down later.
    </>,
    image: featureCard1Image,
  },
  {
    title: 'Log by voice',
    body: <>
      Say what happened out loud and let it become the entry.<br className="desktop-card-break" />{' '}
      Your words get logged exactly as spoken, hands free.<br className="desktop-card-break" />{' '}
      No typing, no forms, no digging for your phone's keyboard.
    </>,
    image: featureCard2Image,
  },
  {
    title: 'Nothing stored without your choice',
    body: <>
      Nothing saves anywhere until you decide it should.<br className="desktop-card-break" />{' '}
      You control exactly what gets kept and what doesn't.<br className="desktop-card-break" />{' '}
      Delete any entry, any time. No trace, ever.
    </>,
    image: featureCard3Image,
  },
]

export function FeatureGrid() {
  return (
    <section className="marketing-section marketing-section-bg-base">
      <div
        className="marketing-section-inner"
        style={{
          maxWidth: '1600px',
        }}
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
              <p style={{
                margin: 0,
                color: S.textPrimary,
                fontSize: '15px',
                lineHeight: 1.65,
                textAlign: 'center',
              }}>
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
