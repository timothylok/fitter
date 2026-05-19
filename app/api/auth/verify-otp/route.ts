import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase-admin'
import { verifyOtpHash } from '@/lib/otp'

const GENERIC_ERROR = 'Invalid code or code expired'

const schema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 400 })
  }

  const email = parsed.data.email.trim().toLowerCase()
  const { otp } = parsed.data
  const admin = createAdminClient()

  // Fetch the most recent non-expired OTP with remaining attempts
  const { data: rows, error: fetchError } = await admin
    .from('email_otps')
    .select('id, hashed_otp, attempts_remaining')
    .eq('email', email)
    .gt('expires_at', new Date().toISOString())
    .gt('attempts_remaining', 0)
    .order('created_at', { ascending: false })
    .limit(1)

  if (fetchError) {
    Sentry.captureException(fetchError)
    console.error('[POST /api/auth/verify-otp] fetch error', fetchError)
    return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 500 })
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 400 })
  }

  const row = rows[0]
  const isMatch = await verifyOtpHash(otp, row.hashed_otp)

  if (!isMatch) {
    const { error: decrementError } = await admin
      .from('email_otps')
      .update({ attempts_remaining: row.attempts_remaining - 1 })
      .eq('id', row.id)

    if (decrementError) {
      Sentry.captureException(decrementError)
      console.error('[POST /api/auth/verify-otp] decrement error', decrementError)
    }

    return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 400 })
  }

  // OTP matched — delete the row immediately (single-use)
  const { error: deleteError } = await admin
    .from('email_otps')
    .delete()
    .eq('id', row.id)

  if (deleteError) {
    Sentry.captureException(deleteError)
    console.error('[POST /api/auth/verify-otp] delete error', deleteError)
    // Non-fatal — continue to session creation
  }

  // Check if this email already has a Supabase user (via profiles table)
  const { data: profileRows, error: profileError } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .limit(1)

  if (profileError) {
    Sentry.captureException(profileError)
    console.error('[POST /api/auth/verify-otp] profile lookup error', profileError)
    return NextResponse.json(
      { success: false, error: 'Authentication failed. Please try again.' },
      { status: 500 }
    )
  }

  const userExists = profileRows && profileRows.length > 0

  if (!userExists) {
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    })

    // "already been registered" means user exists in auth.users but has no profile yet — that's fine
    if (createError && !createError.message.includes('already been registered')) {
      Sentry.captureException(createError)
      console.error('[POST /api/auth/verify-otp] createUser error', createError)
      return NextResponse.json(
        { success: false, error: 'Authentication failed. Please try again.' },
        { status: 500 }
      )
    }
  }

  // Generate a token_hash the client can exchange for a real Supabase session.
  // The hashed_token is returned in JSON — no URL, nothing for Outlook to scan.
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    Sentry.captureException(linkError ?? new Error('generateLink returned no token'))
    console.error('[POST /api/auth/verify-otp] generateLink error', linkError)
    return NextResponse.json(
      { success: false, error: 'Authentication failed. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    token_hash: linkData.properties.hashed_token,
    type: 'email',
  })
}
