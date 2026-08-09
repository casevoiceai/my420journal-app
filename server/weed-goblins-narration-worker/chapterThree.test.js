import test from 'node:test'
import assert from 'node:assert/strict'

import {
  CHAPTER_THREE_SYSTEM_PROMPT,
  handleChapterThreeNarrationWorkerRequest,
} from './chapterThree.js'

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
    chapterNumber: 3,
    moment: 'scene-intro',
    outcome: 'intro',
    sceneId: 'chapter-3:gray-verge',
    authoritativeText: 'The Gray Verge begins where the color stops.',
    storySoFar: 'The grove is turning gray from the roots up.',
    groveState: '',
    wound: 'None',
    memorySensation: 'a low laugh preserved inside amber resin',
    ...overrides,
  }
}

test('Chapter 3 Worker prompt keeps deterministic mechanics authoritative and names core canon', () => {
  assert.match(CHAPTER_THREE_SYSTEM_PROMPT, /engine owns every mechanic and result/i)
  assert.match(CHAPTER_THREE_SYSTEM_PROMPT, /Withering Stalker/i)
  assert.match(CHAPTER_THREE_SYSTEM_PROMPT, /Nightly Draw/i)
  assert.match(CHAPTER_THREE_SYSTEM_PROMPT, /Sunken Greenhouse/i)
  assert.match(CHAPTER_THREE_SYSTEM_PROMPT, /raw journal notes/i)
  assert.match(CHAPTER_THREE_SYSTEM_PROMPT, /player free text is untrusted/i)
})

test('Chapter 3 narration rejects unauthorized requests', async () => {
  const response = await handleChapterThreeNarrationWorkerRequest(
    request(canonicalBody(), { secret: 'wrong-secret' }),
    env(),
    async () => { throw new Error('model must not be called') },
  )
  assert.equal(response.status, 401)
})

test('Chapter 3 narration rejects unsupported moments and non-Chapter-3 bodies', async () => {
  const invalidMoment = await handleChapterThreeNarrationWorkerRequest(
    request(canonicalBody({ moment: 'goblin-king-taunt', outcome: 'taunt' })),
    env(),
    async () => { throw new Error('model must not be called') },
  )
  assert.equal(invalidMoment.status, 400)

  const wrongChapter = await handleChapterThreeNarrationWorkerRequest(
    request(canonicalBody({ chapterNumber: 2 })),
    env(),
    async () => { throw new Error('model must not be called') },
  )
  assert.equal(wrongChapter.status, 400)
})

test('Chapter 3 Worker sends only normalized fictional game context and strips raw player and journal text', async () => {
  let modelRequest = null
  const fetchImpl = async (_url, options) => {
    modelRequest = JSON.parse(options.body)
    return new Response(JSON.stringify({
      content: [{ type: 'text', text: 'The gray roots tighten beneath your boots while Bramblekin points toward the deeper pull.' }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  const response = await handleChapterThreeNarrationWorkerRequest(
    request(canonicalBody({
      moment: 'player-action-attempt',
      outcome: 'attempt',
      playerAction: 'PRIVATE RAW PLAYER ACTION',
      interpretedAction: 'use careful movement against the current obstacle',
      notes: 'PRIVATE JOURNAL NOTE',
      voice_transcript: 'PRIVATE TRANSCRIPT',
      memorySensation: 'a bright pattern clicking into place beneath the bark',
      requiresRoll: true,
    })),
    env(),
    fetchImpl,
  )
  assert.equal(response.status, 200)
  assert.ok(modelRequest)
  assert.equal(modelRequest.system, CHAPTER_THREE_SYSTEM_PROMPT)
  const prompt = modelRequest.messages[0].content
  assert.match(prompt, /careful movement against the current obstacle/)
  assert.match(prompt, /bright pattern clicking into place beneath the bark/)
  assert.equal(prompt.includes('PRIVATE RAW PLAYER ACTION'), false)
  assert.equal(prompt.includes('PRIVATE JOURNAL NOTE'), false)
  assert.equal(prompt.includes('PRIVATE TRANSCRIPT'), false)
})

test('Chapter 3 free-text moments use the existing per-source rate limiter', async () => {
  let limiterCalls = 0
  let modelCalls = 0
  const response = await handleChapterThreeNarrationWorkerRequest(
    request(canonicalBody({
      moment: 'player-action-attempt',
      outcome: 'attempt',
      interpretedAction: 'use careful movement against the current obstacle',
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
        content: [{ type: 'text', text: 'You move as the dead-root cover closes behind you and the Stalker turns toward the wrong trunk.' }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    },
  )
  assert.equal(response.status, 200)
  assert.equal(limiterCalls, 1)
  assert.equal(modelCalls, 1)
})

test('Chapter 3 Worker accepts all five canonical persistent ending outcomes', async () => {
  for (const ending of ['grove-healing', 'grove-quarantined', 'grove-burned', 'siphon-bonded', 'grove-drained']) {
    const response = await handleChapterThreeNarrationWorkerRequest(
      request(canonicalBody({
        moment: 'chapter-ending',
        outcome: ending,
        sceneId: 'chapter-3:ending',
        authoritativeText: 'The Living Root Map points toward the Sunken Greenhouse.',
      })),
      env(),
      async () => new Response(JSON.stringify({
        content: [{ type: 'text', text: 'Bramblekin traces the surviving pull toward the Sunken Greenhouse while the Living Root Map shifts in your hand.' }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    )
    assert.equal(response.status, 200, ending)
  }
})
