export const ROOT = '/'

export function normalize(p) {
  if (!p) return ROOT
  let out = '/' + String(p).split('/').filter(Boolean).join('/')
  return out === '' ? ROOT : out
}

export function joinPath(parent, name) {
  const base = normalize(parent)
  if (base === ROOT) return ROOT + name
  return base + '/' + name
}

export function parentPath(p) {
  const n = normalize(p)
  if (n === ROOT) return ROOT
  const idx = n.lastIndexOf('/')
  return idx <= 0 ? ROOT : n.slice(0, idx)
}

export function breadcrumbSegments(p) {
  const n = normalize(p)
  if (n === ROOT) return [{ name: 'Home', path: ROOT }]
  const parts = n.split('/').filter(Boolean)
  const segs = [{ name: 'Home', path: ROOT }]
  let acc = ''
  for (const part of parts) {
    acc += '/' + part
    segs.push({ name: decodeURIComponent(part), path: acc })
  }
  return segs
}
