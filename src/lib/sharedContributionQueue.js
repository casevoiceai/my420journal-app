const QUEUE_KEY = 'my420journal_shared_contribution_queue_v1'

function storageAvailable() {
  return typeof localStorage !== 'undefined'
}

function clearQueueStorage() {
  if (!storageAvailable()) return
  localStorage.setItem(QUEUE_KEY, JSON.stringify([]))
}

export function getQueuedSharedContributions() {
  clearQueueStorage()
  return []
}

export function clearSharedContributionQueue() {
  clearQueueStorage()
}

export function enqueueSharedContribution() {
  clearQueueStorage()
  return {
    ok: true,
    status: 'shared_journey_disabled',
    queued: false,
    skipped: true,
  }
}

export async function retryQueuedSharedContributions() {
  clearQueueStorage()
  return {
    ok: true,
    status: 'shared_journey_disabled',
    attempted: 0,
    submitted: 0,
    remaining: 0,
    skipped: true,
  }
}

export async function submitSanitizedContribution() {
  clearQueueStorage()
  return {
    ok: true,
    status: 'shared_journey_disabled',
    queued: false,
    skipped: true,
  }
}

export async function submitEntryContribution() {
  clearQueueStorage()
  return {
    ok: true,
    status: 'shared_journey_disabled',
    queued: false,
    skipped: true,
  }
}
