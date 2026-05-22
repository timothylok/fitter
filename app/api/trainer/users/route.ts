import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerClient } from '@/lib/supabase-server'

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7)
}

export async function GET(request: NextRequest) {
  const token = getToken(request)
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  // Verify the requesting user is authenticated
  const userClient = createServerClient(token)
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: prof } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (prof?.role !== 'trainer' && prof?.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const todayIso = new Date().toISOString().split('T')[0]
  const todayStart = `${todayIso}T00:00:00.000Z`
  const todayEnd = `${todayIso}T23:59:59.999Z`

  const [
    { data: users, error: usersError },
    { data: workouts, error: workoutsError },
    { data: rawUserAccs },
    { data: allAccs },
    { data: todayMeals },
    { data: targets },
  ] = await Promise.all([
    admin.from('profiles').select('id, name, email, goal_template, avatar_style, avatar_seed'),
    admin
      .from('workouts')
      .select('user_id, date')
      .gte('date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]),
    admin.from('user_accessories').select('user_id, accessory_id').gt('expires_at', new Date().toISOString()),
    admin.from('avatar_accessories').select('id, name, svg_url'),
    admin.from('meals').select('id, user_id, meal_items(calories)').gte('created_at', todayStart).lte('created_at', todayEnd),
    admin.from('user_daily_targets').select('user_id, calorie_target').order('updated_at', { ascending: false }),
  ])

  const accMap = new Map((allAccs ?? []).map(a => [a.id, a]))

  // calories consumed today per user
  const caloriesToday = new Map<string, number>()
  for (const meal of (todayMeals ?? []) as { id: string; user_id: string; meal_items: { calories: number }[] }[]) {
    const sum = (meal.meal_items ?? []).reduce((s, i) => s + i.calories, 0)
    caloriesToday.set(meal.user_id, (caloriesToday.get(meal.user_id) ?? 0) + sum)
  }

  // latest calorie target per user (first row per user_id after ordering desc)
  const targetMap = new Map<string, number>()
  for (const t of (targets ?? []) as { user_id: string; calorie_target: number }[]) {
    if (!targetMap.has(t.user_id)) targetMap.set(t.user_id, t.calorie_target)
  }

  if (usersError || workoutsError) {
    Sentry.captureException(usersError ?? workoutsError)
    console.error('[GET /api/trainer/users]', usersError ?? workoutsError)
    return NextResponse.json({ success: false, error: 'Failed to fetch data' }, { status: 500 })
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const weekAgoStr = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const atRiskStr = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0]

  const data = (users ?? []).map(u => {
    const uw = (workouts ?? []).filter(w => w.user_id === u.id)
    const thisWeek = uw.filter(w => w.date >= weekAgoStr && w.date <= todayStr)
    const sessionsThisWeek = new Set(thisWeek.map(w => w.date)).size
    const allDates = uw.map(w => w.date).sort()
    const lastWorkout = allDates[allDates.length - 1] ?? null
    const atRisk = !lastWorkout || lastWorkout < atRiskStr

    const accessories = ((rawUserAccs ?? []) as any[])
      .filter(a => a.user_id === u.id)
      .map(a => accMap.get(a.accessory_id))
      .filter(Boolean)
    const caloriesTodayVal = Math.round(caloriesToday.get(u.id) ?? 0)
    const calorieTarget = targetMap.has(u.id) ? Math.round(targetMap.get(u.id)!) : null
    return { id: u.id, name: u.name, email: u.email, goal_template: u.goal_template, avatar_style: u.avatar_style, avatar_seed: u.avatar_seed, sessionsThisWeek, lastWorkout, atRisk, accessories, caloriesToday: caloriesTodayVal, calorieTarget }
  })

  return NextResponse.json({ success: true, data })
}
