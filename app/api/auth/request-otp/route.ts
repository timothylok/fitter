import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase-admin'
import { generateOtp, hashOtp } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/sendOtpEmail'

// ---------------------------------------------------------------------------
// In-memory rate limiter — 5 requests per 15-minute window per IP.
//
// PRODUCTION NOTE: This Map is per-process and resets on cold starts. It does
// not share state across Vercel instances. For production, replace checkRateLimit
// with an atomic Vercel KV (Upstash Redis) INCR + EXPIRE call.
// ---------------------------------------------------------------------------
interface RateLimitEntry {
  count: number
  resetAt: number
}
const rateLimitMap = new Map<string, RateLimitEntry>()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

const schema = z.object({
  email: z.string().email(),
})

const OTP_TTL_MINUTES = 10

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  // Rate-limited callers still receive success to avoid an oracle
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ success: true })
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid email address' },
      { status: 400 }
    )
  }

  const email = parsed.data.email.trim().toLowerCase()
  const otp = generateOtp()
  const hashed = await hashOtp(otp)
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString()

  const admin = createAdminClient()

  // Delete any existing OTP rows for this email — one active OTP per address
  const { error: deleteError } = await admin
    .from('email_otps')
    .delete()
    .eq('email', email)

  if (deleteError) {
    Sentry.captureException(deleteError)
    console.error('[POST /api/auth/request-otp] delete error', deleteError)
    // Non-fatal; insert will still succeed
  }

  const { error: insertError } = await admin.from('email_otps').insert({
    email,
    hashed_otp: hashed,
    expires_at: expiresAt,
    attempts_remaining: 5,
  })

  if (insertError) {
    Sentry.captureException(insertError)
    console.error('[POST /api/auth/request-otp] insert error', insertError)
    return NextResponse.json({ success: true }) // Generic response; do not leak DB errors
  }

  const { error: emailError } = await sendOtpEmail(email, otp)

  if (emailError) {
    Sentry.captureException(new Error(emailError))
    console.error('[POST /api/auth/request-otp] email error', emailError)
    // OTP is stored; user can retry. Still return generic success.
  }

  return NextResponse.json({ success: true })
}
