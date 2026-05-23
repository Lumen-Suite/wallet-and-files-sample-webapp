import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, extractError } from '../api/client.js'
import Spinner from '../components/Spinner.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Pagination from '../components/Pagination.jsx'
import FileDetailModal from '../components/FileDetailModal.jsx'

function shorten(addr) {
  if (!addr) return '-'
  if (addr.length <= 14) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function ext(f) {
  return f?.File?.Extension || f?.FileExtension || null
}

function sizeOf(f) {
  const s = f?.File?.OriginalFile?.Size
  if (typeof s !== 'number') return null
  if (s < 1024) return `${s} B`
  if (s < 1024 * 1024) return `${(s / 1024).toFixed(1)} KB`
  return `${(s / (1024 * 1024)).toFixed(1)} MB`
}

export default function MyFiles() {
  const [params, setParams] = useSearchParams()

  const pageNumber = Number(params.get('pageNumber') || 1)
  const pageSize = Number(params.get('pageSize') || 10)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFile, setActiveFile] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/user/files', { params: { pageNumber, pageSize } })
      setData(res.data)
    } catch (e) {
      setError(extractError(e))
    } finally {
      setLoading(false)
    }
  }, [pageNumber, pageSize])

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
          <Link
            to="/upload"
            className="bg-lumen-fg text-lumen-bg px-4 py-2 text-sm hover:opacity-90"
          >
            Upload a file
          </Link>
        </div>
      </header>

      <ErrorBanner message={error} onRetry={load} />

      {loading ? (
        <Spinner label="Loading your files..." />
      ) : files.length === 0 ? (
        <EmptyState
          title="No files yet"
          message='Click "Upload a file" above to add your first file.'
        />
      ) : (
        <div className="border border-lumen-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-lumen-subtle border-b border-lumen-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-lumen-muted uppercase text-xs tracking-wider">Name</th>
                <th className="text-left px-4 py-3 font-medium text-lumen-muted uppercase text-xs tracking-wider hidden sm:table-cell">Folder</th>
                <th className="text-left px-4 py-3 font-medium text-lumen-muted uppercase text-xs tracking-wider hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium text-lumen-muted uppercase text-xs tracking-wider hidden md:table-cell">Size</th>
                <th className="text-left px-4 py-3 font-medium text-lumen-muted uppercase text-xs tracking-wider hidden lg:table-cell">Owner</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => {
                const id = f.id ?? f.Id ?? `${f.Path}/${f.Name}`
                const e = ext(f)
                const s = sizeOf(f)
                return (
                  <tr
                    key={id}
                    onClick={() => setActiveFile(f)}
                    className="border-b border-lumen-border last:border-b-0 hover:bg-lumen-row-hover cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium">
                      <div className="truncate">{f.Name ?? '-'}</div>
                      {f.NFT && (
                        <div className="text-xs text-lumen-muted uppercase tracking-wider mt-0.5">NFT minted</div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-lumen-muted font-mono">{f.Path ?? '-'}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-lumen-muted">
                      {e ? '.' + String(e).toUpperCase() : '-'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-lumen-muted">{s ?? '-'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell font-mono text-lumen-muted">{shorten(f.OwnerAddress)}</td>
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

      <FileDetailModal file={activeFile} onClose={() => setActiveFile(null)} />
    </div>
  )
}
