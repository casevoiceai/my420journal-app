import test from 'node:test'
import assert from 'node:assert/strict'
import { completeWithTimeout } from './localModelTimeout.js'

test('local runtime aborts generation after the configured inactivity budget', async () => {
  let sawAbort = false
  const fakeRuntime = {
    createChatCompletion({ abortSignal }) {
      return new Promise((resolve, reject) => {
        abortSignal.addEventListener('abort', () => {
          sawAbort = true
          reject(new Error('aborted'))
        }, { once: true })
      })
    },
  }
  await assert.rejects(() => completeWithTimeout(fakeRuntime, { messages: [] }, 5), /aborted/)
  assert.equal(sawAbort, true)
})

test('local runtime keeps a long generation alive while chunks are arriving', async () => {
  const fakeRuntime = {
    async createChatCompletion({ onData }) {
      await new Promise((resolve) => setTimeout(resolve, 4))
      onData({ choices: [{ delta: { content: 'Hello' }, finish_reason: null }] })
      await new Promise((resolve) => setTimeout(resolve, 4))
      onData({ choices: [{ delta: { content: ' there' }, finish_reason: null }] })
      await new Promise((resolve) => setTimeout(resolve, 4))
      onData({ choices: [{ delta: { content: '.' }, finish_reason: 'stop' }] })
    },
  }

  const result = await completeWithTimeout(fakeRuntime, { messages: [] }, 6)
  assert.equal(result.choices[0].message.content, 'Hello there.')
  assert.equal(result.choices[0].finish_reason, 'stop')
})

test('local runtime requests streaming progress so prompt work can reset the watchdog', async () => {
  let received
  const fakeRuntime = {
    async createChatCompletion(options) {
      received = options
      options.onData({
        id: 'one',
        model: 'local',
        choices: [{ delta: { content: 'Yep.' }, finish_reason: 'stop' }],
      })
    },
  }

  const result = await completeWithTimeout(fakeRuntime, { messages: [] }, 20)
  assert.equal(received.stream, true)
  assert.equal(received.return_progress, true)
  assert.ok(received.abortSignal)
  assert.equal(result.choices[0].message.content, 'Yep.')
})
