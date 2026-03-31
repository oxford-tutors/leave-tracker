'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { LEAVE_TYPES, LEAVE_COLOURS } from '@/lib/constants'

interface CalendarEntry {
  id: string
  user_id: string
  name: string
  leave_type: string
  start_date: string
  end_date: string
  status: string
  hours: number
}

interface BlockedDay {
  id: string
  date: string
  reason: string | null
}

interface Profile {
  id: string
  role: string
  name: string
}

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']
const DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export default function CalendarPage() {
  const today   = new Date()
  const [year,  setYear]    = useState(today.getFullYear())
  const [month, setMonth]   = useState(today.getMonth())
  const [entries,      setEntries]      = useState<CalendarEntry[]>([])
  const [blockedDays,  setBlockedDays]  = useState<BlockedDay[]>([])
  const [profile,      setProfile]      = useState<Profile | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [blockModal,   setBlockModal]   = useState<string | null>(null) // date string
  const [blockReason,  setBlockReason]  = useState('')
  const [selectedDay,  setSelectedDay]  = useState<string | null>(null)

  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: prof }, { data: reqs }, { data: blocked }] = await Promise.all([
      supabase.from('profiles').select('id, role, name').eq('id', user.id).single(),
      supabase.from('leave_requests')
        .select('id, user_id, leave_type, start_date, end_date, status, hours, profile:profiles!leave_requests_user_id_fkey(name)')
        .in('status', ['approved', 'pending'])
        .order('start_date'),
      supabase.from('blocked_days').select('*').order('date'),
    ])

    setProfile(prof)
    setEntries((reqs || []).map((r: any) => ({ ...r, name: r.profile?.name || 'Unknown' })))
    setBlockedDays(blocked || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Build calendar grid (Mon-Sun)
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  // Start from Monday
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const cells: (Date | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  function dateStr(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  function entriesForDate(d: Date): CalendarEntry[] {
    const ds = dateStr(d)
    return entries.filter(e => e.start_date <= ds && e.end_date >= ds)
  }

  function isBlocked(d: Date): BlockedDay | null {
    const ds = dateStr(d)
    return blockedDays.find(b => b.date === ds) || null
  }

  function isToday(d: Date) {
    return d.toDateString() === today.toDateString()
  }

  function isWeekend(d: Date) {
    return d.getDay() === 0 || d.getDay() === 6
  }

  async function addBlockedDay() {
    if (!blockModal) return
    await supabase.from('blocked_days').insert({
      date: blockModal,
      reason: blockReason || null,
    })
    setBlockModal(null)
    setBlockReason('')
    load()
  }

  async function removeBlockedDay(id: string) {
    await supabase.from('blocked_days').delete().eq('id', id)
    load()
  }

  const selectedEntries = selectedDay ? entries.filter(e => e.start_date <= selectedDay && e.end_date >= selectedDay) : []
  const selectedBlocked = selectedDay ? blockedDays.find(b => b.date === selectedDay) : null

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">Loading calendar…</div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-oxford text-3xl">Calendar</h1>
          <p className="text-gray-500 mt-1">Team leave overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="btn-ghost px-3 py-2 text-lg">‹</button>
          <span className="font-display font-semibold text-oxford text-lg min-w-[160px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="btn-ghost px-3 py-2 text-lg">›</button>
          <button onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()) }}
                  className="btn-ghost text-sm px-3 py-2">Today</button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Calendar grid */}
        <div className="flex-1">
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            {LEAVE_TYPES.map(t => (
              <div key={t.value} className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className={`w-3 h-3 rounded-sm ${LEAVE_COLOURS[t.value]}`} />
                {t.icon} {t.label}
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="w-3 h-3 rounded-sm bg-red-200 border border-red-400" />
              🚫 Blocked
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className={`text-center text-xs font-semibold py-2 
                ${d === 'Sat' || d === 'Sun' ? 'text-gray-400' : 'text-gray-600'}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
            {cells.map((cell, i) => {
              if (!cell) return <div key={i} className="bg-gray-50 min-h-[90px]" />

              const ds        = dateStr(cell)
              const dayEntries = entriesForDate(cell)
              const blocked   = isBlocked(cell)
              const weekend   = isWeekend(cell)
              const todayCell = isToday(cell)
              const selected  = selectedDay === ds

              return (
                <div key={i}
                     onClick={() => setSelectedDay(selected ? null : ds)}
                     className={`min-h-[90px] p-1.5 cursor-pointer transition-colors
                       ${weekend ? 'bg-gray-50' : 'bg-white'}
                       ${blocked ? 'bg-red-50' : ''}
                       ${selected ? 'ring-2 ring-inset ring-oxford' : ''}
                       hover:bg-blue-50`}>

                  {/* Date number */}
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                      ${todayCell ? 'bg-oxford text-white' : weekend ? 'text-gray-400' : 'text-gray-700'}`}>
                      {cell.getDate()}
                    </span>
                    {blocked && (
                      <span className="text-xs text-red-500" title={blocked.reason || 'Blocked'}>🚫</span>
                    )}
                    {profile?.role === 'admin' && !blocked && !weekend && (
                      <button onClick={e => { e.stopPropagation(); setBlockModal(ds) }}
                              className="opacity-0 hover:opacity-100 group-hover:opacity-100
                                         text-xs text-gray-300 hover:text-red-400 transition-opacity"
                              title="Block this day">
                        +
                      </button>
                    )}
                  </div>

                  {/* Entries */}
                  <div className="space-y-0.5">
                    {dayEntries.slice(0, 3).map(e => {
                      const colour = LEAVE_COLOURS[e.leave_type] || 'bg-gray-400'
                      const type   = LEAVE_TYPES.find(t => t.value === e.leave_type)
                      return (
                        <div key={e.id}
                             className={`${colour} text-white text-xs px-1.5 py-0.5 rounded truncate
                               ${e.status === 'pending' ? 'opacity-60' : ''}`}
                             title={`${e.name} — ${type?.label}${e.status === 'pending' ? ' (pending)' : ''}`}>
                          {type?.icon} {e.name.split(' ')[0]}
                        </div>
                      )
                    })}
                    {dayEntries.length > 3 && (
                      <div className="text-xs text-gray-500 pl-1">+{dayEntries.length - 3} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Side panel */}
        <div className="w-72 shrink-0 space-y-4">

          {/* Selected day detail */}
          {selectedDay && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-oxford">
                  {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })}
                </h3>
                <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              {selectedBlocked && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-red-700">🚫 Blocked day</p>
                      {selectedBlocked.reason && (
                        <p className="text-xs text-red-600 mt-0.5">{selectedBlocked.reason}</p>
                      )}
                    </div>
                    {profile?.role === 'admin' && (
                      <button onClick={() => removeBlockedDay(selectedBlocked.id)}
                              className="text-xs text-red-500 hover:text-red-700 font-medium">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )}

              {selectedEntries.length === 0 && !selectedBlocked ? (
                <p className="text-sm text-gray-400">No leave on this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedEntries.map(e => {
                    const type   = LEAVE_TYPES.find(t => t.value === e.leave_type)
                    const colour = LEAVE_COLOURS[e.leave_type] || 'bg-gray-400'
                    return (
                      <div key={e.id} className="flex items-start gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${colour} mt-1 shrink-0`} />
                        <div>
                          <p className="text-sm font-medium text-oxford">{e.name}</p>
                          <p className="text-xs text-gray-500">
                            {type?.icon} {type?.label}
                            {e.status === 'pending' && <span className="text-amber-600"> (pending)</span>}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Admin: block this day */}
              {profile?.role === 'admin' && !selectedBlocked && (
                <button onClick={() => setBlockModal(selectedDay)}
                        className="mt-3 w-full text-sm text-red-500 hover:text-red-700 font-medium
                                   border border-red-200 hover:border-red-400 rounded-lg py-2 transition-colors">
                  🚫 Block this day
                </button>
              )}
            </div>
          )}

          {/* Blocked days this month */}
          {profile?.role === 'admin' && (
            <div className="card">
              <h3 className="font-display font-semibold text-oxford mb-3">Blocked days</h3>
              {blockedDays.filter(b => {
                const d = new Date(b.date)
                return d.getFullYear() === year && d.getMonth() === month
              }).length === 0 ? (
                <p className="text-sm text-gray-400">None this month.</p>
              ) : (
                <div className="space-y-2">
                  {blockedDays
                    .filter(b => {
                      const d = new Date(b.date)
                      return d.getFullYear() === year && d.getMonth() === month
                    })
                    .map(b => (
                      <div key={b.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium text-oxford">
                            {new Date(b.date + 'T12:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                          </span>
                          {b.reason && <span className="text-gray-500 ml-1.5">— {b.reason}</span>}
                        </div>
                        <button onClick={() => removeBlockedDay(b.id)}
                                className="text-xs text-red-400 hover:text-red-600">✕</button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Block day modal */}
      {blockModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
            <h2 className="font-display font-bold text-oxford text-xl mb-1">Block day</h2>
            <p className="text-gray-500 text-sm mb-5">
              {new Date(blockModal + 'T12:00:00').toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input className="input" placeholder="e.g. Company event, peak period"
                     value={blockReason} onChange={e => setBlockReason(e.target.value)}
                     autoFocus />
            </div>
            <div className="flex gap-3">
              <button onClick={addBlockedDay} className="btn-primary flex-1">Block day</button>
              <button onClick={() => { setBlockModal(null); setBlockReason('') }}
                      className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
