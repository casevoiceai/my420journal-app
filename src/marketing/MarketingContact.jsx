import { useState } from 'react'
import MarketingLayout from './MarketingLayout'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

const CONTACT_EMAIL = 'vogtcomllc@gmail.com'

const initialForm = {
  name: '',
  email: '',
  message: '',
  businessName: '',
  role: '',
  phone: '',
  preferredContact: '',
  location: '',
  website: '',
}

export function ContactSection({ id = undefined, tone = 'base', mode = 'general' }) {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const cardBackground = tone === 'surface' ? S.bg : S.surface
  const isPartnerForm = mode === 'partners'

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setStatus('opening')
    setError('')

    try {
      const subject = isPartnerForm
        ? 'my420journal dispensary partnership inquiry'
        : 'my420journal contact form'

      const lines = isPartnerForm
        ? [
            `Business or dispensary: ${form.businessName}`,
            `Contact name: ${form.name}`,
            `Position or role: ${form.role}`,
            `Business email: ${form.email}`,
            `Phone: ${form.phone}`,
            `Preferred contact method: ${form.preferredContact}`,
            `Business location: ${form.location}`,
            `Business website: ${form.website || 'Not provided'}`,
            '',
            'Message:',
            form.message,
          ]
        : [
            `Name: ${form.name}`,
            `Email: ${form.email}`,
            '',
            'Message:',
            form.message,
          ]

      const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`
      window.location.href = mailto
      setStatus('ready')
    } catch {
      setStatus('error')
      setError(`Please email us directly at ${CONTACT_EMAIL}.`)
    }
  }

  const submitting = status === 'opening'

  return (
    <section
      id={id}
      className={`marketing-section marketing-section-bg-${tone}`}
    >
      <div
        className="marketing-section-inner"
        style={{
          maxWidth: marketingPage.contentWidth,
        }}
      >
        <h1 style={{
          margin: '0 0 18px 0',
          color: S.textPrimary,
          fontFamily: marketingFonts.playfair,
          fontSize: 'clamp(40px, 7vw, 68px)',
          lineHeight: 1.02,
          letterSpacing: '-0.03em',
        }}>
          {isPartnerForm ? 'Talk with us about a pilot' : 'Get in touch.'}
        </h1>
        <p style={{
          margin: '0 0 28px 0',
          color: S.textSecondary,
          fontSize: '18px',
          lineHeight: 1.6,
        }}>
          {isPartnerForm
            ? 'Own or operate a dispensary? Tell us about your business, your role, and what you want to learn from an early my420journal pilot. We will follow up using the contact method you prefer.'
            : 'Questions, bug reports, early access requests, or anything else. We read everything.'}
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: cardBackground,
            border: `1px solid ${S.border}`,
            borderRadius: marketingPage.radius,
            padding: '24px',
            boxSizing: 'border-box',
          }}
        >
          {isPartnerForm ? (
            <>
              <div style={formGridStyle}>
                <label style={labelStyle}>
                  Business or dispensary name
                  <input
                    required
                    value={form.businessName}
                    onChange={(event) => updateField('businessName', event.target.value)}
                    style={inputStyle}
                    autoComplete="organization"
                  />
                </label>

                <label style={labelStyle}>
                  Business website (optional)
                  <input
                    type="url"
                    value={form.website}
                    onChange={(event) => updateField('website', event.target.value)}
                    style={inputStyle}
                    autoComplete="url"
                    placeholder="https://"
                  />
                </label>

                <label style={labelStyle}>
                  Contact person's name
                  <input
                    required
                    value={form.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    style={inputStyle}
                    autoComplete="name"
                  />
                </label>

                <label style={labelStyle}>
                  Position or role
                  <select
                    required
                    value={form.role}
                    onChange={(event) => updateField('role', event.target.value)}
                    style={selectStyle}
                  >
                    <option value="">Choose one</option>
                    <option value="Owner">Owner</option>
                    <option value="General Manager">General Manager</option>
                    <option value="Purchasing or Inventory Manager">Purchasing or Inventory Manager</option>
                    <option value="Marketing or Partnerships">Marketing or Partnerships</option>
                    <option value="Operations">Operations</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label style={labelStyle}>
                  Business email
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    style={inputStyle}
                    autoComplete="email"
                  />
                </label>

                <label style={labelStyle}>
                  Phone number
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    style={inputStyle}
                    autoComplete="tel"
                  />
                </label>

                <label style={labelStyle}>
                  Preferred contact method
                  <select
                    required
                    value={form.preferredContact}
                    onChange={(event) => updateField('preferredContact', event.target.value)}
                    style={selectStyle}
                  >
                    <option value="">Choose one</option>
                    <option value="Email">Email</option>
                    <option value="Phone call">Phone call</option>
                    <option value="Text message">Text message</option>
                  </select>
                </label>

                <label style={labelStyle}>
                  Business location
                  <input
                    required
                    value={form.location}
                    onChange={(event) => updateField('location', event.target.value)}
                    style={inputStyle}
                    autoComplete="address-level2"
                    placeholder="City and state"
                  />
                </label>
              </div>

              <label style={labelStyle}>
                What would you like to discuss?
                <textarea
                  required
                  value={form.message}
                  onChange={(event) => updateField('message', event.target.value)}
                  style={{ ...inputStyle, minHeight: '170px', paddingTop: '14px', resize: 'vertical' }}
                  placeholder="Tell us about your dispensary, what you want to learn, and what would make a pilot useful to your business."
                />
              </label>
            </>
          ) : (
            <>
              <label style={labelStyle}>
                Name
                <input
                  required
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  style={inputStyle}
                  autoComplete="name"
                />
              </label>

              <label style={labelStyle}>
                Email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  style={inputStyle}
                  autoComplete="email"
                />
              </label>

              <label style={labelStyle}>
                Message
                <textarea
                  required
                  value={form.message}
                  onChange={(event) => updateField('message', event.target.value)}
                  style={{ ...inputStyle, minHeight: '150px', paddingTop: '14px', resize: 'vertical' }}
                />
              </label>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              minHeight: '52px',
              border: 'none',
              borderRadius: '12px',
              backgroundColor: submitting ? '#5A4A20' : S.gold,
              color: submitting ? '#B8A060' : S.bg,
              fontFamily: marketingFonts.inter,
              fontSize: '16px',
              fontWeight: 800,
              cursor: submitting ? 'default' : 'pointer',
            }}
          >
            {submitting
              ? 'Opening email'
              : isPartnerForm
                ? 'Email partnership inquiry'
                : 'Email Vogtcom LLC'}
          </button>

          {status === 'ready' && (
            <p style={{ margin: '16px 0 0 0', color: S.success, fontSize: '14px', lineHeight: 1.5 }}>
              Your email app should open with the message addressed to {CONTACT_EMAIL}. Review it, then send.
            </p>
          )}

          {status === 'error' && (
            <p style={{ margin: '16px 0 0 0', color: S.error, fontSize: '14px', lineHeight: 1.5 }}>
              {error}
            </p>
          )}
        </form>

        <p style={{
          margin: '22px 0 0 0',
          color: S.textSecondary,
          fontSize: '15px',
          lineHeight: 1.65,
        }}>
          Email us directly at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: S.gold }}>{CONTACT_EMAIL}</a>.
          {' '}
          {isPartnerForm
            ? 'We will use your message only to respond to your business inquiry and discuss possible partnership or pilot options.'
            : 'If you are a dispensary owner interested in the mycannabisjournal.ai partner program, tell us where you are located. We will be in touch when we have availability in your area.'}
        </p>
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

const eyebrowStyle = {
  margin: '0 0 14px 0',
  color: S.gold,
  fontFamily: marketingFonts.inter,
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  columnGap: '18px',
}

const labelStyle = {
  display: 'block',
  color: S.textSecondary,
  fontFamily: marketingFonts.inter,
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: '16px',
}

const inputStyle = {
  width: '100%',
  minHeight: '48px',
  marginTop: '8px',
  backgroundColor: S.bg,
  border: `1px solid ${S.border}`,
  borderRadius: '10px',
  color: S.textPrimary,
  fontFamily: marketingFonts.inter,
  fontSize: '15px',
  lineHeight: 1.5,
  padding: '0 14px',
  outline: 'none',
  boxSizing: 'border-box',
}

const selectStyle = {
  ...inputStyle,
  paddingRight: '36px',
}