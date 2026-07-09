import { SHARED_PROFILE_DEFAULTS } from './sharedPrivacy'

const STORAGE_PREFIX = 'my420journal_local_v1'
const ACTIVE_USER_KEY = `${STORAGE_PREFIX}:active_user`
const USERS_KEY = `${STORAGE_PREFIX}:users`
const TABLE_KEYS = {
  user_profiles: `${STORAGE_PREFIX}:user_profiles`,
  entries: `${STORAGE_PREFIX}:entries`,
}

function nowIso() {
  return new Date().toISOString()
}

function makeId(prefix = 'local') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function normaliseEmail(email = '') {
  return String(email).trim().toLowerCase()
}

function getUsers() {
  return readJson(USERS_KEY, [])
}

function saveUsers(users) {
  writeJson(USERS_KEY, users)
}

function publicUser(user) {
  if (!user) return null
  return {
    id: user.id,
    email: user.email || null,
    aud: 'local',
    role: 'authenticated',
    created_at: user.created_at,
  }
}

function getActiveUser() {
  const activeId = localStorage.getItem(ACTIVE_USER_KEY)
  if (!activeId) return null
  const users = getUsers()
  return publicUser(users.find((user) => user.id === activeId) || null)
}

function tableKey(table) {
  return TABLE_KEYS[table] || `${STORAGE_PREFIX}:${table}`
}

function readTable(table) {
  return readJson(tableKey(table), [])
}

function writeTable(table, rows) {
  writeJson(tableKey(table), rows)
}

function withTableDefaults(table, row) {
  if (!row) return row
  if (table !== 'user_profiles') return row
  return {
    ...SHARED_PROFILE_DEFAULTS,
    ...row,
    shared_opt_in_enabled: row.shared_opt_in_enabled === true,
    pending_shared_delete: row.pending_shared_delete === true,
  }
}

function cloneRow(row) {
  return row ? JSON.parse(JSON.stringify(row)) : row
}

function parseSelectColumns(columns) {
  if (!columns || columns === '*') return null
  return String(columns)
    .split(',')
    .map((column) => column.trim())
    .filter(Boolean)
}

function projectRow(row, columns) {
  if (!row) return row
  const wanted = parseSelectColumns(columns)
  if (!wanted) return cloneRow(row)
  const next = {}
  for (const column of wanted) next[column] = row[column]
  return next
}

async function credentialDigest(value, salt) {
  const input = `${salt}:${String(value)}`

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(input)
    const buffer = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i)
    hash |= 0
  }
  return `fallback_${Math.abs(hash).toString(16)}`
}

class LocalQuery {
  constructor(table) {
    this.table = table
    this.action = 'select'
    this.columns = '*'
    this.filters = []
    this.payload = null
    this.options = {}
    this.orderSpec = null
    this.limitCount = null
    this.singleMode = false
    this.promise = null
  }

  select(columns = '*') {
    this.action = 'select'
    this.columns = columns
    return this
  }

  insert(payload) {
    this.action = 'insert'
    this.payload = payload
    return this
  }

  update(payload) {
    this.action = 'update'
    this.payload = payload
    return this
  }

  upsert(payload, options = {}) {
    this.action = 'upsert'
    this.payload = payload
    this.options = options || {}
    return this
  }

  delete() {
    this.action = 'delete'
    return this
  }

  eq(column, value) {
    this.filters.push({ column, value })
    if (this.action === 'delete' || this.action === 'update') this._ensure()
    return this
  }

  order(column, options = {}) {
    this.orderSpec = { column, ascending: options.ascending !== false }
    return this
  }

  limit(count) {
    this.limitCount = Number(count)
    return this
  }

  maybeSingle() {
    this.singleMode = true
    return this
  }

  single() {
    this.singleMode = true
    return this
  }

  then(resolve, reject) {
    return this._ensure().then(resolve, reject)
  }

  catch(reject) {
    return this._ensure().catch(reject)
  }

  finally(onFinally) {
    return this._ensure().finally(onFinally)
  }

  _ensure() {
    if (!this.promise) this.promise = Promise.resolve(this._execute())
    return this.promise
  }

  _matches(row) {
    return this.filters.every(({ column, value }) => row?.[column] === value)
  }

  _rowsMatching(rows) {
    return rows.filter((row) => this._matches(row))
  }

  _execute() {
    try {
      const rows = readTable(this.table)

      if (this.action === 'insert') {
        const list = Array.isArray(this.payload) ? this.payload : [this.payload]
        const created = list.map((item) => withTableDefaults(this.table, {
          id: item?.id || makeId(this.table),
          created_at: item?.created_at || nowIso(),
          updated_at: item?.updated_at || nowIso(),
          ...item,
        }))
        writeTable(this.table, [...created, ...rows])
        return { data: this.singleMode ? created[0] : created, error: null }
      }

      if (this.action === 'upsert') {
        const list = Array.isArray(this.payload) ? this.payload : [this.payload]
        const conflictKey = this.options.onConflict || 'id'
        const nextRows = [...rows]
        const saved = []
        for (const item of list) {
          const conflictValue = item?.[conflictKey]
          const existingIndex = nextRows.findIndex((row) => row?.[conflictKey] === conflictValue)
          if (existingIndex >= 0) {
            nextRows[existingIndex] = withTableDefaults(this.table, {
              ...nextRows[existingIndex],
              ...item,
              id: nextRows[existingIndex].id || item?.id || makeId(this.table),
              updated_at: nowIso(),
            })
            saved.push(nextRows[existingIndex])
          } else {
            const fresh = withTableDefaults(this.table, {
              id: item?.id || makeId(this.table),
              created_at: item?.created_at || nowIso(),
              updated_at: item?.updated_at || nowIso(),
              ...item,
            })
            nextRows.unshift(fresh)
            saved.push(fresh)
          }
        }
        writeTable(this.table, nextRows)
        return { data: this.singleMode ? saved[0] : saved, error: null }
      }

      if (this.action === 'update') {
        const updated = []
        const nextRows = rows.map((row) => {
          if (!this._matches(row)) return row
          const next = withTableDefaults(this.table, { ...row, ...this.payload, updated_at: nowIso() })
          updated.push(next)
          return next
        })
        writeTable(this.table, nextRows)
        return { data: this.singleMode ? updated[0] || null : updated, error: null }
      }

      if (this.action === 'delete') {
        const removed = []
        const kept = []
        for (const row of rows) {
          if (this._matches(row)) removed.push(row)
          else kept.push(row)
        }
        writeTable(this.table, kept)
        return { data: removed, error: null }
      }

      let result = this._rowsMatching(rows)
      if (this.orderSpec) {
        const { column, ascending } = this.orderSpec
        result = [...result].sort((a, b) => {
          const av = a?.[column] ?? ''
          const bv = b?.[column] ?? ''
          if (av === bv) return 0
          return (av > bv ? 1 : -1) * (ascending ? 1 : -1)
        })
      }
      if (Number.isFinite(this.limitCount)) result = result.slice(0, this.limitCount)
      result = result.map((row) => projectRow(withTableDefaults(this.table, row), this.columns))
      return { data: this.singleMode ? result[0] || null : result, error: null }
    } catch (error) {
      return { data: this.singleMode ? null : [], error }
    }
  }
}

function localGuideReply(body = {}) {
  const guide = body.guide || 'guide'
  const latest = Array.isArray(body.messages) ? body.messages[body.messages.length - 1]?.content : ''
  const intro = guide === 'unit' || guide === 'tool'
    ? 'Logged locally.'
    : 'I can help organize this locally on this device.'
  const detail = latest ? ` I am reading your latest note as: ${String(latest).slice(0, 180)}` : ''
  return `${intro}${detail}`
}

function localPlacesResponse(body = {}) {
  if (body.type === 'autocomplete') return { predictions: [] }
  if (body.type === 'details') return null
  if (body.type === 'geocode') return { lat: null, lng: null }
  return { predictions: [] }
}

export const localStore = {
  auth: {
    async getUser() {
      return { data: { user: getActiveUser() }, error: null }
    },
    async getSession() {
      const user = getActiveUser()
      return { data: { session: user ? { user, access_token: 'local-only' } : null }, error: null }
    },
    async signUp({ email, password }) {
      const cleanEmail = normaliseEmail(email)
      if (!cleanEmail) return { data: null, error: new Error('Email is required.') }
      if (!password || password.length < 8) return { data: null, error: new Error('Password must be at least 8 characters.') }

      const users = getUsers()
      if (users.some((user) => user.email === cleanEmail)) {
        return { data: null, error: new Error('An account with this email already exists on this device.') }
      }

      const credential_salt = makeId('salt')
      const credential_hash = await credentialDigest(password, credential_salt)
      const user = { id: makeId('user'), email: cleanEmail, credential_salt, credential_hash, created_at: nowIso() }

      users.unshift(user)
      saveUsers(users)
      localStorage.setItem(ACTIVE_USER_KEY, user.id)
      return { data: { user: publicUser(user), session: { user: publicUser(user), access_token: 'local-only' } }, error: null }
    },
    async signInWithPassword({ email, password }) {
      const cleanEmail = normaliseEmail(email)
      const users = getUsers()
      const user = users.find((item) => item.email === cleanEmail)

      if (!user || !user.credential_hash || !user.credential_salt) {
        return { data: null, error: new Error('Local profile not found. Check your email, or create a new local profile on this device.') }
      }

      const attempted_hash = await credentialDigest(password, user.credential_salt)
      if (attempted_hash !== user.credential_hash) {
        return { data: null, error: new Error('Local profile not found. Check your email and password, or create a new local profile on this device.') }
      }

      localStorage.setItem(ACTIVE_USER_KEY, user.id)
      return { data: { user: publicUser(user), session: { user: publicUser(user), access_token: 'local-only' } }, error: null }
    },
    async resetPasswordForEmail() {
      return { data: null, error: new Error('Password reset emails are disabled in this local-only build.') }
    },
    async signOut() {
      localStorage.removeItem(ACTIVE_USER_KEY)
      return { error: null }
    },
  },
  from(table) {
    return new LocalQuery(table)
  },
  tools: {
    async invoke(name, { body } = {}) {
      if (name === 'guide-response') return { data: { content: localGuideReply(body) }, error: null }
      if (name === 'place-lookup') return { data: localPlacesResponse(body), error: null }
      return { data: null, error: new Error('Local-only build does not run external tools.') }
    },
  },
}
