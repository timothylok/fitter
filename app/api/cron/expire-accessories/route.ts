import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { error, count } = await admin
    .from('user_accessories')
    .delete({ count: 'exact' })
    .lt('expires_at', new Date().toISOString())

  if (error) {
    Sentry.captureException(error)
    console.error('[cron/expire-accessories]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, deleted: count })
}
