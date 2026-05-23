export default function Spinner({ label = 'Loading...', inline = false }) {
  const ring = (
    <span
      aria-hidden
      className="inline-block w-4 h-4 border-2 border-current border-r-transparent animate-spin"
      style={{ borderRadius: '50%' }}
    />
  )

  if (inline) {
    if (!label) return ring
    return (
      <span className="inline-flex items-center gap-2">
        {ring}
        <span>{label}</span>
      </span>
    )
  }

  return (
    <div className="flex items-center gap-3 text-lumen-muted py-8 justify-center">
      {ring}
      <span className="text-sm">{label}</span>
    </div>
  )
}
