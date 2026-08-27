export function hashSeed(value) {
  const text = String(value ?? '')
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function seededUnit(seed, namespace = '') {
  let x = hashSeed(`${seed}::${namespace}`) || 0x9e3779b9
  x ^= x << 13
  x ^= x >>> 17
  x ^= x << 5
  return (x >>> 0) / 4294967296
}

export function chooseWeighted(items, { seed, namespace = 'choice', weight = (item) => item?.baseWeight ?? 1 } = {}) {
  const eligible = Array.isArray(items) ? items.filter(Boolean) : []
  if (eligible.length === 0) return null
  const weights = eligible.map((item) => Math.max(0, Number(weight(item)) || 0))
  const total = weights.reduce((sum, value) => sum + value, 0)
  if (total <= 0) return eligible[0]
  let cursor = seededUnit(seed, namespace) * total
  for (let index = 0; index < eligible.length; index += 1) {
    cursor -= weights[index]
    if (cursor < 0) return eligible[index]
  }
  return eligible.at(-1)
}

export function seededOrder(items, { seed, namespace = 'order' } = {}) {
  return [...(Array.isArray(items) ? items : [])].sort((a, b) => {
    const av = seededUnit(seed, `${namespace}:${a?.id ?? String(a)}`)
    const bv = seededUnit(seed, `${namespace}:${b?.id ?? String(b)}`)
    if (av === bv) return String(a?.id ?? a).localeCompare(String(b?.id ?? b))
    return av - bv
  })
}
