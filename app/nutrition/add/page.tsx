'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Spinner from '@/components/Spinner'
import type { ParsedFoodItem } from '@/lib/calorieNinjas'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

// Scale all macros proportionally when user changes qty
function scaleItem(base: ParsedFoodItem, newQty: number): ParsedFoodItem {
  const ratio = base.serving_qty > 0 ? newQty / base.serving_qty : 0
  return {
    ...base,
    serving_qty: newQty,
    calories: Math.round(base.calories * ratio),
    protein: Math.round(base.protein * ratio * 10) / 10,
    carbs: Math.round(base.carbs * ratio * 10) / 10,
    fat: Math.round(base.fat * ratio * 10) / 10,
    sugar: Math.round(base.sugar * ratio * 10) / 10,
    fiber: Math.round(base.fiber * ratio * 10) / 10,
  }
}

function AddMealForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = (searchParams.get('type') ?? 'breakfast') as typeof MEAL_TYPES[number]

  const [mealType, setMealType] = useState<typeof MEAL_TYPES[number]>(initialType)
  const [rawInput, setRawInput] = useState('')
  // baseItems = original 100g values from API; displayItems = scaled to user qty
  const [baseItems, setBaseItems] = useState<ParsedFoodItem[]>([])
  const [displayItems, setDisplayItems] = useState<ParsedFoodItem[]>([])
  const [step, setStep] = useState<'input' | 'preview'>('input')
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleParse() {
    if (!rawInput.trim()) return
    setParsing(true)
    setError(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/login'); return }

    const res = await fetch('/api/meals/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ text: rawInput.trim() }),
    })

    const json = await res.json()
    setParsing(false)

    if (!json.success) {
      setError(json.error ?? 'Failed to analyse meal')
      return
    }

    setBaseItems(json.data)
    setDisplayItems(json.data)
    setStep('preview')
  }

  function handleQtyChange(index: number, newQty: number) {
    if (newQty <= 0) return
    setDisplayItems(prev =>
      prev.map((item, i) => i === index ? scaleItem(baseItems[i], newQty) : item)
    )
  }

  async function handleSave() {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/login'); return }

    const res = await fetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ meal_type: mealType, raw_input: rawInput.trim(), items: displayItems }),
    })

    const json = await res.json()
    setSaving(false)
    if (json.success) {
      router.push('/nutrition')
    } else {
      setError(json.error ?? 'Failed to save')
    }
  }

  const totalCals = displayItems.reduce((s, i) => s + i.calories, 0)

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        <div className="flex items-center gap-3">
          <button
            onClick={() => step === 'preview' ? setStep('input') : router.back()}
            className="text-gray-400 hover:text-gray-700 text-lg"
          >←</button>
          <h1 className="text-xl font-semibold">Log a meal</h1>
        </div>

        {step === 'input' && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Meal type</label>
              <div className="flex gap-2 flex-wrap">
                {MEAL_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setMealType(t)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      mealType === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500">What did you eat?</label>
              <textarea
                value={rawInput}
                onChange={e => setRawInput(e.target.value)}
                placeholder="Include amounts for accuracy — e.g. 2 eggs, 2 slices toast, 15g peanut butter, 250ml milk"
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
              <p className="text-xs text-gray-400">Tip: specify amounts (15g, 1 cup, 2 slices) for more accurate calories</p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleParse}
              disabled={parsing || !rawInput.trim()}
              className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {parsing ? 'Analysing…' : 'Analyse meal'}
            </button>
          </div>
        )}

        {step === 'preview' && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div>
              <p className="text-sm font-medium mb-0.5">{rawInput}</p>
              <p className="text-xs text-gray-400 capitalize">{mealType} · adjust quantities if needed</p>
            </div>

            <ul className="space-y-3 divide-y divide-gray-50">
              {displayItems.map((item, i) => (
                <li key={i} className="pt-3 first:pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium capitalize flex-1">{item.food_name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        value={item.serving_qty}
                        min={1}
                        onChange={e => handleQtyChange(i, Number(e.target.value))}
                        className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-gray-300"
                      />
                      <span className="text-xs text-gray-400">g</span>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">{item.calories} kcal</span>
                    <span>P {item.protein}g</span>
                    <span>C {item.carbs}g</span>
                    <span>F {item.fat}g</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>{totalCals} kcal</span>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save meal'}
              </button>
              <button
                onClick={() => setStep('input')}
                disabled={saving}
                className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Start over
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}

export default function AddMealPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AddMealForm />
    </Suspense>
  )
}
