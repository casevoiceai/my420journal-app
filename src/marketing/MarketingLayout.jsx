import { useEffect, useRef, useState } from 'react'
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
  const headerRef = useRef(null)

  useEffect(() => {
    const headerEl = headerRef.current
    if (!headerEl) return

    function updateHeaderHeight() {
      document.documentElement.style.setProperty('--header-height', `${headerEl.offsetHeight}px`)
    }

    updateHeaderHeight()
    const observer = new ResizeObserver(updateHeaderHeight)
    observer.observe(headerEl)
    window.addEventListener('resize', updateHeaderHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateHeaderHeight)
    }
  }, [])

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
      <header ref={headerRef} style={{
        borderBottom: `1px solid ${S.border}`,
        backgroundColor: 'rgba(10,26,10,0.98)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 70,
        boxShadow: '0 10px 28px rgba(0,0,0,0.22)',
      }}>
        <div style={{ borderBottom: `1px solid ${S.border}` }}>
          <nav style={{
            maxWidth: marketingPage.maxWidth,
            margin: '0 auto',
            padding: '6px 12px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
            flexWrap: 'wrap',
            boxSizing: 'border-box',
          }}>
            <Link
              to="/app"
              style={{
                color: S.textSecondary,
                textDecoration: 'none',
                fontSize: 'clamp(11px, 3vw, 14px)',
                fontWeight: 600,
                lineHeight: 1.2,
                textAlign: 'right',
              }}
            >
              Already have an account? Sign in
            </Link>
            <a
              href="/#contact"
              style={{
                minHeight: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 11px',
                border: `1px solid ${S.gold}`,
                borderRadius: '9999px',
                color: S.gold,
                textDecoration: 'none',
                fontSize: 'clamp(10px, 2.7vw, 13px)',
                fontWeight: 800,
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              Report an Issue
            </a>
          </nav>
        </div>

        <div style={{
          width: '100%',
          maxWidth: marketingPage.maxWidth,
          margin: '0 auto',
          padding: 'clamp(12px, 3vw, 22px) 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(5px, 1.4vw, 9px)',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}>
          <Link
            to="/"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(8px, 2.5vw, 20px)',
              color: S.textPrimary,
              textDecoration: 'none',
              minWidth: 0,
            }}
          >
            <HeaderBrainMark />
            <span style={{
              minWidth: 0,
              fontFamily: marketingFonts.playfair,
              fontSize: 'clamp(27px, 8.2vw, 81px)',
              lineHeight: 0.92,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              whiteSpace: 'nowrap',
            }}>
              my420journal
            </span>
          </Link>
          <span style={{
            maxWidth: '100%',
            color: S.gold,
            fontFamily: marketingFonts.inter,
            fontSize: 'clamp(8px, 2.35vw, 16px)',
            lineHeight: 1.15,
            fontWeight: 800,
            letterSpacing: 'clamp(0.08em, 0.5vw, 0.16em)',
            textAlign: 'center',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            A PRIVATE CANNABIS JOURNAL
          </span>
        </div>

        <nav
          aria-label="Marketing sections"
          style={{
            width: '100%',
            maxWidth: marketingPage.maxWidth,
            margin: '0 auto',
            padding: '6px 10px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(6px, 2.5vw, 18px)',
            flexWrap: 'nowrap',
            boxSizing: 'border-box',
          }}
        >
          {sectionTabs.map((item) => (
            <a key={item.href} href={item.href} style={sectionTabStyle}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <main style={{ flex: 1, paddingTop: 'var(--header-height, 220px)' }}>
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

      <div style={{ position: 'fixed', left: '14px', bottom: '14px', zIndex: 85 }}>
        <button type="button" onClick={() => setShowDisclaimer(true)} style={cornerButtonStyle}>
          Disclaimer
        </button>
      </div>

      <div style={{ position: 'fixed', right: '14px', bottom: '14px', zIndex: 85 }}>
        <button type="button" onClick={exitNow} style={cornerButtonStyle}>
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

function HeaderBrainMark() {
  return (
    <span style={{
      width: 'clamp(48px, 14vw, 90px)',
      height: 'clamp(48px, 14vw, 90px)',
      borderRadius: '22%',
      border: `1px solid ${S.border}`,
      backgroundColor: 'rgba(10,26,10,0.72)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: '0 0 auto',
      boxShadow: '0 10px 24px rgba(0,0,0,0.24)',
    }}>
      <svg
        width="81%"
        height="81%"
        viewBox="0 0 64 64"
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill={S.success}
          d="M34 9c-9.9 0-18 7.6-18 17 0 4.8 2.1 9.1 5.5 12.2 1.2 1.1 1.8 2.6 1.8 4.2v6.2c0 3.5 2.9 6.4 6.4 6.4h8.9c3.1 0 5.7-2.2 6.3-5.2l.4-2.2h4.1c2.2 0 3.9-1.8 3.9-3.9v-5.8c0-1.2.4-2.4 1.1-3.4l2.6-3.7c.8-1.2.5-2.8-.7-3.6l-3.2-2.1C51.4 14.1 43.3 9 34 9Zm-7.2 13.7c.9-3.1 3.8-5.3 7.2-5.3 3.2 0 6 2 7 4.9 2.7.4 4.9 2.6 5.4 5.3 2 .8 3.4 2.7 3.4 5 0 2.9-2.3 5.3-5.2 5.4-.9 2.4-3.2 4.2-5.9 4.2-1.8 0-3.4-.8-4.6-2-1.3 1.4-3.1 2.2-5.2 2.2-3.9 0-7.1-3.1-7.1-7 0-.9.2-1.8.5-2.6-1.6-1.3-2.6-3.2-2.6-5.4 0-3.2 2.1-5.9 5.1-6.7Zm7.2-.3c-1.9 0-3.5 1.5-3.6 3.4l-.1 1.9-1.9.1c-2 .1-3.6 1.7-3.6 3.7 0 1.5.9 2.8 2.2 3.4l1.7.8-.8 1.7c-.2.5-.4 1-.4 1.6 0 2 1.6 3.6 3.6 3.6 1.4 0 2.6-.8 3.2-2l1.8-3.4 1.7 3.4c.5 1 1.5 1.6 2.7 1.6 1.6 0 3-1.3 3.1-2.9l.1-1.9 1.9-.1c1.5 0 2.7-1.3 2.7-2.8 0-1.3-.9-2.4-2.1-2.7l-1.5-.4-.1-1.5c-.2-1.9-1.8-3.4-3.8-3.4h-1.7l-.4-1.6c-.4-1.5-1.8-2.5-3.5-2.5Z"
        />
      </svg>
    </span>
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
        <p key={line} style={{ margin: '0 0 8px 0', color: S.textSecondary, fontSize: '14px', lineHeight: 1.6 }}>
          {line}
        </p>
      ))}
    </section>
  )
}

const sectionTabStyle = {
  color: S.textPrimary,
  textDecoration: 'none',
  fontSize: 'clamp(10px, 2.9vw, 13px)',
  fontWeight: 800,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
  padding: '8px 3px',
  borderBottom: `1px solid ${S.border}`,
  whiteSpace: 'nowrap',
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
