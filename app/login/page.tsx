'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()
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

  return (
    <div className="min-h-screen bg-oxford flex flex-col items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #202641 0%, #2d3561 100%)' }}>
      {/* Logo & Brand */}
      <div className="text-center mb-8">
        <img src="https://oxfordtutors.com/OTlogo.jpg" alt="Oxford & Cambridge Tutors"
             className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-lg" />
        <h1 className="font-display font-bold text-white text-xl tracking-wide">
          OXFORD <span className="text-gold">&</span> CAMBRIDGE TUTORS
        </h1>
        <p className="text-blue-200 text-sm mt-1">Leave Management System</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <h2 className="font-display font-bold text-oxford text-2xl mb-1">Sign in</h2>
        <p className="text-gray-500 text-sm mb-6">Use your Oxford Tutors email address</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              className="input"
              placeholder="firstname.surname@oxfordtutors.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="input"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Forgotten your password? Contact your administrator.
        </p>
      </div>
    </div>
  )
}
