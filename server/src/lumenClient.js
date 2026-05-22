import axios from 'axios'

let client = null

function getClient() {
  if (client) return client
  client = axios.create({
    baseURL: process.env.LUMEN_API_BASE_URL,
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

export const callLumen = (opts) => getClient().request(opts)
