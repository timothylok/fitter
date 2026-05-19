import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { z } from 'zod'

function getToken(req: NextRequest) {
  return req.headers.get('authorization')?.replace('Bearer ', '') ?? null
}

export async function GET(request: NextRequest) {
  const token = getToken(request)
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const supabase = createServerClient(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const date = request.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ success: false, error: 'date required' }, { status: 400 })

  const { data, error } = await supabase
    .from('workout_feelings')
    .select('feeling')
    .eq('user_id', user.id)
    .eq('date', date)
    .maybeSingle()

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

const feelingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  feeling: z.enum(['too_hard', 'just_right', 'crushed_it']),
})

export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const supabase = createServerClient(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = feelingSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 })

  const { data, error } = await supabase
    .from('workout_feelings')
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: 'user_id,date' })
    .select()
    .single()

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}
