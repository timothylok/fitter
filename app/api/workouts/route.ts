import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@/lib/supabase-server'

const workoutSchema = z.object({
  exercise_name: z.string().min(1),
  sets: z.number().int().positive(),
  reps: z.number().int().positive(),
  weight: z.number().positive().nullable().optional(),
  duration: z.number().positive().nullable().optional(),
  rpe: z.number().min(1).max(10).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7)
}

export async function GET(request: NextRequest) {
  const token = getToken(request)
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = supabase.from('workouts').select('*').eq('user_id', user.id).order('date', { ascending: false })
  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)

  const { data, error } = await query
  if (error) {
    Sentry.captureException(error)
    console.error('[GET /api/workouts]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
}

export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = workoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('workouts')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single()

  if (error) {
    Sentry.captureException(error)
    console.error('[POST /api/workouts]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data }, { status: 201 })
}
