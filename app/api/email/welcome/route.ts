import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerClient } from '@/lib/supabase-server'
import { resend } from '@/lib/resend'
import WelcomeEmail from '@/emails/WelcomeEmail'

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7)
}

export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const userClient = createServerClient(token)
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Atomic claim: only updates the row if welcome_email_sent_at is still null.
  // If the row was already claimed (email already sent), returns 0 rows → skip.
  const { data, error } = await admin
    .from('profiles')
    .update({ welcome_email_sent_at: new Date().toISOString() })
    .eq('id', user.id)
    .is('welcome_email_sent_at', null)
    .select('email, name')

  if (error) {
    Sentry.captureException(error)
    console.error('[POST /api/email/welcome] db error', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ success: true, skipped: true })
  }

  const { email, name } = data[0]

  const { error: sendError } = await resend.emails.send({
    from: 'Tim Lok <tim@fittertrack.com>',
    to: email,
    subject: 'Welcome to fittertrack.com',
    html: WelcomeEmail(),
  })

  if (sendError) {
    Sentry.captureException(sendError)
    console.error('[POST /api/email/welcome] resend error', sendError)
    return NextResponse.json({ success: false, error: sendError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
