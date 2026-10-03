import { Wllama } from '@wllama/wllama'
import wasmUrl from '@wllama/wllama/esm/wasm/wllama.wasm?url'
import { completeWithTimeout } from './localModelTimeout.js'

function threadCount(scope = globalThis) {
  const logical = Number(scope?.navigator?.hardwareConcurrency || 4)
  if (!scope?.crossOriginIsolated) return 1
  return Math.max(1, Math.min(6, logical - 2 || 1))
}


function progressAdapter(onProgress) {
  return ({ loaded = 0, total = 0 } = {}) => {
    const progress = total > 0 ? loaded / total : 0
    onProgress?.({
      progress,
      text: total > 0 ? `Downloading local model ${Math.round(progress * 100)}%` : 'Preparing local model',
    })
  }
}

export async function createBrowserLocalGuideRuntime({ model, onProgress } = {}) {
  const runtime = new Wllama({ default: wasmUrl }, {
    suppressNativeLog: true,
    parallelDownloads: 3,
  })

  await runtime.loadModelFromHF({
    repo: model.repo,
    file: model.file,
  }, {
    useCache: true,
    progressCallback: progressAdapter(onProgress),
    n_ctx: 4096,
    n_threads: threadCount(),
    log_level: 3,
  })

  return {
    async complete(params = {}, { timeoutMs = 15000 } = {}) {
      return completeWithTimeout(runtime, params, timeoutMs)
    },
    backend: runtime.isSupportWebGPU() ? 'webgpu' : 'wasm-cpu',
  }
}

export const wllamaRuntimeInternals = {
  threadCount,
  progressAdapter,
}
