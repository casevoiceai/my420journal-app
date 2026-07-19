import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'
import processStep1Image from './ProcessStep1.png'
import processStep2Image from './FeatureCard2.png'
import processStep3Image from './ProcessStep3.png'

const processSteps = [
  {
    step: 'Step 1',
    title: 'Log Your Experience',
    mobileBody: 'Strain - Dose - Method - Mood. Capture what you tried and how it felt before the memory gets blurry.',
    desktopLines: [
      'Strain - Dose - Method - Mood',
      'Capture what you tried and how it felt',
      'before the memory gets blurry',
    ],
    image: processStep1Image,
  },
  {
    step: 'Step 2',
    title: 'Meet Your Guide',
    mobileBody: "Ask your guide what stands out in your own entries. No outside data. No assumptions. They never know more than what you've logged.",
    desktopLines: [
      'Ask your guide what stands out in your own entries.',
      'No outside data. No assumptions.',
      "They never know more than what you've logged.",
    ],
    image: processStep2Image,
  },
  {
    step: 'Step 3',
    title: 'Learn What Works',
    mobileBody: "Track patterns pulled from your own entries. No guesswork. No starting from scratch every time. See what worked and what's worth another try.",
    desktopLines: [
      'Track patterns pulled from your own entries.',
      'No guesswork. No starting from scratch every time.',
      "See what worked and what's worth another try.",
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
            display: block;
            width: 100%;
            margin: 0;
            font-size: 16px;
            line-height: 1.6;
            text-align: left;
            overflow-wrap: normal;
            word-break: normal;
            hyphens: none;
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

              <p className="card-copy-mobile" style={{ color: S.textPrimary }}>
                {item.mobileBody}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
