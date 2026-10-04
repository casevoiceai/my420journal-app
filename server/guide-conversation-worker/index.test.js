import test from 'node:test'
import assert from 'node:assert/strict'
import { handleGuideConversationWorkerRequest, GUIDE_CONVERSATION_MODEL, guideConversationWorkerInternals } from './index.js'

const SECRET = 'test-guide-secret'

function request(body, secret = SECRET) {
  return new Request('https://guide.internal/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

test('Guide Worker rejects missing or wrong authorization before model access', async () => {
  let calls = 0
  const run = async () => { calls += 1; return { response: 'should not run' } }
  const missing = new Request('https://guide.internal/', { method: 'POST', body: '{}' })
  const r1 = await handleGuideConversationWorkerRequest(missing, { GUIDE_CONVERSATION_PROXY_SECRET: SECRET }, run)
  assert.equal(r1.status, 401)
  const r2 = await handleGuideConversationWorkerRequest(request({ mode: 'chat', guide: 'sunny', messages: [{ role: 'user', content: 'hi' }] }, 'wrong'), { GUIDE_CONVERSATION_PROXY_SECRET: SECRET }, run)
  assert.equal(r2.status, 401)
  assert.equal(calls, 0)
})

test('Guide Worker rejects invalid Guide packets', async () => {
  let calls = 0
  const run = async () => { calls += 1; return { response: 'no' } }
  const response = await handleGuideConversationWorkerRequest(
    request({ mode: 'chat', guide: 'unknown', messages: [{ role: 'user', content: 'hi' }] }),
    { GUIDE_CONVERSATION_PROXY_SECRET: SECRET },
    run,
  )
  assert.equal(response.status, 400)
  assert.equal(calls, 0)
})

test('Guide Worker sends only normalized conversation packet to Workers AI', async () => {
  const captured = []
  const run = async (model, input) => {
    captured.push({ model, input })
    if (captured.length === 1) return { response: 'Okay, weird question: what tiny thing improved your day today?\n[[BRANCHES:[]]]' }
    return { response: '{"pass":true,"issues":[],"critique":""}' }
  }
  const response = await handleGuideConversationWorkerRequest(
    request({
      mode: 'chat',
      guide: 'sunny',
      messages: [{ role: 'user', content: "I'm bored. Talk to me." }],
      contextFacts: ['User explicitly prefers short replies.'],
      journalDatabase: 'FULL_PRIVATE_JOURNAL_SHOULD_NOT_PASS',
      privateNotes: 'RAW_PRIVATE_NOTES_SHOULD_NOT_PASS',
    }),
    { GUIDE_CONVERSATION_PROXY_SECRET: SECRET },
    run,
  )
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.match(body.content, /weird question/i)
  assert.equal(body.quality_checked, true)
  assert.equal(captured[0].model, GUIDE_CONVERSATION_MODEL)
  const serialized = JSON.stringify(captured)
  assert.doesNotMatch(serialized, /FULL_PRIVATE_JOURNAL_SHOULD_NOT_PASS/)
  assert.doesNotMatch(serialized, /RAW_PRIVATE_NOTES_SHOULD_NOT_PASS/)
  assert.match(serialized, /User explicitly prefers short replies/)
  assert.match(serialized, /I'm bored\. Talk to me\./)
})

test('Guide Worker classifier returns parsed JSON only after authorization', async () => {
  const run = async () => ({ response: '{"route":"general","intent":"general_chat","entity":null,"secondary_entity":null,"confidence":0.94}' })
  const response = await handleGuideConversationWorkerRequest(
    request({ mode: 'classify', guide: 'larry', messages: [{ role: 'user', content: 'Tell me something random.' }] }),
    { GUIDE_CONVERSATION_PROXY_SECRET: SECRET },
    run,
  )
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.decision.route, 'general')
  assert.equal(body.decision.confidence, 0.94)
})

test('Guide Worker does not expose browser CORS headers', async () => {
  let calls = 0
  const run = async () => {
    calls += 1
    return calls === 1
      ? { response: 'Hello.\n[[BRANCHES:[]]]' }
      : { response: '{"pass":true,"issues":[],"critique":""}' }
  }
  const response = await handleGuideConversationWorkerRequest(
    request({ mode: 'chat', guide: 'bud', messages: [{ role: 'user', content: 'hi' }] }),
    { GUIDE_CONVERSATION_PROXY_SECRET: SECRET },
    run,
  )
  assert.equal(response.headers.has('Access-Control-Allow-Origin'), false)
})

test('hosted prompt preserves Guide-specific tastes instead of mirroring the user', () => {
  const prompt = guideConversationWorkerInternals.characterPrompt('sunny')
  assert.match(prompt, /Topic tastes:/i)
  assert.match(prompt, /Music is dangerous because I can attach a whole year of my life to four notes/i)
  assert.match(prompt, /I love pop, live shows, and playlists/i)
  assert.match(prompt, /INDEPENDENT TASTE:/i)
  assert.match(prompt, /Do not automatically agree with the user/i)
  assert.match(prompt, /If your taste differs, acknowledge theirs naturally/i)
})


test('quality gate catches Sunny mirroring the user and rewrites once', async () => {
  const calls = []
  const run = async (model, input) => {
    calls.push({ model, input })
    if (calls.length === 1) return { response: 'Classics are the best! I love them too.\n[[BRANCHES:[]]]' }
    if (calls.length === 2) return { response: '{"pass":false,"issues":["mirroring"],"critique":"Sunny just adopted the user’s preference. Keep Sunny’s established pop/live-show taste while connecting naturally."}' }
    if (calls.length === 3) return { response: 'Classics, okay. I am more of a pop-and-live-show person, but Fleetwood Mac absolutely gets me. What kind of classics are your thing?\n[[BRANCHES:[]]]' }
    return { response: '{"pass":true,"issues":[],"critique":""}' }
  }
  const response = await handleGuideConversationWorkerRequest(
    request({
      mode: 'chat',
      guide: 'sunny',
      messages: [
        { role: 'assistant', content: 'What kind of music do you like?' },
        { role: 'user', content: "I'm more into classics" },
      ],
    }),
    { GUIDE_CONVERSATION_PROXY_SECRET: SECRET },
    run,
  )
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.doesNotMatch(body.content, /Classics are the best/i)
  assert.match(body.content, /more of a pop-and-live-show person/i)
  assert.equal(calls.length, 4)
  assert.match(JSON.stringify(calls[2].input), /QUALITY CORRECTION/i)
})

test('quality gate repairs instead of reporting service unavailable after two rejected Guide drafts', async () => {
  let calls = 0
  const run = async () => {
    calls += 1
    if (calls === 1 || calls === 3) return { response: 'Whatever you like is the best!\n[[BRANCHES:[]]]' }
    if (calls === 2 || calls === 4) return { response: { pass: false, issues: ['mirroring'], critique: 'Do not mirror the user.' } }
    if (calls === 5) return { response: { content: 'I can see why classics work for you. I am still more of a pop-and-live-show person myself. What is the part you come back to most?\n[[BRANCHES:[]]]' } }
    return { response: { pass: true, issues: [], critique: '' } }
  }
  const response = await handleGuideConversationWorkerRequest(
    request({ mode: 'chat', guide: 'sunny', messages: [{ role: 'user', content: "I'm more into classics" }] }),
    { GUIDE_CONVERSATION_PROXY_SECRET: SECRET },
    run,
  )
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.match(body.content, /pop-and-live-show person/i)
  assert.equal(body.quality_repaired, true)
  assert.equal(body.quality_checked, true)
  assert.equal(body.quality_fallback, false)
  assert.equal(calls, 6)
})

test('quality gate returns deterministic conversation recovery instead of unavailable or hallucinated repair', async () => {
  let calls = 0
  const run = async () => {
    calls += 1
    if (calls === 1 || calls === 3) return { response: 'Whatever you like is the best!\n[[BRANCHES:[]]]' }
    if (calls === 2 || calls === 4) return { response: { pass: false, issues: ['mirroring'], critique: 'Do not mirror the user.' } }
    if (calls === 5) return { response: { content: "Lorde's Melodrama is such a great choice.\n[[BRANCHES:[]]]" } }
    return { response: { pass: false, issues: ['invented_user_memory'], critique: 'The user never chose that album.' } }
  }
  const response = await handleGuideConversationWorkerRequest(
    request({ mode: 'chat', guide: 'sunny', messages: [{ role: 'user', content: 'album that resonates with you on a deeper level' }] }),
    { GUIDE_CONVERSATION_PROXY_SECRET: SECRET },
    run,
  )
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.doesNotMatch(body.content, /Melodrama/i)
  assert.match(body.content, /tangled that one up/i)
  assert.equal(body.quality_repaired, true)
  assert.equal(body.quality_checked, false)
  assert.equal(body.quality_fallback, true)
  assert.equal(calls, 6)
})

test('quality gate rejects reply chips that are fragments of the Guide question', async () => {
  const calls = []
  const run = async (model, input) => {
    calls.push({ model, input })
    if (calls.length === 1) return { response: 'Do you have a favorite song or album that resonates with you on a deeper level?\n[[BRANCHES:["album that resonates with you on a deeper level"]]]' }
    if (calls.length === 2) return { response: { pass: false, issues: ['branch_quality'], critique: 'The reply chip is a fragment of the Guide question, not a natural user reply.' } }
    if (calls.length === 3) return { response: 'Do you have a favorite song or album that really sticks with you?\n[[BRANCHES:["Disintegration","Violator"]]]' }
    return { response: { pass: true, issues: [], critique: '' } }
  }
  const response = await handleGuideConversationWorkerRequest(
    request({ mode: 'chat', guide: 'sunny', messages: [{ role: 'user', content: 'Their lyrics' }] }),
    { GUIDE_CONVERSATION_PROXY_SECRET: SECRET },
    run,
  )
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.doesNotMatch(body.content, /album that resonates with you on a deeper level/)
  assert.match(body.content, /Disintegration/)
  assert.equal(calls.length, 4)
})

test('quality gate catches invented matching favorites after the user names exact artists', async () => {
  const calls = []
  const run = async (model, input) => {
    calls.push({ model, input })
    if (calls.length === 1) return { response: 'Dark wave and synth-pop, I love it! I have a soft spot for The Cure\'s Disintegration, and Depeche Mode\'s Violator is another favorite of mine. My own playlists are usually more upbeat.\n[[BRANCHES:[]]]' }
    if (calls.length === 2) return { response: { pass: false, issues: ['invented_character_preference'], critique: 'Sunny invented strong specific favorites for the exact artists the user just named. She may appreciate them, but should keep her established pop/live-show tastes unless prior canon supports those favorites.' } }
    if (calls.length === 3) return { response: 'The Cure and Depeche Mode have a great atmosphere. I am usually more in the pop-and-live-show lane myself, so my playlists skew brighter and more current. What pulls you toward those two?\n[[BRANCHES:[]]]' }
    return { response: { pass: true, issues: [], critique: '' } }
  }
  const response = await handleGuideConversationWorkerRequest(
    request({
      mode: 'chat',
      guide: 'sunny',
      messages: [
        { role: 'assistant', content: 'What kind of tunes do you vibe with?' },
        { role: 'user', content: 'I mostly listen to The Cure and Depeche Mode. What about you?' },
      ],
    }),
    { GUIDE_CONVERSATION_PROXY_SECRET: SECRET },
    run,
  )
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.doesNotMatch(body.content, /soft spot for The Cure|Violator is another favorite/i)
  assert.match(body.content, /pop-and-live-show lane/i)
  assert.equal(calls.length, 4)
  assert.match(JSON.stringify(calls[2].input), /QUALITY CORRECTION/i)
})

test('ordinary chat generation exception returns conversational fallback instead of 502', async () => {
  const run = async () => { throw new Error('temporary Workers AI failure') }
  const response = await handleGuideConversationWorkerRequest(
    request({ mode: 'chat', guide: 'sunny', messages: [{ role: 'user', content: 'Keep talking to me.' }] }),
    { GUIDE_CONVERSATION_PROXY_SECRET: SECRET },
    run,
  )
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.match(body.content, /tangled that one up/i)
  assert.equal(body.quality_fallback, true)
  assert.equal(body.quality_checked, false)
})

test('ordinary chat reviewer exception returns conversational fallback instead of 502', async () => {
  let calls = 0
  const run = async () => {
    calls += 1
    if (calls === 1) return { response: 'I was thinking about rainy-day playlists. What do you put on when the weather turns gray?\n[[BRANCHES:[]]]' }
    throw new Error('temporary review failure')
  }
  const response = await handleGuideConversationWorkerRequest(
    request({ mode: 'chat', guide: 'sunny', messages: [{ role: 'user', content: 'Keep talking to me.' }] }),
    { GUIDE_CONVERSATION_PROXY_SECRET: SECRET },
    run,
  )
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.match(body.content, /tangled that one up/i)
  assert.equal(body.quality_fallback, true)
  assert.equal(body.quality_checked, false)
  assert.ok(calls >= 2)
})
