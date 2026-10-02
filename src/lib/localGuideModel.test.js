import test from 'node:test'
import assert from 'node:assert/strict'
import { localGuideModelCapability, isLocalGuideModelEnabled, setLocalGuideModelEnabled, LOCAL_GUIDE_MODEL } from './localGuideModel.js'

function fakeStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
  }
}

test('local Guide model requires browser context and WebGPU', () => {
  assert.equal(localGuideModelCapability({}).supported, false)
  assert.equal(localGuideModelCapability({ window: {}, navigator: {} }).supported, false)
  assert.equal(localGuideModelCapability({ window: {}, navigator: { gpu: {} } }).supported, true)
})

test('local Guide model stays disabled until explicit local opt-in', () => {
  const storage = fakeStorage()
  assert.equal(isLocalGuideModelEnabled(storage), false)
  assert.equal(setLocalGuideModelEnabled(true, storage), true)
  assert.equal(isLocalGuideModelEnabled(storage), true)
  setLocalGuideModelEnabled(false, storage)
  assert.equal(isLocalGuideModelEnabled(storage), false)
})

test('prototype model metadata keeps the download visible to UI', () => {
  assert.equal(LOCAL_GUIDE_MODEL.id, 'SmolLM2-1.7B-Instruct-q4f16_1-MLC')
  assert.ok(LOCAL_GUIDE_MODEL.approximateDownloadMB >= 900)
  assert.equal(LOCAL_GUIDE_MODEL.license, 'Apache-2.0')
})
