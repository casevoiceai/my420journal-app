import { Link } from 'react-router-dom'
import heroDispensaryImage from './hero-dispensary.png'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'
import { primaryButtonStyle } from './MarketingShared'

export function HeroSection() {
  return (
    <section
      id="home"
      className="marketing-section marketing-section-bg-base"
      style={{ position: 'relative' }}
    >
      <div
        className="marketing-section-inner"
        style={{
          maxWidth: marketingPage.maxWidth,
          boxSizing: 'border-box',
        }}
      >
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1448 / 656',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
        }}>
          <img
            src={heroDispensaryImage}
            alt="A customer checking my420journal on their phone at a dispensary counter"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />

          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(10,26,10,0.05) 0%, rgba(10,26,10,0.12) 36%, rgba(10,26,10,0.62) 60%, rgba(10,26,10,0.85) 100%)',
          }} />

          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '3% 4%',
            boxSizing: 'border-box',
          }}>
            <div style={{ maxWidth: '52%', textAlign: 'right' }}>
              <h1 style={{
                margin: '0 0 1.4% 0',
                color: S.textPrimary,
                fontFamily: marketingFonts.playfair,
                fontSize: 'clamp(18px, 3.6vw, 42px)',
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                fontWeight: 700,
                textShadow: '0 4px 24px rgba(0,0,0,0.45)',
              }}>
                Stop guessing at the dispensary.
              </h1>
              <p style={{
                margin: '0 0 2.2% 0',
                color: S.textPrimary,
                fontSize: 'clamp(9px, 1.3vw, 15px)',
                lineHeight: 1.45,
                textShadow: '0 2px 18px rgba(0,0,0,0.45)',
              }}>
                Log what you tried. See what actually worked. Nothing leaves your device unless you choose to share it.
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '2%',
                flexWrap: 'wrap',
              }}>
                <Link
                  to="/app"
                  style={{
                    ...primaryButtonStyle,
                    minHeight: 'clamp(24px, 4vw, 44px)',
                    padding: 'clamp(4px, 0.8vw, 12px) clamp(10px, 1.6vw, 20px)',
                    fontSize: 'clamp(9px, 1.2vw, 14px)',
                  }}
                >
                  Start your research
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '540px', textAlign: 'center', margin: '28px auto 0' }}>
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
    </section>
  )
}
