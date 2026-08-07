import { useState, useEffect, useRef } from 'react'
import type { Page } from '../App'
import type { AuthUser } from '../lib/auth'
import {
  Search, Upload, MessageSquare, FileText, Clock,
  ArrowLeft, Activity, AlertTriangle, Check, ChevronRight,
  Lock, Plus, Download, X, Loader, Bell, Receipt, Copy,
  FolderOpen, User, FileUp, Info, Bitcoin, LogOut, Wallet
} from 'lucide-react'

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

const MESSAGES = [
  { from: 'Investigator', time: '2h ago', text: 'We located 0.84 BTC ($52,140) linked to your case. The funds are traceable. Complete the recovery service fee to proceed with the release process.' },
  { from: 'You', time: '1d ago', text: 'Any update on the exchange identification? Our attorney needs the entity name for the subpoena.' },
  { from: 'Investigator', time: '1d ago', text: 'We have identified two exchanges that received funds. One is a US-registered entity. Report update coming within 24 hours.' },
]

const TIMELINE = [
  { date: 'Jul 28', event: 'Case submitted', done: true },
  { date: 'Jul 29', event: 'Initial review complete', done: true },
  { date: 'Jul 30', event: 'On-chain tracing started', done: true },
  { date: 'Jul 31', event: 'Wallet recovery scan', done: true },
  { date: 'Aug 1', event: 'Funds located — 0.84 BTC recovered', done: true },
  { date: 'Aug 2', event: 'Recovery fee settlement', done: false },
  { date: 'Aug 3', event: 'Fund release coordination', done: false },
]

const EVIDENCE = [
  { name: 'Police_Report_Hack.pdf', size: '1.2 MB', type: 'PDF', date: 'Jul 28, 2026', status: 'Verified' },
  { name: 'Exchange_Statement_Jul.pdf', size: '840 KB', type: 'PDF', date: 'Jul 28, 2026', status: 'Verified' },
  { name: 'Wallet_Tx_Screenshot.png', size: '2.1 MB', type: 'PNG', date: 'Jul 29, 2026', status: 'Under review' },
]

const INVOICES = [
  { id: 'INV-2026-0104', client: 'Jane D.', amount: '$3,000.00', currency: 'USD', status: 'Paid', date: 'Aug 1, 2026', method: 'BTC', tx: 'bc1qs9qkg8crclk...' },
  { id: 'INV-2026-0103', client: 'Jane D.', amount: '$3,000.00', currency: 'USD', status: 'Paid', date: 'Jul 12, 2026', method: 'BTC', tx: 'bc1qs9qkg8crclk...' },
  { id: 'INV-2026-0102', client: 'Jane D.', amount: '$3,000.00', currency: 'USD', status: 'Pending', date: 'Jul 28, 2026', method: 'BTC', tx: '—' },
]

const NOTIFICATIONS = [
  { icon: Bitcoin, text: 'Funds located on your case CS-2026-0891 — 0.84 BTC traced', time: '2h ago', unread: true },
  { icon: Receipt, text: 'Invoice INV-2026-0104 marked as paid', time: '1d ago', unread: true },
  { icon: MessageSquare, text: 'New message from your investigator', time: '1d ago', unread: true },
  { icon: FolderOpen, text: 'Evidence verified: Police_Report_Hack.pdf', time: '2d ago', unread: false },
  { icon: FileText, text: 'Final case report ready for CS-2026-0620', time: '3d ago', unread: false },
]

interface ScanResult {
  address: string
  chain: string
  balance: string
  totalSent: string
  totalReceived: string
  riskScore: number
  riskLabel: string
  recovered: boolean
  recoveredBtc: string
  recoveredUsd: string
  transactions: { hash: string; date: string; amount: string; direction: 'in' | 'out'; counterparty: string }[]
}

interface Props {
  onBack: () => void
  navigate: (p: Page) => void
  initialAddress?: string
  user: AuthUser | null
  onSignOut: () => void
}

export default function Dashboard({ onBack, navigate, initialAddress, user, onSignOut }: Props) {
  const [tab, setTab] = useState<'cases' | 'submit' | 'scan' | 'messages' | 'evidence' | 'invoices' | 'reports' | 'notifications'>('cases')
  const [scanAddr, setScanAddr] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [message, setMessage] = useState('')
  const [submitDone, setSubmitDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const [paid, setPaid] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [cases, setCases] = useState<Case[]>([])
  const [form, setForm] = useState({ name: '', email: '', incident: '', wallets: '', amount: '', chain: 'Bitcoin', date: '' })
  const initialRan = useRef(false)

  useEffect(() => {
    if (initialAddress && !initialRan.current) {
      initialRan.current = true
      setScanAddr(initialAddress)
      setTab('scan')
      handleScan(initialAddress)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAddress])

  const feeBtc = (RECOVERY_FEE_USD / BTC_PRICE).toFixed(4)

  const copyWallet = () => {
    navigator.clipboard?.writeText(COMPANY_WALLET).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleScan = (addr?: string) => {
    const target = addr ?? scanAddr
    if (!target.trim()) return
    setScanning(true)
    setScanResult(null)
    setScanProgress(0)
    const interval = setInterval(() => {
      setScanProgress(prev => {
        const next = prev + 4
        if (next >= 100) {
          clearInterval(interval)
          setScanning(false)
          const isEth = target.startsWith('0x')
          const newCase: Case = {
            id: isEth ? 'CS-2026-0E92' : 'CS-2026-0891',
            title: isEth ? 'Ethereum Recovery Scan' : 'Bitcoin Recovery Scan',
            status: 'Funds Located',
            chain: isEth ? 'ETH' : 'BTC',
            amount: isEth ? '$52,140' : '$52,140',
            progress: 78,
            created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            feeRequired: '$3,000',
            feePaid: false,
            eta: 'Awaiting fee',
            wallet: target,
          }
          setCases(prev => [newCase, ...prev.filter(c => c.wallet !== target)])
          setScanResult({
            address: target,
            chain: isEth ? 'Ethereum' : 'Bitcoin',
            balance: isEth ? '0.0041 ETH' : '0.00 BTC',
            totalSent: isEth ? '14.83 ETH ($52,140)' : '0.84 BTC ($52,140)',
            totalReceived: isEth ? '14.83 ETH' : '0.84 BTC',
            riskScore: target === COMPANY_WALLET ? 12 : 87,
            riskLabel: target === COMPANY_WALLET ? 'LOW RISK' : 'HIGH RISK',
            recovered: true,
            recoveredBtc: '0.84 BTC',
            recoveredUsd: '$52,140',
            transactions: [
              { hash: '3a9f8c1...b2c1', date: 'Jul 28, 2026', amount: '0.84 BTC', direction: 'out', counterparty: 'Unknown Mixer' },
              { hash: '88cdf9a...f1a9', date: 'Jul 27, 2026', amount: '0.84 BTC', direction: 'out', counterparty: 'Exchange Deposit' },
              { hash: 'c12e44a...3d7b', date: 'Jul 26, 2026', amount: '0.84 BTC', direction: 'in', counterparty: 'Your Wallet' },
              { hash: '44fae82...8e2c', date: 'Jul 25, 2026', amount: '0.0021 BTC', direction: 'in', counterparty: 'Network Fee Refund' },
            ],
          })
        }
        return next
      })
    }, 90)
  }

  const TABS = [
    { id: 'cases', label: 'My Cases', icon: FileText },
    { id: 'submit', label: 'Submit Case', icon: Plus },
    { id: 'scan', label: 'Recovery Scanner', icon: Search },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
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
              <img src="/logo.jpg" alt="BitcoinTrace" className="h-6 w-auto object-contain" />
              <span className="font-medium text-sm">BitcoinTrace Client Portal</span>
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
                      <button onClick={() => setPaymentOpen(true)}
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
                <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                  <p className="font-medium mb-4 flex items-center gap-2"><Clock size={15} className="text-[#0057ff]" /> Case Timeline — CS-2026-0891</p>
                  <div className="space-y-3">
                    {TIMELINE.map((t, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${t.done ? 'bg-[#0057ff]' : 'bg-[#f1f3f7] border border-[#e2e6ed]'}`}>
                          {t.done ? <Check size={12} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-[#c8cfd9]" />}
                        </div>
                        <span className={`text-sm ${t.done ? 'text-[#0f1117]' : 'text-[#6b7280]'}`}>{t.event}</span>
                        <span className="font-mono text-xs text-[#6b7280] ml-auto">{t.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
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
                  <p className="text-sm text-[#3d4452] mb-5">Enter the wallet address where your funds were sent. We will scan the chain, trace the movement, and identify recoverable funds.</p>
                  <div className="flex gap-3">
                    <input value={scanAddr} onChange={e => setScanAddr(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleScan()}
                      className="flex-1 border border-[#e2e6ed] rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#f7931a] transition-colors"
                      placeholder="Enter BTC or ETH address to scan (e.g. 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa)" />
                    <button onClick={() => handleScan()} disabled={scanning}
                      className="bg-[#f7931a] text-white px-5 py-3 rounded-xl font-medium text-sm hover:bg-[#e07e10] disabled:opacity-50 transition-all flex items-center gap-2">
                      {scanning ? <Loader size={15} className="animate-spin" /> : <Search size={15} />}
                      Scan
                    </button>
                  </div>
                </div>

                {scanning && (
                  <div className="bg-white border border-[#e2e6ed] rounded-xl p-8 text-center">
                    <div className="w-12 h-12 rounded-full border-2 border-[#f7931a]/20 border-t-[#f7931a] animate-spin mx-auto mb-4" />
                    <p className="font-mono text-sm text-[#3d4452]">Scanning blockchain for recoverable funds...</p>
                    <p className="font-mono text-xs text-[#6b7280] mt-1 mb-4">Tracing UTXOs · Matching clusters · Verifying ownership</p>
                    <div className="max-w-md mx-auto h-1.5 bg-[#f1f3f7] rounded-full overflow-hidden">
                      <div className="h-full bg-[#f7931a] rounded-full transition-all" style={{ width: `${scanProgress}%` }} />
                    </div>
                    <p className="font-mono text-xs text-[#f7931a] mt-2">{scanProgress}%</p>
                  </div>
                )}

                {scanResult && (
                  <div className="space-y-4">
                    {/* Recovered banner */}
                    <div className="relative overflow-hidden bg-[#0a0c10] rounded-xl border border-[#f7931a]/40 p-6 bracket-box">
                      <div className="scan-line-y" />
                      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#f7931a]/15 border border-[#f7931a]/40 flex items-center justify-center animate-pulse-ring">
                            <Check size={20} className="text-[#f7931a]" />
                          </div>
                          <div>
                            <p className="font-mono text-[10px] text-[#f7931a] uppercase tracking-widest mb-1">Funds Recovered</p>
                            <p className="font-heading font-700 text-2xl text-white">{scanResult.recoveredBtc} <span className="text-[#f7931a]">recovered</span></p>
                            <p className="font-mono text-xs text-white/50 mt-0.5">{scanResult.recoveredUsd} USD value · {scanResult.chain}</p>
                          </div>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-1">Status</p>
                          <p className="font-mono text-sm text-[#f7931a] font-medium">RECOVERABLE — RELEASE PENDING FEE</p>
                        </div>
                      </div>
                    </div>

                    {/* Withdrawal gate */}
                    {!paid ? (
                      <div className="bg-white border border-[#e2e6ed] rounded-xl overflow-hidden">
                        <div className="bg-[#0a0c10] px-5 py-4 flex items-center justify-between">
                          <p className="font-heading font-600 text-sm text-white flex items-center gap-2">
                            <Lock size={15} /> Withdrawal Locked
                          </p>
                          <span className="font-mono text-[10px] text-[#f7931a] uppercase tracking-widest">Fee required</span>
                        </div>
                        <div className="p-6">
                          <div className="grid md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-[#f8f9fb] border border-[#e2e6ed] rounded-xl p-4">
                              <p className="font-mono text-[10px] text-[#6b7280] uppercase tracking-widest mb-1">Recovered Value</p>
                              <p className="font-mono text-xl font-bold text-[#00875a]">{scanResult.recoveredUsd}</p>
                            </div>
                            <div className="bg-[#f8f9fb] border border-[#e2e6ed] rounded-xl p-4">
                              <p className="font-mono text-[10px] text-[#6b7280] uppercase tracking-widest mb-1">Fee Due</p>
                              <p className="font-mono text-xl font-bold text-[#f7931a]">{feeBtc} BTC</p>
                              <p className="font-mono text-[10px] text-[#6b7280] mt-0.5">≈ ${RECOVERY_FEE_USD.toLocaleString()} @ ${BTC_PRICE.toLocaleString()}/BTC</p>
                            </div>
                            <div className="bg-[#fef3c7] border border-[#b45309]/20 rounded-xl p-4">
                              <p className="font-mono text-[10px] text-[#b45309] uppercase tracking-widest mb-1">Release</p>
                              <p className="font-mono text-sm font-medium text-[#b45309]">After fee confirmation</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 bg-[#e8f0ff] rounded-xl p-4 mb-4">
                            <Info size={15} className="text-[#0057ff] flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-[#3d4452] leading-relaxed">Recovered funds cannot be withdrawn until the one-time recovery service fee is settled. This covers chain analysis, reporting, and the release process.</p>
                          </div>
                          <button onClick={() => setPaymentOpen(true)}
                            className="w-full bg-[#f7931a] text-white font-medium py-3 rounded-xl hover:bg-[#e07e10] transition-all flex items-center justify-center gap-2">
                            Proceed to Payment — $3,000 <ChevronRight size={15} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-[#00875a]/20 rounded-xl p-8 text-center">
                        <div className="w-14 h-14 bg-[#e3f5ee] rounded-full flex items-center justify-center mx-auto mb-4">
                          <Wallet size={24} className="text-[#00875a]" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Fee Received — Withdrawal Unlocked</h3>
                        <p className="text-[#3d4452] text-sm max-w-sm mx-auto mb-4">Your {scanResult.recoveredBtc} is being released to your verified wallet. Funds transfer usually broadcasts within 30–90 minutes.</p>
                        <button onClick={() => { setPaid(false); setScanResult(null); setCases([]) }}
                          className="text-sm text-[#0057ff] hover:underline">Scan Another Wallet</button>
                      </div>
                    )}

                    {/* Risk header */}
                    <div className={`rounded-xl p-5 border flex items-center justify-between ${
                      scanResult.riskScore >= 80 ? 'bg-[#fef2f2] border-[#dc2626]/20' : 'bg-[#fef3c7] border-[#b45309]/20'
                    }`}>
                      <div>
                        <p className="font-mono text-xs text-[#6b7280] mb-1">Risk Assessment</p>
                        <p className={`font-serif text-2xl font-bold ${scanResult.riskScore >= 80 ? 'text-[#dc2626]' : 'text-[#b45309]'}`}>{scanResult.riskLabel}</p>
                        <p className="font-mono text-xs text-[#6b7280] mt-1 max-w-xs truncate">{scanResult.address}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-3xl font-bold text-[#0f1117]">{scanResult.riskScore}</p>
                        <p className="font-mono text-xs text-[#6b7280]">/ 100 risk score</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Chain', value: scanResult.chain },
                        { label: 'Current Balance', value: scanResult.balance },
                        { label: 'Total Sent', value: scanResult.totalSent },
                        { label: 'Total Received', value: scanResult.totalReceived },
                      ].map(s => (
                        <div key={s.label} className="bg-white border border-[#e2e6ed] rounded-xl p-4">
                          <p className="font-mono text-[10px] text-[#6b7280] uppercase tracking-widest mb-1">{s.label}</p>
                          <p className="font-mono text-sm font-medium">{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Transactions */}
                    <div className="bg-white border border-[#e2e6ed] rounded-xl">
                      <div className="px-5 py-4 border-b border-[#e2e6ed] flex items-center justify-between">
                        <p className="font-medium text-sm">Transaction History</p>
                        <span className="font-mono text-xs text-[#6b7280]">{scanResult.transactions.length} shown</span>
                      </div>
                      {scanResult.transactions.map((tx, i) => (
                        <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-[#e2e6ed] last:border-0 hover:bg-[#f8f9fb] transition-colors">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${tx.direction === 'in' ? 'bg-[#e3f5ee]' : 'bg-[#fef2f2]'}`}>
                            <Activity size={12} className={tx.direction === 'in' ? 'text-[#00875a]' : 'text-[#dc2626]'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-xs text-[#0f1117]">{tx.hash}</p>
                            <p className="font-mono text-[10px] text-[#6b7280]">{tx.counterparty}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-mono text-sm font-medium ${tx.direction === 'in' ? 'text-[#00875a]' : 'text-[#dc2626]'}`}>
                              {tx.direction === 'in' ? '+' : '-'}{tx.amount}
                            </p>
                            <p className="font-mono text-[10px] text-[#6b7280]">{tx.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            {tab === 'messages' && (
              <div className="bg-white border border-[#e2e6ed] rounded-xl flex flex-col" style={{ height: 520 }}>
                <div className="px-5 py-4 border-b border-[#e2e6ed]">
                  <p className="font-medium">Case CS-2026-0891 — Investigator Chat</p>
                  <p className="text-xs text-[#00875a] flex items-center gap-1 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-[#00875a] inline-block" /> Investigator online</p>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {MESSAGES.map((m, i) => (
                    <div key={i} className={`flex ${m.from === 'You' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-sm rounded-2xl px-4 py-3 text-sm ${m.from === 'You' ? 'bg-[#0057ff] text-white' : 'bg-[#f1f3f7] text-[#0f1117]'}`}>
                        <p className={`font-mono text-[10px] mb-1 ${m.from === 'You' ? 'text-blue-200' : 'text-[#6b7280]'}`}>{m.from} · {m.time}</p>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#e2e6ed] p-4 flex gap-3">
                  <input value={message} onChange={e => setMessage(e.target.value)}
                    className="flex-1 border border-[#e2e6ed] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0057ff]"
                    placeholder="Message your investigator..." />
                  <button onClick={() => setMessage('')} className="bg-[#0057ff] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#0042cc] transition-colors">Send</button>
                </div>
              </div>
            )}

            {/* Evidence */}
            {tab === 'evidence' && (
              <div className="space-y-4">
                <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold">Submitted Evidence</h2>
                    <button className="flex items-center gap-1.5 text-xs text-[#0057ff] hover:underline font-medium">
                      <FileUp size={13} /> Upload Document
                    </button>
                  </div>
                  {EVIDENCE.map((e, i) => (
                    <div key={i} className="flex items-center justify-between py-3.5 border-b border-[#e2e6ed] last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#e8f0ff] rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText size={15} className="text-[#0057ff]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{e.name}</p>
                          <p className="font-mono text-xs text-[#6b7280]">{e.size} · {e.type} · {e.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${
                          e.status === 'Verified' ? 'bg-[#e3f5ee] text-[#00875a]' : 'bg-[#fef3c7] text-[#b45309]'
                        }`}>{e.status}</span>
                        <button className="text-[#6b7280] hover:text-[#0057ff] transition-colors"><Download size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invoices */}
            {tab === 'invoices' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total Paid', value: '$6,000' },
                    { label: 'Outstanding', value: '$3,000' },
                    { label: 'Next Payment', value: 'INV-2026-0102' },
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
                        {INVOICES.map(p => (
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
                  {[{
                    name: 'Fund Recovery Report — CS-2026-0891', date: 'Aug 3, 2026', pages: 24, format: 'PDF' },
                    { name: 'Blockchain Trace Analysis — CS-2026-0891', date: 'Aug 1, 2026', pages: 11, format: 'PDF' },
                    { name: 'Transaction Data Export — CS-2026-0744', date: 'Jul 30, 2026', pages: null, format: 'CSV' },
                    { name: 'Final Case Report — CS-2026-0620', date: 'Jul 14, 2026', pages: 38, format: 'PDF' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-3.5 border-b border-[#e2e6ed] last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#e8f0ff] rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText size={15} className="text-[#0057ff]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{r.name}</p>
                          <p className="font-mono text-xs text-[#6b7280]">{r.date} · {r.format}{r.pages ? ` · ${r.pages} pages` : ''}</p>
                        </div>
                      </div>
                      <button className="flex items-center gap-1.5 text-xs text-[#0057ff] hover:underline font-medium">
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
                  <button className="text-xs text-[#0057ff] hover:underline">Mark all read</button>
                </div>
                <div className="divide-y divide-[#e2e6ed]">
                  {NOTIFICATIONS.map((n, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-[#f8f9fb] transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${n.unread ? 'bg-[#f7931a]/10 text-[#f7931a]' : 'bg-[#f1f3f7] text-[#6b7280]'}`}>
                        <n.icon size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{n.text}</p>
                        <p className="font-mono text-xs text-[#6b7280]">{n.time}</p>
                      </div>
                      {n.unread && <span className="w-2 h-2 rounded-full bg-[#f7931a]" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Payment modal */}
      {paymentOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPaymentOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-[#f7931a] px-6 py-4 flex items-center justify-between">
              <p className="font-heading font-600 text-sm text-white flex items-center gap-2">
                <Bitcoin size={16} /> Recovery Service Fee
              </p>
              <button onClick={() => setPaymentOpen(false)} className="text-white/80 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-[10px] text-[#6b7280] uppercase tracking-widest">Amount Due</p>
                <p className="font-mono text-xl font-bold text-[#0f1117]">{feeBtc} BTC</p>
              </div>
              <p className="font-mono text-[10px] text-[#6b7280] uppercase tracking-widest mb-2">Send payment to (Bitcoin)</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 border border-[#e2e6ed] rounded-xl px-4 py-3 bg-[#f8f9fb]">
                  <Bitcoin size={18} className="text-[#f7931a] flex-shrink-0" />
                  <code className="font-mono text-[11px] text-[#0f1117] break-all leading-snug">{COMPANY_WALLET}</code>
                </div>
                <button onClick={copyWallet}
                  className="inline-flex items-center justify-center gap-2 bg-[#0a0c10] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#1a1e28] transition-all">
                  <Copy size={14} /> {copied ? 'Copied ✓' : 'Copy Address'}
                </button>
              </div>

              <div className="mt-4 flex items-start gap-3 bg-[#e8f0ff] rounded-xl p-3.5">
                <Info size={14} className="text-[#0057ff] flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#3d4452] leading-relaxed">Once we confirm your payment on-chain (2–6 block confirmations), the recovered funds are released to your verified wallet.</p>
              </div>

              <button onClick={() => { setPaid(true); setPaymentOpen(false); setCases(prev => prev.map(c => ({ ...c, feePaid: true }))) }}
                className="mt-5 w-full bg-[#f7931a] text-white font-medium py-3 rounded-xl hover:bg-[#e07e10] transition-all flex items-center justify-center gap-2">
                I Have Sent the Payment — Verify <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
