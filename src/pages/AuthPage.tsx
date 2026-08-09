import { useState } from 'react'
import { ArrowLeft, Loader } from 'lucide-react'
import { LOGO_URL } from '../lib/branding'
import { supabase, hasSupabaseConfig } from '../lib/supabase'

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

interface Props {
  onBack: () => void
}

export default function AuthPage({ onBack }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const googleSignIn = async () => {
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      setBusy(false)
      setError(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#0f1117] mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to site
        </button>

        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <img src={LOGO_URL} alt="" className="h-9 w-auto object-contain" />
            <div>
              <p className="font-semibold text-sm">CryptoWallet Tracker</p>
              <p className="font-mono text-[10px] text-[#6b7280] uppercase tracking-widest">Secure Client Portal</p>
            </div>
          </div>

          <h1 className="font-serif text-2xl mb-1">Sign in to your account</h1>
          <p className="text-sm text-[#6b7280] mb-6">
            Access your recovery cases and portal using your Google account.
          </p>

          {!hasSupabaseConfig() ? (
            <div className="border border-[#e2e6ed] rounded-xl p-4 text-sm text-[#6b7280]">
              Google sign-in is not configured. Set <span className="font-mono">VITE_SUPABASE_URL</span> and{' '}
              <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> and restart the dev server.
            </div>
          ) : (
            <button onClick={googleSignIn} disabled={busy}
              className="w-full flex items-center justify-center gap-3 border border-[#e2e6ed] rounded-xl py-3 hover:bg-[#f8f9fb] transition-colors text-sm font-medium disabled:opacity-60">
              {busy ? <Loader size={18} className="animate-spin" /> : <GoogleG size={18} />}
              {busy ? 'Redirecting to Google…' : 'Continue with Google'}
            </button>
          )}

          {error && <p className="text-xs text-[#dc2626] mt-3">{error}</p>}

          <p className="text-xs text-[#6b7280] mt-4 leading-relaxed">
            By continuing, you agree to our Terms of Service and acknowledge that your identity is verified
            through Google. No password is stored by this site.
          </p>
        </div>

        <p className="text-center text-xs text-[#6b7280] mt-6">
          Authenticated with Supabase Auth
        </p>
      </div>
    </div>
  )
}
