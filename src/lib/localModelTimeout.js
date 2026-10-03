export async function completeWithTimeout(runtime, params = {}, timeoutMs = 15000) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || typeof AbortController === 'undefined') {
    return runtime.createChatCompletion(params)
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await runtime.createChatCompletion({ ...params, abortSignal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}