import { submitContribution } from './sharedAggregateApi.js'
import { mapEntryToSharedContribution } from './sharedContributionMapper.js'
import { getSharedPrivacyState, markSharedSyncComplete } from './sharedPrivacy.js'

const QUEUE_KEY = 'my420journal_shared_contribution_queue_v1'
const MAX_QUEUE_AGE_MS = 7 * 24 * 60 * 60 * 1000
const MAX_ATTEMPTS = 5

function nowIso() {
  return new Date().toISOString()
}

function makeQueueId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `shared_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function storageAvailable() {
  return typeof localStorage !== 'undefined'
}

function safeReadQueue() {
  if (!storageAvailable()) return []
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function safeWriteQueue(queue) {
  if (!storageAvailable()) return
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

function isFresh(item) {
  const queuedAt = new Date(item?.queued_at || 0).getTime()
  if (!queuedAt) return false
  return Date.now() - queuedAt <= MAX_QUEUE_AGE_MS
}

function cleanQueueItem(item) {
  if (!item?.payload || typeof item.payload !== 'object') return null
  if (!isFresh(item)) return null
  if ((item.attempts || 0) >= MAX_ATTEMPTS) return null

  return {
    id: item.id || makeQueueId(),
    queued_at: item.queued_at || nowIso(),
    attempts: Number.isFinite(item.attempts) ? item.attempts : 0,
    last_attempt_at: item.last_attempt_at || null,
    payload: item.payload,
  }
}

export function getQueuedSharedContributions() {
  const queue = safeReadQueue().map(cleanQueueItem).filter(Boolean)
  safeWriteQueue(queue)
  return queue
}

export function clearSharedContributionQueue() {
  safeWriteQueue([])
}

export function enqueueSharedContribution(payload) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, status: 'missing_payload', queued: false }
  }

  const queue = getQueuedSharedContributions()
  const item = {
    id: makeQueueId(),
    queued_at: nowIso(),
    attempts: 0,
    last_attempt_at: null,
    payload,
  }

  safeWriteQueue([...queue, item])

  return {
    ok: true,
    status: 'queued',
    queued: true,
    queue_id: item.id,
  }
}

function canRetry(sharedState = getSharedPrivacyState()) {
  return sharedState.shared_opt_in_enabled === true && sharedState.pending_shared_delete !== true
}

export async function retryQueuedSharedContributions(options = {}) {
  const sharedState = getSharedPrivacyState(options.sharedState || {})
  const queue = getQueuedSharedContributions()

  if (queue.length === 0) {
    return { ok: true, status: 'empty_queue', attempted: 0, submitted: 0, remaining: 0 }
  }

  if (!canRetry(sharedState)) {
    return { ok: true, status: 'shared_opt_in_disabled', attempted: 0, submitted: 0, remaining: queue.length }
  }

  const remaining = []
  let attempted = 0
  let submitted = 0

  for (const item of queue) {
    attempted += 1
    const result = await submitContribution(item.payload)

    if (result.ok) {
      submitted += 1
      continue
    }

    const nextItem = {
      ...item,
      attempts: (item.attempts || 0) + 1,
      last_attempt_at: nowIso(),
    }

    if (cleanQueueItem(nextItem)) remaining.push(nextItem)
  }

  safeWriteQueue(remaining)

  if (submitted > 0) {
    markSharedSyncComplete(sharedState)
  }

  return {
    ok: remaining.length === 0,
    status: remaining.length === 0 ? 'queue_flushed' : 'queue_partially_flushed',
    attempted,
    submitted,
    remaining: remaining.length,
  }
}

export async function submitSanitizedContribution(payload, options = {}) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, status: 'missing_payload', queued: false }
  }

  const result = await submitContribution(payload)

  if (result.ok) {
    markSharedSyncComplete(options.sharedState || {})
    return { ...result, status: 'submitted', queued: false }
  }

  if (options.queueOnFailure === false) {
    return { ...result, queued: false }
  }

  const queueResult = enqueueSharedContribution(payload)
  return {
    ...result,
    status: 'queued_after_failure',
    queued: queueResult.queued === true,
    queue_id: queueResult.queue_id || null,
  }
}

export async function submitEntryContribution(entry, options = {}) {
  try {
    const sharedState = getSharedPrivacyState(options.sharedState || {})

    if (sharedState.shared_opt_in_enabled !== true) {
      clearSharedContributionQueue()
      return { ok: true, status: 'shared_opt_in_disabled', skipped: true }
    }

    if (sharedState.pending_shared_delete === true) {
      return { ok: true, status: 'pending_shared_delete', skipped: true }
    }

    if (!sharedState.anonymous_contributor_id) {
      return { ok: false, status: 'missing_anonymous_contributor_id', skipped: true }
    }

    const payload = mapEntryToSharedContribution(entry, sharedState)

    if (!payload) {
      return { ok: true, status: 'missing_product_key', skipped: true }
    }

    await retryQueuedSharedContributions({ sharedState })
    return await submitSanitizedContribution(payload, { sharedState, queueOnFailure: true })
  } catch (error) {
    return {
      ok: false,
      status: 'shared_contribution_error',
      queued: false,
      error: error?.message || String(error),
    }
  }
}
