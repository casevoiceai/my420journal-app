import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { localStore } from './lib/localStore'
import { clearPinUnlock, hasPin, isPinUnlocked } from './lib/pin'
import { clearPrivateActivity, isPrivateSessionExpired, markPrivateActivity, readPrivateActivity, PRIVATE_INACTIVITY_MS } from './lib/privacySession'
import { isDevMode } from './lib/dev'
import { hasStoredMarketAccess } from './lib/residence'
import { stageCrisisFollowupOnAppOpen } from './lib/guideSafety'
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
import Insights from './screens/Insights'
import Settings from './screens/Settings'
import CheckIn from './screens/CheckIn'
import PostUseUpdate from './screens/PostUseUpdate'
import QuickEntry from './screens/QuickEntry'
import Journal from './screens/Journal'
import Guide from './screens/Guide'
import SleepEntryDetail from './screens/SleepEntryDetail'
import NoteEntry from './screens/NoteEntry'
import DevBar from './components/DevBar'
import WeedGoblinsChat from './features/games/weed-goblins/WeedGoblinsChat'
import MarketingHome from './marketing/MarketingHome'
import MarketingAbout from './marketing/MarketingAbout'
import MarketingFAQ from './marketing/MarketingFAQ'
import MarketingContact from './marketing/MarketingContact'
import MarketingPartners from './marketing/MarketingPartners'
import MarketingPrivacy from './marketing/MarketingPrivacy'
import { retryQueuedSharedContributions } from './lib/sharedContributionQueue'

const fontInter = "'Inter', sans-serif"

const NO_NAV_ROUTES = new Set([
  '/',
  '/about',
  '/faq',
  '/contact',
  '/partners',
  '/privacy',
  '/app',
  '/app/start',
  '/app/open',
  '/signup',
  '/login',
  '/onboarding',
  '/pin',
  '/pin-setup',
  '/forgot-password',
  '/games/weed-goblins',
])

function routeHidesNav(pathname) {
  if (NO_NAV_ROUTES.has(pathname)) return true
  if (pathname.startsWith('/onboarding')) return true
  return false
}

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
  const accent = useGuideAccent()

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
        const color = active ? accent : '#8FAF8F'
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

const HIDDEN_EXIT_ROUTES = new Set([
  '/',
  '/about',
  '/faq',
  '/contact',
  '/partners',
  '/privacy',
  '/app',
  '/app/start',
  '/app/open',
  '/signup',
  '/login',
  '/forgot-password',
  '/games/weed-goblins',
])

function EmergencyExit() {
  const location = useLocation()
  const [closing, setClosing] = useState(false)

  if (isDevMode()) return null
  if (HIDDEN_EXIT_ROUTES.has(location.pathname)) return null

  function handleExit() {
    clearPinUnlock()
    clearPrivateActivity()
    setClosing(true)
    setTimeout(() => { window.location.replace('/') }, 350)
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

function MarketAccessGuard() {
  if (isDevMode()) return <Outlet />
  if (!hasStoredMarketAccess()) return <Navigate to="/app" replace />
  return <Outlet />
}

function JournalAccessGuard() {
  const navigate = useNavigate()
  const [sessionReady, setSessionReady] = useState(isDevMode())

  useEffect(() => {
    if (isDevMode()) return
    let cancelled = false

    async function checkSession() {
      const { data: { session } } = await localStore.auth.getSession()
      if (!session) {
        navigate('/app/open', { replace: true })
        return
      }
      if (!cancelled) setSessionReady(true)
    }

    checkSession()
    return () => { cancelled = true }
  }, [navigate])

  useEffect(() => {
    if (isDevMode() || !sessionReady) return
    let timer = null
    let exiting = false

    const privacyExit = () => {
      if (exiting) return
      exiting = true
      clearPinUnlock()
      clearPrivateActivity()
      window.location.replace('/')
    }

    const scheduleFromCurrentState = () => {
      const now = Date.now()
      if (isPrivateSessionExpired(now)) {
        privacyExit()
        return
      }
      const last = readPrivateActivity()
      if (!last) markPrivateActivity(now)
      const remaining = last ? Math.max(1, PRIVATE_INACTIVITY_MS - (now - last)) : PRIVATE_INACTIVITY_MS
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(privacyExit, remaining)
    }

    const noteActivity = () => {
      if (exiting) return
      markPrivateActivity()
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(privacyExit, PRIVATE_INACTIVITY_MS)
    }

    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      if (isPrivateSessionExpired()) privacyExit()
      else noteActivity()
    }

    scheduleFromCurrentState()
    window.addEventListener('pointerdown', noteActivity, { passive: true })
    window.addEventListener('keydown', noteActivity)
    window.addEventListener('touchstart', noteActivity, { passive: true })
    window.addEventListener('scroll', noteActivity, { passive: true, capture: true })
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (timer) window.clearTimeout(timer)
      window.removeEventListener('pointerdown', noteActivity)
      window.removeEventListener('keydown', noteActivity)
      window.removeEventListener('touchstart', noteActivity)
      window.removeEventListener('scroll', noteActivity, true)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [sessionReady])

  if (!sessionReady) return null
  if (!isDevMode() && hasPin() && !isPinUnlocked()) {
    return <Navigate to="/pin" replace />
  }
  return <Outlet />
}

export default function App() {
  useEffect(() => {
    retryQueuedSharedContributions()
    stageCrisisFollowupOnAppOpen()
  }, [])

  return (
    <BrowserRouter>
      <EmergencyExit />
      <Routes>
        <Route path="/"                  element={<MarketingHome />} />
        <Route path="/about"             element={<MarketingAbout />} />
        <Route path="/faq"               element={<MarketingFAQ />} />
        <Route path="/contact"           element={<MarketingContact />} />
        <Route path="/partners"          element={<MarketingPartners />} />
        <Route path="/privacy"           element={<MarketingPrivacy />} />
        <Route path="/app"               element={<AgeGate />} />

        <Route element={<MarketAccessGuard />}>
          <Route path="/app/start"       element={<Signup />} />
          <Route path="/app/open"        element={<Login />} />
          <Route path="/signup"          element={<Navigate to="/app/start" replace />} />
          <Route path="/login"           element={<Navigate to="/app/open" replace />} />
          <Route path="/forgot-password" element={<Navigate to="/app/open" replace />} />
          <Route path="/onboarding"      element={<Onboarding />} />
          <Route path="/pin-setup"       element={<PinSetup />} />
          <Route path="/pin"             element={<PinEntry />} />

          <Route element={<JournalAccessGuard />}>
            <Route path="/home"              element={<Home />} />
            <Route path="/dashboard"         element={<Navigate to="/home" replace />} />
            <Route path="/entries/new"       element={<NewEntry />} />
            <Route path="/entries/sleep/:id" element={<SleepEntryDetail />} />
            <Route path="/entries/:id"       element={<EntryDetail />} />
            <Route path="/entries/:id/edit"  element={<EditEntry />} />
            <Route path="/stash/*"           element={<Navigate to="/home" replace />} />
            <Route path="/strains/*"         element={<Navigate to="/home" replace />} />
            <Route path="/insights"          element={<Insights />} />
            <Route path="/shared-signals"    element={<Navigate to="/home" replace />} />
            <Route path="/profile"           element={<Navigate to="/home" replace />} />
            <Route path="/settings"          element={<Settings />} />
            <Route path="/quick"             element={<QuickEntry />} />
            <Route path="/journal"           element={<Journal />} />
            <Route path="/guide"             element={<Guide />} />
            <Route path="/games/weed-goblins" element={<WeedGoblinsChat />} />
            <Route path="/notes/new"         element={<NoteEntry />} />
            <Route path="/checkin"           element={<CheckIn />} />
            <Route path="/update/:entryId"   element={<PostUseUpdate />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
      <DevBar />
    </BrowserRouter>
  )
}
