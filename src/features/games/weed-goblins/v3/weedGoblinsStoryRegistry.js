const REQUIRED_FIELDS = ['id', 'version', 'family', 'chapter', 'location', 'pacingRole', 'importance', 'estimatedReadSeconds', 'baseWeight', 'repeatDecay', 'requiresAll', 'requiresAny', 'forbids', 'content', 'tags']

export function validateStoryBlock(block) {
  if (!block || typeof block !== 'object') throw new Error('Story block must be an object.')
  for (const field of REQUIRED_FIELDS) {
    if (!(field in block)) throw new Error(`Story block ${block.id || '<unknown>'} is missing ${field}.`)
  }
  if (!String(block.id).trim()) throw new Error('Story block id is required.')
  if (!['anchor', 'branch', 'variable', 'reactive'].includes(block.family)) throw new Error(`Story block ${block.id} has invalid family.`)
  if (!Array.isArray(block.requiresAll) || !Array.isArray(block.requiresAny) || !Array.isArray(block.forbids) || !Array.isArray(block.tags)) {
    throw new Error(`Story block ${block.id} has malformed eligibility metadata.`)
  }
  if (!(Array.isArray(block.content) || typeof block.content === 'string')) throw new Error(`Story block ${block.id} has invalid content.`)
  return true
}

function readPath(state, path) {
  return String(path).split('.').reduce((value, key) => value?.[key], state)
}

function conditionMet(state, token) {
  if (typeof token === 'function') return Boolean(token(state))
  if (typeof token !== 'string') return Boolean(token)
  if (token.startsWith('!')) return !Boolean(readPath(state, token.slice(1)))
  return Boolean(readPath(state, token))
}

export function createStoryRegistry(blocks = []) {
  const map = new Map()
  for (const block of blocks) {
    validateStoryBlock(block)
    if (map.has(block.id)) throw new Error(`Duplicate story block id: ${block.id}`)
    map.set(block.id, Object.freeze({ ...block }))
  }
  return Object.freeze({
    get(id) {
      return map.get(id) || null
    },
    all() {
      return [...map.values()]
    },
    eligible(state, predicate = null) {
      return [...map.values()].filter((block) => {
        if (block.requiresAll.some((condition) => !conditionMet(state, condition))) return false
        if (block.requiresAny.length > 0 && !block.requiresAny.some((condition) => conditionMet(state, condition))) return false
        if (block.forbids.some((condition) => conditionMet(state, condition))) return false
        return predicate ? predicate(block) : true
      })
    },
  })
}
