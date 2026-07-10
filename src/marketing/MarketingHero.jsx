import { Link } from 'react-router-dom'
import heroDispensaryImage from './hero-dispensary.png'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'
import { primaryButtonStyle } from './MarketingShared'

export function HeroSection() {
  return (
    <section
      id="home"
      className="marketing-section marketing-section-bg-base"
      style={{
        position: 'relative',
        minHeight: 'calc(100dvh - 102px)',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${heroDispensaryImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 35%',
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg, rgba(10,26,10,0.15) 0%, rgba(10,26,10,0.30) 40%, rgba(10,26,10,0.70) 68%, rgba(10,26,10,0.88) 100%)',
      }} />

      <div
        className="marketing-section-inner"
        style={{
          position: 'relative',
          maxWidth: marketingPage.maxWidth,
          minHeight: 'calc(100dvh - 102px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          paddingBottom: '10vh',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ maxWidth: '560px', textAlign: 'center' }}>
          <h1 style={{
            margin: '0 0 22px 0',
            color: S.textPrimary,
            fontFamily: marketingFonts.playfair,
            fontSize: 'clamp(24px, 3.4vw, 42px)',
            whiteSpace: 'nowrap',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            fontWeight: 700,
            textShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}>
            Stop guessing at the dispensary.
          </h1>
          <p style={{
            margin: '0 0 30px 0',
            color: S.textPrimary,
            fontSize: 'clamp(16px, 2vw, 19px)',
            lineHeight: 1.55,
            textShadow: '0 2px 18px rgba(0,0,0,0.4)',
          }}>
            Log what you tried. See what actually worked. <br />
            Nothing leaves your device unless you choose to share it.
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            flexWrap: 'wrap',
          }}>
            <Link
              to="/app"
              style={primaryButtonStyle}
            >
              Start your research
            </Link>
            <a
              href="#process"
              style={{
                color: S.textPrimary,
                fontSize: '15px',
                fontWeight: 800,
                textDecoration: 'none',
                borderBottom: `1px solid ${S.gold}`,
                paddingBottom: '4px',
                textShadow: '0 2px 12px rgba(0,0,0,0.4)',
              }}
            >
              Learn how it works below
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
