import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { localStore } from '../lib/localStore'
import { isDevMode } from '../lib/dev'

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

const CATEGORIES = ['Flower', 'Vape', 'Extract', 'Orally Administered', 'Tinctures', 'Topicals']
const STRAIN_TYPES = ['Indica', 'Sativa', 'Hybrid', 'CBD', 'N/A']
const CATEGORIES_WITH_STRAIN = ['Flower', 'Vape', 'Extract']

const AMOUNT_OPTIONS = {
  Flower:                ['0.3g', '0.5g', '1g', '2g', '3g', '3.5g', '4g', '4.2g', '7g', '14g', '28g'],
  Extract:               ['0.3g', '0.5g', '1g', '2g', '3g', '3.5g', '4g', '4.2g', '7g', '14g', '28g'],
  Vape:                  ['0.3g', '0.5g', '1g disposable pen', '0.5g cartridge', '1g cartridge'],
  'Orally Administered': ['1 piece', '2 pieces', '5mg', '10mg', '25mg', '50mg', '100mg'],
  Tinctures:             ['1ml', '2.5ml', '5ml', '10ml', '30ml'],
  _default:              ['1 piece', '5mg', '10mg', '25mg', '50mg', '100mg', '1ml', '5ml', '30ml'],
}

const CANNABINOIDS = ['CBC', 'CBD', 'CBDA', 'CBG', 'CBGA', 'CBN', 'D8 THC', 'THC', 'THCA', 'THCV']

const TERPENES = [
  'Bisabolol', 'Camphene', 'Carene', 'Beta Caryophyllene', 'Eucalyptol',
  'Geraniol', 'Alpha Humulene', 'Isopulegol', 'Limonene', 'Linalool',
  'Beta Myrcene', 'Ocimene', 'Beta Pinene', 'Alpha Terpinene', 'Terpinolene',
]

const STRAIN_TERPENE_HINTS = {
  'blue dream':        ['Beta Myrcene', 'Terpinolene', 'Ocimene'],
  'og kush':           ['Beta Myrcene', 'Limonene', 'Beta Caryophyllene'],
  'sour diesel':       ['Beta Myrcene', 'Limonene', 'Beta Caryophyllene'],
  'girl scout':        ['Beta Caryophyllene', 'Limonene', 'Beta Myrcene'],
  'gsc':               ['Beta Caryophyllene', 'Limonene', 'Beta Myrcene'],
  'gelato':            ['Beta Caryophyllene', 'Limonene', 'Beta Myrcene'],
  'wedding cake':      ['Beta Caryophyllene', 'Limonene', 'Beta Myrcene'],
  'granddaddy':        ['Beta Myrcene', 'Beta Caryophyllene', 'Geraniol'],
  'gdp':               ['Beta Myrcene', 'Beta Caryophyllene', 'Geraniol'],
  'purple punch':      ['Beta Myrcene', 'Beta Caryophyllene', 'Alpha Humulene'],
  'zkittlez':          ['Beta Myrcene', 'Beta Caryophyllene', 'Linalool'],
  'zkittles':          ['Beta Myrcene', 'Beta Caryophyllene', 'Linalool'],
  'gorilla glue':      ['Beta Myrcene', 'Beta Caryophyllene', 'Limonene'],
  'gg4':               ['Beta Myrcene', 'Beta Caryophyllene', 'Limonene'],
  'mac':               ['Beta Caryophyllene', 'Limonene', 'Beta Myrcene'],
  'mac 1':             ['Beta Caryophyllene', 'Limonene', 'Beta Myrcene'],
  'sherbet':           ['Beta Caryophyllene', 'Limonene', 'Alpha Humulene'],
  'runtz':             ['Beta Caryophyllene', 'Limonene', 'Linalool'],
  'cereal milk':       ['Beta Caryophyllene', 'Limonene', 'Ocimene'],
  'ice cream cake':    ['Beta Caryophyllene', 'Limonene', 'Linalool'],
  'mango':             ['Beta Myrcene', 'Limonene', 'Ocimene'],
  'pineapple':         ['Beta Myrcene', 'Limonene', 'Terpinolene'],
  'lemon':             ['Limonene', 'Beta Myrcene', 'Beta Caryophyllene'],
  'strawberry':        ['Beta Myrcene', 'Limonene', 'Linalool'],
  'blueberry':         ['Beta Myrcene', 'Limonene', 'Linalool'],
  'jack herer':        ['Terpinolene', 'Ocimene', 'Beta Myrcene'],
  'durban':            ['Terpinolene', 'Ocimene', 'Beta Myrcene'],
  'trainwreck':        ['Terpinolene', 'Beta Myrcene', 'Limonene'],
  'white widow':       ['Beta Myrcene', 'Beta Caryophyllene', 'Alpha Humulene'],
  'ak':                ['Beta Myrcene', 'Limonene', 'Beta Caryophyllene'],
  'bubba kush':        ['Beta Myrcene', 'Beta Caryophyllene', 'Linalool'],
  'northern lights':   ['Beta Myrcene', 'Linalool', 'Beta Caryophyllene'],
  'skywalker':         ['Beta Myrcene', 'Linalool', 'Alpha Humulene'],
  'chemdawg':          ['Beta Myrcene', 'Beta Caryophyllene', 'Limonene'],
  'headband':          ['Beta Myrcene', 'Limonene', 'Beta Caryophyllene'],
  'kosher kush':       ['Beta Myrcene', 'Limonene', 'Beta Caryophyllene'],
  'pineapple express': ['Beta Myrcene', 'Limonene', 'Beta Caryophyllene'],
  'amnesia':           ['Terpinolene', 'Beta Myrcene', 'Limonene'],
}

function suggestTerpenes(productName) {
  if (!productName) return []
  const lower = productName.toLowerCase()
  for (const [key, terpenes] of Object.entries(STRAIN_TERPENE_HINTS)) {
    if (lower.includes(key)) return terpenes
  }
  return []
}

const GUIDE_META = {
  bud:   { accent: '#C9A84C', notePrompt: 'Worth noting for next time?' },
  sunny: { accent: '#FF7F5C', notePrompt: 'Tell me how it really went...' },
  larry: { accent: '#C17A3A', notePrompt: 'Anything worth remembering?' },
  herb:  { accent: '#4ECDC4', notePrompt: 'Observations?' },
  mary:  { accent: '#B088B0', notePrompt: 'How do you feel now, honestly?' },
  unit:  { accent: '#888888', notePrompt: 'Notes.' },
  tool:  { accent: '#C9A84C', notePrompt: 'Notes.' },
}

const BODY_TAGS   = ['Relaxed', 'Heavy', 'Floaty', 'Pain Relief', 'Energized', 'Tense', 'Numb', 'Tired']
const MIND_TAGS   = ['Focused', 'Scattered', 'Creative', 'Anxious', 'Giggly', 'Clear', 'Racing', 'Foggy']
const MOOD_TAGS = ['Introspective', 'Disconnected', 'Time Is Different', 'Everything Is Funny', 'Universe Makes Sense']
const ALL_EFFECT_TAGS = [...BODY_TAGS, ...MIND_TAGS, ...MOOD_TAGS]

const SAVED_KEY    = 'm420_dispensaries'
const FAVS_KEY     = 'm420_dispensary_favorites'
const BLOCKED_KEY  = 'm420_blocked_dispensaries'
const MAX_SAVED    = 10
const MAX_BLOCKED  = 50

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
function loadBlocked() {
  try { return JSON.parse(localStorage.getItem(BLOCKED_KEY) || '[]') }
  catch { return [] }
}
function blockDispensary(placeId, name) {
  const list = loadBlocked().filter((x) => x.place_id !== placeId)
  list.unshift({ place_id: placeId, name })
  if (list.length > MAX_BLOCKED) list.splice(MAX_BLOCKED)
  localStorage.setItem(BLOCKED_KEY, JSON.stringify(list))
  return list
}

function sortedByFavorite(list, favs) {
  return [...list].sort((a, b) => {
    const aFav = favs.includes(a.place_id) ? 0 : 1
    const bFav = favs.includes(b.place_id) ? 0 : 1
    return aFav - bFav
  })
}

async function placesAutocomplete(input, coords, radius = 64000) {
  try {
    const body = {
      input, type: 'autocomplete',
      lat: coords?.lat ?? 41.5748,
      lng: coords?.lng ?? -75.5022,
      radius,
    }
    const response = await localStore.tools.run('place-lookup', { body })
    if (response.error) return { status: 'ERROR', predictions: [] }
    const predictions = response?.data?.predictions || []
    if (predictions.length === 0) return { status: 'ZERO_RESULTS', predictions: [] }
    return { status: 'OK', predictions }
  } catch {
    return { status: 'ERROR', predictions: [] }
  }
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

async function placesDetails(placeId) {
  try {
    const { data, error } = await localStore.tools.run('place-lookup', {
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
  } catch {
    return null
  }
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

function DispensaryInfoCard({ value, accent, onClear, isFav, onToggleFav }) {
  const hours = value?.hours
    ? (() => { try { return JSON.parse(value.hours) } catch { return null } })()
    : null
  const todayStr     = parseTodayHours(hours)
  const openNow      = isOpenNow(hours)
  const todayHrsOnly = todayStr ? todayStr.replace(/^[^:]+:\s*/, '') : null

  return (
    <div style={{
      position: 'relative',
      backgroundColor: S.surface, borderRadius: '8px',
      border: `1px solid ${S.border}`, borderLeft: `3px solid ${S.gold}`,
      padding: '12px 16px 12px 16px', display: 'flex', flexDirection: 'column', gap: '5px',
    }}>
      <button
        onClick={() => onToggleFav(value.place_id)}
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
        {value.name}
      </p>
      {value.address && (
        <p style={{ fontFamily: fontInter, fontSize: '13px', color: '#8FAF8F', margin: 0, lineHeight: '1.4', display: 'flex', gap: '5px' }}>
          <span>📍</span><span>{value.address}</span>
        </p>
      )}
      {value.phone && (
        <p style={{ fontFamily: fontInter, fontSize: '13px', color: '#8FAF8F', margin: 0, display: 'flex', gap: '5px' }}>
          <span>📞</span><span>{value.phone}</span>
        </p>
      )}
      {todayHrsOnly && (
        <p style={{ fontFamily: fontInter, fontSize: '13px', color: '#8FAF8F', margin: 0, display: 'flex', gap: '5px', alignItems: 'flex-start' }}>
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
      {value.maps_url && (
        <a href={value.maps_url} target="_blank" rel="noopener noreferrer"
          style={{ fontFamily: fontInter, fontSize: '12px', color: S.gold, textDecoration: 'none', borderBottom: `1px solid ${S.gold}50`, paddingBottom: '1px', marginTop: '2px', alignSelf: 'flex-start' }}>
          View on Maps
        </a>
      )}
      <button onClick={onClear}
        style={{ width: '100%', height: '44px', marginTop: '8px', backgroundColor: S.surface, border: `1px solid ${S.gold}`, borderRadius: '8px', fontFamily: fontInter, fontSize: '14px', color: S.gold, fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${S.gold}18` }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = S.surface }}>
        Change dispensary
      </button>
    </div>
  )
}

function FieldLabel({ children }) {
  return (
    <p style={{
      fontFamily: fontInter, fontSize: '11px', fontWeight: '600',
      color: S.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase',
      margin: '0 0 8px 0',
    }}>
      {children}
    </p>
  )
}

function StyledInput({ value, onChange, placeholder, accent, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', height: '48px', backgroundColor: S.surface,
        border: `1px solid ${S.border}`, borderRadius: '8px',
        padding: '0 14px', fontFamily: fontInter, fontSize: '15px',
        color: S.textPrimary, outline: 'none', boxSizing: 'border-box',
        transition: 'border-color 0.15s ease',
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = S.gold }}
      onBlur={(e) => { e.currentTarget.style.borderColor = S.border }}
    />
  )
}

function PillButton({ label, selected, accent, onClick, small }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: small ? '34px' : '38px',
        padding: `0 ${small ? '12px' : '16px'}`,
        borderRadius: '9999px',
        border: `1px solid ${selected ? S.gold : S.border}`,
        backgroundColor: selected ? `${S.gold}33` : S.surface,
        color: selected ? S.gold : S.textSecondary,
        fontFamily: fontInter, fontSize: small ? '12px' : '13px',
        fontWeight: selected ? '600' : '400',
        cursor: 'pointer', transition: 'all 0.15s ease',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      {label}
    </button>
  )
}

const DISPENSARY_LABEL_MAP = {
  Flower: 'DISPENSARY', Vape: 'DISPENSARY', Extract: 'DISPENSARY', Tinctures: 'DISPENSARY',
  'Orally Administered': 'RETAILER', Topicals: 'RETAILER', CBD: 'RETAILER',
}

function DispensarySelector({ accent, value, onChange, category }) {
  const [city, setCity]               = useState('')
  const [stateAbbr, setStateAbbr]     = useState('PA')
  const [nameQuery, setNameQuery]     = useState('')
  const [predictions, setPredictions] = useState([])
  const [searching, setSearching]     = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [saved, setSaved]             = useState(() => loadSavedDispensaries())
  const [favs, setFavs]               = useState(() => loadFavorites())
  const [blocked, setBlocked]         = useState(() => loadBlocked())
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [coords, setCoords]           = useState(null)
  const [gpsCoords, setGpsCoords]     = useState(null)
  const [travelRadius]                = useState(64000)
  const debounceRef  = useRef(null)
  const nameInputRef = useRef(null)
  const cityInputRef = useRef(null)
  const dropdownRef  = useRef(null)
  const wrapperRef   = useRef(null)

  const fieldLabel = DISPENSARY_LABEL_MAP[category] || 'DISPENSARY'

  // Get GPS once on mount as a soft location bias
  useEffect(() => {
    async function init() {
      const gps = await getUserCoords()
      if (gps) setGpsCoords(gps)
    }
    init()
  }, [])

  // Use GPS as soft location bias only. City text in the search query handles filtering.
  useEffect(() => { setCoords(gpsCoords) }, [gpsCoords])

  function buildSearchInput(name) {
    const loc = [city.trim(), stateAbbr.trim()].filter(Boolean).join(' ')
    if (name.trim()) return loc ? `${loc} ${name.trim()}` : name.trim()
    return loc ? `${loc} dispensary` : 'dispensary'
  }

  async function runSearch(nameVal) {
    setSearching(true)
    const res = await placesAutocomplete(buildSearchInput(nameVal), coords, travelRadius)
    setSearching(false)
    setPredictions(res.predictions)
    setDropdownOpen(res.predictions.length > 0)
  }

  useEffect(() => {
    if (value) { clearTimeout(debounceRef.current); return }
    clearTimeout(debounceRef.current)
    if (nameQuery.length < 2 && !city.trim()) { setPredictions([]); setDropdownOpen(false); return }
    debounceRef.current = setTimeout(() => runSearch(nameQuery), 300)
    return () => clearTimeout(debounceRef.current)
  }, [nameQuery, city, stateAbbr, value, coords]) // eslint-disable-line

  useEffect(() => {
    function onDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  async function handleSelectPrediction(p) {
    setDropdownOpen(false); setPredictions([]); setLoadingDetails(true)
    const detail = await placesDetails(p.place_id)
    setLoadingDetails(false)
    const d = {
      name:     detail?.name || p.structured_formatting?.main_text || p.description,
      place_id: p.place_id,
      address:  detail?.formatted_address || '',
      phone:    detail?.formatted_phone_number || '',
      hours:    detail?.opening_hours ? JSON.stringify(detail.opening_hours) : '',
      maps_url: detail?.url || `https://maps.google.com/?place_id=${p.place_id}`,
      lat:      detail?.geometry?.location?.lat ?? null,
      lng:      detail?.geometry?.location?.lng ?? null,
    }
    onChange(d); saveDispensaryToStorage(d); setSaved(loadSavedDispensaries()); setFavs(loadFavorites()); setNameQuery('')
  }

  function handleRemoveSaved(placeId, e) {
    e.stopPropagation()
    const updated = loadSavedDispensaries().filter((x) => x.place_id !== placeId)
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated))
    setSaved(updated)
    if (value?.place_id === placeId) onChange(null)
  }

  function handleToggleFavorite(placeId, e) {
    e.stopPropagation()
    const next = toggleFavorite(placeId)
    setFavs(next)
  }

  function handleSelectSaved(d) {
    onChange(d); setNameQuery(''); setPredictions([]); setDropdownOpen(false)
  }

  function handleClear() {
    onChange(null)
    setNameQuery('')
    setPredictions([])
    setDropdownOpen(false)
    setCity('')
    setStateAbbr('PA')
    setTimeout(() => cityInputRef.current?.focus(), 50)
  }

  function handleNameFocus(e) {
    e.currentTarget.style.borderColor = S.gold
    if (!value && city.trim() && predictions.length === 0) {
      runSearch(nameQuery)
    } else if (predictions.length > 0) {
      setDropdownOpen(true)
    }
  }

  const inputBase = {
    height: '48px', backgroundColor: S.surface,
    border: `1px solid ${S.border}`, borderRadius: '8px',
    fontFamily: fontInter, fontSize: '15px',
    color: S.textPrimary, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s ease', width: '100%',
  }

  return (
    <div ref={wrapperRef}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .disp-loc-row { display: flex; gap: 8px; margin-bottom: 8px; }
        .disp-city-wrap { flex: 6; min-width: 0; }
        .disp-state-wrap { flex: 4; min-width: 0; }
        .disp-name-wrap { flex: 1; min-width: 0; position: relative; }
        @media (max-width: 639px) {
          .disp-loc-row { flex-direction: column; }
          .disp-name-wrap { width: 100%; }
        }
      `}</style>

      <p style={{ fontFamily: fontInter, fontSize: '11px', fontWeight: '600', color: S.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
        {fieldLabel}
      </p>

      {value && (
        <DispensaryInfoCard
          value={value} accent={accent} onClear={handleClear}
          isFav={favs.includes(value.place_id)}
          onToggleFav={(placeId) => { const next = toggleFavorite(placeId); setFavs(next) }}
        />
      )}

      {!value && saved.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
          {sortedByFavorite(saved.filter((d) => !blocked.some((b) => b.place_id === d.place_id)), favs).map((d) => {
            const isFav = favs.includes(d.place_id)
            return (
              <button key={d.place_id} onClick={() => handleSelectSaved(d)}
                style={{
                  height: '36px', padding: '0 10px 0 8px', borderRadius: '9999px',
                  border: `1px solid ${isFav ? S.gold : S.border}`,
                  backgroundColor: isFav ? `${S.gold}18` : S.surface,
                  color: isFav ? S.gold : S.textSecondary,
                  fontFamily: fontInter, fontSize: '13px',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isFav ? `${S.gold}28` : `${S.border}` }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isFav ? `${S.gold}18` : S.surface }}>
                <span
                  role="button"
                  onClick={(e) => handleToggleFavorite(d.place_id, e)}
                  title={isFav ? 'Unstar' : 'Star'}
                  style={{ fontSize: '13px', lineHeight: 1, flexShrink: 0, opacity: isFav ? 1 : 0.45 }}
                >
                  {isFav ? '★' : '☆'}
                </span>
                <span>{d.name}</span>
                <span role="button" onClick={(e) => handleRemoveSaved(d.place_id, e)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', color: 'currentColor', flexShrink: 0, fontSize: '16px', lineHeight: 1, opacity: 0.6 }}>
                  ×
                </span>
              </button>
            )
          })}
        </div>
      )}

      {!value && (
        <>
          <div className="disp-loc-row">
            <div className="disp-city-wrap">
              <input
                ref={cityInputRef}
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                style={{ ...inputBase, padding: '0 14px' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = S.gold }}
                onBlur={(e) => { e.currentTarget.style.borderColor = S.border }}
              />
            </div>
            <div className="disp-state-wrap">
              <input
                type="text"
                value={stateAbbr}
                maxLength={2}
                onChange={(e) => setStateAbbr(e.target.value.toUpperCase())}
                placeholder="ST"
                style={{ ...inputBase, padding: '0 14px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = S.gold }}
                onBlur={(e) => { e.currentTarget.style.borderColor = S.border }}
              />
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              ref={nameInputRef}
              type="text"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              onFocus={handleNameFocus}
              onBlur={(e) => { e.currentTarget.style.borderColor = S.border }}
              placeholder="Search dispensaries near you..."
              style={{
                ...inputBase,
                borderRadius: dropdownOpen ? '8px 8px 0 0' : '8px',
                padding: '0 40px 0 14px',
              }}
            />

            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: S.textSecondary, display: 'flex', pointerEvents: 'none' }}>
              {(searching || loadingDetails) ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.75s linear infinite' }}>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="40 60" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </div>

            {dropdownOpen && predictions.length > 0 && (
              <div ref={dropdownRef} style={{
                position: 'absolute', top: '48px', left: 0, right: 0,
                backgroundColor: '#1A2E1A', border: '1px solid #2D4A2D',
                borderTop: 'none', borderRadius: '0 0 8px 8px',
                overflow: 'hidden', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}>
                {predictions.filter((p) => !blocked.some((b) => b.place_id === p.place_id)).map((p, i, arr) => {
                  const isSaved = saved.some((s) => s.place_id === p.place_id)
                  return (
                    <div key={p.place_id} style={{ position: 'relative', display: 'flex', alignItems: 'stretch', borderBottom: i < arr.length - 1 ? '1px solid #2D4A2D' : 'none' }}>
                      <button
                        onMouseDown={(e) => { e.preventDefault(); handleSelectPrediction(p) }}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                          minHeight: '52px', padding: '10px 12px 10px 16px', textAlign: 'left',
                          background: 'transparent', border: 'none',
                          cursor: 'pointer', transition: 'background-color 0.1s ease', boxSizing: 'border-box',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2D4A2D' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontFamily: fontInter, fontSize: '14px', color: '#E8F0E8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                            {p.structured_formatting?.main_text || p.description}
                          </span>
                          {p.structured_formatting?.secondary_text && (
                            <span style={{ fontFamily: fontInter, fontSize: '12px', color: S.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', marginTop: '2px' }}>
                              {p.structured_formatting.secondary_text}
                            </span>
                          )}
                        </div>
                        {isSaved && (
                          <span style={{ fontSize: '14px', flexShrink: 0, color: S.gold }}>★</span>
                        )}
                      </button>
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const name = p.structured_formatting?.main_text || p.description
                          const next = blockDispensary(p.place_id, name)
                          setBlocked(next)
                          setPredictions((prev) => prev.filter((x) => x.place_id !== p.place_id))
                        }}
                        style={{
                          flexShrink: 0, width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: S.textSecondary, fontSize: '18px', lineHeight: 1,
                          transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = S.textPrimary }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = S.textSecondary }}
                        title="Hide this dispensary"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function AmountSelector({ category, value, onChange, accent }) {
  const [customMode, setCustomMode] = useState(false)
  const options = AMOUNT_OPTIONS[category] || AMOUNT_OPTIONS._default

  return (
    <div>
      {customMode ? (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <StyledInput value={value} onChange={onChange} placeholder="Enter amount..." accent={accent} />
          <button onClick={() => { setCustomMode(false); onChange('') }}
            style={{ height: '48px', padding: '0 14px', borderRadius: '8px', border: `1px solid ${S.border}`, backgroundColor: S.surface, color: S.textSecondary, fontFamily: fontInter, fontSize: '13px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
            Preset
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {options.map((opt) => (
            <PillButton key={opt} label={opt} selected={value === opt} accent={accent} onClick={() => onChange(value === opt ? '' : opt)} small />
          ))}
          <button onClick={() => { setCustomMode(true); onChange('') }}
            style={{
              height: '34px', padding: '0 12px', borderRadius: '9999px',
              border: `1px dashed ${S.border}`, backgroundColor: 'transparent',
              color: S.textSecondary, fontFamily: fontInter, fontSize: '12px',
              cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
            <span style={{ fontSize: '15px', lineHeight: 1 }}>+</span> Custom
          </button>
        </div>
      )}
    </div>
  )
}

function PriceField({ value, onChange, accent }) {
  const numVal = parseFloat(value) || 0
  const pct = (Math.min(numVal, 420) / 420) * 100

  return (
    <div>
      <StyledInput value={value} onChange={onChange} placeholder="0.00" accent={accent} />
      <div style={{ marginTop: '10px', padding: '0 2px' }}>
        <style>{`
          input[type=range].price-slider{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:2px;outline:none;cursor:pointer;background:linear-gradient(to right,var(--accent) ${pct}%,${S.border} ${pct}%)}
          input[type=range].price-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px;height:20px;border-radius:50%;background:var(--accent);cursor:pointer}
          input[type=range].price-slider::-moz-range-thumb{width:20px;height:20px;border-radius:50%;border:none;background:var(--accent);cursor:pointer}
        `}</style>
        <input
          type="range"
          className="price-slider"
          min="0" max="420" step="1"
          value={Math.min(numVal, 420)}
          onChange={(e) => onChange(e.target.value)}
          style={{ '--accent': S.gold }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontFamily: fontInter, fontSize: '11px', color: S.textSecondary }}>$0</span>
          <span style={{ fontFamily: fontInter, fontSize: '11px', color: S.textSecondary }}>$420</span>
        </div>
      </div>
    </div>
  )
}

function CannabinoidSection({ value, onChange, accent, expanded, onToggleExpand }) {
  function toggle(name) {
    const next = { ...value }
    if (next[name] !== undefined) delete next[name]; else next[name] = ''
    onChange(next)
  }
  const selectedNames = CANNABINOIDS.filter((n) => value[n] !== undefined)
  return (
    <div style={{ marginBottom: '16px' }}>
      <button onClick={onToggleExpand}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', marginBottom: expanded ? '12px' : '0' }}>
        <span style={{ fontFamily: fontInter, fontSize: '12px', fontWeight: '600', color: S.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Cannabinoids</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', color: S.textSecondary }}>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {CANNABINOIDS.map((name) => {
              const selected = value[name] !== undefined
              return (
                <button key={name} onClick={() => toggle(name)}
                  style={{
                    height: '36px', padding: '0 14px', borderRadius: '9999px', flexShrink: 0,
                    border: `1px solid ${selected ? S.gold : S.border}`,
                    backgroundColor: selected ? `${S.gold}33` : S.surface,
                    color: selected ? S.gold : S.textSecondary,
                    fontFamily: fontInter, fontSize: '13px', fontWeight: selected ? '600' : '400',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}>
                  {name}
                </button>
              )
            })}
          </div>
          {selectedNames.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {selectedNames.map((name) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: fontInter, fontSize: '13px', color: S.gold, fontWeight: '600', minWidth: '60px' }}>{name}</span>
                  <input type="number" value={value[name]} onChange={(e) => onChange({ ...value, [name]: e.target.value })}
                    placeholder="0.0" min="0" max="100" step="0.1"
                    style={{ width: '72px', height: '32px', backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: '6px', padding: '0 8px', fontFamily: fontInter, fontSize: '13px', color: S.textPrimary, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s ease' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = S.gold }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = S.border }}
                  />
                  <span style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary }}>%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TerpeneSection({ value, onChange, aiSuggested, accent, expanded, onToggleExpand }) {
  function toggle(name) {
    const next = { ...value }
    if (next[name] !== undefined) delete next[name]; else next[name] = ''
    onChange(next)
  }
  const selectedNames = TERPENES.filter((n) => value[n] !== undefined)
  return (
    <div style={{ marginBottom: '16px' }}>
      <button onClick={onToggleExpand}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', marginBottom: expanded ? '12px' : '0' }}>
        <span style={{ fontFamily: fontInter, fontSize: '12px', fontWeight: '600', color: S.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Terpenes</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', color: S.textSecondary }}>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {TERPENES.map((name) => {
              const selected    = value[name] !== undefined
              const isSuggested = aiSuggested.includes(name) && !selected
              return (
                <button key={name} onClick={() => toggle(name)}
                  style={{
                    height: '36px', padding: '0 14px', borderRadius: '9999px', flexShrink: 0,
                    border: isSuggested ? `1px dashed ${S.gold}` : `1px solid ${selected ? S.gold : S.border}`,
                    backgroundColor: selected ? `${S.gold}33` : isSuggested ? `${S.gold}14` : S.surface,
                    color: selected ? S.gold : isSuggested ? S.gold : S.textSecondary,
                    fontFamily: fontInter, fontSize: '13px', fontWeight: selected ? '600' : isSuggested ? '500' : '400',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}>
                  {name}
                </button>
              )
            })}
          </div>
          {selectedNames.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {selectedNames.map((name) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: fontInter, fontSize: '13px', color: S.gold, fontWeight: '600', minWidth: '120px' }}>{name}</span>
                  <input type="number" value={value[name]} onChange={(e) => onChange({ ...value, [name]: e.target.value })}
                    placeholder="0.0" min="0" max="100" step="0.01"
                    style={{ width: '72px', height: '32px', backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: '6px', padding: '0 8px', fontFamily: fontInter, fontSize: '13px', color: S.textPrimary, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s ease' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = S.gold }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = S.border }}
                  />
                  <span style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary }}>%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const MOOD_FACES = [
  { value: 'good', label: 'Good', emoji: '😊', accentOverride: null },
  { value: 'meh',  label: 'Meh',  emoji: '😐', accentOverride: null },
  { value: 'off',  label: 'Off',  emoji: '😞', accentOverride: null },
  { value: 'eww',  label: 'Eww',  emoji: '🤢', accentOverride: '#4CAF50' },
]

function MoodFacePicker({ value, onChange, accent }) {
  return (
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
      {MOOD_FACES.map((face) => {
        const faceColor = face.accentOverride || S.gold
        const selected = value === face.value
        return (
          <div key={face.value} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => onChange(selected ? null : face.value)}
              style={{
                width: '64px', height: '64px', borderRadius: '50%',
                border: `${selected ? '2px' : '1px'} solid ${selected ? faceColor : S.border}`,
                backgroundColor: selected ? `${faceColor}26` : S.surface,
                cursor: 'pointer', transition: 'all 0.15s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', lineHeight: 1,
              }}
            >
              {face.emoji}
            </button>
            <span style={{ fontFamily: fontInter, fontSize: '11px', color: S.textSecondary, textAlign: 'center' }}>
              {face.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function TagPill({ label, selected, accent, onToggle }) {
  return (
    <button onClick={onToggle}
      style={{
        height: '36px', padding: '0 16px', borderRadius: '9999px',
        border: `1px solid ${selected ? S.gold : S.border}`,
        backgroundColor: selected ? `${S.gold}33` : S.surface,
        color: selected ? S.gold : S.textSecondary,
        fontFamily: fontInter, fontSize: '13px', fontWeight: selected ? '500' : '400',
        cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap', flexShrink: 0,
      }}>
      {label}
    </button>
  )
}

function EffectSection({ title, tags, selected, onToggle, accent, onAddCustom, expanded, onToggleExpand }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <button onClick={onToggleExpand}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', marginBottom: expanded ? '10px' : '0' }}>
        <span style={{ fontFamily: fontInter, fontSize: '12px', fontWeight: '600', color: S.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{title}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', color: S.textSecondary }}>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {expanded && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {tags.map((tag) => (
            <TagPill key={tag} label={tag} selected={selected.includes(tag)} accent={accent} onToggle={() => onToggle(tag)} />
          ))}
          {onAddCustom && (
            <button
              onClick={() => { const v = window.prompt('Something else...'); if (v?.trim()) onAddCustom(v.trim()) }}
              style={{
                height: '36px', padding: '0 14px', borderRadius: '9999px',
                border: `1px dashed ${S.border}`, backgroundColor: 'transparent',
                color: S.textSecondary, fontFamily: fontInter, fontSize: '13px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
              }}>
              <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> Other
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function useVoiceRecording({ onFinalTranscript, onInterim }) {
  const recRef     = useRef(null)
  const silenceRef = useRef(null)
  const finalRef   = useRef('')
  const [listening, setListening] = useState(false)
  const [supported] = useState(() =>
    typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  )
  const stop = useCallback(() => { clearTimeout(silenceRef.current); recRef.current?.stop() }, [])
  const start = useCallback(() => {
    if (!supported) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US'
    recRef.current = rec; finalRef.current = ''
    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalRef.current += e.results[i][0].transcript + ' '
        else interim += e.results[i][0].transcript
      }
      onInterim?.(interim)
      clearTimeout(silenceRef.current)
      silenceRef.current = setTimeout(() => rec.stop(), 2500)
    }
    rec.onend  = () => { setListening(false); clearTimeout(silenceRef.current); onFinalTranscript(finalRef.current.trim()) }
    rec.onerror = () => { setListening(false); clearTimeout(silenceRef.current) }
    rec.start(); setListening(true)
    silenceRef.current = setTimeout(() => rec.stop(), 12000)
  }, [supported, onFinalTranscript, onInterim])
  useEffect(() => () => { clearTimeout(silenceRef.current); recRef.current?.stop() }, [])
  return { listening, supported, start, stop }
}

function parseTranscript(text) {
  const r = { productName: '', amount: '', price: '', effectTags: [] }
  if (!text) return r
  const lower = text.toLowerCase()
  const am = text.match(/(\d+\.?\d*)\s*(gram|grams|g\b|mg|oz|ounce)/i) || text.match(/(half|quarter|eighth)\s*(gram|ounce|oz)?/i)
  if (am) r.amount = am[0]
  const pm = text.match(/\$(\d+\.?\d*)|(\d+\.?\d*)\s*dollars?/i)
  if (pm) r.price = pm[1] || pm[2] || ''
  r.effectTags = ALL_EFFECT_TAGS.filter((t) => lower.includes(t.toLowerCase()))
  const words = text.split(/\s+/); const run = []
  for (const w of words) {
    if (/^[A-Z][a-z]/.test(w) && w.length > 2 && !['The','And','For','But'].includes(w)) run.push(w)
    else if (run.length) break
  }
  if (run.length) r.productName = run.join(' ')
  return r
}

function Chip({ label, accent }) {
  return (
    <span style={{ height: '28px', padding: '0 12px', display: 'inline-flex', alignItems: 'center', borderRadius: '9999px', border: `1px solid ${S.gold}`, fontFamily: fontInter, fontSize: '12px', color: S.gold, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function VoiceCapture({ accent, onSaveDirect, onEditManually }) {
  const [phase, setPhase]           = useState('recording')
  const [liveText, setLiveText]     = useState('')
  const [parsed, setParsed]         = useState(null)
  const [editedText, setEditedText] = useState('')
  const handleFinal = useCallback((text) => { setLiveText(text); setEditedText(text); setParsed(parseTranscript(text)); setPhase('review') }, [])
  const { listening, supported, start, stop } = useVoiceRecording({
    onFinalTranscript: handleFinal,
    onInterim: useCallback((t) => setLiveText((p) => p + t), []),
  })
  useEffect(() => { if (supported) start(); else setPhase('unsupported') }, []) // eslint-disable-line

  if (phase === 'unsupported') return (
    <div style={{ padding: '32px 20px', textAlign: 'center' }}>
      <p style={{ fontFamily: fontInter, fontSize: '15px', color: S.textSecondary, lineHeight: '1.6', marginBottom: '24px' }}>Voice recording is not available in this browser.</p>
      <button onClick={() => onEditManually({})} style={{ width: '100%', height: '52px', backgroundColor: S.gold, color: S.bg, border: 'none', borderRadius: '10px', fontFamily: fontInter, fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>Type it instead</button>
    </div>
  )

  if (phase === 'recording') return (
    <div style={{ padding: '32px 20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
      <style>{`@keyframes ripple{0%{transform:scale(1);opacity:.5}100%{transform:scale(1.6);opacity:0}}`}</style>
      <div style={{ position: 'relative', width: '100px', height: '100px' }}>
        {listening && (
          <>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: S.gold, opacity: 0.18, animation: 'ripple 1.4s ease-out infinite' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: S.gold, opacity: 0.12, animation: 'ripple 1.4s ease-out .7s infinite' }} />
          </>
        )}
        <button onClick={stop} style={{ position: 'absolute', inset: 0, width: '100px', height: '100px', borderRadius: '50%', backgroundColor: S.gold, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 20px ${S.gold}50` }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="3" width="6" height="12" rx="3" fill="white" />
            <path d="M5 11a7 7 0 0014 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 18v3M9 21h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <p style={{ fontFamily: fontInter, fontSize: '16px', color: S.textSecondary, margin: 0 }}>{listening ? 'Listening...' : 'Starting...'}</p>
      {liveText && <p style={{ fontFamily: fontInter, fontSize: '15px', color: S.textPrimary, lineHeight: '1.6', textAlign: 'center', margin: 0, maxWidth: '300px' }}>{liveText}</p>}
      <p style={{ fontFamily: fontInter, fontSize: '12px', color: S.textSecondary, margin: 0, opacity: 0.7 }}>Tap to stop</p>
    </div>
  )

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <FieldLabel>What you said</FieldLabel>
        <textarea value={editedText} onChange={(e) => { setEditedText(e.target.value); setParsed(parseTranscript(e.target.value)) }}
          spellCheck={true} autoCorrect="on"
          style={{ width: '100%', minHeight: '80px', backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: '8px', padding: '12px 14px', fontFamily: fontInter, fontSize: '15px', color: S.textPrimary, outline: 'none', resize: 'vertical', lineHeight: '1.6', boxSizing: 'border-box', transition: 'border-color 0.15s ease' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = S.gold }}
          onBlur={(e) => { e.currentTarget.style.borderColor = S.border }}
        />
        <p style={{ fontFamily: fontInter, fontSize: '12px', color: S.textSecondary, margin: '6px 0 0 0' }}>Tap to edit anything before saving</p>
      </div>
      {parsed && (parsed.productName || parsed.amount || parsed.price || parsed.effectTags.length > 0) && (
        <div>
          <FieldLabel>Extracted</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {parsed.productName && <Chip label={`Product: ${parsed.productName}`} accent={accent} />}
            {parsed.amount      && <Chip label={`Amount: ${parsed.amount}`}       accent={accent} />}
            {parsed.price       && <Chip label={`Price: $${parsed.price}`}        accent={accent} />}
            {parsed.effectTags.map((t) => <Chip key={t} label={`Effect: ${t}`} accent={accent} />)}
          </div>
        </div>
      )}
      <button onClick={() => onSaveDirect({ transcript: editedText, parsed })}
        style={{ width: '100%', height: '56px', backgroundColor: S.gold, color: S.bg, border: 'none', borderRadius: '10px', fontFamily: fontInter, fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
        Looks good — save it
      </button>
      <button onClick={() => onEditManually({ transcript: editedText, parsed })}
        style={{ width: '100%', height: '50px', backgroundColor: 'transparent', color: S.gold, border: `1px solid ${S.gold}`, borderRadius: '10px', fontFamily: fontInter, fontSize: '15px', fontWeight: '500', cursor: 'pointer' }}>
        Edit details
      </button>
    </div>
  )
}

function ManualEntryForm({ accent, notePrompt, initialData = {}, onSave, saving, saveError }) {
  const [productName, setProductName] = useState(initialData.productName || '')
  const [dispensary, setDispensary]   = useState(null)
  const [category, setCategory]       = useState('')
  const [strainType, setStrainType]   = useState('')
  const [amount, setAmount]           = useState(initialData.amount || '')
  const [price, setPrice]             = useState(initialData.price || '')
  const [notes, setNotes]             = useState('')
  const [bodyTags, setBodyTags]       = useState(initialData.bodyTags   || [])
  const [mindTags, setMindTags]       = useState(initialData.mindTags   || [])
  const [moodTags, setMoodTags]       = useState(initialData.moodTags || [])
  const [moodCustomTags, setMoodCustomTags] = useState([])
  const [moodFace, setMoodFace]       = useState(null)
  const [cannabinoids, setCannabinoids] = useState({})
  const [terpenes, setTerpenes]         = useState({})
  const [aiSuggested, setAiSuggested]   = useState([])
  const [bodyOpen, setBodyOpen]           = useState(true)
  const [mindOpen, setMindOpen]           = useState(true)
  const [moodOpen, setMoodOpen]           = useState(true)
  const [cannabinoidsOpen, setCannabinoidsOpen] = useState(false)
  const [terpenesOpen, setTerpenesOpen]         = useState(false)

  useEffect(() => {
    const suggestions = suggestTerpenes(productName)
    setAiSuggested(suggestions)
    if (suggestions.length > 0) {
      setTerpenes((prev) => {
        const next = { ...prev }
        suggestions.forEach((t) => { if (next[t] === undefined) next[t] = '' })
        return next
      })
    }
  }, [productName])

  const [noteListening, setNoteListening] = useState(false)
  const handleNoteFinal = useCallback((t) => { if (t) setNotes((p) => p ? p + ' ' + t : t) }, [])
  const { listening: nl, supported: voiceSupported, start: startNote, stop: stopNote } = useVoiceRecording({ onFinalTranscript: handleNoteFinal })
  useEffect(() => { setNoteListening(nl) }, [nl])

  function toggle(arr, setter, tag) { setter(arr.includes(tag) ? arr.filter((t) => t !== tag) : [...arr, tag]) }

  function handleSubmit() {
    onSave({
      productName,
      dispensaryName:    dispensary?.name      ?? null,
      dispensaryPlaceId: dispensary?.place_id  ?? null,
      dispensaryAddress: dispensary?.address   ?? null,
      dispensaryPhone:   dispensary?.phone     ?? null,
      dispensaryHours:   dispensary?.hours     ?? null,
      dispensaryMapsUrl: dispensary?.maps_url  ?? null,
      dispensaryLat:     dispensary?.lat       ?? null,
      dispensaryLng:     dispensary?.lng       ?? null,
      category,
      strainType: CATEGORIES_WITH_STRAIN.includes(category) ? strainType : '',
      amount,
      price: price ? parseFloat(price) : null,
      notes,
      bodyTags, mindTags, moodTags, moodCustom: moodCustomTags.join(', '), moodFace,
      adverseEventLevel: moodFace === 'eww' ? 1 : null,
      cannabinoids,
      terpenes,
      terpenesAiSuggested: aiSuggested,
    })
  }

  const canSubmit = productName.trim() && !saving

  return (
    <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div>
        <FieldLabel>Product Name</FieldLabel>
        <StyledInput value={productName} onChange={setProductName} placeholder="e.g. Blue Dream, Purple Punch..." accent={accent} />
      </div>

      <div>
        <DispensarySelector accent={accent} value={dispensary} onChange={setDispensary} category={category} />
      </div>

      <div>
        <FieldLabel>Category</FieldLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {CATEGORIES.map((c) => (
            <PillButton key={c} label={c} selected={category === c} accent={accent}
              onClick={() => { setCategory(category === c ? '' : c); setAmount('') }} />
          ))}
        </div>
      </div>

      {CATEGORIES_WITH_STRAIN.includes(category) && (
        <div>
          <FieldLabel>Strain Type</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {STRAIN_TYPES.map((st) => (
              <PillButton key={st} label={st} selected={strainType === st} accent={accent}
                onClick={() => setStrainType(strainType === st ? '' : st)} />
            ))}
          </div>
        </div>
      )}

      <div>
        <FieldLabel>Amount</FieldLabel>
        <AmountSelector category={category} value={amount} onChange={setAmount} accent={accent} />
      </div>

      <div>
        <FieldLabel>Price ($)</FieldLabel>
        <PriceField value={price} onChange={setPrice} accent={accent} />
      </div>

      <CannabinoidSection value={cannabinoids} onChange={setCannabinoids} accent={accent} expanded={cannabinoidsOpen} onToggleExpand={() => setCannabinoidsOpen(!cannabinoidsOpen)} />

      <TerpeneSection value={terpenes} onChange={setTerpenes} aiSuggested={aiSuggested} accent={accent} expanded={terpenesOpen} onToggleExpand={() => setTerpenesOpen(!terpenesOpen)} />

      <div>
        <FieldLabel>Effects</FieldLabel>
        <EffectSection title="Body"   tags={BODY_TAGS}   selected={bodyTags}   onToggle={(t) => toggle(bodyTags,   setBodyTags,   t)} accent={accent} expanded={bodyOpen}   onToggleExpand={() => setBodyOpen(!bodyOpen)} />
        <EffectSection title="Mind"   tags={MIND_TAGS}   selected={mindTags}   onToggle={(t) => toggle(mindTags,   setMindTags,   t)} accent={accent} expanded={mindOpen}   onToggleExpand={() => setMindOpen(!mindOpen)} />
        <EffectSection title="Mood" tags={[...MOOD_TAGS, ...moodCustomTags]} selected={moodTags} onToggle={(t) => toggle(moodTags, setMoodTags, t)} accent={accent} onAddCustom={(v) => { if (!moodCustomTags.includes(v)) setMoodCustomTags((prev) => [...prev, v]); setMoodTags((prev) => prev.includes(v) ? prev : [...prev, v]) }} expanded={moodOpen} onToggleExpand={() => setMoodOpen(!moodOpen)} />
      </div>

      <div>
        <FieldLabel>Notes</FieldLabel>
        <style>{`@keyframes micPulse{0%,100%{box-shadow:0 4px 16px rgba(0,0,0,0.4),0 0 0 0 var(--mic-accent)}70%{box-shadow:0 4px 16px rgba(0,0,0,0.4),0 0 0 14px transparent}}`}</style>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={notePrompt} rows={5}
          spellCheck={true} autoCorrect="on"
          style={{ width: '100%', backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: '8px', padding: '12px 14px', fontFamily: fontInter, fontSize: '15px', color: S.textPrimary, outline: 'none', resize: 'vertical', lineHeight: '1.6', boxSizing: 'border-box', transition: 'border-color 0.15s ease' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = S.gold }}
          onBlur={(e) => { e.currentTarget.style.borderColor = S.border }}
        />
        {voiceSupported && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
            <button
              onMouseDown={(e) => { e.preventDefault(); noteListening ? stopNote() : startNote() }}
              style={{
                width: '52px', height: '52px', borderRadius: '50%',
                backgroundColor: accent, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                animation: noteListening ? 'micPulse 1.2s ease-in-out infinite' : 'none',
                '--mic-accent': `${accent}60`,
                transition: 'transform 0.1s ease',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="3" width="6" height="12" rx="3" fill="white" />
                <path d="M5 11a7 7 0 0014 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 18v3M9 21h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <span style={{ fontFamily: fontInter, fontSize: '12px', color: S.textSecondary, textAlign: 'center' }}>
              {noteListening ? 'Listening...' : notes ? 'Tap to edit before saving' : 'Tap to record a note'}
            </span>
          </div>
        )}
      </div>

      <div>
        <FieldLabel>How are you feeling?</FieldLabel>
        <MoodFacePicker value={moodFace} onChange={setMoodFace} accent={accent} />
      </div>

      {saveError && <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.error, margin: 0, lineHeight: '1.5' }}>{saveError}</p>}

      <button onClick={handleSubmit} disabled={!canSubmit}
        style={{
          width: '100%', height: '56px',
          backgroundColor: canSubmit ? S.gold : '#5A4A20',
          color: canSubmit ? S.bg : '#4A3A10',
          border: 'none', borderRadius: '10px', fontFamily: fontInter,
          fontSize: '15px', fontWeight: '700',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          letterSpacing: '0.02em', transition: 'background-color 0.15s ease',
        }}>
        {saving ? 'Saving...' : 'Save entry'}
      </button>
    </div>
  )
}

function CaptureSheet({ accent, notePrompt, onSave, saving, saveError, initialMethod }) {
  const navigate = useNavigate()
  const [mode, setMode]               = useState(initialMethod || null)
  const [voicePreFill, setVoicePreFill] = useState(null)

  function handleSaveDirect({ transcript, parsed }) { setVoicePreFill({ transcript, parsed }); setMode('manual') }
  function handleEditManually(data) { setVoicePreFill(data || null); setMode('manual') }
  function handleManualSave(fields) {
    onSave({ ...fields, voiceTranscript: voicePreFill?.transcript || '', captureMode: voicePreFill ? 'voice' : 'manual' })
  }

  if (!mode) return (
    <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {[
        { id: 'voice',  label: 'Say it',  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="9" y="3" width="6" height="12" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0014 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M12 18v3M9 21h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
        { id: 'scan',   label: 'Scan it', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M14 14h2v2h-2zM18 14h3M14 18v3M18 18h3v3h-3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
        { id: 'manual', label: 'Type it', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 20h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
      ].map(({ id, label, icon }) => (
        <button key={id} onClick={() => setMode(id)}
          style={{
            width: '100%', height: '58px', backgroundColor: S.surface,
            border: `1px solid ${S.border}`, borderRadius: '10px',
            display: 'flex', alignItems: 'center', gap: '16px',
            padding: '0 20px', cursor: 'pointer', color: S.gold,
            fontFamily: fontInter, fontSize: '15px', fontWeight: '500',
            transition: 'border-color 0.15s ease, background-color 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = S.gold; e.currentTarget.style.backgroundColor = `${S.gold}12` }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.backgroundColor = S.surface }}>
          {icon}{label}
        </button>
      ))}
      <button
        onClick={() => navigate('/notes/new')}
        style={{
          width: '100%', height: '58px', backgroundColor: S.surface,
          border: `1px solid ${S.border}`, borderRadius: '10px',
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '0 20px', cursor: 'pointer', color: S.gold,
          fontFamily: fontInter, fontSize: '15px', fontWeight: '500',
          transition: 'border-color 0.15s ease, background-color 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = S.gold; e.currentTarget.style.backgroundColor = `${S.gold}12` }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.backgroundColor = S.surface }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Note 📝
      </button>
    </div>
  )

  if (mode === 'voice') return <VoiceCapture accent={accent} onSaveDirect={handleSaveDirect} onEditManually={handleEditManually} />

  if (mode === 'scan') return (
    <div style={{ padding: '32px 20px', textAlign: 'center' }}>
      <p style={{ fontFamily: fontPlayfair, fontSize: '20px', color: S.textPrimary, margin: '0 0 12px 0' }}>Label Scan</p>
      <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, lineHeight: '1.6', margin: '0 0 24px 0' }}>Camera scanning coming soon. Use manual entry for now.</p>
      <button onClick={() => setMode('manual')} style={{ width: '100%', height: '52px', backgroundColor: S.gold, color: S.bg, border: 'none', borderRadius: '10px', fontFamily: fontInter, fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
        Enter manually
      </button>
    </div>
  )

  return (
    <ManualEntryForm
      accent={accent}
      notePrompt={notePrompt}
      initialData={voicePreFill?.parsed ? {
        productName: voicePreFill.parsed.productName || '',
        amount:      voicePreFill.parsed.amount      || '',
        price:       voicePreFill.parsed.price       || '',
        bodyTags:    (voicePreFill.parsed.effectTags || []).filter((t) => BODY_TAGS.includes(t)),
        mindTags:    (voicePreFill.parsed.effectTags || []).filter((t) => MIND_TAGS.includes(t)),
        moodTags:    (voicePreFill.parsed.effectTags || []).filter((t) => MOOD_TAGS.includes(t)),
      } : {}}
      onSave={handleManualSave}
      saving={saving}
      saveError={saveError}
    />
  )
}

export default function NewEntry() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialMethod = searchParams.get('method')
  const [profile, setProfile] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [saveError, setSaveError] = useState('')
  const [formKey] = useState(() => Date.now())

  useEffect(() => {
    if (isDevMode()) { setProfile({ guide_selected: 'sunny', accent_color: '#FF7F5C' }); return }
    async function load() {
      const { data: { user } } = await localStore.auth.getUser()
      if (!user) return
      const { data } = await localStore
        .from('user_profiles')
        .select('guide_selected, guide_name, accent_color')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) setProfile(data)
    }
    load()
  }, [])

  const guideKey  = profile?.guide_selected || 'bud'
  const meta      = GUIDE_META[guideKey] || GUIDE_META.bud
  const accent    = meta.accent
  const notePrompt = meta.notePrompt

  async function handleSave(fields) {
    setSaveError(''); setSaving(true)
    let uid = isDevMode() ? 'dev-user-001' : null
    if (!uid) {
      const { data: { user } } = await localStore.auth.getUser()
      if (!user) { setSaveError('Not signed in.'); setSaving(false); return }
      uid = user.id
    }

    const { error } = await localStore.from('entries').insert({
      user_id:              uid,
      product_name:         fields.productName         || '',
      dispensary_name:      fields.dispensaryName      || null,
      dispensary_place_id:  fields.dispensaryPlaceId   || null,
      dispensary_address:   fields.dispensaryAddress   || null,
      dispensary_phone:     fields.dispensaryPhone     || null,
      dispensary_hours:     fields.dispensaryHours     || null,
      dispensary_maps_url:  fields.dispensaryMapsUrl   || null,
      dispensary_lat:       fields.dispensaryLat       || null,
      dispensary_lng:       fields.dispensaryLng       || null,
      category:             fields.category            || null,
      strain_type:          fields.strainType          || null,
      amount:               fields.amount              || null,
      price:                fields.price               || null,
      body_tags:            fields.bodyTags            || [],
      mind_tags:            fields.mindTags            || [],
      mood_tags:            fields.moodTags            || [],
      mood_custom:          fields.moodCustom          || null,
      mood_face:            fields.moodFace            || null,
      adverse_event_level:  fields.adverseEventLevel   ?? null,
      cannabinoids:         Object.keys(fields.cannabinoids || {}).length ? fields.cannabinoids : null,
      terpenes:             Object.keys(fields.terpenes     || {}).length ? fields.terpenes     : null,
      terpenes_ai_suggested: fields.terpenesAiSuggested?.length ? fields.terpenesAiSuggested : null,
      notes:                fields.notes               || null,
      voice_transcript:     fields.voiceTranscript     || null,
      capture_mode:         fields.captureMode         || 'manual',
    })

    setSaving(false)
    if (error) {
      if (isDevMode()) { console.error('Dev save error:', error) }
      else { setSaveError('Could not save entry. Try again.'); return }
    }
    navigate('/journal')
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: S.bg, boxSizing: 'border-box' }}>
      <div style={{
        position: 'sticky', top: 0, backgroundColor: S.bg,
        borderBottom: `1px solid ${S.border}`, zIndex: 10,
        display: 'flex', alignItems: 'center', padding: '0 20px',
        height: '56px', boxSizing: 'border-box',
      }}>
        <button onClick={() => navigate(-1)}
          style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: S.textSecondary, borderRadius: '8px', transition: 'color 0.15s ease', marginLeft: '-8px' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = S.textPrimary }}
          onMouseLeave={(e) => { e.currentTarget.style.color = S.textSecondary }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 style={{ fontFamily: fontPlayfair, fontSize: '20px', fontWeight: '600', color: S.textPrimary, margin: '0 0 0 8px', lineHeight: 1 }}>New Entry</h1>
      </div>

      <div style={{ padding: '24px 20px 0', textAlign: 'center' }}>
        <h2 style={{ fontFamily: fontPlayfair, fontSize: '22px', fontWeight: '600', color: S.textPrimary, margin: '0 0 6px 0', lineHeight: '1.2' }}>What did you get?</h2>
        <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, margin: '0 0 20px 0', lineHeight: '1.5' }}>Speak it, scan it, or type it.</p>
      </div>

      <CaptureSheet
        key={formKey}
        accent={accent}
        notePrompt={notePrompt}
        onSave={handleSave}
        saving={saving}
        saveError={saveError}
        initialMethod={initialMethod}
      />
    </div>
  )
}