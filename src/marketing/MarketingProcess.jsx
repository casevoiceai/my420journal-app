import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'
import processStep1Image from './ProcessStep1.png'
import processStep2Image from './FeatureCard2.png'
import processStep3Image from './ProcessStep3.png'

const processSteps = [
  {
    step: 'Step 1',
    title: 'Log Your Experience',
    mobileLines: [
      'Strain - Dose - Method - Mood.',
      'Capture what you tried and how it felt before the memory gets blurry.',
    ],
    desktopLines: [
      'Strain - Dose - Method - Mood',
      'Capture what you tried and how it felt',
      'before the memory gets blurry',
    ],
    image: processStep1Image,
  },
  {
    step: 'Step 2',
    title: 'Use Your Guide',
    mobileLines: [
      'Talk through what you choose to enter in the guide conversation.',
      'The guide does not independently read or analyze your journal history.',
      "Guide choice changes tone and conversation style, not access to different journal data.",
    ],
    desktopLines: [
      'Talk through what you choose to enter in the guide conversation.',
      'The guide does not independently read or analyze your journal history.',
      "Guide choice changes tone and conversation style, not access to different journal data.",
    ],
    image: processStep2Image,
  },
  {
    step: 'Step 3',
    title: 'Review Your Patterns',
    mobileLines: [
      'See simple counts calculated from entries stored on this device.',
      'Compare the products, times, and effect tags you recorded.',
      "The app shows your history; it does not tell you what to buy or use.",
    ],
    desktopLines: [
      'See simple counts calculated from entries stored on this device.',
      'Compare the products, times, and effect tags you recorded.',
      "The app shows your history; it does not tell you what to buy or use.",
    ],
    image: processStep3Image,
    imageScale: 1.23,
    imageOrigin: '28% 50%',
  },
]

export function ProcessSection() {
  return (
    <section
      id="process"
      className="marketing-section marketing-section-bg-surface"
    >
      <style>{`
        .card-copy-desktop {
          display: block;
          width: 100%;
          margin: 0 auto;
          font-size: 15px;
          line-height: 1.65;
          text-align: center;
        }

        .card-copy-mobile {
          display: none;
        }

        @media (max-width: 767px) {
          .card-copy-desktop {
            display: none;
          }

          .card-copy-mobile {
            display: flex;
            width: 100%;
            margin: 0;
            flex-direction: column;
            gap: 6px;
            font-size: 17px;
            line-height: 1.5;
            text-align: center;
            overflow-wrap: normal;
            word-break: normal;
            hyphens: none;
          }

          .card-copy-mobile-line {
            display: block;
            width: 100%;
            margin: 0;
          }
        }
      `}</style>

      <div
        className="marketing-section-inner"
        style={{ maxWidth: '1600px' }}
      >
        <div style={{ marginBottom: '106px' }}>
          <h2
            className="marketing-process-heading"
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
            <span>Log it.</span>{' '}
            <span>Track it.</span>{' '}
            <span>Remember it.</span>
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(325px, 100%), 1fr))',
          gap: '18px',
          alignItems: 'stretch',
        }}>
          {processSteps.map((item) => (
            <article
              key={item.step}
              style={{
                backgroundColor: S.surface,
                border: `1px solid ${S.border}`,
                borderRadius: marketingPage.radius,
                padding: '18px',
                boxSizing: 'border-box',
                minWidth: 0,
              }}
            >
              {item.imageScale ? (
                <div style={{
                  width: '100%',
                  height: '350px',
                  overflow: 'hidden',
                  borderRadius: '14px',
                  border: `1px solid ${S.border}`,
                  boxSizing: 'border-box',
                }}>
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{
                      display: 'block',
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: `scale(${item.imageScale})`,
                      transformOrigin: item.imageOrigin,
                    }}
                  />
                </div>
              ) : (
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
              )}

              <p style={{
                margin: '18px 0 8px 0',
                color: S.gold,
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}>
                {item.step}
              </p>

              <h3 style={{
                margin: '0 0 10px 0',
                color: S.textPrimary,
                fontFamily: marketingFonts.playfair,
                fontSize: '26px',
                lineHeight: 1.18,
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
