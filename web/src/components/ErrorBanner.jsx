export default function ErrorBanner({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="border border-lumen-error bg-white p-4 my-4 flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-semibold text-lumen-error mb-1">Something went wrong</div>
        <div className="text-sm text-lumen-fg break-words">{message}</div>
        <div className="text-xs text-lumen-muted mt-2">
          Check that your <code className="font-mono">LUMEN_API_KEY</code> and{' '}
          <code className="font-mono">LUMEN_API_SECRET</code> in <code className="font-mono">.env</code> are correct,
          then restart with <code className="font-mono">npm start</code>.
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm border border-lumen-fg px-3 py-1 hover:bg-lumen-fg hover:text-lumen-bg"
        >
          Retry
        </button>
      )}
    </div>
  )
}
