export const WEED_GOBLINS_COMPOSER_MAX_LENGTH = 160

export function getBrowserSpeechRecognition(windowLike) {
  if (!windowLike || typeof windowLike !== 'object') return null
  return windowLike.SpeechRecognition || windowLike.webkitSpeechRecognition || null
}

export function appendWeedGoblinsVoiceTranscript(
  currentDraft,
  transcript,
  maxLength = WEED_GOBLINS_COMPOSER_MAX_LENGTH,
) {
  const current = typeof currentDraft === 'string' ? currentDraft.trimEnd() : ''
  const spoken = typeof transcript === 'string'
    ? transcript.trim().replace(/\s+/g, ' ')
    : ''
  if (!spoken) return current.slice(0, maxLength)
  const separator = current ? ' ' : ''
  return `${current}${separator}${spoken}`.slice(0, maxLength)
}
