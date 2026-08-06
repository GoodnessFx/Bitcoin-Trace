import { useState } from 'react'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import AdminLogin from './pages/AdminLogin'
import AdminPanel from './pages/AdminPanel'
import AuthPage from './pages/AuthPage'
import type { AuthUser } from './lib/auth'
import { getSession, signOut } from './lib/auth'

export type Page = 'landing' | 'dashboard' | 'admin-login' | 'admin' | 'auth'

export default function App() {
  const [page, setPage] = useState<Page>('landing')
  const [adminAuthed, setAdminAuthed] = useState(false)
  const [scanAddress, setScanAddress] = useState('')
  const [user, setUser] = useState<AuthUser | null>(() => getSession())

  const navigate = (p: Page) => {
    if (p === 'admin' && !adminAuthed) { setPage('admin-login'); return }
    if (p === 'dashboard' && !user) { setPage('auth'); return }
    if (p === 'dashboard' && user) { setPage('dashboard'); return }
    setPage(p)
  }

  const startScan = (addr: string) => {
    if (!user) { setPage('auth'); return }
    setScanAddress(addr)
    setPage('dashboard')
  }

  const handleSignOut = () => {
    signOut()
    setUser(null)
    setScanAddress('')
    setPage('landing')
  }

  if (page === 'auth') return (
    <AuthPage onAuth={(u) => { setUser(u); setPage('dashboard') }} onBack={() => setPage('landing')} />
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
