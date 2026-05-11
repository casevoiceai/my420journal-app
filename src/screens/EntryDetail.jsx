import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
  bud:    { name: 'Bud Tendar',      accent: '#C9A84C' },
  sunny:  { name: 'Sunny Day',       accent: '#FF7F5C' },
  larry:  { name: 'Lucky Larry',     accent: '#C17A3A' },
  herb:   { name: 'Herb N. Spices',  accent: '#4ECDC4' },
  mary:   { name: 'Mary Jayne',      accent: '#B088B0' },
  unit:   { name: null,              accent: '#888888' },
  stoner: { name: null,              accent: '#C9A84C' },
  tool:   { name: null,              accent: '#C9A84C' },
}

const MOOD_FACES = {
  good: { emoji: '😊', label: 'Good' },
  meh:  { emoji: '😐', label: 'Meh'  },
  off:  { emoji: '😞', label: 'Nah'  },
  eww:  { emoji: '🤢', label: 'Eww'  },
}

const DEV_ENTRY = {
  id: 'dev-entry-001',
  product_name: 'Blue Dream',
  created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  category: 'Flower',
  strain_type: 'Hybrid',
  amount: '1g',
  price: 12.00,
  dispensary_name: 'Rise Dispensary',
  mood_face: 'good',
  body_tags: ['Relaxed', 'Tingly'],
  mind_tags: ['Creative', 'Focused'],
  mood_tags: ['Happy', 'Uplifted'],
  cannabinoids: { THC: '22.4', CBD: '0.2' },
  terpenes: { 'Beta Myrcene': '1.2', 'Limonene': '0.8' },
  notes: 'Really smooth. Great for afternoon sessions. The creative effect came on about 20 minutes in.',
}

function formatEntryDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function TagPill({ text, accent }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      height: '28px', padding: '0 10px',
      border: `1px solid ${accent}80`,
      borderRadius: '9999px',
      fontFamily: fontInter, fontSize: '12px', fontWeight: '500',
      color: accent,
      margin: '3px',
    }}>
      {text}
    </span>
  )
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: fontInter, fontSize: '11px', fontWeight: '600',
      color: S.textSecondary, letterSpacing: '0.08em',
      textTransform: 'uppercase', margin: '0 0 10px 0',
    }}>
      {children}
    </p>
  )
}

function Divider() {
  return <div style={{ height: '1px', backgroundColor: S.border, margin: '20px 0' }} />
}

function CollapsibleSection({ label, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', padding: '0 0 10px 0', cursor: 'pointer',
        }}
      >
        <SectionLabel>{label}</SectionLabel>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          style={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0, marginBottom: '10px' }}
        >
          <path d="M6 9l6 6 6-6" stroke={S.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && children}
    </div>
  )
}

function GuideObservation({ entry, guideKey, accent, guideName }) {
  const [text,    setText]    = useState('')
  const [loading, setLoading] = useState(false)
  const [loadedObservation, setLoadedObservation] = useState(false)

  useEffect(() => {
    if (loadedObservation) return
    setLoadedObservation(true)
    setLoading(true)

    const tags = [
      ...(entry.body_tags  || []),
      ...(entry.mind_tags  || []),
      ...(entry.mood_tags  || []),
    ].join(', ')

    const userMsg = `The user logged this session: ${entry.product_name || 'unknown product'}${entry.category ? ', ' + entry.category : ''}${tags ? ', effects: ' + tags : ''}. Give a brief observation in your voice.`

    const messages = [{ role: 'user', content: userMsg }]

    async function loadObservation() {
      try {
        const { data, error } = await localStore.tools.run('guide-response', {
          body: { messages, guide: guideKey, entryCount: 5, tier: 1 },
        })
        if (error) throw error
        setText(data?.content || data?.response || '')
      } catch {
        setText('')
      } finally {
        setLoading(false)
      }
    }
    loadObservation()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!loading && !text) return null

  return (
    <div>
      <Divider />
      {guideName && (
        <p style={{ fontFamily: fontInter, fontSize: '11px', fontWeight: '600', color: accent, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 10px 0' }}>
          {guideName}
        </p>
      )}
      {loading ? (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '12px 16px', backgroundColor: S.surface, borderLeft: `3px solid ${accent}`, borderRadius: '0 10px 10px 10px' }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: accent, opacity: 0.7, display: 'inline-block', animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      ) : (
        <div style={{
          backgroundColor: S.surface, borderLeft: `3px solid ${accent}`,
          borderRadius: '0 10px 10px 10px', padding: '12px 16px',
          fontFamily: fontInter, fontSize: '15px', color: S.textPrimary,
          lineHeight: '1.65', whiteSpace: 'pre-line',
        }}>
          {text}
        </div>
      )}
    </div>
  )
}

export default function EntryDetail() {
  const navigate = useNavigate()
  const { id }   = useParams()

  const [entry,       setEntry]       = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [notFound,    setNotFound]    = useState(false)
  const [guideKey,    setGuideKey]    = useState('bud')
  const [deleting,    setDeleting]    = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    async function load() {
      if (isDevMode()) {
        setEntry(DEV_ENTRY)
        setGuideKey('sunny')
        setLoading(false)
        return
      }
      const [entryRes, profileRes] = await Promise.all([
        localStore.from('entries').select('*').eq('id', id).maybeSingle(),
        localStore.auth.getUser().then(({ data: { user } }) =>
          user ? localStore.from('user_profiles').select('guide_selected').eq('user_id', user.id).maybeSingle() : { data: null }
        ),
      ])
      if (!entryRes.data) { setNotFound(true); setLoading(false); return }
      setEntry(entryRes.data)
      if (profileRes.data?.guide_selected) setGuideKey(profileRes.data.guide_selected)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleDelete() {
    if (!window.confirm('Delete this entry? This cannot be undone.')) return
    setDeleting(true)
    setDeleteError('')
    if (!isDevMode()) {
      const { error } = await localStore.from('entries').delete().eq('id', id)
      if (error) { setDeleteError('Could not delete. Try again.'); setDeleting(false); return }
    }
    navigate('/journal', { replace: true })
  }

  const meta   = GUIDE_META[guideKey] || GUIDE_META.bud
  const accent = meta.accent

  if (loading) {
    return <div style={{ minHeight: '100dvh', backgroundColor: S.bg }} />
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: S.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <p style={{ fontFamily: fontInter, fontSize: '15px', color: S.textSecondary }}>Entry not found.</p>
      </div>
    )
  }

  const mood          = entry.mood_face ? MOOD_FACES[entry.mood_face] : null
  const allTags       = [...(entry.body_tags || []), ...(entry.mind_tags || []), ...(entry.mood_tags || [])]
  const hasCannabinoids = entry.cannabinoids && Object.keys(entry.cannabinoids).length > 0
  const hasTerpenes     = entry.terpenes     && Object.keys(entry.terpenes).length     > 0
  const hasDetails      = entry.category || entry.strain_type || entry.amount || entry.price
  const showGuideObs    = guideKey !== 'stoner' && guideKey !== 'unit' && guideKey !== 'tool'

  return (
    <>
      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.35; }
          40%            { transform: scale(1.2); opacity: 1; }
        }
      `}</style>

      <div style={{ minHeight: '100dvh', backgroundColor: S.bg, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>

        {/* Header */}
        <div style={{
          height: '56px', flexShrink: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', borderBottom: `1px solid ${S.border}`,
          position: 'relative', padding: '0 56px',
        }}>
          <button
            onClick={() => navigate('/journal')}
            style={{ position: 'absolute', left: '12px', width: '44px', height: '44px', background: 'none', border: 'none', cursor: 'pointer', color: S.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 style={{ fontFamily: fontPlayfair, fontSize: '20px', fontWeight: '600', color: S.textPrimary, margin: 0 }}>
            Entry
          </h1>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', boxSizing: 'border-box', maxWidth: '680px', width: '100%', margin: '0 auto' }}>

          {/* Product name + date */}
          <h2 style={{ fontFamily: fontPlayfair, fontSize: '24px', fontWeight: '700', color: S.textPrimary, margin: '0 0 6px 0', lineHeight: '1.2' }}>
            {entry.product_name || 'Unnamed entry'}
          </h2>
          <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, margin: '0 0 20px 0' }}>
            {formatEntryDate(entry.created_at)}
          </p>

          {/* Mood */}
          {mood && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <span style={{ fontSize: '48px', lineHeight: 1 }}>{mood.emoji}</span>
                <span style={{ fontFamily: fontInter, fontSize: '15px', color: S.textSecondary }}>{mood.label}</span>
              </div>
            </>
          )}

          {/* Dispensary */}
          {entry.dispensary_name && (
            <>
              <Divider />
              <SectionLabel>Dispensary</SectionLabel>
              <div style={{ backgroundColor: S.surface, borderLeft: `3px solid ${accent}`, borderRadius: '0 8px 8px 8px', padding: '12px 16px' }}>
                <p style={{ fontFamily: fontInter, fontSize: '15px', fontWeight: '700', color: S.textPrimary, margin: '0 0 4px 0' }}>
                  {entry.dispensary_name}
                </p>
              </div>
            </>
          )}

          {/* Details pills */}
          {hasDetails && (
            <>
              <Divider />
              <SectionLabel>Details</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {entry.category && (
                  <span style={{ height: '32px', padding: '0 12px', display: 'inline-flex', alignItems: 'center', backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: '9999px', fontFamily: fontInter, fontSize: '13px', color: S.textPrimary }}>
                    {entry.category}
                  </span>
                )}
                {entry.strain_type && (
                  <span style={{ height: '32px', padding: '0 12px', display: 'inline-flex', alignItems: 'center', backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: '9999px', fontFamily: fontInter, fontSize: '13px', color: S.textPrimary }}>
                    {entry.strain_type}
                  </span>
                )}
                {entry.amount && (
                  <span style={{ height: '32px', padding: '0 12px', display: 'inline-flex', alignItems: 'center', backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: '9999px', fontFamily: fontInter, fontSize: '13px', color: S.textPrimary }}>
                    {entry.amount}
                  </span>
                )}
                {entry.price != null && (
                  <span style={{ height: '32px', padding: '0 12px', display: 'inline-flex', alignItems: 'center', backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: '9999px', fontFamily: fontInter, fontSize: '13px', color: S.textPrimary }}>
                    ${Number(entry.price).toFixed(2)}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Effects tags */}
          {allTags.length > 0 && (
            <>
              <Divider />
              <SectionLabel>Effects</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', margin: '-3px' }}>
                {[...new Set(allTags)].map((tag) => (
                  <TagPill key={tag} text={tag} accent={accent} />
                ))}
              </div>
            </>
          )}

          {/* Cannabinoids */}
          {hasCannabinoids && (
            <>
              <Divider />
              <CollapsibleSection label="Cannabinoids">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingBottom: '4px' }}>
                  {Object.entries(entry.cannabinoids).map(([name, pct]) => (
                    <span key={name} style={{ height: '30px', padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: '9999px', fontFamily: fontInter, fontSize: '12px', color: S.textPrimary }}>
                      <span style={{ fontWeight: '600' }}>{name}</span>
                      {pct ? <span style={{ color: S.textSecondary }}>{pct}%</span> : null}
                    </span>
                  ))}
                </div>
              </CollapsibleSection>
            </>
          )}

          {/* Terpenes */}
          {hasTerpenes && (
            <>
              {!hasCannabinoids && <Divider />}
              <CollapsibleSection label="Terpenes">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingBottom: '4px' }}>
                  {Object.entries(entry.terpenes).map(([name, pct]) => (
                    <span key={name} style={{ height: '30px', padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: '9999px', fontFamily: fontInter, fontSize: '12px', color: S.textPrimary }}>
                      <span style={{ fontWeight: '600' }}>{name}</span>
                      {pct ? <span style={{ color: S.textSecondary }}>{pct}%</span> : null}
                    </span>
                  ))}
                </div>
              </CollapsibleSection>
            </>
          )}

          {/* Notes */}
          {entry.notes && (
            <>
              <Divider />
              <SectionLabel>Notes</SectionLabel>
              <p style={{ fontFamily: fontInter, fontSize: '15px', color: S.textPrimary, fontStyle: 'italic', lineHeight: '1.7', margin: 0 }}>
                {entry.notes}
              </p>
            </>
          )}

          {/* Guide observation */}
          {showGuideObs && (
            <GuideObservation
              entry={entry}
              guideKey={guideKey}
              accent={accent}
              guideName={meta.name}
            />
          )}

          {/* Delete error */}
          {deleteError && (
            <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.error, margin: '20px 0 0 0', textAlign: 'center' }}>
              {deleteError}
            </p>
          )}

          {/* Bottom spacer for fixed bar */}
          <div style={{ height: '120px' }} />
        </div>

        {/* Fixed bottom bar */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '12px 20px 24px', backgroundColor: S.bg,
          borderTop: `1px solid ${S.border}`, boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column', gap: '8px',
          maxWidth: '680px', margin: '0 auto',
        }}>
          <button
            onClick={() => navigate(`/entries/${id}/edit`)}
            style={{
              width: '100%', height: '52px',
              backgroundColor: 'transparent',
              color: S.textPrimary, border: `1px solid ${S.border}`,
              borderRadius: '10px', fontFamily: fontInter, fontSize: '15px',
              fontWeight: '600', cursor: 'pointer',
              transition: 'border-color 0.15s ease, background-color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.backgroundColor = `${accent}10` }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            Edit entry
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              background: 'none', border: 'none', cursor: deleting ? 'default' : 'pointer',
              fontFamily: fontInter, fontSize: '13px', color: S.error,
              padding: '4px', textAlign: 'center', opacity: deleting ? 0.5 : 1,
            }}
          >
            {deleting ? 'Deleting...' : 'Delete entry'}
          </button>
        </div>

      </div>
    </>
  )
}
