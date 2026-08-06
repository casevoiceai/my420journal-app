import { createInterface } from 'node:readline'
import { stdin as input, stdout as output } from 'node:process'

import {
  advanceWeedGoblinsRun,
  createWeedGoblinsRun,
  getAvailableActions,
} from './weedGoblinsEngine.js'
import {
  readWeedGoblinsPersonalizationSnapshot,
  weedGoblinsRunStorageKey,
} from './weedGoblinsLocalDataAdapter.js'

const NARRATOR_NAME = 'S.T.O.N.E.R.'
const MOCK_LOCAL_USER_ID = 'console-local-user'

export const MOCK_JOURNAL_SNAPSHOT = Object.freeze({
  productNames: Object.freeze([
    'Blue Dream',
    'Northern Lights',
    'Lemon Cherry Gelato',
  ]),
})

export const REALISTIC_MOCK_LOCAL_ENTRIES = Object.freeze([
  Object.freeze({
    id: 'entry-1',
    user_id: MOCK_LOCAL_USER_ID,
    product_name: 'Northern Lights',
    category: 'Flower',
    dispensary_name: 'Restore Scranton',
    body_tags: ['Relaxed', 'Heavy', 'Pain Relief'],
    mind_tags: ['Foggy'],
    mood_tags: ['Calm'],
    terpenes: { 'Beta Myrcene': '1.28', Linalool: '0.42' },
    notes: 'Private notes are deliberately present but must not enter the snapshot.',
    voice_transcript: 'Private transcript that must not enter the snapshot.',
    amount: '3.5g',
    price: '42.00',
    created_at: '2026-08-01T19:22:00-04:00',
    dispensary_address: 'Private address excluded by the adapter',
    dispensary_lat: 41.4,
    dispensary_lng: -75.6,
  }),
  Object.freeze({
    id: 'entry-2',
    user_id: MOCK_LOCAL_USER_ID,
    product_name: 'Blue Dream',
    category: 'Vape',
    dispensary_name: 'Justice Grown',
    body_tags: ['Relaxed'],
    mind_tags: ['Creative', 'Focused'],
    mood_tags: ['Happy'],
    terpenes: { 'Beta Myrcene': '0.91', Limonene: '0.75' },
    notes: 'Another excluded note.',
    anonymous_contributor_id: 'layer-2-id-must-not-survive',
  }),
  Object.freeze({
    id: 'entry-3',
    user_id: MOCK_LOCAL_USER_ID,
    product_name: 'Northern Lights',
    category: 'Flower',
    dispensary_name: 'Restore Scranton',
    body_tags: ['Relaxed', 'Sleepy'],
    mind_tags: ['Foggy'],
    mood_tags: ['Calm'],
    terpenes: { 'Beta Myrcene': '1.14', 'Beta Caryophyllene': '0.38' },
  }),
  Object.freeze({
    id: 'entry-note',
    user_id: MOCK_LOCAL_USER_ID,
    entry_type: 'note',
    product_name: 'This note title must not become a product',
    notes: 'Private journal note.',
  }),
  Object.freeze({
    id: 'entry-sleep',
    user_id: MOCK_LOCAL_USER_ID,
    entry_type: 'sleep_end',
    product_name: 'Sleep End',
    notes: 'Private dream details.',
  }),
])

const REALISTIC_MOCK_PREVIOUS_RUNS = Object.freeze([
  Object.freeze({
    ending: 'bargain',
    outcomeSummary: 'made a bargain and recovered the Amber Field Satchel',
    created_at: '2026-07-31T20:00:00-04:00',
    notes: 'This field must be removed by the adapter.',
  }),
])

const SCENE_TITLES = Object.freeze({
  'choose-background': 'Choose a background',
  'choose-route': 'Choose a route into the Highlands',
  'goblin-encounter': 'A goblin blocks the path',
  midpoint: 'A choice before the throne room',
  'goblin-king': 'The Goblin King confrontation',
  ending: 'Run complete',
})

function createLineReader() {
  const interfaceInstance = createInterface({
    input,
    output,
    terminal: input.isTTY,
  })
  const iterator = interfaceInstance[Symbol.asyncIterator]()

  return {
    async question(prompt) {
      output.write(prompt)
      const next = await iterator.next()
      if (next.done) throw new Error('Input ended before the run was complete.')
      if (!input.isTTY) output.write(`${next.value}\n`)
      return next.value
    },
    close() {
      interfaceInstance.close()
    },
  }
}

function parseArguments(argv) {
  const options = {
    seed: 'console-review-1',
    priorCompletedRunCount: 5,
    priorRunsSpecified: false,
    useLocalAdapter: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--seed' && argv[index + 1]) {
      options.seed = argv[index + 1]
      index += 1
    } else if (argv[index] === '--prior-runs' && argv[index + 1]) {
      options.priorCompletedRunCount = Number(argv[index + 1])
      options.priorRunsSpecified = true
      index += 1
    } else if (argv[index] === '--local-adapter') {
      options.useLocalAdapter = true
    }
  }

  return options
}

function createMockLocalStore(entries) {
  return {
    auth: {
      async getUser() {
        return { data: { user: { id: MOCK_LOCAL_USER_ID } }, error: null }
      },
    },
    from(table) {
      if (table !== 'entries') throw new Error(`Unexpected table: ${table}`)
      return {
        select() {
          return this
        },
        eq(column, value) {
          if (column !== 'user_id') throw new Error(`Unexpected filter: ${column}`)
          return Promise.resolve({
            data: entries.filter((entry) => entry.user_id === value),
            error: null,
          })
        },
      }
    },
  }
}

function createMockRunStorage() {
  const values = {
    [weedGoblinsRunStorageKey(MOCK_LOCAL_USER_ID)]: JSON.stringify(
      REALISTIC_MOCK_PREVIOUS_RUNS,
    ),
  }
  return {
    getItem(key) {
      return Object.hasOwn(values, key) ? values[key] : null
    },
  }
}

export async function loadConsoleLocalAdapterSnapshot() {
  return readWeedGoblinsPersonalizationSnapshot({
    store: createMockLocalStore(REALISTIC_MOCK_LOCAL_ENTRIES),
    storage: createMockRunStorage(),
  })
}

function printNarration(lines) {
  for (const line of lines) {
    output.write(`${NARRATOR_NAME}: ${line}\n`)
  }
}

function printNewEvents(events) {
  for (const event of events) {
    if (event.type === 'check') {
      const rollLabel = event.advantage
        ? `advantage [${event.rolls.join(', ')}], take ${event.roll}`
        : `d20 ${event.roll}`
      output.write(
        `DICE: ${rollLabel} + ${event.stat} = ${event.total} vs DC ${event.dc} -> ${event.outcome.toUpperCase()}\n`,
      )
      if (event.naturalOne) {
        output.write('COMPLICATION: selected natural 1; the run continues.\n')
      }
    } else if (event.type === 'mana') {
      output.write(`MANA: spent ${event.amount} for advantage\n`)
    }
  }
}

function printState(state) {
  output.write(
    `STATUS: Strength ${state.stats.strength} | Defense ${state.stats.defense} | Mana ${state.stats.manaPool}/${state.stats.maxMana} | Trouble ${state.trouble}/3 | Complications ${state.complicationCount}\n`,
  )
}

function printSnapshot(sourceLabel, snapshot) {
  output.write(`Personalization source: ${sourceLabel}\n`)
  output.write(`Products: ${snapshot.productNames.join(', ') || '(none)'}\n`)
  if (Array.isArray(snapshot.productCategories)) {
    output.write(`Categories: ${snapshot.productCategories.join(', ') || '(none)'}\n`)
    output.write(`Effect tags: ${snapshot.effectTags.join(', ') || '(none)'}\n`)
    output.write(`Terpenes: ${snapshot.terpeneLabels.join(', ') || '(none)'}\n`)
    output.write(`Dispensaries: ${snapshot.dispensaryNames.join(', ') || '(none)'}\n`)
    output.write(`Eligible local entry count: ${snapshot.entryCount}\n`)
  }
}

async function askForAction(lineReader, actions) {
  for (const [index, action] of actions.entries()) {
    output.write(`${index + 1}. ${action.label}\n`)
  }

  while (true) {
    const answer = await lineReader.question('Choose: ')
    const selection = Number.parseInt(answer.trim(), 10) - 1
    if (Number.isInteger(selection) && actions[selection]) {
      return actions[selection]
    }
    output.write(`Enter a number from 1 to ${actions.length}.\n`)
  }
}

export async function runInteractiveWeedGoblins({
  seed = 'console-review-1',
  priorCompletedRunCount = 5,
  journalSnapshot = MOCK_JOURNAL_SNAPSHOT,
  previousRuns = [],
  sourceLabel = 'fixed mock snapshot',
  readline = createLineReader(),
} = {}) {
  let state = createWeedGoblinsRun({
    seed,
    journalSnapshot,
    previousRuns,
    priorCompletedRunCount,
  })

  output.write('WEED GOBLINS: SESSION 1 TEXT RUNNER\n')
  output.write(`Seed: ${state.seed}\n`)
  printSnapshot(sourceLabel, journalSnapshot)
  output.write(`Stolen item: ${state.stolenItem}\n`)
  output.write(`Narration tier: ${state.narrationTier}\n\n`)
  printNarration(state.narration)

  try {
    while (state.status !== 'completed') {
      output.write(`\n=== ${SCENE_TITLES[state.sceneId] ?? state.sceneId} ===\n`)
      printState(state)

      const actions = getAvailableActions(state)
      const selected = await askForAction(readline, actions)
      output.write(`PLAYER: ${selected.label}\n`)

      const priorNarrationLength = state.narration.length
      const priorHistoryLength = state.history.length
      state = advanceWeedGoblinsRun(state, selected.id)

      printNewEvents(state.history.slice(priorHistoryLength))
      printNarration(state.narration.slice(priorNarrationLength))
    }

    output.write('\n=== ENDING ===\n')
    output.write(`Ending: ${state.ending}\n`)
    output.write(`Outcome: ${state.runSummary.outcomeSummary}\n`)
    output.write(`Narration tier recorded: ${state.runSummary.narrationTier}\n`)
    output.write(`Mana remaining: ${state.runSummary.manaRemaining}\n`)
    output.write(`Trouble: ${state.runSummary.trouble}/3\n`)
    output.write(`Complications: ${state.runSummary.complicationCount}\n`)
    return state
  } finally {
    readline.close()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArguments(process.argv.slice(2))

  if (options.useLocalAdapter) {
    loadConsoleLocalAdapterSnapshot()
      .then((snapshot) => runInteractiveWeedGoblins({
        seed: options.seed,
        priorCompletedRunCount: options.priorRunsSpecified
          ? options.priorCompletedRunCount
          : snapshot.previousRuns.length,
        journalSnapshot: snapshot,
        previousRuns: snapshot.previousRuns,
        sourceLabel: 'local adapter over realistic mocked browser entries',
      }))
      .catch((error) => {
        console.error(`Weed Goblins runner failed: ${error.message}`)
        process.exitCode = 1
      })
  } else {
    runInteractiveWeedGoblins(options).catch((error) => {
      console.error(`Weed Goblins runner failed: ${error.message}`)
      process.exitCode = 1
    })
  }
}
