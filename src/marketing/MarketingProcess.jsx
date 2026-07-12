import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'
import { PlaceholderBox } from './MarketingShared'

const processSteps = [
  {
    step: 'Step 1',
    title: 'Log Your Experience',
    body: 'Capture what you tried and how it felt before the memory gets blurry. Strain, dose, method, mood before and after.',
    placeholder: 'Log Your Experience',
  },
  {
    step: 'Step 2',
    title: 'Meet Your Guide',
    body: 'Ask your guide what stands out. Your chosen guide only speaks when you ask, and only knows what you have logged yourself. No outside data. No assumptions.',
    placeholder: 'App preview coming soon',
  },
  {
    step: 'Step 3',
    title: 'Learn What Works',
    body: "Track patterns pulled from your own entries. Instead of starting from scratch every time, see what actually helped, what didn't, and what's worth trying again.",
    placeholder: 'Learn What Works',
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
          maxWidth: '1304px',
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
                backgroundColor: S.bg,
                border: `1px solid ${S.border}`,
                borderRadius: marketingPage.radius,
                padding: '18px',
                boxSizing: 'border-box',
                minWidth: 0,
              }}
            >
              <PlaceholderBox label={item.placeholder} minHeight="350px" />
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
