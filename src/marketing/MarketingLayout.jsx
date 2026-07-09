import { Link, useLocation } from 'react-router-dom'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Contact', path: '/contact' },
]

export default function MarketingLayout({ children }) {
  const location = useLocation()

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: S.bg,
      color: S.textPrimary,
      fontFamily: marketingFonts.inter,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <header style={{
        borderBottom: `1px solid ${S.border}`,
        backgroundColor: 'rgba(10,26,10,0.96)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        <div style={{
          maxWidth: marketingPage.maxWidth,
          margin: '0 auto',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxSizing: 'border-box',
        }}>
          <Link
            to="/"
            style={{
              fontFamily: marketingFonts.playfair,
              fontSize: '22px',
              fontWeight: 700,
              color: S.textPrimary,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            my420journal
          </Link>

          <nav style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '14px',
            flexWrap: 'wrap',
          }}>
            {navItems.map((item) => {
              const active = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    color: active ? S.gold : S.textSecondary,
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: active ? 700 : 500,
                    letterSpacing: '0.01em',
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {children}
      </main>

      <footer style={{
        borderTop: `1px solid ${S.border}`,
        backgroundColor: S.surface,
      }}>
        <div style={{
          maxWidth: marketingPage.maxWidth,
          margin: '0 auto',
          padding: '26px 20px',
          boxSizing: 'border-box',
        }}>
          <p style={{
            margin: '0 0 8px 0',
            fontSize: '14px',
            lineHeight: 1.6,
            color: S.textPrimary,
          }}>
            my420journal is a product of Vogtcom LLC.
          </p>
          <p style={{
            margin: '0 0 8px 0',
            fontSize: '14px',
            lineHeight: 1.6,
            color: S.textSecondary,
          }}>
            my420journal.com | mycannabisjournal.ai
          </p>
          <p style={{
            margin: 0,
            fontSize: '13px',
            lineHeight: 1.6,
            color: S.textSecondary,
          }}>
            Cannabis is legal in some jurisdictions and not others. Know your local laws. Nothing on this site is medical or legal advice.
          </p>
        </div>
      </footer>
    </div>
  )
}
