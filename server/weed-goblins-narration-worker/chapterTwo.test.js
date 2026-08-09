import test from 'node:test'
import assert from 'node:assert/strict'

import {
  CHAPTER_TWO_SYSTEM_PROMPT,
  handleChapterTwoNarrationWorkerRequest,
} from './chapterTwo.js'

function request(body, { secret = 'test-secret', ip = '203.0.113.8' } = {}) {
  return new Request('https://worker.test', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
      'CF-Connecting-IP': ip,
    },
    body: JSON.stringify(body),
  })
}

function env(overrides = {}) {
  return {
    WEED_GOBLINS_PROXY_SECRET: 'test-secret',
    WEED_GOBLINS_ANTHROPIC_API_KEY: 'anthropic-test',
    WEED_GOBLINS_RATE_LIMIT_SALT: 'salt-test',
    FREE_TEXT_RATE_LIMITER: {
      getByName() {
        return {
          async fetch() {
            return new Response(JSON.stringify({ allowed: true, retry_after_seconds: 1 }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          },
        }
      },
    },
    ...overrides,
  }
}

function canonicalBody(overrides = {}) {
  return {
    chapterNumber: 2,
    moment: 'scene-intro',
    outcome: 'intro',
    sceneId: 'hollow-market:lantern-order',
    authoritativeText: 'Three smokeless lanterns wait beneath the root bridge.',
    storySoFar: 'You have reached Lantern Mouth.',
    marketState: 'operational',
    wound: 'None',
    ...overrides,
  }
}

test('Chapter 2 worker keeps deterministic mechanics authoritative in the system prompt', () => {
  assert.match(CHAPTER_TWO_SYSTEM_PROMPT, /engine owns every mechanic and result/i)
  assert.match(CHAPTER_TWO_SYSTEM_PROMPT, /Root Collector.*does not negotiate/i)
  assert.match(CHAPTER_TWO_SYSTEM_PROMPT, /living ledger rearranges itself when lied to/i)
  assert.match(CHAPTER_TWO_SYSTEM_PROMPT, /Withered Grove/i)
  assert.match(CHAPTER_TWO_SYSTEM_PROMPT, /raw journal notes/i)
})

test('Chapter 2 narration rejects unauthorized requests', async () => {
  const response = await handleChapterTwoNarrationWorkerRequest(
    request(canonicalBody(), { secret: 'wrong-secret' }),
    env(),
    async () => { throw new Error('model must not be called') },
  )
  assert.equal(response.status, 401)
})

test('Chapter 2 narration rejects unsupported moments and non-Chapter-2 bodies', async () => {
  const invalidMoment = await handleChapterTwoNarrationWorkerRequest(
    request(canonicalBody({ moment: 'goblin-king-taunt', outcome: 'taunt' })),
    env(),
    async () => { throw new Error('model must not be called') },
  )
  assert.equal(invalidMoment.status, 400)

  const wrongChapter = await handleChapterTwoNarrationWorkerRequest(
    request(canonicalBody({ chapterNumber: 1 })),
    env(),
    async () => { throw new Error('model must not be called') },
  )
  assert.equal(wrongChapter.status, 400)
})

test('Chapter 2 worker sends only normalized game context and uses the dedicated Hollow Market prompt', async () => {
  let modelRequest = null
  const fetchImpl = async (_url, options) => {
    modelRequest = JSON.parse(options.body)
    return new Response(JSON.stringify({
      content: [{ type: 'text', text: 'The moth-marked lantern leans toward the root mark. The sealed crack waits on your order.' }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  const response = await handleChapterTwoNarrationWorkerRequest(
    request(canonicalBody({
      recognizedStall: 'mist-cartridge counter',
      counterfeitItem: 'brass mist cartridge',
      notes: 'PRIVATE NOTE MUST NOT PASS',
      voice_transcript: 'PRIVATE TRANSCRIPT MUST NOT PASS',
    })),
    env(),
    fetchImpl,
  )
  assert.equal(response.status, 200)
  assert.ok(modelRequest)
  assert.equal(modelRequest.system, CHAPTER_TWO_SYSTEM_PROMPT)
  const prompt = modelRequest.messages[0].content
  assert.match(prompt, /mist-cartridge counter/)
  assert.match(prompt, /brass mist cartridge/)
  assert.equal(prompt.includes('PRIVATE NOTE MUST NOT PASS'), false)
  assert.equal(prompt.includes('PRIVATE TRANSCRIPT MUST NOT PASS'), false)
})

test('Chapter 2 free-text moments continue to use the existing per-source rate limiter', async () => {
  let limiterCalls = 0
  let modelCalls = 0
  const response = await handleChapterTwoNarrationWorkerRequest(
    request(canonicalBody({
      moment: 'player-action-attempt',
      outcome: 'attempt',
      playerAction: 'I climb the stall awning',
      interpretedAction: 'use height to observe the market route',
      requiresRoll: true,
    })),
    env({
      FREE_TEXT_RATE_LIMITER: {
        getByName() {
          return {
            async fetch() {
              limiterCalls += 1
              return new Response(JSON.stringify({ allowed: true, retry_after_seconds: 1 }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              })
            },
          }
        },
      },
    }),
    async () => {
      modelCalls += 1
      return new Response(JSON.stringify({
        content: [{ type: 'text', text: 'You get one boot onto the awning before the brass hooks start shifting under your weight.' }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    },
  )
  assert.equal(response.status, 200)
  assert.equal(limiterCalls, 1)
  assert.equal(modelCalls, 1)
})
