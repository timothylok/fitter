import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerClient } from '@/lib/supabase-server'

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7)
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const userClient = createServerClient(token)
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: prof } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (prof?.role !== 'trainer' && prof?.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const { id: userId } = await params

  const [{ data: profile }, { data: rawUserAccs }, { data: allAccs }] = await Promise.all([
    admin.from('profiles').select('name, avatar_style, avatar_seed').eq('id', userId).single(),
    admin.from('user_accessories').select('accessory_id').eq('user_id', userId),
    admin.from('avatar_accessories').select('id, name, svg_url, rarity'),
  ])

  const accMap = new Map((allAccs ?? []).map(a => [a.id, a]))
  const accessories = (rawUserAccs ?? [])
    .map(ua => accMap.get(ua.accessory_id))
    .filter(Boolean)

  return NextResponse.json({ success: true, data: { profile, accessories } })
}
