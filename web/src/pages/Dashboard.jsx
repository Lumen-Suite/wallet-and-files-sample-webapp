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
  const { wallet, expiresAt } = useAuth()
  const provider = wallet?.Provider
  const picture = provider?.ProfilePicture?.URL

  return (
    <div className="max-w-2xl mx-auto py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Signed in</h1>
        <p className="text-sm text-lumen-muted mt-1">Welcome back. Below is the wallet linked to your account.</p>
      </header>

      <section className="border border-lumen-border p-5">
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-lumen-border">
          {picture ? (
            <img
              src={picture}
              alt=""
              referrerPolicy="no-referrer"
              className="w-12 h-12 border border-lumen-border bg-lumen-subtle"
            />
          ) : (
            <div className="w-12 h-12 bg-lumen-fg text-lumen-bg flex items-center justify-center font-semibold">
              {provider?.AccountName?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-lumen-fg truncate">{provider?.AccountName ?? '-'}</div>
            <div className="text-xs text-lumen-muted truncate">{provider?.Email ?? '-'}</div>
          </div>
          {provider?.Type && (
            <span className="text-xs uppercase tracking-widest text-lumen-muted px-2 py-1 border border-lumen-border">
              {provider.Type}
            </span>
          )}
        </div>

        <h2 className="text-sm font-semibold uppercase tracking-widest text-lumen-muted mb-3">Your wallet</h2>
        <Row label="Address" value={wallet?.WalletAddress} mono />
        <Row label="Wallet ID" value={wallet?.id} mono />
        <Row label="Ownership" value={wallet?.Ownership} />
        <Row label="Wallet type" value={wallet?.WalletType} />
        <Row label="Organization" value={wallet?.OrganizationID} mono />
        {expiresAt && (
          <Row label="Session expires" value={new Date(expiresAt).toLocaleString()} />
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/files" className="border border-lumen-fg px-4 py-2 text-sm hover:bg-lumen-fg hover:text-lumen-bg">View my files</Link>
        <Link to="/transactions" className="border border-lumen-fg px-4 py-2 text-sm hover:bg-lumen-fg hover:text-lumen-bg">View my transactions</Link>
        <Link to="/upload" className="bg-lumen-fg text-lumen-bg px-4 py-2 text-sm hover:opacity-90">Upload a file</Link>
      </div>
    </div>
  )
}
