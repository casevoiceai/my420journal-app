import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  createEmptyWeedGoblinsPersonalizationSnapshot,
  readWeedGoblinsPersonalizationSnapshot,
  saveWeedGoblinsRunSummary,
} from './weedGoblinsLocalDataAdapter.js'
import {
  createWeedGoblinsChatSession,
  getWeedGoblinsQuickReplies,
  isWeedGoblinsFreeTextScene,
  isWeedGoblinsSessionTextScene,
  narrateWeedGoblinsResolvedTurn,
  prepareWeedGoblinsFreeTextTurn,
  prepareWeedGoblinsQuickReplyTurn,
  resolveWeedGoblinsPreparedMechanics,
  resolveWeedGoblinsPreparedTurn,
  resolveWeedGoblinsTransitionWithStaticFallback,
  submitWeedGoblinsSessionText,
} from './weedGoblinsChatController.js'
import { WEED_GOBLINS_NARRATOR_NAME } from './weedGoblinsEngine.js'
import { findWeedGoblinsDiscoverableMatches } from './weedGoblinsDiscoverables.js'
import { buildWeedGoblinsCharacterSummary } from './weedGoblinsCharacterSummary.js'
import {
  WEED_GOBLINS_COMPOSER_MAX_LENGTH,
  appendWeedGoblinsVoiceTranscript,
  getBrowserSpeechRecognition,
} from './weedGoblinsVoiceInput.js'
import './WeedGoblinsChat.css'

function makeRunSeed() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `weed-goblins-chat:${crypto.randomUUID()}`
  }
  return `weed-goblins-chat:${Date.now()}`
}

function staticNarration({ hook }) {
  return Promise.resolve({
    text: hook.fallbackText,
    source: 'static-fallback',
  })
}

async function loadSnapshotWithFallback() {
  try {
    return await readWeedGoblinsPersonalizationSnapshot()
  } catch {
    return createEmptyWeedGoblinsPersonalizationSnapshot()
  }
}

function D20Icon({ value = null, size = 44 }) {
  const resolved = Number.isInteger(value) && value >= 1 && value <= 20
  return (
    <svg
      className={`weed-goblins-game__d20${resolved ? ' is-resolved' : ''}`}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <path className="weed-goblins-game__d20-face" d="M24 3 43 14v20L24 45 5 34V14Z" />
      <path className="weed-goblins-game__d20-lines" d="M24 3v42M5 14l38 20M43 14 5 34M5 14l19 10 19-10M5 34l19-10 19 10" />
      {resolved && <text x="24" y="25" textAnchor="middle" dominantBaseline="central">{value}</text>}
    </svg>
  )
}

function TypingIndicator({ label = 'Eliza is typing' }) {
  return (
    <div className="weed-goblins-game__typing" aria-label={label}>
      <span />
      <span />
      <span />
    </div>
  )
}

function HighlightedMessageText({ text, state, onOpenDiscoverable }) {
  const matches = findWeedGoblinsDiscoverableMatches(text, state)
  if (matches.length === 0) return text

  const parts = []
  let cursor = 0
  for (const match of matches) {
    if (match.start > cursor) parts.push(text.slice(cursor, match.start))
    parts.push(
      <button
        key={`${match.discoverable.id}-${match.start}`}
        type="button"
        className="weed-goblins-game__discoverable"
        onClick={() => onOpenDiscoverable(match.discoverable)}
      >
        {match.text}
      </button>,
    )
    cursor = match.end
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts
}

function StoryEntry({ message, onRoll, canRoll, busy, state, onOpenDiscoverable }) {
  if (message.kind === 'roll-trigger') {
    return (
      <div className="weed-goblins-game__roll-row">
        <button
          type="button"
          className="weed-goblins-game__roll-button"
          onClick={onRoll}
          disabled={!canRoll || busy}
        >
          <D20Icon size={30} />
          <span>{canRoll ? 'Roll D20' : 'Rolled'}</span>
        </button>
      </div>
    )
  }

  if (message.kind === 'roll-result') {
    return (
      <div className="weed-goblins-game__roll-result" aria-label={`D20 result ${message.die}`}>
        <D20Icon value={message.die} size={46} />
      </div>
    )
  }

  if (message.direction === 'outgoing') {
    return (
      <div className="weed-goblins-game__message-row is-outgoing">
        <article className="weed-goblins-game__message-bubble is-player">
          <p>{message.text}</p>
        </article>
      </div>
    )
  }

  return (
    <div className="weed-goblins-game__message-row is-incoming">
      <article className="weed-goblins-game__message-bubble is-eliza">
        <p>
          <HighlightedMessageText
            text={message.text}
            state={state}
            onOpenDiscoverable={onOpenDiscoverable}
          />
        </p>
        {message.die !== null && message.die !== undefined && (
          <span className="weed-goblins-game__inline-die" aria-label={`D20 result ${message.die}`}>
            <D20Icon value={message.die} size={30} />
          </span>
        )}
      </article>
    </div>
  )
}

function MicrophoneIcon() {
  return (
    <svg className="weed-goblins-game__voice-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 1 0-7 0v5a3.5 3.5 0 0 0 3.5 3.5Zm-6-4a6 6 0 0 0 12 0M12 16.5V21M9 21h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MessageComposer({
  id,
  value,
  onChange,
  onSubmit,
  placeholder,
  ariaLabel,
  disabled,
  submitDisabled,
  voiceAvailable = false,
  voiceDisabled = false,
  listening = false,
  onVoiceToggle = () => {},
}) {
  return (
    <form className="weed-goblins-game__composer" onSubmit={onSubmit}>
      <div className="weed-goblins-game__composer-shell">
        <button
          type="button"
          className={`weed-goblins-game__voice-button${listening ? ' is-listening' : ''}`}
          onClick={onVoiceToggle}
          aria-label={listening ? 'Stop voice input' : 'Start voice input'}
          title={voiceAvailable ? 'Voice to text' : 'Voice input is not available in this browser'}
          disabled={!voiceAvailable || voiceDisabled}
        >
          <MicrophoneIcon />
        </button>
        <input
          id={id}
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          maxLength={WEED_GOBLINS_COMPOSER_MAX_LENGTH}
          disabled={disabled}
          autoComplete="off"
        />
        <button className="weed-goblins-game__send-button" type="submit" aria-label="Send message" disabled={submitDisabled}>
          <span aria-hidden="true">↑</span>
        </button>
      </div>
    </form>
  )
}

export default function WeedGoblinsChat({ seed = null } = {}) {
  const navigate = useNavigate()
  const [state, setState] = useState(null)
  const [messages, setMessages] = useState([])
  const [choices, setChoices] = useState([])
  const [blockedRealNames, setBlockedRealNames] = useState([])
  const [draft, setDraft] = useState('')
  const [pendingTurn, setPendingTurn] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [fatalError, setFatalError] = useState('')
  const [actionError, setActionError] = useState('')
  const [activeDiscoverable, setActiveDiscoverable] = useState(null)
  const [characterSheetOpen, setCharacterSheetOpen] = useState(false)
  const [listening, setListening] = useState(false)
  const [runNumber, setRunNumber] = useState(0)
  const storyRef = useRef(null)
  const endRef = useRef(null)
  const crestHoldTimerRef = useRef(null)
  const speechRecognitionRef = useRef(null)
  const hasStartedScrollingRef = useRef(false)
  const resolvedSeed = useMemo(
    () => seed ? `${seed}:${runNumber}` : makeRunSeed(),
    [seed, runNumber],
  )
  const freeTextOpen = isWeedGoblinsFreeTextScene(state)
  const sessionTextOpen = isWeedGoblinsSessionTextScene(state)
  const canType = freeTextOpen && !pendingTurn && !busy && state?.status !== 'completed'
  const canSessionType = sessionTextOpen && !pendingTurn && !busy && state?.status !== 'completed'
  const SpeechRecognition = useMemo(
    () => typeof window !== 'undefined' ? getBrowserSpeechRecognition(window) : null,
    [],
  )
  const characterSummary = useMemo(() => buildWeedGoblinsCharacterSummary(state), [state])
  const voiceInputEnabled = canType || canSessionType

  useEffect(() => {
    let cancelled = false

    async function start() {
      const snapshot = await loadSnapshotWithFallback()
      if (cancelled) return

      const blockedNames = Array.isArray(snapshot.productNames) ? snapshot.productNames : []
      setBlockedRealNames(blockedNames)
      const options = {
        seed: resolvedSeed,
        journalSnapshot: snapshot,
        previousRuns: snapshot.previousRuns || [],
        priorCompletedRunCount: snapshot.previousRuns?.length || 0,
        blockedRealNames: blockedNames,
      }

      let session
      try {
        session = await createWeedGoblinsChatSession(options)
      } catch {
        session = await createWeedGoblinsChatSession({ ...options, generateNarration: staticNarration })
      }
      if (cancelled) return
      setState(session.state)
      setMessages(session.messages)
      setChoices(session.choices)
      setLoading(false)
    }

    start().catch(() => {
      if (cancelled) return
      setFatalError('The road into the Highlands failed to open. Return and try again.')
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [resolvedSeed])

  useEffect(() => () => {
    if (crestHoldTimerRef.current) clearTimeout(crestHoldTimerRef.current)
    if (speechRecognitionRef.current?.abort) speechRecognitionRef.current.abort()
  }, [])

  useEffect(() => {
    if (!hasStartedScrollingRef.current && messages.length > 0) {
      storyRef.current?.scrollTo({ top: 0 })
      hasStartedScrollingRef.current = true
      return
    }
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, busy, pendingTurn])

  async function saveCompletedRun(nextState) {
    if (nextState.status !== 'completed') return
    try {
      await saveWeedGoblinsRunSummary({ runSummary: nextState.runSummary })
    } catch {
      // The run remains playable when browser storage is unavailable.
    }
  }

  async function applyResolvedPreparedTurn(resolution, baseMessages) {
    const nextMessages = [...baseMessages]
    if (resolution.rollResultMessage) nextMessages.push(resolution.rollResultMessage)
    nextMessages.push(...resolution.outcomeMessages)
    setMessages(nextMessages)
    setState(resolution.after)
    setChoices(getWeedGoblinsQuickReplies(resolution.after))
    await saveCompletedRun(resolution.after)
  }

  async function handleChoice(action) {
    if (!state || busy || pendingTurn || state.status === 'completed') return
    const baseState = state
    const baseMessages = messages
    setActionError('')
    setBusy(true)
    setChoices([])

    try {
      const prepared = await prepareWeedGoblinsQuickReplyTurn({
        state: baseState,
        action,
        blockedRealNames,
      })
      const optimisticMessages = [...baseMessages, prepared.outgoingMessage]
      setDraft('')
      setMessages(optimisticMessages)

      if (prepared.requiresRoll) {
        const stagedMessages = [
          ...optimisticMessages,
          prepared.setupMessage,
          prepared.rollTriggerMessage,
        ].filter(Boolean)
        setState(baseState)
        setMessages(stagedMessages)
        setPendingTurn(prepared)
        return
      }

      setState(prepared.after)
      const incomingMessages = await resolveWeedGoblinsTransitionWithStaticFallback({
        before: prepared.before,
        after: prepared.after,
        blockedRealNames,
      })
      setMessages([...optimisticMessages, ...incomingMessages])
      setChoices(getWeedGoblinsQuickReplies(prepared.after))
      await saveCompletedRun(prepared.after)
    } catch {
      setState(baseState)
      setMessages(baseMessages)
      setChoices(getWeedGoblinsQuickReplies(baseState))
      setActionError('That move did not resolve. Choose it again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSessionTextSubmit(event) {
    event?.preventDefault()
    if (!state || !canSessionType) return
    const isLookStep = state.sceneId === 'session-zero-look'
    const text = draft.trim()
    if (isLookStep && !text) return

    const baseState = state
    const baseMessages = messages
    setActionError('')
    setBusy(true)
    setChoices([])

    try {
      const transition = submitWeedGoblinsSessionText(baseState, text)
      const optimisticMessages = transition.outgoingMessage
        ? [...baseMessages, transition.outgoingMessage]
        : [...baseMessages]
      setState(transition.after)
      setMessages(optimisticMessages)
      const incomingMessages = await resolveWeedGoblinsTransitionWithStaticFallback({
        before: transition.before,
        after: transition.after,
        blockedRealNames,
      })
      setMessages([...optimisticMessages, ...incomingMessages])
      setChoices(getWeedGoblinsQuickReplies(transition.after))
      setDraft('')
    } catch {
      setState(baseState)
      setMessages(baseMessages)
      setChoices(getWeedGoblinsQuickReplies(baseState))
      setActionError(isLookStep
        ? 'Describe your traveler or choose one of the looks above.'
        : 'That name could not be saved. Try it again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleFreeTextAction(text, { restoreDraftOnError = true } = {}) {
    const actionText = String(text ?? '').trim()
    if (!state || !canType || !actionText) return
    setActionError('')
    setBusy(true)
    setChoices([])

    try {
      const prepared = await prepareWeedGoblinsFreeTextTurn({
        state,
        playerAction: actionText,
        blockedRealNames,
      })
      const stagedMessages = [
        ...messages,
        prepared.outgoingMessage,
        prepared.setupMessage,
      ].filter(Boolean)
      if (prepared.rollTriggerMessage) stagedMessages.push(prepared.rollTriggerMessage)
      setDraft('')
      setMessages(stagedMessages)

      if (prepared.requiresRoll) {
        setPendingTurn(prepared)
      } else {
        const resolution = await resolveWeedGoblinsPreparedTurn({
          preparedTurn: prepared,
          blockedRealNames,
        })
        await applyResolvedPreparedTurn(resolution, stagedMessages)
      }
    } catch {
      if (restoreDraftOnError) setDraft(actionText)
      setChoices(getWeedGoblinsQuickReplies(state))
      setActionError('That custom move could not be resolved. Edit it or choose an action below.')
    } finally {
      setBusy(false)
    }
  }

  async function handleTextSubmit(event) {
    event?.preventDefault()
    await handleFreeTextAction(draft)
  }

  async function handleDiscoverableAction(action) {
    if (!action || busy || pendingTurn) return
    setActiveDiscoverable(null)
    if (action.kind === 'engine') {
      const available = getWeedGoblinsQuickReplies(state)
      const choice = available.find((candidate) => candidate.id === action.id)
        || { id: action.id, label: action.label }
      await handleChoice(choice)
      return
    }
    if (action.kind === 'free-text') {
      await handleFreeTextAction(action.playerAction, { restoreDraftOnError: false })
    }
  }

  function discoverableActionAvailable(action) {
    if (!action || busy || pendingTurn) return false
    if (action.kind === 'free-text') return canType
    if (action.kind === 'engine') {
      return getWeedGoblinsQuickReplies(state).some((choice) => choice.id === action.id)
    }
    return false
  }

  async function handleRoll() {
    if (!pendingTurn || busy) return
    setActionError('')
    setBusy(true)

    try {
      const prepared = pendingTurn
      const mechanics = resolveWeedGoblinsPreparedMechanics({ preparedTurn: prepared })
      const withRoll = mechanics.rollResultMessage
        ? [...messages, mechanics.rollResultMessage]
        : [...messages]
      setPendingTurn(null)
      setState(mechanics.after)
      setMessages(withRoll)
      const outcomeMessages = await narrateWeedGoblinsResolvedTurn({
        preparedTurn: prepared,
        mechanics,
        blockedRealNames,
      })
      setMessages([...withRoll, ...outcomeMessages])
      setChoices(getWeedGoblinsQuickReplies(mechanics.after))
      await saveCompletedRun(mechanics.after)
    } catch {
      setActionError('The roll resolved, but the story could not advance. Try the action again.')
      setPendingTurn(null)
      setChoices(getWeedGoblinsQuickReplies(state))
    } finally {
      setBusy(false)
    }
  }

  function clearCrestHold() {
    if (!crestHoldTimerRef.current) return
    clearTimeout(crestHoldTimerRef.current)
    crestHoldTimerRef.current = null
  }

  function beginCrestHold() {
    if (!state || crestHoldTimerRef.current) return
    crestHoldTimerRef.current = setTimeout(() => {
      crestHoldTimerRef.current = null
      setCharacterSheetOpen(true)
    }, 550)
  }

  function handleCrestKeyDown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    beginCrestHold()
  }

  function handleCrestKeyUp(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    clearCrestHold()
  }

  function toggleVoiceInput() {
    if (!SpeechRecognition || !voiceInputEnabled) return
    if (listening && speechRecognitionRef.current?.stop) {
      speechRecognitionRef.current.stop()
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results || [])
        .map((result) => result?.[0]?.transcript || '')
        .join(' ')
      setDraft((current) => appendWeedGoblinsVoiceTranscript(current, transcript))
    }
    recognition.onerror = () => {
      setListening(false)
      setActionError('Voice input stopped. You can keep typing.')
    }
    recognition.onend = () => {
      speechRecognitionRef.current = null
      setListening(false)
    }

    try {
      speechRecognitionRef.current = recognition
      recognition.start()
      setListening(true)
    } catch {
      speechRecognitionRef.current = null
      setListening(false)
      setActionError('Voice input could not start. You can keep typing.')
    }
  }

  function restartRun() {
    setState(null)
    setMessages([])
    setChoices([])
    setDraft('')
    setPendingTurn(null)
    setFatalError('')
    setActionError('')
    setActiveDiscoverable(null)
    setCharacterSheetOpen(false)
    if (speechRecognitionRef.current?.abort) speechRecognitionRef.current.abort()
    speechRecognitionRef.current = null
    setListening(false)
    setLoading(true)
    hasStartedScrollingRef.current = false
    setRunNumber((current) => current + 1)
  }

  const composerPlaceholder = pendingTurn
    ? 'Roll the die above'
    : choices.length > 0
      ? 'Message Eliza...'
      : 'Message Eliza...'

  return (
    <main className="weed-goblins-game" aria-label="Conversation with Eliza">
      <header className="weed-goblins-game__header">
        <button
          type="button"
          className="weed-goblins-game__back"
          onClick={() => navigate(-1)}
          aria-label="Leave conversation"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div className="weed-goblins-game__contact">
          <button
            type="button"
            className="weed-goblins-game__crest"
            aria-label="Hold for character details"
            onPointerDown={beginCrestHold}
            onPointerUp={clearCrestHold}
            onPointerCancel={clearCrestHold}
            onPointerLeave={clearCrestHold}
            onKeyDown={handleCrestKeyDown}
            onKeyUp={handleCrestKeyUp}
            onContextMenu={(event) => event.preventDefault()}
            onClick={(event) => event.preventDefault()}
          >
            E
          </button>
          <div className="weed-goblins-game__contact-copy">
            <h1>{WEED_GOBLINS_NARRATOR_NAME}</h1>
            <p>{busy ? 'typing…' : 'online'}</p>
          </div>
        </div>
        <div className="weed-goblins-game__header-spacer" aria-hidden="true" />
      </header>

      <section
        ref={storyRef}
        className="weed-goblins-game__story"
        aria-live="polite"
        aria-busy={busy}
      >
        <div className="weed-goblins-game__thread">
          {loading && (
            <div className="weed-goblins-game__message-row is-incoming">
              <div className="weed-goblins-game__message-bubble is-eliza is-typing">
                <TypingIndicator label="Eliza is opening the conversation" />
              </div>
            </div>
          )}
          {!loading && fatalError && (
            <div className="weed-goblins-game__error" role="alert">{fatalError}</div>
          )}
          {messages.map((message, index) => (
            <StoryEntry
              key={`${message.kind || 'message'}-${message.direction}-${index}-${message.actionId || 'story'}`}
              message={message}
              onRoll={handleRoll}
              canRoll={Boolean(pendingTurn) && message.kind === 'roll-trigger' && index === messages.length - 1}
              busy={busy}
              state={state}
              onOpenDiscoverable={setActiveDiscoverable}
            />
          ))}
          {busy && !loading && (
            <div className="weed-goblins-game__message-row is-incoming">
              <div className="weed-goblins-game__message-bubble is-eliza is-typing">
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </section>

      {characterSheetOpen && characterSummary && (
        <div
          className="weed-goblins-game__character-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCharacterSheetOpen(false)
          }}
        >
          <section
            className="weed-goblins-game__character-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="weed-goblins-character-title"
          >
            <button
              type="button"
              className="weed-goblins-game__character-close"
              onClick={() => setCharacterSheetOpen(false)}
              aria-label="Close character details"
            >
              ×
            </button>
            <div className="weed-goblins-game__character-head">
              <div className="weed-goblins-game__crest" aria-hidden="true">E</div>
              <div>
                <h2 id="weed-goblins-character-title">{characterSummary.name}</h2>
                <p>{characterSummary.location || 'Goblin Highlands'}</p>
              </div>
            </div>
            <div className="weed-goblins-game__character-grid">
              <div className="weed-goblins-game__character-field"><span>Race</span><strong>{characterSummary.race}</strong></div>
              <div className="weed-goblins-game__character-field"><span>Class</span><strong>{characterSummary.className}</strong></div>
              <div className="weed-goblins-game__character-field"><span>Weapon</span><strong>{characterSummary.weapon}</strong></div>
              <div className="weed-goblins-game__character-field"><span>Ability</span><strong>{characterSummary.ability || 'Not chosen yet'}</strong></div>
              <div className="weed-goblins-game__character-field"><span>Strength</span><strong>{characterSummary.strength}</strong></div>
              <div className="weed-goblins-game__character-field"><span>Defense</span><strong>{characterSummary.defense}</strong></div>
              <div className="weed-goblins-game__character-field"><span>Mana</span><strong>{characterSummary.mana}/{characterSummary.maxMana}</strong></div>
              <div className="weed-goblins-game__character-field"><span>Trouble</span><strong>{characterSummary.trouble}/3</strong></div>
            </div>
            {characterSummary.pronoun && (
              <div className="weed-goblins-game__character-look">
                <span>Pronouns</span>
                <p>{characterSummary.pronoun}</p>
              </div>
            )}
            {characterSummary.look && (
              <div className="weed-goblins-game__character-look">
                <span>Appearance</span>
                <p>{characterSummary.look}</p>
              </div>
            )}
            <div className="weed-goblins-game__character-objective">
              <span>Current objective</span>
              <p>{characterSummary.objective}</p>
            </div>
          </section>
        </div>
      )}

      {activeDiscoverable && (
        <div
          className="weed-goblins-game__discoverable-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveDiscoverable(null)
          }}
        >
          <section
            className="weed-goblins-game__discoverable-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="weed-goblins-discoverable-title"
          >
            <button
              type="button"
              className="weed-goblins-game__discoverable-close"
              onClick={() => setActiveDiscoverable(null)}
              aria-label="Close information"
            >
              ×
            </button>
            <h2 id="weed-goblins-discoverable-title">{activeDiscoverable.title}</h2>
            <p>{activeDiscoverable.body}</p>
            {activeDiscoverable.action && discoverableActionAvailable(activeDiscoverable.action) && (
              <button
                type="button"
                className="weed-goblins-game__discoverable-action"
                onClick={() => handleDiscoverableAction(activeDiscoverable.action)}
              >
                {activeDiscoverable.action.label}
              </button>
            )}
          </section>
        </div>
      )}

      {!loading && !fatalError && (
        <footer className="weed-goblins-game__controls">
          <div className="weed-goblins-game__controls-inner">
            {actionError && (
              <div className="weed-goblins-game__action-error" role="alert">{actionError}</div>
            )}

            {state?.status === 'completed' ? (
              <button type="button" className="weed-goblins-game__play-again" onClick={restartRun}>
                Start another run
              </button>
            ) : (
              <>
                {choices.length > 0 && (
                  <div className="weed-goblins-game__quick-replies" aria-label="Reply choices">
                    {choices.map((choice) => (
                      <button
                        key={choice.id}
                        type="button"
                        className="weed-goblins-game__quick-reply"
                        onClick={() => handleChoice(choice)}
                        disabled={busy || Boolean(pendingTurn)}
                      >
                        {choice.label}
                      </button>
                    ))}
                  </div>
                )}

                {sessionTextOpen ? (
                  <MessageComposer
                    id="weed-goblins-session-input"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onSubmit={handleSessionTextSubmit}
                    placeholder={state?.sceneId === 'session-zero-name'
                      ? 'Message Eliza a name...'
                      : 'Describe yourself...'}
                    ariaLabel={state?.sceneId === 'session-zero-name'
                      ? 'Message Eliza a name'
                      : 'Describe yourself to Eliza'}
                    disabled={!canSessionType}
                    submitDisabled={!canSessionType || (state?.sceneId === 'session-zero-look' && !draft.trim())}
                    voiceAvailable={Boolean(SpeechRecognition)}
                    voiceDisabled={!canSessionType}
                    listening={listening}
                    onVoiceToggle={toggleVoiceInput}
                  />
                ) : freeTextOpen && !pendingTurn ? (
                  <MessageComposer
                    id="weed-goblins-custom-action"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onSubmit={handleTextSubmit}
                    placeholder="Message Eliza..."
                    ariaLabel="Message Eliza another action"
                    disabled={!canType}
                    submitDisabled={!canType || !draft.trim()}
                    voiceAvailable={Boolean(SpeechRecognition)}
                    voiceDisabled={!canType}
                    listening={listening}
                    onVoiceToggle={toggleVoiceInput}
                  />
                ) : (
                  <MessageComposer
                    id="weed-goblins-disabled-composer"
                    value=""
                    onChange={() => {}}
                    onSubmit={(event) => event.preventDefault()}
                    placeholder={composerPlaceholder}
                    ariaLabel="Message input unavailable"
                    disabled
                    submitDisabled
                    voiceAvailable={Boolean(SpeechRecognition)}
                    voiceDisabled
                    listening={false}
                    onVoiceToggle={toggleVoiceInput}
                  />
                )}
              </>
            )}
          </div>
        </footer>
      )}
    </main>
  )
}
