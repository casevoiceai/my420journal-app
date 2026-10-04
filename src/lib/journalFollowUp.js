export function needsPostUseFollowUp(entry) {
  if (!entry || typeof entry !== 'object') return false
  const type = entry.entry_type || 'cannabis'
  return type === 'cannabis' && entry.update_completed !== true
}
