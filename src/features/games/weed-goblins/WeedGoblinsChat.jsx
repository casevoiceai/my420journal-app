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
import './WeedGoblinsChat.css'

const SCENE_NAMES = Object.freeze({
  'choose-background': 'Choose Your Background',
  'choose-route': 'Choose Your Road',
  'goblin-encounter': 'Goblin Ambush',
  midpoint: 'The Keep Gate',
  'goblin-king': 'The Goblin King',
  ending: 'Quest Complete',
})

const BACKGROUND_DETAILS = Object.freeze({
  'background:hauler': 'Strength 3  |  Defense 1  |  Mana 2',
  'background:keeper': 'Strength 1  |  Defense 3  |  Mana 2',
  'background:adept': 'Strength 1  |  Defense 2  |  Mana 4',
})

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

function actionDetail(state, action) {
  if (BACKGROUND_DETAILS[action.id]) return BACKGROUND_DETAILS[action.id]
  if (action.id === 'route:ridge') return 'Open ground  |  Strength check'
  if (action.id === 'route:fen') return 'Hidden approach  |  Defense check'
  if (action.id === 'goblin:strike') return 'Force a path  |  Strength check'
  if (action.id === 'goblin:guard') return 'Hold your ground  |  Defense check'
  if (action.id === 'goblin:channel') return 'Spend 1 Mana  |  Roll with advantage'
  if (action.id === 'midpoint:help') return 'Gain an ally  |  No roll'
  if (action.id === 'midpoint:take-charm') return 'Risk the alarm  |  Defense check'
  if (action.id === 'midpoint:read-runes') return 'Spend 1 Mana  |  Read the throne gate'
  if (action.id === 'midpoint:skip') return 'Press on now  |  No roll'
  if (action.id === 'boss:overpower') return 'Take back the item  |  Strength check'
  if (action.id === 'boss:outlast') return 'Break his control  |  Defense check'
  if (action.id === 'boss:spell') return 'Spend 2 Mana  |  Roll with advantage'
  if (action.id === 'boss:bargain') return 'Call your ally  |  Secure a bargain'
  return state?.sceneId === 'choose-background' ? 'Choose your adventurer' : 'Advance the quest'
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

function Stat({ label, value, danger = false }) {
  return (
    <div className={`weed-goblins-game__stat${danger ? ' is-danger' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function StoryEntry({ message, onRoll, canRoll, busy }) {
  if (message.kind === 'roll-trigger') {
    return (
      <div className="weed-goblins-game__roll-panel">
        <p>The outcome hangs on a d20.</p>
        <button type="button" onClick={onRoll} disabled={!canRoll || busy}>
          <D20Icon />
          <span>{canRoll ? 'Roll the die' : 'Die rolled'}</span>
        </button>
      </div>
    )
  }

  if (message.kind === 'roll-result') {
    return (
      <div className="weed-goblins-game__roll-result" aria-label={`D20 result ${message.die}`}>
        <span>Roll result</span>
        <D20Icon value={message.die} size={54} />
      </div>
    )
  }

  if (message.direction === 'outgoing') {
    return (
      <article className="weed-goblins-game__story-entry is-player">
        <div className="weed-goblins-game__entry-label">Your move</div>
        <p>{message.text}</p>
      </article>
    )
  }

  return (
    <article className="weed-goblins-game__story-entry is-narrator">
      <div className="weed-goblins-game__narrator-mark" aria-hidden="true">S</div>
      <div className="weed-goblins-game__entry-copy">
        <div className="weed-goblins-game__entry-label">S.T.O.N.E.R. narrates</div>
        <p>{message.text}</p>
      </div>
      {message.die !== null && message.die !== undefined && (
        <D20Icon value={message.die} size={42} />
      )}
    </article>
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
  const [runNumber, setRunNumber] = useState(0)
  const endRef = useRef(null)
  const resolvedSeed = useMemo(
    () => seed ? `${seed}:${runNumber}` : makeRunSeed(),
    [seed, runNumber],
  )
  const freeTextOpen = isWeedGoblinsFreeTextScene(state)
  const canType = freeTextOpen && !pendingTurn && !busy && state?.status !== 'completed'
  const sceneName = SCENE_NAMES[state?.sceneId] || 'Entering the Highlands'

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

  useEffect(() => {
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
      const transition = selectWeedGoblinsChatChoice(baseState, action)
      const optimisticMessages = [...baseMessages, transition.outgoingMessage]
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
    } catch {
      setState(baseState)
      setMessages(baseMessages)
      setChoices(getWeedGoblinsQuickReplies(baseState))
      setActionError('That move did not resolve. Choose it again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleTextSubmit(event) {
    event?.preventDefault()
    const text = draft.trim()
    if (!state || !canType || !text) return
    setActionError('')
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
      setChoices(getWeedGoblinsQuickReplies(state))
      setActionError('That custom move could not be resolved. Edit it or choose an action below.')
    } finally {
      setBusy(false)
    }
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

  function restartRun() {
    setState(null)
    setMessages([])
    setChoices([])
    setDraft('')
    setPendingTurn(null)
    setFatalError('')
    setActionError('')
    setLoading(true)
    setRunNumber((current) => current + 1)
  }

  return (
    <main className="weed-goblins-game" aria-label="Weed Goblins adventure">
      <header className="weed-goblins-game__header">
        <button type="button" className="weed-goblins-game__back" onClick={() => navigate(-1)} aria-label="Leave adventure">
          <span aria-hidden="true">‹</span>
        </button>
        <div className="weed-goblins-game__title-group">
          <div className="weed-goblins-game__eyebrow">Chapter 1 · Quest 1</div>
          <h1>Weed Goblins</h1>
          <p>{sceneName}</p>
        </div>
        <div className="weed-goblins-game__crest" aria-hidden="true">WG</div>
      </header>

      <section className="weed-goblins-game__quest-bar" aria-label="Quest status">
        <div className="weed-goblins-game__objective">
          <span>Objective</span>
          <strong>{state?.stolenItem ? `Take ${state.stolenItem} back from the Goblin King` : 'Enter the Goblin Highlands'}</strong>
        </div>
        {state?.background && (
          <div className="weed-goblins-game__stats" aria-label="Character stats">
            <Stat label="STR" value={state.stats.strength} />
            <Stat label="DEF" value={state.stats.defense} />
            <Stat label="MANA" value={`${state.stats.manaPool}/${state.stats.maxMana}`} />
            <Stat label="TROUBLE" value={`${state.trouble}/3`} danger={state.trouble >= 2} />
          </div>
        )}
      </section>

      <section className="weed-goblins-game__story" aria-live="polite" aria-busy={busy}>
        <div className="weed-goblins-game__story-heading">
          <span>Adventure log</span>
          <span>{sceneName}</span>
        </div>
        {loading && (
          <div className="weed-goblins-game__loading">
            <D20Icon />
            <span>Opening the road...</span>
          </div>
        )}
        {!loading && fatalError && <div className="weed-goblins-game__error">{fatalError}</div>}
        {messages.map((message, index) => (
          <StoryEntry
            key={`${message.kind || 'message'}-${message.direction}-${index}-${message.actionId || 'story'}`}
            message={message}
            onRoll={handleRoll}
            canRoll={Boolean(pendingTurn) && message.kind === 'roll-trigger' && index === messages.length - 1}
            busy={busy}
          />
        ))}
        {busy && <div className="weed-goblins-game__resolving">S.T.O.N.E.R. is resolving the move...</div>}
        <div ref={endRef} />
      </section>

      {!loading && !fatalError && (
        <footer className="weed-goblins-game__actions">
          {actionError && <div className="weed-goblins-game__action-error" role="alert">{actionError}</div>}
          {state?.status === 'completed' ? (
            <button type="button" className="weed-goblins-game__play-again" onClick={restartRun}>
              Begin a new run
            </button>
          ) : (
            <>
              {choices.length > 0 && (
                <div className="weed-goblins-game__action-block">
                  <div className="weed-goblins-game__action-heading">
                    <h2>{state?.sceneId === 'choose-background' ? 'Choose your adventurer' : 'Choose your action'}</h2>
                    <span>{choices.length} available</span>
                  </div>
                  <div className="weed-goblins-game__action-grid">
                    {choices.map((choice, index) => (
                      <button
                        key={choice.id}
                        type="button"
                        className="weed-goblins-game__action-card"
                        onClick={() => handleChoice(choice)}
                        disabled={busy || Boolean(pendingTurn)}
                      >
                        <span className="weed-goblins-game__action-number">{index + 1}</span>
                        <span className="weed-goblins-game__action-copy">
                          <strong>{choice.label}</strong>
                          <small>{actionDetail(state, choice)}</small>
                        </span>
                        <span className="weed-goblins-game__action-arrow" aria-hidden="true">›</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {freeTextOpen && !pendingTurn && (
                <form className="weed-goblins-game__custom-action" onSubmit={handleTextSubmit}>
                  <label htmlFor="weed-goblins-custom-action">Try another action</label>
                  <div>
                    <input
                      id="weed-goblins-custom-action"
                      aria-label="Describe another action"
                      placeholder="Describe what your character does"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      maxLength={160}
                      disabled={!canType}
                    />
                    <button type="submit" disabled={!canType || !draft.trim()}>Attempt</button>
                  </div>
                </form>
              )}
            </>
          )}
        </footer>
      )}
    </main>
  )
}
