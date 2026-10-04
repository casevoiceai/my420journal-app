import { Link } from 'react-router-dom'
import MarketingLayout from './MarketingLayout'
import { FeatureGrid } from './MarketingFeatures'
import { buildUSMarketPageModel } from './marketPageInheritance'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

const sectionStyle = {
  padding: 'clamp(56px, 8vw, 88px) 20px',
  boxSizing: 'border-box',
}

const innerStyle = {
  width: '100%',
  maxWidth: marketingPage.contentWidth,
  margin: '0 auto',
}

function CopySection({ heading, children, tone = 'base' }) {
  return (
    <section style={{ ...sectionStyle, backgroundColor: tone === 'surface' ? S.surface : S.bg }}>
      <div style={innerStyle}>
        <h2 style={{
          margin: '0 0 18px',
          color: S.gold,
          fontFamily: marketingFonts.playfair,
          fontSize: 'clamp(30px, 5vw, 46px)',
          lineHeight: 1.08,
        }}>
          {heading}
        </h2>
        <div style={{ color: S.textPrimary, fontSize: '17px', lineHeight: 1.72 }}>
          {children}
        </div>
      </div>
    </section>
  )
}

export default function USMarketPageTemplate({ record, packet }) {
  const page = buildUSMarketPageModel(record, packet)
  if (!page) return null

  return (
    <MarketingLayout>
      <section style={{ ...sectionStyle, paddingTop: 'clamp(46px, 7vw, 76px)' }}>
        <div style={innerStyle}>
          <p style={{
            margin: '0 0 18px',
            color: S.textSecondary,
            fontSize: '13px',
            lineHeight: 1.5,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            {page.breadcrumb.join(' → ')}
          </p>
          <p style={{ margin: '0 0 12px', color: S.gold, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {page.marketName}
          </p>
          <h1 style={{
            margin: '0 0 20px',
            color: S.textPrimary,
            fontFamily: marketingFonts.playfair,
            fontSize: 'clamp(40px, 7vw, 68px)',
            lineHeight: 1.02,
            letterSpacing: '-0.03em',
          }}>
            {page.heroTitle}
          </h1>
          <p style={{ margin: 0, color: S.textPrimary, fontSize: 'clamp(17px, 2.6vw, 21px)', lineHeight: 1.65 }}>
            {page.heroBody}
          </p>
        </div>
      </section>

      <FeatureGrid />

      <CopySection heading={page.useCaseTitle} tone="surface">
        <p style={{ margin: '0 0 16px' }}>{page.useCaseBody}</p>
        <p style={{ margin: 0, color: S.textSecondary }}>{page.inheritedRegional.contextBody}</p>
        {page.ageProgramText && <p style={{ margin: '16px 0 0', color: S.textSecondary }}>{page.ageProgramText}</p>}
      </CopySection>

      <CopySection heading={page.inheritedGlobal.privacyHeading}>
        <p style={{ margin: '0 0 16px' }}>{page.inheritedGlobal.privacyBody}</p>
        <Link to={page.inheritedGlobal.privacyHref} style={{ color: S.gold, fontWeight: 700 }}>
          Read the Privacy Notice
        </Link>
      </CopySection>

      <CopySection heading={page.inheritedGlobal.boundaryHeading} tone="surface">
        <p style={{ margin: 0 }}>{page.inheritedGlobal.boundaryBody}</p>
      </CopySection>

      <CopySection heading={page.inheritedGlobal.ctaHeading}>
        <p style={{ margin: '0 0 22px', color: S.textSecondary }}>
          Your market will be suggested when the private journal opens. You still confirm the market and complete the applicable age step before access.
        </p>
        <Link
          to={page.ctaHref}
          style={{
            minHeight: '52px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 22px',
            backgroundColor: S.gold,
            color: S.bg,
            borderRadius: '10px',
            fontWeight: 800,
            textDecoration: 'none',
          }}
        >
          Open My420Journal
        </Link>
        {page.footerNote && (
          <p style={{ margin: '22px 0 0', color: S.textSecondary, fontSize: '14px', lineHeight: 1.6 }}>
            {page.footerNote}
          </p>
        )}
      </CopySection>
    </MarketingLayout>
  )
}
