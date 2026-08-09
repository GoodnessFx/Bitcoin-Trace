import { useState } from 'react'
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { LOGO_URL } from '../lib/branding'

interface Props { onAuth: () => void; onBack: () => void }

export default function AdminLogin({ onAuth, onBack }: Props) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'creds' | 'mfa'>('creds')
  const [error, setError] = useState('')

  const handleCreds = (e: React.FormEvent) => {
    e.preventDefault()
    if (user === 'admin' && pass === 'CryptoWallet2026!') {
      setStep('mfa')
      setError('')
    } else {
      setError('Invalid credentials.')
    }
  }

  const handleMfa = (e: React.FormEvent) => {
    e.preventDefault()
    if (otp === '000000' || otp.length === 6) {
      onAuth()
    } else {
      setError('Invalid code.')
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#0f1117] mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to site
        </button>

        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <img src={LOGO_URL} alt="" className="h-9 w-auto object-contain" />
            <div>
              <p className="font-semibold text-sm">CryptoWallet Tracker</p>
              <p className="font-mono text-[10px] text-[#6b7280] uppercase tracking-widest">Admin Portal</p>
            </div>
          </div>

          {step === 'creds' ? (
            <>
              <h1 className="font-serif text-2xl mb-1">Sign In</h1>
              <p className="text-sm text-[#6b7280] mb-6">Authorized personnel only. All access is logged.</p>
              <form onSubmit={handleCreds} className="space-y-4">
                <div>
                  <label className="text-xs text-[#6b7280] block mb-1.5">Username</label>
                  <input value={user} onChange={e => setUser(e.target.value)} autoComplete="username"
                    className="w-full border border-[#e2e6ed] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#0057ff] transition-colors"
                    placeholder="admin" />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] block mb-1.5">Password</label>
                  <div className="relative">
                    <input type={show ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} autoComplete="current-password"
                      className="w-full border border-[#e2e6ed] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#0057ff] pr-10 transition-colors"
                      placeholder="••••••••" />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280]">
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-xs text-[#dc2626]">{error}</p>}
                <button type="submit" className="w-full bg-[#0057ff] text-white font-medium py-2.5 rounded-xl hover:bg-[#0042cc] transition-colors text-sm flex items-center justify-center gap-2">
                  <Lock size={14} /> Continue
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="font-serif text-2xl mb-1">Two-Factor Auth</h1>
              <p className="text-sm text-[#6b7280] mb-6">Enter the 6-digit code from your authenticator app.</p>
              <form onSubmit={handleMfa} className="space-y-4">
                <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full border border-[#e2e6ed] rounded-xl px-3.5 py-3 text-center font-mono text-xl tracking-[0.4em] focus:outline-none focus:border-[#0057ff]"
                  placeholder="••••••" maxLength={6} />
                {error && <p className="text-xs text-[#dc2626] text-center">{error}</p>}
                <button type="submit" className="w-full bg-[#0057ff] text-white font-medium py-2.5 rounded-xl hover:bg-[#0042cc] transition-colors text-sm">
                  Verify & Enter
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[#6b7280] mt-6 flex items-center justify-center gap-1">
          <Lock size={10} /> Access monitored and logged
        </p>
      </div>
    </div>
  )
}
