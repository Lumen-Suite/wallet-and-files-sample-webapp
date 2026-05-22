import { useState } from 'react'

export default function SearchSortBar({
  search,
  onSearchChange,
  sortField,
  sortOrder,
  onSortChange,
  sortOptions = [],
  placeholder = 'Search...',
}) {
  const [localSearch, setLocalSearch] = useState(search ?? '')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearchChange(localSearch.trim())
  }

  const handleClear = () => {
    setLocalSearch('')
    onSearchChange('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4"
    >
      <div className="flex-1 flex items-center border border-lumen-border focus-within:border-lumen-fg">
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm outline-none"
        />
        {localSearch && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 text-lumen-muted hover:text-lumen-fg text-sm"
            aria-label="Clear search"
          >
            x
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm border-l border-lumen-border bg-lumen-fg text-lumen-bg hover:opacity-90"
        >
          Search
        </button>
      </div>

      {sortOptions.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <label className="text-lumen-muted">Sort</label>
          <select
            value={sortField ?? ''}
            onChange={(e) => onSortChange({ field: e.target.value || undefined, order: sortOrder ?? 'asc' })}
            className="border border-lumen-border px-2 py-2 text-lumen-fg"
          >
            <option value="">None</option>
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={sortOrder ?? 'asc'}
            disabled={!sortField}
            onChange={(e) => onSortChange({ field: sortField, order: e.target.value })}
            className="border border-lumen-border px-2 py-2 text-lumen-fg disabled:opacity-40"
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>
      )}
    </form>
  )
}
