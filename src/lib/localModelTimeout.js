function emptyUsage() {
  return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
}

export async function completeWithTimeout(runtime, params = {}, timeoutMs = 15000) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || typeof AbortController === 'undefined') {
    return runtime.createChatCompletion(params)
  }

  const controller = new AbortController()
  let timer = null
  let content = ''
  let finishReason = null
  let usage = null
  let model = ''
  let responseId = 'local-guide-stream'
  let created = Math.floor(Date.now() / 1000)

  const resetWatchdog = () => {
    clearTimeout(timer)
    timer = setTimeout(() => controller.abort(), timeoutMs)
  }

  resetWatchdog()
  try {
    await runtime.createChatCompletion({
      ...params,
      stream: true,
      return_progress: true,
      abortSignal: controller.signal,
      onData: (chunk = {}) => {
        // Timeout means inactivity, not total wall-clock generation time.
        // Prompt-progress and token chunks both prove the local model is alive.
        resetWatchdog()
        const choice = chunk?.choices?.[0]
        const delta = choice?.delta?.content
        if (typeof delta === 'string') content += delta
        if (choice?.finish_reason) finishReason = choice.finish_reason
        if (chunk?.usage) usage = chunk.usage
        if (chunk?.model) model = chunk.model
        if (chunk?.id) responseId = chunk.id
        if (chunk?.created) created = chunk.created
      },
    })

    return {
      id: responseId,
      object: 'chat.completion',
      created,
      model,
      choices: [{
        index: 0,
        message: { role: 'assistant', content },
        finish_reason: finishReason || 'stop',
        logprobs: null,
      }],
      usage: usage || emptyUsage(),
    }
  } finally {
    clearTimeout(timer)
  }
}
