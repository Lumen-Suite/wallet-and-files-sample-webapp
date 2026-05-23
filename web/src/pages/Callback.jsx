import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { api, extractError } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Spinner from '../components/Spinner.jsx'

export default function Callback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState(null)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const authCode = params.get('AuthCode')
    if (!authCode) {
      setError('No AuthCode in the redirect URL. Sign-in did not complete.')
      return
    }
    api.get('/auth/access-token', { headers: { 'lumen-authentication-code': authCode } })
      .then((res) => {
        const Token = res.data?.Token
        const Wallet = res.data?.Wallet
        if (typeof Token !== 'string' || !Token) {
          throw new Error('Server did not return a session token.')
        }
        login(Token, Wallet)
        navigate('/', { replace: true })
      })
      .catch((e) => setError(extractError(e)))
  }, [])

  if (error) {
    return (
      <div className="max-w-md mx-auto py-10 text-center">
        <h1 className="text-xl font-semibold mb-2">Sign-in failed</h1>
        <p className="text-sm text-lumen-muted mb-6">{error}</p>
        <Link to="/login" className="inline-block border border-lumen-fg px-4 py-2 text-sm hover:bg-lumen-fg hover:text-lumen-bg">
          Try again
        </Link>
      </div>
    )
  }
  return <Spinner label="Finishing sign-in..." />
}
