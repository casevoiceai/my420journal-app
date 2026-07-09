import { useState } from 'react'
import MarketingLayout from './MarketingLayout'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

// Replace this placeholder with the real Web3Forms access key for casevoice.ai@gmail.com.
const WEB3FORMS_ACCESS_KEY = 'YOUR_WEB3FORMS_ACCESS_KEY_HERE'

const initialForm = {
  name: '',
  email: '',
  message: '',
}

export default function MarketingContact() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus('submitting')
    setError('')

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: 'my420journal contact form',
          from_name: form.name,
          name: form.name,
          email: form.email,
          message: form.message,
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Submission failed')
      }

      setForm(initialForm)
      setStatus('success')
    } catch {
      setStatus('error')
      setError('Something went wrong. Please try again.')
    }
  }

  const submitting = status === 'submitting'

  return (
    <MarketingLayout>
      <section style={{
        maxWidth: marketingPage.contentWidth,
        margin: '0 auto',
        padding: '64px 20px 78px',
        boxSizing: 'border-box',
      }}>
        <h1 style={{
          margin: '0 0 18px 0',
          color: S.textPrimary,
          fontFamily: marketingFonts.playfair,
          fontSize: 'clamp(40px, 7vw, 68px)',
          lineHeight: 1.02,
          letterSpacing: '-0.03em',
        }}>
          Get in touch.
        </h1>
        <p style={{
          margin: '0 0 28px 0',
          color: S.textSecondary,
          fontSize: '18px',
          lineHeight: 1.6,
        }}>
          Questions, bug reports, early access requests, or anything else. We read everything.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: S.surface,
            border: `1px solid ${S.border}`,
            borderRadius: marketingPage.radius,
            padding: '24px',
            boxSizing: 'border-box',
          }}
        >
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
            {submitting ? 'Sending' : 'Send it'}
          </button>

          {status === 'success' && (
            <p style={{ margin: '16px 0 0 0', color: S.success, fontSize: '14px', lineHeight: 1.5 }}>
              Message sent. Thank you for reaching out.
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
          If you are a dispensary owner interested in the mycannabisjournal.ai partner program, use the message field and tell us where you are located. We will be in touch when we have availability in your area.
        </p>
      </section>
    </MarketingLayout>
  )
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
