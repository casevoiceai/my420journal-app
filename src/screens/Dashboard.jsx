import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { localStore } from '../lib/localStore'
import { isDevMode, DEV_PROFILE } from '../lib/dev'

// ── Guide voice data ──────────────────────────────────────────────────────────

const GUIDE_META = {
  bud: {
    name: 'Bud Tendar',
    accent: '#C9A84C',
    firstActionPrimary: 'Ready when you are. Log your first session and I will start building your history.',
    firstActionSecondary: null,
  },
  sunny: {
    name: 'Sunny Day',
    accent: '#FF7F5C',
    firstActionPrimary: 'Well... we are starting fresh. I like that. No preconceptions, no history -- just you and me and whatever you decide to share. Whenever you are ready... just hit that button. I have got nowhere to be.',
    firstActionSecondary: 'I will be here whenever.',
  },
  larry: {
    name: 'Lucky Larry',
    accent: '#C17A3A',
    firstActionPrimary: 'Blank slate. Good place to start. Log the first one and we will go from there.',
    firstActionSecondary: null,
  },
  herb: {
    name: 'Herb N. Spices',
    accent: '#4ECDC4',
    firstActionPrimary: 'Nothing in the log yet. That is fine -- first entry is where the data starts. Terpene profiles incoming.',
    firstActionSecondary: null,
  },
  mary: {
    name: 'Mary Jayne',
    accent: '#B088B0',
    firstActionPrimary: 'We are starting from the beginning, which is actually the best place to start. Take your time with the first one.',
    firstActionSecondary: null,
  },
  unit: {
    name: null,
    accent: '#888888',
    firstActionPrimary: null,
    firstActionSecondary: null,
  },
  stoner: {
    name: null,
    accent: '#C9A84C',
    notePrompt: 'Notes.',
    firstActionPrimary: null,
    firstActionSecondary: null,
  },
}

const TOOL_GRID = [
  { label: 'Dispensary',    icon: '◈' },
  { label: 'Wellness',      icon: '◉' },
  { label: 'Strain Library',icon: '◆' },
  { label: 'Terpene Lab',   icon: '◇' },
  { label: 'Journal',       icon: '◎' },
]

// Sunny Day tier greetings -- used by the tier system when wired in
const SUNNY_VOICE = {
  selectionConfirmation: 'Oh... well. You picked me. I am so glad... I really am. We are going to figure some things out together, you and me. Take your time getting settled. I will be right here.',
  firstActionPrimary: 'Well... we are starting fresh. I like that. No preconceptions, no history -- just you and me and whatever you decide to share. Whenever you are ready... just hit that button. I have got nowhere to be.',
  firstActionSecondary: 'I will be here whenever.',
  switchMessage: 'Well, hey... you came looking for me. I am glad. What is on your mind?',
  tiers: [
    'Hey... you came back. That means something.',
    'Hey you... before we log anything -- how are you actually doing today?',
    'Well hey... I was just thinking about you, actually. You said something last time that has been on my mind.',
    'Hey you... I have a question and I need you to be honest with me.',
    'Hey... how are you? And I mean the real version of that question.',
    'Hi... I have been thinking about something you said a while back. Can we come back to it when you are ready?',
  ],
}

const fontInter = "'Inter', sans-serif"
const fontPlayfair = "'Playfair Display', serif"
const GOLD = '#C9A84C'

const S = {
  bg: '#0A1A0A',
  surface: '#1A2E1A',
  border: '#2D4A2D',
  textPrimary: '#E8F0E8',
  textSecondary: '#8FAF8F',
}

// ── Floating Action Button ────────────────────────────────────────────────────

function FAB({ accent, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="New entry"
      style={{
        position: 'fixed',
        bottom: 'calc(64px + 80px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: accent,
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        zIndex: 99,
        transition: 'transform 0.15s ease, opacity 0.15s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(-50%) scale(1.06)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(-50%) scale(1)' }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'translateX(-50%) scale(0.96)' }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'translateX(-50%) scale(1.06)' }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect x="9" y="3" width="6" height="12" rx="3" fill="white" />
        <path d="M5 11a7 7 0 0014 0" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M12 18v3M9 21h6" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </button>
  )
}

// ── Bottom Nav ────────────────────────────────────────────────────────────────

function BottomNav({ active = 'home' }) {
  const navigate = useNavigate()
  const items = [
    {
      id: 'home',
      label: 'Home',
      path: '/home',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      id: 'journal',
      label: 'Journal',
      path: '/entries/new',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'guide',
      label: 'Guide',
      path: '/profile',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ),
    },
  ]

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#0D1F0D',
      borderTop: `1px solid ${S.border}`,
      display: 'flex',
      alignItems: 'stretch',
      height: '64px',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {items.map((item) => {
        const isActive = item.id === active
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? GOLD : S.textSecondary,
              transition: 'color 0.15s ease',
              padding: '0',
            }}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = S.textPrimary }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = S.textSecondary }}
          >
            {item.icon}
            <span style={{
              fontFamily: fontInter,
              fontSize: '10px',
              fontWeight: isActive ? '600' : '400',
              letterSpacing: '0.03em',
              lineHeight: 1,
            }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()

  // Guide data can arrive via location.state (from onboarding confirmation)
  const stateGuide = location.state?.guide

  function buildInitialProfile() {
    if (isDevMode()) return DEV_PROFILE
    if (stateGuide?.id) {
      return {
        guide_selected: stateGuide.id,
        guide_name: stateGuide.name || '',
        accent_color: stateGuide.accent || '',
      }
    }
    return null
  }

  const [profile, setProfile] = useState(buildInitialProfile)

  useEffect(() => {
    if (isDevMode()) return
    async function load() {
      const { data: { user } } = await localStore.auth.getUser()
      if (!user) return
      const { data } = await localStore
        .from('user_profiles')
        .select('guide_selected, guide_name, accent_color, entry_count')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) setProfile(data)
    }
    load()
  }, [])

  const isToolMode = profile?.guide_selected === 'tool'
  const isUnit     = profile?.guide_selected === 'unit'
  const isStoner   = profile?.guide_selected === 'stoner'
  const meta = profile ? GUIDE_META[profile.guide_selected] : null
  const accent = isUnit ? '#888888' : (meta?.accent ?? GOLD)
  const guideName = isUnit
    ? (profile.guide_name || 'UNIT')
    : meta?.name
  const entryCount = profile?.entry_count ?? 0

  // Determine greeting based on tier (Sunny) or default
  function getHeading() {
    if (isUnit) return 'Log when ready.'
    if (profile?.guide_selected === 'sunny') {
      const tierIdx = Math.min(Math.floor(entryCount / 5), SUNNY_VOICE.tiers.length - 1)
      return SUNNY_VOICE.tiers[tierIdx]
    }
    return 'Welcome. Your guide is ready.'
  }

  const firstActionPrimary = meta?.firstActionPrimary ?? null
  const firstActionSecondary = meta?.firstActionSecondary ?? null

  // ── Stoner / Tool Mode home — no guide, no greeting, just capture + tools ──

  if (isToolMode || isStoner) {
    return (
      <>
        <div style={{
          minHeight: '100dvh',
          backgroundColor: S.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px 80px',
          boxSizing: 'border-box',
        }}>
          <div style={{ width: '100%', maxWidth: '360px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {TOOL_GRID.map((tool) => (
                <button
                  key={tool.label}
                  style={{
                    backgroundColor: S.surface,
                    border: `1px solid ${S.border}`,
                    borderTop: `2px solid ${GOLD}`,
                    borderRadius: '10px',
                    padding: '24px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease, background-color 0.15s ease',
                    gridColumn: tool.label === 'Journal' ? '1 / -1' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${GOLD}10`
                    e.currentTarget.style.borderColor = GOLD
                    e.currentTarget.style.borderTopColor = GOLD
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = S.surface
                    e.currentTarget.style.borderColor = S.border
                    e.currentTarget.style.borderTopColor = GOLD
                  }}
                >
                  <span style={{ fontSize: '24px', color: GOLD, lineHeight: 1 }}>{tool.icon}</span>
                  <span style={{ fontFamily: fontInter, fontSize: '13px', fontWeight: '500', color: S.textPrimary, letterSpacing: '0.03em', textAlign: 'center' }}>
                    {tool.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <FAB accent={GOLD} onClick={() => navigate('/entries/new')} />
        <BottomNav active="home" />
      </>
    )
  }

  // ── Empty state (no entries yet) ────────────────────────────────────────────

  if (entryCount === 0 && firstActionPrimary) {
    return (
      <>
        <div style={{
          minHeight: '100dvh',
          backgroundColor: S.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 28px 96px',
          boxSizing: 'border-box',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}>
            {/* Guide name */}
            {guideName && (
              <p style={{
                fontFamily: fontInter,
                fontSize: '13px',
                fontWeight: '500',
                color: accent,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                margin: '0 0 32px 0',
              }}>
                {guideName}
              </p>
            )}

            {/* First-action message */}
            <p style={{
              fontFamily: fontPlayfair,
              fontSize: '21px',
              fontWeight: '500',
              color: S.textPrimary,
              lineHeight: '1.6',
              margin: '0 0 12px 0',
            }}>
              {firstActionPrimary}
            </p>
            {firstActionSecondary && (
              <p style={{
                fontFamily: fontInter,
                fontSize: '15px',
                color: S.textSecondary,
                lineHeight: '1.6',
                margin: '0 0 48px 0',
              }}>
                {firstActionSecondary}
              </p>
            )}
            {!firstActionSecondary && <div style={{ height: '40px' }} />}

            {/* Action buttons */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%',
            }}>
              <button
                onClick={() => navigate('/entries/new?method=scan')}
                style={{
                  width: '100%',
                  height: '56px',
                  backgroundColor: accent,
                  color: S.bg,
                  border: 'none',
                  borderRadius: '10px',
                  fontFamily: fontInter,
                  fontSize: '15px',
                  fontWeight: '600',
                  letterSpacing: '0.03em',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease, transform 0.1s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                Scan Label
              </button>
              <button
                onClick={() => navigate('/entries/new')}
                style={{
                  width: '100%',
                  height: '56px',
                  backgroundColor: 'transparent',
                  color: S.textPrimary,
                  border: `1px solid ${S.border}`,
                  borderRadius: '10px',
                  fontFamily: fontInter,
                  fontSize: '15px',
                  fontWeight: '400',
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease, background-color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.backgroundColor = `${accent}0D` }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                Log Manually
              </button>
            </div>
          </div>
        </div>
        <FAB accent={accent} onClick={() => navigate('/entries/new')} />
        <BottomNav active="home" />
      </>
    )
  }

  // ── Normal home (has entries or unit mode) ──────────────────────────────────

  return (
    <>
      <div style={{
        minHeight: '100dvh',
        backgroundColor: S.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px 96px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}>
          {accent && !isUnit && (
            <div style={{
              width: '64px',
              height: '4px',
              backgroundColor: accent,
              borderRadius: '2px',
              marginBottom: '32px',
              opacity: 0.8,
            }} />
          )}

          <h1 style={{
            fontFamily: fontPlayfair,
            fontSize: '32px',
            fontWeight: '600',
            color: S.textPrimary,
            margin: '0 0 16px 0',
            lineHeight: '1.2',
          }}>
            {getHeading()}
          </h1>

          {guideName && !isUnit && (
            <p style={{
              fontFamily: fontInter,
              fontSize: '16px',
              color: accent,
              margin: '0',
              fontWeight: '500',
              letterSpacing: '0.02em',
            }}>
              {guideName}
            </p>
          )}

          {isUnit && guideName && (
            <p style={{
              fontFamily: fontInter,
              fontSize: '16px',
              color: '#888888',
              margin: '0',
              fontWeight: '500',
              letterSpacing: '0.02em',
            }}>
              {guideName}
            </p>
          )}

          {!profile && (
            <p style={{ fontFamily: fontInter, fontSize: '15px', color: S.textSecondary }}>
              Loading...
            </p>
          )}
        </div>
      </div>
      <FAB accent={accent} onClick={() => navigate('/entries/new')} />
      <BottomNav active="home" />
    </>
  )
}
