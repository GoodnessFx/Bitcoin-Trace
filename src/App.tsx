import { useState } from 'react'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import AdminLogin from './pages/AdminLogin'
import AdminPanel from './pages/AdminPanel'

export type Page = 'landing' | 'dashboard' | 'admin-login' | 'admin'

export default function App() {
  const [page, setPage] = useState<Page>('landing')
  const [adminAuthed, setAdminAuthed] = useState(false)

  const navigate = (p: Page) => {
    if (p === 'admin' && !adminAuthed) { setPage('admin-login'); return }
    setPage(p)
  }

  if (page === 'admin-login') return (
    <AdminLogin onAuth={() => { setAdminAuthed(true); setPage('admin') }} onBack={() => setPage('landing')} />
  )
  if (page === 'admin' && adminAuthed) return (
    <AdminPanel onBack={() => setPage('landing')} />
  )
  if (page === 'dashboard') return (
    <Dashboard onBack={() => setPage('landing')} navigate={navigate} />
  )
  return <Landing navigate={navigate} />
}
