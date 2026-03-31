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

const MONTHS     = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS       = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const DAYS_SHORT = ['M','T','W','T','F','S','S']

type ViewMode = 'month' | 'year'

export default function CalendarPage() {
  const today  = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [view,  setView]  = useState<ViewMode>('month')

  const [entries,       setEntries]       = useState<CalendarEntry[]>([])
  const [blockedDays,   setBlockedDays]   = useState<BlockedDay[]>([])
  const [profile,       setProfile]       = useState<Profile | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [teamView,      setTeamView]      = useState(false)
  const [blockModal,    setBlockModal]    = useState<string | null>(null)
  const [blockReason,   setBlockReason]   = useState('')
  const [selectedDay,   setSelectedDay]   = useState<string | null>(null)

  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)
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

  function dateStr(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  function visibleEntries(all: CalendarEntry[]) {
    if (profile?.role === 'admin' && teamView) return all
    return all.filter(e => e.user_id === currentUserId)
  }

  function entriesForDate(ds: string) {
    return visibleEntries(entries).filter(e => e.start_date <= ds && e.end_date >= ds)
  }

  function isBlocked(ds: string): BlockedDay | null {
    return blockedDays.find(b => b.date === ds) || null
  }

  function isToday(d: Date)   { return d.toDateString() === today.toDateString() }
  function isWeekend(d: Date) { return d.getDay() === 0 || d.getDay() === 6 }

  async function addBlockedDay() {
    if (!blockModal) return
    await supabase.from('blocked_days').insert({ date: blockModal, reason: blockReason || null })
    setBlockModal(null); setBlockReason(''); load()
  }

  async function removeBlockedDay(id: string) {
    await supabase.from('blocked_days').delete().eq('id', id); load()
  }

  const isAdmin = profile?.role === 'admin'

  // ── MONTH VIEW ────────────────────────────────────────────────────────────

  function buildMonthCells(y: number, m: number): (Date | null)[] {
    const firstDay = new Date(y, m, 1)
    const lastDay  = new Date(y, m + 1, 0)
    let startDow   = firstDay.getDay() - 1
    if (startDow < 0) startDow = 6
    const cells: (Date | null)[] = []
    for (let i = 0; i < startDow; i++) cells.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(y, m, d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }

  const monthCells  = buildMonthCells(year, month)
  const selectedEntries = selectedDay ? entriesForDate(selectedDay) : []
  const selectedBlocked = selectedDay ? isBlocked(selectedDay) : null

  // ── YEAR VIEW ─────────────────────────────────────────────────────────────

  function MiniMonth({ m }: { m: number }) {
    const cells    = buildMonthCells(year, m)
    const lastDay  = new Date(year, m + 1, 0).getDate()

    return (
      <div className="bg-white rounded-xl border border-gray-100 p-3 hover:shadow-md transition-shadow">
        {/* Month title */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-semibold text-oxford text-sm">{MONTHS[m]}</h3>
          <button onClick={() => { setMonth(m); setView('month') }}
                  className="text-xs text-gray-400 hover:text-oxford transition-colors">
            Full view →
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_SHORT.map((d, i) => (
            <div key={i} className={`text-center text-xs py-0.5
              ${i >= 5 ? 'text-gray-300' : 'text-gray-400'}`}>{d}</div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7 gap-px">
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} className="h-7" />
            const ds          = dateStr(cell)
            const dayEntries  = entriesForDate(ds)
            const blocked     = isBlocked(ds)
            const weekend     = isWeekend(cell)
            const todayCell   = isToday(cell)
            const hasLeave    = dayEntries.length > 0
            const topEntry    = dayEntries[0]
            const topColour   = topEntry ? LEAVE_COLOURS[topEntry.leave_type] : ''
            const multiColour = dayEntries.length > 1

            return (
              <div key={i}
                   onClick={() => { setSelectedDay(ds === selectedDay ? null : ds) }}
                   title={hasLeave
                     ? dayEntries.map(e => `${e.name} — ${LEAVE_TYPES.find(t=>t.value===e.leave_type)?.label}`).join('\n')
                     : blocked ? (blocked.reason || 'Blocked day') : undefined}
                   className={`h-7 w-full flex items-center justify-center rounded text-xs cursor-pointer
                     relative transition-colors
                     ${weekend ? 'text-gray-300' : 'text-gray-700'}
                     ${blocked ? 'bg-red-50' : ''}
                     ${selectedDay === ds ? 'ring-1 ring-oxford' : ''}
                     hover:bg-blue-50`}>

                {/* Today highlight */}
                {todayCell && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-6 h-6 rounded-full bg-oxford" />
                  </span>
                )}

                {/* Day number */}
                <span className={`relative z-10 text-xs font-medium
                  ${todayCell ? 'text-white' : ''}
                  ${hasLeave && !todayCell ? 'text-white' : ''}`}>
                  {cell.getDate()}
                </span>

                {/* Leave colour background */}
                {hasLeave && !todayCell && (
                  <span className={`absolute inset-0 rounded ${topColour} opacity-80`} />
                )}

                {/* Multi-person indicator */}
                {multiColour && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-white border border-gray-300 z-20" />
                )}

                {/* Blocked indicator */}
                {blocked && !hasLeave && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2
                                   w-1 h-1 rounded-full bg-red-400 z-20" />
                )}
              </div>
            )
          })}
        </div>

        {/* Month summary */}
        {(() => {
          const monthEntries = visibleEntries(entries).filter(e => {
            const start = `${year}-${String(m+1).padStart(2,'0')}-01`
            const end   = `${year}-${String(m+1).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`
            return e.start_date <= end && e.end_date >= start
          })
          const uniquePeople = new Set(monthEntries.map(e => e.user_id)).size
          const blockedCount = blockedDays.filter(b => {
            const bd = new Date(b.date)
            return bd.getFullYear() === year && bd.getMonth() === m
          }).length

          if (monthEntries.length === 0 && blockedCount === 0) return null
          return (
            <div className="mt-2 pt-2 border-t border-gray-50 flex gap-2 flex-wrap">
              {monthEntries.length > 0 && (
                <span className="text-xs text-gray-500">
                  {isAdmin && teamView
                    ? `${monthEntries.length} request${monthEntries.length !== 1 ? 's' : ''} · ${uniquePeople} staff`
                    : `${monthEntries.length} request${monthEntries.length !== 1 ? 's' : ''}`}
                </span>
              )}
              {blockedCount > 0 && (
                <span className="text-xs text-red-400">🚫 {blockedCount} blocked</span>
              )}
            </div>
          )
        })()}
      </div>
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">Loading calendar...</div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-oxford text-3xl">Calendar</h1>
          <p className="text-gray-500 mt-1">
            {isAdmin && teamView ? 'Team leave overview' : 'Your leave'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">

          {/* Admin team toggle */}
          {isAdmin && (
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
              <button onClick={() => setTeamView(false)}
                      className={`px-4 py-2 font-medium transition-colors
                        ${!teamView ? 'bg-oxford text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                My Leave
              </button>
              <button onClick={() => setTeamView(true)}
                      className={`px-4 py-2 font-medium transition-colors
                        ${teamView ? 'bg-oxford text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                Team View
              </button>
            </div>
          )}

          {/* Month / Year view toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            <button onClick={() => setView('month')}
                    className={`px-4 py-2 font-medium transition-colors
                      ${view === 'month' ? 'bg-gold text-oxford' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Month
            </button>
            <button onClick={() => setView('year')}
                    className={`px-4 py-2 font-medium transition-colors
                      ${view === 'year' ? 'bg-gold text-oxford' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Year
            </button>
          </div>

          {/* Navigation */}
          <button onClick={() => view === 'year' ? setYear(y => y - 1) : (() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) })()} className="btn-ghost px-3 py-2 text-lg">‹</button>
          <span className="font-display font-semibold text-oxford text-lg min-w-[160px] text-center">
            {view === 'year' ? year : `${MONTHS[month]} ${year}`}
          </span>
          <button onClick={() => view === 'year' ? setYear(y => y + 1) : (() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) })()} className="btn-ghost px-3 py-2 text-lg">›</button>
          <button onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()) }}
                  className="btn-ghost text-sm px-3 py-2">Today</button>
        </div>
      </div>

      {/* ── YEAR VIEW ── */}
      {view === 'year' && (
        <div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-5">
            {LEAVE_TYPES.map(t => (
              <div key={t.value} className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className={`w-3 h-3 rounded-sm ${LEAVE_COLOURS[t.value]}`} />
                {t.icon} {t.label}
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="w-3 h-3 rounded-full bg-red-300" />
              🚫 Blocked
            </div>
            {isAdmin && teamView && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-2">
                <div className="w-2 h-2 rounded-full bg-white border border-gray-400" />
                White dot = multiple staff
              </div>
            )}
          </div>

          {/* 12-month grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }, (_, m) => (
              <MiniMonth key={m} m={m} />
            ))}
          </div>

          {/* Selected day popover */}
          {selectedDay && (() => {
            const dayEntries  = entriesForDate(selectedDay)
            const dayBlocked  = isBlocked(selectedDay)
            return (
              <div className="fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-gray-100
                              w-80 p-5 z-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-oxford text-sm">
                    {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-GB', {
                      weekday:'long', day:'numeric', month:'long'
                    })}
                  </h3>
                  <button onClick={() => setSelectedDay(null)}
                          className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
                </div>
                {dayBlocked && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-semibold text-red-700">🚫 Blocked day</p>
                      {dayBlocked.reason && <p className="text-xs text-red-500">{dayBlocked.reason}</p>}
                    </div>
                    {isAdmin && (
                      <button onClick={() => removeBlockedDay(dayBlocked.id)}
                              className="text-xs text-red-400 hover:text-red-600">Remove</button>
                    )}
                  </div>
                )}
                {dayEntries.length === 0 && !dayBlocked && (
                  <p className="text-sm text-gray-400">No leave on this day.</p>
                )}
                <div className="space-y-2">
                  {dayEntries.map(e => {
                    const type   = LEAVE_TYPES.find(t => t.value === e.leave_type)
                    const colour = LEAVE_COLOURS[e.leave_type] || 'bg-gray-400'
                    return (
                      <div key={e.id} className="flex items-start gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${colour} mt-1 shrink-0`} />
                        <div>
                          {(isAdmin && teamView) && (
                            <p className="text-sm font-medium text-oxford">{e.name}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {type?.icon} {type?.label}
                            {e.status === 'pending' && <span className="text-amber-500"> (pending)</span>}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {isAdmin && !dayBlocked && (
                  <button onClick={() => setBlockModal(selectedDay)}
                          className="mt-3 w-full text-sm text-red-500 hover:text-red-700
                                     border border-red-200 rounded-lg py-1.5 transition-colors">
                    🚫 Block this day
                  </button>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* ── MONTH VIEW ── */}
      {view === 'month' && (
        <div className="flex gap-6">
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
                  ${d === 'Sat' || d === 'Sun' ? 'text-gray-400' : 'text-gray-600'}`}>{d}</div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
              {monthCells.map((cell, i) => {
                if (!cell) return <div key={i} className="bg-gray-50 min-h-[90px]" />
                const ds         = dateStr(cell)
                const dayEntries = entriesForDate(ds)
                const blocked    = isBlocked(ds)
                const weekend    = isWeekend(cell)
                const todayCell  = isToday(cell)
                const selected   = selectedDay === ds
                return (
                  <div key={i} onClick={() => setSelectedDay(selected ? null : ds)}
                       className={`min-h-[90px] p-1.5 cursor-pointer transition-colors
                         ${weekend ? 'bg-gray-50' : 'bg-white'}
                         ${blocked ? 'bg-red-50' : ''}
                         ${selected ? 'ring-2 ring-inset ring-oxford' : ''}
                         hover:bg-blue-50`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                        ${todayCell ? 'bg-oxford text-white' : weekend ? 'text-gray-400' : 'text-gray-700'}`}>
                        {cell.getDate()}
                      </span>
                      {blocked && <span className="text-xs text-red-500">🚫</span>}
                    </div>
                    <div className="space-y-0.5">
                      {dayEntries.slice(0, 3).map(e => {
                        const colour = LEAVE_COLOURS[e.leave_type] || 'bg-gray-400'
                        const type   = LEAVE_TYPES.find(t => t.value === e.leave_type)
                        const label  = (isAdmin && teamView)
                          ? `${type?.icon} ${e.name.split(' ')[0]}`
                          : `${type?.icon} ${type?.label}`
                        return (
                          <div key={e.id}
                               className={`${colour} text-white text-xs px-1.5 py-0.5 rounded truncate
                                 ${e.status === 'pending' ? 'opacity-60' : ''}`}
                               title={`${e.name} — ${type?.label}${e.status === 'pending' ? ' (pending)' : ''}`}>
                            {label}
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
            {selectedDay && (
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-oxford text-sm">
                    {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-GB', {
                      weekday:'long', day:'numeric', month:'long'
                    })}
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
                      {isAdmin && (
                        <button onClick={() => removeBlockedDay(selectedBlocked.id)}
                                className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
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
                            {(isAdmin && teamView) && (
                              <p className="text-sm font-medium text-oxford">{e.name}</p>
                            )}
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
                {isAdmin && !selectedBlocked && (
                  <button onClick={() => setBlockModal(selectedDay)}
                          className="mt-3 w-full text-sm text-red-500 hover:text-red-700 font-medium
                                     border border-red-200 hover:border-red-400 rounded-lg py-2 transition-colors">
                    🚫 Block this day
                  </button>
                )}
              </div>
            )}
            {isAdmin && (
              <div className="card">
                <h3 className="font-display font-semibold text-oxford mb-3 text-sm">Blocked days this month</h3>
                {blockedDays.filter(b => {
                  const d = new Date(b.date)
                  return d.getFullYear() === year && d.getMonth() === month
                }).length === 0 ? (
                  <p className="text-sm text-gray-400">None this month.</p>
                ) : (
                  <div className="space-y-2">
                    {blockedDays.filter(b => {
                      const d = new Date(b.date)
                      return d.getFullYear() === year && d.getMonth() === month
                    }).map(b => (
                      <div key={b.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium text-oxford">
                            {new Date(b.date + 'T12:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                          </span>
                          {b.reason && <span className="text-gray-500 ml-1.5 text-xs">— {b.reason}</span>}
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
      )}

      {/* Block day modal */}
      {blockModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
            <h2 className="font-display font-bold text-oxford text-xl mb-1">Block day</h2>
            <p className="text-gray-500 text-sm mb-5">
              {new Date(blockModal + 'T12:00:00').toLocaleDateString('en-GB', {
                weekday:'long', day:'numeric', month:'long', year:'numeric'
              })}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input className="input" placeholder="e.g. Company event, peak period"
                     value={blockReason} onChange={e => setBlockReason(e.target.value)} autoFocus />
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
