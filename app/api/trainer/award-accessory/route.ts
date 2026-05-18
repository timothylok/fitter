import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerClient } from '@/lib/supabase-server'
import { calculateExpiration } from '@/lib/accessories'

const schema = z.object({
  userId: z.string().uuid(),
  accessoryId: z.string().uuid(),
})

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7)
}

export async function POST(req: NextRequest) {
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

  const body = schema.safeParse(await req.json())
  if (!body.success) {
    return NextResponse.json({ success: false, error: body.error.issues[0].message }, { status: 400 })
  }

  const { userId, accessoryId } = body.data
  const { error } = await admin.from('user_accessories').insert({
    user_id: userId,
    accessory_id: accessoryId,
    awarded_by: user.id,
    expires_at: calculateExpiration().toISOString(),
  })

  if (error) {
    Sentry.captureException(error, { extra: { userId, accessoryId } })
    console.error('[POST /api/trainer/award-accessory]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
