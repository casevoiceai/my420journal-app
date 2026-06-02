import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { localStore } from '../lib/localStore'
import { isDevMode } from '../lib/dev'

const S = {
  bg:            '#0A1A0A',
  surface:       '#1A2E1A',
  border:        '#2D4A2D',
  textPrimary:   '#E8F0E8',
  textSecondary: '#8FAF8F',
  gold:          '#C9A84C',
  error:         '#E05C5C',
}
const fontInter    = "'Inter', sans-serif"
const fontPlayfair = "'Playfair Display', serif"

const GUIDE_META = {
  bud:   { accent: '#C9A84C' },
  sunny: { accent: '#FF7F5C' },
  larry: { accent: '#C17A3A' },
  herb:  { accent: '#4ECDC4' },
  mary:  { accent: '#B088B0' },
  unit:  { accent: '#888888' },
  tool:  { accent: '#C9A84C' },
}

// ── Sleep phrase detection ────────────────────────────────────────────────────

function parseDurationMinutes(text) {
  const t = text.toLowerCase()
  const hourMatch = t.match(/(\d+)\s*hour/)
  const minMatch  = t.match(/(\d+)\s*min/)
  if (hourMatch) return parseInt(hourMatch[1], 10) * 60 + (minMatch ? parseInt(minMatch[1], 10) : 0)
  if (minMatch)  return parseInt(minMatch[1], 10)
  if (t.includes('an hour') || t.includes('a hour')) return 60
  if (t.includes('half an hour') || t.includes('half hour')) return 30
  return null
}

function detectSleepPhrase(text) {
  const t = text.toLowerCase().trim()
  if (t.includes('good night') || t.includes('goodnight')) {
    return { type: 'sleep_start', emoji: '🌙', message: 'Sleep start logged.' }
  }
  if (t.includes('good morning')) {
    return { type: 'sleep_end', emoji: '☀️', message: 'Good morning. Sleep logged.' }
  }
  if (t.includes('nap') || t.includes('power nap')) {
    const mins = parseDurationMinutes(t)
    const durationNote = mins ? ` (${mins >= 60 ? Math.floor(mins / 60) + 'h ' + (mins % 60 ? (mins % 60) + 'm' : '') : mins + 'm'})` : ''
    return { type: 'nap', emoji: '😴', message: `Nap logged.${durationNote}` }
  }
  return null
}

function SleepConfirmOverlay({ emoji, message }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(10,26,10,0.92)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 999, gap: '12px',
    }}>
      <span style={{ fontSize: '56px', lineHeight: 1 }}>{emoji}</span>
      <p style={{ fontFamily: fontInter, fontSize: '16px', color: S.textSecondary, margin: 0 }}>
        {message}
      </p>
    </div>
  )
}

const MOOD_FACES = [
  { value: 'good', label: 'Good', emoji: '😊', accentOverride: null },
  { value: 'meh',  label: 'Meh',  emoji: '😐', accentOverride: null },
  { value: 'off',  label: 'Nah',  emoji: '😞', accentOverride: null },
  { value: 'eww',  label: 'Eww',  emoji: '🤢', accentOverride: '#4CAF50' },
]

const SAVED_KEY = 'm420_dispensaries'
const FAVS_KEY  = 'm420_dispensary_favorites'
const MAX_SAVED = 10

function loadSavedDispensaries() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]') }
  catch { return [] }
}
function saveDispensaryToStorage(d) {
  const list = loadSavedDispensaries().filter((x) => x.place_id !== d.place_id)
  list.unshift(d)
  if (list.length > MAX_SAVED) list.splice(MAX_SAVED)
  localStorage.setItem(SAVED_KEY, JSON.stringify(list))
}
function loadFavorites() {
  try { return JSON.parse(localStorage.getItem(FAVS_KEY) || '[]') }
  catch { return [] }
}
function toggleFavorite(placeId) {
  const favs = loadFavorites()
  const next = favs.includes(placeId) ? favs.filter((id) => id !== placeId) : [...favs, placeId]
  localStorage.setItem(FAVS_KEY, JSON.stringify(next))
  return next
}
function sortedByFavorite(list, favs) {
  return [...list].sort((a, b) => {
    const aFav = favs.includes(a.place_id) ? 0 : 1
    const bFav = favs.includes(b.place_id) ? 0 : 1
    return aFav - bFav
  })
}

function parseTodayHours(openingHours) {
  if (!openingHours) return null
  const days = openingHours.weekdayDescriptions ?? openingHours.weekday_text
  if (!Array.isArray(days) || days.length === 0) return null
  const jsDay  = new Date().getDay()
  const apiIdx = jsDay === 0 ? 6 : jsDay - 1
  return days[apiIdx] || null
}

function isOpenNow(openingHours) {
  if (!openingHours) return null
  const v = openingHours.openNow ?? openingHours.open_now
  return typeof v === 'boolean' ? v : null
}

async function placesAutocomplete(input, coords, radius = 64000) {
  try {
    const body = {
      input, type: 'autocomplete',
      lat: coords?.lat ?? 41.4090,
      lng: coords?.lng ?? -75.6624,
      radius,
    }
    const response = await localStore.tools.invoke('place-lookup', { body })
    if (response.error) return { status: 'ERROR', predictions: [] }
    const predictions = response?.data?.predictions || []
    if (predictions.length === 0 || response.data?.status !== 'OK') {
      return { status: 'ZERO_RESULTS', predictions: [] }
    }
    return { status: 'OK', predictions }
  } catch {
    return { status: 'ERROR', predictions: [] }
  }
}

async function placesDetails(placeId) {
  try {
    const { data, error } = await localStore.tools.invoke('place-lookup', {
      body: { placeId, type: 'details' },
    })
    if (error || !data || data.error) return null
    return {
      name:                   data.name                   || '',
      formatted_address:      data.formatted_address      || '',
      formatted_phone_number: data.formatted_phone_number || '',
      opening_hours:          data.opening_hours          || null,
      url:                    data.url                    || '',
      geometry:               data.geometry               || null,
    }
  } catch { return null }
}

function getUserCoords() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 4000 }
    )
  })
}

async function getCoordsWithProfileFallback() {
  const gps = await getUserCoords()
  if (gps) return gps
  try {
    const { data: { user } } = await localStore.auth.getUser()
    if (!user) return null
    const { data: profile } = await localStore
      .from('user_profiles').select('home_city').eq('user_id', user.id).maybeSingle()
    const city = profile?.home_city?.trim()
    if (!city) return null
    const { data, error } = await localStore.tools.invoke('place-lookup', {
      body: { type: 'geocode', input: city },
    })
    if (error || !data?.lat) return null
    return { lat: data.lat, lng: data.lng }
  } catch { return null }
}

function FieldLabel({ children }) {
  return (
    <p style={{
      fontFamily: fontInter, fontSize: '11px', color: S.textSecondary,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      margin: '0 0 6px 0', fontWeight: '500',
    }}>
      {children}
    </p>
  )
}

function useVoiceInput({ onResult, onInterim }) {
  const recRef      = useRef(null)
  const silenceRef  = useRef(null)
  const finalRef    = useRef('')
  const [listening, setListening] = useState(false)
  const [supported] = useState(() =>
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  )

  const stop = useCallback(() => {
    clearTimeout(silenceRef.current)
    recRef.current?.stop()
  }, [])

  const start = useCallback(() => {
    if (!supported) return
    const SR  = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.continuous     = true
    rec.interimResults = true
    rec.lang           = 'en-US'
    recRef.current     = rec
    finalRef.current   = ''

    rec.onresult = (e) => {
      let interimText = ''
      let finalText   = finalRef.current
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalText += e.results[i][0].transcript + ' '
        } else {
          interimText += e.results[i][0].transcript
        }
      }
      finalRef.current = finalText
      onInterim?.(finalText + interimText)
      clearTimeout(silenceRef.current)
      silenceRef.current = setTimeout(() => rec.stop(), 2500)
    }

    rec.onend = () => {
      setListening(false)
      clearTimeout(silenceRef.current)
      onResult(finalRef.current.trim())
    }

    rec.onerror = () => { setListening(false); clearTimeout(silenceRef.current) }
    rec.start()
    setListening(true)
    silenceRef.current = setTimeout(() => rec.stop(), 30000)
  }, [supported, onResult, onInterim])

  useEffect(() => () => { clearTimeout(silenceRef.current); recRef.current?.stop() }, [])

  return { listening, supported, start, stop }
}

// ── WHERE field with saved pills + search + voice ──────────────────────────────
function DispensaryField({ accent, value, onChange }) {
  const [saved,        setSaved]        = useState(() => loadSavedDispensaries())
  const [favs,         setFavs]         = useState(() => loadFavorites())
  const [city,         setCity]         = useState('')
  const [query,        setQuery]        = useState('')
  const [predictions,  setPredictions]  = useState([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searching,    setSearching]    = useState(false)
  const [coords,       setCoords]       = useState(null)
  const [gpsCoords,    setGpsCoords]    = useState(null)
  const [travelRadius, setTravelRadius] = useState(64000)
  const debounceRef  = useRef(null)
  const wrapperRef   = useRef(null)
  const inputRef     = useRef(null)

  // Load GPS and travel radius once on mount
  useEffect(() => {
    async function init() {
      const gps = await getUserCoords()
      if (gps) setGpsCoords(gps)
      try {
        const { data: { user } } = await localStore.auth.getUser()
        if (!user) return
        const { data: profile } = await localStore
          .from('user_profiles').select('travel_radius_miles').eq('user_id', user.id).maybeSingle()
        if (profile?.travel_radius_miles) setTravelRadius(profile.travel_radius_miles * 1609)
      } catch { /* keep default */ }
    }
    init()
  }, [])

  // Keep coords in sync with GPS
  useEffect(() => { setCoords(gpsCoords) }, [gpsCoords])

  // Close dropdown on outside tap
  useEffect(() => {
    function onDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // Debounced autocomplete on query change
  useEffect(() => {
    if (value) { clearTimeout(debounceRef.current); return }
    clearTimeout(debounceRef.current)
    if (query.length < 2) { setPredictions([]); setDropdownOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const searchInput = city.trim() ? `${city.trim()} ${query} dispensary` : `${query} dispensary`
      const res = await placesAutocomplete(searchInput, coords, travelRadius)
      setSearching(false)
      setPredictions(res.predictions)
      setDropdownOpen(res.status === 'OK' && res.predictions.length > 0)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, value, coords, travelRadius, city])

  async function handleSelectPrediction(p) {
    setDropdownOpen(false); setPredictions([])
    const detail = await placesDetails(p.place_id)
    const d = {
      name:     detail?.name || p.structured_formatting?.main_text || p.description,
      place_id: p.place_id,
      address:  detail?.formatted_address || '',
      phone:    detail?.formatted_phone_number || '',
      hours:    detail?.opening_hours ? JSON.stringify(detail.opening_hours) : '',
      maps_url: detail?.url || '',
      lat:      detail?.geometry?.location?.lat ?? null,
      lng:      detail?.geometry?.location?.lng ?? null,
    }
    onChange(d)
    saveDispensaryToStorage(d)
    setSaved(loadSavedDispensaries())
    setFavs(loadFavorites())
    setQuery('')
  }

  function handleSelectSaved(d) {
    onChange(d); setQuery(''); setPredictions([]); setDropdownOpen(false)
  }

  function handleClear() {
    onChange(null); setQuery(''); setPredictions([]); setDropdownOpen(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleToggleFavorite(placeId, e) {
    e.stopPropagation()
    const next = toggleFavorite(placeId)
    setFavs(next)
  }

  // Voice for WHERE field — after recognition ends, auto-search the spoken text
  const handleVoiceResult = useCallback((text) => {
    if (!text) return
    setQuery(text)
  }, [])
  const handleVoiceInterim = useCallback((text) => { setQuery(text) }, [])
  const { listening: voiceListening, supported: voiceSupported, start: startVoice, stop: stopVoice } =
    useVoiceInput({ onResult: handleVoiceResult, onInterim: handleVoiceInterim })

  const displayName = value ? (typeof value === 'string' ? value : value.name) : null

  return (
    <div ref={wrapperRef}>
      {/* Saved pills */}
      {saved.length > 0 && !displayName && (
        <div style={{
          display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '8px',
          paddingBottom: '2px', scrollbarWidth: 'none',
        }}>
          {sortedByFavorite(saved, favs).map((d) => {
            const name  = typeof d === 'string' ? d : d.name || ''
            const sel   = value && (typeof value === 'string' ? value === name : value.name === name)
            const isFav = favs.includes(d.place_id)
            return (
              <button
                key={d.place_id || name}
                onClick={() => handleSelectSaved(d)}
                style={{
                  flexShrink: 0, height: '32px', padding: '0 10px 0 7px',
                  borderRadius: '9999px',
                  border: `1px solid ${sel ? accent : isFav ? S.gold : S.border}`,
                  backgroundColor: sel ? `${accent}33` : isFav ? `${S.gold}18` : S.surface,
                  color: sel ? accent : isFav ? S.gold : S.textSecondary,
                  fontFamily: fontInter, fontSize: '12px',
                  fontWeight: sel ? '600' : '400',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                <span
                  role="button"
                  onClick={(e) => handleToggleFavorite(d.place_id, e)}
                  style={{ fontSize: '11px', lineHeight: 1, opacity: isFav ? 1 : 0.4 }}
                >
                  {isFav ? '★' : '☆'}
                </span>
                {name}
              </button>
            )
          })}
        </div>
      )}

      {/* Selected info card or search input */}
      {displayName ? (() => {
        const hours        = value?.hours ? (() => { try { return JSON.parse(value.hours) } catch { return null } })() : null
        const todayStr     = parseTodayHours(hours)
        const openNow      = isOpenNow(hours)
        const todayHrsOnly = todayStr ? todayStr.replace(/^[^:]+:\s*/, '') : null
        const isFav        = value?.place_id ? favs.includes(value.place_id) : false
        return (
          <div style={{
            position: 'relative',
            backgroundColor: S.surface, borderRadius: '8px',
            border: `1px solid ${S.border}`, borderLeft: `3px solid ${accent}`,
            padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '5px',
          }}>
            {/* Star button */}
            <button
              onClick={() => { const next = toggleFavorite(value.place_id); setFavs(next) }}
              style={{
                position: 'absolute', top: '8px', right: '10px',
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                padding: '4px', minWidth: '28px', minHeight: '28px',
              }}
            >
              <span style={{ fontSize: '22px', color: isFav ? '#C9A84C' : '#8FAF8F', lineHeight: 1 }}>
                {isFav ? '★' : '☆'}
              </span>
              <span style={{ fontFamily: fontInter, fontSize: '10px', color: isFav ? '#C9A84C' : '#8FAF8F', lineHeight: 1 }}>
                {isFav ? 'Saved' : 'Save'}
              </span>
            </button>

            <p style={{ fontFamily: fontInter, fontSize: '16px', fontWeight: '700', color: '#E8F0E8', margin: 0, lineHeight: '1.3', paddingRight: '56px' }}>
              {displayName}
            </p>
            {value?.address && (
              <p style={{ fontFamily: fontInter, fontSize: '12px', color: '#8FAF8F', margin: 0, lineHeight: '1.4', display: 'flex', gap: '5px' }}>
                <span>📍</span><span>{value.address}</span>
              </p>
            )}
            {value?.phone && (
              <p style={{ fontFamily: fontInter, fontSize: '12px', color: '#8FAF8F', margin: 0, display: 'flex', gap: '5px' }}>
                <span>📞</span><span>{value.phone}</span>
              </p>
            )}
            {todayHrsOnly && (
              <p style={{ fontFamily: fontInter, fontSize: '12px', color: '#8FAF8F', margin: 0, display: 'flex', gap: '5px', alignItems: 'flex-start' }}>
                <span>🕐</span>
                <span>
                  {openNow !== null && (
                    <span style={{ color: openNow ? '#4CAF50' : '#EF4444', fontWeight: '600', marginRight: '6px' }}>
                      {openNow ? 'Open now' : 'Closed'}
                    </span>
                  )}
                  {todayHrsOnly}
                </span>
              </p>
            )}
            <button onClick={handleClear}
              style={{ alignSelf: 'flex-start', background: 'none', border: 'none', fontFamily: fontInter, fontSize: '12px', color: '#8FAF8F', cursor: 'pointer', padding: 0, borderBottom: '1px solid rgba(143,175,143,0.4)', paddingBottom: '1px', marginTop: '2px' }}>
              Change
            </button>
          </div>
        )
      })() : (
        <div>
          {/* City input */}
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City, State — e.g. Scranton, PA"
            spellCheck={false}
            autoCorrect="off"
            style={{
              width: '100%', height: '44px', backgroundColor: S.surface,
              border: `1px solid ${S.border}`, borderRadius: '8px',
              padding: '0 14px', fontFamily: fontInter, fontSize: '14px',
              color: S.textPrimary, outline: 'none', boxSizing: 'border-box',
              marginBottom: '6px', transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = accent }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = S.border }}
          />
          <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Where did you get it?"
            spellCheck={false}
            style={{
              width: '100%', height: '56px', backgroundColor: S.surface,
              border: `1px solid ${S.border}`, borderRadius: '10px',
              padding: '0 68px 0 16px', fontFamily: fontInter, fontSize: '16px',
              color: S.textPrimary, outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = accent }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = S.border }}
          />
          {voiceSupported && (
            <button
              onMouseDown={(e) => { e.preventDefault(); voiceListening ? stopVoice() : startVoice() }}
              style={{
                position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                width: '52px', height: '52px', borderRadius: '50%',
                backgroundColor: accent, border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'all 0.15s ease',
                opacity: voiceListening ? 1 : 0.85,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="3" width="6" height="12" rx="3" fill="white" />
                <path d="M5 11a7 7 0 0014 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 18v3M9 21h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}

          {/* Dropdown */}
          {dropdownOpen && predictions.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
              backgroundColor: '#0F2410', border: `1px solid ${S.border}`,
              borderRadius: '10px', zIndex: 100, overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}>
              {predictions.slice(0, 5).map((p) => {
                const isSaved = saved.some((s) => s.place_id === p.place_id)
                return (
                  <button
                    key={p.place_id}
                    onMouseDown={(e) => { e.preventDefault(); handleSelectPrediction(p) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      width: '100%', textAlign: 'left',
                      padding: '10px 14px', background: 'none', border: 'none',
                      borderBottom: `1px solid ${S.border}`, cursor: 'pointer',
                      transition: 'background-color 0.1s ease', boxSizing: 'border-box',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = S.surface }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textPrimary, margin: 0, fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.structured_formatting?.main_text || p.description}
                      </p>
                      {p.structured_formatting?.secondary_text && (
                        <p style={{ fontFamily: fontInter, fontSize: '11px', color: S.textSecondary, margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.structured_formatting.secondary_text}
                        </p>
                      )}
                    </div>
                    {isSaved && (
                      <span style={{ fontSize: '13px', flexShrink: 0, color: S.gold }}>★</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {searching && (
            <p style={{ fontFamily: fontInter, fontSize: '11px', color: S.textSecondary, margin: '4px 0 0 4px' }}>
              Searching...
            </p>
          )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Wake time field for sleep mode ────────────────────────────────────────────
function WakeTimeField({ value, onChange, accent }) {
  const [editing, setEditing] = useState(false)

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  function handleTimeInput(e) {
    const timeStr = e.target.value
    if (!timeStr) return
    const [hh, mm] = timeStr.split(':').map(Number)
    const d = new Date()
    d.setHours(hh, mm, 0, 0)
    if (d > new Date()) d.setDate(d.getDate() - 1)
    onChange(d.toISOString())
    setEditing(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: S.surface, border: `1px solid ${accent}`,
        borderRadius: '10px', padding: '0 16px', height: '56px',
      }}>
        <span style={{ fontFamily: fontInter, fontSize: '18px', fontWeight: '700', color: S.textPrimary }}>
          {formatTime(value)}
        </span>
        <button
          onClick={() => setEditing((p) => !p)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: fontInter, fontSize: '13px', color: accent,
            padding: '4px',
          }}
        >
          Change
        </button>
      </div>
      {editing && (
        <input
          type="time"
          onChange={handleTimeInput}
          autoFocus
          style={{
            width: '100%', height: '48px', backgroundColor: S.surface,
            border: `1px solid ${S.border}`, borderRadius: '8px',
            padding: '0 14px', fontFamily: fontInter, fontSize: '16px',
            color: S.textPrimary, outline: 'none', boxSizing: 'border-box',
            colorScheme: 'dark',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = accent }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = S.border }}
        />
      )}
    </div>
  )
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function QuickEntry() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isSleepMode = searchParams.get('mode') === 'sleep'

  const [accent,      setAccent]      = useState(S.gold)
  const [dispensary,  setDispensary]  = useState(null)
  const [product,     setProduct]     = useState('')
  const [mood,        setMood]        = useState(null)
  const [noteText,    setNoteText]    = useState('')
  const [liveText,    setLiveText]    = useState('')
  const [saving,      setSaving]      = useState(false)
  const [saveError,   setSaveError]   = useState('')
  const [sleepOverlay, setSleepOverlay] = useState(null)
  const [wakeTime,    setWakeTime]    = useState(() => new Date().toISOString())

  useEffect(() => {
    if (isDevMode()) { setAccent(GUIDE_META.sunny.accent); return }
    async function loadGuide() {
      const { data: { user } } = await localStore.auth.getUser()
      if (!user) return
      const { data } = await localStore
        .from('user_profiles')
        .select('guide_selected')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data?.guide_selected) setAccent(GUIDE_META[data.guide_selected]?.accent || S.gold)
    }
    loadGuide()
  }, [])

  // Product voice
  const handleProductResult = useCallback((text) => { if (text) setProduct(text) }, [])
  const { listening: productListening, supported: voiceSupported, start: startProduct, stop: stopProduct } =
    useVoiceInput({ onResult: handleProductResult })

  // Note voice — intercepts sleep phrases before populating note field
  const handleNoteResult = useCallback((text) => {
    setLiveText('')
    if (!text) return
    const sleep = detectSleepPhrase(text)
    if (sleep) {
      saveSleepEntry(sleep, text)
      return
    }
    setNoteText(text)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const handleNoteInterim = useCallback((text) => { setLiveText(text) }, [])
  const { listening: noteListening, start: startNote, stop: stopNote } =
    useVoiceInput({ onResult: handleNoteResult, onInterim: handleNoteInterim })

  const displayNote = noteListening ? liveText : noteText

  async function saveSleepEntry(sleep, transcript) {
    setSleepOverlay({ emoji: sleep.emoji, message: sleep.message })
    let uid = isDevMode() ? 'dev-user-001' : null
    if (!uid) {
      const { data: { user } } = await localStore.auth.getUser()
      uid = user?.id || null
    }
    if (uid) {
      const { error } = await localStore.from('entries').insert({
        user_id:      uid,
        product_name: sleep.type === 'sleep_start' ? 'Sleep Start' : sleep.type === 'sleep_end' ? 'Sleep End' : 'Nap',
        entry_type:   sleep.type,
        notes:        transcript || null,
        capture_mode: 'quick',
      })
      if (error && isDevMode()) console.error('Dev sleep save error:', error)
    }
    setTimeout(() => navigate('/home'), 1500)
  }

  async function handleSave() {
    setSaveError('')
    setSaving(true)

    let uid = isDevMode() ? 'dev-user-001' : null
    if (!uid) {
      const { data: { user } } = await localStore.auth.getUser()
      if (!user) { setSaveError('Not logged in.'); setSaving(false); return }
      uid = user.id
    }

    let payload
    if (isSleepMode) {
      payload = {
        user_id:      uid,
        product_name: 'Sleep End',
        entry_type:   'sleep_end',
        mood_face:    mood || null,
        notes:        noteText || null,
        created_at:   wakeTime,
        capture_mode: 'quick',
      }
    } else {
      const dispensaryName = dispensary
        ? (typeof dispensary === 'string' ? dispensary : dispensary.name)
        : null
      payload = {
        user_id:         uid,
        dispensary_name: dispensaryName,
        product_name:    product || '',
        mood_face:       mood || null,
        notes:           noteText || null,
        capture_mode:    'quick',
      }
    }

    const { error } = await localStore.from('entries').insert(payload)

    if (error) {
      if (isDevMode()) { console.error('Dev save error:', error) }
      else { setSaveError('Could not save. Try again.'); setSaving(false); return }
    }
    setSaving(false)
    navigate('/home')
  }

  function goToFullEntry() {
    const params = new URLSearchParams()
    const dname  = dispensary ? (typeof dispensary === 'string' ? dispensary : dispensary.name) : null
    if (product) params.set('product',    product)
    if (dname)   params.set('dispensary', dname)
    if (mood)    params.set('mood',       mood)
    navigate(`/entries/new?${params.toString()}`)
  }

  return (
    <div style={{
      height: '100dvh', maxHeight: '100dvh', overflow: 'hidden',
      backgroundColor: S.bg, display: 'flex', flexDirection: 'column',
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px', height: '50px', flexShrink: 0,
        borderBottom: `1px solid ${S.border}`, position: 'relative',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', left: '12px',
            width: '38px', height: '38px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'none', border: 'none',
            cursor: 'pointer', color: S.textSecondary, borderRadius: '8px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 style={{
          fontFamily: fontPlayfair, fontSize: '20px', fontWeight: '600',
          color: S.textPrimary, margin: 0,
        }}>
          {isSleepMode ? 'Sleep Log' : 'Quick Entry'}
        </h1>
      </div>

      {/* Scrollable body */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 20px 0',
        boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '12px',
      }}>

        {/* WHEN DID YOU WAKE UP — sleep mode only */}
        {isSleepMode && (
          <div>
            <FieldLabel>When did you wake up?</FieldLabel>
            <WakeTimeField value={wakeTime} onChange={setWakeTime} accent={accent} />
          </div>
        )}

        {/* WHERE — hidden in sleep mode */}
        {!isSleepMode && (
          <div>
            <FieldLabel>Where</FieldLabel>
            <DispensaryField accent={accent} value={dispensary} onChange={setDispensary} />
          </div>
        )}

        {/* WHAT — hidden in sleep mode */}
        {!isSleepMode && (
        <div>
          <FieldLabel>What</FieldLabel>
          <div style={{ position: 'relative' }}>
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="Product name..."
              spellCheck={true}
              autoCorrect="on"
              style={{
                width: '100%', height: '56px', backgroundColor: S.surface,
                border: `1px solid ${S.border}`, borderRadius: '10px',
                padding: '0 68px 0 16px', fontFamily: fontInter, fontSize: '16px',
                color: S.textPrimary, outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = accent }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = S.border }}
            />
            {voiceSupported && (
              <button
                onMouseDown={(e) => { e.preventDefault(); productListening ? stopProduct() : startProduct() }}
                style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  width: '52px', height: '52px', borderRadius: '50%',
                  backgroundColor: accent, border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  transition: 'all 0.15s ease',
                  opacity: productListening ? 1 : 0.85,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="3" width="6" height="12" rx="3" fill="white" />
                  <path d="M5 11a7 7 0 0014 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 18v3M9 21h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
        )}

        {/* HOW ARE YOU FEELING */}
        <div>
          <FieldLabel>How are you feeling?</FieldLabel>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
            {MOOD_FACES.map((face) => {
              const faceColor = face.accentOverride || accent
              const selected  = mood === face.value
              return (
                <div key={face.value} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => setMood(selected ? null : face.value)}
                    style={{
                      width: '72px', height: '72px', borderRadius: '50%',
                      border: `${selected ? '2px' : '1px'} solid ${selected ? faceColor : S.border}`,
                      backgroundColor: selected ? `${faceColor}26` : S.surface,
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '36px', lineHeight: 1,
                    }}
                  >
                    {face.emoji}
                  </button>
                  <span style={{
                    fontFamily: fontInter, fontSize: '13px', fontWeight: '700',
                    color: S.textSecondary,
                  }}>
                    {face.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* TELL YOUR GUIDE / DREAMS */}
        <div>
          <FieldLabel>{isSleepMode ? 'Any dreams?' : 'Tell your guide'}</FieldLabel>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => noteListening ? stopNote() : startNote()}
              style={{
                width: '64px', height: '64px', borderRadius: '50%',
                backgroundColor: accent, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: noteListening ? `0 0 0 8px ${accent}33` : 'none',
                transition: 'box-shadow 0.3s ease',
                animation: noteListening ? 'pulse 1.4s ease-in-out infinite' : 'none',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="3" width="6" height="12" rx="3" fill="white" />
                <path d="M5 11a7 7 0 0014 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 18v3M9 21h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <p style={{ fontFamily: fontInter, fontSize: '11px', color: S.textSecondary, margin: 0, textAlign: 'center' }}>
              {noteListening ? 'Listening...' : 'Tap to record. Your guide will hear it.'}
            </p>
            <textarea
              value={displayNote}
              onChange={(e) => { if (!noteListening) setNoteText(e.target.value) }}
              placeholder={isSleepMode ? 'Any dreams? Capture them now...' : 'Or type a note...'}
              rows={3}
              spellCheck={true}
              autoCorrect="on"
              style={{
                width: '100%', backgroundColor: S.surface,
                border: `1px solid ${noteListening ? accent : S.border}`,
                borderRadius: '8px', padding: '8px 12px',
                fontFamily: fontInter, fontSize: '14px',
                color: noteListening ? S.textSecondary : S.textPrimary,
                outline: 'none', resize: 'none', lineHeight: '1.5',
                boxSizing: 'border-box', transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => { if (!noteListening) e.currentTarget.style.borderColor = accent }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = noteListening ? accent : S.border }}
            />
          </div>
        </div>

        {/* Write a note link */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate('/notes/new')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, padding: '4px' }}
          >
            Or write a note instead
          </button>
        </div>

        {/* Spacer so last field isn't hidden under save bar */}
        <div style={{ height: '8px', flexShrink: 0 }} />
      </div>

      {/* Save bar */}
      <div style={{
        flexShrink: 0, padding: '10px 20px 24px', boxSizing: 'border-box',
        borderTop: `1px solid ${S.border}`, backgroundColor: S.bg,
      }}>
        {saveError && (
          <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.error, margin: '0 0 8px 0', textAlign: 'center' }}>
            {saveError}
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', height: '60px',
            backgroundColor: saving ? '#5A4A20' : S.gold,
            color: saving ? '#4A3A10' : S.bg,
            border: 'none', borderRadius: '12px',
            fontFamily: fontInter, fontSize: '16px', fontWeight: '700',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s ease',
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {!isSleepMode && (
          <button
            onClick={goToFullEntry}
            style={{
              display: 'block', width: '100%', textAlign: 'center',
              marginTop: '8px', background: 'none', border: 'none',
              fontFamily: fontInter, fontSize: '12px', color: S.textSecondary,
              cursor: 'pointer', padding: 0,
            }}
          >
            Add more details
          </button>
        )}
      </div>

      {sleepOverlay && <SleepConfirmOverlay emoji={sleepOverlay.emoji} message={sleepOverlay.message} />}

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 ${S.gold}66; }
          50%       { box-shadow: 0 0 0 10px transparent; }
        }
      `}</style>
    </div>
  )
}
