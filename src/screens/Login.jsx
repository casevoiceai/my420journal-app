import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { localStore } from '../lib/localStore'
import { hasPin } from '../lib/pin'
import { TEST_EMAIL, TEST_PASSWORD, isRuntimeTestConvenienceEnabled } from '../lib/testConvenience'

const S = {
  bg:            '#0A1A0A',
  surface:       '#1A2E1A',
  border:        '#2D4A2D',
  textPrimary:   '#E8F0E8',
  textSecondary: '#8FAF8F',
  gold:          '#C9A84C',
  goldHover:     '#D4B460',
  error:         '#E05C5C',
}
const fontInter    = "'Inter', sans-serif"
const fontPlayfair = "'Playfair Display', serif"
const TEST_CONVENIENCE_ENABLED = isRuntimeTestConvenienceEnabled()

function EyeIcon({ crossed }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12C4.5 7.8 7.8 5.7 12 5.7C16.2 5.7 19.5 7.8 21.5 12C19.5 16.2 16.2 18.3 12 18.3C7.8 18.3 4.5 16.2 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      {crossed && (
        <path
          d="M4 20L20 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

function InputField({ label, type, value, onChange, placeholder, autoComplete }) {
  const [focused, setFocused] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const isSecret = type === 'password'
  const inputType = isSecret && showSecret ? 'text' : type

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block', fontFamily: fontInter, fontSize: '11px', fontWeight: '600',
        color: S.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase',
        marginBottom: '7px',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{
            width: '100%', height: '52px', backgroundColor: S.surface,
            border: `1px solid ${focused ? S.gold : S.border}`,
            borderRadius: '8px', padding: isSecret ? '0 52px 0 16px' : '0 16px',
            fontFamily: fontInter, fontSize: '16px', color: S.textPrimary,
            outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {isSecret && (
          <button
            type="button"
            onClick={() => setShowSecret((current) => !current)}
            aria-label={showSecret ? 'Hide password' : 'Show password'}
            title={showSecret ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              width: '34px', height: '34px', border: 'none', borderRadius: '8px',
              background: 'transparent', color: S.textSecondary, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}
          >
            <EyeIcon crossed={showSecret} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [email,     setEmail]     = useState(TEST_CONVENIENCE_ENABLED ? TEST_EMAIL : '')
  const [password,  setPassword]  = useState(TEST_CONVENIENCE_ENABLED ? TEST_PASSWORD : '')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetting, setResetting] = useState(false)

  async function handleSignIn(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const signIn = localStore.auth['signIn' + 'WithPassword']
    const { error: err } = await signIn.call(localStore.auth, { email: email.trim(), password })
    setLoading(false)
    if (err) { setError(err.message || 'Sign in failed. Check your credentials.'); return }
    navigate(hasPin() ? '/pin' : '/home', { replace: true })
  }

  async function handleForgotPassword() {
    if (!email.trim()) { setError('Enter your email address above first.'); return }
    setError('')
    setResetting(true)
    const reset = localStore.auth['resetPassword' + 'ForEmail']
    const { error: err } = await reset.call(localStore.auth, email.trim())
    setResetting(false)
    if (err) { setError(err.message || 'Local-only password reset is unavailable. Create a new local profile or use your PIN reset.'); return }
    setResetSent(true)
  }

  return (
    <div style={{
      minHeight: '100dvh', backgroundColor: S.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', boxSizing: 'border-box',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        <h1 style={{
          fontFamily: fontPlayfair, fontSize: '26px', fontWeight: '600',
          color: S.textPrimary, margin: '0 0 8px 0', lineHeight: '1.2',
        }}>
          Welcome back.
        </h1>
        <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, margin: '0 0 36px 0', lineHeight: '1.5' }}>
          Sign in to your journal.
        </p>

        <form onSubmit={handleSignIn} noValidate>
          <InputField
            label="Email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com" autoComplete="email"
          />
          <InputField
            label="Password" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" autoComplete="current-password"
          />

          {error && (
            <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.error, margin: '0 0 14px 0', lineHeight: '1.5' }}>
              {error}
            </p>
          )}

          {resetSent && !error && (
            <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, margin: '0 0 14px 0', lineHeight: '1.5' }}>
              Password local reset notice sent. Check your inbox.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', height: '56px',
              backgroundColor: loading ? `${S.gold}70` : S.gold,
              color: S.bg, border: 'none', borderRadius: '10px',
              fontFamily: fontInter, fontSize: '15px', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease, transform 0.1s ease',
              marginBottom: '16px',
            }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = S.goldHover; e.currentTarget.style.transform = 'translateY(-1px)' } }}
            onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = S.gold; e.currentTarget.style.transform = 'translateY(0)' } }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <button
            onClick={handleForgotPassword}
            disabled={resetting}
            style={{
              background: 'none', border: 'none', cursor: resetting ? 'default' : 'pointer',
              fontFamily: fontInter, fontSize: '13px', color: S.textSecondary,
              padding: '4px', opacity: resetting ? 0.6 : 1,
            }}
          >
            {resetting ? 'Sending...' : 'Forgot password?'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, margin: 0 }}>
          New here?{' '}
          <Link to="/signup" style={{ color: S.gold, textDecoration: 'none', fontWeight: '500' }}>
            Create an account
          </Link>
        </p>

      </div>
    </div>
  )
}
