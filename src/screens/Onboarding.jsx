import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { localStore } from '../lib/localStore'
import { isDevMode } from '../lib/dev'

// ── Guide data ────────────────────────────────────────────────────────────────

const GUIDES = [
  {
    id: 'bud',
    name: 'Bud Tendar',
    shortName: 'Bud',
    accent: '#C9A84C',
    catchphrase: "Let's make every trip count.",
    miniBio: 'Bud has spent years on the other side of the counter and now he is on yours. He knows the menus, the prices, and exactly how to get you the most for what you spend. With Bud, you stop guessing and start shopping with a plan.',
    tag: 'DISPENSARY AND DEALS',
    bullets: [
      'Tracks dispensary prices and deals near you',
      'Remembers what worked and what to avoid',
      'Helps you plan every trip before you go',
    ],
    selectionConfirmation: 'Good choice. I am going to learn your preferences fast, keep an eye on prices, and make sure every trip counts. Ready when you are.',
    selectionConfirmationSub: null,
  },
  {
    id: 'sunny',
    name: 'Sunny Day',
    shortName: 'Sunny',
    accent: '#FF7F5C',
    catchphrase: 'Well... how are you, really?',
    miniBio: 'Sunny is not here to just log your data. She wants to know how you are doing -- the real version, not the quick one. She remembers what you share and checks in like a friend who genuinely means it. Southern warmth, genuine curiosity, and nowhere else to be.',
    tag: 'CONVERSATION AND EMOTIONAL TRACKING',
    bullets: [
      'Checks in on how you are actually doing',
      'Tracks emotional patterns over time',
      'Remembers what you share session to session',
    ],
    selectionConfirmation: 'Oh... well. You picked me. I am so glad... I really am. We are going to figure some things out together, you and me. Take your time getting settled. I will be right here.',
    selectionConfirmationSub: null,
  },
  {
    id: 'larry',
    name: 'Lucky Larry',
    shortName: 'Larry',
    accent: '#C17A3A',
    catchphrase: 'I probably got a story about that.',
    miniBio: 'Larry has been around this world longer than most apps have existed. He knows the history, the folklore, and the real stories behind what you are smoking. Nothing surprises him. Some of what he tells you is even true.',
    tag: 'STRAIN HISTORY AND CULTURE',
    bullets: [
      'Deep knowledge of strain history and folklore',
      'Dry, unhurried observations on what you log',
      'Helps you stop rebuying the wrong thing',
    ],
    selectionConfirmation: 'Alright. Larry. You made a solid call. I have been around long enough to know what I am doing. We are going to figure out what works for you. It will take a little time. That is fine. I got time.',
    selectionConfirmationSub: null,
  },
  {
    id: 'herb',
    name: 'Herb N. Spices',
    shortName: 'Herb',
    accent: '#4ECDC4',
    catchphrase: 'The chemistry explains everything.',
    miniBio: 'Herb tracks terpene response patterns and gets genuinely excited about it. He says little out loud but thinks a great deal. If you want to understand why something worked -- not just that it worked -- Herb is your guide.',
    tag: 'TERPENE SCIENCE AND EDUCATION',
    bullets: [
      'Builds your personal terpene response profile',
      'Explains the science behind what you feel',
      'Quietly noting patterns while you use the app',
    ],
    selectionConfirmation: 'Okay. Good. Let us get started.',
    selectionConfirmationSub: 'genuinely excited. playing it very cool.',
  },
  {
    id: 'mary',
    name: 'Mary Jayne',
    shortName: 'Mary',
    accent: '#B088B0',
    catchphrase: 'I am not being nosy. It is all useful.',
    miniBio: 'Mary Jayne tracks the full picture -- what you used, how you felt, how you slept, what your body did with it. She asks questions that might feel personal. She acknowledges that. The answers make the data useful. She is entirely on your side.',
    tag: 'WELLNESS AND SELF-CARE',
    bullets: [
      'Tracks sleep, mood, and physical response',
      'Connects usage patterns to wellness outcomes',
      'Supports tolerance breaks and intentional use',
    ],
    selectionConfirmation: 'Good. I am glad you chose me. Here is how this works: you tell me what happened, I help you understand it. The more honest you are in your logs, the more useful I can be. I am on your side. That is the whole thing.',
    selectionConfirmationSub: null,
  },
  {
    id: 'stoner',
    name: 'S.T.O.N.E.R.',
    shortName: 'Journal',
    accent: '#C9A84C',
    catchphrase: 'No guide. No conversation. Just the log.',
    miniBio: 'No personality. No check-ins. No suggestions. You log what happened and the app keeps it. That is the whole thing. If you ever want more, your data will be waiting.',
    tag: 'ANALOG MODE',
    bullets: [
      'No guide messages or check-ins',
      'Clean logging with no distractions',
      'Your data stays intact if you switch later',
    ],
    selectionConfirmation: null,
    selectionConfirmationSub: null,
  },
]

const S = {
  bg: '#0A1A0A',
  surface: '#1A2E1A',
  border: '#2D4A2D',
  textPrimary: '#E8F0E8',
  textSecondary: '#8FAF8F',
  gold: '#C9A84C',
  goldHover: '#D4B460',
  error: '#E05C5C',
}

const fontInter = "'Inter', sans-serif"
const fontPlayfair = "'Playfair Display', serif"

function goldBtnStyle(disabled = false) {
  return {
    width: '100%', height: '56px',
    backgroundColor: disabled ? '#5A4A20' : S.gold,
    color: disabled ? '#4A3A10' : S.bg,
    border: 'none', borderRadius: '10px',
    fontSize: '15px', fontWeight: '600', fontFamily: fontInter,
    cursor: disabled ? 'not-allowed' : 'pointer',
    letterSpacing: '0.03em',
    transition: 'background-color 0.15s ease, transform 0.1s ease',
    flexShrink: 0,
  }
}

function BackButton({ onClick, color }) {
  const c = color || S.textSecondary
  return (
    <button
      onClick={onClick}
      aria-label="Go back"
      style={{
        position: 'absolute', top: '16px', left: '16px',
        width: '44px', height: '44px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: 'none', cursor: 'pointer',
        color: c, borderRadius: '8px',
        transition: 'opacity 0.15s ease', zIndex: 10,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7' }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

const CONFIRM_DURATION = 2500

function ConfirmationScreen({ guide, destination, navigate }) {
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setStarted(true), 50)
    const t2 = setTimeout(() => navigate(destination, { state: { guide } }), CONFIRM_DURATION)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const message = guide?.selectionConfirmation || 'You are all set.'
  const sub = guide?.selectionConfirmationSub

  return (
    <div style={{
      minHeight: '100dvh', backgroundColor: S.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 32px', boxSizing: 'border-box', position: 'relative',
    }}>
      <div style={{ width: '100%', maxWidth: '360px', textAlign: 'center' }}>
        {guide?.name && (
          <p style={{
            fontFamily: fontInter, fontSize: '13px', color: guide.accent,
            letterSpacing: '0.06em', margin: '0 0 24px 0',
            fontWeight: '500', textTransform: 'uppercase',
          }}>
            {guide.name}
          </p>
        )}
        <p style={{
          fontFamily: fontPlayfair, fontSize: '22px', fontWeight: '600',
          color: S.textPrimary, lineHeight: '1.55', margin: 0,
        }}>
          {message}
        </p>
        {sub && (
          <p style={{
            fontFamily: fontInter, fontSize: '14px', fontStyle: 'italic',
            color: S.textSecondary, margin: '16px 0 0 0', lineHeight: '1.5',
          }}>
            {sub}
          </p>
        )}
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '3px', backgroundColor: `${guide?.accent || S.gold}30` }}>
        <div style={{
          height: '100%', backgroundColor: guide?.accent || S.gold,
          width: started ? '100%' : '0%',
          transition: `width ${CONFIRM_DURATION}ms linear`,
        }} />
      </div>
    </div>
  )
}

function GuidesOverview({ onSelect, onBack }) {
  return (
    <div style={{ minHeight: '100dvh', backgroundColor: S.bg, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '56px 20px 40px', boxSizing: 'border-box' }}>
        <h1 style={{ fontFamily: fontPlayfair, fontSize: '26px', fontWeight: '600', color: S.textPrimary, margin: '0 0 8px 0', lineHeight: '1.2' }}>
          Choose your guide.
        </h1>
        <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, margin: '0 0 28px 0', lineHeight: '1.6' }}>
          Tap any guide to learn more. You can switch anytime.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {GUIDES.map((guide) => {
            const isStoner = guide.id === 'stoner'
            return (
              <button
                key={guide.id}
                onClick={() => onSelect(guide)}
                style={{
                  width: '100%', minHeight: '80px',
                  backgroundColor: S.surface,
                  border: `1px solid ${S.border}`,
                  borderLeft: `4px solid ${guide.accent}`,
                  borderRadius: '10px',
                  padding: '14px 44px 14px 16px',
                  textAlign: 'left', cursor: 'pointer',
                  transition: 'background-color 0.15s ease, border-color 0.15s ease',
                  boxSizing: 'border-box', display: 'block', position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${guide.accent}12`
                  e.currentTarget.style.borderColor = `${guide.accent}60`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = S.surface
                  e.currentTarget.style.borderColor = S.border
                }}
              >
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: S.border, display: 'flex', alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>

                <p style={{ fontFamily: fontPlayfair, fontSize: '18px', fontWeight: '700', color: isStoner ? S.textPrimary : guide.accent, margin: '0 0 3px 0', lineHeight: '1.2' }}>
                  {guide.name}
                </p>
                {isStoner && (
                  <p style={{ fontFamily: fontInter, fontSize: '13px', fontStyle: 'italic', color: S.textSecondary, margin: '0 0 4px 0', lineHeight: '1.3' }}>
                    Streamlined Tracking Of Notable Experiences, Recorded.
                  </p>
                )}
                <p style={{ fontFamily: fontInter, fontSize: '13px', fontStyle: 'italic', color: S.textSecondary, margin: '0 0 5px 0', lineHeight: '1.4' }}>
                  {guide.catchphrase}
                </p>
                <p style={{ fontFamily: fontInter, fontSize: '11px', color: S.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, lineHeight: '1.3', opacity: 0.7 }}>
                  {guide.tag}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <BackButton onClick={onBack} />
    </div>
  )
}

function GuideDetail({ guide, onBack, onChoose, saving, saveError }) {
  const isStoner = guide.id === 'stoner'
  const chooseLabel = isStoner ? 'This is how I want it' : `Choose ${guide.shortName} as my guide`

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: S.bg, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{
        position: 'relative',
        background: isStoner
          ? S.bg
          : `linear-gradient(160deg, ${guide.accent}30 0%, ${guide.accent}08 55%, ${S.bg} 100%)`,
        borderBottom: `1px solid ${isStoner ? S.border : `${guide.accent}30`}`,
        padding: '64px 24px 32px',
        flexShrink: 0,
      }}>
        <BackButton onClick={onBack} color={isStoner ? S.textSecondary : 'white'} />

        <p style={{ fontFamily: fontInter, fontSize: '11px', fontWeight: '600', color: isStoner ? S.textSecondary : `${guide.accent}CC`, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px 0' }}>
          {guide.tag}
        </p>
        <h1 style={{ fontFamily: fontPlayfair, fontSize: '34px', fontWeight: '700', color: isStoner ? S.textPrimary : guide.accent, margin: '0 0 10px 0', lineHeight: '1.15' }}>
          {guide.name}
        </h1>
        {isStoner && (
          <p style={{ fontFamily: fontInter, fontSize: '13px', fontStyle: 'italic', color: S.textSecondary, margin: '0 0 8px 0', lineHeight: '1.4' }}>
            Streamlined Tracking Of Notable Experiences, Recorded.
          </p>
        )}
        <p style={{ fontFamily: fontInter, fontSize: '16px', fontStyle: 'italic', color: isStoner ? S.textSecondary : `${guide.accent}CC`, margin: 0, lineHeight: '1.5' }}>
          {guide.catchphrase}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px 160px', boxSizing: 'border-box' }}>
        <p style={{ fontFamily: fontInter, fontSize: '15px', color: S.textPrimary, margin: '0 0 24px 0', lineHeight: '1.75' }}>
          {guide.miniBio}
        </p>

        {guide.bullets && guide.bullets.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {guide.bullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isStoner ? S.gold : guide.accent, flexShrink: 0, marginTop: '7px' }} />
                <span style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, lineHeight: '1.6' }}>{b}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px 32px', backgroundColor: S.bg, borderTop: `1px solid ${S.border}`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {saveError && <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.error, margin: '0 0 2px 0', lineHeight: '1.5', textAlign: 'center' }}>{saveError}</p>}

        <button
          onClick={onChoose}
          disabled={saving}
          style={{
            width: '100%', height: '56px',
            backgroundColor: saving ? `${isStoner ? S.gold : guide.accent}80` : (isStoner ? S.gold : guide.accent),
            color: S.bg, border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: '700', fontFamily: fontInter,
            cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: '0.02em',
            transition: 'opacity 0.15s ease', flexShrink: 0,
          }}
          onMouseEnter={(e) => { if (!saving) e.currentTarget.style.opacity = '0.9' }}
          onMouseLeave={(e) => { if (!saving) e.currentTarget.style.opacity = '1' }}
        >
          {saving ? 'Saving...' : chooseLabel}
        </button>

        <button
          onClick={onBack}
          style={{
            width: '100%', height: '48px',
            backgroundColor: S.surface,
            color: isStoner ? S.gold : guide.accent,
            border: `1px solid ${isStoner ? S.gold : guide.accent}`,
            borderRadius: '10px', fontSize: '15px', fontWeight: '500', fontFamily: fontInter,
            cursor: 'pointer', letterSpacing: '0.02em', transition: 'background-color 0.15s ease', flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${isStoner ? S.gold : guide.accent}18` }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = S.surface }}
        >
          Talk to {guide.shortName}
        </button>
      </div>
    </div>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isGuideChangeOnly = searchParams.get('step') === 'list'

  const [view, setView] = useState(() => isGuideChangeOnly ? 'list' : 'intro')
  const [detailGuide, setDetailGuide] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [confirming, setConfirming] = useState(null)

  async function saveAndNavigate(guide) {
    setSaveError('')
    setSaving(true)

    if (!isDevMode()) {
      const { data: { user } } = await localStore.auth.getUser()
      const { error } = await localStore.from('user_profiles').upsert(
        {
          user_id: user?.id,
          guide_selected: guide.id,
          guide_name: '',
          accent_color: guide.accent,
          na_count: 0,
          interaction_dial: 3,
          q1_answer: '',
          q2_answer: '',
          q3_answer: '',
          entry_count: 0,
        },
        { onConflict: 'user_id' }
      )
      setSaving(false)
      if (error) {
        setSaveError('Something went wrong. Try again.')
        return
      }
    } else {
      setSaving(false)
    }

    localStorage.setItem('m420_active_guide', guide.id)

    if (isGuideChangeOnly) {
      navigate('/home')
      return
    }

    if (guide.selectionConfirmation) {
      setConfirming({ guide, destination: '/pin-setup' })
    } else {
      navigate('/pin-setup')
    }
  }

  if (confirming) {
    return (
      <ConfirmationScreen
        guide={confirming.guide}
        destination={confirming.destination}
        navigate={navigate}
      />
    )
  }

  if (view === 'detail' && detailGuide) {
    return (
      <GuideDetail
        guide={detailGuide}
        onBack={() => setView('list')}
        onChoose={() => saveAndNavigate(detailGuide)}
        saving={saving}
        saveError={saveError}
      />
    )
  }

  if (view === 'list') {
    return (
      <GuidesOverview
        onSelect={(guide) => { setDetailGuide(guide); setView('detail') }}
        onBack={() => { if (isGuideChangeOnly) navigate(-1); else setView('intro') }}
      />
    )
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: S.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px 48px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: fontPlayfair, fontSize: '34px', fontWeight: '600', color: S.textPrimary, margin: '0 0 16px 0', lineHeight: '1.2' }}>
          Before we get started.
        </h1>
        <div style={{ width: '40px', height: '1px', backgroundColor: S.gold, margin: '32px auto', opacity: 0.5 }} />
        <p style={{ fontFamily: fontInter, fontSize: '16px', color: S.textSecondary, lineHeight: '1.75', margin: '0 0 48px 0' }}>
          You are about to meet six guides. Each one has a different personality and unlocks a different layer of the app. Browse them all, then pick the one that fits.
        </p>
        <button
          style={goldBtnStyle()}
          onClick={() => setView('list')}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = S.goldHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = S.gold; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          Meet them
        </button>
      </div>
    </div>
  )
}
