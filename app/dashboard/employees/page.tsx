import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AddEmployeeButton from '@/components/AddEmployeeButton'
import EditEntitlementButton from '@/components/EditEntitlementButton'

export default async function EmployeesPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const year = new Date().getFullYear()

  const { data: profiles } = await supabase.from('profiles').select('*').order('name')
  const { data: entitlements } = await supabase.from('entitlements').select('*').eq('year', year)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-oxford text-3xl">Employees</h1>
          <p className="text-gray-500 mt-1">Manage staff accounts and entitlements</p>
        </div>
        <AddEmployeeButton />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Employee','Department','Role','Entitlement','Status',''].map(h => (
                <th key={h} className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(profiles || []).map((p: any) => {
              const ent = entitlements?.find((e: any) => e.user_id === p.id)
              const initials = p.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)
              return (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-oxford flex items-center justify-center
                                      font-display font-bold text-white text-xs shrink-0">
                        {initials}
                      </div>
                      <span className="font-medium text-oxford">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{p.department}</td>
                  <td className="px-5 py-4">
                    <span className={`badge ${p.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {p.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {ent ? `${ent.total_days} days` : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge ${p.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <EditEntitlementButton profile={p} entitlement={ent} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
