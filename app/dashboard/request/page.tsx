'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LEAVE_TYPES, HOURS_PER_DAY } from '@/lib/constants'
import { createClient } from '@/lib/supabase'

interface BlockedDay {
  date: string
  reason: string | null
}

export default function RequestLeavePage() {
  const router   = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    leave_type:  'annual',
    start_date:  '',
    end_date:    '',
    duration:    'full',   // 'full' | 'half' | 'hours'
    start_time:  '09:00',
    end_time:    '17:00',
    note:        '',
  })
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [blockedDays, setBlockedDays] = useState<BlockedDay[]>([])
  const [blockedHit,  setBlockedHit]  = useState<BlockedDay[]>([])

  useEffect(() => {
    supabase.from('blocked_days').select('date, reason').then(({ data }) => {
      setBlockedDays(data || [])
    })
  }, [])

  useEffect(() => {
    if (!form.start_date || !form.end_date) { setBlockedHit([]); return }
    const hits = blockedDays.filter(b => b.date >= form.start_date && b.date <= form.end_date)
    setBlockedHit(hits)
  }, [form.start_date, form.end_date, blockedDays])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function timeToHours(t: string): number {
    const [h, m] = t.split(':').map(Number)
    return h + m / 60
  }

  function calcHours(): number {
    if (!form.start_date || !form.end_date) return 0

    if (form.duration === 'hours') {
      const diff = timeToHours(form.end_time) - timeToHours(form.start_time)
      return diff > 0 ? Math.round(diff * 10) / 10 : 0
    }

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
    return days * HOURS_PER_DAY
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const hours = calcHours()
    if (!hours) {
      setError(form.duration === 'hours'
        ? 'End time must be after start time.'
        : 'Please check your dates.')
      return
    }
    setLoading(true)
    const res = await fetch('/api/leave/request', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...form, hours }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setLoading(false) }
    else router.push('/dashboard/my-leave')
  }

  const hours     = calcHours()
  const leaveType = LEAVE_TYPES.find(t => t.value === form.leave_type)
  const isWfh     = form.leave_type === 'wfh'
  const isHours   = form.duration === 'hours'

  // Generate time options every 30 mins
  const timeOptions: string[] = []
  for (let h = 7; h <= 20; h++) {
    timeOptions.push(`${String(h).padStart(2,'0')}:00`)
    if (h < 20) timeOptions.push(`${String(h).padStart(2,'0')}:30`)
  }

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
              <select className="input" value={form.leave_type}
                      onChange={e => set('leave_type', e.target.value)}>
                {LEAVE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>

            {/* WFH info banner */}
            {isWfh && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-sm text-teal-800">
                🏠 <strong>Work from Home</strong> — these hours will not be deducted from your
                annual leave balance. Where possible, please work from home on Wednesdays or Fridays.
              </div>
            )}

            {/* Duration selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <div className="flex gap-3">
                {[
                  { value: 'full',  label: 'Full day(s)' },
                  { value: 'half',  label: 'Half day'    },
                  { value: 'hours', label: 'Specific hours' },
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

            {/* Date(s) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isHours ? 'Date' : 'Start date'}
                </label>
                <input type="date" className="input" value={form.start_date}
                       onChange={e => {
                         set('start_date', e.target.value)
                         // For hours mode, end date = start date
                         if (isHours || !form.end_date) set('end_date', e.target.value)
                       }}
                       required />
              </div>
              {!isHours && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
                  <input type="date" className="input" value={form.end_date}
                         min={form.start_date}
                         onChange={e => set('end_date', e.target.value)} required />
                </div>
              )}
            </div>

            {/* Time pickers for 'hours' mode */}
            {isHours && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
                  <select className="input" value={form.start_time}
                          onChange={e => set('start_time', e.target.value)}>
                    {timeOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End time</label>
                  <select className="input" value={form.end_time}
                          onChange={e => set('end_time', e.target.value)}>
                    {timeOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Blocked day warning */}
            {blockedHit.length > 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-800">
                <p className="font-semibold mb-1">⚠️ Your request includes blocked day(s):</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {blockedHit.map(b => (
                    <li key={b.date}>
                      {new Date(b.date + 'T12:00:00').toLocaleDateString('en-GB', {
                        weekday:'long', day:'numeric', month:'long'
                      })}
                      {b.reason && <span className="text-amber-700"> — {b.reason}</span>}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-amber-700">You can still submit — your manager will be notified.</p>
              </div>
            )}

            {/* Summary */}
            {hours > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-oxford">
                <strong>Summary:</strong>{' '}
                {isHours
                  ? `${hours} hour${hours !== 1 ? 's' : ''} (${form.start_time}–${form.end_time})`
                  : `${hours / HOURS_PER_DAY} working day${hours / HOURS_PER_DAY !== 1 ? 's' : ''} (${hours} hours)`
                }
                {' — '}
                {leaveType?.deductible
                  ? 'will be deducted from your annual leave balance'
                  : 'will not affect your annual leave balance'}
              </div>
            )}

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea className="input resize-none" rows={3}
                        placeholder="Any additional details for your manager..."
                        value={form.note}
                        onChange={e => set('note', e.target.value)} />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit request'}
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
