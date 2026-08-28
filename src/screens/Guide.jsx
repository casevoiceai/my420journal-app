import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { localStore } from '../lib/localStore'
import { isDevMode } from '../lib/dev'

const S = {
  bg: '#0A1A0A',
  surface: '#1A2E1A',
  border: '#2D4A2D',
  textPrimary: '#E8F0E8',
  textSecondary: '#8FAF8F',
}
const fontInter = "'Inter', sans-serif"
const fontPlayfair = "'Playfair Display', serif"

const GUIDE_META = {
  bud:   { name: 'Bud Tendar',     accent: '#C9A84C' },
  sunny: { name: 'Sunny Day',      accent: '#FF7F5C' },
  larry: { name: 'Lucky Larry',    accent: '#C17A3A' },
  herb:  { name: 'Herb N. Spices', accent: '#4ECDC4' },
  mary:  { name: 'Mary Jayne',     accent: '#B088B0' },
  unit:   { name: 'Unit',           accent: '#888888' },
  tool:   { name: 'Tool',           accent: '#C9A84C' },
  stoner: { name: 'S.T.O.N.E.R.', accent: '#C9A84C', notePrompt: 'Notes.' },
}

function getTier(count) {
  if (count >= 100) return 5
  if (count >= 75)  return 4
  if (count >= 50)  return 3
  if (count >= 25)  return 2
  if (count >= 10)  return 1
  return 0
}

const GREETINGS = {
  bud: [
    "Hey. What are we logging?",
    "Good to see you. What did you get?",
    "Hey. Ready to talk through what you logged?",
    "Back again. What happened?",
    "Hey. Back for another entry?",
    "Alright. What do you want to look at today?",
  ],
  sunny: [
    "Hey! You came back! What happened, tell me everything!",
    "Hi! Before we log -- how are you actually doing today?",
    "Hey. What is on your mind today?",
    "Hey you. I have a question and I need you to be honest with me.",
    "Hey. How are you? The real version.",
    "Hi. Tell me what is on your mind today.",
  ],
  larry: [
    "Hey. What did you get?",
    "Back again. What are we looking at?",
    "Hey. What are we talking about today?",
    "You are back. What are we looking at today?",
    "Hey. Back again. What happened?",
    "A hundred sessions. What do you need?",
  ],
  herb: [
    "Hey. What are we logging?",
    "Hey. What did you get this time?",
    "Hey. Want to talk terpenes?",
    "Good. You are back. What are we logging?",
    "Hey. Want to talk through the terpene details you have in front of you?",
    "A hundred sessions. Do you know what we have now?",
  ],
  mary: [
    "Hey. What are we tracking today?",
    "Hey. Before we log -- how did you sleep?",
    "Hey. How are you feeling overall?",
    "Hey. What do you want to check in on today?",
    "How are you feeling today?",
    "A hundred sessions. You have told me a lot.",
  ],
}

const HERB_T0_THOUGHT = "(ready to talk terpenes when you are)"

const UNIT_RESPONSES = ["Logged.", "Noted.", "Confirmed."]

const CHAT_KEY = 'm420_guide_chat'

function loadChat() {
  try { return JSON.parse(localStorage.getItem(CHAT_KEY) || '[]') }
  catch { return [] }
}
function saveChat(msgs) {
  localStorage.setItem(CHAT_KEY, JSON.stringify(msgs))
}

function useVoiceInput(onInterim, onFinal) {
  const recRef = useRef(null)
  const [active, setActive] = useState(false)
  const [supported] = useState(() =>
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  )

  const start = useCallback(() => {
    if (!supported) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    recRef.current = rec
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (e) => {
      let interim = ''
      let final   = ''
      for (const r of e.results) {
        if (r.isFinal) final += r[0].transcript
        else interim += r[0].transcript
      }
      if (interim) onInterim(interim)
      if (final)   onFinal(final)
    }
    rec.onend  = () => setActive(false)
    rec.onerror = () => setActive(false)
    rec.start()
    setActive(true)
  }, [supported, onInterim, onFinal])

  const stop = useCallback(() => { recRef.current?.stop() }, [])

  return { active, supported, start, stop }
}

function TypingDots({ accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
      <div style={{
        backgroundColor: S.surface,
        borderLeft: `3px solid ${accent}`,
        borderRadius: '0 12px 12px 12px',
        padding: '14px 18px',
        display: 'flex', gap: '5px', alignItems: 'center',
      }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: '7px', height: '7px', borderRadius: '50%',
            backgroundColor: accent, opacity: 0.75, display: 'inline-block',
            animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

export default function Guide() {
  const navigate = useNavigate()

  const [guide,      setGuide]      = useState('bud')
  const [accent,     setAccent]     = useState('#C9A84C')
  const [guideName,  setGuideName]  = useState('Bud Tendar')
  const [entryCount, setEntryCount] = useState(0)
  const [tier,       setTier]       = useState(0)
  const [messages,   setMessages]   = useState([])
  const [input,      setInput]      = useState('')
  const [thinking,   setThinking]   = useState(false)
  const [loaded,     setLoaded]     = useState(false)

  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const unitIdxRef = useRef(0)

  useEffect(() => {
    async function init() {
      let guideKey = 'bud'
      let count    = 0

      if (isDevMode()) {
        guideKey = 'sunny'
        count    = 12
      } else {
        const { data: { user } } = await localStore.auth.getUser()
        if (user) {
          const { data } = await localStore
            .from('user_profiles')
            .select('guide_selected, entry_count')
            .eq('user_id', user.id)
            .maybeSingle()
          if (data) {
            guideKey = data.guide_selected || 'bud'
            count    = data.entry_count    || 0
          }
        }
      }

      const meta = GUIDE_META[guideKey] || GUIDE_META.bud
      const t    = getTier(count)
      setGuide(guideKey)
      setAccent(meta.accent)
      setGuideName(meta.name)
      setEntryCount(count)
      setTier(t)

      const stored = loadChat()
      if (stored.length > 0) {
        setMessages(stored)
        setLoaded(true)
        return
      }

      setLoaded(true)
      // Stoner mode: no opening message, user initiates
      if (guideKey === 'stoner') return
      setTimeout(() => {
        const greetings = GREETINGS[guideKey] || GREETINGS.bud
        let greeting    = greetings[t] || greetings[0]
        if (guideKey === 'herb' && t === 0) greeting = greeting + '\n' + HERB_T0_THOUGHT
        const opening = [{ role: 'assistant', content: greeting }]
        setMessages(opening)
        saveChat(opening)
      }, 600)
    }
    init()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const handleInterim = useCallback((text) => {
    setInput((prev) => {
      const base = prev.replace(/\u00A0.*$/, '').trim()
      return base ? base + '\u00A0' + text : text
    })
  }, [])
  const handleFinal = useCallback((text) => {
    setInput((prev) => {
      const base = prev.replace(/\u00A0.*$/, '').trim()
      return base ? base + ' ' + text : text
    })
  }, [])
  const { active: micActive, supported: micSupported, start: startMic, stop: stopMic } = useVoiceInput(handleInterim, handleFinal)

  async function send(text) {
    const trimmed = text.trim()
    if (!trimmed || thinking) return

    const userMsg = { role: 'user', content: trimmed }
    const updated = [...messages, userMsg]
    setMessages(updated)
    saveChat(updated)
    setInput('')
    setThinking(true)

    if (guide === 'unit' || guide === 'tool') {
      const reply = UNIT_RESPONSES[unitIdxRef.current % UNIT_RESPONSES.length]
      unitIdxRef.current++
      setTimeout(() => {
        const next = [...updated, { role: 'assistant', content: reply }]
        setMessages(next)
        saveChat(next)
        setThinking(false)
      }, 300)
      return
    }

    try {
      const { data, error } = await localStore.tools.invoke('guide-response', {
        body: {
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          guide,
          entryCount,
          tier,
        },
      })
      if (error) throw error
      const reply = data?.content || data?.response || 'Try again.'
      const next  = [...updated, { role: 'assistant', content: reply }]
      setMessages(next)
      saveChat(next)
    } catch {
      const next = [...updated, { role: 'assistant', content: 'Something went wrong. Try again.' }]
      setMessages(next)
      saveChat(next)
    } finally {
      setThinking(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  function clearChat() {
    setMessages([])
    saveChat([])
    if (guide === 'stoner') return
    setTimeout(() => {
      const greetings = GREETINGS[guide] || GREETINGS.bud
      let greeting    = greetings[tier] || greetings[0]
      if (guide === 'herb' && tier === 0) greeting = greeting + '\n' + HERB_T0_THOUGHT
      const opening = [{ role: 'assistant', content: greeting }]
      setMessages(opening)
      saveChat(opening)
    }, 300)
  }

  function toggleMic() {
    if (micActive) stopMic()
    else startMic()
  }

  const canSend = input.trim().length > 0 && !thinking

  if (!loaded) {
    return <div style={{ minHeight: '100dvh', backgroundColor: S.bg }} />
  }

  return (
    <>
      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.35; }
          40%            { transform: scale(1.2); opacity: 1; }
        }
      `}</style>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        backgroundColor: S.bg,
        boxSizing: 'border-box',
        alignItems: 'center',
        paddingBottom: '80px',
      }}>
        {/* Inner column — max 680px */}
        <div style={{
          width: '100%',
          maxWidth: '680px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}>

          {/* ── Header ── */}
          <div style={{
            height: '56px',
            flexShrink: 0,
            backgroundColor: accent,
            display: 'flex',
            alignItems: 'center',
            padding: '0 4px',
            boxSizing: 'border-box',
            position: 'relative',
          }}>
            {/* Back */}
            <button
              onClick={() => navigate(-1)}
              style={{
                width: '44px', height: '44px', flexShrink: 0,
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white',
              }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Guide name centered */}
            <span style={{
              position: 'absolute', left: '44px', right: '80px',
              textAlign: 'center', pointerEvents: 'none',
              fontFamily: fontPlayfair, fontSize: '18px', fontWeight: '600', color: 'white',
            }}>
              {guideName}
            </span>

            {/* Switch Guide */}
            <button
              onClick={() => navigate('/onboarding')}
              style={{
                marginLeft: 'auto',
                width: '80px', height: '44px', flexShrink: 0,
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: fontInter, fontSize: '12px', color: 'rgba(255,255,255,0.85)',
                whiteSpace: 'nowrap', paddingRight: '12px', textAlign: 'right',
              }}>
              Switch Guide
            </button>
          </div>

          {/* ── Chat area ── */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            boxSizing: 'border-box',
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '12px',
              }}>
                {msg.role === 'assistant' ? (
                  <div style={{
                    maxWidth: '75%',
                    backgroundColor: S.surface,
                    borderLeft: `3px solid ${accent}`,
                    borderRadius: '0 12px 12px 12px',
                    padding: '12px 16px',
                    fontFamily: fontInter, fontSize: '15px',
                    color: S.textPrimary, lineHeight: '1.6',
                    whiteSpace: 'pre-line',
                  }}>
                    {msg.content}
                  </div>
                ) : (
                  <div style={{
                    maxWidth: '75%',
                    backgroundColor: `${accent}26`,
                    border: `1px solid ${accent}`,
                    borderRadius: '12px 12px 0 12px',
                    padding: '12px 16px',
                    fontFamily: fontInter, fontSize: '15px',
                    color: S.textPrimary, lineHeight: '1.6',
                  }}>
                    {msg.content}
                  </div>
                )}
              </div>
            ))}

            {thinking && <TypingDots accent={accent} />}
            <div ref={bottomRef} />
          </div>

          {/* ── Input area ── */}
          <div style={{
            flexShrink: 0,
            borderTop: `1px solid ${S.border}`,
            backgroundColor: S.surface,
            boxSizing: 'border-box',
          }}>
            {/* Clear conversation row */}
            <button
              onClick={clearChat}
              style={{
                width: '100%', height: '44px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${S.border}`,
                cursor: 'pointer',
                fontFamily: fontInter, fontSize: '13px',
                color: S.textSecondary,
                letterSpacing: '0.01em',
              }}>
              Clear conversation
            </button>

            {/* Input row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 16px',
              boxSizing: 'border-box',
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Say something..."
                spellCheck={true}
                autoCorrect="on"
                style={{
                  flex: 1, height: '44px',
                  backgroundColor: S.bg,
                  border: `1px solid ${S.border}`,
                  borderRadius: '8px',
                  padding: '0 12px',
                  fontFamily: fontInter, fontSize: '15px',
                  color: S.textPrimary,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = accent }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = S.border }}
              />

              {/* Mic */}
              {micSupported && (
                <button
                  onClick={toggleMic}
                  style={{
                    width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: accent,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transition: 'all 0.15s ease',
                    opacity: micActive ? 1 : 0.8,
                  }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="9" y="3" width="6" height="12" rx="3" fill="white" />
                    <path d="M5 11a7 7 0 0014 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 18v3M9 21h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}

              {/* Send */}
              <button
                onClick={() => send(input)}
                disabled={!canSend}
                style={{
                  width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                  backgroundColor: canSend ? accent : S.bg,
                  border: `1px solid ${canSend ? accent : S.border}`,
                  cursor: canSend ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
                    stroke={canSend ? S.bg : S.textSecondary}
                    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
