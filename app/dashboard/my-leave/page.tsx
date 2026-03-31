import { createServerSupabase } from '@/lib/supabase-server'
import { LEAVE_TYPES, hoursToDisplay, statusColour } from '@/lib/constants'
import { LeaveRequest } from '@/types'
import CancelButton from '@/components/CancelButton'

export default async function MyLeavePage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: requests } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const grouped = (requests || []).reduce((acc: Record<string, LeaveRequest[]>, r: LeaveRequest) => {
    const year = new Date(r.start_date).getFullYear().toString()
    if (!acc[year]) acc[year] = []
    acc[year].push(r)
    return acc
  }, {})

  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a))

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-oxford text-3xl">My Leave</h1>
        <p className="text-gray-500 mt-1">Your full leave history</p>
      </div>

      {years.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <div className="text-4xl mb-2">📭</div>
          <p>No leave requests yet.</p>
        </div>
      ) : (
        years.map(year => (
          <div key={year} className="mb-8">
            <h2 className="font-display font-semibold text-oxford text-lg mb-3">{year}</h2>
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Type','Dates','Duration','Note','Status',''].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {grouped[year].map((r: LeaveRequest) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-oxford">
                        {LEAVE_TYPES.find(t => t.value === r.leave_type)?.label}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {new Date(r.start_date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                        {r.start_date !== r.end_date && (
                          <> – {new Date(r.end_date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}</>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-600">{hoursToDisplay(r.hours)}</td>
                      <td className="px-5 py-4 text-gray-500 max-w-xs truncate">{r.note || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`badge ${statusColour(r.status)}`}>{r.status}</span>
                      </td>
                      <td className="px-5 py-4">
                        {r.status === 'pending' && <CancelButton id={r.id} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
