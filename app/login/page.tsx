'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Mode = 'login' | 'reset' | 'reset-sent'

export default function LoginPage() {
  const [mode, setMode]         = useState<Mode>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid email or password.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setMode('reset-sent')
    }
  }

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #202641 0%, #2d3561 100%)' }}>

      <div className="text-center mb-8">
        <img src="https://oxfordtutors.com/OTlogo.jpg" alt="Oxford & Cambridge Tutors"
             className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-lg" />
        <h1 className="font-display font-bold text-white text-xl tracking-wide">
          OXFORD <span className="text-gold">&</span> CAMBRIDGE TUTORS
        </h1>
        <p className="text-blue-200 text-sm mt-1">Leave Management System</p>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

        {mode === 'login' && (
          <>
            <h2 className="font-display font-bold text-oxford text-2xl mb-1">Sign in</h2>
            <p className="text-gray-500 text-sm mb-6">Use your Oxford Tutors email address</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input type="email" className="input"
                       placeholder="firstname.surname@oxfordtutors.com"
                       value={email} onChange={e => setEmail(e.target.value)}
                       required autoComplete="email" autoFocus />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <button type="button" onClick={() => switchMode('reset')}
                          className="text-xs text-oxford hover:underline font-medium">
                    Forgotten your password?
                  </button>
                </div>
                <input type="password" className="input"
                       placeholder="Enter your password"
                       value={password} onChange={e => setPassword(e.target.value)}
                       required autoComplete="current-password" />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}
              <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </>
        )}

        {mode === 'reset' && (
          <>
            <h2 className="font-display font-bold text-oxford text-2xl mb-1">Reset password</h2>
            <p className="text-gray-500 text-sm mb-6">
              Enter your email and we will send you a reset link.
            </p>
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input type="email" className="input"
                       placeholder="firstname.surname@oxfordtutors.com"
                       value={email} onChange={e => setEmail(e.target.value)}
                       required autoComplete="email" autoFocus />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
              <button type="button" onClick={() => switchMode('login')}
                      className="btn-ghost w-full text-center text-sm">
                Back to sign in
              </button>
            </form>
          </>
        )}

        {mode === 'reset-sent' && (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="font-display font-bold text-oxford text-xl mb-2">Check your email</h2>
            <p className="text-gray-500 text-sm mb-6">
              We have sent a password reset link to <strong>{email}</strong>.
              Click the link in the email to set a new password.
            </p>
            <button onClick={() => switchMode('login')} className="btn-primary w-full">
              Back to sign in
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
