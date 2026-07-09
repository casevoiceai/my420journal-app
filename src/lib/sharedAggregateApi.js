const SHARED_WORKER_BASE_URL = 'https://my420journal-shared-worker.casevoice-ai.workers.dev'

async function readResponseBody(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

function failureMessage(response, body) {
  if (body?.error) return body.error
  if (body?.message) return body.message
  if (response.status === 400) return 'The shared signals request was missing required information.'
  if (response.status === 404) return 'The shared signals route was not found.'
  return 'The shared signals request failed.'
}

async function workerRequest(path, options = {}) {
  try {
    const response = await fetch(`${SHARED_WORKER_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })
    const body = await readResponseBody(response)
    const ok = response.ok && body?.ok !== false

    if (!ok) {
      return {
        ok: false,
        connected: true,
        status: 'error',
        http_status: response.status,
        message: failureMessage(response, body),
        body,
      }
    }

    return {
      ok: true,
      connected: true,
      status: 'ok',
      http_status: response.status,
      message: body?.message || '',
      body,
    }
  } catch (error) {
    return {
      ok: false,
      connected: false,
      status: 'network_error',
      http_status: null,
      message: 'Could not reach the shared signals backend.',
      error: error?.message || String(error),
    }
  }
}

export async function syncOptInStatus(sharedState = {}) {
  if (!sharedState.anonymous_contributor_id) {
    return {
      ok: false,
      connected: false,
      status: 'missing_anonymous_contributor_id',
      action: 'sync_opt_in_status',
      message: 'Anonymous contributor ID is required before syncing opt-in status.',
    }
  }

  const result = await workerRequest('/contributors/opt-in', {
    method: 'POST',
    body: JSON.stringify({
      anonymous_contributor_id: sharedState.anonymous_contributor_id,
      shared_opt_in_at: sharedState.shared_opt_in_at || null,
      app_version: sharedState.app_version || 'my420journal-web',
    }),
  })

  return {
    ...result,
    action: 'sync_opt_in_status',
  }
}

export async function requestOptOutDeletion(sharedState = {}) {
  if (!sharedState.anonymous_contributor_id) {
    return {
      ok: false,
      connected: false,
      status: 'missing_anonymous_contributor_id',
      action: 'request_opt_out_deletion',
      message: 'Anonymous contributor ID is required before requesting shared data deletion.',
    }
  }

  const result = await workerRequest('/contributors/opt-out', {
    method: 'POST',
    body: JSON.stringify({
      anonymous_contributor_id: sharedState.anonymous_contributor_id,
    }),
  })

  return {
    ...result,
    action: 'request_opt_out_deletion',
  }
}

export async function submitContribution(contribution = {}) {
  if (!contribution.anonymous_contributor_id) {
    return {
      ok: false,
      connected: false,
      status: 'missing_anonymous_contributor_id',
      action: 'submit_contribution',
      message: 'Anonymous contributor ID is required before submitting a shared contribution.',
    }
  }

  if (!contribution.product_key) {
    return {
      ok: false,
      connected: false,
      status: 'missing_product_key',
      action: 'submit_contribution',
      message: 'Product key is required before submitting a shared contribution.',
    }
  }

  const result = await workerRequest('/contributions', {
    method: 'POST',
    body: JSON.stringify(contribution),
  })

  return {
    ...result,
    action: 'submit_contribution',
  }
}

export async function fetchAggregateResults({ productKey, regionBucket } = {}) {
  const params = new URLSearchParams()
  if (productKey) params.set('product_key', productKey)
  if (regionBucket) params.set('region_bucket', regionBucket)

  const path = `/aggregates${params.toString() ? `?${params.toString()}` : ''}`
  const result = await workerRequest(path, { method: 'GET' })

  if (!result.ok) {
    return {
      ...result,
      action: 'fetch_aggregate_results',
      aggregate: null,
      data: [],
    }
  }

  return {
    ...result,
    action: 'fetch_aggregate_results',
    aggregate: result.body,
    data: result.body ? [result.body] : [],
  }
}

export function isSharedBackendConnected(response) {
  return response?.connected === true
}
