import { Workout, WeeklyKPIs, GoalTemplate } from './types'

const GOAL_SESSION_TARGETS: Record<GoalTemplate, number> = {
  fat_loss: 4,
  strength: 3,
  conditioning: 3,
}

export function computeWeeklyKPIs(workouts: Workout[], goalTemplate?: GoalTemplate | null): WeeklyKPIs {
  const totalSets = workouts.reduce((sum, w) => sum + w.sets, 0)
  const totalVolume = workouts.reduce(
    (sum, w) => sum + w.sets * w.reps * (w.weight ?? 0),
    0
  )
  const frequency = new Set(workouts.map(w => w.date)).size
  const streak = computeStreak(workouts)
  const goalProgress = computeGoalProgress(workouts, goalTemplate)
  return { totalSets, totalVolume, frequency, streak, goalProgress }
}

function computeStreak(workouts: Workout[]): number {
  if (workouts.length === 0) return 0
  const dates = [...new Set(workouts.map(w => w.date))].sort().reverse()
  let streak = 0
  let current = new Date()
  current.setHours(0, 0, 0, 0)

  for (const date of dates) {
    const d = new Date(date + 'T00:00:00')
    const diffDays = Math.round((current.getTime() - d.getTime()) / 86400000)
    if (diffDays <= 1) {
      streak++
      current = d
    } else {
      break
    }
  }
  return streak
}

function computeGoalProgress(workouts: Workout[], goalTemplate?: GoalTemplate | null): number {
  const target = goalTemplate ? GOAL_SESSION_TARGETS[goalTemplate] : 3
  const frequency = new Set(workouts.map(w => w.date)).size
  return Math.min(100, Math.round((frequency / target) * 100))
}

export function computeWeeklyTrend(
  workouts: Workout[],
  weeks = 6
): { label: string; volume: number }[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: weeks }, (_, i) => {
    const weekEnd = new Date(today)
    weekEnd.setDate(today.getDate() - i * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekEnd.getDate() - 6)

    const endStr = weekEnd.toISOString().split('T')[0]
    const startStr = weekStart.toISOString().split('T')[0]

    const volume = workouts
      .filter(w => w.date >= startStr && w.date <= endStr)
      .reduce((sum, w) => sum + w.sets * w.reps * (w.weight ?? 0), 0)

    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return { label, volume }
  }).reverse()
}
