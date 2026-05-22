import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function Row({ label, value, mono }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 border-b border-lumen-border last:border-b-0">
      <div className="text-xs uppercase tracking-wider text-lumen-muted">{label}</div>
      <div className={`col-span-2 text-sm break-all ${mono ? 'font-mono' : ''}`}>{value ?? '-'}</div>
    </div>
  )
}

export default function Dashboard() {
  const { wallet, token } = useAuth()

  return (
    <div className="max-w-2xl mx-auto py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Signed in</h1>
        <p className="text-sm text-lumen-muted mt-1">Welcome back. Below is the wallet linked to your account.</p>
      </header>

      <section className="border border-lumen-border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-lumen-muted mb-3">Your wallet</h2>
        <Row label="Address" value={wallet?.WalletAddress} mono />
        <Row label="Account name" value={wallet?.Provider?.AccountName} />
        <Row label="Email" value={wallet?.Provider?.Email} />
        <Row label="Account type" value={wallet?.AccountType ?? 'Custodial'} />
        {token?.expiresAt && (
          <Row label="Session expires" value={new Date(token.expiresAt).toLocaleString()} />
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/files" className="border border-lumen-fg px-4 py-2 text-sm hover:bg-lumen-fg hover:text-lumen-bg">View my files</Link>
        <Link to="/upload" className="bg-lumen-fg text-lumen-bg px-4 py-2 text-sm hover:opacity-90">Upload a file</Link>
      </div>
    </div>
  )
}
