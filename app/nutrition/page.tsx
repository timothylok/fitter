'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import Spinner from '@/components/Spinner'
import type { Meal, DailySummary } from '@/lib/types'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

function todayDate() {
  return new Date().toISOString().split('T')[0]
}

function MacroBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0
  return (
    <div className="flex-1 space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span>{Math.round(value)}g</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function NutritionPage() {
  const router = useRouter()
  const [meals, setMeals] = useState<Meal[]>([])
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [calorieTarget, setCalorieTarget] = useState<number>(2000)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchData = useCallback(async (token: string) => {
    const [mealsRes, targetRes] = await Promise.all([
      fetch(`/api/meals?date=${todayDate()}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/nutrition/target', { headers: { Authorization: `Bearer ${token}` } }),
    ])

    const mealsJson = await mealsRes.json()
    if (mealsJson.success) {
      setMeals(mealsJson.data.meals)
      setSummary(mealsJson.data.summary)
    }

    const targetJson = await targetRes.json()
    if (targetJson.success && targetJson.data) {
      setCalorieTarget(Math.round(targetJson.data.calorie_target))
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      await fetchData(session.access_token)
      setLoading(false)
    })
  }, [router, fetchData])

  async function handleDelete(mealId: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    setDeletingId(mealId)
    await fetch(`/api/meals/${mealId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    await fetchData(session.access_token)
    setDeletingId(null)
  }

  function handleAdd(mealType: string) {
    router.push(`/nutrition/add?type=${mealType}`)
  }

  if (loading) return <Spinner />

  const consumed = summary?.total_calories ?? 0
  const remaining = summary?.remaining_calories ?? calorieTarget
  const ringPct = calorieTarget > 0 ? Math.min(100, Math.round((consumed / calorieTarget) * 100)) : 0
  const totalMacros = (summary?.total_protein ?? 0) + (summary?.total_carbs ?? 0) + (summary?.total_fat ?? 0)

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        <h1 className="text-2xl font-semibold">Nutrition</h1>

        {/* Calorie summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center gap-6">
            {/* Ring */}
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke="#111827" strokeWidth="3"
                  strokeDasharray={`${ringPct} ${100 - ringPct}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">{ringPct}%</span>
            </div>

            <div className="space-y-1">
              <p className="text-3xl font-bold">{Math.round(consumed)}</p>
              <p className="text-sm text-gray-500">of {calorieTarget} kcal target</p>
              <p className={`text-sm font-medium ${remaining < 0 ? 'text-red-500' : 'text-green-600'}`}>
                {remaining < 0 ? `${Math.abs(Math.round(remaining))} kcal over` : `${Math.round(remaining)} kcal remaining`}
              </p>
            </div>
          </div>

          {/* Macro bars */}
          {summary && (
            <div className="flex gap-4">
              <MacroBar label="Protein" value={summary.total_protein} total={totalMacros} color="bg-blue-500" />
              <MacroBar label="Carbs" value={summary.total_carbs} total={totalMacros} color="bg-yellow-400" />
              <MacroBar label="Fat" value={summary.total_fat} total={totalMacros} color="bg-orange-400" />
            </div>
          )}
        </div>

        {/* Meal sections */}
        {MEAL_TYPES.map(type => {
          const typeMeals = meals.filter(m => m.meal_type === type)
          return (
            <div key={type} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-medium capitalize">{type}</span>
                <button
                  onClick={() => handleAdd(type)}
                  className="text-xs text-gray-500 hover:text-gray-900 transition-colors px-2 py-1 rounded hover:bg-gray-50"
                >
                  + Add
                </button>
              </div>

              {typeMeals.length === 0 ? (
                <p className="text-xs text-gray-400 px-4 py-3">Nothing logged yet</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {typeMeals.map(meal => {
                    const mealCals = (meal.meal_items ?? []).reduce((s, i) => s + i.calories, 0)
                    return (
                      <li key={meal.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1 min-w-0">
                            <p className="text-sm text-gray-700 truncate">{meal.raw_input}</p>
                            <div className="flex flex-wrap gap-2">
                              {(meal.meal_items ?? []).map(item => (
                                <span key={item.id} className="text-xs text-gray-500">
                                  {item.food_name} · {Math.round(item.calories)} kcal
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right shrink-0 space-y-1">
                            <p className="text-sm font-medium">{Math.round(mealCals)} kcal</p>
                            <button
                              onClick={() => handleDelete(meal.id)}
                              disabled={deletingId === meal.id}
                              className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40"
                            >
                              {deletingId === meal.id ? '…' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}

      </div>
      <BottomNav />
    </main>
  )
}
