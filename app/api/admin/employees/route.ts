import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: admin } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (admin?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, email, role, department, total_days } = await req.json()

  // Create auth user — Supabase sends invite email automatically
  const adminClient = createAdminSupabase()
  const { data: newUser, error: authError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { name, role, department }
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  // Update entitlement for current year
  const year = new Date().getFullYear()
  await adminClient.from('entitlements')
    .upsert({ user_id: newUser.user.id, year, total_days: Number(total_days), bank_holidays: 8, carried_over: 0 })

  return NextResponse.json({ success: true })
}
