import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: admin } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (admin?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { user_id, total_days, bank_holidays, carried_over } = await req.json()
  const year = new Date().getFullYear()

  const { error } = await supabase.from('entitlements').upsert({
    user_id,
    year,
    total_days:    Number(total_days),
    bank_holidays: Number(bank_holidays),
    carried_over:  Number(carried_over),
  }, { onConflict: 'user_id,year' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
