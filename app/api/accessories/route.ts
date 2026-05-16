import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('avatar_accessories')
    .select('*')
    .order('name')

  if (error) {
    console.error('[GET /api/accessories]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
