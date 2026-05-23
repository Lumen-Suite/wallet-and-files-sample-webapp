import axios from 'axios'

export function encodePath(path) {
  const stripped = String(path ?? '').replace(/^\/+/, '')
  if (!stripped) return '%2F'
  return encodeURIComponent(stripped)
}

function makeClient(baseURL) {
  const client = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  })
  client.interceptors.request.use((cfg) => {
    cfg.headers.set('lumen-api-key', process.env.LUMEN_API_KEY)
    cfg.headers.set('lumen-api-secret', process.env.LUMEN_API_SECRET)
    if (cfg._userToken) cfg.headers.set('lumen-user-token', cfg._userToken)
    if (cfg._authCode) cfg.headers.set('lumen-authentication-code', cfg._authCode)
    return cfg
  })
  return client
}

let walletsClient = null
let filesClient = null

function getWalletsClient() {
  if (!walletsClient) walletsClient = makeClient(process.env.LUMEN_API_BASE_URL)
  return walletsClient
}

function getFilesClient() {
  if (!filesClient) filesClient = makeClient(process.env.LUMEN_FILES_API_BASE_URL)
  return filesClient
}

export const callLumen = (opts) => getWalletsClient().request(opts)
export const callLumenFiles = (opts) => getFilesClient().request(opts)
