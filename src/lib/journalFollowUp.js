export function needsPostUseFollowUp(entry) {
  if (!entry || typeof entry !== 'object') return false
  const type = entry.entry_type || 'cannabis'
  return type === 'cannabis' && entry.update_completed !== true
}


export function buildPostUseUpdatePatch({
  rating,
  sleepQuality,
  moodFace,
  hasSideEffects,
  sideEffects = [],
  notes,
  updatedAt = new Date().toISOString(),
} = {}) {
  return {
    rating: rating || null,
    sleep_quality: sleepQuality || null,
    follow_up_mood_face: moodFace || null,
    follow_up_adverse_event_level: moodFace === 'eww' ? 1 : null,
    side_effects: hasSideEffects ? sideEffects : [],
    follow_up_notes: String(notes || '').trim() || null,
    update_completed: true,
    updated_at: updatedAt,
  }
}

export function followUpMoodFace(entry) {
  if (!entry || typeof entry !== 'object') return null
  if (entry.follow_up_mood_face) return entry.follow_up_mood_face
  if (entry.update_completed === true) return entry.mood_face || null
  return null
}
