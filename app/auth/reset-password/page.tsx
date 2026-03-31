'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [ready, setReady]         = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Supabase puts the session tokens in the URL hash when redirecting
    // We need to let the client pick them up
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
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
        {!ready ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-gray-500">Verifying your reset link...</p>
          </div>
        ) : (
          <>
            <h2 className="font-display font-bold text-oxford text-2xl mb-1">Set new password</h2>
            <p className="text-gray-500 text-sm mb-6">Choose a strong password for your account.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                <input type="password" className="input"
                       placeholder="At least 8 characters"
                       value={password} onChange={e => setPassword(e.target.value)}
                       required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                <input type="password" className="input"
                       placeholder="Repeat your new password"
                       value={confirm} onChange={e => setConfirm(e.target.value)}
                       required />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Saving...' : 'Set new password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
