import SparkMD5 from 'spark-md5'

export async function computeMd5Base64(file) {
  const buf = await file.arrayBuffer()
  const hex = SparkMD5.ArrayBuffer.hash(buf)
  const bytes = new Uint8Array(hex.match(/.{2}/g).map((h) => parseInt(h, 16)))
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

export function stripExt(filename) {
  const i = filename.lastIndexOf('.')
  return i > 0 ? filename.slice(0, i) : filename
}

export function extOf(filename) {
  const i = filename.lastIndexOf('.')
  return i > 0 ? filename.slice(i + 1).toLowerCase() : ''
}
