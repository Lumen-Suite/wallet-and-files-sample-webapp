import { useCallback, useEffect, useState } from 'react'
import { api, extractError } from '../api/client.js'
import { ROOT, normalize, joinPath, parentPath, breadcrumbSegments } from '../lib/path.js'
import Spinner from './Spinner.jsx'

function isFolder(item) {
  if (!item) return false
  return item.Type === 'folder' || item.FolderType !== undefined
}

function FolderIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
      className="shrink-0"
    >
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

function ChevronUp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m6 15 6-6 6 6" />
    </svg>
  )
}

export default function FolderPicker({ value, onChange }) {
  const current = normalize(value)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async (p) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/directoryItems', {
        params: { path: p, pageNumber: 1, pageSize: 100 },
      })
      const arr = res.data?.Items ?? res.data?.items ?? []
      setItems(arr.filter(isFolder))
    } catch (e) {
      setError(extractError(e))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(current) }, [load, current])

  const goTo = (p) => {
    const next = normalize(p)
    if (next !== current) onChange?.(next)
  }

  const segs = breadcrumbSegments(current)
  const showUp = current !== ROOT

  return (
    <div className="space-y-3">
      <div className="border border-lumen-border">
        <div className="flex items-center justify-between gap-3 border-b border-lumen-border px-3 py-2 bg-lumen-subtle">
          <nav className="flex items-center flex-wrap gap-1 text-sm min-w-0" aria-label="Folder path">
            {segs.map((s, i) => {
              const last = i === segs.length - 1
              return (
                <span key={s.path} className="flex items-center gap-1">
                  {i > 0 && <span className="text-lumen-muted">/</span>}
                  {last ? (
                    <span className="font-medium text-lumen-fg">{s.name}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => goTo(s.path)}
                      className="text-lumen-muted hover:text-lumen-fg underline-offset-2 hover:underline"
                    >
                      {s.name}
                    </button>
                  )}
                </span>
              )
            })}
          </nav>
          {current !== ROOT && (
            <button
              type="button"
              onClick={() => goTo(ROOT)}
              className="text-xs text-lumen-muted hover:text-lumen-fg shrink-0"
            >
              Reset to Home
            </button>
          )}
        </div>

        <div>
          {showUp && (
            <button
              type="button"
              onClick={() => goTo(parentPath(current))}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-lumen-muted hover:bg-lumen-row-hover hover:text-lumen-fg border-b border-lumen-border"
            >
              <ChevronUp />
              <span>Up one level</span>
            </button>
          )}

          {loading ? (
            <div className="px-3 py-6 flex justify-center">
              <Spinner inline label="Loading folders..." />
            </div>
          ) : error ? (
            <div className="px-3 py-4 text-sm text-lumen-error break-words">{error}</div>
          ) : items.length === 0 ? (
            <div className="px-3 py-6 text-sm text-lumen-muted text-center">
              No sub-folders here. The file will be uploaded directly to{' '}
              <code className="font-mono">{current}</code>.
            </div>
          ) : (
            <ul className="max-h-56 overflow-y-auto">
              {items.map((it) => {
                const name = it.Name
                const fullPath = joinPath(current, name)
                return (
                  <li key={fullPath}>
                    <button
                      type="button"
                      onClick={() => goTo(fullPath)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-lumen-row-hover border-b border-lumen-border last:border-b-0 text-lumen-fg"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <FolderIcon />
                        <span className="truncate">{name}</span>
                      </span>
                      <span className="text-lumen-muted shrink-0">
                        <ChevronRight />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="text-sm flex items-center justify-between flex-wrap gap-2">
        <span className="text-lumen-muted">Uploading to:</span>
        <code className="font-mono text-lumen-fg break-all">{current}</code>
      </div>
    </div>
  )
}
