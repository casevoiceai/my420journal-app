import { stdout as output } from 'node:process'

import {
  advanceWeedGoblinsRun,
  createWeedGoblinsRun,
} from './weedGoblinsEngine.js'
import {
  generateNarrationFromHook,
  generateNaturalOneComplication,
} from './weedGoblinsAiComplication.js'
import {
  createInitialNarrationHook,
  getNarrationHooksForTransition,
} from './weedGoblinsNarrationHooks.js'
import {
  loadConsoleLocalAdapterSnapshot,
  runInteractiveWeedGoblins,
} from './weedGoblinsConsoleStatic.js'

const DEFAULT_NARRATION_ENDPOINT =
  'https://my420journal.app/api/weed-goblins-narration'
const STORY_BEAT_MOMENTS = new Set([
  'action-success',
  'scene-intro',
  'midpoint-outcome',
  'run-ending',
])

function parseArguments(argv) {
  const options = {
    seed: 'console-review-1',
    priorCompletedRunCount: 5,
    priorRunsSpecified: false,
    useLocalAdapter: false,
    useAiNaturalOne: false,
    useAiStoryBeats: false,
    narrationEndpoint: DEFAULT_NARRATION_ENDPOINT,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--seed' && argv[index + 1]) {
      options.seed = argv[index + 1]
      index += 1
    } else if (argument === '--prior-runs' && argv[index + 1]) {
      options.priorCompletedRunCount = Number(argv[index + 1])
      options.priorRunsSpecified = true
      index += 1
    } else if (argument === '--local-adapter') {
      options.useLocalAdapter = true
    } else if (argument === '--ai-natural-one') {
      options.useAiNaturalOne = true
    } else if (argument === '--ai-story-beats') {
      options.useAiStoryBeats = true
    } else if (argument === '--narration-endpoint' && argv[index + 1]) {
      options.narrationEndpoint = argv[index + 1]
      index += 1
    }
  }

  return options
}

async function snapshotForOptions(options) {
  if (!options.useLocalAdapter) {
    return {
      productNames: [],
      fictionalLocationNames: [],
      previousRuns: [],
    }
  }
  return loadConsoleLocalAdapterSnapshot()
}

function blockedNames(journalSnapshot) {
  return [...(journalSnapshot.productNames || [])]
}

function printComparisonResult(result) {
  output.write(
    `${result.source === 'ai' ? 'LIVE AI CANDIDATE' : 'AI FALLBACK'}: ${result.text}\n`,
  )
  output.write(
    `AI VALIDATION: ${result.attempts} attempt(s), ${result.validationFailures.length} rejected draft(s)\n`,
  )
  for (const failure of result.validationFailures) {
    output.write(
      `AI REJECTED ATTEMPT ${failure.attempt}: ${failure.reasons.join('; ')}\n`,
    )
  }
  if (result.model) output.write(`Model: ${result.model}\n`)
}

export async function compareNaturalOneNarration({
  endpoint = DEFAULT_NARRATION_ENDPOINT,
  journalSnapshot = { productNames: [], fictionalLocationNames: [] },
  fetchImpl = fetch,
} = {}) {
  let state = createWeedGoblinsRun({ seed: 'scan-28', journalSnapshot })
  state = advanceWeedGoblinsRun(state, 'background:hauler')
  const historyLength = state.history.length
  state = advanceWeedGoblinsRun(state, 'route:ridge')
  const event = state.history
    .slice(historyLength)
    .find((candidate) => candidate.type === 'check' && candidate.naturalOne)

  if (!event) throw new Error('The comparison seed did not produce a natural 1.')

  const result = await generateNaturalOneComplication({
    event,
    state,
    staticFallbacks: [event.complicationText],
    blockedRealNames: blockedNames(journalSnapshot),
    endpoint,
    fetchImpl,
  })

  output.write('WEED GOBLINS NATURAL-1 NARRATION COMPARISON\n')
  output.write(`Same-origin endpoint: ${endpoint}\n`)
  output.write(`STATIC BASELINE: ${event.complicationText}\n`)
  printComparisonResult(result)
  return result
}

export async function compareStoryBeatNarration({
  endpoint = DEFAULT_NARRATION_ENDPOINT,
  journalSnapshot = { productNames: [], fictionalLocationNames: [] },
  fetchImpl = fetch,
} = {}) {
  const actions = [
    'background:hauler',
    'route:ridge',
    'goblin:strike',
    'midpoint:skip',
    'boss:overpower',
  ]
  let state = createWeedGoblinsRun({ seed: 'recovery-1', journalSnapshot })
  const hooks = [createInitialNarrationHook(state)]

  for (const actionId of actions) {
    const before = state
    state = advanceWeedGoblinsRun(state, actionId)
    hooks.push(...getNarrationHooksForTransition(before, state))
  }

  const storyBeatHooks = hooks.filter((hook) => STORY_BEAT_MOMENTS.has(hook.moment))
  const results = []

  output.write('WEED GOBLINS STORY-BEAT NARRATION COMPARISON\n')
  output.write(`Same-origin endpoint: ${endpoint}\n`)

  for (const [index, hook] of storyBeatHooks.entries()) {
    output.write(`\n[${index + 1}] ${hook.moment} -> ${hook.outcome}\n`)
    output.write(`STATIC BASELINE: ${hook.fallbackText}\n`)
    const result = await generateNarrationFromHook({
      hook,
      state,
      blockedRealNames: blockedNames(journalSnapshot),
      endpoint,
      fetchImpl,
    })
    printComparisonResult(result)
    results.push({ hook, result })
  }

  return results
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  const snapshot = await snapshotForOptions(options)

  if (options.useAiNaturalOne) {
    await compareNaturalOneNarration({
      endpoint: options.narrationEndpoint,
      journalSnapshot: snapshot,
    })
    return
  }

  if (options.useAiStoryBeats) {
    await compareStoryBeatNarration({
      endpoint: options.narrationEndpoint,
      journalSnapshot: snapshot,
    })
    return
  }

  await runInteractiveWeedGoblins({
    seed: options.seed,
    priorCompletedRunCount: options.priorRunsSpecified
      ? options.priorCompletedRunCount
      : snapshot.previousRuns?.length || options.priorCompletedRunCount,
    journalSnapshot: options.useLocalAdapter ? snapshot : undefined,
    previousRuns: options.useLocalAdapter ? snapshot.previousRuns : undefined,
    sourceLabel: options.useLocalAdapter
      ? 'local adapter over realistic mocked browser entries'
      : undefined,
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`Weed Goblins runner failed: ${error.message}`)
    process.exitCode = 1
  })
}
