import axios from 'axios'

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_BFF_URL}/api`,
  timeout: 30000,
})

let currentToken = null
export function setUserToken(token) {
  currentToken = token
}

api.interceptors.request.use((cfg) => {
  if (currentToken) cfg.headers.set('lumen-user-token', currentToken)
  return cfg
})

export function extractError(err) {
  const d = err?.response?.data
  if (d) {
    if (typeof d === 'string') return d
    return d.error || d.errorMsg || d.message || d.details || JSON.stringify(d)
  }
  return err?.message || 'Something went wrong.'
}
