import test from 'node:test'
import assert from 'node:assert/strict'
import { completeWithTimeout } from './localModelTimeout.js'

test('local runtime aborts generation after the configured latency budget', async () => {
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