import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
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

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['user', 'trainer', 'admin']).optional(),
}).refine(d => d.name !== undefined || d.role !== undefined, { message: 'Nothing to update' })

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(request)
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const caller = await getAdminUser(token)
  if (!caller) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  if (id === caller.id) return NextResponse.json({ success: false, error: 'Cannot delete your own account' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)

  if (error) {
    Sentry.captureException(error)
    console.error('[DELETE /api/admin/users]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(request)
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const caller = await getAdminUser(token)
  if (!caller) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })

  const { id } = await params

  if (parsed.data.role && id === caller.id) {
    return NextResponse.json({ success: false, error: 'Cannot change your own role' }, { status: 400 })
  }

  const updates: Record<string, string> = {}
  if (parsed.data.name) updates.name = parsed.data.name
  if (parsed.data.role) updates.role = parsed.data.role

  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update(updates).eq('id', id)

  if (error) {
    Sentry.captureException(error)
    console.error('[PATCH /api/admin/users]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
