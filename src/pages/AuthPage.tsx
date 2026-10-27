import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Loader, Mail, Lock, User, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import { LOGO_URL } from '../lib/branding'
import { signIn, signUp, signInWithGoogle } from '../lib/auth'
import { initGoogleAuth, renderGoogleButton, promptGoogleOneTap, hasGoogleClientId } from '../lib/google'

function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="flex-shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  )
}

interface Props {
  initialMode?: 'signin' | 'signup'
  onBack: () => void
  onSuccess?: () => void
}

export default function AuthPage({ initialMode = 'signin', onBack, onSuccess }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const googleBtnRef = useRef<HTMLDivElement>(null)
  const [googleReady, setGoogleReady] = useState(false)
  const googleRendered = useRef(false)

  useEffect(() => {
    let cancelled = false
    if (!hasGoogleClientId() || googleRendered.current) return

    initGoogleAuth(profile => {
      const { user } = signInWithGoogle(profile.name, profile.email, profile.picture)
      if (user) {
        setSuccessMsg('Signed in with Google! Redirecting…')
        onSuccess?.()
      }
    }).then(ok => {
      if (cancelled) return
      setGoogleReady(ok)
      if (ok && googleBtnRef.current && !googleRendered.current) {
        googleRendered.current = true
        renderGoogleButton(googleBtnRef.current, profile => {
          const { user } = signInWithGoogle(profile.name, profile.email, profile.picture)
          if (user) {
            setSuccessMsg('Signed in with Google! Redirecting…')
            onSuccess?.()
          }
        })
        promptGoogleOneTap()
      }
    })

    return () => {
      cancelled = true
    }
  }, [onSuccess])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.')
        return
      }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError('Please enter a valid email address.')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }

      setBusy(true)
      const res = await signUp(name, email, password, remember)
      setBusy(false)

      if ('error' in res) {
        setError(res.error)
        return
      }

      setSuccessMsg('Account created successfully! Redirecting…')
      onSuccess?.()
    } else {
      if (!email.trim()) {
        setError('Please enter your email address.')
        return
      }
      if (!password) {
        setError('Please enter your password.')
        return
      }

      setBusy(true)
      const res = await signIn(email, password, remember)
      setBusy(false)

      if ('error' in res) {
        setError(res.error)
        return
      }

      setSuccessMsg('Signed in successfully! Redirecting…')
      onSuccess?.()
    }
  }

  const handleFallbackGoogleClick = () => {
    if (!promptGoogleOneTap()) {
      setError('Please use the Google Sign-in button below, or sign in with your email and password.')
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center px-4 py-10 selection:bg-[#0057ff] selection:text-white">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#0f1117] mb-6 transition-colors font-medium"
        >
          <ArrowLeft size={15} /> Back to site
        </button>

        {/* Card */}
        <div className="bg-white border border-[#e2e6ed] rounded-2xl shadow-sm p-7 sm:p-8">
          {/* Header Brand */}
          <div className="flex items-center gap-3 mb-6">
            <img src={LOGO_URL} alt="CryptoWallet Tracker" className="h-9 w-auto object-contain" />
            <div>
              <p className="font-semibold text-sm text-[#0f1117] tracking-tight">CryptoWallet Tracker</p>
              <p className="font-mono text-[10px] text-[#6b7280] uppercase tracking-wider">Secure Client Portal</p>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex bg-[#f3f4f8] p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin')
                setError('')
                setSuccessMsg('')
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white text-[#0f1117] shadow-sm'
                  : 'text-[#6b7280] hover:text-[#0f1117]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setError('')
                setSuccessMsg('')
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white text-[#0f1117] shadow-sm'
                  : 'text-[#6b7280] hover:text-[#0f1117]'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="mb-5">
            <h1 className="text-xl font-bold text-[#0f1117]">
              {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
            </h1>
            <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
              {mode === 'signin'
                ? 'Access your recovery cases, live forensic tracing, and reports.'
                : 'Set up your secure portal to open cases and monitor blockchain traces.'}
            </p>
          </div>

          {/* Google Button via Google Identity Services (GIS) */}
          <div className="mb-5">
            <div ref={googleBtnRef} className="w-full flex justify-center min-h-[42px]" />
            {!googleReady && (
              <button
                type="button"
                onClick={handleFallbackGoogleClick}
                disabled={busy}
                className="w-full flex items-center justify-center gap-3 border border-[#e2e6ed] rounded-xl py-2.5 px-4 hover:bg-[#f8f9fb] transition-colors text-xs font-medium text-[#1f2937] disabled:opacity-60"
              >
                <GoogleG size={17} />
                <span>Continue with Google</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#e5e7eb]" />
            <span className="text-[11px] font-mono text-[#9ca3af] uppercase tracking-wider">or with email</span>
            <div className="flex-1 h-px bg-[#e5e7eb]" />
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-medium text-[#374151] block mb-1">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Alex Henderson"
                    required
                    className="w-full border border-[#e2e6ed] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#0f1117] focus:outline-none focus:border-[#0057ff] focus:ring-1 focus:ring-[#0057ff] transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-[#374151] block mb-1">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="w-full border border-[#e2e6ed] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#0f1117] focus:outline-none focus:border-[#0057ff] focus:ring-1 focus:ring-[#0057ff] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#374151] block mb-1">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  className="w-full border border-[#e2e6ed] rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#0f1117] focus:outline-none focus:border-[#0057ff] focus:ring-1 focus:ring-[#0057ff] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#4b5563]"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="text-xs font-medium text-[#374151] block mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    required
                    className="w-full border border-[#e2e6ed] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#0f1117] focus:outline-none focus:border-[#0057ff] focus:ring-1 focus:ring-[#0057ff] transition-all"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-[#6b7280] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="rounded border-[#cbd5e1] text-[#0057ff] focus:ring-[#0057ff]"
                />
                Keep me signed in
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] rounded-xl p-3 text-xs leading-relaxed animate-in fade-in">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="flex items-start gap-2 bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] rounded-xl p-3 text-xs leading-relaxed">
                <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-[#0057ff] text-white font-medium py-2.5 rounded-xl hover:bg-[#0047d4] transition-all text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {busy ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  <span>Processing…</span>
                </>
              ) : mode === 'signin' ? (
                'Sign In to Portal'
              ) : (
                'Create Secure Account'
              )}
            </button>
          </form>

          {/* Toggle bottom link */}
          <div className="text-center text-xs text-[#6b7280] mt-5 pt-4 border-t border-[#f3f4f8]">
            {mode === 'signin' ? (
              <p>
                Don&apos;t have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup')
                    setError('')
                    setSuccessMsg('')
                  }}
                  className="text-[#0057ff] font-semibold hover:underline"
                >
                  Create Account
                </button>
              </p>
            ) : (
              <p>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin')
                    setError('')
                    setSuccessMsg('')
                  }}
                  className="text-[#0057ff] font-semibold hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Security badge */}
        <p className="text-center text-[11px] text-[#9ca3af] mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck size={13} className="text-[#10b981]" /> End-to-end encrypted client authentication
        </p>
      </div>
    </div>
  )
}
