'use client'

import React, { useEffect, useState } from 'react'
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
  gender: string | null
  age: number | null
  height_cm: number | null
  weight_kg: number | null
  activity_level: string | null
  calorie_deficit: number | null
}

function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="relative group cursor-help underline decoration-dotted decoration-gray-400">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-64 rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 text-center leading-snug">
        {text}
      </span>
    </span>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selected, setSelected] = useState<AvatarOption | null>(null)
  const [accessories, setAccessories] = useState<Accessory[]>([])
  const [nutrition, setNutrition] = useState({
    gender: '',
    age: '',
    height_cm: '',
    weight_kg: '',
    activity_level: 'moderate',
    calorie_deficit: '400',
  })
  const [computedTarget, setComputedTarget] = useState<{ bmr: number; tdee: number; calorie_target: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savingNutrition, setSavingNutrition] = useState(false)
  const [savedNutrition, setSavedNutrition] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const [{ data }, accs] = await Promise.all([
        supabase.from('profiles').select('name, avatar_style, avatar_seed, gender, age, height_cm, weight_kg, activity_level, calorie_deficit').eq('id', session.user.id).single(),
        fetchUserAccessories(session.user.id, supabase),
      ])

      if (!data) { router.replace('/onboarding'); return }
      setProfile(data)
      setAccessories(accs)
      if (data.avatar_style && data.avatar_seed) {
        setSelected({ style: data.avatar_style, seed: data.avatar_seed })
      }
      setNutrition({
        gender: data.gender ?? '',
        age: data.age != null ? String(data.age) : '',
        height_cm: data.height_cm != null ? String(data.height_cm) : '',
        weight_kg: data.weight_kg != null ? String(data.weight_kg) : '',
        activity_level: data.activity_level ?? 'moderate',
        calorie_deficit: data.calorie_deficit != null ? String(data.calorie_deficit) : '400',
      })

      const { data: { session: sess } } = await supabase.auth.getSession()
      if (sess) {
        const res = await fetch('/api/nutrition/target', {
          headers: { Authorization: `Bearer ${sess.access_token}` },
        })
        const json = await res.json()
        if (json.success && json.data) setComputedTarget(json.data)
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

  async function handleSaveNutrition() {
    const { age, height_cm, weight_kg, gender, activity_level, calorie_deficit } = nutrition
    if (!gender || !age || !height_cm || !weight_kg) return
    setSavingNutrition(true)
    setSavedNutrition(false)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await supabase.from('profiles').update({
      gender,
      age: Number(age),
      height_cm: Number(height_cm),
      weight_kg: Number(weight_kg),
      activity_level,
      calorie_deficit: Number(calorie_deficit),
    }).eq('id', session.user.id)

    const res = await fetch('/api/nutrition/target', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        weight_kg: Number(weight_kg),
        height_cm: Number(height_cm),
        age: Number(age),
        gender,
        activity_level,
        deficit: Number(calorie_deficit),
      }),
    })

    const json = await res.json()
    setSavingNutrition(false)
    if (json.success) {
      setComputedTarget(json.data)
      setSavedNutrition(true)
    }
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

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <p className="text-sm font-medium">Nutrition settings</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Gender</label>
              <select
                value={nutrition.gender}
                onChange={e => setNutrition(n => ({ ...n, gender: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500">Age</label>
              <input
                type="number"
                value={nutrition.age}
                onChange={e => setNutrition(n => ({ ...n, age: e.target.value }))}
                placeholder="e.g. 30"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500">Height (cm)</label>
              <input
                type="number"
                value={nutrition.height_cm}
                onChange={e => setNutrition(n => ({ ...n, height_cm: e.target.value }))}
                placeholder="e.g. 175"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500">Weight (kg)</label>
              <input
                type="number"
                value={nutrition.weight_kg}
                onChange={e => setNutrition(n => ({ ...n, weight_kg: e.target.value }))}
                placeholder="e.g. 80"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500">Activity level</label>
            <select
              value={nutrition.activity_level}
              onChange={e => setNutrition(n => ({ ...n, activity_level: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="sedentary">Sedentary (desk job, no exercise)</option>
              <option value="light">Light (1–3 days/week)</option>
              <option value="moderate">Moderate (3–5 days/week)</option>
              <option value="very_active">Very active (6–7 days/week)</option>
              <option value="athlete">Athlete (2× per day)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500">Daily deficit (kcal)</label>
            <input
              type="number"
              value={nutrition.calorie_deficit}
              onChange={e => setNutrition(n => ({ ...n, calorie_deficit: e.target.value }))}
              placeholder="300–500"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {computedTarget && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium">
                <Tip text="TDEE − Deficit">Your target</Tip>
                {': '}
                <span className="text-gray-900">{Math.round(computedTarget.calorie_target)} kcal/day</span>
              </p>
              <p className="text-gray-500 text-xs flex gap-3">
                <Tip text="10×weight + 6.25×height − 5×age + 5 (male) or −161 (female)">BMR</Tip>
                <span>{Math.round(computedTarget.bmr)}</span>
                <span>·</span>
                <Tip text="BMR × activity multiplier (sedentary 1.2 → athlete 1.9)">TDEE</Tip>
                <span>{Math.round(computedTarget.tdee)}</span>
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveNutrition}
              disabled={savingNutrition || !nutrition.gender || !nutrition.age || !nutrition.height_cm || !nutrition.weight_kg}
              className="bg-gray-900 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {savingNutrition ? 'Saving…' : 'Save nutrition settings'}
            </button>
            {savedNutrition && <span className="text-sm text-green-600">Saved!</span>}
          </div>
        </div>

      </div>
      <BottomNav />
    </main>
  )
}
