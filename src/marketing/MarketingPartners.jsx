import MarketingLayout from './MarketingLayout'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

export default function MarketingPartners() {
  return (
    <MarketingLayout>
      <section className="marketing-section marketing-section-bg-base">
        <div
          className="marketing-section-inner"
          style={{ maxWidth: marketingPage.contentWidth }}
        >
          <article style={{
            backgroundColor: S.surface,
            border: `1px solid ${S.border}`,
            borderRadius: marketingPage.radius,
            padding: 'clamp(28px, 6vw, 56px)',
            boxSizing: 'border-box',
          }}>
            <p style={{
              margin: '0 0 16px 0',
              color: S.gold,
              fontFamily: marketingFonts.inter,
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>
              Partner program status
            </p>

            <h1 style={{
              margin: '0 0 24px 0',
              color: S.textPrimary,
              fontFamily: marketingFonts.playfair,
              fontSize: 'clamp(38px, 7vw, 64px)',
              lineHeight: 1.04,
              letterSpacing: '-0.03em',
            }}>
              Partner access is not active yet.
            </h1>

            <p style={{
              margin: '0 0 20px 0',
              color: S.textSecondary,
              fontFamily: marketingFonts.inter,
              fontSize: '17px',
              lineHeight: 1.75,
            }}>
              My420Journal is currently focused on the private, local-first journal. Shared Journey / Layer 2 and aggregate partner data are disabled while that architecture is redesigned and reviewed.
            </p>

            <p style={{
              margin: 0,
              color: S.textSecondary,
              fontFamily: marketingFonts.inter,
              fontSize: '17px',
              lineHeight: 1.75,
            }}>
              Future partner programs will be reviewed for the specific market and use case before activation. Partners will not receive access to a user's raw private journal or private notes.
            </p>
          </article>
        </div>
      </section>
    </MarketingLayout>
  )
}
