'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AddWorkoutModal from '@/components/AddWorkoutModal'
import BottomNav from '@/components/BottomNav'
import Spinner from '@/components/Spinner'
import type { Workout } from '@/lib/types'

export default function WorkoutsPage() {
  const router = useRouter()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [ready, setReady] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      setToken(session.access_token)

      const res = await fetch('/api/workouts', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json()
      if (json.success) setWorkouts(json.data)
      setReady(true)
    }
    init()
  }, [router])

  async function handleDelete(id: string) {
    if (!token) return
    const res = await fetch(`/api/workouts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (json.success) setWorkouts(prev => prev.filter(w => w.id !== id))
  }

  if (!ready) return <Spinner />

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Workouts</h1>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            + Add
          </button>
        </div>

        {workouts.length === 0 ? (
          <p className="text-gray-400 text-center py-16">No workouts yet. Add your first one!</p>
        ) : (
          <div className="space-y-2">
            {workouts.map(w => (
              <div
                key={w.id}
                className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{w.exercise_name}</p>
                  <p className="text-sm text-gray-500">
                    {w.sets} × {w.reps}
                    {w.weight ? ` @ ${w.weight}kg` : ''}
                    {w.duration ? ` · ${w.duration}min` : ''}
                    {w.rpe ? ` · RPE ${w.rpe}` : ''}
                    {' · '}{w.date}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(w.id)}
                  className="text-gray-300 hover:text-red-500 text-sm transition-colors ml-4 shrink-0"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddWorkoutModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={w => setWorkouts(prev => [w, ...prev])}
      />

      <BottomNav />
    </main>
  )
}
