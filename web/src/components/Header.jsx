import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Spinner from './Spinner.jsx'

export default function Header() {
  const { token, signingOut, logout } = useAuth()
  const navigate = useNavigate()

  const onSignOut = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="border-b border-lumen-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-lumen-fg text-lumen-bg font-bold">
            L
          </span>
          <span className="font-semibold tracking-tight text-lumen-fg">
            Lumen Wallet &amp; Files
          </span>
          <span className="hidden sm:inline text-xs uppercase tracking-widest text-lumen-muted ml-1 px-2 py-1 border border-lumen-border">
            Sample
          </span>
        </Link>
        <nav className="text-sm flex items-center gap-4">
          {token && (
            <>
              <Link to="/" className="text-lumen-muted hover:text-lumen-fg">
                Dashboard
              </Link>
              <Link to="/files" className="text-lumen-muted hover:text-lumen-fg">
                My files
              </Link>
              <Link to="/transactions" className="text-lumen-muted hover:text-lumen-fg">
                Transactions
              </Link>
              <Link to="/upload" className="text-lumen-muted hover:text-lumen-fg">
                Upload
              </Link>
              <button
                type="button"
                onClick={onSignOut}
                disabled={signingOut}
                className="border border-lumen-fg px-3 py-1 text-sm hover:bg-lumen-fg hover:text-lumen-bg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {signingOut ? <Spinner inline label="Signing out..." /> : 'Sign out'}
              </button>
            </>
          )}
          <a
            href="https://github.com/Bayanichain/wallet-and-files-sample-webapp"
            target="_blank"
            rel="noreferrer"
            className="text-lumen-muted hover:text-lumen-fg"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  )
}
