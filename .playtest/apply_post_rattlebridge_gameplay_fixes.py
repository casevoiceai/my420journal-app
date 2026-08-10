from pathlib import Path


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing expected source for {label}')
    return text.replace(old, new, 1)


chat_path = Path('src/features/games/weed-goblins/WeedGoblinsChat.jsx')
chat = chat_path.read_text()

chat = replace_once(
    chat,
    "  prepareWeedGoblinsFreeTextTurn,\n  prepareWeedGoblinsQuickReplyTurn,",
    "  prepareWeedGoblinsChoiceTurn,\n  prepareWeedGoblinsFreeTextTurn,\n  prepareWeedGoblinsQuickReplyTurn,",
    'direct built-in choice preparation import',
)
chat = replace_once(
    chat,
    "import { buildWeedGoblinsCharacterSummary } from './weedGoblinsCharacterSummary.js'\n",
    "import { buildWeedGoblinsCharacterSummary } from './weedGoblinsCharacterSummary.js'\nimport { buildWeedGoblinsChapterEndState } from './weedGoblinsChapterEnd.js'\n",
    'chapter end import',
)

helpers = '''function sameChatMessage(left, right) {
  if (!left || !right) return false
  return left.direction === right.direction
    && left.kind === right.kind
    && left.text === right.text
    && (left.actionId || '') === (right.actionId || '')
    && left.source === right.source
}

function rollbackPendingTurnMessages(currentMessages, pendingTurn) {
  const next = Array.isArray(currentMessages) ? [...currentMessages] : []
  const staged = [
    pendingTurn?.rollTriggerMessage,
    pendingTurn?.setupMessage,
    pendingTurn?.outgoingMessage,
  ].filter(Boolean)
  for (const target of staged) {
    const last = next.at(-1)
    if (sameChatMessage(last, target)) next.pop()
  }
  return next
}

function isBuiltInChoice(action) {
  return Boolean(
    action?.id
      && action?.inputMode !== 'free-text'
      && !String(action.id).startsWith('suggested:'),
  )
}

'''
chat = replace_once(
    chat,
    'export default function WeedGoblinsChat({ seed = null } = {}) {\n',
    helpers + 'export default function WeedGoblinsChat({ seed = null } = {}) {\n',
    'pending turn helpers',
)

chat = replace_once(
    chat,
    'function StoryEntry({ message, onRoll, canRoll, busy, state, onOpenDiscoverable }) {',
    'function StoryEntry({ message, onRoll, onReconsider, canRoll, busy, state, onOpenDiscoverable }) {',
    'story entry reconsider handler',
)
old_roll = '''      <div className="weed-goblins-game__roll-row">
        <button
          type="button"
          className="weed-goblins-game__roll-button"
          onClick={onRoll}
          disabled={!canRoll || busy}
        >
          <D20Icon size={30} />
          <span>{canRoll ? 'Roll D20' : 'Rolled'}</span>
        </button>
      </div>'''
new_roll = '''      <div className="weed-goblins-game__roll-row">
        <button
          type="button"
          className="weed-goblins-game__roll-button"
          onClick={onRoll}
          disabled={!canRoll || busy}
        >
          <D20Icon size={30} />
          <span>{canRoll ? 'Roll D20' : 'Rolled'}</span>
        </button>
        {canRoll && (
          <button
            type="button"
            className="weed-goblins-game__reconsider-button"
            onClick={onReconsider}
            disabled={busy}
          >
            Choose differently
          </button>
        )}
      </div>'''
chat = replace_once(chat, old_roll, new_roll, 'roll reconsider control')

chat = replace_once(
    chat,
    "  const [localUserId, setLocalUserId] = useState(null)\n",
    "  const [localUserId, setLocalUserId] = useState(null)\n  const [previousRunsAtStart, setPreviousRunsAtStart] = useState([])\n  const [failedChoiceIds, setFailedChoiceIds] = useState([])\n",
    'gameplay safeguard state',
)
chat = replace_once(
    chat,
    "  const characterSummary = useMemo(() => buildWeedGoblinsCharacterSummary(state), [state])\n",
    "  const characterSummary = useMemo(() => buildWeedGoblinsCharacterSummary(state), [state])\n  const chapterEndState = useMemo(\n    () => buildWeedGoblinsChapterEndState(state, previousRunsAtStart),\n    [state, previousRunsAtStart],\n  )\n  const visibleChoices = useMemo(\n    () => choices.filter((choice) => !failedChoiceIds.includes(choice.id)),\n    [choices, failedChoiceIds],\n  )\n",
    'chapter end and visible choices',
)
chat = replace_once(
    chat,
    "      setLocalUserId(userId)\n      setBlockedRealNames(blockedNames)\n",
    "      setLocalUserId(userId)\n      setBlockedRealNames(blockedNames)\n      setPreviousRunsAtStart(Array.isArray(snapshot.previousRuns) ? snapshot.previousRuns : [])\n",
    'remember previous runs for end state',
)

scene_effect = '''  useEffect(() => {
    setFailedChoiceIds([])
  }, [state?.sceneId])

'''
chat = replace_once(
    chat,
    "  useEffect(() => () => {\n    if (crestHoldTimerRef.current) clearTimeout(crestHoldTimerRef.current)\n",
    scene_effect + "  useEffect(() => () => {\n    if (crestHoldTimerRef.current) clearTimeout(crestHoldTimerRef.current)\n",
    'failed choice reset on scene change',
)

old_prepare = '''      const prepared = await prepareWeedGoblinsQuickReplyTurn({
        state: baseState,
        action,
        blockedRealNames,
      })'''
new_prepare = '''      let prepared
      try {
        prepared = await prepareWeedGoblinsQuickReplyTurn({
          state: baseState,
          action,
          blockedRealNames,
        })
      } catch (error) {
        if (!isBuiltInChoice(action)) throw error
        prepared = prepareWeedGoblinsChoiceTurn({ state: baseState, action })
      }'''
chat = replace_once(chat, old_prepare, new_prepare, 'built-in choice deterministic fallback')

old_choice_catch = '''    } catch {
      setState(baseState)
      setMessages(baseMessages)
      setChoices(getWeedGoblinsQuickReplies(baseState))
      setActionError('That move did not resolve. Choose it again.')
    } finally {'''
new_choice_catch = '''    } catch {
      setState(baseState)
      setMessages(baseMessages)
      setChoices(getWeedGoblinsQuickReplies(baseState))
      if (action?.id) {
        setFailedChoiceIds((current) => current.includes(action.id) ? current : [...current, action.id])
      }
      setActionError('That option could not resolve and has been removed from this scene. Choose another approach.')
    } finally {'''
chat = replace_once(chat, old_choice_catch, new_choice_catch, 'failed choice removal safeguard')

reconsider = '''  function handleChooseDifferently() {
    if (!pendingTurn || busy) return
    const before = pendingTurn.before
    const restoredMessages = rollbackPendingTurnMessages(messages, pendingTurn)
    const nextChoices = getWeedGoblinsQuickReplies(before)
      .filter((choice) => !failedChoiceIds.includes(choice.id))
    const restoredDraft = pendingTurn.plan?.kind === 'built-in-choice'
      ? ''
      : String(pendingTurn.plan?.playerAction || '')

    setActionError('')
    setPendingTurn(null)
    setState(before)
    setMessages(restoredMessages)
    setChoices(nextChoices)
    setDraft(restoredDraft)
    persistStableRun({
      nextState: before,
      nextMessages: restoredMessages,
      nextChoices,
      nextPendingTurn: null,
    })
  }

'''
chat = replace_once(
    chat,
    '  async function handleRoll() {\n',
    reconsider + '  async function handleRoll() {\n',
    'choose differently handler',
)

chat = replace_once(
    chat,
    "    setHelpMessage(null)\n    if (speechRecognitionRef.current?.abort) speechRecognitionRef.current.abort()\n",
    "    setHelpMessage(null)\n    setFailedChoiceIds([])\n    if (speechRecognitionRef.current?.abort) speechRecognitionRef.current.abort()\n",
    'restart failed choices reset',
)

chat = replace_once(
    chat,
    "              onRoll={handleRoll}\n              canRoll={Boolean(pendingTurn) && message.kind === 'roll-trigger' && index === messages.length - 1}\n",
    "              onRoll={handleRoll}\n              onReconsider={handleChooseDifferently}\n              canRoll={Boolean(pendingTurn) && message.kind === 'roll-trigger' && index === messages.length - 1}\n",
    'pass reconsider handler',
)

chat = replace_once(
    chat,
    '''            {state?.status === 'completed' ? (
              <button type="button" className="weed-goblins-game__play-again" onClick={restartRun}>
                Start another run
              </button>
            ) : (''',
    '''            {state?.status === 'completed' ? (
              <section className={`weed-goblins-game__chapter-end is-${chapterEndState?.outcomeKind || 'completed'}`} aria-label="Chapter run result">
                <strong>{chapterEndState?.title || 'Run complete'}</strong>
                <p>{chapterEndState?.body || state?.runSummary?.outcomeSummary || 'This attempt is complete.'}</p>
                <p className="weed-goblins-game__chapter-end-next">
                  {chapterEndState?.continuation || 'The next step is not available yet.'}
                </p>
                <button type="button" className="weed-goblins-game__play-again" onClick={restartRun}>
                  {chapterEndState?.buttonLabel || 'Replay this chapter'}
                </button>
              </section>
            ) : (''',
    'explicit chapter end state',
)

chat = replace_once(
    chat,
    '''                {choices.length > 0 && (
                  <div className="weed-goblins-game__quick-replies" aria-label="Reply choices">
                    {choices.map((choice) => (''',
    '''                {visibleChoices.length > 0 && (
                  <div className="weed-goblins-game__quick-replies" aria-label="Reply choices">
                    {visibleChoices.map((choice) => (''',
    'filter failed visible choices',
)

chat = replace_once(
    chat,
    "    if (action.kind === 'engine') {\n      return getWeedGoblinsQuickReplies(state).some((choice) => choice.id === action.id)\n",
    "    if (action.kind === 'engine') {\n      if (failedChoiceIds.includes(action.id)) return false\n      return getWeedGoblinsQuickReplies(state).some((choice) => choice.id === action.id)\n",
    'failed discoverable action availability',
)

for required in [
    'Choose differently',
    'prepareWeedGoblinsChoiceTurn',
    'failedChoiceIds',
    'buildWeedGoblinsChapterEndState',
    'That option could not resolve and has been removed from this scene.',
]:
    if required not in chat:
        raise SystemExit(f'required gameplay fix missing from chat: {required}')

chat_path.write_text(chat)

css_path = Path('src/features/games/weed-goblins/WeedGoblinsChat.css')
css = css_path.read_text()
css = replace_once(
    css,
    '''.weed-goblins-game__roll-row,
.weed-goblins-game__roll-result {
  width: 100%;
  display: flex;
  justify-content: center;
  margin: 11px 0;
}''',
    '''.weed-goblins-game__roll-row,
.weed-goblins-game__roll-result {
  width: 100%;
  display: flex;
  justify-content: center;
  margin: 11px 0;
}

.weed-goblins-game__roll-row {
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}''',
    'roll row reconsider layout',
)
css = replace_once(
    css,
    '''.weed-goblins-game__roll-button:disabled {
  cursor: default;
  opacity: 0.5;
}

.weed-goblins-game__roll-result {''',
    '''.weed-goblins-game__roll-button:disabled {
  cursor: default;
  opacity: 0.5;
}

.weed-goblins-game__reconsider-button {
  min-height: 40px;
  padding: 7px 13px;
  border: 1px solid #c8ccd2;
  border-radius: 20px;
  background: #ffffff;
  color: #4f555d;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.weed-goblins-game__reconsider-button:hover:not(:disabled),
.weed-goblins-game__reconsider-button:focus-visible {
  border-color: #9ca3ad;
  background: #f3f5f7;
  outline: none;
}

.weed-goblins-game__reconsider-button:disabled {
  cursor: default;
  opacity: 0.5;
}

.weed-goblins-game__roll-result {''',
    'reconsider button style',
)
css = replace_once(
    css,
    '''.weed-goblins-game__play-again {
  width: 100%;''',
    '''.weed-goblins-game__chapter-end {
  width: 100%;
  padding: 12px;
  border: 1px solid #d7dbe1;
  border-radius: 14px;
  background: #f8f9fb;
}

.weed-goblins-game__chapter-end.is-failed {
  border-color: #e6c8c5;
  background: #fff7f6;
}

.weed-goblins-game__chapter-end strong {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
}

.weed-goblins-game__chapter-end p {
  margin: 0 0 7px;
  color: #555a61;
  font-size: 12.5px;
  line-height: 1.4;
}

.weed-goblins-game__chapter-end .weed-goblins-game__chapter-end-next {
  margin-bottom: 10px;
  color: #34383f;
  font-weight: 650;
}

.weed-goblins-game__play-again {
  width: 100%;''',
    'chapter end styles',
)

for required in [
    '.weed-goblins-game__reconsider-button',
    '.weed-goblins-game__chapter-end',
]:
    if required not in css:
        raise SystemExit(f'required gameplay style missing: {required}')
css_path.write_text(css)

print('POST_RATTLEBRIDGE_GAMEPLAY_FIXES_APPLIED')
