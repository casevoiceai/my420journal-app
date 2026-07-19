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
          minHeight: 'calc(100dvh - 102px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          paddingBottom: 'clamp(40px, 10vh, 90px)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{
          width: '100%',
          maxWidth: '820px',
          textAlign: 'center',
          backgroundColor: 'rgba(6,16,6,0.62)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border: `1px solid ${S.border}`,
          borderRadius: marketingPage.radius,
          padding: 'clamp(20px, 4vw, 40px)',
          boxSizing: 'border-box',
        }}>
          <h1 style={{
            margin: '0 0 20px 0',
            color: S.textPrimary,
            fontFamily: marketingFonts.playfair,
            fontSize: 'clamp(28px, 6vw, 53px)',
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            fontWeight: 700,
          }}>
            Stop guessing at the dispensary.
          </h1>
          <p style={{
            margin: '0 0 26px 0',
            color: S.textPrimary,
            fontSize: 'clamp(16px, 3vw, 24px)',
            lineHeight: 1.55,
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
            <Link to="/app" style={primaryButtonStyle}>
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
