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
  narrateWeedGoblinsResolvedTurn,
  prepareWeedGoblinsFreeTextTurn,
  resolveWeedGoblinsPreparedMechanics,
  resolveWeedGoblinsPreparedTurn,
  resolveWeedGoblinsTransitionWithStaticFallback,
  selectWeedGoblinsChatChoice,
} from './weedGoblinsChatController.js'
import { WEED_GOBLINS_PROGRESS_LABEL } from './weedGoblinsProgression.js'
import './WeedGoblinsChat.css'

const CHAT_CONTACT_DISPLAY_NAME = 'Alex'

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

function RollBadge({ value = null }) {
  const resolved = Number.isInteger(value) && value >= 1 && value <= 20
  return (
    <span
      className={`weed-goblins-chat__roll-badge${resolved ? ' is-resolved' : ''}`}
      aria-label={resolved ? `D20 result ${value}` : 'D20'}
      title={resolved ? `D20: ${value}` : 'D20'}
    >
      <svg
        className="weed-goblins-chat__d20"
        viewBox="0 0 24 24"
        width="36"
        height="36"
        fill="none"
        aria-hidden="true"
      >
        <path
          className="weed-goblins-chat__d20-face"
          d="M12 2 L21 7.5 L21 16.5 L12 22 L3 16.5 L3 7.5 Z"
        />
        <path
          className="weed-goblins-chat__d20-edges"
          d="M12 2 L12 22 M3 7.5 L21 16.5 M21 7.5 L3 16.5 M3 7.5 L12 12 L21 7.5 M3 16.5 L12 12 L21 16.5"
        />
        {resolved && (
          <text
            className="weed-goblins-chat__d20-number"
            x="12"
            y="12"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {value}
          </text>
        )}
      </svg>
    </span>
  )
}

function MessageBubble({ message, onRoll, canRoll, busy }) {
  if (message.kind === 'roll-trigger') {
    return (
      <div className="weed-goblins-chat__message-row is-incoming">
        <div className="weed-goblins-chat__bubble is-incoming is-roll-step">
          <button
            type="button"
            className="weed-goblins-chat__roll-trigger"
            onClick={onRoll}
            disabled={!canRoll || busy}
          >
            <RollBadge />
            <span>{canRoll ? 'Roll d20' : 'Rolled'}</span>
          </button>
        </div>
      </div>
    )
  }

  if (message.kind === 'roll-result') {
    return (
      <div className="weed-goblins-chat__message-row is-incoming">
        <div className="weed-goblins-chat__bubble is-incoming is-roll-result">
          <RollBadge value={message.die} />
        </div>
      </div>
    )
  }

  return (
    <div className={`weed-goblins-chat__message-row is-${message.direction}`}>
      <div className={`weed-goblins-chat__bubble is-${message.direction}`}>
        <span>{message.text}</span>
        {message.die !== null && message.die !== undefined && (
          <span className="weed-goblins-chat__bubble-meta">
            <RollBadge value={message.die} />
          </span>
        )}
      </div>
    </div>
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
  const endRef = useRef(null)
  const resolvedSeed = useMemo(() => seed || makeRunSeed(), [seed])
  const contactInitial = CHAT_CONTACT_DISPLAY_NAME.trim().charAt(0).toUpperCase() || '?'
  const freeTextOpen = isWeedGoblinsFreeTextScene(state)
  const canType = freeTextOpen && !pendingTurn && !busy && state?.status !== 'completed'

  useEffect(() => {
    let cancelled = false

    async function start() {
      const snapshot = await loadSnapshotWithFallback()
      if (cancelled) return

      const blockedNames = Array.isArray(snapshot.productNames)
        ? snapshot.productNames
        : []
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
        session = await createWeedGoblinsChatSession({
          ...options,
          generateNarration: staticNarration,
        })
      }

      if (cancelled) return
      setState(session.state)
      setMessages(session.messages)
      setChoices(session.choices)
      setLoading(false)
    }

    start().catch(() => {
      if (cancelled) return
      setFatalError('This conversation could not be started.')
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [resolvedSeed])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, busy, pendingTurn])

  async function saveCompletedRun(nextState) {
    if (nextState.status !== 'completed') return
    try {
      await saveWeedGoblinsRunSummary({ runSummary: nextState.runSummary })
    } catch {
      // Dev/test environments can remain playable without writable browser storage.
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

    setBusy(true)
    setChoices([])

    let transition
    try {
      transition = selectWeedGoblinsChatChoice(state, action)
    } catch {
      setChoices(getWeedGoblinsQuickReplies(state))
      setBusy(false)
      return
    }

    const optimisticMessages = [...messages, transition.outgoingMessage]
    setState(transition.after)
    setMessages(optimisticMessages)

    const incomingMessages = await resolveWeedGoblinsTransitionWithStaticFallback({
      before: transition.before,
      after: transition.after,
      blockedRealNames,
    })

    setMessages([...optimisticMessages, ...incomingMessages])
    setChoices(getWeedGoblinsQuickReplies(transition.after))
    await saveCompletedRun(transition.after)
    setBusy(false)
  }

  async function handleTextSubmit(event) {
    event?.preventDefault()
    const text = draft.trim()
    if (!state || !canType || !text) return

    setBusy(true)
    setChoices([])

    try {
      const prepared = await prepareWeedGoblinsFreeTextTurn({
        state,
        playerAction: text,
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
      setDraft(text)
    }

    setBusy(false)
  }

  async function handleRoll() {
    if (!pendingTurn || busy) return
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
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="weed-goblins-chat" aria-label={`Conversation with ${CHAT_CONTACT_DISPLAY_NAME}`}>
      <header className="weed-goblins-chat__header">
        <button
          type="button"
          className="weed-goblins-chat__back"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          ‹
        </button>
        <div className="weed-goblins-chat__contact">
          <div className="weed-goblins-chat__avatar" aria-hidden="true">{contactInitial}</div>
          <div>
            <div className="weed-goblins-chat__contact-name">{CHAT_CONTACT_DISPLAY_NAME}</div>
            <div className="weed-goblins-chat__contact-detail">messages</div>
          </div>
        </div>
        <div className="weed-goblins-chat__header-spacer" aria-hidden="true" />
      </header>

      <section className="weed-goblins-chat__thread" aria-live="polite">
        {!loading && !fatalError && (
          <div
            aria-label={WEED_GOBLINS_PROGRESS_LABEL}
            style={{
              margin: '0 auto 16px',
              color: '#879089',
              fontSize: '11px',
              lineHeight: 1.2,
              textAlign: 'center',
              letterSpacing: '0.02em',
            }}
          >
            {WEED_GOBLINS_PROGRESS_LABEL}
          </div>
        )}

        {loading && (
          <div className="weed-goblins-chat__message-row is-incoming">
            <div className="weed-goblins-chat__bubble is-incoming">…</div>
          </div>
        )}

        {!loading && fatalError && (
          <div className="weed-goblins-chat__message-row is-incoming">
            <div className="weed-goblins-chat__bubble is-incoming">{fatalError}</div>
          </div>
        )}

        {messages.map((message, index) => (
          <MessageBubble
            key={`${message.kind || 'message'}-${message.direction}-${index}-${message.actionId || 'message'}`}
            message={message}
            onRoll={handleRoll}
            canRoll={Boolean(pendingTurn)
              && message.kind === 'roll-trigger'
              && index === messages.length - 1}
            busy={busy}
          />
        ))}
        <div ref={endRef} />
      </section>

      <footer className="weed-goblins-chat__composer-area">
        {!loading && !fatalError && choices.length > 0 && !freeTextOpen && (
          <div className="weed-goblins-chat__quick-replies" aria-label="Suggested replies">
            {choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className="weed-goblins-chat__quick-reply"
                onClick={() => handleChoice(choice)}
                disabled={busy}
              >
                {choice.label}
              </button>
            ))}
          </div>
        )}

        <form className="weed-goblins-chat__composer" onSubmit={handleTextSubmit}>
          <button type="button" className="weed-goblins-chat__composer-icon" disabled aria-hidden="true">+</button>
          <input
            className="weed-goblins-chat__input"
            aria-label="Message"
            placeholder={state?.status === 'completed'
              ? 'Conversation ended'
              : pendingTurn
                ? 'Roll first'
                : freeTextOpen
                  ? 'What do you do?'
                  : 'Message'}
            readOnly={!canType}
            value={freeTextOpen ? draft : ''}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={160}
          />
          <button
            type="submit"
            className="weed-goblins-chat__send"
            disabled={!canType || !draft.trim()}
            aria-label="Send message"
          >
            ↑
          </button>
        </form>
      </footer>
    </main>
  )
}
