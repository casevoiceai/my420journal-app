import { Link } from 'react-router-dom'
import MarketingLayout from './MarketingLayout'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

const cards = [
  {
    title: 'Free. Always.',
    body: 'No subscription. No paywall. No version of your data sold to anyone for any reason.',
  },
  {
    title: 'Log a session in under thirty seconds.',
    body: 'Scan a label or receipt. Tap how it went. Your guide does the rest.',
  },
  {
    title: 'Five guides. One is yours.',
    body: 'Meet them all during setup. Hire the one that fits. The app reshapes itself around your choice.',
  },
]

export default function MarketingHome() {
  return (
    <MarketingLayout>
      <section style={{
        maxWidth: marketingPage.maxWidth,
        margin: '0 auto',
        padding: '72px 20px 110px',
        boxSizing: 'border-box',
      }}>
        <div style={{ maxWidth: '820px' }}>
          <p style={{
            margin: '0 0 14px 0',
            color: S.gold,
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            Private cannabis journaling
          </p>
          <h1 style={{
            margin: '0 0 22px 0',
            color: S.textPrimary,
            fontFamily: marketingFonts.playfair,
            fontSize: 'clamp(44px, 8vw, 82px)',
            lineHeight: 0.98,
            letterSpacing: '-0.04em',
            fontWeight: 700,
          }}>
            The part of you that doesn't forget.
          </h1>
          <p style={{
            margin: '0 0 34px 0',
            color: S.textSecondary,
            fontSize: 'clamp(18px, 3vw, 24px)',
            lineHeight: 1.5,
            maxWidth: '760px',
          }}>
            A private cannabis journal that tracks what you tried, remembers what worked, and helps you stop starting from scratch every time you walk into a dispensary.
          </p>
          <Link
            to="/app"
            style={{
              display: 'inline-flex',
              minHeight: '54px',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 24px',
              borderRadius: '12px',
              backgroundColor: S.gold,
              color: S.bg,
              fontSize: '16px',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 12px 30px rgba(0,0,0,0.28)',
            }}
          >
            Start your research
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginTop: '54px',
        }}>
          {cards.map((card) => (
            <article
              key={card.title}
              style={{
                backgroundColor: S.surface,
                border: `1px solid ${S.border}`,
                borderLeft: `4px solid ${S.gold}`,
                borderRadius: marketingPage.radius,
                padding: '22px',
                boxSizing: 'border-box',
              }}
            >
              <h2 style={{
                margin: '0 0 10px 0',
                color: S.textPrimary,
                fontFamily: marketingFonts.playfair,
                fontSize: '24px',
                lineHeight: 1.2,
              }}>
                {card.title}
              </h2>
              <p style={{
                margin: 0,
                color: S.textSecondary,
                fontSize: '15px',
                lineHeight: 1.65,
              }}>
                {card.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <div style={{
        position: 'fixed',
        left: '16px',
        right: '16px',
        bottom: '16px',
        zIndex: 30,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <p style={{
          margin: 0,
          maxWidth: '860px',
          backgroundColor: 'rgba(26,46,26,0.96)',
          border: `1px solid ${S.border}`,
          borderRadius: '9999px',
          padding: '10px 16px',
          color: S.textSecondary,
          fontSize: '12px',
          lineHeight: 1.4,
          textAlign: 'center',
          boxShadow: '0 12px 30px rgba(0,0,0,0.28)',
        }}>
          my420journal is a private journaling tool for adults in jurisdictions where cannabis is legal. Nothing here is medical advice.
        </p>
      </div>
    </MarketingLayout>
  )
}
