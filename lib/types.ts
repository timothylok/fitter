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

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'athlete'

export interface UserDailyTarget {
  id: string
  user_id: string
  bmr: number
  tdee: number
  calorie_target: number
  deficit: number
  created_at: string
  updated_at: string
}

export interface Meal {
  id: string
  user_id: string
  meal_type: string
  raw_input: string
  source: string
  created_at: string
  meal_items?: MealItem[]
}

export interface MealItem {
  id: string
  meal_id: string
  food_name: string
  serving_qty: number | null
  serving_unit: string | null
  calories: number
  protein: number
  carbs: number
  fat: number
  sugar: number | null
  fiber: number | null
  brand: string | null
  created_at: string
}

export interface DailySummary {
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  remaining_calories: number
}
