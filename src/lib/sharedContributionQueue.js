import { requestOptOutDeletion } from './sharedAggregateApi'
import { disableSharedOptIn, getSharedPrivacyState } from './sharedPrivacy'

const QUEUE_KEY = 'my420journal_shared_contribution_queue_v1'

function storageAvailable() {
  return typeof localStorage !== 'undefined'
}

function clearQueueStorage() {
  if (!storageAvailable()) return
  localStorage.setItem(QUEUE_KEY, JSON.stringify([]))
}

async function retireExistingSharedState() {
  clearQueueStorage()
  const current = getSharedPrivacyState()
  const hadSharedIdentity = Boolean(current.anonymous_contributor_id)
  const wasEnabled = current.shared_opt_in_enabled === true
  const pendingDelete = current.pending_shared_delete === true

  if (!hadSharedIdentity && !wasEnabled && !pendingDelete) {
    return { cleanup_requested: false }
  }

  const retired = disableSharedOptIn(current)

  if (!retired.anonymous_contributor_id) {
    return { cleanup_requested: false }
  }

  try {
    const result = await requestOptOutDeletion(retired)
    return { cleanup_requested: result?.ok === true }
  } catch {
    // Fail closed: sharing stays disabled locally. A later app start retries cleanup.
    return { cleanup_requested: false }
  }
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
  const cleanup = await retireExistingSharedState()
  return {
    ok: true,
    status: 'shared_journey_disabled',
    attempted: 0,
    submitted: 0,
    remaining: 0,
    skipped: true,
    ...cleanup,
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
