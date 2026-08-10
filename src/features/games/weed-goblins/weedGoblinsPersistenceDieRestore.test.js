import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createIncomingChatMessage,
  createRollResultMessage,
} from './weedGoblinsChatControllerChapterOne.js'
import { createWeedGoblinsRun } from './weedGoblinsEngine.js'
import {
  readWeedGoblinsActiveRun,
  saveWeedGoblinsActiveRun,
  weedGoblinsActiveRunStorageKey,
} from './weedGoblinsPersistenceChapterOne.js'

function memoryStorage() {
  const values = new Map()
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null
    },
    setItem(key, value) {
      values.set(key, String(value))
    },
    removeItem(key) {
      values.delete(key)
    },
  }
}

test('ordinary narration restores without a false D20 while a real natural 1 remains a roll result', () => {
  const storage = memoryStorage()
  const userId = 'die-restore-test'
  const state = createWeedGoblinsRun({ seed: 'die-restore-test-seed' })
  const opening = createIncomingChatMessage('The trail climbs into the fog.')
  const realRoll = createRollResultMessage(1, [1])

  saveWeedGoblinsActiveRun({
    storage,
    userId,
    state,
    messages: [opening, realRoll],
  })

  const key = weedGoblinsActiveRunStorageKey(userId)
  const freshRecord = JSON.parse(storage.getItem(key))
  assert.equal(freshRecord.messages[0].die, null)
  assert.equal(freshRecord.messages[1].die, 1)
  assert.equal(freshRecord.messages[1].kind, 'roll-result')

  freshRecord.messages[0].die = 1
  storage.setItem(key, JSON.stringify(freshRecord))

  const restored = readWeedGoblinsActiveRun({ storage, userId })
  assert.ok(restored)
  assert.equal(restored.messages[0].die, null)
  assert.equal(restored.messages[1].die, 1)
  assert.equal(restored.messages[1].kind, 'roll-result')
})
