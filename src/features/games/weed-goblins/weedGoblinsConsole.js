import { createInterface } from 'node:readline'
import { stdin as input, stdout as output } from 'node:process'

import {
  advanceWeedGoblinsRun,
  createWeedGoblinsRun,
  getAvailableActions,
} from './weedGoblinsEngine.js'

const NARRATOR_NAME = 'S.T.O.N.E.R.'

export const MOCK_JOURNAL_SNAPSHOT = Object.freeze({
  productNames: Object.freeze([
    'Blue Dream',
    'Northern Lights',
    'Lemon Cherry Gelato',
  ]),
})

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
  }

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--seed' && argv[index + 1]) {
      options.seed = argv[index + 1]
      index += 1
    } else if (argv[index] === '--prior-runs' && argv[index + 1]) {
      options.priorCompletedRunCount = Number(argv[index + 1])
      index += 1
    }
  }

  return options
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
  readline = createLineReader(),
} = {}) {
  let state = createWeedGoblinsRun({
    seed,
    journalSnapshot,
    priorCompletedRunCount,
  })

  output.write('WEED GOBLINS: SESSION 1 TEXT RUNNER\n')
  output.write(`Seed: ${state.seed}\n`)
  output.write(`Mock logged products: ${journalSnapshot.productNames.join(', ')}\n`)
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
  runInteractiveWeedGoblins(options).catch((error) => {
    console.error(`Weed Goblins runner failed: ${error.message}`)
    process.exitCode = 1
  })
}
