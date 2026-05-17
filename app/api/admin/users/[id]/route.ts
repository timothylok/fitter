import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
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

const patchSchema = z.object({ name: z.string().min(1).max(100) })

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(request)
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  if (!await getAdminUser(token)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid name' }, { status: 400 })

  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ name: parsed.data.name })
    .eq('id', id)

  if (error) {
    console.error('[PATCH /api/admin/users]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
