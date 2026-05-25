import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, extractError } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Spinner from '../components/Spinner.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Pagination from '../components/Pagination.jsx'
import TransactionDetailModal from '../components/TransactionDetailModal.jsx'

function shorten(addr) {
  if (!addr) return '-'
  if (addr.length <= 14) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function Transactions() {
  const { wallet } = useAuth()
  const address = wallet?.WalletAddress

  const [params, setParams] = useSearchParams()
  const pageNumber = Number(params.get('pageNumber') || 1)
  const pageSize = Number(params.get('pageSize') || 10)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTx, setActiveTx] = useState(null)

  const load = useCallback(async () => {
    if (!address) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(
        `/wallets/Custodial/${encodeURIComponent(address)}/transactions`,
        { params: { pageNumber, pageSize } },
      )
      setData(res.data)
    } catch (e) {
      setError(extractError(e))
    } finally {
      setLoading(false)
    }
  }, [address, pageNumber, pageSize])

  useEffect(() => { load() }, [load])

  const updateParams = (changes) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(changes)) {
      if (v === undefined || v === '' || v === null) next.delete(k)
      else next.set(k, String(v))
    }
    setParams(next)
  }

  const txs = data?.Transactions ?? data?.transactions ?? []
  const pagination = data?.Pagination ?? data?.pagination

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">My transactions</h1>
        <p className="text-sm text-lumen-muted mt-1">
          On-chain activity for your wallet: <span className="font-mono">{shorten(address)}</span>
        </p>
      </header>

      {!address ? (
        <EmptyState
          title="No wallet found"
          message="Your session does not include a wallet address. Try signing in again."
        />
      ) : (
        <>
          <ErrorBanner message={error} onRetry={load} />

          {loading ? (
            <Spinner label="Loading transactions..." />
          ) : txs.length === 0 ? (
            <EmptyState
              title="No transactions yet"
              message="When this wallet sends or receives on-chain value, the activity will show up here."
            />
          ) : (
            <div className="border border-lumen-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-lumen-subtle border-b border-lumen-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-lumen-muted uppercase text-xs tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-lumen-muted uppercase text-xs tracking-wider">Token</th>
                    <th className="text-left px-4 py-3 font-medium text-lumen-muted uppercase text-xs tracking-wider hidden md:table-cell">Counterparty</th>
                    <th className="text-left px-4 py-3 font-medium text-lumen-muted uppercase text-xs tracking-wider hidden lg:table-cell">Tx hash</th>
                    <th className="text-left px-4 py-3 font-medium text-lumen-muted uppercase text-xs tracking-wider hidden sm:table-cell">When</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map((t, idx) => {
                    const log = t.Log ?? {}
                    const id = log.TransactionHash ?? `${t.id ?? idx}-${t.ContractAddress}-${t.TokenID}`
                    const me = address?.toLowerCase()
                    const fromMe = me && log.From?.toLowerCase() === me
                    const counterparty = fromMe ? log.To : log.From
                    const typeStr = String(log.Type ?? '').toLowerCase()
                    const typeColor = typeStr === 'minted'
                      ? 'border-lumen-success text-lumen-success'
                      : typeStr === 'burned'
                        ? 'border-lumen-error text-lumen-error'
                        : 'border-lumen-border text-lumen-fg'
                    const when = log.LogTS ? new Date((log.LogTS < 1e12 ? log.LogTS * 1000 : log.LogTS)).toLocaleString() : ''
                    return (
                      <tr
                        key={id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setActiveTx(t)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setActiveTx(t)
                          }
                        }}
                        className="border-b border-lumen-border last:border-b-0 hover:bg-lumen-row-hover cursor-pointer"
                        title="View transaction details"
                      >
                        <td className="px-4 py-3">
                          <span className={`text-xs uppercase tracking-wider px-2 py-0.5 border ${typeColor}`}>
                            {log.Type ?? '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono">{t.TokenID != null ? `#${t.TokenID}` : '-'}</td>
                        <td className="px-4 py-3 hidden md:table-cell font-mono text-lumen-muted">{shorten(counterparty)}</td>
                        <td className="px-4 py-3 hidden lg:table-cell font-mono text-xs text-lumen-muted">{shorten(log.TransactionHash)}</td>
                        <td className="px-4 py-3 hidden sm:table-cell text-lumen-muted text-xs">{when}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            pagination={pagination}
            pageSize={pageSize}
            onPageChange={(p) => updateParams({ pageNumber: p })}
            onPageSizeChange={(s) => updateParams({ pageSize: s, pageNumber: 1 })}
          />
        </>
      )}

      <TransactionDetailModal
        tx={activeTx}
        viewerAddress={address}
        onClose={() => setActiveTx(null)}
      />
    </div>
  )
}
