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

function errorText(error) {
  return String(error?.message || error?.name || error || 'unknown runtime error').trim()
}

function isAbortLikeError(error) {
  return /abort|timeout|timed out/i.test(`${error?.name || ''} ${error?.message || ''}`)
}

async function loadRuntime({ model, onProgress, forceCpu = false } = {}) {
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
    n_gpu_layers: forceCpu ? 0 : undefined,
    log_level: 3,
  })

  return runtime
}

export async function createBrowserLocalGuideRuntime({ model, onProgress } = {}) {
  let runtime = await loadRuntime({ model, onProgress })
  let backend = runtime.isSupportWebGPU() ? 'webgpu' : 'wasm-cpu'
  let cpuFallbackAttempted = false

  return {
    async complete(params = {}, { timeoutMs = 15000 } = {}) {
      try {
        return await completeWithTimeout(runtime, params, timeoutMs)
      } catch (error) {
        if (backend !== 'webgpu' || cpuFallbackAttempted || isAbortLikeError(error)) throw error
        cpuFallbackAttempted = true
        const gpuError = errorText(error)
        try { await runtime.exit() } catch {}
        onProgress?.({ progress: 0, text: 'Retrying local AI on CPU' })
        try {
          runtime = await loadRuntime({ model, onProgress, forceCpu: true })
          backend = 'wasm-cpu'
          return await completeWithTimeout(runtime, params, timeoutMs)
        } catch (cpuError) {
          throw new Error(`WebGPU failed: ${gpuError}; CPU retry failed: ${errorText(cpuError)}`)
        }
      }
    },
    get backend() { return backend },
    async exit() {
      try { await runtime.exit() } catch {}
    },
  }
}

export const wllamaRuntimeInternals = {
  threadCount,
  progressAdapter,
  errorText,
  isAbortLikeError,
}
