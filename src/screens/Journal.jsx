import { useState, useEffect, useRef, useCallback } from 'react'
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
  error:         '#E05C5C',
}
const fontInter    = "'Inter', sans-serif"
const fontPlayfair = "'Playfair Display', serif"

const MOCK_ENTRIES = [
  { id: 'mock-1', product_name: 'Blue Dream', dispensary_name: 'Trulieve Scranton', category: 'Flower', strain_type: 'Sativa', mood_face: 'good', entry_type: 'cannabis', body_tags: ['Relaxed', 'Floaty'], mind_tags: ['Creative'], mood_tags: ['Introspective'], created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 'mock-sleep-1', product_name: 'Sleep Start', dispensary_name: null, category: null, strain_type: null, mood_face: null, entry_type: 'sleep_start', body_tags: [], mind_tags: [], mood_tags: [], created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString() },
  { id: 'mock-note-1', product_name: 'Morning thoughts', dispensary_name: null, category: null, strain_type: null, mood_face: null, entry_type: 'note', body_tags: [], mind_tags: [], mood_tags: [], notes: 'Feeling clear today. Slept well.', created_at: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString() },
  { id: 'mock-2', product_name: 'Gelato #33', dispensary_name: 'Holistic Industries', category: 'Vape', strain_type: 'Hybrid', mood_face: 'meh', entry_type: 'cannabis', body_tags: ['Tired'], mind_tags: ['Foggy', 'Scattered'], mood_tags: [], created_at: new Date(Date.now() - 1000 * 60 * 60 * 27).toISOString() },
]

const MOOD_EMOJI   = { good: '😊', meh: '😐', off: '😞', eww: '🤢' }
const SLEEP_ICONS  = { sleep_start: '🌙', sleep_end: '☀️', nap: '😴' }
const SLEEP_LABELS = { sleep_start: 'Sleep', sleep_end: 'Sleep', nap: 'Nap' }

function formatDate(iso) {
  const now  = new Date()
  const d    = new Date(iso)
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7)  return `${diff} days ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function TagChip({ label }) {
  return (
    <span style={{ height: '22px', padding: '0 8px', display: 'inline-flex', alignItems: 'center', borderRadius: '9999px', backgroundColor: S.surface, border: `1px solid ${S.border}`, fontFamily: fontInter, fontSize: '11px', color: S.textSecondary, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function CategoryPill({ label }) {
  return (
    <span style={{ height: '22px', padding: '0 8px', display: 'inline-flex', alignItems: 'center', borderRadius: '9999px', backgroundColor: S.surface, border: `1px solid ${S.gold}`, fontFamily: fontInter, fontSize: '11px', color: S.gold, whiteSpace: 'nowrap', fontWeight: '500' }}>
      {label}
    </span>
  )
}

function InlineActions({ entry, onEdit, onDelete }) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end', marginTop: '6px' }}
    >
      <button
        onClick={() => onEdit(entry)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: fontInter, fontSize: '11px', color: S.gold, padding: 0, transition: 'opacity 0.12s ease' }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
      >
        Edit
      </button>
      <button
        onClick={() => onDelete(entry)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: fontInter, fontSize: '11px', color: S.error, padding: 0, transition: 'opacity 0.12s ease' }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
      >
        Delete
      </button>
    </div>
  )
}

function EntryCard({ entry, onClick, onEdit, onDelete }) {
  const type = entry.entry_type

  // Note card
  if (type === 'note') {
    return (
      <div
        style={{ backgroundColor: S.surface, border: `1px solid ${S.border}`, borderLeft: `3px solid ${S.textSecondary}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '10px', transition: 'background-color 0.15s ease' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1E2E1E' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = S.surface }}
      >
        <div onClick={onClick} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', lineHeight: 1 }}>✏️</span>
              <span style={{ fontFamily: fontInter, fontSize: '15px', fontWeight: '600', color: S.textPrimary }}>{entry.product_name || 'Note'}</span>
            </div>
            <span style={{ fontFamily: fontInter, fontSize: '12px', color: S.textSecondary, flexShrink: 0 }}>{formatDate(entry.created_at)}</span>
          </div>
          {entry.notes && (
            <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, margin: 0, lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {entry.notes}
            </p>
          )}
        </div>
        <InlineActions entry={entry} onEdit={onEdit} onDelete={onDelete} />
      </div>
    )
  }

  // Sleep card
  if (type && type !== 'cannabis') {
    const icon  = SLEEP_ICONS[type]  || '🌙'
    const label = SLEEP_LABELS[type] || 'Sleep'
    return (
      <div
        style={{ backgroundColor: S.surface, border: `1px solid ${S.border}`, borderLeft: `3px solid ${S.border}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '10px', transition: 'background-color 0.15s ease', opacity: 0.9 }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1E2E1E' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = S.surface }}
      >
        <div onClick={onClick} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px', lineHeight: 1, flexShrink: 0 }}>{icon}</span>
          <span style={{ fontFamily: fontInter, fontSize: '15px', fontStyle: 'italic', color: S.textSecondary, flex: 1 }}>{label}</span>
          <span style={{ fontFamily: fontInter, fontSize: '12px', color: S.textSecondary, flexShrink: 0 }}>{formatDate(entry.created_at)}</span>
        </div>
        <InlineActions entry={entry} onEdit={onEdit} onDelete={onDelete} />
      </div>
    )
  }

  // Cannabis card
  const allTags = [...(entry.body_tags || []), ...(entry.mind_tags || []), ...(entry.mood_tags || [])].slice(0, 3)
  return (
    <div
      style={{ backgroundColor: S.surface, border: `1px solid ${S.border}`, borderLeft: `3px solid ${S.gold}`, borderRadius: '10px', padding: '14px 16px', marginBottom: '10px', transition: 'background-color 0.15s ease' }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#203820' }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = S.surface }}
    >
      <div onClick={onClick} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontFamily: fontInter, fontSize: '16px', fontWeight: '700', color: S.textPrimary, lineHeight: '1.3', flex: 1 }}>{entry.product_name || 'Unnamed Product'}</span>
          {entry.mood_face && <span style={{ fontSize: '18px', lineHeight: 1, flexShrink: 0, marginTop: '1px' }}>{MOOD_EMOJI[entry.mood_face]}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.dispensary_name || 'No dispensary'}</span>
          <span style={{ fontFamily: fontInter, fontSize: '12px', color: S.textSecondary, flexShrink: 0 }}>{formatDate(entry.created_at)}</span>
        </div>
        {(entry.category || entry.strain_type) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
            {entry.category    && <CategoryPill label={entry.category} />}
            {entry.strain_type && <CategoryPill label={entry.strain_type} />}
          </div>
        )}
        {allTags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '2px' }}>
            {allTags.map((tag) => <TagChip key={tag} label={tag} />)}
          </div>
        )}
      </div>
      <InlineActions entry={entry} onEdit={onEdit} onDelete={onDelete} />
    </div>
  )
}

// ── FAB with pop-up menu ──────────────────────────────────────────────────────

function FabMenu({ navigate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [open])

  const items = [
    { label: 'Cannabis Log', dest: '/entries/new' },
    { label: 'Sleep Log',    dest: '/quick?mode=sleep' },
    { label: 'Note',         dest: '/notes/new' },
  ]

  return (
    <div ref={ref} style={{ position: 'fixed', bottom: '80px', right: '20px', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>

      {/* Pop-up items */}
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', marginBottom: '4px' }}>
          {items.map(({ label, dest }) => (
            <button
              key={dest}
              onClick={() => { setOpen(false); navigate(dest) }}
              style={{
                height: '40px', padding: '0 18px',
                backgroundColor: S.surface, border: `1px solid ${S.gold}`,
                borderRadius: '20px', cursor: 'pointer',
                fontFamily: fontInter, fontSize: '14px', fontWeight: '500',
                color: S.gold, whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                transition: 'background-color 0.12s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${S.gold}18` }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = S.surface }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* FAB circle */}
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          width: '56px', height: '56px', borderRadius: '50%',
          backgroundColor: S.gold, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.5)' }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="#0A1A0A" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function Journal() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDevMode()) { setEntries(MOCK_ENTRIES); setLoading(false); return }
    async function load() {
      const { data: { user } } = await localStore.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await localStore
        .from('entries')
        .select('id, product_name, dispensary_name, category, strain_type, mood_face, entry_type, body_tags, mind_tags, mood_tags, notes, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setEntries(data || [])
      setLoading(false)
    }
    load()
  }, [])

  function handleEdit(entry) {
    navigate(`/entries/${entry.id}/edit`)
  }

  function handleDelete(entry) {
    const label = entry.product_name || 'this entry'
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return
    setEntries((prev) => prev.filter((e) => e.id !== entry.id))
    if (!isDevMode()) {
      localStore.from('entries').delete().eq('id', entry.id)
    }
  }

  function getDestination(entry) {
    if (entry.entry_type === 'note') return `/entries/${entry.id}`
    if (entry.entry_type && entry.entry_type !== 'cannabis') return `/entries/sleep/${entry.id}`
    return `/entries/${entry.id}`
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: S.bg, boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, backgroundColor: S.bg, borderBottom: `1px solid ${S.border}`, zIndex: 10, display: 'flex', alignItems: 'center', padding: '0 20px', height: '56px', boxSizing: 'border-box' }}>
        <span style={{ fontFamily: fontPlayfair, fontSize: '20px', color: S.textPrimary }}>Journal</span>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 16px 100px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
            <span style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary }}>Loading...</span>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px 0', gap: '12px', textAlign: 'center' }}>
            <p style={{ fontFamily: fontPlayfair, fontSize: '22px', color: S.textPrimary, margin: 0 }}>Nothing logged yet.</p>
            <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, margin: 0, lineHeight: '1.6' }}>Tap + to log your first entry.</p>
          </div>
        ) : (
          entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onClick={() => navigate(getDestination(entry))}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <FabMenu navigate={navigate} />
    </div>
  )
}
