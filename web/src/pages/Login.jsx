import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, extractError } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import Spinner from '../components/Spinner.jsx'

export default function Login() {
  const { token, hydrating } = useAuth()
  const navigate = useNavigate()
  const [google, setGoogle] = useState(true)
  const [facebook, setFacebook] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (hydrating) return <Spinner label="Checking sign-in..." />
  if (token) { navigate('/', { replace: true }); return null }

  const submit = async (e) => {
    e.preventDefault()
    const socials = []
    if (google) socials.push('GOOGLE')
    if (facebook) socials.push('FACEBOOK')
    if (socials.length === 0) {
      setError('Pick at least one sign-in method.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const { data } = await api.post('/auth/login-config', {
        AllowedLoginMethods: { Wallets: [], SocialMedia: socials },
        RedirectURL: import.meta.env.VITE_CALLBACK_URL,
      })
      if (data?.LoginURL) window.location.href = data.LoginURL
      else { setError('Server did not return a LoginURL.'); setSubmitting(false) }
    } catch (e) {
      setError(extractError(e))
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in with BridgePass</h1>
      <p className="text-sm text-lumen-muted mt-2 mb-6">
        BridgePass is the Lumen-hosted sign-in service. After you sign in there, you will be sent back here automatically.
      </p>

      <ErrorBanner message={error} />

      <form onSubmit={submit} className="space-y-3">
        <fieldset className="border border-lumen-border p-4">
          <legend className="text-xs uppercase tracking-wider text-lumen-muted px-1">Sign-in methods</legend>
          <label className="flex items-center gap-2 py-1">
            <input type="checkbox" checked={google} onChange={(e) => setGoogle(e.target.checked)} />
            <span>Google</span>
          </label>
          <label className="flex items-center gap-2 py-1">
            <input type="checkbox" checked={facebook} onChange={(e) => setFacebook(e.target.checked)} />
            <span>Facebook</span>
          </label>
        </fieldset>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-lumen-fg text-lumen-bg px-4 py-3 text-sm font-medium hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? 'Preparing sign-in...' : 'Continue to BridgePass'}
        </button>
      </form>
    </div>
  )
}
