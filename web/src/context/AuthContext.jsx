import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, setUserToken, extractError } from '../api/client.js'

const KEY = 'wfs_auth_v1'

function readSession() {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveSession(s) { sessionStorage.setItem(KEY, JSON.stringify(s)) }
function clearSession() { sessionStorage.removeItem(KEY) }

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => readSession())
  const [hydrating, setHydrating] = useState(!!readSession())
  const [error, setError] = useState(null)

  useEffect(() => {
    const s = state
    if (!s?.token?.token) {
      setHydrating(false)
      return
    }
    if (s.token.expiresAt && Date.parse(s.token.expiresAt) <= Date.now()) {
      clearSession()
      setUserToken(null)
      setState(null)
      setHydrating(false)
      return
    }
    setUserToken(s.token.token)
    api.get('/auth/authenticate')
      .then((res) => {
        const next = { token: res.data?.Token ?? s.token, wallet: res.data?.Wallet ?? s.wallet }
        saveSession(next)
        setState(next)
      })
      .catch(() => {
        clearSession()
        setUserToken(null)
        setState(null)
      })
      .finally(() => setHydrating(false))
  }, [])

  const login = useCallback((token, wallet) => {
    const next = { token, wallet }
    saveSession(next)
    setUserToken(token.token)
    setState(next)
    setError(null)
  }, [])

  const logout = useCallback(async () => {
    try { await api.delete('/auth/logout') } catch (e) { setError(extractError(e)) }
    clearSession()
    setUserToken(null)
    setState(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token: state?.token, wallet: state?.wallet, hydrating, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
