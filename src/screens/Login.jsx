import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { localStore } from '../lib/localStore'
import { hasPin } from '../lib/pin'

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

function InputField({ label, type, value, onChange, placeholder, autoComplete }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block', fontFamily: fontInter, fontSize: '11px', fontWeight: '600',
        color: S.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase',
        marginBottom: '7px',
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          width: '100%', height: '52px', backgroundColor: S.surface,
          border: `1px solid ${focused ? S.gold : S.border}`,
          borderRadius: '8px', padding: '0 16px',
          fontFamily: fontInter, fontSize: '16px', color: S.textPrimary,
          outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.15s ease',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetting, setResetting] = useState(false)

  async function handleSignIn(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await localStore.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (err) { setError(err.message || 'Sign in failed. Check your credentials.'); return }
    navigate(hasPin() ? '/pin' : '/home', { replace: true })
  }

  async function handleForgotPassword() {
    if (!email.trim()) { setError('Enter your email address above first.'); return }
    setError('')
    setResetting(true)
    const { error: err } = await localStore.auth.resetPasswordForEmail(email.trim())
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
