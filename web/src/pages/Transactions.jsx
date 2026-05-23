import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, extractError } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Spinner from '../components/Spinner.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Pagination from '../components/Pagination.jsx'

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
                    <th className="text-left px-4 py-3 font-medium text-lumen-muted uppercase text-xs tracking-wider">From</th>
                    <th className="text-left px-4 py-3 font-medium text-lumen-muted uppercase text-xs tracking-wider">To</th>
                    <th className="text-left px-4 py-3 font-medium text-lumen-muted uppercase text-xs tracking-wider">Value</th>
                    <th className="text-left px-4 py-3 font-medium text-lumen-muted uppercase text-xs tracking-wider hidden sm:table-cell">Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map((t) => {
                    const log = t.Log ?? t
                    const id = t.id ?? t.Id ?? log.Hash
                    const isOut = log.From && address && log.From.toLowerCase() === address.toLowerCase()
                    return (
                      <tr key={id} className="border-b border-lumen-border last:border-b-0 hover:bg-lumen-row-hover">
                        <td className="px-4 py-3 font-mono text-lumen-muted">{shorten(log.From)}</td>
                        <td className="px-4 py-3 font-mono text-lumen-muted">{shorten(log.To)}</td>
                        <td className={`px-4 py-3 font-medium ${isOut ? 'text-lumen-error' : 'text-lumen-success'}`}>
                          {isOut ? '-' : '+'}{log.Value ?? '0'}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell font-mono text-xs text-lumen-muted">
                          {log.Hash ? `${log.Hash.slice(0, 10)}...` : '-'}
                        </td>
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
    </div>
  )
}
