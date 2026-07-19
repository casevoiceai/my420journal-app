import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'
import processStep1Image from './ProcessStep1.png'
import processStep2Image from './FeatureCard2.png'
import processStep3Image from './ProcessStep3.png'

const processSteps = [
  {
    step: 'Step 1',
    title: 'Log Your Experience',
    body: 'Strain - Dose - Method - Mood. Capture what you tried and how it felt before the memory gets blurry.',
    image: processStep1Image,
  },
  {
    step: 'Step 2',
    title: 'Meet Your Guide',
    body: "Ask your guide what stands out in your own entries. No outside data. No assumptions. They never know more than what you've logged.",
    image: processStep2Image,
  },
  {
    step: 'Step 3',
    title: 'Learn What Works',
    body: "Track patterns pulled from your own entries. No guesswork. No starting from scratch every time. See what worked and what's worth another try.",
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
      <div
        className="marketing-section-inner"
        style={{
          maxWidth: '1600px',
        }}
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
              <p style={{
                width: '100%',
                maxWidth: '38ch',
                margin: '0 auto',
                color: S.textPrimary,
                fontSize: '16px',
                lineHeight: 1.6,
                textAlign: 'left',
                overflowWrap: 'normal',
                wordBreak: 'normal',
                hyphens: 'none',
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
