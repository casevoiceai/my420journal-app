import MarketingLayout from './MarketingLayout'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

const CONTACT_EMAIL = 'casevoice.ai@gmail.com'

const generalEmailHref = `mailto:${CONTACT_EMAIL}?subject=my420journal%20message`
const partnerEmailHref = `mailto:${CONTACT_EMAIL}?subject=my420journal%20partnership%20inquiry&body=Business%20or%20dispensary%20name%3A%0AContact%20name%3A%0APosition%20or%20role%3A%0ABusiness%20location%3A%0APreferred%20contact%20method%3A%0AWebsite%20(optional)%3A%0A%0AWhat%20would%20make%20a%20future%20pilot%20useful%20to%20your%20business%3F%0A`

export function ContactSection({ id = undefined, tone = 'base', mode = 'general' }) {
  const cardBackground = tone === 'surface' ? S.bg : S.surface
  const isPartner = mode === 'partners'
  const emailHref = isPartner ? partnerEmailHref : generalEmailHref

  return (
    <section
      id={id}
      className={`marketing-section marketing-section-bg-${tone}`}
    >
      <div
        className="marketing-section-inner"
        style={{ maxWidth: marketingPage.contentWidth }}
      >
        <h1 style={{
          margin: '0 0 18px 0',
          color: S.textPrimary,
          fontFamily: marketingFonts.playfair,
          fontSize: 'clamp(40px, 7vw, 68px)',
          lineHeight: 1.02,
          letterSpacing: '-0.03em',
        }}>
          {isPartner ? 'Talk with us about a future pilot' : 'Get in touch.'}
        </h1>

        <p style={{
          margin: '0 0 28px 0',
          color: S.textSecondary,
          fontSize: '18px',
          lineHeight: 1.6,
        }}>
          {isPartner
            ? 'Own or operate a dispensary? Email us about your business, your role, and what you would want to learn from a future my420journal pilot. Any pilot begins only after the required product, privacy, and legal gates for that stage are satisfied.'
            : 'Questions, bug reports, or anything else about my420journal can be sent directly to Vogtcom by email.'}
        </p>

        <div style={{
          backgroundColor: cardBackground,
          border: `1px solid ${S.border}`,
          borderRadius: marketingPage.radius,
          padding: 'clamp(24px, 5vw, 36px)',
          boxSizing: 'border-box',
        }}>
          <p style={{
            margin: '0 0 18px 0',
            color: S.textSecondary,
            fontSize: '16px',
            lineHeight: 1.7,
          }}>
            {isPartner
              ? 'The email button opens a message with a short business-information template. Your message is sent from your own email account. This website does not collect or store the inquiry.'
              : 'The email button opens your email app. Your message is sent from your own email account. This website does not collect or store the message.'}
          </p>

          <a
            href={emailHref}
            style={{
              width: '100%',
              minHeight: '54px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 22px',
              borderRadius: '12px',
              backgroundColor: S.gold,
              color: S.bg,
              fontFamily: marketingFonts.inter,
              fontSize: '16px',
              fontWeight: 800,
              lineHeight: 1.2,
              textDecoration: 'none',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            {isPartner ? 'Email partnership inquiry' : 'Email Vogtcom'}
          </a>

          <p style={{
            margin: '18px 0 0 0',
            color: S.textSecondary,
            fontSize: '15px',
            lineHeight: 1.65,
            overflowWrap: 'anywhere',
          }}>
            Or email us directly at{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              style={{
                color: S.gold,
                fontWeight: 800,
                textUnderlineOffset: '3px',
              }}
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  )
}

export default function MarketingContact() {
  return (
    <MarketingLayout>
      <ContactSection id="contact" tone="base" />
    </MarketingLayout>
  )
}
