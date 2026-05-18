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

  const [{ data: users, error: usersError }, { data: workouts, error: workoutsError }, { data: rawUserAccs }, { data: allAccs }] =
    await Promise.all([
      admin.from('profiles').select('id, name, email, goal_template, avatar_style, avatar_seed'),
      admin
        .from('workouts')
        .select('user_id, date')
        .gte('date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]),
      admin.from('user_accessories').select('user_id, accessory_id').gt('expires_at', new Date().toISOString()),
      admin.from('avatar_accessories').select('id, name, svg_url'),
    ])

  const accMap = new Map((allAccs ?? []).map(a => [a.id, a]))

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
    return { id: u.id, name: u.name, email: u.email, goal_template: u.goal_template, avatar_style: u.avatar_style, avatar_seed: u.avatar_seed, sessionsThisWeek, lastWorkout, atRisk, accessories }
  })

  return NextResponse.json({ success: true, data })
}
