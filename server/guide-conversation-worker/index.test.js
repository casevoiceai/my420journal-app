import test from 'node:test'
import assert from 'node:assert/strict'
import { handleGuideConversationWorkerRequest, GUIDE_CONVERSATION_MODEL } from './index.js'

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
  let captured
  const run = async (model, input) => {
    captured = { model, input }
    return { response: 'Okay, weird question: what tiny thing improved your day today?\n[[BRANCHES:[]]]' }
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
  assert.equal(captured.model, GUIDE_CONVERSATION_MODEL)
  const serialized = JSON.stringify(captured.input)
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
  const run = async () => ({ response: 'Hello.\n[[BRANCHES:[]]]' })
  const response = await handleGuideConversationWorkerRequest(
    request({ mode: 'chat', guide: 'bud', messages: [{ role: 'user', content: 'hi' }] }),
    { GUIDE_CONVERSATION_PROXY_SECRET: SECRET },
    run,
  )
  assert.equal(response.headers.has('Access-Control-Allow-Origin'), false)
})
