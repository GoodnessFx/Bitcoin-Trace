import { useState } from 'react'
import {
  ArrowLeft, Users, FileText, DollarSign, Activity,
  AlertTriangle, Check, Clock, Search, Download, Eye, Lock,
  TrendingUp, BarChart2, Bell, Settings, LogOut, Network, Globe,
  KeyRound, Filter, MessageSquare, FileUp, PieChart, Timer,
  Award, Fingerprint, Info, Image as ImageIcon, Trash2, Wallet
} from 'lucide-react'
import { LOGO_URL } from '../lib/branding'
import { getReceipts, setReceiptVerified, deleteReceipt } from '../lib/receipts'
import { getClientSignIns } from '../lib/storage'

const CASES = [
  { id: 'CS-2026-0891', client: 'Jane D.', email: 'jane.d@email.com', chain: 'BTC', amount: '$52,140', status: 'Funds Located', investigator: 'Marcus T.', paid: true, plan: 'Recovery', created: 'Jul 28', feeRequired: '$5,000', feePaid: false, txHash: 'â€”', eta: 'Awaiting fee' },
  { id: 'CS-2026-0744', client: 'Kwame B.', email: 'kb@example.com', chain: 'ARB', amount: '$11,200', status: 'Investigation', investigator: 'Sara L.', paid: true, plan: 'Recovery', created: 'Jul 12', feeRequired: '$5,000', feePaid: false, txHash: 'â€”', eta: 'Under review' },
  { id: 'CS-2026-0620', client: 'Natalia R.', email: 'nr@corp.io', chain: 'ETH', amount: '$6,400', status: 'Report Ready', investigator: 'Marcus T.', paid: true, plan: 'Recovery', created: 'Jun 4', feeRequired: '$5,000', feePaid: true, txHash: '3a9f8c1...b2c1', eta: 'Closed' },
  { id: 'CS-2026-0588', client: 'Thomas M.', email: 'tm@gmail.com', chain: 'BTC', amount: '$312,592', status: 'Pending Review', investigator: 'Unassigned', paid: false, plan: 'Recovery', created: 'Jun 1', feeRequired: '$5,000', feePaid: false, txHash: 'â€”', eta: 'â€”' },
  { id: 'CS-2026-0541', client: 'Priya K.', email: 'pk@fintech.sg', chain: 'SOL', amount: '$48,100', status: 'Funds Located', investigator: 'Sara L.', paid: true, plan: 'Recovery', created: 'May 28', feeRequired: '$5,000', feePaid: true, txHash: 'bc1qs9qkg8crclk...', eta: 'Release pending' },
  { id: 'CS-2026-0490', client: 'Ahmed O.', email: 'ao@legal.ae', chain: 'BTC', amount: '$9,340', status: 'Closed', investigator: 'Sara L.', paid: true, plan: 'Recovery', created: 'May 15', feeRequired: '$5,000', feePaid: true, txHash: '12ab...cdef', eta: 'Closed' },
]

const PAYMENTS = [
  { id: 'INV-2026-0104', client: 'Jane D.', amount: '$5,000.00', currency: 'USD', status: 'Paid', date: 'Aug 1, 2026', method: 'BTC', tx: 'bc1qs9qkg8crclk...' },
  { id: 'INV-2026-0103', client: 'Kwame B.', amount: '$5,000.00', currency: 'USD', status: 'Paid', date: 'Jul 12, 2026', method: 'BTC', tx: 'bc1qs9qkg8crclk...' },
  { id: 'INV-2026-0102', client: 'Jane D.', amount: '$5,000.00', currency: 'USD', status: 'Pending', date: 'Jul 28, 2026', method: 'BTC', tx: 'â€”' },
  { id: 'INV-2026-0101', client: 'Priya K.', amount: '$5,000.00', currency: 'USD', status: 'Paid', date: 'May 28, 2026', method: 'BTC', tx: 'bc1qs9qkg8crclk...' },
  { id: 'INV-2026-0100', client: 'Natalia R.', amount: '$5,000.00', currency: 'USD', status: 'Paid', date: 'Jun 4, 2026', method: 'BTC', tx: 'bc1qs9qkg8crclk...' },
  { id: 'INV-2026-0099', client: 'Ahmed O.', amount: '$5,000.00', currency: 'USD', status: 'Paid', date: 'May 15, 2026', method: 'BTC', tx: 'bc1qs9qkg8crclk...' },
]

const AUDIT = [
  { action: 'Admin login', user: 'admin@bitcointrace.io', role: 'Super Admin', time: 'Just now', ip: '192.168.1.1', device: 'Chrome Â· Windows' },
  { action: 'Case CS-2026-0891 status updated â†’ Funds Located', user: 'marcus.t', role: 'Investigator', time: '2h ago', ip: '10.0.0.12', device: 'Safari Â· macOS' },
  { action: 'Report generated â€” CS-2026-0620', user: 'sara.l', role: 'Investigator', time: '5h ago', ip: '10.0.0.14', device: 'Chrome Â· Windows' },
  { action: 'Invoice INV-2026-0104 verified on-chain', user: 'finance@', role: 'Finance', time: '1d ago', ip: '192.168.1.1', device: 'Chrome Â· Windows' },
  { action: 'New case CS-2026-0588 assigned', user: 'admin@', role: 'Super Admin', time: '2d ago', ip: '192.168.1.1', device: 'Chrome Â· Windows' },
  { action: 'Company wallet payment monitor enabled', user: 'system', role: 'System', time: '2d ago', ip: '10.0.0.1', device: 'Daemon' },
]

const NOTIFICATIONS = [
  { type: 'New case submitted', detail: 'CS-2026-0588 â€” Thomas M.', time: '2h ago', color: '#0057ff' },
  { type: 'Client uploaded evidence', detail: 'Jane D. â€” Police_Report_Hack.pdf', time: '3h ago', color: '#f7931a' },
  { type: 'Payment received', detail: 'INV-2026-0104 â€” $5,000', time: '5h ago', color: '#00875a' },
  { type: 'Investigation assigned', detail: 'CS-2026-0588 â†’ Marcus T.', time: '1d ago', color: '#b45309' },
  { type: 'Client sent message', detail: 'CS-2026-0891 â€” Jane D.', time: '1d ago', color: '#0057ff' },
  { type: 'Investigation completed', detail: 'CS-2026-0620 â€” Report ready', time: '2d ago', color: '#00875a' },
]

const ANALYTICS = {
  casesPerMonth: [
    { m: 'Feb', v: 6 }, { m: 'Mar', v: 9 }, { m: 'Apr', v: 7 }, { m: 'May', v: 12 },
    { m: 'Jun', v: 15 }, { m: 'Jul', v: 18 }, { m: 'Aug', v: 11 },
  ],
  networkDistribution: [
    { n: 'Bitcoin', v: 62 }, { n: 'Ethereum', v: 18 }, { n: 'Solana', v: 9 }, { n: 'BNB', v: 6 }, { n: 'Other', v: 5 },
  ],
  revenue: [
    { m: 'Feb', v: 12 }, { m: 'Mar', v: 18 }, { m: 'Apr', v: 15 }, { m: 'May', v: 24 },
    { m: 'Jun', v: 30 }, { m: 'Jul', v: 36 }, { m: 'Aug', v: 21 },
  ],
  workload: [
    { n: 'Marcus T.', v: 14 }, { n: 'Sara L.', v: 11 }, { n: 'Kwame A.', v: 7 },
  ],
}

const ANALYSIS_SAMPLE = {
  address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  network: 'Bitcoin',
  firstSeen: 'Mar 14, 2021',
  lastActive: 'Aug 2, 2026',
  txCount: '1,284',
  inbound: '214.6 BTC',
  outbound: '213.8 BTC',
  riskIndicators: [
    { label: 'Mixer exposure', level: 'HIGH' },
    { label: 'Exchange deposit (Binance)', level: 'DETECTED' },
    { label: 'Sanctions list match', level: 'CLEAR' },
    { label: 'Address reuse', level: 'LOW' },
  ],
}

type AdminTab = 'overview' | 'cases' | 'payments' | 'receipts' | 'analysis' | 'analytics' | 'notifications' | 'audit' | 'clients'

interface Props { onBack: () => void }

export default function AdminPanel({ onBack }: Props) {
  const [tab, setTab] = useState<AdminTab>('overview')
  const [search, setSearch] = useState('')
  const [chainFilter, setChainFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [receipts, setReceipts] = useState(() => getReceipts())
  const clients = getClientSignIns()

  const filteredCases = CASES.filter(c =>
    (c.id.includes(search) || c.client.toLowerCase().includes(search.toLowerCase()) || c.status.toLowerCase().includes(search.toLowerCase())) &&
    (chainFilter === 'All' || c.chain === chainFilter) &&
    (statusFilter === 'All' || c.status === statusFilter)
  )

  const statusStyle = (s: string) => {
    if (s === 'Closed' || s === 'Report Ready') return 'bg-[#e3f5ee] text-[#00875a]'
    if (s === 'Funds Located') return 'bg-[#f7931a]/10 text-[#f7931a] border border-[#f7931a]/30'
    if (s === 'Pending Review') return 'bg-[#fef3c7] text-[#b45309]'
    return 'bg-[#e8f0ff] text-[#0057ff]'
  }

  const TABS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'cases', label: 'Cases', icon: FileText },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'receipts', label: 'Receipts', icon: ImageIcon },
    { id: 'analysis', label: 'Blockchain Analysis', icon: Network },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'audit', label: 'Security & Audit', icon: Lock },
    { id: 'clients', label: 'Client Sign-ins', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#0f1117]">
      {/* Top bar */}
      <div className="bg-[#0f1117] border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src={LOGO_URL} alt="" className="h-6 w-auto object-contain" />
              <span className="font-medium text-sm text-white">CryptoWallet Tracker Admin</span>
            </div>
            <span className="font-mono text-[10px] bg-[#f7931a]/20 text-[#f7931a] px-2 py-0.5 rounded-full uppercase tracking-widest">Secure Portal</span>
            <span className="font-mono text-[10px] bg-[#0057ff]/20 text-[#0057ff] px-2 py-0.5 rounded-full uppercase tracking-widest">Super Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-white/40 flex items-center gap-1"><Lock size={10} /> All actions logged</span>
            <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors">
              <LogOut size={13} /> Exit
            </button>
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
                    tab === t.id ? 'bg-[#0f1117] text-white font-medium' : 'text-[#3d4452] hover:bg-[#f8f9fb]'
                  }`}>
                  <t.icon size={15} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* RBAC summary */}
            <div className="mt-4 bg-white border border-[#e2e6ed] rounded-xl p-4">
              <p className="font-mono text-[9px] text-[#6b7280] uppercase tracking-widest mb-2">Access Roles</p>
              {['Super Admin', 'Admin', 'Investigator', 'Finance', 'Support'].map((r, i) => (
                <div key={r} className="flex items-center gap-2 py-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-[#f7931a]' : 'bg-[#0057ff]'}`} />
                  <span className="text-[11px] text-[#3d4452]">{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* Overview */}
            {tab === 'overview' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg">Operations Overview</h2>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[#6b7280]">Last 30 days</span>
                    <button className="text-xs text-[#0057ff] hover:underline flex items-center gap-1 font-medium"><Download size={12} /> Export</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Cases', value: '37', sub: '', icon: FileText, color: 'text-[#0057ff]', bg: 'bg-[#e8f0ff]' },
                    { label: 'Open Cases', value: '21', sub: '', icon: Activity, color: 'text-[#b45309]', bg: 'bg-[#fef3c7]' },
                    { label: 'Closed Cases', value: '16', sub: '', icon: Check, color: 'text-[#00875a]', bg: 'bg-[#e3f5ee]' },
                    { label: 'Pending Reviews', value: '5', sub: '', icon: Clock, color: 'text-[#6b7280]', bg: 'bg-[#f1f3f7]' },
                    { label: 'Payments Received', value: '$54,000', sub: '', icon: DollarSign, color: 'text-[#00875a]', bg: 'bg-[#e3f5ee]' },
                    { label: 'Outstanding Invoices', value: '3', sub: '', icon: AlertTriangle, color: 'text-[#b45309]', bg: 'bg-[#fef3c7]' },
                    { label: 'Revenue MTD', value: '$21,000', sub: '', icon: TrendingUp, color: 'text-[#f7931a]', bg: 'bg-[#fff8f0]' },
                    { label: 'Avg Case Duration', value: '3.2d', sub: '', icon: Timer, color: 'text-[#0057ff]', bg: 'bg-[#e8f0ff]' },
                    { label: 'Recovered Assets', value: '$200,000', sub: 'Jenny Li', icon: Wallet, color: 'text-[#00875a]', bg: 'bg-[#e3f5ee]' },
                  ].map(s => (
                    <div key={s.label} className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                      <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                        <s.icon size={16} className={s.color} />
                      </div>
                      <p className="font-heading font-700 text-2xl">{s.value}</p>
                      <p className="text-xs text-[#6b7280] mt-0.5">{s.label}</p>
                      {s.sub && <p className="font-mono text-[10px] text-[#8b92a5] mt-0.5">{s.sub}</p>}
                    </div>
                  ))}
                </div>

                {/* Daily activity */}
                <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-medium text-sm">Daily Activity</p>
                    <span className="font-mono text-[10px] text-[#6b7280]">LAST 7 DAYS</span>
                  </div>
                  <div className="flex items-end gap-2 h-24">
                    {[5, 8, 4, 9, 7, 11, 6].map((v, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-gradient-to-t from-[#0057ff] to-[#4d8dff] rounded-t transition-all hover:from-[#f7931a] hover:to-[#ffb347]" style={{ height: `${v * 8}px` }} />
                        <span className="font-mono text-[9px] text-[#8b92a5]">{['S','M','T','W','T','F','S'][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent cases table */}
                <div className="bg-white border border-[#e2e6ed] rounded-xl">
                  <div className="px-5 py-4 border-b border-[#e2e6ed]">
                    <p className="font-medium text-sm">Recent Cases</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#e2e6ed]">
                          {['Case ID', 'Client', 'Chain', 'Amount', 'Status', 'Fee'].map(h => (
                            <th key={h} className="px-5 py-3 text-left font-mono text-[10px] text-[#6b7280] uppercase tracking-widest">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {CASES.slice(0, 5).map(c => (
                          <tr key={c.id} className="border-b border-[#e2e6ed] last:border-0 hover:bg-[#f8f9fb] transition-colors">
                            <td className="px-5 py-3.5 font-mono text-xs text-[#0057ff]">{c.id}</td>
                            <td className="px-5 py-3.5 font-medium">{c.client}</td>
                            <td className="px-5 py-3.5 font-mono text-xs">{c.chain}</td>
                            <td className="px-5 py-3.5 font-mono text-xs">{c.amount}</td>
                            <td className="px-5 py-3.5">
                              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${statusStyle(c.status)}`}>{c.status}</span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-xs">
                              {c.feePaid ? <Check size={14} className="text-[#00875a]" /> : <Clock size={14} className="text-[#b45309]" />}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Cases */}
            {tab === 'cases' && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b7280]" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      className="w-full border border-[#e2e6ed] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#0057ff] bg-white"
                      placeholder="Search cases, clients, status..." />
                  </div>
                  <select value={chainFilter} onChange={e => setChainFilter(e.target.value)}
                    className="border border-[#e2e6ed] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0057ff] bg-white">
                    {['All', 'BTC', 'ETH', 'ARB', 'SOL'].map(c => <option key={c}>{c}</option>)}
                  </select>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="border border-[#e2e6ed] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0057ff] bg-white">
                    {['All', 'Funds Located', 'Investigation', 'Pending Review', 'Report Ready', 'Closed'].map(s => <option key={s}>{s}</option>)}
                  </select>
                  <button className="flex items-center gap-1.5 border border-[#e2e6ed] rounded-xl px-4 py-2.5 text-sm text-[#3d4452] hover:border-[#0057ff] transition-colors bg-white">
                    <Filter size={14} /> More Filters
                  </button>
                </div>

                <div className="bg-white border border-[#e2e6ed] rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#e2e6ed] bg-[#f8f9fb]">
                          {['Case ID', 'Client', 'Chain', 'Amount', 'Status', 'Investigator', 'Fee', 'Actions'].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-[#6b7280] uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCases.map(c => (
                          <tr key={c.id} className="border-b border-[#e2e6ed] last:border-0 hover:bg-[#f8f9fb] transition-colors">
                            <td className="px-4 py-3.5 font-mono text-xs text-[#0057ff]">{c.id}</td>
                            <td className="px-4 py-3.5">
                              <p className="font-medium">{c.client}</p>
                              <p className="text-[10px] text-[#6b7280] font-mono">{c.email}</p>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-xs">{c.chain}</td>
                            <td className="px-4 py-3.5 font-mono text-xs font-medium">{c.amount}</td>
                            <td className="px-4 py-3.5">
                              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${statusStyle(c.status)}`}>{c.status}</span>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-[#3d4452]">
                              {c.investigator === 'Unassigned'
                                ? <select className="border border-[#e2e6ed] rounded px-2 py-1 text-xs bg-white">
                                    <option>Assignâ€¦</option><option>Marcus T.</option><option>Sara L.</option><option>Kwame A.</option>
                                  </select>
                                : c.investigator}
                            </td>
                            <td className="px-4 py-3.5">
                              {c.feePaid
                                ? <span className="font-mono text-[10px] bg-[#e3f5ee] text-[#00875a] px-2 py-0.5 rounded-full">Paid</span>
                                : <span className="font-mono text-[10px] bg-[#fef3c7] text-[#b45309] px-2 py-0.5 rounded-full">Pending</span>
                              }
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <button className="text-[#6b7280] hover:text-[#0057ff] transition-colors" title="View"><Eye size={14} /></button>
                                <button className="text-[#6b7280] hover:text-[#0057ff] transition-colors" title="Message"><MessageSquare size={14} /></button>
                                <button className="text-[#6b7280] hover:text-[#0057ff] transition-colors" title="Export"><Download size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Internal notes */}
                <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                  <p className="font-medium text-sm mb-3 flex items-center gap-2"><FileText size={14} className="text-[#0057ff]" /> Internal Notes â€” CS-2026-0891</p>
                  <div className="space-y-2">
                    {[
                      { user: 'Marcus T.', time: '2h ago', note: 'UTXO trace confirms 0.84 BTC at exchange cluster. Subpoena package drafted.' },
                      { user: 'admin@', time: '1d ago', note: 'Client verified. Fee invoice INV-2026-0102 issued.' },
                    ].map((n, i) => (
                      <div key={i} className="bg-[#f8f9fb] border border-[#e2e6ed] rounded-lg px-4 py-3">
                        <p className="font-mono text-[10px] text-[#6b7280] mb-1">{n.user} Â· {n.time}</p>
                        <p className="text-sm text-[#3d4452]">{n.note}</p>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input className="flex-1 border border-[#e2e6ed] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0057ff]" placeholder="Add internal note..." />
                      <button className="bg-[#0f1117] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1a1e28] transition-colors">Add</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payments */}
            {tab === 'payments' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Collected', value: '$54,000', sub: 'All time' },
                    { label: 'This Month', value: '$21,000', sub: 'Aug 2026' },
                    { label: 'Outstanding', value: '3 invoices', sub: '$9,000 pending' },
                  ].map(s => (
                    <div key={s.label} className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                      <p className="text-xs text-[#6b7280] mb-1">{s.label}</p>
                      <p className="font-heading font-700 text-2xl">{s.value}</p>
                      <p className="font-mono text-[10px] text-[#6b7280] mt-1">{s.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white border border-[#e2e6ed] rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#e2e6ed] flex items-center justify-between">
                    <p className="font-medium text-sm">Invoice & Payment Records</p>
                    <button className="flex items-center gap-1.5 text-xs text-[#0057ff] font-medium"><Download size={12} /> Export CSV</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#e2e6ed] bg-[#f8f9fb]">
                          {['Invoice', 'Client', 'Amount', 'Currency', 'Date', 'Method', 'Status', 'Tx Hash', 'Actions'].map(h => (
                            <th key={h} className="px-5 py-3 text-left font-mono text-[10px] text-[#6b7280] uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {PAYMENTS.map(p => (
                          <tr key={p.id} className="border-b border-[#e2e6ed] last:border-0 hover:bg-[#f8f9fb] transition-colors">
                            <td className="px-5 py-3.5 font-mono text-xs text-[#0057ff]">{p.id}</td>
                            <td className="px-5 py-3.5 font-medium">{p.client}</td>
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

                {/* Wallet monitor */}
                <div className="bg-[#0a0c10] border border-[#f7931a]/30 rounded-xl p-5 bracket-box relative overflow-hidden">
                  <div className="scan-line-y" />
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-mono text-[10px] text-[#f7931a] uppercase tracking-widest">Payment Wallet Monitor</p>
                    <span className="font-mono text-[9px] text-white/40 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#f7931a] animate-pulse inline-block" /> LIVE</span>
                  </div>
                  <p className="font-mono text-xs text-white/70 break-all mb-2">bc1qs9qkg8crclkyxcjlj6vr3hlwuz60d6wu7yhfta</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Confirmed Balance', value: '1.92 BTC' },
                      { label: 'Pending Confirmations', value: '0' },
                      { label: 'Last Deposit', value: '0.0453 BTC' },
                    ].map(s => (
                      <div key={s.label} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                        <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1">{s.label}</p>
                        <p className="font-mono text-sm text-white">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Receipts */}
            {tab === 'receipts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-lg">Payment Receipts</h2>
                    <p className="text-sm text-[#3d4452]">Receipts uploaded by clients after sending the recovery fee.</p>
                  </div>
                  <span className="font-mono text-xs bg-[#f7931a]/10 text-[#f7931a] px-2.5 py-1 rounded-full">{receipts.length} uploaded</span>
                </div>

                {receipts.length === 0 ? (
                  <div className="bg-white border border-[#e2e6ed] rounded-xl p-12 text-center">
                    <div className="w-14 h-14 rounded-full bg-[#f7931a]/10 border border-[#f7931a]/30 flex items-center justify-center mx-auto mb-4">
                      <ImageIcon size={22} className="text-[#f7931a]" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">No receipts yet</h3>
                    <p className="text-sm text-[#3d4452] max-w-sm mx-auto">When a client uploads their payment receipt after sending the service fee, it will appear here for verification.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {receipts.map(r => (
                      <div key={r.id} className="bg-white border border-[#e2e6ed] rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-[#e2e6ed] flex items-center justify-between">
                          <div>
                            <p className="font-mono text-xs text-[#0057ff]">{r.id}</p>
                            <p className="font-mono text-[10px] text-[#6b7280]">{r.caseId} Â· {r.clientName}</p>
                          </div>
                          <span className={`font-mono text-[10px] px-2.5 py-1 rounded-full ${
                            r.verified ? 'bg-[#e3f5ee] text-[#00875a]' : 'bg-[#fef3c7] text-[#b45309]'
                          }`}>{r.verified ? 'Verified' : 'Pending review'}</span>
                        </div>
                        <div className="p-5">
                          {r.dataUrl.startsWith('data:image') ? (
                            <img src={r.dataUrl} alt={r.fileName} className="w-full h-44 object-contain bg-[#f8f9fb] border border-[#e2e6ed] rounded-lg" />
                          ) : (
                            <div className="w-full h-44 flex flex-col items-center justify-center bg-[#f8f9fb] border border-[#e2e6ed] rounded-lg gap-2">
                              <FileText size={28} className="text-[#6b7280]" />
                              <p className="font-mono text-xs text-[#6b7280]">PDF document</p>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-4">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{r.fileName}</p>
                              <p className="font-mono text-[10px] text-[#6b7280]">{new Date(r.uploadedAt).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <a href={r.dataUrl} download={r.fileName}
                                className="flex items-center gap-1 text-xs text-[#6b7280] hover:text-[#0057ff] font-medium">
                                <Download size={12} /> Open
                              </a>
                              {!r.verified && (
                                <button onClick={() => { setReceiptVerified(r.id, true); setReceipts(getReceipts()) }}
                                  className="flex items-center gap-1 text-xs bg-[#00875a] text-white px-3 py-1.5 rounded-lg hover:bg-[#006b48] font-medium">
                                  <Check size={12} /> Verify
                                </button>
                              )}
                              <button onClick={() => { deleteReceipt(r.id); setReceipts(getReceipts()) }}
                                className="flex items-center gap-1 text-xs text-[#dc2626] hover:underline font-medium">
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Blockchain Analysis */}
            {tab === 'analysis' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-[#e8f0ff] border border-[#0057ff]/20 rounded-xl p-4">
                  <Info size={15} className="text-[#0057ff] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[#3d4452] leading-relaxed">Blockchain data shown here is informational analysis only. It is reviewed by investigators manually and never constitutes an automatic guarantee of recovery.</p>
                </div>

                <div className="bg-white border border-[#e2e6ed] rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#e2e6ed] flex items-center justify-between">
                    <p className="font-medium text-sm">Wallet Analysis â€” Sample Address</p>
                    <span className="font-mono text-[10px] text-[#6b7280]">{ANALYSIS_SAMPLE.network}</span>
                  </div>
                  <div className="grid md:grid-cols-3 gap-px bg-[#e2e6ed]">
                    {[
                      { label: 'Address', value: ANALYSIS_SAMPLE.address },
                      { label: 'First Seen', value: ANALYSIS_SAMPLE.firstSeen },
                      { label: 'Last Active', value: ANALYSIS_SAMPLE.lastActive },
                      { label: 'Transactions', value: ANALYSIS_SAMPLE.txCount },
                      { label: 'Inbound', value: ANALYSIS_SAMPLE.inbound },
                      { label: 'Outbound', value: ANALYSIS_SAMPLE.outbound },
                    ].map(s => (
                      <div key={s.label} className="bg-white px-5 py-4">
                        <p className="font-mono text-[10px] text-[#6b7280] uppercase tracking-widest mb-1">{s.label}</p>
                        <p className="font-mono text-xs font-medium break-all">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                  <p className="font-medium text-sm mb-4 flex items-center gap-2"><AlertTriangle size={14} className="text-[#b45309]" /> Risk Indicators</p>
                  {ANALYSIS_SAMPLE.riskIndicators.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-[#e2e6ed] last:border-0">
                      <span className="text-sm text-[#3d4452]">{r.label}</span>
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${
                        r.level === 'CLEAR' ? 'bg-[#e3f5ee] text-[#00875a]' :
                        r.level === 'DETECTED' ? 'bg-[#fef3c7] text-[#b45309]' : 'bg-[#fef2f2] text-[#dc2626]'
                      }`}>{r.level}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-white border border-[#e2e6ed] rounded-xl">
                  <div className="px-5 py-4 border-b border-[#e2e6ed] flex items-center justify-between">
                    <p className="font-medium text-sm">Transaction Timeline</p>
                    <span className="font-mono text-[10px] text-[#6b7280]">4 hops traced</span>
                  </div>
                  {[
                    { t: 'Jul 28, 2026', d: '0.84 BTC â†’ Unknown Mixer', type: 'out' },
                    { t: 'Jul 27, 2026', d: '0.84 BTC â†’ Exchange Deposit', type: 'out' },
                    { t: 'Jul 26, 2026', d: '0.84 BTC â†’ Your Wallet', type: 'in' },
                    { t: 'Jul 25, 2026', d: '0.0021 BTC â†’ Network Fee', type: 'in' },
                  ].map((tx, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-[#e2e6ed] last:border-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${tx.type === 'in' ? 'bg-[#e3f5ee] text-[#00875a]' : 'bg-[#fef2f2] text-[#dc2626]'}`}>
                        <Activity size={12} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[#0f1117]">{tx.d}</p>
                        <p className="font-mono text-[10px] text-[#6b7280]">{tx.t}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics */}
            {tab === 'analytics' && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Cases per month */}
                  <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                    <p className="font-medium text-sm mb-1">Cases per Month</p>
                    <p className="font-mono text-[10px] text-[#6b7280] mb-4">FEB â€” AUG 2026</p>
                    <div className="flex items-end gap-2 h-32">
                      {ANALYTICS.casesPerMonth.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-[#0057ff]/80 rounded-t hover:bg-[#0057ff] transition-colors" style={{ height: `${d.v * 6}px` }} />
                          <span className="font-mono text-[9px] text-[#8b92a5]">{d.m}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Network distribution */}
                  <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                    <p className="font-medium text-sm mb-4">Network Distribution</p>
                    {ANALYTICS.networkDistribution.map(d => (
                      <div key={d.n} className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#3d4452]">{d.n}</span>
                          <span className="font-mono text-[#6b7280]">{d.v}%</span>
                        </div>
                        <div className="h-1.5 bg-[#f1f3f7] rounded-full overflow-hidden">
                          <div className="h-full bg-[#f7931a] rounded-full" style={{ width: `${d.v}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Revenue trend */}
                  <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                    <p className="font-medium text-sm mb-1">Revenue Trend ($K)</p>
                    <p className="font-mono text-[10px] text-[#6b7280] mb-4">FEB â€” AUG 2026</p>
                    <div className="flex items-end gap-2 h-32">
                      {ANALYTICS.revenue.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-gradient-to-t from-[#f7931a] to-[#ffb347] rounded-t" style={{ height: `${d.v * 3}px` }} />
                          <span className="font-mono text-[9px] text-[#8b92a5]">{d.m}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Investigator workload */}
                  <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                    <p className="font-medium text-sm mb-4">Investigator Workload</p>
                    {ANALYTICS.workload.map(d => (
                      <div key={d.n} className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#3d4452]">{d.n}</span>
                          <span className="font-mono text-[#6b7280]">{d.v} active</span>
                        </div>
                        <div className="h-1.5 bg-[#f1f3f7] rounded-full overflow-hidden">
                          <div className="h-full bg-[#0057ff] rounded-full" style={{ width: `${d.v * 6}px` }} />
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="bg-[#f8f9fb] border border-[#e2e6ed] rounded-lg p-3">
                        <p className="font-mono text-[10px] text-[#6b7280] uppercase tracking-widest mb-1">Avg Response</p>
                        <p className="font-mono text-lg font-bold text-[#0f1117]">1.8h</p>
                      </div>
                      <div className="bg-[#f8f9fb] border border-[#e2e6ed] rounded-lg p-3">
                        <p className="font-mono text-[10px] text-[#6b7280] uppercase tracking-widest mb-1">Avg Case Time</p>
                        <p className="font-mono text-lg font-bold text-[#0f1117]">3.2d</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {tab === 'notifications' && (
              <div className="bg-white border border-[#e2e6ed] rounded-xl">
                <div className="px-5 py-4 border-b border-[#e2e6ed] flex items-center justify-between">
                  <p className="font-medium text-sm">Admin Alerts</p>
                  <span className="font-mono text-[10px] text-[#6b7280]">Realtime</span>
                </div>
                <div className="divide-y divide-[#e2e6ed]">
                  {NOTIFICATIONS.map((n, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-[#f8f9fb] transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${n.color}14`, color: n.color }}>
                        <Bell size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{n.type}</p>
                        <p className="text-xs text-[#6b7280]">{n.detail}</p>
                      </div>
                      <span className="font-mono text-xs text-[#6b7280] whitespace-nowrap">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit */}
            {tab === 'audit' && (
              <div className="space-y-4">
                <div className="bg-white border border-[#e2e6ed] rounded-xl">
                  <div className="px-5 py-4 border-b border-[#e2e6ed]">
                    <p className="font-medium text-sm">Audit Log</p>
                    <p className="text-xs text-[#6b7280] mt-0.5">Every admin action is logged with user, role, IP, and device.</p>
                  </div>
                  <div className="divide-y divide-[#e2e6ed]">
                    {AUDIT.map((a, i) => (
                      <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-[#f8f9fb] transition-colors">
                        <div className="w-8 h-8 bg-[#f1f3f7] rounded-lg flex items-center justify-center flex-shrink-0">
                          <Activity size={13} className="text-[#6b7280]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{a.action}</p>
                          <p className="font-mono text-xs text-[#6b7280]">{a.user} Â· {a.role} Â· {a.device}</p>
                        </div>
                        <span className="font-mono text-xs text-[#6b7280] whitespace-nowrap">{a.ip}</span>
                        <span className="font-mono text-xs text-[#6b7280] whitespace-nowrap">{a.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                    <p className="font-medium text-sm mb-4 flex items-center gap-2"><Fingerprint size={14} className="text-[#0057ff]" /> Login History</p>
                    {[
                      { d: 'Aug 6, 2026 Â· 09:41', ip: '192.168.1.1', ok: true },
                      { d: 'Aug 5, 2026 Â· 18:02', ip: '192.168.1.1', ok: true },
                      { d: 'Aug 4, 2026 Â· 22:17', ip: '10.0.0.3', ok: false },
                    ].map((l, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-[#e2e6ed] last:border-0">
                        <span className="font-mono text-xs text-[#3d4452]">{l.d}</span>
                        <span className="font-mono text-xs text-[#6b7280]">{l.ip}</span>
                        <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${l.ok ? 'bg-[#e3f5ee] text-[#00875a]' : 'bg-[#fef2f2] text-[#dc2626]'}`}>{l.ok ? 'Authorized' : 'Blocked'}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                    <p className="font-medium text-sm mb-4 flex items-center gap-2"><KeyRound size={14} className="text-[#0057ff]" /> Security Controls</p>
                    {[
                      { label: 'Multi-factor authentication', v: 'Enabled' },
                      { label: 'Password reset policy', v: '90 days' },
                      { label: 'Session timeout', v: '15 min' },
                      { label: 'CSRF protection', v: 'Active' },
                      { label: 'Rate limiting', v: '5 req/min' },
                      { label: 'Client data encryption', v: 'AES-256' },
                      { label: 'Secure file storage', v: 'Encrypted' },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#e2e6ed] last:border-0">
                        <span className="text-xs text-[#3d4452]">{s.label}</span>
                        <span className="font-mono text-[10px] bg-[#e3f5ee] text-[#00875a] px-2 py-0.5 rounded-full">{s.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Client Sign-ins */}
            {tab === 'clients' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-lg">Client Sign-ins</h2>
                    <p className="text-sm text-[#3d4452]">Emails of everyone who signed in to the client portal.</p>
                  </div>
                  <span className="font-mono text-xs bg-[#0057ff]/10 text-[#0057ff] px-2.5 py-1 rounded-full">{clients.length} client{clients.length === 1 ? '' : 's'}</span>
                </div>

                <div className="bg-white border border-[#e2e6ed] rounded-xl overflow-hidden">
                  {clients.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-14 h-14 rounded-full bg-[#e8f0ff] flex items-center justify-center mx-auto mb-4">
                        <Users size={22} className="text-[#0057ff]" />
                      </div>
                      <h3 className="font-semibold text-lg mb-1">No client sign-ins yet</h3>
                      <p className="text-sm text-[#3d4452] max-w-sm mx-auto">When a client signs in to the portal, their email is recorded here.</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#e2e6ed] bg-[#f8f9fb]">
                          {['Client', 'Email', 'Last Sign-in'].map(h => (
                            <th key={h} className="px-5 py-3 text-left font-mono text-[10px] text-[#6b7280] uppercase tracking-widest">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {clients.map(c => (
                          <tr key={c.email} className="border-b border-[#e2e6ed] last:border-0 hover:bg-[#f8f9fb] transition-colors">
                            <td className="px-5 py-3.5 font-medium">{c.name}</td>
                            <td className="px-5 py-3.5 font-mono text-xs text-[#0057ff]">{c.email}</td>
                            <td className="px-5 py-3.5 font-mono text-xs text-[#6b7280]">{c.lastSignIn}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

