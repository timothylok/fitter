'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import Spinner from '@/components/Spinner'

interface Profile { id: string; name: string; email: string }
interface Assignment { id: string; user_id: string; trainer_id: string }

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<Profile[]>([])
  const [trainers, setTrainers] = useState<Profile[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (prof?.role !== 'admin') { router.replace('/dashboard'); return }

      const res = await fetch('/api/admin/assignments', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json()
      if (!json.success) { setError(json.error); setReady(true); return }

      setUsers(json.data.users)
      setTrainers(json.data.trainers)
      setAssignments(json.data.assignments)
      setReady(true)
    }
    init()
  }, [router])

  async function handleAdd(user_id: string, trainer_id: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/admin/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ user_id, trainer_id }),
    })
    const json = await res.json()
    if (json.success) setAssignments(a => [...a, json.data])
  }

  async function handleRemove(assignmentId: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch(`/api/admin/assignments/${assignmentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const json = await res.json()
    if (json.success) setAssignments(a => a.filter(x => x.id !== assignmentId))
  }

  if (!ready) return <Spinner />

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-2xl font-semibold">Admin — Trainer Assignments</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">{error}</div>
        )}

        {trainers.length === 0 && (
          <p className="text-sm text-gray-400">No trainers found. Set a user&apos;s role to <code>trainer</code> in Supabase first.</p>
        )}

        {users.length === 0 && !error && (
          <p className="text-gray-400 text-center py-16">No users found.</p>
        )}

        {users.map(user => {
          const userAssignments = assignments.filter(a => a.user_id === user.id)
          const assignedTrainerIds = new Set(userAssignments.map(a => a.trainer_id))
          const available = trainers.filter(t => !assignedTrainerIds.has(t.id))

          return (
            <div key={user.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-gray-400">{user.email}</p>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {userAssignments.length === 0 && (
                  <span className="text-sm text-gray-400">No trainers assigned</span>
                )}
                {userAssignments.map(a => {
                  const trainer = trainers.find(t => t.id === a.trainer_id)
                  return (
                    <span
                      key={a.id}
                      className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-sm px-2.5 py-1 rounded-full"
                    >
                      {trainer?.name ?? 'Unknown'}
                      <button
                        onClick={() => handleRemove(a.id)}
                        className="text-gray-400 hover:text-red-500 leading-none ml-0.5"
                        aria-label={`Remove ${trainer?.name}`}
                      >
                        ×
                      </button>
                    </span>
                  )
                })}

                {available.length > 0 && (
                  <select
                    defaultValue=""
                    onChange={e => {
                      if (e.target.value) {
                        handleAdd(user.id, e.target.value)
                        e.target.value = ''
                      }
                    }}
                    className="text-sm border border-gray-300 rounded-full px-3 py-1 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="" disabled>+ Add trainer</option>
                    {available.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <BottomNav />
    </main>
  )
}
