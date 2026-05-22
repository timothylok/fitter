import type { ActivityLevel, MealItem, DailySummary } from '@/lib/types'

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  athlete: 1.9,
}

export function computeBMR(weight_kg: number, height_cm: number, age: number, gender: string): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age
  return gender === 'female' ? base - 161 : base + 5
}

export function computeTDEE(bmr: number, activity_level: ActivityLevel): number {
  return bmr * (ACTIVITY_MULTIPLIERS[activity_level] ?? 1.55)
}

export function computeCalorieTarget(tdee: number, deficit: number): number {
  return tdee - deficit
}

export function computeDailySummary(items: MealItem[], calorie_target: number): DailySummary {
  // Supabase returns numeric columns as strings; coerce to number before summing
  const total_calories = items.reduce((s, i) => s + Number(i.calories), 0)
  const total_protein = items.reduce((s, i) => s + Number(i.protein), 0)
  const total_carbs = items.reduce((s, i) => s + Number(i.carbs), 0)
  const total_fat = items.reduce((s, i) => s + Number(i.fat), 0)
  return {
    total_calories,
    total_protein,
    total_carbs,
    total_fat,
    remaining_calories: calorie_target - total_calories,
  }
}
