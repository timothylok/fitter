'use client'

import { useState } from 'react'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import type { Workout } from '@/lib/types'

const TEMPLATES = {
  Push: ['Bench Press', 'Overhead Press', 'Tricep Pushdown'],
  Pull: ['Pull-up', 'Barbell Row', 'Bicep Curl'],
  Legs: ['Squat', 'Romanian Deadlift', 'Leg Press'],
  Conditioning: ['Running', 'Rowing', 'Jump Rope'],
} as const

const workoutSchema = z.object({
  exercise_name: z.string().min(1, 'Exercise name is required'),
  sets: z.coerce.number().int().positive('Sets must be a positive number'),
  reps: z.coerce.number().int().positive('Reps must be a positive number'),
  weight: z.coerce.number().positive().nullable(),
  duration: z.coerce.number().positive().nullable(),
  rpe: z.coerce.number().min(1).max(10).nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
})

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (workout: Workout) => void
}

const today = new Date().toISOString().split('T')[0]
const emptyForm = { exercise_name: '', sets: '', reps: '', weight: '', duration: '', rpe: '', date: today }

export default function AddWorkoutModal({ open, onClose, onSaved }: Props) {
  const [form, setForm] = useState(emptyForm)
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (!open) return null

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = workoutSchema.safeParse({
      ...form,
      weight: form.weight === '' ? null : form.weight,
      duration: form.duration === '' ? null : form.duration,
      rpe: form.rpe === '' ? null : form.rpe,
    })

    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setError('Not signed in'); setSaving(false); return }

    const res = await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(parsed.data),
    })
    const json = await res.json()
    setSaving(false)

    if (!json.success) { setError(json.error); return }

    onSaved(json.data)
    setForm(emptyForm)
    setActiveTemplate(null)
    onClose()
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Add Workout</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Quick-add</p>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(TEMPLATES) as Array<keyof typeof TEMPLATES>).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTemplate(activeTemplate === t ? null : t)}
                className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                  activeTemplate === t
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-300 text-gray-600 hover:border-gray-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {activeTemplate && (
            <div className="flex flex-wrap gap-2 mt-2">
              {TEMPLATES[activeTemplate as keyof typeof TEMPLATES].map(ex => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => set('exercise_name', ex)}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exercise</label>
            <input
              value={form.exercise_name}
              onChange={e => set('exercise_name', e.target.value)}
              placeholder="e.g. Bench Press"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sets</label>
              <input
                type="number"
                min={1}
                value={form.sets}
                onChange={e => set('sets', e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reps</label>
              <input
                type="number"
                min={1}
                value={form.reps}
                onChange={e => set('reps', e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={form.weight}
                onChange={e => set('weight', e.target.value)}
                placeholder="—"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input
                type="number"
                min={0}
                value={form.duration}
                onChange={e => set('duration', e.target.value)}
                placeholder="—"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RPE (1–10)</label>
              <input
                type="number"
                min={1}
                max={10}
                step={0.5}
                value={form.rpe}
                onChange={e => set('rpe', e.target.value)}
                placeholder="—"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Workout'}
          </button>
        </form>
      </div>
    </div>
  )
}
