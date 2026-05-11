import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { localStore } from '../lib/localStore'
import { hasPin, verifyPin, clearPin, storePin } from '../lib/pin'
import { isDevMode, DEV_PROFILE } from '../lib/dev'

const GUIDE_META = {
  bud:   { name: 'Bud Tendar',     accent: '#C9A84C', description: 'Dispensary deals and trip planning.' },
  sunny: { name: 'Sunny Day',      accent: '#FF7F5C', description: 'Conversation and emotional tracking.' },
  larry: { name: 'Lucky Larry',    accent: '#C17A3A', description: 'Strain history and cannabis culture.' },
  herb:  { name: 'Herb N. Spices', accent: '#4ECDC4', description: 'Terpene science and education.' },
  mary:  { name: 'Mary Jayne',     accent: '#B088B0', description: 'Wellness, sleep, and self-care.' },
  unit:  { name: null,             accent: '#888888', description: 'No guide. Minimal interface.' },
}

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

function SectionHeading({ children }) {
  return (
    <p style={{
      fontFamily: fontInter,
      fontSize: '11px',
      fontWeight: '600',
      color: S.textSecondary,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      margin: '0 0 16px 0',
    }}>
      {children}
    </p>
  )
}

function Divider() {
  return <div style={{ width: '100%', height: '1px', backgroundColor: S.border, margin: '32px 0' }} />
}

// ── Inline mini numpad for PIN verification/change inside Settings ────────────

function MiniPinDots({ value }) {
  return (
    <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', margin: '20px 0' }}>
      {[0,1,2,3].map((i) => (
        <div key={i} style={{
          width: '24px', height: '24px', borderRadius: '50%',
          backgroundColor: i < value.length ? S.gold : 'transparent',
          border: `2px solid ${i < value.length ? S.gold : S.border}`,
          transition: 'all 0.15s ease',
        }} />
      ))}
    </div>
  )
}

function MiniNumPad({ onDigit, onDelete }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','del']
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '8px', width: '100%', maxWidth: '240px', margin: '0 auto',
    }}>
      {keys.map((key, i) => {
        if (key === '') return <div key={i} />
        const isDel = key === 'del'
        return (
          <button
            key={i}
            onClick={() => isDel ? onDelete() : onDigit(key)}
            style={{
              height: '52px', borderRadius: '50px',
              border: `1px solid ${S.border}`, backgroundColor: S.surface,
              color: S.textPrimary, fontFamily: fontInter,
              fontSize: isDel ? '14px' : '18px', fontWeight: '400',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', transition: 'background-color 0.1s ease',
              userSelect: 'none', WebkitUserSelect: 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#243824' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = S.surface }}
          >
            {isDel ? (
              <svg width="18" height="13" viewBox="0 0 22 16" fill="none">
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

// ── PIN management panel ──────────────────────────────────────────────────────

// pinPhase: 'idle' | 'verify' | 'options' | 'change_new' | 'change_confirm' | 'done_remove' | 'done_change'
function PinManager({ onDone }) {
  const navigate = useNavigate()
  const pinActive = hasPin()
  const [pinPhase, setPinPhase] = useState('idle')
  const [pin, setPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')

  if (!pinActive && pinPhase === 'idle') {
    return (
      <button
        onClick={() => navigate('/pin-setup')}
        style={{
          background: 'none', border: 'none',
          fontFamily: fontInter, fontSize: '14px',
          color: S.textSecondary, cursor: 'pointer',
          padding: '0', textDecoration: 'underline',
          textDecorationColor: `${S.textSecondary}60`,
        }}
      >
        Set up a PIN
      </button>
    )
  }

  // Current PIN entry
  if (pinPhase === 'verify') {
    function handleVerifyDigit(d) {
      if (pin.length >= 4) return
      const next = pin + d
      setPin(next)
      setPinError('')
      if (next.length === 4) {
        setTimeout(async () => {
          const ok = await verifyPin(next)
          if (ok) {
            setPin('')
            setPinPhase('options')
          } else {
            setPinError('Incorrect PIN.')
            setPin('')
          }
        }, 120)
      }
    }
    function handleVerifyDelete() { setPin((p) => p.slice(0, -1)); setPinError('') }

    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, margin: '0 0 4px 0' }}>
          Enter your current PIN
        </p>
        <MiniPinDots value={pin} />
        {pinError && <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.error, margin: '-8px 0 12px 0' }}>{pinError}</p>}
        <MiniNumPad onDigit={handleVerifyDigit} onDelete={handleVerifyDelete} />
        <button onClick={() => { setPinPhase('idle'); setPin(''); setPinError('') }}
          style={{ background: 'none', border: 'none', fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, cursor: 'pointer', marginTop: '16px', padding: '8px' }}>
          Cancel
        </button>
      </div>
    )
  }

  // Options after verified
  if (pinPhase === 'options') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={() => { setPinPhase('change_new'); setNewPin(''); setConfirmPin(''); setPinError('') }}
          style={{
            width: '100%', height: '48px', backgroundColor: 'transparent',
            border: `1px solid ${S.gold}`, borderRadius: '8px',
            color: S.gold, fontFamily: fontInter, fontSize: '14px',
            fontWeight: '500', cursor: 'pointer', letterSpacing: '0.02em',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${S.gold}14` }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          Change PIN
        </button>
        <button
          onClick={async () => { clearPin(); setPinPhase('done_remove'); onDone && onDone() }}
          style={{
            width: '100%', height: '48px', backgroundColor: 'transparent',
            border: `1px solid ${S.border}`, borderRadius: '8px',
            color: S.error, fontFamily: fontInter, fontSize: '14px',
            fontWeight: '400', cursor: 'pointer',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${S.error}10` }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          Remove PIN
        </button>
        <button onClick={() => setPinPhase('idle')}
          style={{ background: 'none', border: 'none', fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, cursor: 'pointer', padding: '4px' }}>
          Cancel
        </button>
      </div>
    )
  }

  // Change: enter new PIN
  if (pinPhase === 'change_new') {
    function handleNewDigit(d) {
      if (newPin.length >= 4) return
      const next = newPin + d
      setNewPin(next)
      setPinError('')
      if (next.length === 4) setTimeout(() => setPinPhase('change_confirm'), 120)
    }
    function handleNewDelete() { setNewPin((p) => p.slice(0, -1)) }

    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, margin: '0 0 4px 0' }}>
          Choose a new 4-digit code
        </p>
        <MiniPinDots value={newPin} />
        <MiniNumPad onDigit={handleNewDigit} onDelete={handleNewDelete} />
      </div>
    )
  }

  // Change: confirm new PIN
  if (pinPhase === 'change_confirm') {
    function handleConfirmDigit(d) {
      if (confirmPin.length >= 4) return
      const next = confirmPin + d
      setConfirmPin(next)
      setPinError('')
      if (next.length === 4) {
        setTimeout(async () => {
          if (next === newPin) {
            await storePin(newPin)
            setPinPhase('done_change')
            onDone && onDone()
          } else {
            setPinError('Those did not match. Try again.')
            setNewPin('')
            setConfirmPin('')
            setPinPhase('change_new')
          }
        }, 120)
      }
    }
    function handleConfirmDelete() { setConfirmPin((p) => p.slice(0, -1)); setPinError('') }

    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, margin: '0 0 4px 0' }}>
          Enter it again to confirm
        </p>
        <MiniPinDots value={confirmPin} />
        {pinError && <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.error, margin: '-8px 0 12px 0' }}>{pinError}</p>}
        <MiniNumPad onDigit={handleConfirmDigit} onDelete={handleConfirmDelete} />
      </div>
    )
  }

  if (pinPhase === 'done_remove') {
    return <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, margin: 0 }}>PIN removed.</p>
  }

  if (pinPhase === 'done_change') {
    return <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.success, margin: 0 }}>PIN updated.</p>
  }

  // idle with active PIN
  return (
    <button
      onClick={() => { setPinPhase('verify'); setPin(''); setPinError('') }}
      style={{
        background: 'none', border: 'none', fontFamily: fontInter,
        fontSize: '14px', color: S.textSecondary, cursor: 'pointer',
        padding: '0', textDecoration: 'underline',
        textDecorationColor: `${S.textSecondary}60`,
      }}
    >
      Manage PIN
    </button>
  )
}

// ── Notification Settings component ──────────────────────────────────────────

const CHECKIN_OPTIONS = ['15 min', '30 min', '45 min', '1 hour', 'Off']
const POSTUPDATE_OPTIONS = ['2 hours', '4 hours', '8 hours', 'Next morning', 'Off']
const STYLE_OPTIONS = ['Push', 'In-app', 'Off']

function SettingRow({ label, sublabel, value, options, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid ${S.border}`, paddingBottom: '0' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '14px 0', textAlign: 'left',
        }}
      >
        <div>
          <p style={{ fontFamily: fontInter, fontSize: '15px', color: S.textPrimary, margin: 0 }}>
            {label}
          </p>
          <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, margin: '2px 0 0 0' }}>
            {sublabel || value}
          </p>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0, marginLeft: '12px', color: S.textSecondary }}>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingBottom: '16px' }}>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false) }}
              style={{
                height: '36px', padding: '0 14px', borderRadius: '9999px',
                border: `1px solid ${value === opt ? S.gold : S.border}`,
                backgroundColor: value === opt ? `${S.gold}33` : S.surface,
                color: value === opt ? S.gold : S.textSecondary,
                fontFamily: fontInter, fontSize: '13px', cursor: 'pointer',
                transition: 'all 0.15s ease', flexShrink: 0,
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function QuietHoursRow({ start, end, onChangeStart, onChangeEnd }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid ${S.border}` }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '14px 0', textAlign: 'left',
        }}
      >
        <div>
          <p style={{ fontFamily: fontInter, fontSize: '15px', color: S.textPrimary, margin: 0 }}>
            Quiet hours
          </p>
          <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, margin: '2px 0 0 0' }}>
            {start} – {end}
          </p>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0, marginLeft: '12px', color: S.textSecondary }}>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingBottom: '16px' }}>
          {[{ label: 'Start', val: start, onChange: onChangeStart }, { label: 'End', val: end, onChange: onChangeEnd }].map(({ label, val, onChange }) => (
            <div key={label}>
              <p style={{ fontFamily: fontInter, fontSize: '11px', color: S.textSecondary, margin: '0 0 6px 0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {label}
              </p>
              <input
                type="time"
                value={val}
                onChange={(e) => onChange(e.target.value)}
                style={{
                  width: '100%', height: '44px', backgroundColor: S.surface,
                  border: `1px solid ${S.border}`, borderRadius: '8px',
                  padding: '0 12px', fontFamily: fontInter, fontSize: '15px',
                  color: S.textPrimary, outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                  colorScheme: 'dark',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = S.gold }}
                onBlur={(e) => { e.currentTarget.style.borderColor = S.border }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationSettings() {
  const [checkinTiming, setCheckinTiming] = useState('30 min')
  const [postUpdateTiming, setPostUpdateTiming] = useState('Next morning')
  const [notifStyle, setNotifStyle] = useState('Push')
  const [quietStart, setQuietStart] = useState('23:00')
  const [quietEnd, setQuietEnd] = useState('08:00')

  return (
    <div>
      <SettingRow
        label="In-use check-in"
        value={checkinTiming}
        options={CHECKIN_OPTIONS}
        onChange={setCheckinTiming}
      />
      <SettingRow
        label="Post-use reminder"
        value={postUpdateTiming}
        options={POSTUPDATE_OPTIONS}
        onChange={setPostUpdateTiming}
      />
      <SettingRow
        label="Notification style"
        value={notifStyle}
        options={STYLE_OPTIONS}
        onChange={setNotifStyle}
      />
      <QuietHoursRow
        start={quietStart}
        end={quietEnd}
        onChangeStart={setQuietStart}
        onChangeEnd={setQuietEnd}
      />
    </div>
  )
}

// ── Main Settings screen ──────────────────────────────────────────────────────

export default function Settings() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(isDevMode() ? DEV_PROFILE : null)
  const [loading, setLoading] = useState(!isDevMode())
  const [togglingTool, setTogglingTool] = useState(false)
  const [pinRefresh, setPinRefresh] = useState(0)

  useEffect(() => {
    if (isDevMode()) return
    async function load() {
      const { data: { user } } = await localStore.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await localStore
        .from('user_profiles')
        .select('guide_selected, guide_name, accent_color')
        .eq('user_id', user.id)
        .maybeSingle()
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  const isToolMode = profile?.guide_selected === 'tool'
  const isUnit = profile?.guide_selected === 'unit'
  const currentMeta = profile ? GUIDE_META[profile.guide_selected] : null
  const guideName = isUnit ? (profile.guide_name || 'UNIT') : currentMeta?.name
  const guideAccent = isUnit ? '#888888' : currentMeta?.accent
  const guideDescription = isUnit ? 'No personality. Minimal interface.' : currentMeta?.description
  const pinIsActive = hasPin()

  async function enableToolMode() {
    if (togglingTool) return
    setTogglingTool(true)
    if (!isDevMode()) {
      const { data: { user } } = await localStore.auth.getUser()
      await localStore.from('user_profiles').upsert(
        { user_id: user?.id, guide_selected: 'tool' },
        { onConflict: 'user_id' }
      )
    }
    localStorage.setItem('m420_active_guide', 'tool')
    setProfile((p) => ({ ...p, guide_selected: 'tool' }))
    setTogglingTool(false)
    navigate('/home')
  }

  async function disableToolMode() {
    navigate('/onboarding?step=list')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: S.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: fontInter, color: S.textSecondary, fontSize: '15px' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: S.bg, boxSizing: 'border-box' }}>
      <div style={{
        width: '100%', maxWidth: '480px', margin: '0 auto',
        padding: '56px 24px 80px', boxSizing: 'border-box',
      }}>

        <h1 style={{
          fontFamily: fontPlayfair, fontSize: '28px', fontWeight: '600',
          color: S.textPrimary, margin: '0 0 40px 0', lineHeight: '1.2',
        }}>
          Settings
        </h1>

        {/* ── YOUR GUIDE ──────────────────────────────────────────────────── */}
        <SectionHeading>Your Guide</SectionHeading>

        {profile && !isToolMode && (
          <div style={{
            backgroundColor: S.surface, border: `1px solid ${S.border}`,
            borderLeft: `4px solid ${guideAccent}`, borderRadius: '10px',
            padding: '16px 20px', marginBottom: '12px',
          }}>
            <p style={{ fontFamily: fontPlayfair, fontSize: '18px', fontWeight: '700', color: guideAccent, margin: '0 0 4px 0', lineHeight: '1.2' }}>
              {guideName}
            </p>
            {guideDescription && (
              <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, margin: 0, lineHeight: '1.4' }}>
                {guideDescription}
              </p>
            )}
          </div>
        )}

        {isToolMode && (
          <div style={{
            backgroundColor: S.surface, border: `1px solid ${S.border}`,
            borderLeft: `4px solid ${S.gold}`, borderRadius: '10px',
            padding: '16px 20px', marginBottom: '12px',
          }}>
            <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.gold, margin: '0 0 4px 0', fontWeight: '500', letterSpacing: '0.05em' }}>
              TOOL MODE
            </p>
            <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, margin: 0, lineHeight: '1.4' }}>
              No guide. All five tool layers accessible.
            </p>
          </div>
        )}

        {/* Change guide / Choose a guide button */}
        <button
          onClick={isToolMode ? disableToolMode : () => navigate('/onboarding?step=list')}
          style={{
            width: '100%', height: '48px', backgroundColor: 'transparent',
            border: `1px solid ${S.gold}`, borderRadius: '8px',
            color: S.gold, fontFamily: fontInter, fontSize: '14px',
            fontWeight: '500', cursor: 'pointer', letterSpacing: '0.02em',
            transition: 'background-color 0.15s ease', marginBottom: '24px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${S.gold}14` }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          {isToolMode ? 'Choose a guide' : 'Change guide'}
        </button>

        {/* Tool Mode toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 0', borderTop: `1px solid ${S.border}`,
        }}>
          <div>
            <p style={{ fontFamily: fontInter, fontSize: '15px', color: S.textPrimary, margin: '0 0 2px 0', fontWeight: '400' }}>
              Tool Mode
            </p>
            <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, margin: 0, lineHeight: '1.4' }}>
              Just the tools. No narrative.
            </p>
          </div>
          <button
            onClick={isToolMode ? disableToolMode : enableToolMode}
            disabled={togglingTool}
            aria-label="Toggle Tool Mode"
            style={{
              width: '48px', height: '28px', borderRadius: '14px', border: 'none',
              backgroundColor: isToolMode ? S.gold : S.border,
              cursor: togglingTool ? 'not-allowed' : 'pointer',
              position: 'relative', transition: 'background-color 0.2s ease',
              flexShrink: 0, marginLeft: '16px', padding: 0,
            }}
          >
            <div style={{
              position: 'absolute', top: '3px',
              left: isToolMode ? '23px' : '3px',
              width: '22px', height: '22px', borderRadius: '11px',
              backgroundColor: '#fff', transition: 'left 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }} />
          </button>
        </div>

        <Divider />

        {/* ── PRIVACY ─────────────────────────────────────────────────────── */}
        <SectionHeading>Privacy</SectionHeading>

        {/* App PIN row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 0', borderBottom: `1px solid ${S.border}`, marginBottom: '20px',
        }}>
          <div>
            <p style={{ fontFamily: fontInter, fontSize: '15px', color: S.textPrimary, margin: '0 0 2px 0' }}>
              App PIN
            </p>
            <p style={{ fontFamily: fontInter, fontSize: '13px', color: pinIsActive ? S.success : S.textSecondary, margin: 0 }}>
              {pinIsActive ? 'Active' : 'Not set'}
            </p>
          </div>
        </div>

        {/* PIN manager (inline numpad / options) */}
        <PinManager key={pinRefresh} onDone={() => setPinRefresh((n) => n + 1)} />

        <Divider />

        {/* ── NOTIFICATIONS ───────────────────────────────────────────────── */}
        <SectionHeading>Notifications</SectionHeading>
        <NotificationSettings />

        <Divider />

        {/* ── ACCOUNT ─────────────────────────────────────────────────────── */}
        <SectionHeading>Account</SectionHeading>
        <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, lineHeight: '1.6', margin: 0 }}>
          More account settings coming soon.
        </p>

      </div>
    </div>
  )
}
