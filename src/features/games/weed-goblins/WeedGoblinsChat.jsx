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
  resolveWeedGoblinsTransitionWithStaticFallback,
  selectWeedGoblinsChatChoice,
} from './weedGoblinsChatController.js'
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

function RollBadge({ value }) {
  return (
    <span
      className="weed-goblins-chat__roll-badge"
      aria-label={`D20 result ${value}`}
      title={`D20: ${value}`}
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
        <text
          className="weed-goblins-chat__d20-number"
          x="12"
          y="12"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {value}
        </text>
      </svg>
    </span>
  )
}

function MessageBubble({ message }) {
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
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [fatalError, setFatalError] = useState('')
  const endRef = useRef(null)
  const resolvedSeed = useMemo(() => seed || makeRunSeed(), [seed])
  const contactInitial = CHAT_CONTACT_DISPLAY_NAME.trim().charAt(0).toUpperCase() || '?'

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
  }, [messages, busy])

  async function handleChoice(action) {
    if (!state || busy || state.status === 'completed') return

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

    if (transition.after.status === 'completed') {
      try {
        await saveWeedGoblinsRunSummary({
          runSummary: transition.after.runSummary,
        })
      } catch {
        // The UI remains playable in dev/test environments without writable browser storage.
      }
      setChoices([])
    } else {
      setChoices(getWeedGoblinsQuickReplies(transition.after))
    }

    setBusy(false)
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
          <MessageBubble key={`${message.direction}-${index}-${message.actionId || 'message'}`} message={message} />
        ))}
        <div ref={endRef} />
      </section>

      <footer className="weed-goblins-chat__composer-area">
        {!loading && !fatalError && choices.length > 0 && (
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

        <div className="weed-goblins-chat__composer">
          <button type="button" className="weed-goblins-chat__composer-icon" disabled aria-hidden="true">+</button>
          <input
            className="weed-goblins-chat__input"
            aria-label="Message"
            placeholder={state?.status === 'completed' ? 'Conversation ended' : 'Message'}
            readOnly
            value=""
          />
          <button type="button" className="weed-goblins-chat__send" disabled aria-label="Send message">↑</button>
        </div>
      </footer>
    </main>
  )
}
