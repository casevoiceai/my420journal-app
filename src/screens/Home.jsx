import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { localStore } from '../lib/localStore'
import { isDevMode } from '../lib/dev'

const S = {
  bg:            '#0A1A0A',
  surface:       '#1A2E1A',
  border:        '#2D4A2D',
  textPrimary:   '#E8F0E8',
  textSecondary: '#8FAF8F',
  gold:          '#C9A84C',
}
const fontInter    = "'Inter', sans-serif"
const fontPlayfair = "'Playfair Display', serif"

const GUIDE_META = {
  bud:    { name: 'Bud Tendar',       accent: '#C9A84C', greeting: "What are we shopping for?"         },
  sunny:  { name: 'Sunny Day',        accent: '#FF7F5C', greeting: 'Ready when you are.'               },
  larry:  { name: 'Lucky Larry',      accent: '#C17A3A', greeting: 'What did you get?'                 },
  herb:   { name: 'Herb N. Spices',   accent: '#4ECDC4', greeting: 'Log something. I will look at it.' },
  mary:   { name: 'Mary Jayne',       accent: '#B088B0', greeting: 'What are we tracking today?'       },
  stoner: { name: null,               accent: '#C9A84C', greeting: ''                                   },
  unit:   { name: null,               accent: '#888888', greeting: ''                                   },
  tool:   { name: null,               accent: '#C9A84C', greeting: ''                                   },
}

const DEV_PROFILE = {
  guide_selected: 'sunny',
  accent_color:   '#FF7F5C',
}

export default function Home() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (isDevMode()) { setProfile(DEV_PROFILE); setLoading(false); return }
      const { data: { user } } = await localStore.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await localStore
        .from('user_profiles')
        .select('guide_selected, accent_color')
        .eq('user_id', user.id)
        .maybeSingle()
      setProfile(data || { guide_selected: 'bud', accent_color: null })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{ minHeight: '100dvh', backgroundColor: S.bg }} />

  const guideKey  = profile?.guide_selected || 'bud'
  const meta      = GUIDE_META[guideKey] || GUIDE_META.bud
  const accent    = profile?.accent_color || meta.accent
  const guideName = meta.name || ''

  return (
    <div style={{
      minHeight: '100dvh', backgroundColor: S.bg,
      display: 'flex', flexDirection: 'column',
      boxSizing: 'border-box', paddingBottom: '64px',
    }}>

      {/* Guide intro — minimal, not dominant */}
      <div style={{ padding: '20px 20px 0' }}>
        {guideName && (
          <p style={{
            fontFamily: fontInter, fontSize: '11px', fontWeight: '600',
            color: accent, letterSpacing: '0.1em', textTransform: 'uppercase',
            margin: '0 0 4px 0',
          }}>
            {guideName}
          </p>
        )}
        {meta.greeting && (
          <p style={{
            fontFamily: fontInter, fontSize: '14px', fontStyle: 'italic',
            color: S.textSecondary, margin: 0, lineHeight: '1.4',
          }}>
            {meta.greeting}
          </p>
        )}
      </div>

      {/* Launch pad grid */}
      <div style={{
        padding: '20px 20px 0',
        display: 'flex', flexDirection: 'column', gap: '12px',
        flex: 1,
      }}>

        {/* Talk to Guide — full width, generic style */}
        <button
          onClick={() => {
            const active = localStorage.getItem('m420_active_guide')
            navigate(active ? '/guide' : '/onboarding')
          }}
          style={{
            width: '100%', height: '88px',
            backgroundColor: S.surface,
            border: `1px solid ${S.gold}`,
            borderRadius: '12px', cursor: 'pointer',
            fontFamily: fontPlayfair, fontSize: '18px', fontWeight: '600',
            color: S.gold,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background-color 0.12s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${S.gold}14` }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = S.surface }}
        >
          Talk to Your Guide
        </button>

        {/* Quick Log + Full Log */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <GridButton label="Quick Log 🎤" onClick={() => navigate('/quick')} borderColor={S.gold} textColor={S.gold} />
          <GridButton label="Full Log 📋" onClick={() => navigate('/entries/new')} borderColor={S.gold} textColor={S.gold} />
        </div>

        {/* Journal + Sleep Log */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <GridButton label="Journal 📖" onClick={() => navigate('/journal')} borderColor={S.gold} textColor={S.gold} />
          <GridButton label="Sleep Log 🌙" onClick={() => navigate('/quick?mode=sleep')} borderColor={S.gold} textColor={S.gold} />
        </div>

        {/* Notes + Settings */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <GridButton label="Notes 📝" onClick={() => navigate('/notes/new')} borderColor={S.gold} textColor={S.gold} />
          <GridButton label="Settings ⚙️" onClick={() => navigate('/settings')} borderColor={S.border} textColor={S.textSecondary} />
        </div>

      </div>
    </div>
  )
}

function GridButton({ label, onClick, borderColor, textColor }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, minHeight: '80px',
        backgroundColor: S.surface,
        border: `1px solid ${borderColor}`,
        borderRadius: '12px', cursor: 'pointer',
        fontFamily: fontInter, fontSize: '15px', fontWeight: '700',
        color: textColor, padding: '0 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', lineHeight: '1.3',
        transition: 'background-color 0.12s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${borderColor}14` }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = S.surface }}
    >
      {label}
    </button>
  )
}
