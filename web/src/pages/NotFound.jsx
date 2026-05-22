import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <div className="text-6xl font-bold tracking-tight text-lumen-fg">404</div>
      <div className="text-lumen-muted mt-2 mb-6">This page does not exist.</div>
      <Link to="/" className="inline-block border border-lumen-fg px-4 py-2 text-sm hover:bg-lumen-fg hover:text-lumen-bg">
        Back to dashboard
      </Link>
    </div>
  )
}
