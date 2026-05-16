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

function toDateStr(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function computeWeeklyTrend(
  workouts: Workout[],
  weeks = 6
): { label: string; volume: number }[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Anchor to the most recent Monday so windows are calendar weeks (Mon–Sun)
  const dayOfWeek = today.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const currentMonday = new Date(today)
  currentMonday.setDate(today.getDate() - daysToMonday)

  return Array.from({ length: weeks }, (_, i) => {
    const weekStart = new Date(currentMonday)
    weekStart.setDate(currentMonday.getDate() - i * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const startStr = toDateStr(weekStart)
    // Current week ends today, not next Sunday
    const endStr = i === 0 ? toDateStr(today) : toDateStr(weekEnd)

    const volume = workouts
      .filter(w => w.date >= startStr && w.date <= endStr)
      .reduce((sum, w) => sum + w.sets * w.reps * (w.weight ?? 0), 0)

    const label = i === 0
      ? 'This week'
      : weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return { label, volume }
  }).reverse()
}
