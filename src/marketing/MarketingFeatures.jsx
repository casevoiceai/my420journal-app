import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'
import { PlaceholderBox } from './MarketingShared'

const featureCards = [
  'Scan any label',
  'Log by voice',
  'Nothing stored without your choice',
]

export function FeatureGrid() {
  return (
    <section className="marketing-section marketing-section-bg-base">
      <div
        className="marketing-section-inner"
        style={{
          maxWidth: '1304px',
        }}
      >
        <div style={{ marginBottom: '56px' }}>
          <h2 style={{
            margin: '0 0 14px 0',
            color: S.textPrimary,
            fontFamily: marketingFonts.playfair,
            fontSize: 'clamp(20px, 3.6vw, 44px)',
            lineHeight: 1.02,
            letterSpacing: '-0.03em',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}>
            Small actions that make the next visit easier.
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(325px, 100%), 1fr))',
          gap: '18px',
          alignItems: 'stretch',
        }}>
          {featureCards.map((label) => (
            <article
              key={label}
              style={{
                backgroundColor: S.surface,
                border: `1px solid ${S.border}`,
                borderRadius: marketingPage.radius,
                padding: '18px',
                boxSizing: 'border-box',
                minWidth: 0,
              }}
            >
              <PlaceholderBox label={label} minHeight="350px" />
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
