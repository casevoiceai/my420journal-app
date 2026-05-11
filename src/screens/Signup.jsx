import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { localStore } from '../lib/localStore'

const inputStyle = {
  width: '100%',
  backgroundColor: '#1A2E1A',
  color: '#E8F0E8',
  border: '1px solid #2D4A2D',
  borderRadius: '8px',
  padding: '13px 16px',
  fontSize: '15px',
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease',
}

const inputErrorStyle = {
  ...inputStyle,
  border: '1px solid #E05C5C',
}

const labelStyle = {
  display: 'block',
  fontFamily: "'Inter', sans-serif",
  fontSize: '12px',
  fontWeight: '500',
  color: '#8FAF8F',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  marginBottom: '6px',
}

const fieldErrorStyle = {
  fontFamily: "'Inter', sans-serif",
  fontSize: '13px',
  color: '#E05C5C',
  marginTop: '6px',
  lineHeight: '1.4',
}

function validate(email, password, confirm) {
  const errors = {}
  if (!email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Enter a valid email address.'
  }
  if (!password) {
    errors.password = 'Password is required.'
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }
  if (!confirm) {
    errors.confirm = 'Please confirm your password.'
  } else if (confirm !== password) {
    errors.confirm = 'Passwords do not match.'
  }
  return errors
}

export default function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [localOnlyError, setLocalOnlyError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLocalOnlyError('')

    const errors = validate(email, password, confirm)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setLoading(true)

    const { error } = await localStore.auth.signUp({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already exists')) {
        setLocalOnlyError('An account with this email already exists. Try signing in instead.')
      } else if (msg.includes('weak') || msg.includes('password')) {
        setLocalOnlyError('Password is too weak. Try a stronger password.')
      } else if (msg.includes('local')) {
        setLocalOnlyError('Local-only save failed. Try again.')
      } else {
        setLocalOnlyError(error.message)
      }
      return
    }

    navigate('/onboarding', { replace: true })
  }

  function clearFieldError(field) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
    setLocalOnlyError('')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0A1A0A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '36px',
            fontWeight: '600',
            color: '#E8F0E8',
            margin: '0 0 16px 0',
            lineHeight: '1.2',
          }}
        >
          Create your account.
        </h1>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '15px',
            color: '#8FAF8F',
            margin: '0 auto',
            lineHeight: '1.6',
            textAlign: 'center',
          }}
        >
          Free forever. Your journal stays on this device.
        </p>

        <div
          style={{
            width: '48px',
            height: '1px',
            backgroundColor: '#C9A84C',
            margin: '32px auto 40px auto',
            opacity: 0.5,
          }}
        />

        <form
          onSubmit={handleSubmit}
          noValidate
          style={{ width: '100%', textAlign: 'left' }}
        >
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="email" style={labelStyle}>Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearFieldError('email') }}
              style={fieldErrors.email ? inputErrorStyle : inputStyle}
              onFocus={(e) => { if (!fieldErrors.email) e.target.style.borderColor = '#4A7A4A' }}
              onBlur={(e) => { if (!fieldErrors.email) e.target.style.borderColor = '#2D4A2D' }}
              placeholder="you@example.com"
            />
            {fieldErrors.email && <p style={fieldErrorStyle}>{fieldErrors.email}</p>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="password" style={labelStyle}>Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearFieldError('password') }}
              style={fieldErrors.password ? inputErrorStyle : inputStyle}
              onFocus={(e) => { if (!fieldErrors.password) e.target.style.borderColor = '#4A7A4A' }}
              onBlur={(e) => { if (!fieldErrors.password) e.target.style.borderColor = '#2D4A2D' }}
              placeholder="Minimum 8 characters"
            />
            {fieldErrors.password && <p style={fieldErrorStyle}>{fieldErrors.password}</p>}
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label htmlFor="confirm" style={labelStyle}>Confirm password</label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); clearFieldError('confirm') }}
              style={fieldErrors.confirm ? inputErrorStyle : inputStyle}
              onFocus={(e) => { if (!fieldErrors.confirm) e.target.style.borderColor = '#4A7A4A' }}
              onBlur={(e) => { if (!fieldErrors.confirm) e.target.style.borderColor = '#2D4A2D' }}
              placeholder="Re-enter your password"
            />
            {fieldErrors.confirm && <p style={fieldErrorStyle}>{fieldErrors.confirm}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '17px 24px',
              backgroundColor: loading ? '#8A7030' : '#C9A84C',
              color: '#0A1A0A',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              fontFamily: "'Inter', sans-serif",
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.03em',
              transition: 'background-color 0.15s ease, transform 0.1s ease',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#D4B460' }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = loading ? '#8A7030' : '#C9A84C' }}
          >
            {loading ? 'Creating account…' : 'Create your account'}
          </button>

          {localOnlyError && (
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                color: '#E05C5C',
                marginTop: '12px',
                lineHeight: '1.5',
                textAlign: 'center',
              }}
            >
              {localOnlyError}
            </p>
          )}
        </form>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            color: '#8FAF8F',
            marginTop: '28px',
            textAlign: 'center',
          }}
        >
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              color: '#C9A84C',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
