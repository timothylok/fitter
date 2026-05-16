'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase'
import { computeWeeklyKPIs, computeWeeklyTrend } from '@/lib/kpi'
import AvatarWithAccessories from '@/components/AvatarWithAccessories'
import BottomNav from '@/components/BottomNav'
import Spinner from '@/components/Spinner'
import { fetchUserAccessories } from '@/lib/accessories'
import type { Accessory } from '@/lib/accessories'
import type { Workout, WeeklyKPIs, GoalTemplate } from '@/lib/types'

const GOAL_LABELS: Record<GoalTemplate, string> = {
  fat_loss: 'Fat Loss',
  strength: 'Strength',
  conditioning: 'Conditioning',
}

interface UserProfile {
  name: string
  goal_template: GoalTemplate | null
  avatar_style: string | null
  avatar_seed: string | null
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [kpis, setKpis] = useState<WeeklyKPIs | null>(null)
  const [trend, setTrend] = useState<{ label: string; volume: number }[]>([])
  const [accessories, setAccessories] = useState<Accessory[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const [{ data: prof }, workoutsRes, accs] = await Promise.all([
        supabase.from('profiles').select('name, goal_template, avatar_style, avatar_seed').eq('id', session.user.id).single(),
        fetch('/api/workouts', { headers: { Authorization: `Bearer ${session.access_token}` } }),
        fetchUserAccessories(session.user.id, supabase),
      ])
      setAccessories(accs)

      if (!prof) { router.replace('/onboarding'); return }
      setProfile(prof)

      const json = await workoutsRes.json()
      if (json.success) {
        const allWorkouts: Workout[] = json.data
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
        const today = new Date().toISOString().split('T')[0]
        const thisWeek = allWorkouts.filter(w => w.date >= weekAgo && w.date <= today)
        setKpis(computeWeeklyKPIs(thisWeek, prof.goal_template))
        setTrend(computeWeeklyTrend(allWorkouts))
      }
      setReady(true)
    }
    init()
  }, [router])

  if (!ready) return <Spinner />

  const goalLabel = profile?.goal_template ? GOAL_LABELS[profile.goal_template] : 'No goal set'

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <AvatarWithAccessories style={profile?.avatar_style} seed={profile?.avatar_seed} name={profile?.name ?? ''} accessories={accessories} size={48} />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold">Hey, {profile?.name}</h1>
              <p className="text-sm text-gray-400">{goalLabel}</p>
            </div>
          </div>
          <a
            href="/workouts"
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            + Log Workout
          </a>
        </div>

        {kpis && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <KpiCard label="Sets this week" value={kpis.totalSets} />
              <KpiCard label="Volume (kg)" value={kpis.totalVolume.toLocaleString()} />
              <KpiCard label="Days trained" value={kpis.frequency} />
              <KpiCard label="Streak" value={`${kpis.streak}d`} />
              <KpiCard label="Goal progress" value={`${kpis.goalProgress}%`} highlight />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Weekly goal</span>
                <span className="text-gray-500">{kpis.goalProgress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 rounded-full transition-all duration-500"
                  style={{ width: `${kpis.goalProgress}%` }}
                />
              </div>
            </div>
          </>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium mb-4">Weekly volume</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#111827" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => [`${Number(v).toLocaleString()} kg`, 'Volume']} />
              <Area type="monotone" dataKey="volume" stroke="#111827" strokeWidth={2} fill="url(#volGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <BottomNav />
    </main>
  )
}

function KpiCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200'}`}>
      <p className="text-xs mb-1 text-gray-400">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}
