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

export type UserRole = 'user' | 'trainer' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  goal_template: GoalTemplate | null
  username: string | null
  role: UserRole
  avatar_style?: string | null
  avatar_seed?: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type GoalTemplate = 'fat_loss' | 'strength' | 'conditioning'

export interface WeeklyKPIs {
  totalSets: number
  totalVolume: number
  frequency: number
  streak: number
  goalProgress: number
}
