'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AvatarWithAccessories from '@/components/AvatarWithAccessories'
import AvatarPicker from '@/components/AvatarPicker'
import { fetchUserAccessories } from '@/lib/accessories'
import type { Accessory } from '@/lib/accessories'
import BottomNav from '@/components/BottomNav'
import Spinner from '@/components/Spinner'

interface AvatarOption {
  style: string
  seed: string
}

interface Profile {
  name: string
  avatar_style: string | null
  avatar_seed: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selected, setSelected] = useState<AvatarOption | null>(null)
  const [accessories, setAccessories] = useState<Accessory[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const [{ data }, accs] = await Promise.all([
        supabase.from('profiles').select('name, avatar_style, avatar_seed').eq('id', session.user.id).single(),
        fetchUserAccessories(session.user.id, supabase),
      ])

      if (!data) { router.replace('/onboarding'); return }
      setProfile(data)
      setAccessories(accs)
      if (data.avatar_style && data.avatar_seed) {
        setSelected({ style: data.avatar_style, seed: data.avatar_seed })
      }
    }
    init()
  }, [router])

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    setSaved(false)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/profiles/avatar', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ style: selected.style, seed: selected.seed }),
    })

    setSaving(false)
    if (res.ok) setSaved(true)
  }

  if (!profile) return <Spinner />

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        <div className="flex items-center gap-4">
          <AvatarWithAccessories style={selected?.style} seed={selected?.seed} name={profile.name} accessories={accessories} size={72} />
          <div>
            <h1 className="text-2xl font-semibold">{profile.name}</h1>
            <p className="text-sm text-gray-400">Choose an avatar below</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <p className="text-sm font-medium">Choose your avatar</p>
          <AvatarPicker value={selected} onChange={a => { setSelected(a); setSaved(false) }} />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !selected}
            className="bg-gray-900 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && <span className="text-sm text-green-600">Saved!</span>}
        </div>

      </div>
      <BottomNav />
    </main>
  )
}
