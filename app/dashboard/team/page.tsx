import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { LEAVE_TYPES, HOURS_PER_DAY, hoursToDisplay } from '@/lib/constants'

export default async function TeamPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const year = new Date().getFullYear()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('active', true)
    .order('name')

  const { data: entitlements } = await supabase
    .from('entitlements')
    .select('*')
    .eq('year', year)

  const { data: requests } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('status', 'approved')

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-oxford text-3xl">Team Overview</h1>
        <p className="text-gray-500 mt-1">{year} leave balances for all staff</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(profiles || []).map((p: any) => {
          const ent = entitlements?.find((e: any) => e.user_id === p.id)
          const totalHours = ((ent?.total_days || 28) + (ent?.carried_over || 0)) * HOURS_PER_DAY
          const usedHours  = (requests || [])
            .filter((r: any) => r.user_id === p.id &&
              LEAVE_TYPES.find(t => t.value === r.leave_type)?.deductible)
            .reduce((sum: number, r: any) => sum + r.hours, 0)
          const remainHours = totalHours - usedHours
          const pct = Math.min(100, Math.round((usedHours / totalHours) * 100))
          const initials = p.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)
          const pending = (requests || []).filter((r: any) => r.user_id === p.id && r.status === 'pending').length

          return (
            <div key={p.id} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-oxford flex items-center justify-center
                                font-display font-bold text-white text-sm shrink-0">
                  {initials}
                </div>
                <div>
                  <p className="font-semibold text-oxford">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.department} · {p.role}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Entitlement</span>
                  <span className="font-medium">{ent?.total_days || 28} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Used</span>
                  <span className="font-medium">{hoursToDisplay(usedHours)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Remaining</span>
                  <span className="font-semibold text-oxford">{hoursToDisplay(remainHours)}</span>
                </div>
              </div>

              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500
                  ${pct > 80 ? 'bg-red-400' : pct > 50 ? 'bg-amber-400' : 'bg-oxford'}`}
                     style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{pct}% used</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
