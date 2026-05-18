import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase-admin'
import { resend } from '@/lib/resend'
import { computeWeeklyKPIs } from '@/lib/kpi'
import WeeklyReportEmail from '@/emails/WeeklyReportEmail'
import type { Workout } from '@/lib/types'

interface QueuePayload {
  userId: string
  email: string
  fullName: string
  weekStart: string
  weekEnd: string
}

interface PgmqMessage {
  msg_id: number
  message: QueuePayload
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: messages, error: readError } = await admin.rpc('pgmq_read', {
    queue_name: 'weekly_reports',
    vt: 30,
    lim: 10,
  })

  if (readError) {
    Sentry.captureException(readError)
    console.error('[cron/weekly-report-worker] pgmq_read error', readError)
    return NextResponse.json({ success: false, error: readError.message }, { status: 500 })
  }

  if (!messages || messages.length === 0) {
    return NextResponse.json({ success: true, processed: 0 })
  }

  let processed = 0

  for (const msg of messages as PgmqMessage[]) {
    const { userId, email, fullName, weekStart, weekEnd } = msg.message

    const { data: workouts, error: workoutsError } = await admin
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .gte('date', weekStart)
      .lte('date', weekEnd)

    if (workoutsError) {
      Sentry.captureException(workoutsError, { extra: { userId } })
      console.error('[cron/weekly-report-worker] workouts fetch error', workoutsError)
      continue
    }

    const kpis = computeWeeklyKPIs((workouts ?? []) as Workout[])

    const { error: sendError } = await resend.emails.send({
      from: 'Tim Lok <tim@fittertrack.com>',
      to: email,
      subject: `Your weekly workout summary — ${weekStart}`,
      html: WeeklyReportEmail({ name: fullName, weekStart, weekEnd, kpis }),
    })

    if (sendError) {
      Sentry.captureException(sendError, { extra: { userId, email } })
      console.error('[cron/weekly-report-worker] resend error', sendError)
      continue
    }

    const { error: archiveError } = await admin.rpc('pgmq_archive', {
      queue_name: 'weekly_reports',
      msg_id: msg.msg_id,
    })

    if (archiveError) {
      Sentry.captureException(archiveError, { extra: { msgId: msg.msg_id } })
      console.error('[cron/weekly-report-worker] pgmq_archive error', archiveError)
    }

    processed++
  }

  return NextResponse.json({ success: true, processed })
}
