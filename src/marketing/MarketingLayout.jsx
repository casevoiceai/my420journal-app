import { useState } from 'react'
import { Link } from 'react-router-dom'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

const disclaimerText = 'my420journal is a private journaling tool for adults in jurisdictions where cannabis is legal. It does not sell cannabis, provide medical advice, or connect you to any dispensary for purchase. Your entries stay on your device unless you choose to share anonymized signals through the opt-in Shared Signals feature.'

const sectionTabs = [
  { label: 'Home', href: '/#home' },
  { label: 'About', href: '/#about' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Contact', href: '/#contact' },
]

export default function MarketingLayout({ children }) {
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  function exitNow() {
    window.location.assign('https://www.google.com')
  }

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
        backgroundColor: 'rgba(10,26,10,0.98)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 70,
        boxShadow: '0 10px 28px rgba(0,0,0,0.22)',
      }}>
        <div style={{
          maxWidth: marketingPage.maxWidth,
          margin: '0 auto',
          minHeight: '84px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '18px',
          boxSizing: 'border-box',
          flexWrap: 'wrap',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '22px',
            flexWrap: 'wrap',
            minWidth: 0,
          }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                gap: '3px',
                color: S.textPrimary,
                textDecoration: 'none',
                minWidth: '190px',
              }}
            >
              <span style={{
                fontFamily: marketingFonts.playfair,
                fontSize: '24px',
                lineHeight: 1,
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}>
                my420journal
              </span>
              <span style={{
                color: S.gold,
                fontFamily: marketingFonts.inter,
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}>
                A PRIVATE CANNABIS JOURNAL.
              </span>
            </Link>

            <nav
              aria-label="Marketing sections"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              {sectionTabs.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  style={sectionTabStyle}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <nav style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            flexWrap: 'wrap',
          }}>
            <Link
              to="/app"
              style={{
                color: S.textSecondary,
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              Already have an account? Sign in
            </Link>
            <a
              href="/#contact"
              style={{
                minHeight: '36px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 14px',
                border: `1px solid ${S.gold}`,
                borderRadius: '9999px',
                color: S.gold,
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              Report an Issue
            </a>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, paddingTop: '102px' }}>
        {children}
      </main>

      <footer style={{
        borderTop: `1px solid ${S.border}`,
        backgroundColor: S.surface,
        paddingBottom: '70px',
      }}>
        <div style={{
          maxWidth: marketingPage.maxWidth,
          margin: '0 auto',
          padding: '42px 20px 30px',
          boxSizing: 'border-box',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
          }}>
            <FooterColumn
              heading="MY420JOURNAL"
              lines={['A private cannabis journal for people who want to remember what worked.']}
            />
            <FooterColumn
              heading="WHAT THIS IS"
              lines={['A private journaling tool', 'Free, always', 'Local-first, your data stays on your device.']}
            />
            <FooterColumn
              heading="WHAT THIS IS NOT"
              lines={['Not medical advice', 'Not a dispensary or seller', 'Not connected to law enforcement.']}
            />
          </div>
          <p style={{
            margin: '30px 0 0 0',
            paddingTop: '18px',
            borderTop: `1px solid ${S.border}`,
            color: S.textSecondary,
            fontSize: '13px',
            lineHeight: 1.5,
          }}>
            © 2026 Vogtcom LLC.
          </p>
        </div>
      </footer>

      <div style={{
        position: 'fixed',
        left: '14px',
        bottom: '14px',
        zIndex: 85,
      }}>
        <button
          type="button"
          onClick={() => setShowDisclaimer(true)}
          style={cornerButtonStyle}
        >
          Disclaimer
        </button>
      </div>

      <div style={{
        position: 'fixed',
        right: '14px',
        bottom: '14px',
        zIndex: 85,
      }}>
        <button
          type="button"
          onClick={exitNow}
          style={cornerButtonStyle}
        >
          Exit Now
        </button>
      </div>

      {showDisclaimer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          backgroundColor: 'rgba(0,0,0,0.68)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box',
        }}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Disclaimer"
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: S.surface,
              border: `1px solid ${S.border}`,
              borderRadius: marketingPage.radius,
              padding: '24px',
              boxSizing: 'border-box',
              boxShadow: '0 24px 70px rgba(0,0,0,0.44)',
            }}
          >
            <h2 style={{
              margin: '0 0 12px 0',
              color: S.textPrimary,
              fontFamily: marketingFonts.playfair,
              fontSize: '30px',
              lineHeight: 1.1,
            }}>
              Disclaimer
            </h2>
            <p style={{
              margin: '0 0 20px 0',
              color: S.textSecondary,
              fontSize: '16px',
              lineHeight: 1.7,
            }}>
              {disclaimerText}
            </p>
            <button
              type="button"
              onClick={() => setShowDisclaimer(false)}
              style={{
                minHeight: '42px',
                padding: '0 18px',
                border: `1px solid ${S.gold}`,
                borderRadius: '9999px',
                backgroundColor: 'transparent',
                color: S.gold,
                fontFamily: marketingFonts.inter,
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FooterColumn({ heading, lines }) {
  return (
    <section>
      <h2 style={{
        margin: '0 0 12px 0',
        color: S.gold,
        fontFamily: marketingFonts.inter,
        fontSize: '12px',
        fontWeight: 800,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}>
        {heading}
      </h2>
      {lines.map((line) => (
        <p
          key={line}
          style={{
            margin: '0 0 8px 0',
            color: S.textSecondary,
            fontSize: '14px',
            lineHeight: 1.6,
          }}
        >
          {line}
        </p>
      ))}
    </section>
  )
}

const sectionTabStyle = {
  color: S.textPrimary,
  textDecoration: 'none',
  fontSize: '13px',
  fontWeight: 800,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  padding: '8px 4px',
  borderBottom: `1px solid ${S.border}`,
}

const cornerButtonStyle = {
  minHeight: '36px',
  padding: '0 14px',
  border: `1px solid ${S.border}`,
  borderRadius: '9999px',
  backgroundColor: 'rgba(10,26,10,0.96)',
  color: S.textPrimary,
  fontFamily: marketingFonts.inter,
  fontSize: '12px',
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 10px 24px rgba(0,0,0,0.32)',
}
