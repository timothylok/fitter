import { NextRequest, NextResponse } from 'next/server'
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

  const [{ data: users, error: usersError }, { data: workouts, error: workoutsError }] =
    await Promise.all([
      admin.from('profiles').select('id, name, email, goal_template'),
      admin
        .from('workouts')
        .select('user_id, date')
        .gte('date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]),
    ])

  if (usersError || workoutsError) {
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

    return { id: u.id, name: u.name, email: u.email, goal_template: u.goal_template, sessionsThisWeek, lastWorkout, atRisk }
  })

  return NextResponse.json({ success: true, data })
}
