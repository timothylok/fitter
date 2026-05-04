'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { GoalTemplate } from '@/lib/types'

const GOAL_TEMPLATES: { id: GoalTemplate; label: string }[] = [
  { id: 'fat_loss', label: 'Fat Loss' },
  { id: 'strength', label: 'Strength' },
  { id: 'conditioning', label: 'Conditioning' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [goal, setGoal] = useState<GoalTemplate | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!goal) { setError('Pick a goal to continue.'); return }
    setError('')
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/login'); return }

    const { error } = await supabase.from('users').insert({
      id: session.user.id,
      email: session.user.email,
      name: name.trim(),
      goal_template: goal,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.replace('/dashboard')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-sm w-full space-y-6 px-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Set up your profile</h1>
          <p className="text-gray-500">Just two things to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium">Your name</label>
            <input
              type="text"
              required
              placeholder="e.g. Alex"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Your primary goal</label>
            <div className="grid grid-cols-3 gap-2">
              {GOAL_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setGoal(t.id)}
                  className={`border rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                    goal === t.id
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving…' : 'Get started'}
          </button>
        </form>
      </div>
    </main>
  )
}
