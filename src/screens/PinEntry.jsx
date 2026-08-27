import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { localStore } from '../lib/localStore'
import { hasPin, isPinUnlocked, verifyPin } from '../lib/pin'
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

  useEffect(() => {
    if (isDevMode()) { navigate('/home'); return }
    if (!hasPin() || isPinUnlocked()) { navigate('/home', { replace: true }); return }

    async function load() {
      const { data: { user } } = await localStore.auth.getUser()
      if (!user) { navigate('/login'); return }
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
          navigate('/home', { replace: true })
        } else {
          const newAttempts = attempts + 1
          setAttempts(newAttempts)
          setPin('')
          setShake(true)
          setTimeout(() => setShake(false), 400)

          if (newAttempts >= 3) {
            setLocked(true)
            setError('Too many attempts.')
            setMessage('My420Journal has no email or cloud PIN recovery. Close this tab and reopen the journal to try again.')
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
        </div>
      </div>
    </>
  )
}
