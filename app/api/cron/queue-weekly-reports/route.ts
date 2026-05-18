import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: users, error } = await admin.rpc('get_users_with_last_week_workouts')
  if (error) {
    Sentry.captureException(error)
    console.error('[cron/queue-weekly-reports] rpc error', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ success: true, queued: 0 })
  }

  let queued = 0
  for (const u of users) {
    const { error: sendError } = await admin.rpc('pgmq_send', {
      queue_name: 'weekly_reports',
      message: {
        userId: u.user_id,
        email: u.email,
        fullName: u.full_name,
        weekStart: u.week_start,
        weekEnd: u.week_end,
      },
    })
    if (sendError) {
      Sentry.captureException(sendError, { extra: { userId: u.user_id } })
      console.error('[cron/queue-weekly-reports] pgmq_send error', sendError)
    } else {
      queued++
    }
  }

  return NextResponse.json({ success: true, queued })
}
