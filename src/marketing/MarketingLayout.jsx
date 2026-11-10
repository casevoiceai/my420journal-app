import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

const disclaimerText = 'My420Journal is a private, local-first journaling tool for adults in reviewed markets. It does not sell cannabis, provide medical advice, or connect users to dispensaries for purchases. Journal entries and private notes are stored locally in this browser. Some optional features use network services, and Shared Journey / Layer 2 is currently off. See the Privacy Notice for details.'

const sectionTabs = [
  { label: 'Home', href: '/#home' },
  { label: 'About', href: '/#about' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Partners', href: '/partners' },
  { label: 'Privacy', href: '/privacy' },
]

export default function MarketingLayout({ children }) {
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const headerRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    if (location.hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname, location.hash])

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
            width: '100%',
            maxWidth: marketingPage.maxWidth,
            margin: '0 auto',
            padding: '8px 14px',
            minHeight: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            boxSizing: 'border-box',
            textAlign: 'center',
          }}>
            <Link
              to="/app"
              style={{
                color: S.textSecondary,
                textDecoration: 'none',
                fontSize: 'clamp(13px, 3.7vw, 16px)',
                fontWeight: 700,
                lineHeight: 1.25,
                textAlign: 'center',
              }}
            >
              Open my journal
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
                fontSize: 'clamp(11px, 3vw, 14px)',
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
          padding: 'clamp(16px, 4vw, 26px) 14px clamp(12px, 3vw, 20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(8px, 2vw, 12px)',
          boxSizing: 'border-box',
          textAlign: 'center',
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
              textAlign: 'center',
            }}
          >
            <HeaderBrainMark />
            <span style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 0,
              textAlign: 'center',
            }}>
              <span style={{
                fontFamily: marketingFonts.playfair,
                fontSize: 'clamp(34px, 9.4vw, 81px)',
                lineHeight: 0.95,
                fontWeight: 700,
                letterSpacing: '-0.035em',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}>
                My420Journal
              </span>
              <span style={{
                marginTop: '10px',
                maxWidth: '100%',
                color: S.gold,
                fontFamily: marketingFonts.inter,
                fontSize: 'clamp(11px, 3.1vw, 16px)',
                lineHeight: 1.3,
                fontWeight: 800,
                letterSpacing: 'clamp(0.07em, 0.45vw, 0.16em)',
                textAlign: 'center',
                textTransform: 'uppercase',
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
              }}>
                A PRIVATE CANNABIS JOURNAL
              </span>
            </span>
          </Link>
        </div>

        <nav
          aria-label="Marketing sections"
          style={{
            width: '100%',
            maxWidth: marketingPage.maxWidth,
            margin: '0 auto',
            padding: '7px 8px 9px',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(5px, 2.2vw, 18px)',
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

      <main style={{ flex: 1, paddingTop: 'var(--header-height, 240px)' }}>
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
              lines={['A private cannabis journal for people who want to remember what they recorded.']}
            />
            <FooterColumn
              heading="WHAT THIS IS"
              lines={['A private journaling tool', 'Free, always', 'Local-first private journal; optional network features are disclosed separately.']}
            />
            <FooterColumn
              heading="WHAT THIS IS NOT"
              lines={['Not medical advice', 'Not a dispensary or seller', 'Not connected to law enforcement.']}
            />
          </div>
          <div style={{
            margin: '30px 0 0 0',
            paddingTop: '18px',
            borderTop: `1px solid ${S.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            flexWrap: 'wrap',
          }}>
            <p style={{
              margin: 0,
              color: S.textSecondary,
              fontSize: '13px',
              lineHeight: 1.5,
            }}>
              © 2026 Vogtcom LLC.
            </p>
            <Link to="/privacy" style={footerLinkStyle}>
              Privacy Policy
            </Link>
          </div>
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
      width: 'clamp(52px, 14.5vw, 90px)',
      height: 'clamp(52px, 14.5vw, 90px)',
      borderRadius: '18%',
      border: `1px solid ${S.border}`,
      backgroundColor: '#FFFFFF',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      flex: '0 0 auto',
      boxShadow: '0 10px 24px rgba(0,0,0,0.24)',
    }}>
      <img
        src="/approved-brain-logo.webp"
        alt=""
        aria-hidden="true"
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
      />
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
  flex: '1 1 0',
  minWidth: 0,
  color: S.textPrimary,
  textDecoration: 'none',
  fontSize: 'clamp(11px, 3vw, 13px)',
  fontWeight: 800,
  letterSpacing: '0.035em',
  textTransform: 'uppercase',
  textAlign: 'center',
  padding: '8px 2px',
  borderBottom: `1px solid ${S.border}`,
  whiteSpace: 'nowrap',
}

const footerLinkStyle = {
  color: S.gold,
  fontFamily: marketingFonts.inter,
  fontSize: '13px',
  fontWeight: 700,
  lineHeight: 1.5,
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
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
