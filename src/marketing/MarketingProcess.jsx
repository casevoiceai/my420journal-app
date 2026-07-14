import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'
import processStep1Image from './ProcessStep1.png'
import processStep2Image from './FeatureCard2.png'
import processStep3Image from './ProcessStep3.png'

const processSteps = [
  {
    step: 'Step 1',
    title: 'Log Your Experience',
    body: <>
      Strain - Dose - Method - Mood<br />
      Capture what you tried and how it felt<br />
      before the memory gets blurry
    </>,
    image: processStep1Image,
  },
  {
    step: 'Step 2',
    title: 'Meet Your Guide',
    body: <>
      Ask your guide what stands out in your own entries.<br />
      No outside data. No assumptions.<br />
      They never know more than what you've logged.
    </>,
    image: processStep2Image,
  },
  {
    step: 'Step 3',
    title: 'Learn What Works',
    body: <>
      Track patterns pulled from your own entries.<br />
      No guesswork. No starting from scratch every time.<br />
      See what worked and what's worth another try.
    </>,
    image: processStep3Image,
    imageHeight: '430px',
    imagePosition: '28% center',
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
          <h2 style={{
            margin: '0 0 14px 0',
            color: S.gold,
            fontFamily: marketingFonts.playfair,
            fontSize: 'clamp(34px, 6vw, 64px)',
            lineHeight: 1.02,
            letterSpacing: '-0.03em',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}>
            Log it. Track it. Remember it.
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
              <img
                src={item.image}
                alt={item.title}
                style={{
                  display: 'block',
                  width: '100%',
                  height: item.imageHeight ?? '350px',
                  objectFit: 'cover',
                  objectPosition: item.imagePosition ?? 'center',
                  borderRadius: '14px',
                  border: `1px solid ${S.border}`,
                  boxSizing: 'border-box',
                }}
              />
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
                margin: 0,
                color: S.textSecondary,
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