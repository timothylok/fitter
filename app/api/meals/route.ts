import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@/lib/supabase-server'
import { computeDailySummary } from '@/lib/nutrition'

import type { MealItem } from '@/lib/types'

const itemSchema = z.object({
  food_name: z.string(),
  serving_qty: z.number(),
  serving_unit: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  sugar: z.number(),
  fiber: z.number(),
})

const mealSchema = z.object({
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  raw_input: z.string().min(1),
  items: z.array(itemSchema),
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
  const date = searchParams.get('date')

  let query = supabase
    .from('meals')
    .select('*, meal_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (date) {
    const start = `${date}T00:00:00.000Z`
    const end = `${date}T23:59:59.999Z`
    query = query.gte('created_at', start).lte('created_at', end)
  }

  const { data: meals, error } = await query
  if (error) {
    Sentry.captureException(error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  const { data: targetRow } = await supabase
    .from('user_daily_targets')
    .select('calorie_target')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const allItems: MealItem[] = (meals ?? []).flatMap((m: { meal_items?: MealItem[] }) => m.meal_items ?? [])
  const summary = computeDailySummary(allItems, targetRow?.calorie_target ?? 2000)

  return NextResponse.json({ success: true, data: { meals: meals ?? [], summary } })
}

export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = mealSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { data: meal, error: mealError } = await supabase
    .from('meals')
    .insert({ user_id: user.id, meal_type: parsed.data.meal_type, raw_input: parsed.data.raw_input, source: 'text' })
    .select()
    .single()

  if (mealError) {
    Sentry.captureException(mealError)
    return NextResponse.json({ success: false, error: mealError.message }, { status: 500 })
  }

  if (parsed.data.items.length > 0) {
    const { error: itemsError } = await supabase.from('meal_items').insert(
      parsed.data.items.map(item => ({ meal_id: meal.id, ...item }))
    )
    if (itemsError) {
      Sentry.captureException(itemsError)
      return NextResponse.json({ success: false, error: itemsError.message }, { status: 500 })
    }
  }

  const { data: fullMeal } = await supabase
    .from('meals')
    .select('*, meal_items(*)')
    .eq('id', meal.id)
    .single()

  return NextResponse.json({ success: true, data: fullMeal }, { status: 201 })
}
