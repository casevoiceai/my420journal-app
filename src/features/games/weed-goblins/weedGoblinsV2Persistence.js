import { validateV2State } from './weedGoblinsV2State.js'

const DB_NAME = 'my420journal-weed-goblins-v2'
const DB_VERSION = 1
const SNAPSHOT_STORE = 'snapshots'
const LEDGER_STORE = 'ledger'
const HISTORY_STORE = 'history'

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'))
  })
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed.'))
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted.'))
  })
}

function snapshotOnly(state) {
  const { ledger, history, ...snapshot } = state
  return JSON.parse(JSON.stringify(snapshot))
}

function ledgerRecords(state) {
  return state.ledger.map((event, index) => ({
    ...JSON.parse(JSON.stringify(event)),
    campaignId: state.campaignId,
    sequence: Number.isInteger(event.sequence) ? event.sequence : index + 1,
  }))
}

function historyRecords(state) {
  return state.history.map((entry, index) => ({
    ...JSON.parse(JSON.stringify(entry)),
    campaignId: state.campaignId,
    sequence: index + 1,
  }))
}

export function openWeedGoblinsV2Database(indexedDb = typeof indexedDB === 'undefined' ? null : indexedDB) {
  if (!indexedDb || typeof indexedDb.open !== 'function') {
    return Promise.reject(new Error('IndexedDB is not available.'))
  }

  return new Promise((resolve, reject) => {
    const request = indexedDb.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
        db.createObjectStore(SNAPSHOT_STORE, { keyPath: 'campaignId' })
      }
      if (!db.objectStoreNames.contains(LEDGER_STORE)) {
        const ledger = db.createObjectStore(LEDGER_STORE, { keyPath: ['campaignId', 'sequence'] })
        ledger.createIndex('campaignId', 'campaignId', { unique: false })
      }
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        const history = db.createObjectStore(HISTORY_STORE, { keyPath: ['campaignId', 'sequence'] })
        history.createIndex('campaignId', 'campaignId', { unique: false })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Could not open Weed Goblins v2 IndexedDB.'))
  })
}

async function deleteCampaignRange(store, campaignId) {
  const index = store.index('campaignId')
  const keys = await requestToPromise(index.getAllKeys(campaignId))
  for (const key of keys) store.delete(key)
}

export async function saveWeedGoblinsV2State(state, { db = null, indexedDb = undefined } = {}) {
  if (!validateV2State(state)) throw new Error('A valid Weed Goblins v2 state is required.')
  const database = db || await openWeedGoblinsV2Database(indexedDb)
  const ownsDatabase = !db
  const transaction = database.transaction(
    [SNAPSHOT_STORE, LEDGER_STORE, HISTORY_STORE],
    'readwrite',
  )

  const snapshots = transaction.objectStore(SNAPSHOT_STORE)
  const ledger = transaction.objectStore(LEDGER_STORE)
  const history = transaction.objectStore(HISTORY_STORE)

  snapshots.put(snapshotOnly(state))
  await deleteCampaignRange(ledger, state.campaignId)
  await deleteCampaignRange(history, state.campaignId)
  ledgerRecords(state).forEach((record) => ledger.put(record))
  historyRecords(state).forEach((record) => history.put(record))

  await transactionDone(transaction)
  if (ownsDatabase) database.close()
  return state
}

export async function loadWeedGoblinsV2State(campaignId, { db = null, indexedDb = undefined } = {}) {
  const id = String(campaignId ?? '').trim()
  if (!id) return null
  const database = db || await openWeedGoblinsV2Database(indexedDb)
  const ownsDatabase = !db
  const transaction = database.transaction(
    [SNAPSHOT_STORE, LEDGER_STORE, HISTORY_STORE],
    'readonly',
  )
  const snapshots = transaction.objectStore(SNAPSHOT_STORE)
  const ledgerIndex = transaction.objectStore(LEDGER_STORE).index('campaignId')
  const historyIndex = transaction.objectStore(HISTORY_STORE).index('campaignId')

  const [snapshot, ledger, history] = await Promise.all([
    requestToPromise(snapshots.get(id)),
    requestToPromise(ledgerIndex.getAll(id)),
    requestToPromise(historyIndex.getAll(id)),
  ])
  await transactionDone(transaction)
  if (ownsDatabase) database.close()
  if (!snapshot) return null

  const state = {
    ...snapshot,
    ledger: ledger
      .sort((a, b) => a.sequence - b.sequence)
      .map(({ campaignId: _campaignId, ...event }) => event),
    history: history
      .sort((a, b) => a.sequence - b.sequence)
      .map(({ campaignId: _campaignId, sequence: _sequence, ...entry }) => entry),
  }
  return validateV2State(state) ? state : null
}

export async function deleteWeedGoblinsV2State(campaignId, { db = null, indexedDb = undefined } = {}) {
  const id = String(campaignId ?? '').trim()
  if (!id) return
  const database = db || await openWeedGoblinsV2Database(indexedDb)
  const ownsDatabase = !db
  const transaction = database.transaction(
    [SNAPSHOT_STORE, LEDGER_STORE, HISTORY_STORE],
    'readwrite',
  )
  transaction.objectStore(SNAPSHOT_STORE).delete(id)
  await deleteCampaignRange(transaction.objectStore(LEDGER_STORE), id)
  await deleteCampaignRange(transaction.objectStore(HISTORY_STORE), id)
  await transactionDone(transaction)
  if (ownsDatabase) database.close()
}

export function createMemoryWeedGoblinsV2Persistence() {
  const records = new Map()
  return {
    async save(state) {
      if (!validateV2State(state)) throw new Error('A valid Weed Goblins v2 state is required.')
      records.set(state.campaignId, JSON.parse(JSON.stringify(state)))
      return state
    },
    async load(campaignId) {
      const state = records.get(campaignId)
      return state ? JSON.parse(JSON.stringify(state)) : null
    },
    async delete(campaignId) {
      records.delete(campaignId)
    },
    has(campaignId) {
      return records.has(campaignId)
    },
  }
}

export const WEED_GOBLINS_V2_DATABASE = Object.freeze({
  name: DB_NAME,
  version: DB_VERSION,
  stores: Object.freeze({
    snapshot: SNAPSHOT_STORE,
    ledger: LEDGER_STORE,
    history: HISTORY_STORE,
  }),
})
