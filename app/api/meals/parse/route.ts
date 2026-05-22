import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@/lib/supabase-server'
import { parseMeal } from '@/lib/calorieNinjas'

const schema = z.object({ text: z.string().min(1) })

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7)
}

export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 })
  }

  try {
    const items = await parseMeal(parsed.data.text)
    return NextResponse.json({ success: true, data: items })
  } catch (err) {
    Sentry.captureException(err)
    console.error('[POST /api/meals/parse]', err)
    return NextResponse.json({ success: false, error: 'Failed to parse meal nutrition' }, { status: 502 })
  }
}
