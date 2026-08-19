// Phase 1 external-test boundary: browser speech recognition is intentionally unavailable.
for (const key of ['SpeechRecognition', 'webkitSpeechRecognition']) {
  try {
    Object.defineProperty(window, key, {
      value: undefined,
      writable: false,
      configurable: true,
    })
  } catch {
    try { window[key] = undefined } catch {}
  }
}
