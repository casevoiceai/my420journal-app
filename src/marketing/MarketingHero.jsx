import { Link } from 'react-router-dom'
import heroDispensaryImage from './hero-dispensary.png'
import heroBrainMark from './hero-brain-mark.png'
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
          maxWidth: '920px',
          margin: '0 auto',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
        }}>
          <img
            src={heroDispensaryImage}
            alt="A customer checking my420journal on their phone at a dispensary counter"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />

          <div style={{
            position: 'absolute',
            left: '44.7%',
            top: '28.4%',
            width: '15.9%',
            height: '46.6%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            textAlign: 'center',
            overflow: 'hidden',
            padding: '4% 3%',
            boxSizing: 'border-box',
          }}>
            <img
              src={heroBrainMark}
              alt=""
              style={{
                width: '38%',
                height: 'auto',
                marginBottom: '6%',
                flexShrink: 0,
              }}
            />
            <h1 style={{
              margin: '0 0 4% 0',
              color: '#12210f',
              fontFamily: marketingFonts.playfair,
              fontSize: 'clamp(9px, 2.6vw, 15px)',
              lineHeight: 1.05,
              letterSpacing: '-0.01em',
              fontWeight: 700,
            }}>
              Stop guessing at the dispensary.
            </h1>
            <p style={{
              margin: 0,
              color: '#3a4a35',
              fontSize: 'clamp(6px, 1.5vw, 9px)',
              lineHeight: 1.3,
            }}>
              Log what you tried. See what actually worked.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: '620px', textAlign: 'center', margin: '40px auto 0' }}>
          <p style={{
            margin: '0 0 28px 0',
            color: S.textPrimary,
            fontSize: 'clamp(18px, 3vw, 24px)',
            lineHeight: 1.5,
          }}>
            Log what you tried. See what actually worked. Nothing leaves your device unless you choose to share it.
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
