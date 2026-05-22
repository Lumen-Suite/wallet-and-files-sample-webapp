import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'

export default function Layout() {
  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-lumen-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 text-xs text-lumen-muted">
          Public sample &middot; demonstrates the Lumen BridgePass OAuth flow + personal file storage &middot; MIT licensed
        </div>
      </footer>
    </div>
  )
}
