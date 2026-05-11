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

const QUALITY_OPTIONS = [
  { value: 1, label: 'Too Little'     },
  { value: 2, label: 'Not Enough'     },
  { value: 3, label: 'Okay'           },
  { value: 4, label: 'Good'           },
  { value: 5, label: 'Great'          },
  { value: 6, label: 'Too Much'       },
  { value: 7, label: 'Could Not Sleep'},
]

const SLEEP_ICONS = { sleep_start: '🌙', sleep_end: '☀️', nap: '😴' }

const DEV_ENTRY = {
  id: 'dev-sleep-001',
  entry_type: 'sleep_start',
  product_name: 'Sleep Start',
  notes: 'good night',
  sleep_quality: null,
  voice_transcript: null,
  created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
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

function MicButton({ listening, accent, onMouseDown }) {
  return (
    <button
      onMouseDown={onMouseDown}
      style={{
        width: '52px', height: '52px', borderRadius: '50%',
        backgroundColor: accent, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        opacity: listening ? 1 : 0.85,
        transition: 'opacity 0.15s ease',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="9" y="3" width="6" height="12" rx="3" fill="white" />
        <path d="M5 11a7 7 0 0014 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 18v3M9 21h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
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

function TimeCapture({ label, value, onChange, optional = false, noRightNow = false }) {
  const [showPicker, setShowPicker] = useState(false)

  function captureNow() {
    onChange(new Date().toISOString())
    setShowPicker(false)
  }

  function handleTimeInput(e) {
    const timeStr = e.target.value
    if (!timeStr) { onChange(null); return }
    const [hh, mm] = timeStr.split(':').map(Number)
    const d = new Date()
    d.setHours(hh, mm, 0, 0)
    if (d > new Date()) d.setDate(d.getDate() - 1)
    onChange(d.toISOString())
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div>
      <p style={{
        fontFamily: fontInter, fontSize: '12px', fontWeight: '500',
        color: S.textSecondary, margin: '0 0 8px 0',
      }}>
        {label}{optional ? <span style={{ opacity: 0.5 }}> — optional</span> : null}
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        {!noRightNow && (
          <button
            onClick={captureNow}
            style={{
              flex: 1, height: '52px',
              backgroundColor: S.surface,
              border: `1px solid ${S.gold}`,
              borderRadius: '10px',
              fontFamily: fontInter, fontSize: '14px', fontWeight: '500',
              color: S.gold, cursor: 'pointer',
              transition: 'background-color 0.12s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${S.gold}15` }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = S.surface }}
          >
            Right now
          </button>
        )}
        <button
          onClick={() => setShowPicker((p) => !p)}
          style={{
            flex: 1, height: '52px',
            backgroundColor: showPicker ? `${S.gold}15` : S.surface,
            border: `1px solid ${S.gold}`,
            borderRadius: '10px',
            fontFamily: fontInter, fontSize: '14px', fontWeight: '500',
            color: S.gold, cursor: 'pointer',
            transition: 'background-color 0.12s ease',
          }}
        >
          Enter a time
        </button>
      </div>
      {showPicker && (
        <input
          type="time"
          onChange={handleTimeInput}
          style={{
            marginTop: '8px', width: '100%', height: '48px',
            backgroundColor: S.surface, border: `1px solid ${S.border}`,
            borderRadius: '8px', padding: '0 14px',
            fontFamily: fontInter, fontSize: '16px', color: S.textPrimary,
            outline: 'none', boxSizing: 'border-box',
            colorScheme: 'dark',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = S.gold }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = S.border }}
        />
      )}
      {value && (
        <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.gold, margin: '6px 0 0 2px', fontWeight: '500' }}>
          {formatTime(value)}
        </p>
      )}
    </div>
  )
}

export default function SleepEntryDetail() {
  const navigate = useNavigate()
  const { id }   = useParams()

  const [loading,   setLoading]   = useState(true)
  const [entry,     setEntry]     = useState(null)
  const [quality,   setQuality]   = useState(null)
  const [dreams,    setDreams]    = useState('')
  const [notes,     setNotes]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState('')

  // Too Much fields
  const [tooMuchHours,   setTooMuchHours]   = useState('')
  const [tooMuchFeeling, setTooMuchFeeling] = useState('')

  // Could Not Sleep fields
  const [layDownTime,      setLayDownTime]      = useState(null)
  const [lastSawClockTime, setLastSawClockTime] = useState(null)
  const [cantSleepNotes,   setCantSleepNotes]   = useState('')

  const accent = S.gold

  useEffect(() => {
    async function load() {
      if (isDevMode()) {
        setEntry(DEV_ENTRY)
        setLoading(false)
        return
      }
      const { data } = await localStore.from('entries').select('*').eq('id', id).maybeSingle()
      if (data) {
        setEntry(data)
        setQuality(data.sleep_quality || null)
        setNotes(data.notes || '')
        setDreams(data.voice_transcript || '')
      }
      setLoading(false)
    }
    load()
  }, [id])

  const handleDreamsVoice      = useCallback((t) => { if (t) setDreams((p) => p ? p + ' ' + t : t) }, [])
  const handleNotesVoice       = useCallback((t) => { if (t) setNotes((p) => p ? p + ' ' + t : t) }, [])
  const handleFeelingVoice     = useCallback((t) => { if (t) setTooMuchFeeling((p) => p ? p + ' ' + t : t) }, [])
  const handleCantSleepVoice   = useCallback((t) => { if (t) setCantSleepNotes((p) => p ? p + ' ' + t : t) }, [])

  const { listening: dreamsListening,    supported: voiceSupported, start: startDreams,    stop: stopDreams    } = useVoiceInput({ onResult: handleDreamsVoice })
  const { listening: notesListening,     start: startNotes,     stop: stopNotes     } = useVoiceInput({ onResult: handleNotesVoice })
  const { listening: feelingListening,   start: startFeeling,   stop: stopFeeling   } = useVoiceInput({ onResult: handleFeelingVoice })
  const { listening: cantSleepListening, start: startCantSleep, stop: stopCantSleep } = useVoiceInput({ onResult: handleCantSleepVoice })

  function buildNotesForSave() {
    const parts = []
    if (notes) parts.push(notes)
    if (quality === 6 && tooMuchHours)   parts.push(`Hours over: ${tooMuchHours}`)
    if (quality === 6 && tooMuchFeeling) parts.push(`Feeling: ${tooMuchFeeling}`)
    if (quality === 7) {
      if (layDownTime)      parts.push(`Laid down: ${new Date(layDownTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`)
      if (lastSawClockTime) parts.push(`Last saw clock: ${new Date(lastSawClockTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`)
      if (cantSleepNotes)   parts.push(cantSleepNotes)
    }
    return parts.join('\n') || null
  }

  async function handleSave() {
    setSaveError(''); setSaving(true)
    const { error } = await localStore.from('entries').update({
      sleep_quality:    quality || null,
      voice_transcript: dreams || null,
      notes:            buildNotesForSave(),
      updated_at:       new Date().toISOString(),
    }).eq('id', id)
    setSaving(false)
    if (error) {
      if (isDevMode()) { console.error('Dev save error:', error) }
      else { setSaveError('Could not save. Try again.'); return }
    }
    navigate('/journal', { replace: true })
  }

  if (loading) return <div style={{ minHeight: '100dvh', backgroundColor: S.bg }} />

  if (!entry) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: S.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: fontInter, fontSize: '15px', color: S.textSecondary }}>Entry not found.</p>
      </div>
    )
  }

  const icon      = SLEEP_ICONS[entry.entry_type] || '🌙'
  const typeLabel = entry.entry_type === 'sleep_start' ? 'Sleep Start'
    : entry.entry_type === 'sleep_end' ? 'Sleep End'
    : 'Nap'

  const formattedDate = new Date(entry.created_at).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  }) + ' at ' + new Date(entry.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: S.bg, boxSizing: 'border-box', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{
        height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: `1px solid ${S.border}`, position: 'sticky', top: 0,
        backgroundColor: S.bg, zIndex: 10, padding: '0 56px',
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
          Sleep Log
        </h1>
      </div>

      <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '480px', margin: '0 auto' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', lineHeight: 1, marginBottom: '12px' }}>{icon}</div>
          <p style={{ fontFamily: fontInter, fontSize: '13px', fontWeight: '600', color: S.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
            {typeLabel}
          </p>
          <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, margin: 0 }}>
            {formattedDate}
          </p>
        </div>

        {/* Sleep quality */}
        <div>
          <SectionLabel>How was it?</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {QUALITY_OPTIONS.map((opt) => {
              const sel = quality === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setQuality(sel ? null : opt.value)}
                  style={{
                    width: '100%', height: '52px',
                    backgroundColor: sel ? `${S.gold}22` : S.surface,
                    border: `1px solid ${sel ? S.gold : S.border}`,
                    borderRadius: '10px',
                    fontFamily: fontInter, fontSize: '15px', fontWeight: sel ? '600' : '400',
                    color: sel ? S.gold : S.textPrimary,
                    cursor: 'pointer', transition: 'all 0.12s ease',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Too Much — conditional fields */}
        {quality === 6 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', backgroundColor: S.surface, borderRadius: '12px', border: `1px solid ${S.border}` }}>
            <div>
              <p style={{ fontFamily: fontInter, fontSize: '12px', fontWeight: '500', color: S.textSecondary, margin: '0 0 8px 0' }}>
                Hours over?
              </p>
              <input
                type="number"
                inputMode="decimal"
                value={tooMuchHours}
                onChange={(e) => setTooMuchHours(e.target.value)}
                placeholder="2"
                style={{
                  width: '100%', height: '48px', backgroundColor: S.bg,
                  border: `1px solid ${S.border}`, borderRadius: '8px',
                  padding: '0 14px', fontFamily: fontInter, fontSize: '16px',
                  color: S.textPrimary, outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = S.gold }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = S.border }}
              />
            </div>
            <div>
              <p style={{ fontFamily: fontInter, fontSize: '12px', fontWeight: '500', color: S.textSecondary, margin: '0 0 8px 0' }}>
                How do you feel?
              </p>
              <textarea
                value={tooMuchFeeling}
                onChange={(e) => setTooMuchFeeling(e.target.value)}
                placeholder="Groggy, heavy, refreshed..."
                rows={3}
                spellCheck={true}
                autoCorrect="on"
                style={{
                  width: '100%', backgroundColor: S.bg,
                  border: `1px solid ${S.border}`, borderRadius: '8px',
                  padding: '10px 14px', fontFamily: fontInter, fontSize: '15px',
                  color: S.textPrimary, outline: 'none', resize: 'none',
                  lineHeight: '1.6', boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = S.gold }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = S.border }}
              />
              {voiceSupported && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                  <MicButton listening={feelingListening} accent={accent}
                    onMouseDown={(e) => { e.preventDefault(); feelingListening ? stopFeeling() : startFeeling() }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Could Not Sleep — conditional fields */}
        {quality === 7 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px', backgroundColor: S.surface, borderRadius: '12px', border: `1px solid ${S.border}` }}>
            <TimeCapture
              label="When I laid down to rest"
              value={layDownTime}
              onChange={setLayDownTime}
            />
            <TimeCapture
              label="When I last saw the clock"
              value={lastSawClockTime}
              onChange={setLastSawClockTime}
              optional
              noRightNow
            />
            <div>
              <p style={{ fontFamily: fontInter, fontSize: '12px', fontWeight: '500', color: S.textSecondary, margin: '0 0 8px 0' }}>
                What was going on?
              </p>
              <textarea
                value={cantSleepNotes}
                onChange={(e) => setCantSleepNotes(e.target.value)}
                placeholder="What was going on?"
                rows={4}
                spellCheck={true}
                autoCorrect="on"
                style={{
                  width: '100%', backgroundColor: S.bg,
                  border: `1px solid ${S.border}`, borderRadius: '8px',
                  padding: '10px 14px', fontFamily: fontInter, fontSize: '15px',
                  color: S.textPrimary, outline: 'none', resize: 'none',
                  lineHeight: '1.6', boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = S.gold }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = S.border }}
              />
              {voiceSupported && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                  <MicButton listening={cantSleepListening} accent={accent}
                    onMouseDown={(e) => { e.preventDefault(); cantSleepListening ? stopCantSleep() : startCantSleep() }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dreams (hidden for Could Not Sleep) */}
        {quality !== 7 && (
          <div>
            <SectionLabel>Any dreams?</SectionLabel>
            <textarea
              value={dreams}
              onChange={(e) => setDreams(e.target.value)}
              placeholder="Capture it while it is fresh..."
              rows={4}
              spellCheck={true}
              autoCorrect="on"
              style={{
                width: '100%', backgroundColor: S.surface,
                border: `1px solid ${S.border}`, borderRadius: '8px',
                padding: '12px 14px', fontFamily: fontInter, fontSize: '15px',
                color: S.textPrimary, outline: 'none', resize: 'vertical',
                lineHeight: '1.65', boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = S.gold }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = S.border }}
            />
            {voiceSupported && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                <MicButton listening={dreamsListening} accent={accent}
                  onMouseDown={(e) => { e.preventDefault(); dreamsListening ? stopDreams() : startDreams() }} />
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <SectionLabel>Anything else?</SectionLabel>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else?"
            rows={3}
            spellCheck={true}
            autoCorrect="on"
            style={{
              width: '100%', backgroundColor: S.surface,
              border: `1px solid ${S.border}`, borderRadius: '8px',
              padding: '12px 14px', fontFamily: fontInter, fontSize: '15px',
              color: S.textPrimary, outline: 'none', resize: 'vertical',
              lineHeight: '1.65', boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = S.gold }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = S.border }}
          />
          {voiceSupported && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              <MicButton listening={notesListening} accent={accent}
                onMouseDown={(e) => { e.preventDefault(); notesListening ? stopNotes() : startNotes() }} />
            </div>
          )}
        </div>

        {saveError && (
          <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.error, margin: 0, textAlign: 'center' }}>
            {saveError}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', height: '56px',
            backgroundColor: saving ? `${S.gold}60` : S.gold,
            color: S.bg, border: 'none', borderRadius: '10px',
            fontFamily: fontInter, fontSize: '15px', fontWeight: '700',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s ease',
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>

      </div>
    </div>
  )
}
