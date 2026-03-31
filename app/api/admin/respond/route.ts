import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { sendLeaveDecisionEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: admin } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (admin?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, action } = await req.json()
  if (!['approved','rejected'].includes(action))
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const { data: request, error } = await supabase
    .from('leave_requests')
    .update({ status: action, responded_at: new Date().toISOString(), responded_by: user.id })
    .eq('id', id)
    .eq('status', 'pending')
    .select('*, profile:profiles!leave_requests_user_id_fkey(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get employee's auth email from admin client
  const { createAdminSupabase } = await import('@/lib/supabase-server')
  const adminClient = createAdminSupabase()
  const { data: { users } } = await adminClient.auth.admin.listUsers()
  const empUser = users.find((u: any) => u.id === request.user_id)

  if (empUser?.email) {
    await sendLeaveDecisionEmail({
      request,
      employee: request.profile,
      employeeEmail: empUser.email,
      action,
      adminName: admin.name,
    })
  }

  return NextResponse.json({ success: true })
}
