import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'
import { SectionHeader, PlaceholderBox } from './MarketingShared'

const featureCards = [
  'Scan any label',
  'Log by voice',
  'Nothing stored without your choice',
  'Leave instantly, anytime.',
]

export function FeatureGrid() {
  return (
    <section className="marketing-section marketing-section-bg-base">
      <div
        className="marketing-section-inner"
        style={{
          maxWidth: marketingPage.maxWidth,
        }}
      >
        <SectionHeader
          eyebrow="Built for real use"
          title="Small actions that make the next visit easier."
          body="Every feature exists to help you remember what worked without turning your private journal into someone else's data source."
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}>
          {featureCards.map((label) => (
            <article
              key={label}
              style={{
                backgroundColor: S.surface,
                border: `1px solid ${S.border}`,
                borderRadius: marketingPage.radius,
                padding: '16px',
                boxSizing: 'border-box',
              }}
            >
              <PlaceholderBox label={label} minHeight="190px" />
              <h3 style={{
                margin: '16px 0 0 0',
                color: S.textPrimary,
                fontFamily: marketingFonts.playfair,
                fontSize: '23px',
                lineHeight: 1.2,
              }}>
                {label}
              </h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
