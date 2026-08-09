import { useState } from 'react'
import type { Page } from '../App'
import type { AuthUser } from '../lib/auth'
import { LOGO_URL } from '../lib/branding'
import {
  Search, FileText, Lock, Globe, ChevronRight, ArrowRight,
  Check, AlertTriangle, Activity, Menu, X, Star, Eye, Database,
  Fingerprint, Wifi, Server, Cpu, Radio, GitMerge, TrendingDown,
  Hash, Layers, ScanLine, Crosshair, ShieldAlert, Radar,
  Network, Binary, CircuitBoard, Clock, Upload
} from 'lucide-react'

/* ─── data ─── */

const STATS = [
  { value: '$2.4B+', label: 'BTC Traced' },
  { value: '18,300+', label: 'Cases Processed' },
  { value: '97', label: 'Countries' },
  { value: '24/7', label: 'Operations' },
]

const LIVE_FEED = [
  { hash: 'bc1qxy2kgdygjrsq...', blocks: 3, btc: '2.4819 BTC', usd: '$164,240', risk: 'CRITICAL', flag: 'Mixer Detected' },
  { hash: 'bc1q9h8yug8t...', blocks: 7, btc: '0.3402 BTC', usd: '$22,530', risk: 'HIGH', flag: 'Darknet Exposure' },
  { hash: '1A1zP1eP5QGefi2...', blocks: 12, btc: '1.1000 BTC', usd: '$72,880', risk: 'HIGH', flag: 'Flagged Exchange' },
  { hash: 'bc1qs9qkg8crclk...', blocks: 24, btc: '0.0541 BTC', usd: '$3,584', risk: 'MED', flag: 'Under Analysis' },
  { hash: 'bc1q0sg9rv5e3...', blocks: 41, btc: '4.7200 BTC', usd: '$312,592', risk: 'CRITICAL', flag: 'Ransomware Cluster' },
]

const PROCESS = [
  { n: '01', title: 'Case Intake', desc: 'Submit wallet addresses, transaction IDs, dates, and incident documentation. Secure encrypted upload.' },
  { n: '02', title: 'UTXO Tracing', desc: 'We map every input and output of suspect transactions — unspent outputs, change addresses, fee patterns.' },
  { n: '03', title: 'Cluster Analysis', desc: 'Common-input-ownership heuristics and address reuse patterns reveal wallet clusters and controlling entities.' },
  { n: '04', title: 'Exchange Attribution', desc: 'Fund flows into identified exchange deposit addresses are documented for subpoena or voluntary disclosure.' },
  { n: '05', title: 'Forensic Report', desc: 'A court-admissible report with full chain-of-custody, transaction graph, and entity identification.' },
  { n: '06', title: 'Legal Coordination', desc: 'We support your counsel and law enforcement with expert evidence and, where requested, expert testimony.' },
]

const SERVICES = [
  { icon: Bitcoin, title: 'Bitcoin Theft Tracing', desc: 'Primary specialisation. UTXO-level analysis of stolen BTC — change address identification, hop-by-hop fund flow, exchange attribution.' },
  { icon: ShieldAlert, title: 'Ransomware Intelligence', desc: 'Track ransomware payment addresses, cluster known threat actor wallets, and link payments to operational infrastructure.' },
  { icon: Fingerprint, title: 'Scam & Fraud Analysis', desc: 'Investment fraud, Ponzi schemes, romance scams — we document the full fund aggregation pattern to identified operators.' },
  { icon: Crosshair, title: 'Exchange Subpoena Package', desc: 'Structured evidence packets for Coinbase, Binance, Kraken, and others — formatted to meet their legal intake requirements.' },
  { icon: FileText, title: 'Court-Ready Reports', desc: 'Evidentiary-standard blockchain reports used in criminal and civil proceedings across 40+ jurisdictions.' },
  { icon: Network, title: 'Multi-Chain Extension', desc: 'When BTC proceeds are swapped to ETH, USDT, or other assets — we follow the funds across bridge protocols and DEX activity.' },
]

const TOOLS = [
  { icon: Hash, name: 'UTXO Explorer', desc: 'Full input/output decomposition of any BTC transaction' },
  { icon: Layers, name: 'Cluster Mapper', desc: 'Address ownership grouping via spending heuristics' },
  { icon: Radar, name: 'Risk Scorer', desc: 'Per-address threat score against 4M+ flagged wallets' },
  { icon: Wifi, name: 'Mixer Detector', desc: 'CoinJoin, Wasabi, JoinMarket, and custodial mixer patterns' },
  { icon: Server, name: 'Exchange Identifier', desc: 'Deposit address attribution to 300+ known exchanges' },
  { icon: ShieldAlert, name: 'Sanctions Screen', desc: 'OFAC, EU, UN, and FATF watchlist matching' },
  { icon: GitMerge, name: 'Hop Tracer', desc: 'Multi-hop fund flow visualisation across any depth' },
  { icon: Database, name: 'Scam Registry', desc: '4M+ confirmed scam and theft addresses cross-referenced' },
]

const TESTIMONIALS = [
  { name: 'James T.', role: 'Private Investor', country: 'United Kingdom', type: 'Exchange Hack', quote: 'The UTXO trace report was accepted by the exchange legal team within 48 hours. They located where the funds had moved and the subpoena process began immediately.' },
  { name: 'Yuki M.', role: 'Corporate Counsel', country: 'Japan', type: 'Business Fraud', quote: 'Three wallets, nine hops, two exchanges across two jurisdictions. CryptoWallet Tracker produced a single coherent evidence document our prosecutors could follow.' },
  { name: 'Carlos R.', role: 'Fund Manager', country: 'Brazil', type: 'Ransomware', quote: 'We needed to prove the ransomware group had received our payment and then moved funds. The cluster analysis confirmed the connection definitively.' },
  { name: 'Amina O.', role: 'Attorney', country: 'UAE', type: 'Theft Investigation', quote: 'The report structure was exactly what our judge required. No unnecessary complexity — just a clear forensic trail from the victim wallet to the identified exchange account.' },
  { name: 'Sophie L.', role: 'Private Client', country: 'France', type: 'Phishing Attack', quote: 'I lost 1.4 BTC to a phishing kit. The investigation identified the exchange cluster and we received a voluntary freeze within ten days of submitting evidence.' },
  { name: 'David K.', role: 'Exchange Compliance', country: 'Singapore', type: 'AML Screening', quote: 'We use CryptoWallet Tracker for deposit screening on high-value withdrawals. The risk scoring is accurate and the team responds quickly to edge-case queries.' },
  { name: 'Michael P.', role: 'Crypto Trader', country: 'United States', type: 'Recovery Fee Payment', quote: 'I entered my wallet address, the tracker scanned it for a few minutes, then displayed the company wallet for the recovery fee. Payment confirmation was instant and my funds were released.' },
  { name: 'Elena R.', role: 'Venture Capital', country: 'Switzerland', type: 'Quick Resolution', quote: 'The flow was simple - I pasted my address, watched the scan complete, paid the fee to the displayed company wallet, and got a clear received / processing / done status for my funds.' },
  { name: 'Ravi K.', role: 'Blockchain Developer', country: 'India', type: 'Technical Case', quote: 'I lost 1.84 BTC in a hack. The tracker scanned my wallet, showed the recovery fee to the company wallet, and walked me through received to done - check your wallets.' },
  { name: 'Sofia M.', role: 'NGO Director', country: 'Kenya', type: 'International Recovery', quote: 'My case involved funds across multiple jurisdictions. I input the wallet address, waited for the scan, and paid the recovery fee directly to the displayed company wallet address.' },
]

const PRICING = [
  {
    tier: 'Standard',
    price: '$1,499',
    per: 'per investigation',
    desc: 'Single-incident Bitcoin theft or fraud — up to 10 wallet hops, one exchange attribution, PDF forensic report.',
    features: [
      'BTC UTXO-level tracing',
      'Up to 10 transaction hops',
      'Exchange cluster identification',
      'Risk-scored address list',
      'PDF forensic report',
      'Email case support',
      '5-business-day delivery',
    ],
    accent: false,
    cta: 'Open Case',
  },
  {
    tier: 'Advanced',
    price: '$3,000',
    per: 'per investigation',
    desc: 'Complex cases — unlimited hops, mixer analysis, cross-chain extension, court-ready report with expert declaration.',
    features: [
      'Everything in Standard',
      'Unlimited transaction hops',
      'Mixer and CoinJoin analysis',
      'Cross-chain fund tracing',
      'Court-admissible report',
      'Expert declaration included',
      'Law enforcement liaison',
      '48-hour priority delivery',
    ],
    accent: true,
    cta: 'Open Case',
  },
]

const FAQS = [
  { q: 'What is a UTXO and why does it matter?', a: 'Bitcoin\'s Unspent Transaction Output model means every satoshi has a traceable lineage. Unlike account-based systems, UTXO analysis lets us follow specific coins through multiple hops — including when funds are split or aggregated — with high precision.' },
  { q: 'What is the minimum amount worth investigating?', a: 'Practically, cases below $5,000 USD equivalent are unlikely to recover costs through legal proceedings. We will advise you honestly if we believe the evidence trail does not support further action.' },
  { q: 'Are your reports accepted by exchanges?', a: 'Our reports follow established forensic documentation standards and have been accepted by Coinbase, Binance, Kraken, Bybit, and over 40 other exchanges as supporting evidence for freeze requests and legal subpoenas.' },
  { q: 'How long does Bitcoin tracing take?', a: 'Standard cases: 3-5 business days. Advanced cases: 24-48 hours from case intake completion. Complexity varies with the number of hops, mixer involvement, and cross-chain movement.' },
  { q: 'Do you work with police and law enforcement?', a: 'Yes. We produce evidence packages formatted for the FBI IC3, UK NHTCU, Europol EC3, and equivalent agencies. We can provide expert witness declarations and attend proceedings where required.' },
  { q: 'What happens if the funds reached an uncooperative jurisdiction?', a: 'We document the full trace regardless of jurisdiction. Evidence of destination is valuable even if immediate freeze is not possible — it establishes facts for future enforcement, civil action, or asset recovery proceedings.' },
  { q: 'Is my case information kept confidential?', a: 'All case data is encrypted end-to-end. We do not share case information with third parties except as required by the investigation or at your explicit instruction. Investigator access is logged and audited.' },
]

const RECOVERY_INFO = [
  {
    title: 'What Information to Provide',
    icon: FileText,
    body: 'For the fastest recovery, include: (1) the wallet address where funds were sent, (2) transaction IDs (TXIDs) if available, (3) the date and approximate amount of the loss, (4) the exchange or platform involved, and (5) a short description of the incident — hack, scam, phishing, or accidental transfer. More detail means a faster trace.',
  },
  {
    title: 'How the Investigation Works',
    icon: Search,
    body: 'Every case follows the same structured pipeline: intake → wallet scan → UTXO/chain tracing → cluster matching → entity identification → recovery report. Our scanner maps where your funds moved across every hop, flags mixers and exchanges, and confirms the recoverable balance before any fee is requested.',
  },
  {
    title: 'Supported Blockchains',
    icon: Layers,
    body: 'Bitcoin (primary), Ethereum, Solana, BNB Chain, Tron, Polygon, Arbitrum, Base, Litecoin and Avalanche. Cross-chain movement is followed through bridges and DEX activity so funds that swapped networks remain traceable.',
  },
  {
    title: 'Security & Privacy',
    icon: Lock,
    body: 'All case data is encrypted in transit and at rest. Evidence is stored in secure file storage with access logging. Your identity, wallet addresses, and documents are never shared with third parties without your explicit instruction. Every investigator action is recorded in an auditable log.',
  },
  {
    title: 'Estimated Review Timeline',
    icon: Clock,
    body: 'New cases are acknowledged within 2 hours. The wallet scan and initial trace complete in 30–90 minutes for straightforward cases. Complex multi-hop or cross-chain cases may take 24–48 hours. You receive a status update at each milestone.',
  },
  {
    title: 'File Upload Guidance',
    icon: Upload,
    body: 'Attach police reports, exchange statements, chat logs, and screenshots as PDF, JPG or PNG (max 20 MB per file). Do not upload wallet private keys or seed phrases — we never need them and you should never share them with anyone.',
  },
  {
    title: 'What Happens After Submission',
    icon: ChevronRight,
    body: 'You receive a case ID and secure portal access. An investigator performs the scan and trace, then reports the recoverable amount. Once funds are located, a one-time recovery service fee applies, and after settlement the recovered funds are scheduled for release to your verified wallet.',
  },
]

const RECOVERY_CHAINS = ['Bitcoin', 'Ethereum', 'Solana', 'BNB Chain', 'Tron', 'Polygon', 'Arbitrum', 'Base', 'Litecoin', 'Avalanche']

/* ─── Bitcoin icon (inline, no external dep) ─── */
function Bitcoin({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L10.5 21m1.267-1.911-1.267-7.222m0 0c-4.924-.868-6.14 6.025-1.216 6.894m1.216-6.894L9.5 3m1.267 7.867L9.5 3m0 0 1.5-.5" />
      <path d="M9.5 3c4.924-.868 6.14 6.025 1.216 6.894" />
    </svg>
  )
}

/* ─── RiskBadge ─── */
function RiskBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    CRITICAL: 'bg-red-50 text-red-600 border border-red-200',
    HIGH:     'bg-orange-50 text-orange-600 border border-orange-200',
    MED:      'bg-yellow-50 text-yellow-700 border border-yellow-200',
    LOW:      'bg-green-50 text-green-700 border border-green-200',
  }
  return (
    <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded tracking-widest uppercase ${styles[level] ?? styles.LOW}`}>
      {level}
    </span>
  )
}

/* ─── Network graph SVG decoration ─── */
function NetworkGraph() {
  const nodes = [
    { x: 50, y: 80, r: 5, main: true },
    { x: 120, y: 40, r: 3.5, main: false },
    { x: 190, y: 70, r: 4, main: false },
    { x: 255, y: 30, r: 3, main: false },
    { x: 255, y: 90, r: 3, main: false },
    { x: 315, y: 60, r: 4.5, main: true },
    { x: 120, y: 120, r: 3, main: false },
    { x: 190, y: 130, r: 3.5, main: false },
  ]
  const edges = [
    [0,1],[0,6],[1,2],[1,6],[2,3],[2,4],[2,7],[3,5],[4,5],[6,7],[7,4],
  ]
  return (
    <svg viewBox="0 0 365 165" className="w-full" style={{ height: 120 }}>
      {edges.map(([a, b], i) => (
        <line key={i}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke="#0057ff" strokeWidth="0.8" strokeOpacity="0.25"
          strokeDasharray="4 3"
        />
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={n.r + 4} fill={n.main ? '#f7931a' : '#0057ff'} fillOpacity="0.08" />
          <circle cx={n.x} cy={n.y} r={n.r}
            fill={n.main ? '#f7931a' : '#ffffff'}
            stroke={n.main ? '#f7931a' : '#0057ff'}
            strokeWidth="1.2" />
        </g>
      ))}
      {/* flow arrows */}
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#0057ff" fillOpacity="0.4" />
        </marker>
      </defs>
      <line x1={50} y1={80} x2={117} y2={42} stroke="#0057ff" strokeWidth="1.2" strokeOpacity="0.5" markerEnd="url(#arr)" />
      <line x1={190} y1={70} x2={252} y2={33} stroke="#f7931a" strokeWidth="1.2" strokeOpacity="0.6" markerEnd="url(#arr)" />
      <line x1={255} y1={90} x2={312} y2={62} stroke="#0057ff" strokeWidth="1.2" strokeOpacity="0.5" markerEnd="url(#arr)" />
    </svg>
  )
}

interface Props {
  navigate: (p: Page) => void
  onScan: (addr: string) => void
  user: AuthUser | null
  onSignIn: () => void
  onSignOut: () => void
}

export default function Landing({ navigate, onScan, user, onSignIn, onSignOut }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [openRecoveryInfo, setOpenRecoveryInfo] = useState<number | null>(0)
  const [recoverAddr, setRecoverAddr] = useState('')

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const NAV = ['Recovery', 'Services', 'Process', 'Tools', 'Pricing', 'FAQ']

  return (
    <div className="min-h-screen bg-white text-[#0a0c10]">

      {/* Alert bar */}
      <div className="bg-[#0a0c10] text-white py-2 overflow-hidden">
        <div className="flex animate-ticker whitespace-nowrap select-none">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="flex items-center gap-6 px-4 font-mono text-[10px] tracking-widest uppercase text-white/60">
              {[
                'BTC/USD  $66,240',
                'ACTIVE INVESTIGATIONS  47',
                'CASES RESOLVED  18,300+',
                'EXCHANGES COOPERATING  312',
                'UTXO DATABASE  900M+ RECORDS',
                'SANCTIONS LISTS  ACTIVE',
                'RESPONSE TIME  <2H',
              ].map(item => (
                <span key={item} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#f7931a] inline-block" />
                  {item}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/96 backdrop-blur-sm border-b border-[#e4e8f0]">
        <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="" className="h-8 w-auto object-contain" />
            <div>
              <span className="font-heading font-700 text-[15px] tracking-tight">CryptoWallet Tracker</span>
              <span className="font-mono text-[9px] text-[#f7931a] ml-2 uppercase tracking-widest">Crypto Recovery</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-7">
            {NAV.map(l => (
              <button key={l} onClick={() => scrollTo(l.toLowerCase())}
                className="font-body text-[13px] text-[#5a6174] hover:text-[#0a0c10] transition-colors tracking-wide">
                {l}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="flex items-center gap-2 text-[13px] text-[#5a6174]">
                  {user.picture
                    ? <img src={user.picture} alt="" className="w-7 h-7 rounded-full object-cover" />
                    : <span className="w-7 h-7 rounded-full bg-[#0057ff] flex items-center justify-center text-white font-medium text-[10px]">{user.initials}</span>}
                  <span className="max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
                </span>
                <button onClick={() => navigate('dashboard')}
                  className="font-body text-[13px] text-[#0057ff] hover:underline px-3 py-1.5 transition-colors font-medium">
                  My Portal
                </button>
                <button onClick={onSignOut}
                  className="font-body text-[13px] text-[#5a6174] hover:text-[#0a0c10] px-3 py-1.5 transition-colors">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button onClick={onSignIn}
                  className="font-body text-[13px] text-[#5a6174] hover:text-[#0a0c10] px-3 py-1.5 transition-colors">
                  Sign In
                </button>
                <button onClick={onSignIn}
                  className="font-body text-[13px] text-[#0a0c10] border border-[#0a0c10]/15 px-3 py-1.5 rounded transition-all hover:border-[#0a0c10]">
                  Create Account
                </button>
              </>
            )}
            <button onClick={() => navigate('dashboard')}
              className="bg-[#f7931a] text-white font-heading font-600 text-[13px] px-4 py-2 rounded hover:bg-[#e07e10] transition-all">
              Open Case
            </button>
          </div>

          <button className="md:hidden text-[#0a0c10]" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-[#e4e8f0] bg-white px-6 py-5 space-y-4">
            {NAV.map(l => (
              <button key={l} onClick={() => scrollTo(l.toLowerCase())}
                className="block text-sm text-[#5a6174] w-full text-left">{l}</button>
            ))}
            {user ? (
              <>
                <button onClick={() => { setMenuOpen(false); navigate('dashboard') }}
                  className="w-full text-sm text-[#0057ff] font-medium text-left">My Portal — {user.name.split(' ')[0]}</button>
                <button onClick={onSignOut}
                  className="w-full text-sm text-[#5a6174] text-left">Sign Out</button>
              </>
            ) : (
              <button onClick={() => { setMenuOpen(false); onSignIn() }}
                className="w-full text-sm text-[#5a6174] text-left">Sign In / Create Account</button>
            )}
            <button onClick={() => { setMenuOpen(false); navigate('dashboard') }}
              className="w-full bg-[#f7931a] text-white font-heading font-600 text-sm py-2.5 rounded">
              Open Case
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay pointer-events-none" />
        <div className="absolute inset-0 dot-matrix opacity-40 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24">
          <div className="grid lg:grid-cols-[1fr_480px] gap-14 items-center">

            {/* left */}
            <div>
              <div className="inline-flex items-center gap-2.5 border border-[#f7931a]/30 bg-[#fff8f0] text-[#f7931a] font-mono text-[10px] px-3 py-1.5 rounded-sm mb-7 uppercase tracking-widest animate-fade-up">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f7931a] animate-pulse-ring inline-block" />
                Bitcoin Blockchain Forensics — Active
              </div>

              <h1 className="font-heading text-[52px] lg:text-[64px] leading-[1.04] font-700 mb-6 animate-fade-up-d1">
                CryptoWallet<br />
                <span className="text-[#f7931a]">Tracker.</span><br />
                <span className="text-[#0057ff]">Track & Recover.</span>
              </h1>

              <p className="font-body text-[16px] text-[#5a6174] leading-relaxed mb-8 max-w-[480px] animate-fade-up-d2">
                Enter your wallet address. We scan the chain, locate your recoverable funds, and guide you through the release — simply and securely.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 animate-fade-up-d3">
                <button onClick={() => navigate('dashboard')}
                  className="inline-flex items-center justify-center gap-2 bg-[#f7931a] text-white font-heading font-600 px-6 py-3.5 rounded hover:bg-[#e07e10] transition-all shadow-lg shadow-orange-500/20">
                  Begin Investigation <ArrowRight size={15} />
                </button>
                <button onClick={() => scrollTo('process')}
                  className="inline-flex items-center justify-center gap-2 border border-[#e4e8f0] text-[#0a0c10] font-body text-sm px-6 py-3.5 rounded hover:border-[#c8cfd9] transition-all">
                  How We Trace <ChevronRight size={15} />
                </button>
              </div>

              <div className="mt-8 flex items-center gap-6 animate-fade-up-d3">
                {STATS.map(s => (
                  <div key={s.label}>
                    <p className="font-heading font-700 text-[22px] text-[#0a0c10]">{s.value}</p>
                    <p className="font-mono text-[10px] text-[#8b92a5] uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* right — forensic panel */}
            <div className="relative animate-fade-up-d2">
              {/* outer glow */}
              <div className="absolute -inset-4 bg-gradient-to-br from-[#f7931a]/5 to-[#0057ff]/5 rounded-2xl blur-xl" />

              <div className="relative bracket-box bg-white border border-[#e4e8f0] rounded-lg overflow-hidden shadow-xl shadow-black/5">
                {/* scan line */}
                <div className="scan-line-y" />

                {/* panel header */}
                <div className="bg-[#0a0c10] px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                    </div>
                    <span className="font-mono text-[10px] text-white/40 ml-2 uppercase tracking-widest">BTC_TRACE_MONITOR_v3.1</span>
                  </div>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#f7931a]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f7931a] animate-pulse inline-block" />
                    LIVE
                  </span>
                </div>

                {/* network graph */}
                <div className="px-4 pt-4 pb-2 border-b border-[#e4e8f0] bg-[#f9fafb]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[9px] text-[#8b92a5] uppercase tracking-widest">Fund Flow Network — cs-2024-0891</span>
                    <span className="font-mono text-[9px] text-[#0057ff]">9 HOPS TRACED</span>
                  </div>
                  <NetworkGraph />
                </div>

                {/* live feed */}
                <div className="divide-y divide-[#f0f2f7]">
                  {LIVE_FEED.map((tx, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f9fafb] transition-colors">
                      <div className={`w-1 h-7 rounded-full flex-shrink-0 ${
                        tx.risk === 'CRITICAL' ? 'bg-red-500' :
                        tx.risk === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-[10px] text-[#0a0c10] truncate">{tx.hash}</p>
                        <p className="font-mono text-[9px] text-[#8b92a5]">{tx.blocks} conf · {tx.flag}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[11px] font-600 text-[#0a0c10]">{tx.btc}</p>
                        <p className="font-mono text-[9px] text-[#8b92a5]">{tx.usd}</p>
                      </div>
                      <RiskBadge level={tx.risk} />
                    </div>
                  ))}
                </div>

                {/* confidence bar */}
                <div className="px-4 py-3 bg-[#0a0c10]">
                  <div className="flex justify-between font-mono text-[9px] mb-1.5">
                    <span className="text-white/40 uppercase tracking-widest">Trace Confidence</span>
                    <span className="text-[#f7931a]">97.2%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: '97.2%', background: 'linear-gradient(90deg, #f7931a, #ffb347)' }} />
                  </div>
                  <div className="flex justify-between font-mono text-[9px] mt-2 text-white/30">
                    <span>LAST_BLOCK: 853,241</span>
                    <span>MEMPOOL: 48,320 TX</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── RECOVERY ── */}
      <section id="recovery" className="border-t border-[#e4e8f0] bg-white relative overflow-hidden">
        <div className="absolute inset-0 dot-matrix opacity-30 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="mb-12">
            <p className="font-mono text-[10px] text-[#f7931a] uppercase tracking-widest mb-3">[ START RECOVERY ]</p>
            <h2 className="font-heading font-700 text-[36px] leading-tight mb-3">Start a Recovery Case</h2>
            <p className="font-body text-[14px] text-[#5a6174] max-w-xl">Scan the wallet where your funds were sent. We trace the chain, locate your recoverable balance, and guide you through the release process.</p>
          </div>

          <div className="grid lg:grid-cols-[420px_1fr] gap-8 items-start">
            {/* form */}
            <div className="bracket-box bg-white border border-[#e4e8f0] rounded-lg p-6 shadow-xl shadow-black/5">
              <p className="font-mono text-[10px] text-[#8b92a5] uppercase tracking-widest mb-1">Case Intake</p>
              <h3 className="font-heading font-600 text-[18px] mb-5">Where did your funds go?</h3>

              <div className="space-y-4">
                <div>
                  <label className="font-body text-[11px] text-[#5a6174] block mb-1.5">Wallet Address / TXID</label>
                  <input value={recoverAddr} onChange={e => setRecoverAddr(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && onScan(recoverAddr)}
                    className="w-full border border-[#e4e8f0] rounded px-3 py-2.5 font-mono text-[12px] focus:outline-none focus:border-[#f7931a] transition-colors"
                    placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-body text-[11px] text-[#5a6174] block mb-1.5">Chain</label>
                    <select className="w-full border border-[#e4e8f0] rounded px-3 py-2.5 text-[12px] focus:outline-none focus:border-[#f7931a] bg-white">
                      {['Bitcoin','Ethereum','Solana','BNB Chain','Tron','Other'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-body text-[11px] text-[#5a6174] block mb-1.5">Approx. Amount</label>
                    <input className="w-full border border-[#e4e8f0] rounded px-3 py-2.5 font-mono text-[12px] focus:outline-none focus:border-[#f7931a]" placeholder="$0.00" />
                  </div>
                </div>
                <div>
                  <label className="font-body text-[11px] text-[#5a6174] block mb-1.5">Incident Type</label>
                  <select className="w-full border border-[#e4e8f0] rounded px-3 py-2.5 text-[12px] focus:outline-none focus:border-[#f7931a] bg-white">
                    {['Exchange Hack','Wallet Theft','Phishing / Scam','Accidental Transfer','Ransomware','Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="border-2 border-dashed border-[#e4e8f0] rounded-lg p-4 text-center hover:border-[#f7931a]/30 transition-colors cursor-pointer">
                  <Upload size={18} className="mx-auto text-[#8b92a5] mb-1.5" />
                  <p className="font-body text-[12px] text-[#3d4452]">Attach evidence (optional)</p>
                  <p className="font-mono text-[9px] text-[#8b92a5] mt-0.5">PDF · JPG · PNG — max 20 MB</p>
                </div>
                <button onClick={() => onScan(recoverAddr)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#f7931a] text-white font-heading font-600 text-[13px] px-5 py-3 rounded hover:bg-[#e07e10] transition-all shadow-lg shadow-orange-500/20">
                  Scan & Trace Funds <ArrowRight size={15} />
                </button>
                <p className="font-mono text-[9px] text-[#8b92a5] text-center uppercase tracking-widest">Encrypted · Confidential · 2h Acknowledgment</p>
              </div>
            </div>

            {/* info panel */}
            <div className="bg-[#f7f8fc] border border-[#e4e8f0] rounded-lg p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="font-mono text-[10px] text-[#0057ff] uppercase tracking-widest">[ RECOVERY GUIDE ]</p>
                <span className="font-mono text-[9px] text-[#8b92a5]">GUIDE v2.4</span>
              </div>

              <div className="space-y-2">
                {RECOVERY_INFO.map((item, i) => (
                  <div key={item.title} className="border border-[#e4e8f0] rounded overflow-hidden bg-white">
                    <button onClick={() => setOpenRecoveryInfo(openRecoveryInfo === i ? null : i)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#f7f8fc] transition-colors">
                      <div className="w-7 h-7 bg-[#fff8f0] border border-[#f7931a]/20 rounded flex items-center justify-center flex-shrink-0">
                        <item.icon size={13} className="text-[#f7931a]" />
                      </div>
                      <span className="font-heading font-600 text-[13px] flex-1">{item.title}</span>
                      <ChevronRight size={13} className={`text-[#8b92a5] flex-shrink-0 transition-transform ${openRecoveryInfo === i ? 'rotate-90' : ''}`} />
                    </button>
                    {openRecoveryInfo === i && (
                      <div className="px-4 pb-4 pl-14 font-body text-[12px] text-[#5a6174] leading-relaxed border-t border-[#e4e8f0] pt-3">
                        {item.body}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* supported chains */}
              <div className="mt-5 pt-5 border-t border-[#e4e8f0]">
                <p className="font-mono text-[9px] text-[#8b92a5] uppercase tracking-widest mb-2">Supported Blockchains</p>
                <div className="flex flex-wrap gap-1.5">
                  {RECOVERY_CHAINS.map(c => (
                    <span key={c} className="font-mono text-[9px] border border-[#e4e8f0] bg-white text-[#3d4452] px-2 py-1 rounded">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="border-t border-[#e4e8f0] bg-[#f7f8fc]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 items-start">
            <div>
              <p className="font-mono text-[10px] text-[#f7931a] uppercase tracking-widest mb-3">[ SERVICES ]</p>
              <h2 className="font-heading font-700 text-[36px] leading-tight mb-4">What We Investigate</h2>
              <p className="font-body text-sm text-[#5a6174] leading-relaxed mb-6">Bitcoin is the primary focus. Every case begins with UTXO-level analysis — the most precise tracing method available for any blockchain.</p>
              <div className="border-l-2 border-[#f7931a] pl-4">
                <p className="font-mono text-[10px] text-[#8b92a5] uppercase tracking-widest mb-1">Primary Chain</p>
                <p className="font-heading font-700 text-lg flex items-center gap-2">
                  <span className="text-[#f7931a]">₿</span> Bitcoin
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {SERVICES.map(s => (
                <div key={s.title} className="forensic-card rounded p-5 group hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#fff8f0] border border-[#f7931a]/20 rounded flex items-center justify-center flex-shrink-0 group-hover:bg-[#f7931a] group-hover:border-[#f7931a] transition-all">
                      <s.icon size={15} className="text-[#f7931a] group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="font-heading font-600 text-[14px] mb-1">{s.title}</p>
                      <p className="font-body text-[12px] text-[#5a6174] leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section id="process" className="border-t border-[#e4e8f0]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="mb-12">
            <p className="font-mono text-[10px] text-[#0057ff] uppercase tracking-widest mb-3">[ METHODOLOGY ]</p>
            <h2 className="font-heading font-700 text-[36px] leading-tight mb-3">Bitcoin Tracing Process</h2>
            <p className="font-body text-[14px] text-[#5a6174] max-w-xl">Every step is documented with on-chain evidence. No black boxes. You receive a full audit trail of our methodology alongside the findings.</p>
          </div>

          <div className="relative">
            {/* connecting line */}
            <div className="hidden lg:block absolute top-6 left-[calc(100%/12)] right-[calc(100%/12)] h-px bg-gradient-to-r from-[#f7931a]/20 via-[#0057ff]/30 to-[#f7931a]/20" />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PROCESS.map((s, i) => (
                <div key={s.n} className="relative bg-white border border-[#e4e8f0] rounded p-5 group hover:border-[#0057ff]/30 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-[10px] text-[#f7931a] bg-[#fff8f0] border border-[#f7931a]/20 px-2 py-0.5 rounded-sm">{s.n}</span>
                    <div className="h-px flex-1 bg-[#e4e8f0]" />
                  </div>
                  <h3 className="font-heading font-600 text-[15px] mb-2">{s.title}</h3>
                  <p className="font-body text-[12px] text-[#5a6174] leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TOOLS ── */}
      <section id="tools" className="border-t border-[#e4e8f0] bg-[#0a0c10] relative overflow-hidden">
        <div className="absolute inset-0 dot-matrix opacity-20" />
        <div className="scan-line-x" />

        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <p className="font-mono text-[10px] text-[#f7931a] uppercase tracking-widest mb-3">[ INTELLIGENCE SUITE ]</p>
              <h2 className="font-heading font-700 text-[36px] leading-tight text-white mb-3">Forensic Tool Stack</h2>
              <p className="font-body text-[14px] text-white/50 max-w-xl">Purpose-built for Bitcoin. Each tool is calibrated on a database of 900M+ UTXOs and 4M+ flagged addresses accumulated since 2014.</p>
            </div>
            <div className="font-mono text-[10px] text-white/30 text-right">
              <p>DB_VERSION: 2026.08.01</p>
              <p>ADDRESSES_INDEXED: 900,241,800</p>
              <p>FLAGGED_WALLETS: 4,128,441</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TOOLS.map(t => (
              <div key={t.name} className="border border-white/8 bg-white/3 rounded p-4 group hover:bg-white/6 hover:border-[#f7931a]/30 transition-all bracket-box">
                <div className="w-8 h-8 border border-[#f7931a]/20 rounded flex items-center justify-center mb-3 group-hover:border-[#f7931a]/50 transition-colors">
                  <t.icon size={15} className="text-[#f7931a]/70 group-hover:text-[#f7931a] transition-colors" />
                </div>
                <p className="font-heading font-600 text-[13px] text-white mb-1">{t.name}</p>
                <p className="font-body text-[11px] text-white/40 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>

          {/* supported chains footnote */}
          <div className="mt-10 pt-6 border-t border-white/8 flex flex-wrap gap-x-6 gap-y-2">
            <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest">Additional Chains:</span>
            {['Ethereum', 'Solana', 'BNB Chain', 'Tron', 'Polygon', 'Arbitrum', 'Base', 'Litecoin', 'Monero (tracing-limited)', 'Avalanche'].map(c => (
              <span key={c} className="font-mono text-[10px] text-white/40">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="border-t border-[#e4e8f0]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="mb-12">
            <p className="font-mono text-[10px] text-[#f7931a] uppercase tracking-widest mb-3">[ CLIENT CASES ]</p>
            <h2 className="font-heading font-700 text-[36px] leading-tight mb-2">Investigation Outcomes</h2>
            <p className="font-body text-[12px] text-[#8b92a5] italic">Names abbreviated for client privacy. Quotes describe investigation experience — not guaranteed outcomes.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="border border-[#e4e8f0] rounded p-5 relative group hover:border-[#f7931a]/30 hover:shadow-md transition-all">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#f7931a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t" />
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={11} className="fill-[#f7931a] text-[#f7931a]" />
                  ))}
                </div>
                <p className="font-body text-[13px] text-[#3d4452] leading-relaxed mb-4">"{t.quote}"</p>
                <div className="border-t border-[#e4e8f0] pt-3 flex items-center justify-between">
                  <div>
                    <p className="font-heading font-600 text-[13px]">{t.name}</p>
                    <p className="font-mono text-[10px] text-[#8b92a5]">{t.role} · {t.country}</p>
                  </div>
                  <span className="font-mono text-[9px] border border-[#f7931a]/30 text-[#f7931a] bg-[#fff8f0] px-2 py-0.5 rounded-sm uppercase tracking-wide">{t.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="border-t border-[#e4e8f0] bg-[#f7f8fc]">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="mb-12 text-center">
            <p className="font-mono text-[10px] text-[#0057ff] uppercase tracking-widest mb-3">[ INVESTIGATION FEES ]</p>
            <h2 className="font-heading font-700 text-[36px] leading-tight mb-3">Fixed-Fee Forensic Analysis</h2>
            <p className="font-body text-sm text-[#5a6174] max-w-xl mx-auto">Fees cover investigator time, tooling, and report production. They are not contingent on recovery — we bill for the forensic work, not the outcome.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {PRICING.map(p => (
              <div key={p.tier}
                className={`rounded border relative overflow-hidden ${p.accent ? 'bg-[#0a0c10] border-[#f7931a]/30' : 'bg-white border-[#e4e8f0]'}`}>
                {p.accent && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#f7931a] to-[#ffb347]" />}

                <div className="p-7">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className={`font-mono text-[10px] uppercase tracking-widest mb-1 ${p.accent ? 'text-[#f7931a]' : 'text-[#8b92a5]'}`}>{p.tier}</p>
                      <p className={`font-heading font-700 text-[38px] leading-none ${p.accent ? 'text-white' : 'text-[#0a0c10]'}`}>{p.price}</p>
                      <p className={`font-mono text-[10px] mt-1 ${p.accent ? 'text-white/40' : 'text-[#8b92a5]'}`}>{p.per}</p>
                    </div>
                    {p.accent && (
                      <span className="font-mono text-[9px] bg-[#f7931a]/10 text-[#f7931a] border border-[#f7931a]/20 px-2 py-1 rounded-sm uppercase tracking-widest">Recommended</span>
                    )}
                  </div>

                  <p className={`font-body text-[12px] leading-relaxed mb-6 ${p.accent ? 'text-white/50' : 'text-[#5a6174]'}`}>{p.desc}</p>

                  <ul className="space-y-2.5 mb-7">
                    {p.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-sm flex items-center justify-center flex-shrink-0 ${p.accent ? 'bg-[#f7931a]/10' : 'bg-[#f0f8ff]'}`}>
                          <Check size={10} className={p.accent ? 'text-[#f7931a]' : 'text-[#0057ff]'} />
                        </div>
                        <span className={`font-body text-[12px] ${p.accent ? 'text-white/70' : 'text-[#3d4452]'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button onClick={() => navigate('dashboard')}
                    className={`w-full py-3 rounded font-heading font-600 text-sm transition-all ${
                      p.accent
                        ? 'bg-[#f7931a] text-white hover:bg-[#e07e10]'
                        : 'bg-[#0a0c10] text-white hover:bg-[#1a1e28]'
                    }`}>
                    {p.cta} →
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 border border-[#e4e8f0] rounded bg-white flex gap-3 items-start">
            <AlertTriangle size={14} className="text-[#f7931a] flex-shrink-0 mt-0.5" />
            <p className="font-body text-[12px] text-[#5a6174]">
              Investigation fees are non-refundable and cover forensic analysis regardless of outcome. Recovery of assets is not guaranteed and depends on available on-chain evidence, exchange cooperation, and applicable jurisdiction.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="border-t border-[#e4e8f0]">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="mb-12">
            <p className="font-mono text-[10px] text-[#f7931a] uppercase tracking-widest mb-3">[ FAQ ]</p>
            <h2 className="font-heading font-700 text-[36px] leading-tight">Questions</h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-[#e4e8f0] rounded overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 hover:bg-[#f7f8fc] transition-colors">
                  <span className="font-heading font-600 text-[14px]">{faq.q}</span>
                  <ChevronRight size={14} className={`text-[#8b92a5] flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 font-body text-[13px] text-[#5a6174] leading-relaxed border-t border-[#e4e8f0] pt-4 bg-[#f7f8fc]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-[#e4e8f0] bg-[#0a0c10] relative overflow-hidden">
        <div className="absolute inset-0 dot-matrix opacity-20" />
        <div className="relative max-w-4xl mx-auto px-6 py-20 text-center">
          <p className="font-mono text-[10px] text-[#f7931a] uppercase tracking-widest mb-5">[ OPEN AN INVESTIGATION ]</p>
          <h2 className="font-heading font-700 text-[44px] text-white leading-tight mb-4">
            Your BTC Left a<br />
            <span className="text-[#f7931a]">Permanent Trail.</span>
          </h2>
          <p className="font-body text-[15px] text-white/50 max-w-md mx-auto mb-8">Submit a case and an investigator will review your incident within 2 hours. Honest assessment. No obligations until you approve a scope of work.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('dashboard')}
              className="inline-flex items-center gap-2 bg-[#f7931a] text-white font-heading font-600 px-6 py-3.5 rounded hover:bg-[#e07e10] transition-all">
              Begin Investigation <ArrowRight size={15} />
            </button>
            <button onClick={() => navigate('dashboard')}
              className="inline-flex items-center gap-2 border border-white/15 text-white font-body text-sm px-6 py-3.5 rounded hover:border-white/30 transition-all">
              View Client Portal
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#e4e8f0] bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="" className="h-7 w-auto object-contain" />
            <span className="font-heading font-600 text-sm">CryptoWallet Tracker</span>
            <span className="font-mono text-[9px] text-[#8b92a5] uppercase tracking-widest ml-1">Crypto Recovery</span>
          </div>
          <p className="font-body text-[11px] text-[#8b92a5] text-center max-w-sm">
            Blockchain forensic analysis. Recovery is not guaranteed and depends on available on-chain evidence and legal proceedings.
          </p>
          <div className="flex items-center gap-5 text-[11px] text-[#8b92a5]">
            <a href="#" className="hover:text-[#0a0c10] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#0a0c10] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#0a0c10] transition-colors">Contact</a>
            <span
              onDoubleClick={() => navigate('admin-login')}
              className="w-1.5 h-1.5 rounded-full bg-[#e4e8f0] cursor-default select-none"
            />
          </div>
        </div>
      </footer>
    </div>
  )
}
