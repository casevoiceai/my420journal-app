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

const GUIDE_META = {
  bud:    { name: 'Bud Tendar',       accent: '#C9A84C', ambient: 'Take your time.'  },
  sunny:  { name: 'Sunny Day',        accent: '#FF7F5C', ambient: 'Take your time.'  },
  larry:  { name: 'Lucky Larry',      accent: '#C17A3A', ambient: 'Take your time.'  },
  herb:   { name: 'Herb N. Spices',   accent: '#4ECDC4', ambient: 'Take your time.'  },
  mary:   { name: 'Mary Jayne',       accent: '#B088B0', ambient: 'Take your time.'  },
  stoner: { name: 'S.T.O.N.E.R.',    accent: '#C9A84C', ambient: 'Noted.'            },
  unit:   { name: null,               accent: '#888888', ambient: 'Take your time.'  },
  tool:   { name: null,               accent: '#C9A84C', ambient: 'Take your time.'  },
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
    silenceRef.current = setTimeout(() => rec.stop(), 60000)
  }, [supported, onResult])
  useEffect(() => () => { clearTimeout(silenceRef.current); recRef.current?.stop() }, [])
  return { listening, supported, start, stop }
}

export default function NoteEntry() {
  const navigate = useNavigate()
  const [title,     setTitle]     = useState('')
  const [content,   setContent]   = useState('')
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState('')
  const [guide,     setGuide]     = useState(null)

  useEffect(() => {
    async function loadGuide() {
      if (isDevMode()) { setGuide(GUIDE_META.sunny); return }
      const { data: { user } } = await localStore.auth.getUser()
      if (!user) return
      const { data } = await localStore
        .from('user_profiles')
        .select('guide_selected')
        .eq('user_id', user.id)
        .maybeSingle()
      const key = data?.guide_selected || 'bud'
      setGuide(GUIDE_META[key] || GUIDE_META.bud)
    }
    loadGuide()
  }, [])

  const handleVoiceResult = useCallback((text) => {
    if (text) setContent((prev) => prev ? prev + ' ' + text : text)
  }, [])

  const { listening, supported, start, stop } = useVoiceInput({ onResult: handleVoiceResult })

  async function handleSave() {
    if (!content.trim() && !title.trim()) return
    setSaveError('')
    setSaving(true)

    let uid = isDevMode() ? 'dev-user-001' : null
    if (!uid) {
      const { data: { user } } = await localStore.auth.getUser()
      if (!user) { setSaveError('Not signed in.'); setSaving(false); return }
      uid = user.id
    }

    const productName = title.trim() || content.trim().slice(0, 40)

    const { error } = await localStore.from('entries').insert({
      user_id:      uid,
      entry_type:   'note',
      product_name: productName,
      notes:        content.trim() || null,
      capture_mode: 'manual',
    })

    setSaving(false)
    if (error) {
      if (isDevMode()) { console.error('Dev note save error:', error) }
      else { setSaveError('Could not save note. Try again.'); return }
    }
    navigate('/journal')
  }

  const accentColor = guide?.accent || S.gold
  const guideName   = guide?.name   || null
  const ambientLine = guide?.ambient || 'Take your time.'

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: S.bg, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>

      {/* Passive guide bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 20px', borderBottom: `1px solid ${S.border}`,
        minHeight: '36px',
      }}>
        {guideName ? (
          <span style={{ fontFamily: fontInter, fontSize: '11px', fontWeight: '600', color: accentColor, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {guideName}
          </span>
        ) : <span />}
        <span style={{ fontFamily: fontInter, fontSize: '12px', fontStyle: 'italic', color: S.textSecondary }}>
          {ambientLine}
        </span>
      </div>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 56px', height: '52px', flexShrink: 0,
        borderBottom: `1px solid ${S.border}`, position: 'relative',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', left: '12px', width: '44px', height: '44px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: S.textSecondary, display: 'flex', alignItems: 'center',
            justifyContent: 'center', borderRadius: '8px',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 style={{ fontFamily: fontPlayfair, fontSize: '20px', fontWeight: '600', color: S.textPrimary, margin: 0 }}>
          Note
        </h1>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          spellCheck={true}
          autoCorrect="on"
          style={{
            width: '100%', height: '48px', backgroundColor: S.surface,
            border: `1px solid ${S.border}`, borderRadius: '8px',
            padding: '0 14px', fontFamily: fontInter, fontSize: '15px',
            color: S.textPrimary, outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = accentColor }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = S.border }}
        />

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What is on your mind?"
          rows={8}
          spellCheck={true}
          autoCorrect="on"
          style={{
            width: '100%', backgroundColor: S.surface,
            border: `1px solid ${listening ? accentColor : S.border}`,
            borderRadius: '8px', padding: '14px',
            fontFamily: fontInter, fontSize: '16px',
            color: S.textPrimary, outline: 'none', resize: 'none',
            lineHeight: '1.65', boxSizing: 'border-box',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={(e) => { if (!listening) e.currentTarget.style.borderColor = accentColor }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = listening ? accentColor : S.border }}
        />

        {/* Mic button */}
        {supported && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '4px' }}>
            <button
              onMouseDown={(e) => { e.preventDefault(); listening ? stop() : start() }}
              style={{
                width: '52px', height: '52px', borderRadius: '50%',
                backgroundColor: listening ? accentColor : accentColor,
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: listening ? `0 0 0 8px ${accentColor}33` : '0 4px 12px rgba(0,0,0,0.3)',
                opacity: listening ? 1 : 0.85,
                transition: 'box-shadow 0.3s ease, opacity 0.15s ease',
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

        <div style={{ height: '8px', flexShrink: 0 }} />
      </div>

      {/* Save bar */}
      <div style={{
        flexShrink: 0, padding: '12px 20px 28px', boxSizing: 'border-box',
        borderTop: `1px solid ${S.border}`, backgroundColor: S.bg,
      }}>
        {saveError && (
          <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.error, margin: '0 0 10px 0', textAlign: 'center' }}>
            {saveError}
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={saving || (!content.trim() && !title.trim())}
          style={{
            width: '100%', height: '56px',
            backgroundColor: (saving || (!content.trim() && !title.trim())) ? `${S.gold}50` : S.gold,
            color: S.bg, border: 'none', borderRadius: '10px',
            fontFamily: fontInter, fontSize: '15px', fontWeight: '700',
            cursor: (saving || (!content.trim() && !title.trim())) ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s ease',
          }}
        >
          {saving ? 'Saving...' : 'Save note'}
        </button>
      </div>
    </div>
  )
}
