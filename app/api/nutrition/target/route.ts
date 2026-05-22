import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@/lib/supabase-server'
import { computeBMR, computeTDEE, computeCalorieTarget } from '@/lib/nutrition'
import type { ActivityLevel } from '@/lib/types'

const targetSchema = z.object({
  weight_kg: z.number().positive(),
  height_cm: z.number().positive(),
  age: z.number().int().positive(),
  gender: z.enum(['male', 'female']),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'very_active', 'athlete']),
  deficit: z.number().min(0).max(1000),
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

  const { data, error } = await supabase
    .from('user_daily_targets')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    Sentry.captureException(error)
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
  const parsed = targetSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { weight_kg, height_cm, age, gender, activity_level, deficit } = parsed.data
  const bmr = computeBMR(weight_kg, height_cm, age, gender)
  const tdee = computeTDEE(bmr, activity_level as ActivityLevel)
  const calorie_target = computeCalorieTarget(tdee, deficit)

  const { data: existing } = await supabase
    .from('user_daily_targets')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  let result
  if (existing) {
    result = await supabase
      .from('user_daily_targets')
      .update({ bmr, tdee, calorie_target, deficit, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
  } else {
    result = await supabase
      .from('user_daily_targets')
      .insert({ user_id: user.id, bmr, tdee, calorie_target, deficit })
      .select()
      .single()
  }

  if (result.error) {
    Sentry.captureException(result.error)
    return NextResponse.json({ success: false, error: result.error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data: result.data }, { status: 201 })
}
