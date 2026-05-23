import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, setUserToken, extractError } from '../api/client.js'

const KEY = 'wfs_auth_v1'

function decodeJwtExpMs(jwt) {
  try {
    const part = String(jwt).split('.')[1]
    if (!part) return null
    let b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    const payload = JSON.parse(atob(b64))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

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
    if (!s?.token) {
      setHydrating(false)
      return
    }
    if (s.expiresAt && s.expiresAt <= Date.now()) {
      clearSession()
      setUserToken(null)
      setState(null)
      setHydrating(false)
      return
    }
    setUserToken(s.token)
    api.get('/auth/authenticate')
      .then((res) => {
        const nextToken = typeof res.data?.Token === 'string' ? res.data.Token : s.token
        const nextWallet = res.data?.Wallet ?? s.wallet
        const next = {
          token: nextToken,
          wallet: nextWallet,
          expiresAt: decodeJwtExpMs(nextToken) ?? s.expiresAt ?? null,
        }
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
    const next = {
      token,
      wallet,
      expiresAt: decodeJwtExpMs(token),
    }
    saveSession(next)
    setUserToken(token)
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
    <AuthContext.Provider
      value={{
        token: state?.token,
        wallet: state?.wallet,
        expiresAt: state?.expiresAt,
        hydrating,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
