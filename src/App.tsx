import { useEffect, useState } from 'react'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import AdminLogin from './pages/AdminLogin'
import AdminPanel from './pages/AdminPanel'
import AuthPage from './pages/AuthPage'
import type { AuthUser } from './lib/auth'
import { useAuth, signOut } from './lib/auth'

export type Page = 'landing' | 'dashboard' | 'admin-login' | 'admin' | 'auth'

const PENDING_SCAN_KEY = 'bt_pending_scan'

export default function App() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState<Page>('landing')
  const [adminAuthed, setAdminAuthed] = useState(false)
  const [scanAddress, setScanAddress] = useState('')

  useEffect(() => {
    if (page === 'auth' && user) {
      const pending = sessionStorage.getItem(PENDING_SCAN_KEY)
      if (pending) {
        setScanAddress(pending)
        sessionStorage.removeItem(PENDING_SCAN_KEY)
      }
      setPage('dashboard')
    }
    if (page === 'dashboard' && !user) {
      setPage('landing')
    }
  }, [page, user])

  const navigate = (p: Page) => {
    if (p === 'admin' && !adminAuthed) { setPage('admin-login'); return }
    if (p === 'dashboard' && !user) { setPage('auth'); return }
    if (p === 'dashboard' && user) { setPage('dashboard'); return }
    setPage(p)
  }

  const startScan = (addr: string) => {
    setScanAddress(addr)
    if (user) { setPage('dashboard'); return }
    sessionStorage.setItem(PENDING_SCAN_KEY, addr)
    setPage('auth')
  }

  const handleSignOut = async () => {
    await signOut()
    setScanAddress('')
    setPage('landing')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-[#0057ff] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#6b7280]">Loading session…</p>
        </div>
      </div>
    )
  }

  if (page === 'auth') return (
    <AuthPage onBack={() => setPage('landing')} />
  )
  if (page === 'admin-login') return (
    <AdminLogin onAuth={() => { setAdminAuthed(true); setPage('admin') }} onBack={() => setPage('landing')} />
  )
  if (page === 'admin' && adminAuthed) return (
    <AdminPanel onBack={() => setPage('landing')} />
  )
  if (page === 'dashboard' && user) return (
    <Dashboard onBack={() => setPage('landing')} navigate={navigate} initialAddress={scanAddress} user={user} onSignOut={handleSignOut} />
  )
  return <Landing navigate={navigate} onScan={startScan} user={user} onSignIn={() => setPage('auth')} onSignOut={handleSignOut} />
}
