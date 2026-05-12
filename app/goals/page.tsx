'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { computeWeeklyKPIs } from '@/lib/kpi'
import BottomNav from '@/components/BottomNav'
import Spinner from '@/components/Spinner'
import type { GoalTemplate, Workout } from '@/lib/types'

const TEMPLATES: { id: GoalTemplate; label: string; description: string; target: string }[] = [
  { id: 'fat_loss', label: 'Fat Loss', description: 'High-frequency training to maximise calorie burn.', target: '4 sessions/week' },
  { id: 'strength', label: 'Strength', description: 'Progressive overload focused on compound lifts.', target: '3 sessions/week' },
  { id: 'conditioning', label: 'Conditioning', description: 'Cardio and GPP to build an aerobic base.', target: '3 sessions/week' },
]

export default function GoalsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [selected, setSelected] = useState<GoalTemplate | null>(null)
  const [current, setCurrent] = useState<GoalTemplate | null>(null)
  const [progress, setProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)

      const [{ data: prof }, workoutsRes] = await Promise.all([
        supabase.from('profiles').select('goal_template').eq('id', session.user.id).single(),
        fetch('/api/workouts', { headers: { Authorization: `Bearer ${session.access_token}` } }),
      ])

      const goal = prof?.goal_template ?? null
      setSelected(goal)
      setCurrent(goal)

      const json = await workoutsRes.json()
      if (json.success) {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
        const today = new Date().toISOString().split('T')[0]
        const thisWeek = (json.data as Workout[]).filter(w => w.date >= weekAgo && w.date <= today)
        setProgress(computeWeeklyKPIs(thisWeek, goal).goalProgress)
      }
      setReady(true)
    }
    init()
  }, [router])

  async function handleSave() {
    if (!userId || selected === current) return
    setSaving(true)
    await supabase.from('profiles').update({ goal_template: selected }).eq('id', userId)
    setCurrent(selected)
    setSaving(false)
  }

  if (!ready) return <Spinner />

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-semibold">Goals</h1>

        {/* Progress toward current goal */}
        {current && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">This week's progress</span>
              <span className="text-gray-500">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Template selector */}
        <div className="space-y-3">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected(t.id)}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${
                selected === t.id
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white hover:border-gray-400'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{t.label}</p>
                  <p className={`text-sm mt-0.5 ${selected === t.id ? 'text-gray-300' : 'text-gray-500'}`}>
                    {t.description}
                  </p>
                </div>
                <span className={`text-xs mt-0.5 whitespace-nowrap ml-4 ${selected === t.id ? 'text-gray-300' : 'text-gray-400'}`}>
                  {t.target}
                </span>
              </div>
            </button>
          ))}
        </div>

        {selected !== current && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Goal'}
          </button>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
