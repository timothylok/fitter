import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerClient } from '@/lib/supabase-server'

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7)
}

async function getAdminUser(token: string) {
  const userClient = createServerClient(token)
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (data?.role !== 'admin') return null
  return user
}

export async function GET(request: NextRequest) {
  const token = getToken(request)
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  if (!await getAdminUser(token)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const [{ data: users }, { data: trainers }, { data: admins }, { data: assignments }] = await Promise.all([
    admin.from('profiles').select('id, name, email, avatar_style, avatar_seed').eq('role', 'user').order('name'),
    admin.from('profiles').select('id, name, email, avatar_style, avatar_seed').eq('role', 'trainer').order('name'),
    admin.from('profiles').select('id, name, email, avatar_style, avatar_seed').eq('role', 'admin').order('name'),
    admin.from('trainer_assignments').select('id, user_id, trainer_id'),
  ])

  return NextResponse.json({
    success: true,
    data: { users: users ?? [], trainers: trainers ?? [], admins: admins ?? [], assignments: assignments ?? [] },
  })
}

export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const adminUser = await getAdminUser(token)
  if (!adminUser) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  const { user_id, trainer_id } = await request.json()
  if (!user_id || !trainer_id) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('trainer_assignments')
    .insert({ user_id, trainer_id, assigned_by: adminUser.id })
    .select()
    .single()

  if (error) {
    Sentry.captureException(error)
    console.error('[POST /api/admin/assignments]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data }, { status: 201 })
}
