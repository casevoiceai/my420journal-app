import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

const GUIDE_META = {
  bud:   { name: 'Bud Tendar',     accent: '#C9A84C', notePrompt: 'Worth noting for next time?' },
  sunny: { name: 'Sunny Day',      accent: '#FF7F5C', notePrompt: 'Tell me how it really went...' },
  larry: { name: 'Lucky Larry',    accent: '#C17A3A', notePrompt: 'Anything worth remembering?' },
  herb:  { name: 'Herb N. Spices', accent: '#4ECDC4', notePrompt: 'Observations?' },
  mary:  { name: 'Mary Jayne',     accent: '#B088B0', notePrompt: 'How do you feel now, honestly?' },
  unit:  { name: null,             accent: '#888888', notePrompt: 'Notes.' },
  tool:  { name: null,             accent: '#C9A84C', notePrompt: 'Notes.' },
}

const SIDE_EFFECT_TAGS = ['Headache', 'Dry Mouth', 'Anxious', 'Paranoid', 'Nausea', 'Dizzy', 'Racing Heart', 'Other']

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
        const faceColor = face.accentOverride || accent
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

function FieldLabel({ children, sub }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <p style={{
        fontFamily: fontInter, fontSize: '13px', color: S.textSecondary,
        margin: 0, fontWeight: '400',
      }}>
        {children}
      </p>
      {sub && (
        <p style={{ fontFamily: fontInter, fontSize: '11px', color: S.textSecondary, margin: '2px 0 0 0', opacity: 0.7 }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function RatingRow({ label, sub, value, onChange, accent }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <FieldLabel sub={sub}>{label}</FieldLabel>
      <div style={{ display: 'flex', gap: '10px' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(value === n ? null : n)}
            style={{
              width: '60px', height: '60px', borderRadius: '50%',
              border: `2px solid ${value === n ? accent : S.border}`,
              backgroundColor: value === n ? accent : S.surface,
              color: value === n ? S.bg : S.textSecondary,
              fontFamily: fontInter, fontSize: '18px', fontWeight: '600',
              cursor: 'pointer', transition: 'all 0.15s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function useVoiceRecording({ onFinalTranscript }) {
  const recRef = useRef(null)
  const silenceRef = useRef(null)
  const finalRef = useRef('')
  const [listening, setListening] = useState(false)
  const [supported] = useState(() =>
    typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  )

  const stop = useCallback(() => { clearTimeout(silenceRef.current); recRef.current?.stop() }, [])

  const start = useCallback(() => {
    if (!supported) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-US'
    recRef.current = rec
    finalRef.current = ''

    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalRef.current += e.results[i][0].transcript + ' '
      }
      clearTimeout(silenceRef.current)
      silenceRef.current = setTimeout(() => rec.stop(), 2500)
    }

    rec.onend = () => {
      setListening(false)
      clearTimeout(silenceRef.current)
      onFinalTranscript(finalRef.current.trim())
    }

    rec.onerror = () => { setListening(false); clearTimeout(silenceRef.current) }
    rec.start()
    setListening(true)
    silenceRef.current = setTimeout(() => rec.stop(), 12000)
  }, [supported, onFinalTranscript])

  useEffect(() => () => { clearTimeout(silenceRef.current); recRef.current?.stop() }, [])

  return { listening, supported, start, stop }
}

export default function PostUseUpdate() {
  const navigate = useNavigate()
  const { entryId } = useParams()

  const [profile, setProfile] = useState(null)
  const [rating, setRating] = useState(null)
  const [sleepQuality, setSleepQuality] = useState(null)
  const [moodFace, setMoodFace] = useState(null)
  const [hasSideEffects, setHasSideEffects] = useState(null)
  const [sideEffects, setSideEffects] = useState([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (isDevMode()) {
      setProfile({ guide_selected: 'sunny' })
      return
    }
    async function load() {
      const { data: { user } } = await localStore.auth.getUser()
      if (!user) return
      const { data } = await localStore
        .from('user_profiles')
        .select('guide_selected, guide_name')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) setProfile(data)
    }
    load()
  }, [])

  const guideKey = profile?.guide_selected || 'bud'
  const meta = GUIDE_META[guideKey] || GUIDE_META.bud
  const accent = meta.accent
  const notePrompt = meta.notePrompt
  const guideName = guideKey === 'unit' ? (profile?.guide_name || 'UNIT') : meta.name

  function toggleSideEffect(tag) {
    setSideEffects((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  const handleNoteFinal = useCallback((text) => {
    if (text) setNotes((prev) => prev ? prev + ' ' + text : text)
  }, [])
  const { listening: noteListening, supported: voiceSupported, start: startNote, stop: stopNote } = useVoiceRecording({
    onFinalTranscript: handleNoteFinal,
  })

  async function handleSave() {
    setSaveError('')
    setSaving(true)

    if (isDevMode()) {
      setSaving(false)
      navigate(-1)
      return
    }

    if (entryId) {
      const { error } = await localStore
        .from('entries')
        .update({
          rating: rating || null,
          sleep_quality: sleepQuality || null,
          mood_face: moodFace || null,
          adverse_event_level: moodFace === 'eww' ? 1 : null,
          side_effects: hasSideEffects ? sideEffects : [],
          notes: notes || null,
          update_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId)

      if (error) { setSaveError('Could not save. Try again.'); setSaving(false); return }
    }

    setSaving(false)
    navigate(-1)
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: S.bg, boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '0 20px',
        height: '56px', borderBottom: `1px solid ${S.border}`,
        position: 'sticky', top: 0, backgroundColor: S.bg, zIndex: 10,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: '40px', height: '40px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'none', border: 'none',
            cursor: 'pointer', color: S.textSecondary, borderRadius: '8px', transition: 'color 0.15s ease', marginLeft: '-8px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {guideName && (
          <p style={{ fontFamily: fontInter, fontSize: '12px', color: accent, margin: '0 0 0 8px', fontWeight: '500', letterSpacing: '0.04em' }}>
            {guideName}
          </p>
        )}
      </div>

      <div style={{ padding: '28px 20px 120px', boxSizing: 'border-box', maxWidth: '520px', margin: '0 auto' }}>
        <h1 style={{
          fontFamily: fontPlayfair, fontSize: '24px', fontWeight: '600',
          color: S.textPrimary, margin: '0 0 32px 0', lineHeight: '1.2',
        }}>
          How did it go?
        </h1>

        {/* Overall rating */}
        <RatingRow
          label="Overall"
          value={rating}
          onChange={setRating}
          accent={accent}
        />

        {/* Sleep quality */}
        <RatingRow
          label="Sleep after"
          sub="Night after this session"
          value={sleepQuality}
          onChange={setSleepQuality}
          accent={accent}
        />

        {/* Mood face */}
        <div style={{ marginBottom: '24px' }}>
          <FieldLabel>How are you feeling?</FieldLabel>
          <MoodFacePicker value={moodFace} onChange={setMoodFace} accent={accent} />
        </div>

        {/* Side effects */}
        <div style={{ marginBottom: '24px' }}>
          <FieldLabel>Any side effects?</FieldLabel>
          <div style={{ display: 'flex', gap: '10px', marginBottom: hasSideEffects ? '16px' : '0' }}>
            {[{ label: 'Yes', val: true }, { label: 'No', val: false }].map(({ label, val }) => (
              <button
                key={label}
                onClick={() => setHasSideEffects(val)}
                style={{
                  height: '48px', flex: 1, borderRadius: '10px',
                  border: `1px solid ${hasSideEffects === val ? accent : S.border}`,
                  backgroundColor: hasSideEffects === val ? `${accent}33` : S.surface,
                  color: hasSideEffects === val ? accent : S.textSecondary,
                  fontFamily: fontInter, fontSize: '15px', fontWeight: hasSideEffects === val ? '600' : '400',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {hasSideEffects && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SIDE_EFFECT_TAGS.map((tag) => {
                const sel = sideEffects.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => toggleSideEffect(tag)}
                    style={{
                      height: '36px', padding: '0 14px', borderRadius: '9999px',
                      border: `1px solid ${sel ? S.error : S.border}`,
                      backgroundColor: sel ? `${S.error}22` : S.surface,
                      color: sel ? S.error : S.textSecondary,
                      fontFamily: fontInter, fontSize: '13px', fontWeight: sel ? '500' : '400',
                      cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                    }}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '24px' }}>
          <FieldLabel>Notes</FieldLabel>
          <div style={{ position: 'relative' }}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={notePrompt}
              rows={5}
              style={{
                width: '100%', backgroundColor: S.surface, border: `1px solid ${S.border}`,
                borderRadius: '8px', padding: '12px 48px 12px 14px', fontFamily: fontInter,
                fontSize: '15px', color: S.textPrimary, outline: 'none', resize: 'vertical',
                lineHeight: '1.6', boxSizing: 'border-box', transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = accent }}
              onBlur={(e) => { e.currentTarget.style.borderColor = S.border }}
            />
            {voiceSupported && (
              <button
                onMouseDown={(e) => { e.preventDefault(); noteListening ? stopNote() : startNote() }}
                style={{
                  position: 'absolute', top: '10px', right: '10px',
                  width: '32px', height: '32px', borderRadius: '50%',
                  backgroundColor: noteListening ? accent : S.surface,
                  border: `1px solid ${noteListening ? accent : S.border}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="3" width="6" height="12" rx="3" fill={noteListening ? S.bg : S.textSecondary} />
                  <path d="M5 11a7 7 0 0014 0" stroke={noteListening ? S.bg : S.textSecondary} strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 18v3M9 21h6" stroke={noteListening ? S.bg : S.textSecondary} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {saveError && (
          <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.error, margin: '0 0 16px 0', lineHeight: '1.5' }}>
            {saveError}
          </p>
        )}
      </div>

      {/* Fixed bottom */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: S.bg, borderTop: `1px solid ${S.border}`,
        padding: '16px 20px 32px', boxSizing: 'border-box',
      }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', height: '56px', backgroundColor: saving ? '#5A4A20' : S.gold,
            color: saving ? '#4A3A10' : S.bg, border: 'none', borderRadius: '10px',
            fontFamily: fontInter, fontSize: '15px', fontWeight: '700',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Complete entry'}
        </button>
      </div>
    </div>
  )
}
