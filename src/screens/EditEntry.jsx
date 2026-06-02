import { useState, useEffect, useCallback, useRef } from 'react'
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

const GUIDE_ACCENTS = {
  bud: '#C9A84C', sunny: '#FF7F5C', larry: '#C17A3A',
  herb: '#4ECDC4', mary: '#B088B0', stoner: '#C9A84C',
  unit: '#888888', tool: '#C9A84C',
}

const CATEGORIES        = ['Flower', 'Vape', 'Extract', 'Orally Administered', 'Tinctures', 'Topicals']
const STRAIN_TYPES      = ['Indica', 'Sativa', 'Hybrid', 'CBD', 'N/A']
const CATEGORIES_WITH_STRAIN = ['Flower', 'Vape', 'Extract']

const BODY_TAGS  = ['Relaxed', 'Tingly', 'Floaty', 'Sleepy', 'Energetic', 'Numb', 'Heavy', 'Pain Relief']
const MIND_TAGS  = ['Creative', 'Focused', 'Foggy', 'Scattered', 'Introspective', 'Clear', 'Giggly', 'Paranoid']
const MOOD_TAGS  = ['Happy', 'Uplifted', 'Calm', 'Anxious', 'Motivated', 'Disconnected', 'Content', 'Irritable']
const MOOD_FACES = ['good', 'meh', 'off', 'eww']
const MOOD_EMOJI = { good: '😊', meh: '😐', off: '😞', eww: '🤢' }

const AMOUNT_OPTIONS = {
  Flower:                ['0.3g', '0.5g', '1g', '2g', '3g', '3.5g', '7g', '14g', '28g'],
  Extract:               ['0.3g', '0.5g', '1g', '2g', '3g', '3.5g', '7g', '14g', '28g'],
  Vape:                  ['0.3g', '0.5g', '1g disposable pen', '0.5g cartridge', '1g cartridge'],
  'Orally Administered': ['1 piece', '2 pieces', '5mg', '10mg', '25mg', '50mg', '100mg'],
  Tinctures:             ['1ml', '2.5ml', '5ml', '10ml', '30ml'],
  _default:              ['1 piece', '5mg', '10mg', '25mg', '50mg', '100mg', '1ml'],
}

function FieldLabel({ children }) {
  return (
    <p style={{
      fontFamily: fontInter, fontSize: '11px', fontWeight: '600',
      color: S.textSecondary, letterSpacing: '0.08em',
      textTransform: 'uppercase', margin: '0 0 8px 0',
    }}>
      {children}
    </p>
  )
}

function TagPill({ label, selected, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: '34px', padding: '0 14px',
        borderRadius: '9999px',
        border: `1px solid ${selected ? accent : S.border}`,
        backgroundColor: selected ? `${accent}22` : S.surface,
        color: selected ? accent : S.textSecondary,
        fontFamily: fontInter, fontSize: '13px', fontWeight: selected ? '600' : '400',
        cursor: 'pointer', transition: 'all 0.12s ease', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

function useVoiceInput({ onResult }) {
  const recRef     = useRef(null)
  const silenceRef = useRef(null)
  const finalRef   = useRef('')
  const [listening, setListening] = useState(false)
  const [supported] = useState(() =>
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  )
  const stop = useCallback(() => { clearTimeout(silenceRef.current); recRef.current?.stop() }, [])
  const start = useCallback(() => {
    if (!supported) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.continuous = true; rec.interimResults = false; rec.lang = 'en-US'
    recRef.current = rec; finalRef.current = ''
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalRef.current += e.results[i][0].transcript + ' '
      }
      clearTimeout(silenceRef.current)
      silenceRef.current = setTimeout(() => rec.stop(), 2500)
    }
    rec.onend = () => { setListening(false); clearTimeout(silenceRef.current); onResult(finalRef.current.trim()) }
    rec.onerror = () => { setListening(false); clearTimeout(silenceRef.current) }
    rec.start(); setListening(true)
    silenceRef.current = setTimeout(() => rec.stop(), 30000)
  }, [supported, onResult])
  useEffect(() => () => { clearTimeout(silenceRef.current); recRef.current?.stop() }, [])
  return { listening, supported, start, stop }
}

const DEV_ENTRY = {
  id: 'dev-edit-001',
  product_name: 'Blue Dream',
  category: 'Flower',
  strain_type: 'Hybrid',
  amount: '1g',
  price: '12.00',
  body_tags: ['Relaxed'],
  mind_tags: ['Creative'],
  mood_tags: ['Happy'],
  mood_face: 'good',
  notes: 'Really smooth.',
  cannabinoids: {},
  terpenes: {},
}

export default function EditEntry() {
  const navigate = useNavigate()
  const { id }   = useParams()

  const [loading,     setLoading]     = useState(true)
  const [accent,      setAccent]      = useState(S.gold)
  const [saving,      setSaving]      = useState(false)
  const [saveError,   setSaveError]   = useState('')

  const [productName, setProductName] = useState('')
  const [category,    setCategory]    = useState('')
  const [strainType,  setStrainType]  = useState('')
  const [amount,      setAmount]      = useState('')
  const [price,       setPrice]       = useState('')
  const [notes,       setNotes]       = useState('')
  const [bodyTags,    setBodyTags]    = useState([])
  const [mindTags,    setMindTags]    = useState([])
  const [moodTags,    setMoodTags]    = useState([])
  const [moodFace,    setMoodFace]    = useState(null)
  const [dispensaryName, setDispensaryName] = useState(null)
  const [dispensaryPlaceId, setDispensaryPlaceId] = useState(null)
  const [dispensaryAddress, setDispensaryAddress] = useState(null)
  const [dispensaryPhone, setDispensaryPhone] = useState(null)
  const [dispensaryHours, setDispensaryHours] = useState(null)
  const [dispensaryMapsUrl, setDispensaryMapsUrl] = useState(null)
  const [dispensaryLat, setDispensaryLat] = useState(null)
  const [dispensaryLng, setDispensaryLng] = useState(null)
  const [moodCustom, setMoodCustom] = useState(null)
  const [cannabinoids, setCannabinoids] = useState(null)
  const [terpenes, setTerpenes] = useState(null)
  const [terpenesAiSuggested, setTerpenesAiSuggested] = useState(null)
  const [voiceTranscript, setVoiceTranscript] = useState(null)
  const [captureMode, setCaptureMode] = useState(null)

  useEffect(() => {
    async function load() {
      let entry = null
      let guideKey = 'bud'

      if (isDevMode()) {
        entry    = DEV_ENTRY
        guideKey = 'sunny'
      } else {
        const { data: { user } } = await localStore.auth.getUser()
        if (!user) { setLoading(false); return }
        const [entryRes, profileRes] = await Promise.all([
          localStore.from('entries').select('*').eq('id', id).maybeSingle(),
          localStore.from('user_profiles').select('guide_selected').eq('user_id', user.id).maybeSingle(),
        ])
        if (!entryRes.data) { setLoading(false); return }
        entry    = entryRes.data
        guideKey = profileRes.data?.guide_selected || 'bud'
      }

      setAccent(GUIDE_ACCENTS[guideKey] || S.gold)
      setProductName(entry.product_name || '')
      setCategory(entry.category || '')
      setStrainType(entry.strain_type || '')
      setAmount(entry.amount || '')
      setPrice(entry.price != null ? String(entry.price) : '')
      setNotes(entry.notes || '')
      setBodyTags(entry.body_tags || [])
      setMindTags(entry.mind_tags || [])
      setMoodTags(entry.mood_tags || [])
      setMoodFace(entry.mood_face || null)
      setDispensaryName(entry.dispensary_name || null)
      setDispensaryPlaceId(entry.dispensary_place_id || null)
      setDispensaryAddress(entry.dispensary_address || null)
      setDispensaryPhone(entry.dispensary_phone || null)
      setDispensaryHours(entry.dispensary_hours || null)
      setDispensaryMapsUrl(entry.dispensary_maps_url || null)
      setDispensaryLat(entry.dispensary_lat ?? null)
      setDispensaryLng(entry.dispensary_lng ?? null)
      setMoodCustom(entry.mood_custom || null)
      setCannabinoids(entry.cannabinoids || null)
      setTerpenes(entry.terpenes || null)
      setTerpenesAiSuggested(entry.terpenes_ai_suggested || null)
      setVoiceTranscript(entry.voice_transcript || null)
      setCaptureMode(entry.capture_mode || null)
      setLoading(false)
    }
    load()
  }, [id])

  function toggle(arr, setter, tag) {
    setter(arr.includes(tag) ? arr.filter((t) => t !== tag) : [...arr, tag])
  }

  const handleNoteVoice = useCallback((text) => {
    if (text) setNotes((prev) => prev ? prev + ' ' + text : text)
  }, [])
  const { listening: noteListening, supported: voiceSupported, start: startNote, stop: stopNote } =
    useVoiceInput({ onResult: handleNoteVoice })

  async function handleSave() {
    if (!productName.trim()) { setSaveError('Product name is required.'); return }
    setSaveError(''); setSaving(true)

    const { error } = await localStore.from('entries').update({
      product_name: productName.trim(),
      category:     category || null,
      strain_type:  CATEGORIES_WITH_STRAIN.includes(category) ? strainType || null : null,
      amount:       amount || null,
      price:        price ? parseFloat(price) : null,
      notes:        notes || null,
      body_tags:    bodyTags,
      mind_tags:    mindTags,
      mood_tags:    moodTags,
      mood_face:    moodFace || null,
      dispensary_name:      dispensaryName,
      dispensary_place_id:  dispensaryPlaceId,
      dispensary_address:   dispensaryAddress,
      dispensary_phone:     dispensaryPhone,
      dispensary_hours:     dispensaryHours,
      dispensary_maps_url:  dispensaryMapsUrl,
      dispensary_lat:       dispensaryLat,
      dispensary_lng:       dispensaryLng,
      mood_custom:          moodCustom,
      cannabinoids:         cannabinoids,
      terpenes:             terpenes,
      terpenes_ai_suggested: terpenesAiSuggested,
      voice_transcript:     voiceTranscript,
      capture_mode:         captureMode,
      adverse_event_level: moodFace === 'eww' ? 1 : null,
      updated_at:   new Date().toISOString(),
    }).eq('id', id)

    setSaving(false)
    if (error) {
      if (isDevMode()) { console.error('Dev save error:', error) }
      else { setSaveError('Could not save. Try again.'); return }
    }
    navigate(`/entries/${id}`, { replace: true })
  }

  if (loading) {
    return <div style={{ minHeight: '100dvh', backgroundColor: S.bg }} />
  }

  const amountOptions = AMOUNT_OPTIONS[category] || AMOUNT_OPTIONS._default

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: S.bg, boxSizing: 'border-box', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, backgroundColor: S.bg,
        borderBottom: `1px solid ${S.border}`, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '56px', padding: '0 56px', boxSizing: 'border-box',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ position: 'absolute', left: '12px', width: '44px', height: '44px', background: 'none', border: 'none', cursor: 'pointer', color: S.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 style={{ fontFamily: fontPlayfair, fontSize: '20px', fontWeight: '600', color: S.textPrimary, margin: 0 }}>
          Edit Entry
        </h1>
      </div>

      {/* Form */}
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Product name */}
        <div>
          <FieldLabel>Product Name</FieldLabel>
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. Blue Dream..."
            spellCheck={true}
            autoCorrect="on"
            style={{
              width: '100%', height: '52px', backgroundColor: S.surface,
              border: `1px solid ${S.border}`, borderRadius: '8px',
              padding: '0 16px', fontFamily: fontInter, fontSize: '16px',
              color: S.textPrimary, outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = accent }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = S.border }}
          />
        </div>

        {/* Category */}
        <div>
          <FieldLabel>Category</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {CATEGORIES.map((c) => (
              <TagPill key={c} label={c} selected={category === c} accent={accent}
                onClick={() => setCategory(category === c ? '' : c)} />
            ))}
          </div>
        </div>

        {/* Strain type (conditional) */}
        {CATEGORIES_WITH_STRAIN.includes(category) && (
          <div>
            <FieldLabel>Strain Type</FieldLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {STRAIN_TYPES.map((s) => (
                <TagPill key={s} label={s} selected={strainType === s} accent={accent}
                  onClick={() => setStrainType(strainType === s ? '' : s)} />
              ))}
            </div>
          </div>
        )}

        {/* Amount */}
        <div>
          <FieldLabel>Amount</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
            {amountOptions.map((a) => (
              <TagPill key={a} label={a} selected={amount === a} accent={accent}
                onClick={() => setAmount(amount === a ? '' : a)} />
            ))}
          </div>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Or type custom amount..."
            spellCheck={false}
            style={{
              width: '100%', height: '44px', backgroundColor: S.surface,
              border: `1px solid ${S.border}`, borderRadius: '8px',
              padding: '0 14px', fontFamily: fontInter, fontSize: '14px',
              color: S.textPrimary, outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = accent }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = S.border }}
          />
        </div>

        {/* Price */}
        <div>
          <FieldLabel>Price ($)</FieldLabel>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            type="number"
            inputMode="decimal"
            style={{
              width: '100%', height: '44px', backgroundColor: S.surface,
              border: `1px solid ${S.border}`, borderRadius: '8px',
              padding: '0 14px', fontFamily: fontInter, fontSize: '14px',
              color: S.textPrimary, outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = accent }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = S.border }}
          />
        </div>

        {/* Body tags */}
        <div>
          <FieldLabel>Body</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {BODY_TAGS.map((t) => (
              <TagPill key={t} label={t} selected={bodyTags.includes(t)} accent={accent}
                onClick={() => toggle(bodyTags, setBodyTags, t)} />
            ))}
          </div>
        </div>

        {/* Mind tags */}
        <div>
          <FieldLabel>Mind</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {MIND_TAGS.map((t) => (
              <TagPill key={t} label={t} selected={mindTags.includes(t)} accent={accent}
                onClick={() => toggle(mindTags, setMindTags, t)} />
            ))}
          </div>
        </div>

        {/* Mood tags */}
        <div>
          <FieldLabel>Mood</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {MOOD_TAGS.map((t) => (
              <TagPill key={t} label={t} selected={moodTags.includes(t)} accent={accent}
                onClick={() => toggle(moodTags, setMoodTags, t)} />
            ))}
          </div>
        </div>

        {/* Mood face */}
        <div>
          <FieldLabel>How was it?</FieldLabel>
          <div style={{ display: 'flex', gap: '12px' }}>
            {MOOD_FACES.map((m) => (
              <button
                key={m}
                onClick={() => setMoodFace(moodFace === m ? null : m)}
                style={{
                  flex: 1, height: '60px', borderRadius: '12px',
                  border: `${moodFace === m ? '2px' : '1px'} solid ${moodFace === m ? accent : S.border}`,
                  backgroundColor: moodFace === m ? `${accent}20` : S.surface,
                  cursor: 'pointer', fontSize: '28px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.12s ease',
                }}
              >
                {MOOD_EMOJI[m]}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <FieldLabel>Notes</FieldLabel>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything to note..."
            rows={4}
            spellCheck={true}
            autoCorrect="on"
            style={{
              width: '100%', backgroundColor: S.surface,
              border: `1px solid ${S.border}`, borderRadius: '8px',
              padding: '12px 14px', fontFamily: fontInter, fontSize: '15px',
              color: S.textPrimary, outline: 'none', resize: 'vertical',
              lineHeight: '1.6', boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = accent }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = S.border }}
          />
          {voiceSupported && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              <button
                onMouseDown={(e) => { e.preventDefault(); noteListening ? stopNote() : startNote() }}
                style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  backgroundColor: accent, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  opacity: noteListening ? 1 : 0.85,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="3" width="6" height="12" rx="3" fill="white" />
                  <path d="M5 11a7 7 0 0014 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 18v3M9 21h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {saveError && (
          <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.error, margin: 0 }}>
            {saveError}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', height: '56px',
            backgroundColor: saving ? `${accent}60` : accent,
            color: S.bg, border: 'none', borderRadius: '10px',
            fontFamily: fontInter, fontSize: '15px', fontWeight: '700',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s ease',
          }}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>

      </div>
    </div>
  )
}
