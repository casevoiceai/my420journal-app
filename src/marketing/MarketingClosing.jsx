import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'
import { PlaceholderBox } from './MarketingShared'

export function ClosingSection() {
  return (
    <section className="marketing-section marketing-section-bg-base">
      <div
        className="marketing-section-inner"
        style={{
          maxWidth: marketingPage.maxWidth,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '28px',
          alignItems: 'center',
        }}
      >
        <PlaceholderBox label="Private record placeholder" minHeight="320px" />
        <p style={{
          margin: 0,
          color: S.textPrimary,
          fontFamily: marketingFonts.playfair,
          fontSize: 'clamp(30px, 5vw, 52px)',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
        }}>
          What you get is simple. A private record of what actually worked, ready whenever you need to remember it.
        </p>
      </div>
    </section>
  )
}
