'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LEAVE_TYPES, HOURS_PER_DAY } from '@/lib/constants'

export default function RequestLeavePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date:   '',
    duration:   'full',
    note:       '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function calcHours() {
    if (!form.start_date || !form.end_date) return 0
    const start = new Date(form.start_date)
    const end   = new Date(form.end_date)
    if (end < start) return 0
    let days = 0
    const cur = new Date(start)
    while (cur <= end) {
      const d = cur.getDay()
      if (d !== 0 && d !== 6) days++
      cur.setDate(cur.getDate() + 1)
    }
    if (form.duration === 'half') return HOURS_PER_DAY / 2
    if (form.duration === 'hours') return 0
    return days * HOURS_PER_DAY
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const hours = calcHours()
    if (!hours && form.duration !== 'hours') {
      setError('Please check your dates — end date must be on or after start date.')
      return
    }
    setLoading(true)
    const res = await fetch('/api/leave/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, hours }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setLoading(false) }
    else router.push('/dashboard/my-leave')
  }

  const hours = calcHours()

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-oxford text-3xl">Request Leave</h1>
        <p className="text-gray-500 mt-1">Submit a new leave request for approval</p>
      </div>

      <div className="max-w-2xl">
        <div className="card">
          <form onSubmit={submit} className="space-y-5">
            {/* Leave type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leave type</label>
              <select className="input" value={form.leave_type} onChange={e => set('leave_type', e.target.value)}>
                {LEAVE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
                <input type="date" className="input" value={form.start_date}
                       onChange={e => { set('start_date', e.target.value); if (!form.end_date) set('end_date', e.target.value) }}
                       required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
                <input type="date" className="input" value={form.end_date} min={form.start_date}
                       onChange={e => set('end_date', e.target.value)} required />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <div className="flex gap-3">
                {[
                  { value: 'full', label: 'Full day(s)' },
                  { value: 'half', label: 'Half day' },
                ].map(opt => (
                  <button type="button" key={opt.value}
                          onClick={() => set('duration', opt.value)}
                          className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all
                            ${form.duration === opt.value
                              ? 'bg-oxford text-white border-oxford'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-oxford'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {hours > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-oxford">
                <strong>Summary:</strong> {hours / HOURS_PER_DAY} working day{hours / HOURS_PER_DAY !== 1 ? 's' : ''} ({hours} hours)
                {LEAVE_TYPES.find(t => t.value === form.leave_type)?.deductible
                  ? ' — will be deducted from your annual leave balance'
                  : ' — will not affect your annual leave balance'}
              </div>
            )}

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea className="input resize-none" rows={3}
                        placeholder="Any additional details for your manager…"
                        value={form.note} onChange={e => set('note', e.target.value)} />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Submitting…' : 'Submit request'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => router.back()}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
