const PAGE_SIZES = [5, 10, 20, 50]

export default function Pagination({ pagination, pageSize, onPageChange, onPageSizeChange }) {
  if (!pagination) return null
  const { CurrentPage = 1, TotalPage = 1, TotalRowCount = 0 } = pagination
  const isFirst = CurrentPage <= 1
  const isLast = CurrentPage >= TotalPage

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 text-sm">
      <div className="text-lumen-muted">
        Page {CurrentPage} of {Math.max(1, TotalPage)} &middot; {TotalRowCount} total
      </div>

      <div className="flex items-center gap-2">
        <label className="text-lumen-muted">
          Rows
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="ml-2 border border-lumen-border px-2 py-1 text-lumen-fg"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={isFirst}
          onClick={() => onPageChange(CurrentPage - 1)}
          className="border border-lumen-border px-3 py-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-lumen-row-hover"
        >
          Prev
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={() => onPageChange(CurrentPage + 1)}
          className="border border-lumen-border px-3 py-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-lumen-row-hover"
        >
          Next
        </button>
      </div>
    </div>
  )
}
