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

function browserScope({ gpu = false } = {}) {
  return {
    window: {},
    navigator: { ...(gpu ? { gpu: {} } : {}) },
    WebAssembly: {},
    Worker: function Worker() {},
  }
}

test('local Guide model supports CPU/WASM without WebGPU', () => {
  assert.equal(localGuideModelCapability({}).supported, false)
  const cpu = localGuideModelCapability(browserScope())
  assert.equal(cpu.supported, true)
  assert.equal(cpu.backend, 'wasm-cpu')
  const gpu = localGuideModelCapability(browserScope({ gpu: true }))
  assert.equal(gpu.supported, true)
  assert.equal(gpu.webgpu, true)
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
  assert.equal(LOCAL_GUIDE_MODEL.id, 'SmolLM2-1.7B-Instruct-Q4_K_M')
  assert.equal(LOCAL_GUIDE_MODEL.runtime, 'wllama')
  assert.equal(LOCAL_GUIDE_MODEL.repo, 'ngxson/SmolLM2-1.7B-Instruct-Q4_K_M-GGUF')
  assert.equal(LOCAL_GUIDE_MODEL.file, 'smollm2-1.7b-instruct-q4_k_m.gguf')
  assert.ok(LOCAL_GUIDE_MODEL.approximateDownloadMB >= 1000)
  assert.equal(LOCAL_GUIDE_MODEL.license, 'Apache-2.0')
})
