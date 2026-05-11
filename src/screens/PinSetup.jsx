import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { storePin } from '../lib/pin'

const S = {
  bg: '#0A1A0A',
  surface: '#1A2E1A',
  border: '#2D4A2D',
  textPrimary: '#E8F0E8',
  textSecondary: '#8FAF8F',
  gold: '#C9A84C',
  goldHover: '#D4B460',
  error: '#E05C5C',
  success: '#7A9E6B',
}

const fontInter = "'Inter', sans-serif"
const fontPlayfair = "'Playfair Display', serif"

// ── Shared numpad + dot display ───────────────────────────────────────────────

function PinDots({ value }) {
  return (
    <div style={{
      display: 'flex',
      gap: '20px',
      justifyContent: 'center',
      margin: '28px 0',
    }}>
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
        if (key === '') {
          return <div key={i} />
        }
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

// ── Phases ────────────────────────────────────────────────────────────────────

// phase: 'offer' | 'first' | 'confirm' | 'done'

export default function PinSetup() {
  const navigate = useNavigate()
  const location = useLocation()
  const isReset = location.state?.isReset === true

  const [phase, setPhase] = useState(isReset ? 'first' : 'offer')
  const [first, setFirst] = useState('')
  const [second, setSecond] = useState('')
  const [mismatch, setMismatch] = useState(false)
  const [saving, setSaving] = useState(false)

  const activePin = phase === 'first' ? first : second
  const setActivePin = phase === 'first' ? setFirst : setSecond

  function handleDigit(d) {
    if (activePin.length >= 4) return
    const next = activePin + d
    setActivePin(next)
    if (mismatch) setMismatch(false)

    if (next.length === 4) {
      if (phase === 'first') {
        setTimeout(() => setPhase('confirm'), 120)
      } else {
        // confirm phase: compare
        setTimeout(async () => {
          if (next === first) {
            setSaving(true)
            await storePin(first)
            setSaving(false)
            setPhase('done')
            setTimeout(() => navigate('/home'), 900)
          } else {
            setMismatch(true)
            setFirst('')
            setSecond('')
            setPhase('first')
          }
        }, 120)
      }
    }
  }

  function handleDelete() {
    if (activePin.length === 0) return
    setActivePin(activePin.slice(0, -1))
    if (mismatch) setMismatch(false)
  }

  // ── Offer screen ─────────────────────────────────────────────────────────

  if (phase === 'offer') {
    return (
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
          <h1 style={{
            fontFamily: fontPlayfair,
            fontSize: '26px',
            fontWeight: '600',
            color: S.textPrimary,
            margin: '0 0 20px 0',
            lineHeight: '1.2',
          }}>
            One more thing.
          </h1>
          <p style={{
            fontFamily: fontInter,
            fontSize: '16px',
            color: S.textSecondary,
            lineHeight: '1.7',
            margin: '0 0 48px 0',
          }}>
            Want to add a PIN? It locks the app so only you can open your journal.
          </p>
          <button
            onClick={() => setPhase('first')}
            style={{
              width: '100%',
              height: '56px',
              backgroundColor: S.gold,
              color: S.bg,
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              fontFamily: fontInter,
              cursor: 'pointer',
              letterSpacing: '0.03em',
              marginBottom: '20px',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = S.goldHover }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = S.gold }}
          >
            Set a PIN
          </button>
          <button
            onClick={() => navigate('/home')}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: fontInter,
              fontSize: '14px',
              color: S.textSecondary,
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    )
  }

  // ── Done confirmation ─────────────────────────────────────────────────────

  if (phase === 'done') {
    return (
      <div style={{
        minHeight: '100dvh',
        backgroundColor: S.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        boxSizing: 'border-box',
      }}>
        <p style={{
          fontFamily: fontPlayfair,
          fontSize: '22px',
          color: S.success,
          margin: 0,
        }}>
          PIN set.
        </p>
      </div>
    )
  }

  // ── PIN entry UI (first + confirm phases) ─────────────────────────────────

  const heading = isReset && phase === 'first'
    ? 'Set a new PIN.'
    : phase === 'first'
      ? 'Choose a 4-digit code.'
      : 'Enter it again to confirm.'

  return (
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
        {isReset && phase === 'first' && (
          <p style={{
            fontFamily: fontInter,
            fontSize: '16px',
            color: S.textSecondary,
            lineHeight: '1.7',
            margin: '0 0 24px 0',
          }}>
            Your old PIN has been cleared. Set a new one.
          </p>
        )}

        <h1 style={{
          fontFamily: fontPlayfair,
          fontSize: '26px',
          fontWeight: '600',
          color: S.textPrimary,
          margin: '0',
          lineHeight: '1.2',
        }}>
          {heading}
        </h1>

        <PinDots value={activePin} />

        {mismatch && (
          <p style={{
            fontFamily: fontInter,
            fontSize: '14px',
            color: S.error,
            margin: '-12px 0 20px 0',
            lineHeight: '1.5',
          }}>
            Those did not match. Try again.
          </p>
        )}

        {saving && (
          <p style={{
            fontFamily: fontInter,
            fontSize: '14px',
            color: S.textSecondary,
            margin: '-12px 0 20px 0',
          }}>
            Saving...
          </p>
        )}

        <NumPad onDigit={handleDigit} onDelete={handleDelete} />
      </div>
    </div>
  )
}
