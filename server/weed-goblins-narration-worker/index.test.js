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
  assert.match(forwarded.messages[0].content, /next ordinary failure GM turn/)
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
  assert.match(forwarded.messages[0].content, /next player action setup GM turn/)
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

test('system prompt defines Eliza as a real GM with a separate fiction register', () => {
  for (const required of [
    'You are Eliza, the GameMaster of Weed Goblins.',
    'TWO REGISTERS, NEVER BLENDED',
    'FICTION REGISTER',
    'TABLE-ASIDE REGISTER',
    'The deterministic engine owns legal actions, DCs, Strength, Defense, Mana, D20 results, Trouble, wounds, Rootcoin, inventory, rewards, rooms, campaign state, and endings.',
    'Dramatize the ruling, not the mathematics behind it.',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})

test('system prompt preserves 7.25 weirdness without forcing jokes', () => {
  for (const required of [
    'Target weirdness around 7.25 out of 10 across the world, not in every sentence.',
    'Story clarity outranks the joke.',
    'treats ridiculous facts as ordinary facts of life',
    'Do not stack three jokes to prove the game is whimsical.',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})

test('system prompt keeps goblins distinct and motivated', () => {
  for (const required of [
    'GOBLIN PERFORMANCE',
    'petty bureaucracy',
    'promotion rivalries',
    'The Goblin King is loud, ceremonial, theatrical, and more frightened than he admits.',
    'Nib wants a promotion and does not want anyone hurt.',
    'Grubbin is practical, competent',
    'Old Tatter is a retired raider',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})

test('system prompt requires varied human cadence and sensory grounding', () => {
  for (const required of [
    'Write like someone improvising coherently out loud',
    'One GM turn is one coherent messenger bubble, usually two to five sentences',
    'Fragments are punctuation for dramatic effect, not the default structure.',
    'roughly one sentence in four or five may break grammatical completeness',
    'This is a rhythm tool, not a content tool.',
    'Do not open narration with "I watch"',
    'two or more connected physical details',
    'sound, smell, temperature, weather on skin, footing, texture, weight, distance, posture, object behavior, and NPC behavior',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})

test('system prompt keeps Eliza separate from S.T.O.N.E.R. and protects safety and canon', () => {
  for (const required of [
    'separate from S.T.O.N.E.R.',
    '1966 ELIZA chatbot',
    "ELIZA's Mirror",
    'Danger tiers are exactly Sprout, Bloom, Harvest, and Wither.',
    'Wound severity is exactly Scraped, Bruised, Broken, and Downed.',
    'Rootcoin is canonically tied to Ashka Greyroot',
    'Do not reveal Ashka Greyroot in Chapter 1 unless the authoritative context explicitly authorizes that reveal.',
    'Never introduce or repeat a real product',
    'When narrationTier is "normal"',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})

test('system prompt keeps opening, continuity, action, and ending contracts without the old narrator lock', () => {
  for (const required of [
    'scene-intro/highlands-opening:',
    'Establish the Highlands with physical orientation and sensory grounding.',
    'Do not introduce Eliza as "the narrator" inside the fiction.',
    'scene-intro/choice-presentation:',
    'Two or three connected details are welcome.',
    'When continuityAnchors is non-empty, naturally include at least one supplied anchor.',
    'player-action-attempt/attempt:',
    'The separate table-aside handles mechanics.',
    'goblin-king-taunt/taunt:',
    "Put fictionalStolenItem visibly under the King's control",
    'No roll has resolved yet.',
    'run-ending/recovery:',
    'run-ending/bargain:',
    'run-ending/escape:',
  ]) {
    assert.equal(WEED_GOBLINS_SYSTEM_PROMPT.includes(required), true, required)
  }
})
