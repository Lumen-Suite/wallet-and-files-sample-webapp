export default function EmptyState({ title, message, action }) {
  return (
    <div className="border border-dashed border-lumen-border p-10 text-center">
      <div className="text-base font-semibold text-lumen-fg mb-1">{title}</div>
      {message && <div className="text-sm text-lumen-muted max-w-md mx-auto">{message}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
