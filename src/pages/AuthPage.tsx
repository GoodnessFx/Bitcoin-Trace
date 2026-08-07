import { useState, useEffect, useRef } from 'react'
import {
  Lock, Eye, EyeOff, ArrowLeft, Mail,
  X, Check, LogIn, UserPlus, Loader
} from 'lucide-react'
import { LOGO_URL } from '../lib/branding'

function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  )
}
import type { AuthUser } from '../lib/auth'
import { signUp, signIn, signInWithGoogle } from '../lib/auth'
import { initGoogleAuth, renderGoogleButton, promptGoogleOneTap, hasGoogleClientId } from '../lib/google'

interface Props {
  onAuth: (user: AuthUser) => void
  onBack: () => void
}

const GOOGLE_ACCOUNTS = [
  { name: 'James Carter', email: 'james.carter@gmail.com', color: '#4285F4' },
  { name: 'Sarah Mitchell', email: 'sarah.mitchell@gmail.com', color: '#34A853' },
  { name: 'Oluwaseun Adeyemi', email: 'oluwaseun.a@gmail.com', color: '#FBBC05' },
]

export default function AuthPage({ onAuth, onBack }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [show, setShow] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [googleOpen, setGoogleOpen] = useState(false)
  const [googleName, setGoogleName] = useState('')
  const [googleEmail, setGoogleEmail] = useState('')
  const [googleStep, setGoogleStep] = useState<'chooser' | 'custom'>('chooser')
  const [remember, setRemember] = useState(true)
  const [googleReady, setGoogleReady] = useState(false)
  const googleBtnRef = useRef<HTMLDivElement>(null)
  const googleRendered = useRef(false)

  useEffect(() => {
    let cancelled = false
    if (!hasGoogleClientId() || googleRendered.current) return
    initGoogleAuth(profile => {
      const { user } = signInWithGoogle(profile.name, profile.email, profile.picture)
      onAuth(user)
    }).then(ok => {
      if (cancelled) return
      setGoogleReady(ok)
      if (ok && googleBtnRef.current && !googleRendered.current) {
        googleRendered.current = true
        renderGoogleButton(googleBtnRef.current, profile => {
          const { user } = signInWithGoogle(profile.name, profile.email, profile.picture)
          onAuth(user)
        })
        promptGoogleOneTap()
      }
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!remember) localStorage.removeItem('bt_session')
    setBusy(true)
    setTimeout(() => {
      const result = mode === 'signup'
        ? signUp(name, email, password)
        : signIn(email, password)
      setBusy(false)
      if ('error' in result) { setError(result.error); return }
      onAuth(result.user)
    }, 600)
  }

  const pickGoogle = (name: string, email: string) => {
    setGoogleOpen(false)
    setError('')
    const { user } = signInWithGoogle(name, email)
    onAuth(user)
  }

  const googleContinue = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(googleEmail.trim())) {
      setError('Enter a valid Gmail address to continue.')
      return
    }
    pickGoogle(googleName || googleEmail.split('@')[0], googleEmail)
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#0f1117] mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to site
        </button>

        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <img src={LOGO_URL} alt="CryptoWallet Tracker" className="h-9 w-auto object-contain" />
            <div>
              <p className="font-semibold text-sm">CryptoWallet Tracker</p>
              <p className="font-mono text-[10px] text-[#6b7280] uppercase tracking-widest">Secure Client Portal</p>
            </div>
          </div>

          <h1 className="font-serif text-2xl mb-1">{mode === 'signin' ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-sm text-[#6b7280] mb-6">
            {mode === 'signin'
              ? 'Sign in to access your recovery cases and portal.'
              : 'Set up your account to open and track recovery cases.'}
          </p>

          {/* Google button */}
          {hasGoogleClientId() ? (
            <div>
              <div ref={googleBtnRef} className="w-full" />
              {!googleReady && (
                <div className="w-full border border-[#e2e6ed] rounded-xl py-2.5 text-center text-sm text-[#6b7280] animate-pulse">
                  Loading Google sign-in…
                </div>
              )}
              <div className="mt-2 flex items-center gap-2">
                <GoogleG size={14} />
                <span className="text-[10px] text-[#6b7280]">Uses the Google account already signed in on this browser</span>
              </div>
            </div>
          ) : (
            <button onClick={() => { setError(''); setGoogleStep('chooser'); setGoogleOpen(true) }}
              className="w-full flex items-center justify-center gap-3 border border-[#e2e6ed] rounded-xl py-2.5 hover:bg-[#f8f9fb] transition-colors text-sm font-medium">
              <GoogleG /> Continue with Google
            </button>
          )}

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#e2e6ed]" />
            <span className="font-mono text-[10px] text-[#6b7280] uppercase tracking-widest">or use your email</span>
            <div className="flex-1 h-px bg-[#e2e6ed]" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-xs text-[#6b7280] block mb-1.5">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} autoComplete="name"
                  className="w-full border border-[#e2e6ed] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#0057ff] transition-colors"
                  placeholder="Jane Doe" />
              </div>
            )}
            <div>
              <label className="text-xs text-[#6b7280] block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa1ae]" />
                <input value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"
                  className="w-full border border-[#e2e6ed] rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-[#0057ff] transition-colors"
                  placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#6b7280] block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa1ae]" />
                <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className="w-full border border-[#e2e6ed] rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#0057ff] transition-colors"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280]">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-[#6b7280] cursor-pointer">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-[#0057ff]" />
              Keep me signed in on this device
            </label>

            {error && <p className="text-xs text-[#dc2626]">{error}</p>}

            <button type="submit" disabled={busy}
              className="w-full bg-[#0057ff] text-white font-medium py-2.5 rounded-xl hover:bg-[#0042cc] transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? <Loader size={14} className="animate-spin" /> : mode === 'signin' ? <LogIn size={14} /> : <UserPlus size={14} />}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-[#6b7280] mt-5">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setError(''); setMode(mode === 'signin' ? 'signup' : 'signin') }}
              className="text-[#0057ff] hover:underline font-medium">
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-[#6b7280] mt-6 flex items-center justify-center gap-1">
          <Lock size={10} /> Protected by end-to-end encrypted session
        </p>
      </div>

      {/* Google account chooser modal */}
      {googleOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setGoogleOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 flex items-start justify-between">
              <div className="w-10 h-10 rounded-full bg-white border border-[#e2e6ed] flex items-center justify-center shadow-sm">
                <GoogleG size={20} />
              </div>
              <button onClick={() => setGoogleOpen(false)} className="text-[#6b7280] hover:text-[#0f1117]"><X size={18} /></button>
            </div>

            {googleStep === 'chooser' ? (
              <>
                <h2 className="px-6 text-lg font-medium">Choose an account</h2>
                <p className="px-6 text-sm text-[#6b7280] mb-4">to continue to CryptoWallet Tracker</p>
                <div className="border-t border-[#e2e6ed]">
                  {GOOGLE_ACCOUNTS.map(a => (
                    <button key={a.email} onClick={() => pickGoogle(a.name, a.email)}
                      className="w-full flex items-center gap-3 px-6 py-3 hover:bg-[#f8f9fb] transition-colors text-left">
                      <div className="w-9 h-9 rounded-full text-white flex items-center justify-center text-xs font-medium" style={{ background: a.color }}>{a.name.split(' ').map(w => w[0]).join('')}</div>
                      <div>
                        <p className="text-sm text-[#0f1117]">{a.name}</p>
                        <p className="text-xs text-[#6b7280]">{a.email}</p>
                      </div>
                    </button>
                  ))}
                  <button onClick={() => { setGoogleStep('custom'); setError('') }}
                    className="w-full flex items-center gap-3 px-6 py-3 hover:bg-[#f8f9fb] transition-colors text-left border-t border-[#e2e6ed]">
                    <div className="w-9 h-9 rounded-full bg-[#f1f3f7] flex items-center justify-center">
                      <UserPlus size={15} className="text-[#3d4452]" />
                    </div>
                    <span className="text-sm text-[#0057ff] font-medium">Use another account</span>
                  </button>
                </div>
                <div className="px-6 py-4 flex items-center justify-between text-xs text-[#6b7280] border-t border-[#e2e6ed]">
                  <span>Demo authentication</span>
                  <span className="flex items-center gap-1"><Lock size={10} /> Simulated</span>
                </div>
              </>
            ) : (
              <>
                <h2 className="px-6 text-lg font-medium">Sign in with Google</h2>
                <p className="px-6 text-sm text-[#6b7280] mb-4">Enter the account you want to use.</p>
                <div className="px-6 space-y-3 pb-6">
                  <div>
                    <label className="text-xs text-[#6b7280] block mb-1.5">Name</label>
                    <input value={googleName} onChange={e => setGoogleName(e.target.value)}
                      className="w-full border border-[#e2e6ed] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#4285F4]"
                      placeholder="Your name" />
                  </div>
                  <div>
                    <label className="text-xs text-[#6b7280] block mb-1.5">Email</label>
                    <input value={googleEmail} onChange={e => setGoogleEmail(e.target.value)}
                      className="w-full border border-[#e2e6ed] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#4285F4]"
                      placeholder="you@gmail.com" />
                  </div>
                  {error && <p className="text-xs text-[#dc2626]">{error}</p>}
                  <button onClick={googleContinue}
                    className="w-full bg-[#4285F4] text-white font-medium py-2.5 rounded-xl hover:bg-[#3367d6] transition-colors text-sm">
                    Continue
                  </button>
                  <button onClick={() => { setGoogleStep('chooser'); setError('') }}
                    className="w-full text-center text-xs text-[#6b7280] hover:text-[#0f1117]">
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
