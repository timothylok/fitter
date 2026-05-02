export interface Workout {
  id: string
  user_id: string
  date: string
  exercise_name: string
  sets: number
  reps: number
  weight: number | null
  duration: number | null
  rpe: number | null
}

export interface User {
  id: string
  email: string
  name: string
  goal_template: GoalTemplate | null
  created_at: string
}

export type GoalTemplate = 'fat_loss' | 'strength' | 'conditioning'

export interface WeeklyKPIs {
  totalSets: number
  totalVolume: number
  frequency: number
  streak: number
  goalProgress: number
}
