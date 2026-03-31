import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { LEAVE_TYPES, hoursToDisplay, statusColour } from '@/lib/constants'
import { LeaveRequest, Profile } from '@/types'
import ApproveButtons from '@/components/ApproveButtons'

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: { filter?: string }
}) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const filter = searchParams.filter || 'pending'

  const query = supabase
    .from('leave_requests')
    .select('*, profile:profiles!leave_requests_user_id_fkey(*)')
    .order('created_at', { ascending: false })

  if (filter !== 'all') query.eq('status', filter)

  const { data: requests } = await query

  const counts = {
    pending:  (requests || []).filter((r: any) => r.status === 'pending').length,
    approved: (requests || []).filter((r: any) => r.status === 'approved').length,
    rejected: (requests || []).filter((r: any) => r.status === 'rejected').length,
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-oxford text-3xl">Approvals</h1>
        <p className="text-gray-500 mt-1">Review and action leave requests</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { value: 'pending',  label: 'Pending',  count: counts.pending },
          { value: 'approved', label: 'Approved', count: counts.approved },
          { value: 'rejected', label: 'Rejected', count: counts.rejected },
          { value: 'all',      label: 'All',      count: null },
        ].map(tab => (
          <a key={tab.value} href={`?filter=${tab.value}`}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
               ${filter === tab.value ? 'bg-oxford text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
            {tab.label}
            {tab.count !== null && (
              <span className={`text-xs rounded-full px-2 py-0.5
                ${filter === tab.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {tab.count}
              </span>
            )}
          </a>
        ))}
      </div>

      {/* Requests */}
      {!requests?.length ? (
        <div className="card text-center py-16 text-gray-400">
          <div className="text-4xl mb-2">✓</div>
          <p>No {filter === 'all' ? '' : filter} requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r: any) => (
            <div key={r.id} className="card flex items-start gap-4">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-oxford flex items-center justify-center
                              font-display font-bold text-white text-sm shrink-0">
                {r.profile?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-oxford">{r.profile?.name}</span>
                  <span className="text-gray-400 text-sm">{r.profile?.department}</span>
                  <span className={`badge ${statusColour(r.status)}`}>{r.status}</span>
                </div>
                <p className="text-sm text-gray-700 mt-0.5">
                  <strong>{LEAVE_TYPES.find(t => t.value === r.leave_type)?.label}</strong>
                  {' · '}
                  {new Date(r.start_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                  {r.start_date !== r.end_date && (
                    <> – {new Date(r.end_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</>
                  )}
                  {' · '}{hoursToDisplay(r.hours)}
                </p>
                {r.note && <p className="text-sm text-gray-500 mt-1 italic">"{r.note}"</p>}
                <p className="text-xs text-gray-400 mt-1">
                  Submitted {new Date(r.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                </p>
              </div>

              {/* Actions */}
              {r.status === 'pending' && (
                <ApproveButtons requestId={r.id} employeeName={r.profile?.name} employeeEmail={r.profile?.email} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
