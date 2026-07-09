const NOT_CONNECTED = {
  ok: false,
  connected: false,
  status: 'not_connected',
  message: 'Shared signals backend is not connected yet.',
}

export async function syncOptInStatus() {
  return {
    ...NOT_CONNECTED,
    action: 'sync_opt_in_status',
  }
}

export async function requestOptOutDeletion() {
  return {
    ...NOT_CONNECTED,
    action: 'request_opt_out_deletion',
    message: 'Shared signals backend is not connected yet. Opt-out deletion will need to be sent when the backend is live.',
  }
}

export async function fetchAggregateResults() {
  return {
    ...NOT_CONNECTED,
    action: 'fetch_aggregate_results',
    data: [],
  }
}

export function isSharedBackendConnected(response) {
  return response?.connected === true
}
