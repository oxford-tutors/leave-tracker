import { createServerSupabase } from '@/lib/supabase-server'
import { LEAVE_TYPES, HOURS_PER_DAY, hoursToDisplay, statusColour } from '@/lib/constants'
import { LeaveRequest } from '@/types'

export default async function DashboardPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const year = new Date().getFullYear()

  const [{ data: profile }, { data: entitlement }, { data: requests }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('entitlements').select('*').eq('user_id', user.id).eq('year', year).single(),
    supabase.from('leave_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
  ])

  const hoursUsed = (requests || [])
    .filter((r: LeaveRequest) => r.status === 'approved' &&
      LEAVE_TYPES.find(t => t.value === r.leave_type)?.deductible)
    .reduce((sum: number, r: LeaveRequest) => sum + r.hours, 0)

  const totalHours    = ((entitlement?.total_days || 28) + (entitlement?.carried_over || 0)) * HOURS_PER_DAY
  const remainingHours = totalHours - hoursUsed
  const usedPct        = Math.min(100, Math.round((hoursUsed / totalHours) * 100))

  const pending = (requests || []).filter((r: LeaveRequest) => r.status === 'pending').length
  const upcoming = (requests || []).filter((r: LeaveRequest) =>
    r.status === 'approved' && new Date(r.start_date) >= new Date())

  const hour   = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.name?.split(' ')[0] || 'there'

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const now = new Date()
  const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-oxford text-3xl">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-gray-500 mt-1">{dateStr}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Entitlement" value={`${entitlement?.total_days || 28} days`}
                  sub={`incl. ${entitlement?.carried_over || 0} carried over`} icon="📋" />
        <StatCard label="Days Used" value={hoursToDisplay(hoursUsed)}
                  sub={`${hoursUsed} hours`} icon="✓" />
        <StatCard label="Days Remaining" value={hoursToDisplay(remainingHours)}
                  sub={`${remainingHours} hours`} icon="⏳" />
        <StatCard label="Pending Requests" value={String(pending)}
                  sub="awaiting approval" icon="🕐" />
      </div>

      {/* Balance bar */}
      <div className="card mb-6">
        <h2 className="font-display font-semibold text-oxford text-lg mb-4">Annual Leave Balance</h2>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-oxford rounded-full transition-all duration-500"
               style={{ width: `${usedPct}%` }} />
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>{entitlement?.total_days || 28} base · {entitlement?.bank_holidays || 8} bank holidays · {entitlement?.carried_over || 0} carried over</span>
          <span className="font-semibold text-oxford">
            {hoursToDisplay(remainingHours)} remaining ({remainingHours} hours)
          </span>
        </div>
      </div>

      {/* Upcoming leave */}
      <div className="card">
        <h2 className="font-display font-semibold text-oxford text-lg mb-4">My Upcoming Leave</h2>
        {upcoming.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-4xl mb-2">📭</div>
            <p>No upcoming leave booked.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((r: LeaveRequest) => (
              <div key={r.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-oxford">
                    {LEAVE_TYPES.find(t => t.value === r.leave_type)?.label}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(r.start_date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                    {r.start_date !== r.end_date && ` – ${new Date(r.end_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}`}
                    {' · '}{hoursToDisplay(r.hours)}
                  </p>
                </div>
                <span className={`badge ${statusColour(r.status)}`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: string }) {
  return (
    <div className="card">
      <div className="flex justify-between items-start mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="font-display font-bold text-oxford text-2xl">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}
