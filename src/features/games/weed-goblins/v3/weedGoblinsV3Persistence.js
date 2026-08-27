const DB_NAME = 'my420journal-weed-goblins-v3'
const DB_VERSION = 1
const RUNS = 'runs'
const ACTIVE_KEY = 'active-founder-run'

function openDb() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('IndexedDB is not available.'))
      return
    }
    const request = globalThis.indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(RUNS)) db.createObjectStore(RUNS)
      if (!db.objectStoreNames.contains('campaigns')) db.createObjectStore('campaigns')
      if (!db.objectStoreNames.contains('ledger')) db.createObjectStore('ledger')
      if (!db.objectStoreNames.contains('history')) db.createObjectStore('history')
      if (!db.objectStoreNames.contains('legacy')) db.createObjectStore('legacy')
    }
    request.onerror = () => reject(request.error || new Error('Unable to open Weed Goblins V3 storage.'))
    request.onsuccess = () => resolve(request.result)
  })
}

async function runTransaction(mode, operation) {
  const db = await openDb()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(RUNS, mode)
      const store = tx.objectStore(RUNS)
      const request = operation(store)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error || new Error('Weed Goblins V3 storage operation failed.'))
    })
  } finally {
    db.close()
  }
}

export const weedGoblinsV3Persistence = Object.freeze({
  async load() {
    return (await runTransaction('readonly', (store) => store.get(ACTIVE_KEY))) || null
  },
  async save(state) {
    await runTransaction('readwrite', (store) => store.put(state, ACTIVE_KEY))
    return state
  },
  async clear() {
    await runTransaction('readwrite', (store) => store.delete(ACTIVE_KEY))
  },
})

export function createMemoryWeedGoblinsV3Persistence() {
  let value = null
  return {
    async load() { return value ? structuredClone(value) : null },
    async save(state) { value = structuredClone(state); return state },
    async clear() { value = null },
  }
}
