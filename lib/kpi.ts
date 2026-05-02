import { Workout, WeeklyKPIs } from './types'

export function computeWeeklyKPIs(workouts: Workout[]): WeeklyKPIs {
  const totalSets = workouts.reduce((sum, w) => sum + w.sets, 0)
  const totalVolume = workouts.reduce(
    (sum, w) => sum + w.sets * w.reps * (w.weight ?? 0),
    0
  )
  const frequency = new Set(workouts.map(w => w.date)).size
  const streak = computeStreak(workouts)
  const goalProgress = computeGoalProgress(workouts)
  return { totalSets, totalVolume, frequency, streak, goalProgress }
}

function computeStreak(workouts: Workout[]): number {
  if (workouts.length === 0) return 0
  const dates = [...new Set(workouts.map(w => w.date))].sort().reverse()
  let streak = 0
  let current = new Date()
  current.setHours(0, 0, 0, 0)

  for (const date of dates) {
    const d = new Date(date)
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

function computeGoalProgress(workouts: Workout[]): number {
  // Returns 0–100 based on frequency vs a 3-session/week target
  const frequency = new Set(workouts.map(w => w.date)).size
  return Math.min(100, Math.round((frequency / 3) * 100))
}
