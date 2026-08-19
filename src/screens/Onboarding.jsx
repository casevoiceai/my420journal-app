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
    catchphrase: "Let's make your own history useful.",
    miniBio: 'Bud is practical and direct. He helps you look back at what you logged, pull up recent product entries, and keep the conversation focused on your own journal.',
    tag: 'PRACTICAL JOURNAL REVIEW',
    bullets: [
      'Reviews products you already logged',
      'Helps you find recent entries and details',
      'Does not tell you what to buy or use',
    ],
    selectionConfirmation: 'Good choice. We will keep this practical. You log it, and I will help you look back at what you actually recorded.',
    selectionConfirmationSub: null,
  },
  {
    id: 'sunny',
    name: 'Sunny Day',
    shortName: 'Sunny',
    accent: '#FF7F5C',
    catchphrase: 'Well... what did you log?',
    miniBio: 'Sunny is warm, conversational, and easygoing. She helps you revisit what is already in your journal without adding outside information or assumptions.',
    tag: 'WARM JOURNAL REVIEW',
    bullets: [
      'Looks back at your recent product logs',
      'Keeps the conversation grounded in your entries',
      'Does not invent information you did not log',
    ],
    selectionConfirmation: 'Oh... well. You picked me. I am so glad. You bring the journal, and we will look at what you actually recorded together.',
    selectionConfirmationSub: null,
  },
  {
    id: 'larry',
    name: 'Lucky Larry',
    shortName: 'Larry',
    accent: '#C17A3A',
    catchphrase: 'I probably got a way to look back at that.',
    miniBio: 'Larry keeps the conversation laid-back and story-like while staying grounded in your own logged history. He does not add strain lore or outside cannabis knowledge.',
    tag: 'LAID-BACK JOURNAL REVIEW',
    bullets: [
      'Reviews products and details you already logged',
      'Keeps the tone dry and unhurried',
      'Stays inside your own journal history',
    ],
    selectionConfirmation: 'Alright. Larry. You made a solid call. We will take our time and work with what you actually logged. I got time.',
    selectionConfirmationSub: null,
  },
  {
    id: 'herb',
    name: 'Herb N. Spices',
    shortName: 'Herb',
    accent: '#4ECDC4',
    catchphrase: 'Let us look at what you actually recorded.',
    miniBio: 'Herb is detail-focused. He helps you pull structured details from your own entries, such as product information, mood, and effect tags, without adding outside cannabis science.',
    tag: 'DETAIL-FOCUSED JOURNAL REVIEW',
    bullets: [
      'Pulls structured details from your entries',
      'Reviews recent product logs and recorded tags',
      'Does not add outside cannabis science',
    ],
    selectionConfirmation: 'Okay. Good. Let us get started.',
    selectionConfirmationSub: 'genuinely excited. playing it very cool.',
  },
  {
    id: 'mary',
    name: 'Mary Jayne',
    shortName: 'Mary',
    accent: '#B088B0',
    catchphrase: 'If you logged it, we can look back at it.',
    miniBio: 'Mary Jayne is calm and personal. She helps you revisit products, notes, mood, and effect tags you recorded without turning your journal into medical advice.',
    tag: 'CALM JOURNAL REVIEW',
    bullets: [
      'Reviews products and notes you logged',
      'Helps you revisit mood and effect tags you recorded',
      'Does not turn entries into medical advice',
    ],
    selectionConfirmation: 'Good. I am glad you chose me. You tell the journal what happened, and I will help you look back at what you recorded. I am on your side. That is the whole thing.',
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

// ── Style tokens ──────────────────────────────────────────────────────────────

const S = {
  bg: '#0A1A0A',
  surface: '#1A2E1A',
  border: '#2D4A2D',
  textPrimary: '#E8F0E8',
  textSecondary: '#8FAF8F',
  gold: '#C9A84C',
  goldHover: '#D4B460',
  goldDisabled: '#5A4A20',
  goldDisabledText: '#4A3A10',
  error: '#E05C5C',
}

const fontInter    = "'Inter', sans-serif"
const fontPlayfair = "'Playfair Display', serif"

function goldBtnStyle(disabled = false) {
  return {
    width: '100%', height: '56px',
    backgroundColor: disabled ? S.goldDisabled : S.gold,
    color: disabled ? S.goldDisabledText : S.bg,
    border: 'none', borderRadius: '10px',
    fontSize: '15px', fontWeight: '600', fontFamily: fontInter,
    cursor: disabled ? 'not-allowed' : 'pointer',
    letterSpacing: '0.03em',
    transition: 'background-color 0.15s ease, transform 0.1s ease',
    flexShrink: 0,
  }
}

// ── Radius options ────────────────────────────────────────────────────────────

const RADIUS_OPTIONS = [
  { label: '5 miles',   value: 5  },
  { label: '15 miles',  value: 15 },
  { label: '30 miles',  value: 30 },
  { label: '50+ miles', value: 50 },
]

// ── Shared components ─────────────────────────────────────────────────────────

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

// ── Confirmation screen ───────────────────────────────────────────────────────

const CONFIRM_DURATION = 2500

function ConfirmationScreen({ guide, destination, navigate }) {
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setStarted(true), 50)
    const t2 = setTimeout(() => navigate(destination, { state: { guide } }), CONFIRM_DURATION)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const message = guide?.selectionConfirmation || 'You are all set.'
  const sub     = guide?.selectionConfirmationSub

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

// ── Location preferences screen ───────────────────────────────────────────────

function LocationPrefsScreen({ onSave, saving, saveError }) {
  const [homeCity,        setHomeCity]        = useState('')
  const [travelRadius,    setTravelRadius]    = useState(15)
  const [preferredCities, setPreferredCities] = useState('')

  function handleSave() {
    onSave({ home_city: homeCity.trim(), travel_radius_miles: travelRadius, preferred_cities: preferredCities.trim() })
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: S.bg, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '48px 24px 180px', boxSizing: 'border-box', maxWidth: '420px', width: '100%', margin: '0 auto' }}>
        <h1 style={{ fontFamily: fontPlayfair, fontSize: '26px', fontWeight: '600', color: S.textPrimary, margin: '0 0 10px 0', lineHeight: '1.2' }}>
          Where do you usually shop?
        </h1>
        <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, margin: '0 0 36px 0', lineHeight: '1.6' }}>
          These optional preferences are saved with your local profile. They do not enable product recommendations or purchasing.
        </p>

        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontFamily: fontInter, fontSize: '11px', fontWeight: '600', color: S.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Your city
          </label>
          <input
            type="text" value={homeCity} onChange={(e) => setHomeCity(e.target.value)}
            placeholder="City, State — e.g. Scranton, PA"
            style={{ width: '100%', height: '52px', backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: '8px', padding: '0 16px', fontFamily: fontInter, fontSize: '16px', color: S.textPrimary, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s ease' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = S.gold }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = S.border }}
          />
        </div>

        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontFamily: fontInter, fontSize: '11px', fontWeight: '600', color: S.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
            How far will you travel?
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {RADIUS_OPTIONS.map((opt) => {
              const sel = travelRadius === opt.value
              return (
                <button key={opt.value} onClick={() => setTravelRadius(opt.value)} style={{ height: '40px', padding: '0 18px', borderRadius: '9999px', border: `1px solid ${sel ? S.gold : S.border}`, backgroundColor: sel ? `${S.gold}22` : S.surface, color: sel ? S.gold : S.textSecondary, fontFamily: fontInter, fontSize: '14px', fontWeight: sel ? '600' : '400', cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap' }}
                  onMouseEnter={(e) => { if (!sel) e.currentTarget.style.borderColor = `${S.gold}80` }}
                  onMouseLeave={(e) => { if (!sel) e.currentTarget.style.borderColor = S.border }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontFamily: fontInter, fontSize: '11px', fontWeight: '600', color: S.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Other cities you shop in? <span style={{ fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </label>
          <input
            type="text" value={preferredCities} onChange={(e) => setPreferredCities(e.target.value)}
            placeholder="e.g. Dickson City, Moosic"
            style={{ width: '100%', height: '52px', backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: '8px', padding: '0 16px', fontFamily: fontInter, fontSize: '16px', color: S.textPrimary, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s ease' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = S.gold }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = S.border }}
          />
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px 32px', backgroundColor: S.bg, borderTop: `1px solid ${S.border}`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        {saveError && <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.error, margin: 0, lineHeight: '1.5', textAlign: 'center' }}>{saveError}</p>}
        <button onClick={handleSave} disabled={saving} style={goldBtnStyle(saving)}
          onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.backgroundColor = S.goldHover; e.currentTarget.style.transform = 'translateY(-1px)' } }}
          onMouseLeave={(e) => { if (!saving) { e.currentTarget.style.backgroundColor = S.gold; e.currentTarget.style.transform = 'translateY(0)' } }}
        >
          {saving ? 'Saving...' : 'Save my preferences'}
        </button>
        <button onClick={() => onSave(null)} style={{ background: 'none', border: 'none', fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, cursor: 'pointer', padding: '4px' }}>
          Skip for now
        </button>
      </div>
    </div>
  )
}

// ── Step 1: All-guides overview list ─────────────────────────────────────────

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
  const navigate      = useNavigate()
  const [searchParams] = useSearchParams()
  const isGuideChangeOnly = searchParams.get('step') === 'list'

  const [view,       setView]       = useState(() => isGuideChangeOnly ? 'list' : 'intro')
  const [detailGuide, setDetailGuide] = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [saveError,  setSaveError]  = useState('')
  const [confirming, setConfirming] = useState(null)
  const [showLocation, setShowLocation] = useState(false)

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
      setConfirming({ guide, destination: '/onboarding?step=location' })
    } else {
      setShowLocation(true)
    }
  }

  async function handleSaveLocationPrefs(prefs) {
    if (prefs && !isDevMode()) {
      setSaving(true)
      setSaveError('')
      const { data: { user } } = await localStore.auth.getUser()
      const { error } = await localStore.from('user_profiles').upsert(
        { user_id: user?.id, ...prefs },
        { onConflict: 'user_id' }
      )
      setSaving(false)
      if (error) { setSaveError('Could not save preferences. Try again.'); return }
    }
    navigate('/pin-setup')
  }

  if (searchParams.get('step') === 'location' || showLocation) {
    return (
      <LocationPrefsScreen
        onSave={handleSaveLocationPrefs}
        saving={saving}
        saveError={saveError}
      />
    )
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
          You are about to meet six guide options. Five use different personalities to help you review the same local journal. S.T.O.N.E.R. keeps the experience to logging only. You can switch anytime.
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
