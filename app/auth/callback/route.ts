import { NextRequest, NextResponse } from 'next/server'

// Supabase appends the session as a fragment (#access_token=...) on magic link clicks.
// The browser client handles this automatically — just redirect to dashboard.
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/dashboard`)
}
