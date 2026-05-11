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

const GUIDE_META = {
  bud:   { name: 'Bud Tendar',     accent: '#C9A84C' },
  sunny: { name: 'Sunny Day',      accent: '#FF7F5C' },
  larry: { name: 'Lucky Larry',    accent: '#C17A3A' },
  herb:  { name: 'Herb N. Spices', accent: '#4ECDC4' },
  mary:  { name: 'Mary Jayne',     accent: '#B088B0' },
  unit:  { name: null,             accent: '#888888' },
  tool:  { name: null,             accent: '#C9A84C' },
}

const MOOD_FACES = [
  { value: 'good', label: 'Good', emoji: '😊', accentOverride: null },
  { value: 'meh',  label: 'Meh',  emoji: '😐', accentOverride: null },
  { value: 'off',  label: 'Off',  emoji: '😞', accentOverride: null },
  { value: 'eww',  label: 'Eww',  emoji: '🤢', accentOverride: '#4CAF50' },
]

function MoodFacePicker({ value, onChange, accent }) {
  const surface = '#1A2E1A'
  const border  = '#2D4A2D'
  const textSec = '#8FAF8F'
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
                border: `${selected ? '2px' : '1px'} solid ${selected ? faceColor : border}`,
                backgroundColor: selected ? `${faceColor}26` : surface,
                cursor: 'pointer', transition: 'all 0.15s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', lineHeight: 1,
              }}
            >
              {face.emoji}
            </button>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: textSec, textAlign: 'center' }}>
              {face.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const BODY_TAGS = ['Relaxed', 'Heavy', 'Floaty', 'Pain Relief', 'Energized', 'Tense', 'Numb', 'Tired']
const MIND_TAGS = ['Focused', 'Scattered', 'Creative', 'Anxious', 'Giggly', 'Clear', 'Racing', 'Foggy']
const MOOD_TAGS = ['Introspective', 'Disconnected', 'Time Is Different', 'Everything Is Funny', 'Universe Makes Sense']
const ALL_TAGS = [...BODY_TAGS, ...MIND_TAGS, ...MOOD_TAGS]

function TagPill({ label, selected, accent, onToggle, small }) {
  return (
    <button
      onClick={onToggle}
      style={{
        height: small ? '30px' : '36px',
        padding: `0 ${small ? '10px' : '14px'}`,
        borderRadius: '9999px',
        border: `1px solid ${selected ? accent : S.border}`,
        backgroundColor: selected ? `${accent}33` : S.surface,
        color: selected ? accent : S.textSecondary,
        fontFamily: fontInter,
        fontSize: small ? '12px' : '13px',
        fontWeight: selected ? '500' : '400',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
    </button>
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
    rec.interimResults = true
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
      const text = finalRef.current.trim()
      onFinalTranscript(text)
      // Auto-tag effect keywords
    }

    rec.onerror = () => { setListening(false); clearTimeout(silenceRef.current) }
    rec.start()
    setListening(true)
    silenceRef.current = setTimeout(() => rec.stop(), 12000)
  }, [supported, onFinalTranscript])

  useEffect(() => () => { clearTimeout(silenceRef.current); recRef.current?.stop() }, [])

  return { listening, supported, start, stop }
}

export default function CheckIn() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const entryId = searchParams.get('entryId')

  const [profile, setProfile] = useState(null)
  const [allTags, setAllTags] = useState([])
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [moodFace, setMoodFace] = useState(null)
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
  const guideName = guideKey === 'unit' ? (profile?.guide_name || 'UNIT') : meta.name

  function toggleTag(tag) {
    setAllTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  const handleVoiceFinal = useCallback((text) => {
    setVoiceTranscript((prev) => prev ? prev + ' ' + text : text)
    // Auto-highlight matching tags
    const lower = text.toLowerCase()
    const matched = ALL_TAGS.filter((t) => lower.includes(t.toLowerCase()))
    if (matched.length) {
      setAllTags((prev) => [...new Set([...prev, ...matched])])
    }
  }, [])

  const { listening, supported, start, stop } = useVoiceRecording({ onFinalTranscript: handleVoiceFinal })

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
          body_tags: allTags.filter((t) => BODY_TAGS.includes(t)),
          mind_tags: allTags.filter((t) => MIND_TAGS.includes(t)),
          mood_tags: allTags.filter((t) => MOOD_TAGS.includes(t)),
          voice_transcript: voiceTranscript || null,
          mood_face: moodFace || null,
          adverse_event_level: moodFace === 'eww' ? 1 : null,
          checkin_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId)
      if (error) { setSaveError('Could not save. Try again.'); setSaving(false); return }
    }

    setSaving(false)
    navigate(-1)
  }

  const bodySelected = allTags.filter((t) => BODY_TAGS.includes(t))
  const mindSelected = allTags.filter((t) => MIND_TAGS.includes(t))
  const moodSelected = allTags.filter((t) => MOOD_TAGS.includes(t))

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: S.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
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
            cursor: 'pointer', color: S.textSecondary, borderRadius: '8px',
            transition: 'color 0.15s ease', marginLeft: '-8px',
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

      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 20px 120px', boxSizing: 'border-box' }}>
        <h1 style={{
          fontFamily: fontPlayfair, fontSize: '24px', fontWeight: '600',
          color: S.textPrimary, margin: '0 0 28px 0', lineHeight: '1.2',
        }}>
          How is it going?
        </h1>

        {/* Two-panel layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '28px',
        }}>
          {/* Voice panel */}
          <div style={{
            backgroundColor: S.surface, border: `1px solid ${S.border}`,
            borderRadius: '12px', padding: '20px 16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          }}>
            <style>{`@keyframes ripple{0%{transform:scale(1);opacity:.5}100%{transform:scale(1.6);opacity:0}}`}</style>
            <div style={{ position: 'relative', width: '72px', height: '72px' }}>
              {listening && (
                <>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: accent, opacity: 0.18, animation: 'ripple 1.4s ease-out infinite' }} />
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: accent, opacity: 0.12, animation: 'ripple 1.4s ease-out .7s infinite' }} />
                </>
              )}
              <button
                onClick={listening ? stop : start}
                style={{
                  position: 'absolute', inset: 0, width: '72px', height: '72px',
                  borderRadius: '50%', backgroundColor: listening ? accent : S.surface,
                  border: `2px solid ${accent}`, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="3" width="6" height="12" rx="3" fill={listening ? S.bg : accent} />
                  <path d="M5 11a7 7 0 0014 0" stroke={listening ? S.bg : accent} strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 18v3M9 21h6" stroke={listening ? S.bg : accent} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, margin: 0, textAlign: 'center' }}>
              {supported ? (listening ? 'Listening...' : 'Just say it') : 'Not supported'}
            </p>
            {voiceTranscript && (
              <p style={{ fontFamily: fontInter, fontSize: '12px', color: S.textSecondary, margin: 0, lineHeight: '1.5', textAlign: 'center', opacity: 0.8 }}>
                {voiceTranscript.slice(0, 80)}{voiceTranscript.length > 80 ? '...' : ''}
              </p>
            )}
          </div>

          {/* Tags panel */}
          <div style={{
            backgroundColor: S.surface, border: `1px solid ${S.border}`,
            borderRadius: '12px', padding: '16px 12px',
            display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, margin: 0 }}>
              Tap what fits
            </p>
            {[
              { label: 'Body', tags: BODY_TAGS, selected: bodySelected },
              { label: 'Mind', tags: MIND_TAGS, selected: mindSelected },
              { label: 'Mood', tags: MOOD_TAGS, selected: moodSelected },
            ].map(({ label, tags, selected }) => (
              <div key={label}>
                <p style={{ fontFamily: fontInter, fontSize: '10px', color: accent, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px 0', fontWeight: '600' }}>
                  {label}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {tags.map((tag) => (
                    <TagPill key={tag} label={tag} selected={allTags.includes(tag)} accent={accent} onToggle={() => toggleTag(tag)} small />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected summary */}
        {allTags.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontFamily: fontInter, fontSize: '11px', color: S.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
              Selected
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {allTags.map((tag) => (
                <TagPill key={tag} label={tag} selected accent={accent} onToggle={() => toggleTag(tag)} />
              ))}
            </div>
          </div>
        )}

        {/* Mood face */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontFamily: fontInter, fontSize: '11px', color: S.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px 0' }}>
            How are you feeling?
          </p>
          <MoodFacePicker value={moodFace} onChange={setMoodFace} accent={accent} />
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: S.bg, borderTop: `1px solid ${S.border}`,
        padding: '16px 20px 32px', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        {saveError && (
          <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.error, margin: 0, textAlign: 'center' }}>
            {saveError}
          </p>
        )}
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
          {saving ? 'Saving...' : 'Save check-in'}
        </button>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none', fontFamily: fontInter,
            fontSize: '14px', color: S.textSecondary, cursor: 'pointer', padding: '8px',
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
