import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'
import { SectionHeader, PlaceholderBox } from './MarketingShared'

const processSteps = [
  {
    step: 'Step 1',
    title: 'Log what happened.',
    body: 'Capture what you tried and how it felt before the memory gets blurry.',
    placeholder: 'Log what happened.',
  },
  {
    step: 'Step 2',
    title: 'Your guide helps you notice patterns.',
    body: 'Ask your guide what stands out. It only speaks when you ask, and it only knows what you have logged yourself.',
    placeholder: 'App preview coming soon',
  },
  {
    step: 'Step 3',
    title: "See what you've learned about yourself.",
    body: 'Come back to patterns instead of starting from scratch every time.',
    placeholder: "See what you've learned about yourself.",
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
          maxWidth: marketingPage.maxWidth,
        }}
      >
        <SectionHeader
          eyebrow="The Process"
          title="Three steps, one private record."
          body="The structure stays simple. Log the moment, let the app keep track, and return to what your own history has already taught you."
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
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
              <PlaceholderBox label={item.placeholder} minHeight="280px" />
              <p style={{
                margin: '18px 0 8px 0',
                color: S.gold,
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}>
                {item.step}
              </p>
              <h3 style={{
                margin: '0 0 10px 0',
                color: S.textPrimary,
                fontFamily: marketingFonts.playfair,
                fontSize: '26px',
                lineHeight: 1.18,
              }}>
                {item.title}
              </h3>
              <p style={{
                margin: 0,
                color: S.textSecondary,
                fontSize: '15px',
                lineHeight: 1.65,
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
