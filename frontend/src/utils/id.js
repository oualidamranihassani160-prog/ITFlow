export function urlId(target) {
  if (target == null) return target
  if (typeof target === 'object') return target.hash_id ?? target.id
  return target
}

export function equalId(a, b) {
  return String(a) === String(b)
}
