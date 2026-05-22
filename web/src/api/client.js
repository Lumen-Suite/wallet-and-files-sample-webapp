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
  return err?.response?.data?.error || err?.message || 'Something went wrong.'
}
