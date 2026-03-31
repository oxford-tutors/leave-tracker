import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { sendLeaveRequestEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { leave_type, start_date, end_date, hours, note } = body

  if (!leave_type || !start_date || !end_date || !hours)
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })

  const { data, error } = await supabase.from('leave_requests').insert({
    user_id: user.id, leave_type, start_date, end_date, hours, note: note || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify admins by email
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: admins }  = await supabase.from('profiles').select('*').eq('role', 'admin').eq('active', true)

  await sendLeaveRequestEmail({ request: data, employee: profile, adminEmails: (admins || []).map((a: any) => user.email!) })

  return NextResponse.json({ success: true, data })
}
