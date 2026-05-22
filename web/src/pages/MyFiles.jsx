import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, extractError } from '../api/client.js'
import Spinner from '../components/Spinner.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Pagination from '../components/Pagination.jsx'
import SearchSortBar from '../components/SearchSortBar.jsx'

const SORT_OPTIONS = [
  { value: 'Name', label: 'Name' },
  { value: '_ts', label: 'Recently changed' },
  { value: 'FileExtension', label: 'Extension' },
  { value: 'CreatedAt', label: 'Created' },
]

function shorten(addr) {
  if (!addr) return '-'
  if (addr.length <= 14) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function MyFiles() {
  const [params, setParams] = useSearchParams()

  const pageNumber = Number(params.get('pageNumber') || 1)
  const pageSize = Number(params.get('pageSize') || 10)
  const search = params.get('search') || ''
  const sortField = params.get('sort[0][field]') || ''
  const sortOrder = params.get('sort[0][order]') || 'desc'

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const query = { pageNumber, pageSize }
      if (search) query.search = search
      if (sortField) {
        query['sort[0][field]'] = sortField
        query['sort[0][order]'] = sortOrder
      }
      const res = await api.get('/user/files', { params: query })
      setData(res.data)
    } catch (e) {
      setError(extractError(e))
    } finally {
      setLoading(false)
    }
  }, [pageNumber, pageSize, search, sortField, sortOrder])

  useEffect(() => { load() }, [load])

  const updateParams = (changes) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(changes)) {
      if (v === undefined || v === '' || v === null) next.delete(k)
      else next.set(k, String(v))
    }
    setParams(next)
  }

  const files = data?.Files ?? data?.files ?? data?.Items ?? []
  const pagination = data?.Pagination ?? data?.pagination

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My files</h1>
          <p className="text-sm text-lumen-muted mt-1">
            Files attached to your wallet. Use the upload page to add more.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/" className="border border-lumen-border px-4 py-2 text-sm hover:bg-lumen-row-hover">
            Dashboard
          </Link>
          <Link
            to="/upload"
            className="bg-lumen-fg text-lumen-bg px-4 py-2 text-sm hover:opacity-90"
          >
            Upload a file
          </Link>
        </div>
      </header>

      <SearchSortBar
        search={search}
        onSearchChange={(v) => updateParams({ search: v, pageNumber: 1 })}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={({ field, order }) =>
          updateParams({
            'sort[0][field]': field,
            'sort[0][order]': field ? order : undefined,
            pageNumber: 1,
          })
        }
        sortOptions={SORT_OPTIONS}
        placeholder="Search your files..."
      />

      <ErrorBanner message={error} onRetry={load} />

      {loading ? (
        <Spinner label="Loading your files..." />
      ) : files.length === 0 ? (
        <EmptyState
          title={search ? 'No files match your search' : 'No files yet'}
          message={
            search
              ? 'Try a different search term or clear the search box.'
              : 'Click "Upload a file" above to add your first file.'
          }
        />
      ) : (
        <div className="border border-lumen-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-lumen-subtle border-b border-lumen-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-lumen-muted uppercase text-xs tracking-wider">Name</th>
                <th className="text-left px-4 py-3 font-medium text-lumen-muted uppercase text-xs tracking-wider hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium text-lumen-muted uppercase text-xs tracking-wider hidden md:table-cell">Owner</th>
                <th className="text-left px-4 py-3 font-medium text-lumen-muted uppercase text-xs tracking-wider hidden lg:table-cell">Checksum</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => {
                const id = f.id ?? f.Id ?? `${f.Path}/${f.Name}`
                return (
                  <tr key={id} className="border-b border-lumen-border last:border-b-0 hover:bg-lumen-row-hover">
                    <td className="px-4 py-3 font-medium">{f.Name ?? '-'}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-lumen-muted">
                      {f.FileExtension ? '.' + String(f.FileExtension).toUpperCase() : '-'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell font-mono text-lumen-muted">{shorten(f.OwnerAddress)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell font-mono text-xs text-lumen-muted">
                      {f.Checksum ? f.Checksum.slice(0, 12) + '...' : '-'}
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
    </div>
  )
}
