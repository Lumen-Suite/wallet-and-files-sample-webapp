export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center gap-3 text-lumen-muted py-8 justify-center">
      <span
        aria-hidden
        className="inline-block w-4 h-4 border-2 border-lumen-fg border-r-transparent animate-spin"
        style={{ borderRadius: '50%' }}
      />
      <span className="text-sm">{label}</span>
    </div>
  )
}
