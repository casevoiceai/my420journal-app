import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { localStore } from './lib/localStore'
import { clearPin, hasPin } from './lib/pin'
import { isDevMode } from './lib/dev'
import AgeGate from './screens/AgeGate'
import Signup from './screens/Signup'
import Login from './screens/Login'
import Onboarding from './screens/Onboarding'
import PinSetup from './screens/PinSetup'
import PinEntry from './screens/PinEntry'
import Home from './screens/Home'
import Dashboard from './screens/Dashboard'
import NewEntry from './screens/NewEntry'
import EntryDetail from './screens/EntryDetail'
import EditEntry from './screens/EditEntry'
import Stash from './screens/Stash'
import StashDetail from './screens/StashDetail'
import Insights from './screens/Insights'
import SharedSignals from './screens/SharedSignals'
import Profile from './screens/Profile'
import Settings from './screens/Settings'
import Strains from './screens/Strains'
import StrainDetail from './screens/StrainDetail'
import ForgotPassword from './screens/ForgotPassword'
import CheckIn from './screens/CheckIn'
import PostUseUpdate from './screens/PostUseUpdate'
import QuickEntry from './screens/QuickEntry'
import Journal from './screens/Journal'
import Guide from './screens/Guide'
import SleepEntryDetail from './screens/SleepEntryDetail'
import NoteEntry from './screens/NoteEntry'
import DevBar from './components/DevBar'
import MarketingHome from './marketing/MarketingHome'
import MarketingAbout from './marketing/MarketingAbout'
import MarketingFAQ from './marketing/MarketingFAQ'
import MarketingContact from './marketing/MarketingContact'
import MarketingPartners from './marketing/MarketingPartners'
import MarketingPrivacy from './marketing/MarketingPrivacy'
import { retryQueuedSharedContributions } from './lib/sharedContributionQueue'

const fontInter = "'Inter', sans-serif"

// ── Routes where the bottom nav should NOT render ────────────────────────────
const NO_NAV_ROUTES = new Set([
  '/',
  '/about',
  '/faq',
  '/contact',
  '/partners',
  '/privacy',
  '/app',
  '/signup',
  '/login',
  '/onboarding',
  '/pin',
  '/pin-setup',
  '/forgot-password',
])

function routeHidesNav(pathname) {
  if (NO_NAV_ROUTES.has(pathname)) return true
  if (pathname.startsWith('/onboarding')) return true
  return false
}

// ── Bottom navigation bar ─────────────────────────────────────────────────────

const NAV_TABS = [
  {
    key: 'home',
    label: 'Home',
    path: '/home',
    icon: (active, color) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H15v-5h-6v5H4a1 1 0 01-1-1V10.5z"
          stroke={color} strokeWidth={active ? '2' : '1.6'} strokeLinecap="round" strokeLinejoin="round"
          fill={active ? `${color}25` : 'none'} />
      </svg>
    ),
  },
  {
    key: 'journal',
    label: 'Journal',
    path: '/journal',
    icon: (active, color) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="3" width="13" height="18" rx="2"
          stroke={color} strokeWidth={active ? '2' : '1.6'}
          fill={active ? `${color}20` : 'none'} />
        <path d="M8 8h6M8 12h6M8 16h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M17 6h1a2 2 0 010 4h-1" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'guide',
    label: 'Guide',
    path: '/guide',
    icon: (active, color) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
          stroke={color} strokeWidth={active ? '2' : '1.6'} strokeLinecap="round" strokeLinejoin="round"
          fill={active ? `${color}25` : 'none'} />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: (active, color) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke={color} strokeWidth={active ? '2' : '1.6'} />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
          stroke={color} strokeWidth={active ? '2' : '1.6'} />
      </svg>
    ),
  },
]

function useGuideAccent() {
  const [accent, setAccent] = useState('#C9A84C')
  useEffect(() => {
    if (isDevMode()) { setAccent('#FF7F5C'); return }
    async function load() {
      const { data: { user } } = await localStore.auth.getUser()
      if (!user) return
      const GUIDE_ACCENTS = {
        bud: '#C9A84C', sunny: '#FF7F5C', larry: '#C17A3A',
        herb: '#4ECDC4', mary: '#B088B0', stoner: '#C9A84C',
        unit: '#888888', tool: '#C9A84C',
      }
      const { data } = await localStore.from('user_profiles')
        .select('guide_selected, accent_color')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data?.accent_color) { setAccent(data.accent_color); return }
      if (data?.guide_selected) setAccent(GUIDE_ACCENTS[data.guide_selected] || '#C9A84C')
    }
    load()
  }, [])
  return accent
}

function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const accent   = useGuideAccent()

  if (routeHidesNav(location.pathname)) return null

  const activePath = '/' + location.pathname.split('/')[1]

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: '64px',
      backgroundColor: '#0A1A0A',
      borderTop: '1px solid #2D4A2D',
      display: 'flex', alignItems: 'stretch',
      zIndex: 100,
    }}>
      {NAV_TABS.map((tab) => {
        const active = activePath === tab.path
        const color  = active ? accent : '#8FAF8F'
        return (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '3px', background: 'none', border: 'none',
              cursor: 'pointer', minWidth: '44px', padding: 0,
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.opacity = '0.75' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            {tab.icon(active, color)}
            <span style={{
              fontFamily: fontInter, fontSize: '10px', fontWeight: active ? '600' : '400',
              color, lineHeight: 1, letterSpacing: '0.02em',
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

// ── Auth utilities ────────────────────────────────────────────────────────────

const HIDDEN_EXIT_ROUTES = new Set(['/', '/about', '/faq', '/contact', '/partners', '/privacy', '/app', '/signup'])

function EmergencyExit() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [closing, setClosing] = useState(false)

  if (isDevMode()) return null
  if (HIDDEN_EXIT_ROUTES.has(location.pathname)) return null

  function handleExit() {
    setClosing(true)
    setTimeout(() => { navigate('/') }, 1000)
  }

  return (
    <>
      {closing && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: '#0A1A0A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: fontInter, fontSize: '16px', color: '#8FAF8F' }}>
            Closing...
          </span>
        </div>
      )}
      {!closing && (
        <button
          onClick={handleExit}
          style={{
            position: 'fixed', bottom: '72px', right: '16px',
            zIndex: 9000, height: '32px', width: '52px',
            backgroundColor: 'rgba(10,26,10,0.95)',
            border: '1px solid #2D4A2D', borderRadius: '9999px',
            cursor: 'pointer', fontFamily: fontInter,
            fontSize: '10px', color: '#8FAF8F',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
          EXIT
        </button>
      )}
    </>
  )
}

function RecoveryHandler() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isDevMode()) return
    const params = new URLSearchParams(
      window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
    )
    if (params.get('type') === 'recovery') {
      clearPin()
      navigate('/pin-setup', { state: { isReset: true }, replace: true })
    }
  }, [location.key, navigate])

  return null
}

function HomeGuard() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(isDevMode())

  useEffect(() => {
    if (isDevMode()) return
    async function check() {
      const { data: { session } } = await localStore.auth.getSession()
      if (!session) { navigate('/login', { replace: true }); return }
      if (hasPin()) { navigate('/pin', { replace: true }); return }
      setReady(true)
    }
    check()
  }, [navigate])

  if (!ready) return null
  return <Home />
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  useEffect(() => {
    retryQueuedSharedContributions()
  }, [])

  return (
    <BrowserRouter>
      <RecoveryHandler />
      <EmergencyExit />
      <Routes>
        <Route path="/"                  element={<MarketingHome />} />
        <Route path="/about"             element={<MarketingAbout />} />
        <Route path="/faq"               element={<MarketingFAQ />} />
        <Route path="/contact"           element={<MarketingContact />} />
        <Route path="/partners"          element={<MarketingPartners />} />
        <Route path="/privacy"           element={<MarketingPrivacy />} />
        <Route path="/app"               element={<AgeGate />} />
        <Route path="/signup"            element={<Signup />} />
        <Route path="/login"             element={<Login />} />
        <Route path="/forgot-password"   element={<ForgotPassword />} />
        <Route path="/onboarding"        element={<Onboarding />} />
        <Route path="/pin-setup"         element={<PinSetup />} />
        <Route path="/pin"               element={<PinEntry />} />
        <Route path="/home"              element={<HomeGuard />} />
        <Route path="/dashboard"         element={<Navigate to="/home" replace />} />
        <Route path="/entries/new"       element={<NewEntry />} />
        <Route path="/entries/sleep/:id"  element={<SleepEntryDetail />} />
        <Route path="/entries/:id"       element={<EntryDetail />} />
        <Route path="/entries/:id/edit"  element={<EditEntry />} />
        <Route path="/stash"             element={<Stash />} />
        <Route path="/stash/:id"         element={<StashDetail />} />
        <Route path="/strains"           element={<Strains />} />
        <Route path="/strains/:id"       element={<StrainDetail />} />
        <Route path="/insights"          element={<Insights />} />
        <Route path="/shared-signals"    element={<SharedSignals />} />
        <Route path="/profile"           element={<Profile />} />
        <Route path="/settings"          element={<Settings />} />
        <Route path="/quick"             element={<QuickEntry />} />
        <Route path="/journal"           element={<Journal />} />
        <Route path="/guide"             element={<Guide />} />
        <Route path="/notes/new"         element={<NoteEntry />} />
        <Route path="/checkin"           element={<CheckIn />} />
        <Route path="/update/:entryId"   element={<PostUseUpdate />} />
        <Route path="*"                  element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
      <DevBar />
    </BrowserRouter>
  )
}
