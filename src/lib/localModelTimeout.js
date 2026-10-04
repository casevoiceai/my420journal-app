function emptyUsage() {
  return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
}

export async function completeWithTimeout(runtime, params = {}, timeoutMs = 15000, { firstTokenTimeoutMs = timeoutMs } = {}) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || typeof AbortController === 'undefined') {
    return runtime.createChatCompletion(params)
  }

  const firstBudget = Number.isFinite(firstTokenTimeoutMs) && firstTokenTimeoutMs > 0
    ? firstTokenTimeoutMs
    : timeoutMs
  const controller = new AbortController()
  let timer = null
  let timedOut = false
  let receivedOutput = false
  let content = ''
  let finishReason = null
  let usage = null
  let model = ''
  let responseId = 'local-guide-stream'
  let created = Math.floor(Date.now() / 1000)

  const armWatchdog = (budgetMs) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, budgetMs)
  }

  // Wllama does not emit onData while it is evaluating the prompt. Give prompt
  // prefill a separate, larger first-token budget; after output starts, use the
  // normal inactivity watchdog between chunks.
  armWatchdog(firstBudget)
  try {
    await runtime.createChatCompletion({
      ...params,
      stream: true,
      abortSignal: controller.signal,
      onData: (chunk = {}) => {
        receivedOutput = true
        armWatchdog(timeoutMs)
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
  } catch (error) {
    if (timedOut) {
      if (!receivedOutput) throw new Error(`Local model produced no first token within ${Math.round(firstBudget / 1000)} seconds.`)
      throw new Error(`Local model stalled for ${Math.round(timeoutMs / 1000)} seconds after output began.`)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}
