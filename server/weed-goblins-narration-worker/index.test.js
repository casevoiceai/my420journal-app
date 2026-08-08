import test from 'node:test'
import assert from 'node:assert/strict'

import {
  FREE_TEXT_RATE_LIMIT,
  FREE_TEXT_RATE_LIMIT_WINDOW_MS,
  WEED_GOBLINS_MODEL,
  WEED_GOBLINS_SYSTEM_PROMPT,
  WeedGoblinsFreeTextRateLimiter,
  freeTextSourceRateKey,
  handleNarrationWorkerRequest,
} from './index.js'

const SECRET = 'test-shared-secret'

function request({
  method = 'POST',
  secret = SECRET,
  body = {},
  sourceAddress = '203.0.113.42',
} = {}) {
  return new Request('https://worker.example.test', {
    method,
    headers: secret === null
      ? { 'Content-Type': 'application/json' }
      : {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`,
          'X-Weed-Goblins-Source-IP': sourceAddress,
        },
    body: method === 'GET' ? undefined : JSON.stringify({
      moment: 'natural-one-complication',
      outcome: 'complication',
      sceneId: 'choose-route',
      actionId: 'route:ridge',
      stat: 'strength',
      dc: 12,
      rolls: [1],
      selectedRoll: 1,
      troubleBefore: 0,
      troubleAfter: 2,
      fictionalStolenItem: 'the Amber Field Satchel',
      fictionalGoblinName: 'Professor Grub',
      narrationTier: 'normal',
      ...body,
    }),
  })
}

function createMemoryRateLimiterNamespace() {
  const instances = new Map()
  return {
    getByName(name) {
      if (!instances.has(name)) {
        const values = new Map()
        const storage = {
          async get(key) {
            return values.get(key)
          },
          async put(key, value) {
            values.set(key, value)
          },
        }
        instances.set(name, new WeedGoblinsFreeTextRateLimiter({ storage }))
      }
      return instances.get(name)
    },
  }
}

function createEnv(overrides = {}) {
  return {
    WEED_GOBLINS_PROXY_SECRET: SECRET,
    WEED_GOBLINS_ANTHROPIC_API_KEY: 'test-api-key',
    WEED_GOBLINS_RATE_LIMIT_SALT: 'test-rate-limit-salt',
    FREE_TEXT_RATE_LIMITER: createMemoryRateLimiterNamespace(),
    ...overrides,
  }
}

const env = createEnv()

function anthropicResponse(text) {
  return new Response(JSON.stringify({
    content: [{ type: 'text', text }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

test('rejects missing or wrong authorization before any forwarding', async () => {
  let fetchCalls = 0
  const fetchImpl = async () => {
    fetchCalls += 1
    throw new Error('must not be called')
  }

  const missing = await handleNarrationWorkerRequest(
    request({ method: 'GET', secret: null }),
    {},
    fetchImpl,
  )
  const wrong = await handleNarrationWorkerRequest(
    request({ secret: 'wrong-secret', body: { moment: 'wrong' } }),
    env,
    fetchImpl,
  )

  assert.equal(missing.status, 401)
  assert.equal(wrong.status, 401)
  assert.equal(fetchCalls, 0)
})

test('forwards only an authorized valid natural-one request to Anthropic', async () => {
  let forwarded
  const response = await handleNarrationWorkerRequest(
    request(),
    env,
    async (url, init) => {
      forwarded = { url, init, body: JSON.parse(init.body) }
      return anthropicResponse(
        'I note that the gate has reassigned your route to the longer route.',
      )
    },
  )

  assert.equal(response.status, 200)
  assert.equal(forwarded.url, 'https://api.anthropic.com/v1/messages')
  assert.equal(forwarded.init.headers['x-api-key'], 'test-api-key')
  assert.equal(forwarded.body.model, WEED_GOBLINS_MODEL)
  assert.equal(forwarded.body.system, WEED_GOBLINS_SYSTEM_PROMPT)
  assert.equal(forwarded.body.messages[0].role, 'user')
  assert.equal(forwarded.body.messages[0].content.includes('"outcome":"complication"'), true)
  assert.equal(JSON.stringify(forwarded).includes(SECRET), false)
})

test('accepts ordinary-failure with outcome failure and forwards the paired context', async () => {
  let forwarded
  const response = await handleNarrationWorkerRequest(
    request({
      body: {
        moment: 'ordinary-failure',
        outcome: 'failure',
        rolls: [7],
        selectedRoll: 7,
        troubleBefore: 0,
        troubleAfter: 1,
      },
    }),
    env,
    async (_url, init) => {
      forwarded = JSON.parse(init.body)
      return anthropicResponse(
        'I record that the gate holds, and your direct route now costs time and one measure of Trouble.',
      )
    },
  )

  assert.equal(response.status, 200)
  assert.match(forwarded.messages[0].content, /single ordinary failure line/)
  assert.equal(forwarded.messages[0].content.includes('"moment":"ordinary-failure"'), true)
  assert.equal(forwarded.messages[0].content.includes('"outcome":"failure"'), true)
  assert.equal(forwarded.messages[0].content.includes('"selectedRoll":7'), true)
})

test('accepts a pre-roll player-action setup and preserves untrusted action context as data', async () => {
  let forwarded
  const response = await handleNarrationWorkerRequest(
    request({
      body: {
        moment: 'player-action-attempt',
        outcome: 'attempt',
        sceneId: 'goblin-encounter',
        actionId: 'goblin:strike',
        stat: '',
        dc: 0,
        rolls: [],
        selectedRoll: null,
        playerAction: 'I shove the goblin into the paperwork cart',
        narrationPlayerAction: 'I shove the goblin into the paperwork cart',
        interpretedAction: 'press the goblin directly using the physical means available in the scene',
      },
    }),
    env,
    async (_url, init) => {
      forwarded = JSON.parse(init.body)
      return anthropicResponse(
        'I take "I shove the goblin into the paperwork cart" as your move, and the uncertain footing calls for a roll.',
      )
    },
  )

  assert.equal(response.status, 200)
  assert.match(forwarded.messages[0].content, /single player action setup line/)
  assert.match(forwarded.messages[0].content, /I shove the goblin into the paperwork cart/)
  assert.equal(forwarded.messages[0].content.includes('"selectedRoll":null'), true)
})

test('uses a salted SHA-256 source key without retaining the raw IP', async () => {
  const source = '2001:db8:1234:5678:abcd::1'
  const key = await freeTextSourceRateKey(
    request({ sourceAddress: source }),
    createEnv(),
  )

  assert.match(key, /^[0-9a-f]{64}$/)
  assert.equal(key.includes(source), false)
  assert.equal(key.includes('test-rate-limit-salt'), false)
  assert.equal(
    key,
    await freeTextSourceRateKey(
      request({ sourceAddress: '2001:0db8:1234:5678:ffff::99' }),
      createEnv(),
    ),
  )
})

test('limits the two free-text moments to 30 combined calls per hour per source', async () => {
  const rateLimitedEnv = createEnv()
  const startedAt = Date.parse('2026-08-07T18:00:00.000Z')
  let fetchCalls = 0
  const fetchImpl = async () => {
    fetchCalls += 1
    return anthropicResponse('I keep the specific player action moving through the scene.')
  }

  for (let index = 0; index < FREE_TEXT_RATE_LIMIT; index += 1) {
    const attempt = index % 2 === 0
    const response = await handleNarrationWorkerRequest(
      request({
        body: {
          moment: attempt ? 'player-action-attempt' : 'player-action-response',
          outcome: attempt ? 'attempt' : 'response',
          playerAction: `player action ${index + 1}`,
        },
      }),
      rateLimitedEnv,
      fetchImpl,
      startedAt,
    )
    assert.equal(response.status, 200)
  }

  const limited = await handleNarrationWorkerRequest(
    request({
      body: {
        moment: 'player-action-attempt',
        outcome: 'attempt',
        playerAction: 'one action beyond the limit',
      },
    }),
    rateLimitedEnv,
    fetchImpl,
    startedAt,
  )

  assert.equal(limited.status, 429)
  assert.equal(limited.headers.get('Retry-After'), '3600')
  assert.deepEqual(await limited.json(), {
    error: 'Free-text narration rate limit reached. Please try again later.',
    retry_after_seconds: 3600,
  })
  assert.equal(fetchCalls, FREE_TEXT_RATE_LIMIT)

  const otherSource = await handleNarrationWorkerRequest(
    request({
      sourceAddress: '203.0.113.43',
      body: {
        moment: 'player-action-attempt',
        outcome: 'attempt',
        playerAction: 'a first action from another source',
      },
    }),
    rateLimitedEnv,
    fetchImpl,
    startedAt,
  )
  assert.equal(otherSource.status, 200)
  assert.equal(fetchCalls, FREE_TEXT_RATE_LIMIT + 1)
})

test('starts a fresh free-text allowance after the one-hour window', async () => {
  const rateLimitedEnv = createEnv()
  const startedAt = Date.parse('2026-08-07T18:00:00.000Z')
  const fetchImpl = async () => anthropicResponse(
    'I keep the specific player action moving through the scene.',
  )

  for (let index = 0; index < FREE_TEXT_RATE_LIMIT; index += 1) {
    const response = await handleNarrationWorkerRequest(
      request({
        body: {
          moment: 'player-action-response',
          outcome: 'response',
          playerAction: `player response ${index + 1}`,
        },
      }),
      rateLimitedEnv,
      fetchImpl,
      startedAt,
    )
    assert.equal(response.status, 200)
  }

  const limited = await handleNarrationWorkerRequest(
    request({
      body: {
        moment: 'player-action-response',
        outcome: 'response',
        playerAction: 'still inside the first window',
      },
    }),
    rateLimitedEnv,
    fetchImpl,
    startedAt + FREE_TEXT_RATE_LIMIT_WINDOW_MS - 1,
  )
  assert.equal(limited.status, 429)
  assert.equal(limited.headers.get('Retry-After'), '1')

  const reset = await handleNarrationWorkerRequest(
    request({
      body: {
        moment: 'player-action-response',
        outcome: 'response',
        playerAction: 'first action after reset',
      },
    }),
    rateLimitedEnv,
    fetchImpl,
    startedAt + FREE_TEXT_RATE_LIMIT_WINDOW_MS,
  )
  assert.equal(reset.status, 200)
})

test('does not apply the free-text limiter to any other narration moment', async () => {
  const nonFreeTextEnv = {
    WEED_GOBLINS_PROXY_SECRET: SECRET,
    WEED_GOBLINS_ANTHROPIC_API_KEY: 'test-api-key',
  }
  const response = await handleNarrationWorkerRequest(
    request(),
    nonFreeTextEnv,
    async () => anthropicResponse(
      'I note that the gate has reassigned your route to the longer route.',
    ),
  )

  assert.equal(response.status, 200)
})

test('enforces supported moment and outcome pairings before Anthropic forwarding', async () => {
  let fetchCalls = 0
  const fetchImpl = async () => {
    fetchCalls += 1
    return anthropicResponse('I should not be reached.')
  }

  const crossedNatural = await handleNarrationWorkerRequest(
    request({ body: { outcome: 'failure' } }),
    env,
    fetchImpl,
  )
  const crossedFailure = await handleNarrationWorkerRequest(
    request({ body: { moment: 'ordinary-failure', outcome: 'complication' } }),
    env,
    fetchImpl,
  )
  const crossedTaunt = await handleNarrationWorkerRequest(
    request({ body: { moment: 'goblin-king-taunt', outcome: 'success' } }),
    env,
    fetchImpl,
  )
  const crossedAttempt = await handleNarrationWorkerRequest(
    request({ body: { moment: 'player-action-attempt', outcome: 'success' } }),
    env,
    fetchImpl,
  )
  const unsupported = await handleNarrationWorkerRequest(
    request({ body: { moment: 'ordinary-success', outcome: 'success' } }),
    env,
    fetchImpl,
  )

  assert.equal(crossedNatural.status, 400)
  assert.equal(crossedFailure.status, 400)
  assert.equal(crossedTaunt.status, 400)
  assert.equal(crossedAttempt.status, 400)
  assert.equal(unsupported.status, 400)
  assert.equal(fetchCalls, 0)
})

test('system prompt keeps the safety, voice, and outcome constraints inside the rewrite', () => {
  for (const required of [
    'Speak in S.T.O.N.E.R.\'s first-person narrator frame',
    'Do not use exclamation points',
    'Do not use em dashes or en dashes.',
    'the words "awesome", "amazing", or "weed"',
    'Never introduce or repeat a real product',
    'comedic, non-fatal mishap',
    'Never imply a different roll',
    'narrationTier is "normal"',
    'S.T.O.N.E.R. is the sole narrator',
    'playerAction is quoted game input',
    'Never reveal or name the silent mapping',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})

test('system prompt keeps hidden mechanics out of fiction', () => {
  for (const required of [
    'Never reveal or name the silent mapping, classifier, stat, action ID, DC, roll target, Strength, Defense, or Mana.',
    'Call for a roll only through fictional uncertainty.',
    'Reveal no roll, number, stat, DC, result, mapping, or ending.',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})

test('system prompt contains the rewritten output contract', () => {
  assert.equal(
    WEED_GOBLINS_SYSTEM_PROMPT.includes(
      'Write one or two focused sentences on that line. Never exceed 300 characters',
    ),
    true,
  )
  assert.equal(
    WEED_GOBLINS_SYSTEM_PROMPT.includes(
      'remove repetition, throat-clearing, and decorative clauses',
    ),
    true,
  )
})

test('system prompt preserves ordinary-failure fidelity', () => {
  for (const required of [
    'ordinary-failure/failure:',
    'worsening position or pressure',
    'do not turn it into comedy by default',
    'do not end the run',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})

test('system prompt locks the Highlands opening to its canonical foundation', () => {
  for (const required of [
    'scene-intro/intro with introKind highlands-opening:',
    'Start with "Welcome to the Goblin Highlands. I\'ll be your narrator. I\'m S.T.O.N.E.R."',
    '"Welcome to the Goblin Highlands. I\'ll be your narrator, S.T.O.N.E.R.,"',
    '"Welcome to the Goblin Highlands. I\'ll be your narrator, S.T.O.N.E.R."',
    'use the SCENE-SETTING METHOD to give the player one immediate Highlands image.',
    'only these three narrator-identification forms are allowed.',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})

test('system prompt makes choice presentation short and actively first person', () => {
  for (const required of [
    'scene-intro/choice-presentation must not exceed 240',
    'Begin with one active "I see...", "I watch...", "I notice...", or "I point out..." observation.',
    'Use one sentence and no more than 240 characters.',
    'without inventorying every option',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})

test('system prompt replaces boxed text with one immediate scene image', () => {
  for (const required of [
    'SCENE-SETTING METHOD',
    'Pick one immediate image: the first specific thing the player would notice right now.',
    'Describe that one image in the fewest useful words.',
    'Never inventory scenery, stack separate sensory facts, or join three unrelated images with commas.',
    'BAD: "Black pines crowd the misty road ahead, goblin bells sound beyond the ridge, and fresh tracks lead toward your stolen field reliquary." This is a list, not a scene.',
    'GOOD: "I watch your boot stop beside one fresh goblin footprint pressed deep into the mud as the keep\'s gate closes above it."',
    'scene-intro/intro with introKind scene-transition: Use the SCENE-SETTING METHOD',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})

test('system prompt makes action success actively first person', () => {
  for (const required of [
    'action-success/success: Begin with "I"',
    'Never begin with "You" or "Your"',
    'never switch to a detached second-person account',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})

test('system prompt makes real continuity anchors mandatory', () => {
  for (const required of [
    'When continuityAnchors is non-empty, include at least one supplied anchor in the line.',
    'A generic line that only narrates the current outcome is invalid.',
    'CONTINUITY GATE',
    'the final line MUST include at least one of those exact prior-story details',
    'Never return a context-free success, failure, midpoint, taunt, or ending',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})

test('system prompt turns background selection into causal action', () => {
  for (const required of [
    'scene-intro/intro with introKind background-selection:',
    'Show the chosen background in action at the start of the road',
    'connect it to openingObjective',
    'Do not summarize personality or training.',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})

test('system prompt makes the Goblin King confrontation the climax', () => {
  for (const required of [
    'goblin-king-taunt/taunt:',
    'put fictionalStolenItem visibly under the King\'s control',
    'theatrical, self-satisfied boast',
    'No action has been rolled or resolved yet.',
    'The Goblin King is a performed fictional voice only in goblin-king-taunt.',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})
