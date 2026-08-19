import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { localStore } from '../lib/localStore'
import { verifyPin, clearPin } from '../lib/pin'
import { isDevMode, DEV_PROFILE } from '../lib/dev'

const S = {
  bg: '#0A1A0A',
  surface: '#1A2E1A',
  border: '#2D4A2D',
  textPrimary: '#E8F0E8',
  textSecondary: '#8FAF8F',
  gold: '#C9A84C',
  error: '#E05C5C',
}

const fontInter = "'Inter', sans-serif"
const fontPlayfair = "'Playfair Display', serif"

const GUIDE_META = {
  bud:   { name: 'Bud Tendar',     accent: '#C9A84C' },
  sunny: { name: 'Sunny Day',      accent: '#FF7F5C' },
  larry: { name: 'Lucky Larry',    accent: '#C17A3A' },
  herb:  { name: 'Herb N. Spices', accent: '#4ECDC4' },
  mary:  { name: 'Mary Jayne',     accent: '#B088B0' },
  unit:  { name: null,             accent: '#888888' },
  tool:  { name: null,             accent: '#C9A84C' },
}

function PinDots({ value, shake }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '20px',
        justifyContent: 'center',
        margin: '28px 0',
        animation: shake ? 'pinShake 0.35s ease' : 'none',
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: i < value.length ? S.gold : 'transparent',
            border: `2px solid ${i < value.length ? S.gold : S.border}`,
            transition: 'all 0.15s ease',
          }}
        />
      ))}
    </div>
  )
}

function NumPad({ onDigit, onDelete }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','del']

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px',
      width: '100%',
      maxWidth: '280px',
      margin: '0 auto',
    }}>
      {keys.map((key, i) => {
        if (key === '') return <div key={i} />
        const isDel = key === 'del'
        return (
          <button
            key={i}
            onClick={() => isDel ? onDelete() : onDigit(key)}
            style={{
              height: '72px',
              borderRadius: '50px',
              border: `1px solid ${S.border}`,
              backgroundColor: S.surface,
              color: S.textPrimary,
              fontFamily: fontInter,
              fontSize: isDel ? '18px' : '24px',
              fontWeight: '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.1s ease',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#243824' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = S.surface }}
            onTouchStart={(e) => { e.currentTarget.style.backgroundColor = '#243824' }}
            onTouchEnd={(e) => { e.currentTarget.style.backgroundColor = S.surface }}
          >
            {isDel ? (
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
                <path d="M8 1H20C20.5523 1 21 1.44772 21 2V14C21 14.5523 20.5523 15 20 15H8L1 8L8 1Z" stroke={S.textSecondary} strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M14 6L10 10M10 6L14 10" stroke={S.textSecondary} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : key}
          </button>
        )
      })}
    </div>
  )
}

export default function PinEntry() {
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [locked, setLocked] = useState(false)
  const [shake, setShake] = useState(false)
  const [profile, setProfile] = useState(isDevMode() ? DEV_PROFILE : null)
  const [localUser, setLocalUser] = useState(null)
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [recoveryPassword, setRecoveryPassword] = useState('')
  const [recoveryError, setRecoveryError] = useState('')
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    if (isDevMode()) { navigate('/home'); return }
    async function load() {
      const { data: { user } } = await localStore.auth.getUser()
      if (!user) { navigate('/login'); return }
      setLocalUser(user)
      const { data } = await localStore
        .from('user_profiles')
        .select('guide_selected, guide_name')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) setProfile(data)
    }
    load()
  }, [navigate])

  const meta = profile ? GUIDE_META[profile.guide_selected] : null
  const isUnit = profile?.guide_selected === 'unit'
  const guideName = isUnit
    ? (profile.guide_name || 'UNIT')
    : meta?.name
  const guideAccent = meta?.accent ?? S.gold

  function openRecovery() {
    setRecoveryMode(true)
    setRecoveryPassword('')
    setRecoveryError('')
    setError('')
    setMessage('')
  }

  async function handleRecover(e) {
    e.preventDefault()
    if (!localUser?.email) {
      setRecoveryError('Local profile information is unavailable on this device.')
      return
    }
    if (!recoveryPassword) {
      setRecoveryError('Enter your local profile password.')
      return
    }

    setRecovering(true)
    setRecoveryError('')
    const { error: signInError } = await localStore.auth.signInWithPassword({
      email: localUser.email,
      password: recoveryPassword,
    })
    setRecovering(false)

    if (signInError) {
      setRecoveryError('That password did not match this local profile.')
      return
    }

    clearPin()
    navigate('/pin-setup', { replace: true, state: { isReset: true } })
  }

  async function handleDigit(d) {
    if (locked) return
    if (pin.length >= 4) return
    setError('')

    const next = pin + d
    setPin(next)

    if (next.length === 4) {
      setTimeout(async () => {
        const correct = await verifyPin(next)
        if (correct) {
          navigate('/home')
        } else {
          const newAttempts = attempts + 1
          setAttempts(newAttempts)
          setPin('')

          setShake(true)
          setTimeout(() => setShake(false), 400)

          if (newAttempts >= 3) {
            setLocked(true)
            setError('Too many attempts.')
            setMessage('Verify your local profile password to reset your PIN.')
          } else {
            setError(`Incorrect PIN. ${3 - newAttempts} attempt${3 - newAttempts === 1 ? '' : 's'} remaining.`)
          }
        }
      }, 120)
    }
  }

  function handleDelete() {
    if (locked) return
    setPin((p) => p.slice(0, -1))
    setError('')
  }

  if (recoveryMode) {
    return (
      <div style={{
        minHeight: '100dvh',
        backgroundColor: S.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        boxSizing: 'border-box',
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <h1 style={{
            fontFamily: fontPlayfair,
            fontSize: '28px',
            fontWeight: '600',
            color: S.textPrimary,
            margin: '0 0 12px 0',
            lineHeight: '1.2',
            textAlign: 'center',
          }}>
            Reset your PIN.
          </h1>
          <p style={{
            fontFamily: fontInter,
            fontSize: '14px',
            color: S.textSecondary,
            margin: '0 0 28px 0',
            lineHeight: '1.6',
            textAlign: 'center',
          }}>
            Verify the password for the local profile stored on this device. No reset email is sent.
          </p>

          <form onSubmit={handleRecover}>
            <label style={{ display: 'block', fontFamily: fontInter, fontSize: '11px', fontWeight: '600', color: S.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>
              Local profile email
            </label>
            <input
              value={localUser?.email || ''}
              readOnly
              style={{ width: '100%', height: '50px', backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: '8px', padding: '0 14px', boxSizing: 'border-box', fontFamily: fontInter, fontSize: '15px', color: S.textSecondary, marginBottom: '18px' }}
            />

            <label style={{ display: 'block', fontFamily: fontInter, fontSize: '11px', fontWeight: '600', color: S.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>
              Local profile password
            </label>
            <input
              type="password"
              value={recoveryPassword}
              onChange={(e) => { setRecoveryPassword(e.target.value); setRecoveryError('') }}
              autoComplete="current-password"
              style={{ width: '100%', height: '50px', backgroundColor: S.surface, border: `1px solid ${recoveryError ? S.error : S.border}`, borderRadius: '8px', padding: '0 14px', boxSizing: 'border-box', fontFamily: fontInter, fontSize: '15px', color: S.textPrimary, outline: 'none', marginBottom: recoveryError ? '8px' : '18px' }}
            />

            {recoveryError && (
              <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.error, margin: '0 0 18px 0', lineHeight: '1.5' }}>
                {recoveryError}
              </p>
            )}

            <button
              type="submit"
              disabled={recovering}
              style={{ width: '100%', height: '54px', backgroundColor: recovering ? `${S.gold}70` : S.gold, color: S.bg, border: 'none', borderRadius: '10px', fontFamily: fontInter, fontSize: '15px', fontWeight: '700', cursor: recovering ? 'not-allowed' : 'pointer', marginBottom: '12px' }}
            >
              {recovering ? 'Verifying...' : 'Verify and reset PIN'}
            </button>
          </form>

          <button
            onClick={() => { setRecoveryMode(false); setLocked(false); setAttempts(0); setPin(''); setError(''); setMessage('') }}
            style={{ width: '100%', background: 'none', border: 'none', fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, cursor: 'pointer', padding: '10px' }}
          >
            Back to PIN entry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes pinShake {
          0%   { transform: translateX(0); }
          20%  { transform: translateX(-8px); }
          40%  { transform: translateX(8px); }
          60%  { transform: translateX(-6px); }
          80%  { transform: translateX(6px); }
          100% { transform: translateX(0); }
        }
      `}</style>
      <div style={{
        minHeight: '100dvh',
        backgroundColor: S.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px 48px',
        boxSizing: 'border-box',
      }}>
        <div style={{ width: '100%', maxWidth: '360px', textAlign: 'center' }}>
          {guideName && (
            <p style={{
              fontFamily: fontInter,
              fontSize: '13px',
              color: guideAccent,
              margin: '0 0 16px 0',
              letterSpacing: '0.03em',
            }}>
              {guideName}
            </p>
          )}

          <h1 style={{
            fontFamily: fontPlayfair,
            fontSize: '26px',
            fontWeight: '600',
            color: S.textPrimary,
            margin: 0,
            lineHeight: '1.2',
          }}>
            Welcome back.
          </h1>

          <PinDots value={pin} shake={shake} />

          {error && (
            <p style={{
              fontFamily: fontInter,
              fontSize: '14px',
              color: S.error,
              margin: '-12px 0 20px 0',
              lineHeight: '1.5',
            }}>
              {error}
            </p>
          )}

          {message && (
            <p style={{
              fontFamily: fontInter,
              fontSize: '14px',
              color: S.textSecondary,
              margin: '-12px 0 20px 0',
              lineHeight: '1.6',
            }}>
              {message}
            </p>
          )}

          {!locked && <NumPad onDigit={handleDigit} onDelete={handleDelete} />}

          <button
            onClick={openRecovery}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: fontInter,
              fontSize: '12px',
              color: S.textSecondary,
              cursor: 'pointer',
              marginTop: '20px',
              padding: '8px',
            }}
          >
            Forgot my PIN
          </button>
        </div>
      </div>
    </>
  )
}
