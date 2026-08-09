from pathlib import Path
import re

ROOT = Path('src/features/games/weed-goblins')


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}_COUNT_{count}')
    return text.replace(old, new, 1)


# Extend completed-run storage into strict Chapter 1 campaign memory.
adapter_path = ROOT / 'weedGoblinsLocalDataAdapter.js'
adapter = adapter_path.read_text()
adapter = replace_once(
    adapter,
    "import { attachWeedGoblinsProgressionMetadata } from './weedGoblinsProgression.js'\n",
    "import { attachWeedGoblinsProgressionMetadata } from './weedGoblinsProgression.js'\nimport { CHAPTER_ONE_REWARDS } from './weedGoblinsChapterOne.js'\n",
    'ADAPTER_IMPORT',
)
adapter = replace_once(
    adapter,
    "export const WEED_GOBLINS_RUNS_STORAGE_PREFIX =\n  'my420journal_local_v1:weed_goblins_runs'\n",
    "export const WEED_GOBLINS_RUNS_STORAGE_PREFIX =\n  'my420journal_local_v1:weed_goblins_runs'\nexport const WEED_GOBLINS_CAMPAIGN_STORAGE_PREFIX =\n  'my420journal_local_v1:weed_goblins_campaign'\nexport const WEED_GOBLINS_CAMPAIGN_VERSION = 1\n",
    'CAMPAIGN_CONSTANTS',
)
adapter = replace_once(
    adapter,
    "const RUN_SUMMARY_FIELDS = Object.freeze([\n  'adventureId',",
    "const RUN_SUMMARY_FIELDS = Object.freeze([\n  'adventureId',\n  'seed',",
    'SUMMARY_SEED',
)

old_sanitizer = re.search(
    r"function sanitizeRunSummary\(summary\) \{.*?\n\}\n\nfunction sanitizePreviousRuns",
    adapter,
    flags=re.S,
)
if not old_sanitizer:
    raise SystemExit('SUMMARY_SANITIZER_NOT_FOUND')
new_sanitizer = r'''const CHAPTER_ONE_BRANCH_RULES = Object.freeze({
  nibTreatment: new Set(['safe', 'bait', 'ignored']),
  tributeArrangement: new Set(['exposed', 'protected', 'unknown']),
  kingTreatment: new Set(['spared', 'humiliated', 'unresolved']),
  stolenItemCondition: new Set(['intact', 'altered', 'not-recovered']),
})

const CHAPTER_ONE_REWARD_VALUES = new Set(Object.values(CHAPTER_ONE_REWARDS))

function sanitizeChapterOneBranches(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const safe = {}
  for (const [field, allowed] of Object.entries(CHAPTER_ONE_BRANCH_RULES)) {
    const text = cleanText(value[field])
    if (allowed.has(text)) safe[field] = text
  }
  return Object.keys(safe).length > 0 ? safe : null
}

function sanitizeChapterOneRewards(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map(cleanText).filter((reward) => CHAPTER_ONE_REWARD_VALUES.has(reward)))]
}

function sanitizeRunSummary(summary) {
  if (!summary || typeof summary !== 'object' || Array.isArray(summary)) return null
  const safe = {}
  for (const field of RUN_SUMMARY_FIELDS) {
    const value = summary[field]
    if (typeof value === 'string') {
      const text = cleanText(value)
      if (text) safe[field] = text
    } else if (typeof value === 'number') {
      const number = safeInteger(value)
      if (number !== null) safe[field] = number
    }
  }

  const chapterOneBranches = sanitizeChapterOneBranches(summary.chapterOneBranches)
  if (chapterOneBranches) safe.chapterOneBranches = chapterOneBranches
  const chapterOneRewards = sanitizeChapterOneRewards(summary.chapterOneRewards)
  if (chapterOneRewards.length > 0) safe.chapterOneRewards = chapterOneRewards

  return Object.keys(safe).length > 0 ? safe : null
}

function sanitizePreviousRuns'''
adapter = adapter[:old_sanitizer.start()] + new_sanitizer + adapter[old_sanitizer.end():]

adapter = replace_once(
    adapter,
    "export function weedGoblinsRunStorageKey(userId) {\n  const safeUserId = cleanText(userId)\n  return safeUserId\n    ? `${WEED_GOBLINS_RUNS_STORAGE_PREFIX}:${safeUserId}`\n    : WEED_GOBLINS_RUNS_STORAGE_PREFIX\n}\n",
    r'''export function weedGoblinsRunStorageKey(userId) {
  const safeUserId = cleanText(userId)
  return safeUserId
    ? `${WEED_GOBLINS_RUNS_STORAGE_PREFIX}:${safeUserId}`
    : WEED_GOBLINS_RUNS_STORAGE_PREFIX
}

export function weedGoblinsCampaignStorageKey(userId) {
  const safeUserId = cleanText(userId)
  return safeUserId
    ? `${WEED_GOBLINS_CAMPAIGN_STORAGE_PREFIX}:${safeUserId}`
    : WEED_GOBLINS_CAMPAIGN_STORAGE_PREFIX
}

export function createEmptyWeedGoblinsCampaignState() {
  return {
    version: WEED_GOBLINS_CAMPAIGN_VERSION,
    completedRunCount: 0,
    chapterOne: {
      completedRunCount: 0,
      lastRunSeed: '',
      lastEnding: '',
      lastStolenItem: '',
      latestBranches: {
        nibTreatment: 'ignored',
        tributeArrangement: 'unknown',
        kingTreatment: 'unresolved',
        stolenItemCondition: 'not-recovered',
      },
      rewards: [],
    },
  }
}

function sanitizeCampaignState(value) {
  const empty = createEmptyWeedGoblinsCampaignState()
  if (!value || typeof value !== 'object' || Array.isArray(value)) return empty
  const chapter = value.chapterOne && typeof value.chapterOne === 'object'
    ? value.chapterOne
    : {}
  const branches = sanitizeChapterOneBranches(chapter.latestBranches) || empty.chapterOne.latestBranches
  return {
    version: WEED_GOBLINS_CAMPAIGN_VERSION,
    completedRunCount: safeInteger(value.completedRunCount) ?? 0,
    chapterOne: {
      completedRunCount: safeInteger(chapter.completedRunCount) ?? 0,
      lastRunSeed: cleanText(chapter.lastRunSeed),
      lastEnding: cleanText(chapter.lastEnding),
      lastStolenItem: cleanText(chapter.lastStolenItem),
      latestBranches: {
        ...empty.chapterOne.latestBranches,
        ...branches,
      },
      rewards: sanitizeChapterOneRewards(chapter.rewards),
    },
  }
}

function readCampaignStateFromStorage(storage, userId) {
  if (!storage || typeof storage.getItem !== 'function') return createEmptyWeedGoblinsCampaignState()
  try {
    const raw = storage.getItem(weedGoblinsCampaignStorageKey(userId))
    return raw ? sanitizeCampaignState(JSON.parse(raw)) : createEmptyWeedGoblinsCampaignState()
  } catch {
    return createEmptyWeedGoblinsCampaignState()
  }
}

function advanceCampaignState(currentValue, summary) {
  const current = sanitizeCampaignState(currentValue)
  const safeSummary = sanitizeRunSummary(summary)
  if (!safeSummary) return current
  const seed = cleanText(safeSummary.seed)
  if (seed && seed === current.chapterOne.lastRunSeed) return current

  const isChapterOne = Number(safeSummary.chapterNumber) === 1
  if (!isChapterOne) {
    return {
      ...current,
      completedRunCount: current.completedRunCount + 1,
    }
  }

  const branches = sanitizeChapterOneBranches(safeSummary.chapterOneBranches)
    || current.chapterOne.latestBranches
  const rewards = [
    ...current.chapterOne.rewards,
    ...sanitizeChapterOneRewards(safeSummary.chapterOneRewards),
  ]

  return {
    version: WEED_GOBLINS_CAMPAIGN_VERSION,
    completedRunCount: current.completedRunCount + 1,
    chapterOne: {
      completedRunCount: current.chapterOne.completedRunCount + 1,
      lastRunSeed: seed,
      lastEnding: cleanText(safeSummary.ending),
      lastStolenItem: cleanText(safeSummary.stolenItem),
      latestBranches: {
        ...createEmptyWeedGoblinsCampaignState().chapterOne.latestBranches,
        ...branches,
      },
      rewards: sanitizeChapterOneRewards(rewards),
    },
  }
}
''',
    'CAMPAIGN_KEY_BLOCK',
)

save_match = re.search(
    r"export async function saveWeedGoblinsRunSummary\(\{.*?\n\}\n\nexport async function readWeedGoblinsPersonalizationSnapshot",
    adapter,
    flags=re.S,
)
if not save_match:
    raise SystemExit('SAVE_SUMMARY_BLOCK_NOT_FOUND')
new_save_block = r'''export async function saveWeedGoblinsRunSummary({
  runSummary,
  store = null,
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
} = {}) {
  const localStore = await resolveLocalStore(store)
  const resolvedUserId = await resolveLocalUserId(localStore, userId)
  if (!resolvedUserId) throw new Error('A local user is required to save Weed Goblins history.')
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new Error('Writable local storage is required to save Weed Goblins history.')
  }

  const safeSummary = sanitizeRunSummary(
    attachWeedGoblinsProgressionMetadata(runSummary),
  )
  if (!safeSummary) throw new Error('A completed Weed Goblins run summary is required.')

  const previousRuns = sanitizePreviousRuns(readRunSummaries(storage, resolvedUserId))
  const seed = cleanText(safeSummary.seed)
  const withoutSameRun = seed
    ? previousRuns.filter((run) => cleanText(run.seed) !== seed)
    : previousRuns
  const history = sanitizePreviousRuns([...withoutSameRun, safeSummary])
  storage.setItem(weedGoblinsRunStorageKey(resolvedUserId), JSON.stringify(history))

  const currentCampaign = readCampaignStateFromStorage(storage, resolvedUserId)
  const campaignState = advanceCampaignState(currentCampaign, safeSummary)
  storage.setItem(
    weedGoblinsCampaignStorageKey(resolvedUserId),
    JSON.stringify(campaignState),
  )

  return {
    summary: safeSummary,
    history,
    campaignState,
  }
}

export async function readWeedGoblinsCampaignState({
  store = null,
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
} = {}) {
  const localStore = await resolveLocalStore(store)
  const resolvedUserId = await resolveLocalUserId(localStore, userId)
  if (!resolvedUserId) return createEmptyWeedGoblinsCampaignState()
  return readCampaignStateFromStorage(storage, resolvedUserId)
}

export async function readWeedGoblinsLocalContext({
  store = null,
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  userId = null,
} = {}) {
  const localStore = await resolveLocalStore(store)
  const resolvedUserId = await resolveLocalUserId(localStore, userId)

  if (!resolvedUserId) {
    return {
      userId: null,
      snapshot: createEmptyWeedGoblinsPersonalizationSnapshot(),
      campaignState: createEmptyWeedGoblinsCampaignState(),
    }
  }

  const result = await localStore
    .from('entries')
    .select('*')
    .eq('user_id', resolvedUserId)

  if (result?.error) throw result.error

  return {
    userId: resolvedUserId,
    snapshot: buildWeedGoblinsPersonalizationSnapshot({
      entries: result?.data || [],
      previousRuns: readRunSummaries(storage, resolvedUserId),
    }),
    campaignState: readCampaignStateFromStorage(storage, resolvedUserId),
  }
}

export async function readWeedGoblinsPersonalizationSnapshot'''
adapter = adapter[:save_match.start()] + new_save_block + adapter[save_match.end():]

# Replace the old personalization reader body with a call through the new local context.
reader_match = re.search(
    r"export async function readWeedGoblinsPersonalizationSnapshot\(\{.*?\n\}\s*$",
    adapter,
    flags=re.S,
)
if not reader_match:
    raise SystemExit('PERSONALIZATION_READER_NOT_FOUND')
new_reader = r'''export async function readWeedGoblinsPersonalizationSnapshot(options = {}) {
  const context = await readWeedGoblinsLocalContext(options)
  return context.snapshot
}
'''
adapter = adapter[:reader_match.start()] + new_reader
adapter_path.write_text(adapter)

# Wire active-run resume/save into the messenger without adding new visible UI.
chat_path = ROOT / 'WeedGoblinsChat.jsx'
chat = chat_path.read_text()
chat = replace_once(
    chat,
    "  createEmptyWeedGoblinsPersonalizationSnapshot,\n  readWeedGoblinsPersonalizationSnapshot,\n  saveWeedGoblinsRunSummary,",
    "  createEmptyWeedGoblinsPersonalizationSnapshot,\n  readWeedGoblinsLocalContext,\n  saveWeedGoblinsRunSummary,",
    'CHAT_ADAPTER_IMPORT',
)
chat = replace_once(
    chat,
    "import { weedGoblinsProgressionMetadata } from './weedGoblinsProgression.js'\n",
    "import { weedGoblinsProgressionMetadata } from './weedGoblinsProgression.js'\nimport {\n  clearWeedGoblinsActiveRun,\n  readWeedGoblinsActiveRun,\n  saveWeedGoblinsActiveRun,\n} from './weedGoblinsPersistence.js'\n",
    'CHAT_PERSISTENCE_IMPORT',
)
chat = replace_once(
    chat,
    r'''async function loadSnapshotWithFallback() {
  try {
    return await readWeedGoblinsPersonalizationSnapshot()
  } catch {
    return createEmptyWeedGoblinsPersonalizationSnapshot()
  }
}
''',
    r'''async function loadLocalContextWithFallback() {
  try {
    return await readWeedGoblinsLocalContext()
  } catch {
    return {
      userId: null,
      snapshot: createEmptyWeedGoblinsPersonalizationSnapshot(),
      campaignState: null,
    }
  }
}

function saveActiveRunSafely(session) {
  try {
    return saveWeedGoblinsActiveRun(session)
  } catch {
    return null
  }
}

function clearActiveRunSafely(userId) {
  try {
    clearWeedGoblinsActiveRun({ userId })
  } catch {
    // The game remains playable when browser storage is unavailable.
  }
}
''',
    'CHAT_LOAD_HELPER',
)
chat = replace_once(
    chat,
    "  const [runNumber, setRunNumber] = useState(0)\n",
    "  const [runNumber, setRunNumber] = useState(0)\n  const [localUserId, setLocalUserId] = useState(null)\n",
    'CHAT_LOCAL_USER_STATE',
)
chat = replace_once(
    chat,
    "  const speechRecognitionRef = useRef(null)\n  const hasStartedScrollingRef = useRef(false)\n",
    "  const speechRecognitionRef = useRef(null)\n  const hasStartedScrollingRef = useRef(false)\n  const previousHelpContextKeyRef = useRef('')\n",
    'CHAT_HELP_REF',
)

start_match = re.search(
    r"  useEffect\(\(\) => \{\n    let cancelled = false\n\n    async function start\(\) \{.*?\n  \}, \[resolvedSeed\]\)",
    chat,
    flags=re.S,
)
if not start_match:
    raise SystemExit('CHAT_START_EFFECT_NOT_FOUND')
new_start = r'''  useEffect(() => {
    let cancelled = false

    async function start() {
      const localContext = await loadLocalContextWithFallback()
      if (cancelled) return

      const snapshot = localContext.snapshot || createEmptyWeedGoblinsPersonalizationSnapshot()
      const userId = localContext.userId || null
      const blockedNames = Array.isArray(snapshot.productNames) ? snapshot.productNames : []
      setLocalUserId(userId)
      setBlockedRealNames(blockedNames)

      const restored = readWeedGoblinsActiveRun({ userId })
      if (restored) {
        setState(restored.state)
        setMessages(restored.messages)
        setChoices(restored.choices)
        setPendingTurn(restored.pendingTurn)
        setHelpLevel(restored.helpLevel)
        setHelpMessage(restored.helpMessage)
        setLoading(false)
        return
      }

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
      saveActiveRunSafely({
        userId,
        state: session.state,
        messages: session.messages,
        choices: session.choices,
        pendingTurn: null,
        helpLevel: 0,
        helpMessage: null,
      })
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
  }, [resolvedSeed])'''
chat = chat[:start_match.start()] + new_start + chat[start_match.end():]

chat = replace_once(
    chat,
    r'''  useEffect(() => {
    setHelpLevel(0)
    setHelpMessage(null)
  }, [helpContextKey])''',
    r'''  useEffect(() => {
    const previousKey = previousHelpContextKeyRef.current
    if (previousKey && helpContextKey && previousKey !== helpContextKey) {
      setHelpLevel(0)
      setHelpMessage(null)
    }
    previousHelpContextKeyRef.current = helpContextKey
  }, [helpContextKey])''',
    'CHAT_HELP_RESET',
)

chat = replace_once(
    chat,
    r'''  async function saveCompletedRun(nextState) {
    if (nextState.status !== 'completed') return
    try {
      await saveWeedGoblinsRunSummary({ runSummary: nextState.runSummary })
    } catch {
      // The run remains playable when browser storage is unavailable.
    }
  }
''',
    r'''  function persistStableRun({
    nextState = state,
    nextMessages = messages,
    nextChoices = choices,
    nextPendingTurn = pendingTurn,
    nextHelpLevel = helpLevel,
    nextHelpMessage = helpMessage,
  } = {}) {
    return saveActiveRunSafely({
      userId: localUserId,
      state: nextState,
      messages: nextMessages,
      choices: nextChoices,
      pendingTurn: nextPendingTurn,
      helpLevel: nextHelpLevel,
      helpMessage: nextHelpMessage,
    })
  }

  async function saveCompletedRun(nextState) {
    if (nextState.status !== 'completed') return
    try {
      await saveWeedGoblinsRunSummary({ runSummary: nextState.runSummary })
    } catch {
      // The completed story still remains visible when browser storage is unavailable.
    } finally {
      clearActiveRunSafely(localUserId)
    }
  }
''',
    'CHAT_SAVE_HELPERS',
)

chat = replace_once(
    chat,
    r'''    setMessages(nextMessages)
    setState(resolution.after)
    setChoices(getWeedGoblinsQuickReplies(resolution.after))
    await saveCompletedRun(resolution.after)''',
    r'''    const nextChoices = getWeedGoblinsQuickReplies(resolution.after)
    setMessages(nextMessages)
    setState(resolution.after)
    setChoices(nextChoices)
    persistStableRun({
      nextState: resolution.after,
      nextMessages,
      nextChoices,
      nextPendingTurn: null,
      nextHelpLevel: 0,
      nextHelpMessage: null,
    })
    await saveCompletedRun(resolution.after)''',
    'CHAT_APPLY_RESOLVED',
)

chat = replace_once(
    chat,
    r'''        setState(baseState)
        setMessages(stagedMessages)
        setPendingTurn(prepared)
        return''',
    r'''        setState(baseState)
        setMessages(stagedMessages)
        setPendingTurn(prepared)
        persistStableRun({
          nextState: baseState,
          nextMessages: stagedMessages,
          nextChoices: [],
          nextPendingTurn: prepared,
        })
        return''',
    'CHAT_CHOICE_PENDING',
)
chat = replace_once(
    chat,
    r'''      setMessages([...optimisticMessages, ...incomingMessages])
      setChoices(getWeedGoblinsQuickReplies(prepared.after))
      await saveCompletedRun(prepared.after)''',
    r'''      const finalMessages = [...optimisticMessages, ...incomingMessages]
      const nextChoices = getWeedGoblinsQuickReplies(prepared.after)
      setMessages(finalMessages)
      setChoices(nextChoices)
      persistStableRun({
        nextState: prepared.after,
        nextMessages: finalMessages,
        nextChoices,
        nextPendingTurn: null,
        nextHelpLevel: 0,
        nextHelpMessage: null,
      })
      await saveCompletedRun(prepared.after)''',
    'CHAT_CHOICE_NO_ROLL',
)

chat = replace_once(
    chat,
    r'''      setMessages([...optimisticMessages, ...incomingMessages])
      setChoices(getWeedGoblinsQuickReplies(transition.after))
      setDraft('')''',
    r'''      const finalMessages = [...optimisticMessages, ...incomingMessages]
      const nextChoices = getWeedGoblinsQuickReplies(transition.after)
      setMessages(finalMessages)
      setChoices(nextChoices)
      setDraft('')
      persistStableRun({
        nextState: transition.after,
        nextMessages: finalMessages,
        nextChoices,
        nextPendingTurn: null,
        nextHelpLevel: 0,
        nextHelpMessage: null,
      })''',
    'CHAT_SESSION_TEXT',
)

chat = replace_once(
    chat,
    r'''      if (prepared.requiresRoll) {
        setPendingTurn(prepared)
      } else {''',
    r'''      if (prepared.requiresRoll) {
        setPendingTurn(prepared)
        persistStableRun({
          nextState: state,
          nextMessages: stagedMessages,
          nextChoices: [],
          nextPendingTurn: prepared,
        })
      } else {''',
    'CHAT_FREE_TEXT_PENDING',
)

chat = replace_once(
    chat,
    r'''    setHelpLevel(nextLevel)
    setHelpMessage(response)
  }''',
    r'''    setHelpLevel(nextLevel)
    setHelpMessage(response)
    persistStableRun({
      nextHelpLevel: nextLevel,
      nextHelpMessage: response,
    })
  }''',
    'CHAT_HELP_PERSIST',
)
chat = replace_once(
    chat,
    r'''  function restartRun() {
    setState(null)''',
    r'''  function restartRun() {
    clearActiveRunSafely(localUserId)
    setState(null)''',
    'CHAT_RESTART_CLEAR',
)

chat_path.write_text(chat)
print('PRIORITY12_PATCH_COMPLETE')
