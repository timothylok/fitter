'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AvatarWithAccessories from '@/components/AvatarWithAccessories'
import TrainerAwardAccessory from '@/components/TrainerAwardAccessory'
import BottomNav from '@/components/BottomNav'
import Spinner from '@/components/Spinner'
import type { Accessory } from '@/lib/accessories'

interface UserProfile {
  name: string
  avatar_style: string | null
  avatar_seed: string | null
}

export default function AwardPage() {
  const { id: userId } = useParams<{ id: string }>()
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [allAccessories, setAllAccessories] = useState<Accessory[]>([])
  const [userAccessories, setUserAccessories] = useState<Accessory[]>([])
  const [ready, setReady] = useState(false)

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

      setToken(session.access_token)

      const [userRes, accRes] = await Promise.all([
        fetch(`/api/trainer/users/${userId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch('/api/accessories'),
      ])

      const userJson = await userRes.json()
      if (userJson.success) {
        setProfile(userJson.data.profile)
        setUserAccessories(userJson.data.accessories)
      }

      const accJson = await accRes.json()
      if (accJson.success) setAllAccessories(accJson.data)
      setReady(true)
    }
    init()
  }, [router, userId])

  if (!ready) return <Spinner />

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
        </div>

        <div className="flex items-center gap-4">
          <AvatarWithAccessories
            style={profile?.avatar_style}
            seed={profile?.avatar_seed}
            name={profile?.name ?? ''}
            accessories={userAccessories}
            size={72}
          />
          <div>
            <h1 className="text-xl font-semibold">{profile?.name}</h1>
            <p className="text-sm text-gray-400">
              {userAccessories.length} accessor{userAccessories.length === 1 ? 'y' : 'ies'} earned
            </p>
          </div>
        </div>

        {token && (
          <TrainerAwardAccessory
            userId={userId}
            accessories={allAccessories}
            token={token}
          />
        )}

      </div>
      <BottomNav />
    </main>
  )
}
