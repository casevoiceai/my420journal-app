import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { localStore } from '../lib/localStore'
import { isDevMode } from '../lib/dev'
import { LOCAL_GUIDE_MODEL, isLocalGuideModelEnabled, setLocalGuideModelEnabled, localGuideModelCapability, loadLocalGuideModel, resetLocalGuideModelRuntime } from '../lib/localGuideModel'
import { consumePendingCrisisFollowup, crisisFollowupMessage } from '../lib/guideSafety'

const S = {
  bg: '#0A1A0A',
  surface: '#1A2E1A',
  border: '#2D4A2D',
  textPrimary: '#E8F0E8',
  textSecondary: '#8FAF8F',
}
const fontInter = "'Inter', sans-serif"
const fontPlayfair = "'Playfair Display', serif"

const CONVERSATIONAL_GUIDES = new Set(['bud', 'sunny', 'larry', 'herb', 'mary'])

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
  try {
    // Guide transcripts are private session state, not durable journal data.
    // Purge the old persistent key so reopening the app never resurrects stale chat.
    localStorage.removeItem(CHAT_KEY)
    return JSON.parse(sessionStorage.getItem(CHAT_KEY) || '[]')
  } catch { return [] }
}
function saveChat(msgs) {
  try { sessionStorage.setItem(CHAT_KEY, JSON.stringify(msgs)) } catch {}
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
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false)
  const [thinking,   setThinking]   = useState(false)
  const [loaded,     setLoaded]     = useState(false)
  const [localModelEnabled, setLocalModelEnabledState] = useState(() => isLocalGuideModelEnabled())
  const [localModelStatus, setLocalModelStatus] = useState(() => isLocalGuideModelEnabled() ? 'loading' : 'idle')
  const [localModelProgress, setLocalModelProgress] = useState('')
  const [localModelError, setLocalModelError] = useState('')
  const [localModelCap] = useState(() => localGuideModelCapability())
  const [lowEffortMode, setLowEffortMode] = useState(() => {
    try { return sessionStorage.getItem('m420_guide_low_effort') === '1' } catch { return false }
  })

  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const unitIdxRef = useRef(0)
  const sendLockRef = useRef(false)

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
      const pendingCrisis = consumePendingCrisisFollowup()
      if (pendingCrisis) {
        const sourceName = GUIDE_META[pendingCrisis.guide]?.name || 'Your Guide'
        const checkInText = crisisFollowupMessage(pendingCrisis)
        const content = pendingCrisis.guide === guideKey ? checkInText : `${sourceName} checking in: ${checkInText}`
        const next = [...stored, { role: 'assistant', content }]
        setMessages(next)
        saveChat(next)
        setLoaded(true)
        return
      }
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

  useEffect(() => {
    if (!localModelEnabled || !localModelCap.supported || ['stoner', 'unit', 'tool'].includes(guide)) return
    let active = true
    setLocalModelStatus('loading')
    setLocalModelError('')
    loadLocalGuideModel({ onProgress: (p) => {
      if (!active) return
      const pct = Number.isFinite(Number(p?.progress)) ? `${Math.round(Number(p.progress) * 100)}%` : ''
      setLocalModelProgress(pct || p?.text || '')
    }}).then(() => { if (active) { setLocalModelStatus('ready'); setLocalModelProgress('') } })
      .catch((error) => { if (active) { setLocalModelStatus('error'); setLocalModelError(String(error?.message || 'load failed').slice(0, 160)); setLocalGuideModelEnabled(false); setLocalModelEnabledState(false); console.error('Local Guide model load failed', error) } })
    return () => { active = false }
  }, [localModelEnabled, localModelCap.supported, guide])

  const handleInterim = useCallback((text) => {
    setSuggestionsDismissed(true)
    setInput((prev) => {
      const base = prev.replace(/\u00A0.*$/, '').trim()
      return base ? base + '\u00A0' + text : text
    })
  }, [])
  const handleFinal = useCallback((text) => {
    setSuggestionsDismissed(true)
    setInput((prev) => {
      const base = prev.replace(/\u00A0.*$/, '').trim()
      return base ? base + ' ' + text : text
    })
  }, [])
  const { active: micActive, supported: micSupported, start: startMic, stop: stopMic } = useVoiceInput(handleInterim, handleFinal)

  async function send(text, options = {}) {
    const trimmed = text.trim()
    if (!trimmed || thinking || sendLockRef.current) return
    sendLockRef.current = true
    const displayContent = options.displayContent || trimmed
    const activateLowEffort = options.activateLowEffort === true
    const effectiveLowEffort = lowEffortMode || activateLowEffort
    if (activateLowEffort && !lowEffortMode) {
      setLowEffortMode(true)
      try { sessionStorage.setItem('m420_guide_low_effort', '1') } catch {}
    }

    const userMsg = { role: 'user', content: trimmed, displayContent }
    const baseMessages = messages.map((m) => m?.choices ? { ...m, choices: null } : m)
    const updated = [...baseMessages, userMsg]
    setMessages(updated)
    saveChat(updated)
    setInput('')
    setThinking(true)

    if (guide === 'unit' || guide === 'tool') {
      const reply = UNIT_RESPONSES[unitIdxRef.current % UNIT_RESPONSES.length]
      unitIdxRef.current++
      setTimeout(() => {
        const next = [...updated, { role: 'assistant', content: reply }]
        setSuggestionsDismissed(false)
        setMessages(next)
        saveChat(next)
        setThinking(false)
        sendLockRef.current = false
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
          localModelReady: localModelStatus === 'ready',
          accessibilityAction: options.accessibilityAction || null,
          lowEffortMode: effectiveLowEffort,
        },
      })
      if (error) throw error
      const reply = data?.content || data?.response || 'Try again.'
      if (data?.localModelError) {
        const detail = `${data.localModelError.phase || 'runtime'}: ${data.localModelError.message || data.localModelError.name || 'unknown error'}`
        setLocalModelStatus('error')
        setLocalModelError(detail.slice(0, 220))
        setLocalGuideModelEnabled(false)
        setLocalModelEnabledState(false)
        console.error('Conversational Guide inference failed', data.localModelError)
      }
      if (data?.lowEffortMode === true && !lowEffortMode) {
        setLowEffortMode(true)
        try { sessionStorage.setItem('m420_guide_low_effort', '1') } catch {}
      }
      const next  = [...updated, { role: 'assistant', content: reply, choices: Array.isArray(data?.choices) ? data.choices : null }]
      setSuggestionsDismissed(false)
      setMessages(next)
      saveChat(next)
    } catch {
      const next = [...updated, { role: 'assistant', content: 'Something went wrong. Try again.' }]
      setSuggestionsDismissed(false)
      setMessages(next)
      saveChat(next)
    } finally {
      setThinking(false)
      sendLockRef.current = false
    }
  }

  function handleChoice(choice) {
    if (choice?.freeText) {
      const cleared = messages.map((m, i) => i === messages.length - 1 ? { ...m, choices: null } : m)
      setSuggestionsDismissed(true)
      setMessages(cleared)
      saveChat(cleared)
      setTimeout(() => inputRef.current?.focus(), 0)
      return
    }
    if (!choice?.value) return
    const label = String(choice.label || choice.value).replace(/^[A-D]\.\s*/, '')
    send(choice.value, { displayContent: label })
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  function clearChat() {
    setMessages([])
    setSuggestionsDismissed(false)
    setLowEffortMode(false)
    try { sessionStorage.removeItem('m420_guide_low_effort') } catch {}
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

  async function setupConversationalGuides() {
    if (!localModelCap.supported || localModelStatus === 'loading') return
    setLocalModelError('')
    setLocalModelStatus('loading')
    if (localModelStatus === 'error') await resetLocalGuideModelRuntime()
    setLocalGuideModelEnabled(true)
    setLocalModelEnabledState(true)
  }

  const isConversationalGuide = CONVERSATIONAL_GUIDES.has(guide)
  const localModelGB = Math.round(LOCAL_GUIDE_MODEL.approximateDownloadMB / 100) / 10
  const canSend = input.trim().length > 0 && !thinking
  const activeChoices = !thinking && !input.trim() && !suggestionsDismissed && Array.isArray(messages.at(-1)?.choices)
    ? messages.at(-1).choices
    : []

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
                    <div>{msg.content}</div>
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
                    {msg.displayContent || msg.content}
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
            {isConversationalGuide && localModelStatus !== 'ready' && (
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${S.border}`, backgroundColor: `${accent}12` }}>
                <div style={{ fontFamily: fontInter, fontSize: '13px', fontWeight: 700, color: S.textPrimary, marginBottom: '4px' }}>
                  {localModelCap.supported ? 'Set up conversational Guides' : 'Conversational Guides are limited on this browser'}
                </div>
                <div style={{ fontFamily: fontInter, fontSize: '12px', color: S.textSecondary, lineHeight: '1.45' }}>
                  {!localModelCap.supported
                    ? 'This browser cannot run the on-device conversation model. Journal lookup and reviewed cannabis information are still available.'
                    : localModelStatus === 'loading'
                      ? `Downloading and starting the on-device AI model${localModelProgress ? ` ${localModelProgress}` : ''}. Keep this page open.`
                      : localModelStatus === 'error'
                        ? `The on-device conversation model could not start. Limited journal and cannabis mode is still available.${localModelError ? ` (${localModelError})` : ''}`
                        : `Natural conversation with Bud, Sunny, Larry, Herb, and Mary uses a one-time ~${localModelGB} GB on-device AI model download. It runs on this device; your journal is not uploaded. Until setup, this Guide stays in limited journal and cannabis mode.`}
                </div>
                {localModelCap.supported && localModelStatus !== 'loading' && (
                  <button
                    onClick={setupConversationalGuides}
                    style={{ marginTop: '9px', background: accent, border: 'none', borderRadius: '8px', padding: '8px 12px', color: S.bg, fontFamily: fontInter, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {localModelStatus === 'error' ? 'Try setup again' : `Set up (~${localModelGB} GB)`}
                  </button>
                )}
              </div>
            )}

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

            {activeChoices.length > 0 && (
              <div aria-label="Optional reply suggestions" style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', padding: '10px 16px 0' }}>
                {activeChoices.map((choice) => (
                  <button
                    key={choice.id || choice.label}
                    onClick={() => handleChoice(choice)}
                    style={{ minHeight: '36px', textAlign: 'left', padding: '7px 11px', background: S.bg, border: `1px solid ${accent}`, borderRadius: '18px', color: S.textPrimary, fontFamily: fontInter, fontSize: '13px', cursor: 'pointer' }}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 16px',
              boxSizing: 'border-box',
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  const nextValue = e.target.value
                  if (nextValue.length > 0) setSuggestionsDismissed(true)
                  setInput(nextValue)
                }}
                onKeyDown={handleKeyDown}
                disabled={thinking}
                placeholder={thinking ? `${guideName} is thinking...` : "Say something..."}
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
                  opacity: thinking ? 0.65 : 1,
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
