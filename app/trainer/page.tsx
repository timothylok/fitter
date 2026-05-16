'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/Avatar'
import BottomNav from '@/components/BottomNav'
import Spinner from '@/components/Spinner'
import type { GoalTemplate } from '@/lib/types'

interface ClientRow {
  id: string
  name: string
  email: string
  goal_template: GoalTemplate | null
  avatar_style: string | null
  avatar_seed: string | null
  sessionsThisWeek: number
  lastWorkout: string | null
  atRisk: boolean
}

const GOAL_LABELS: Record<GoalTemplate, string> = {
  fat_loss: 'Fat Loss',
  strength: 'Strength',
  conditioning: 'Conditioning',
}

export default function TrainerPage() {
  const router = useRouter()
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
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
      if (prof?.role !== 'trainer' && prof?.role !== 'admin') {
        router.replace('/dashboard'); return
      }

      const res = await fetch('/api/trainer/users', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error ?? 'Failed to load clients')
      } else {
        setClients(json.data)
      }
      setLoading(false)
    }
    init()
  }, [router])

  if (loading) return <Spinner />

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-semibold">Trainer View</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
            {error}. Make sure <code>SUPABASE_SERVICE_ROLE_KEY</code> is set in <code>.env.local</code>.
          </div>
        )}

        {!error && clients.length === 0 && (
          <p className="text-gray-400 text-center py-16">No clients found.</p>
        )}

        {clients.length > 0 && (
          <div className="space-y-3">
            {clients.map(c => (
              <div
                key={c.id}
                className={`bg-white rounded-xl border p-4 ${c.atRisk ? 'border-red-200' : 'border-gray-200'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar style={c.avatar_style} seed={c.avatar_seed} name={c.name} size={40} />
                    <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{c.name}</p>
                      {c.atRisk && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                          At risk
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{c.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {c.goal_template ? GOAL_LABELS[c.goal_template] : '—'}
                  </span>
                </div>

                <div className="flex gap-6 mt-3 text-sm">
                  <Stat label="Sessions this week" value={c.sessionsThisWeek} />
                  <Stat label="Last workout" value={c.lastWorkout ?? 'Never'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
