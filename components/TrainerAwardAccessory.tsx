'use client'

import { useState } from 'react'
import type { Accessory } from '@/lib/accessories'

interface Props {
  userId: string
  accessories: Accessory[]
  token: string
}

export default function TrainerAwardAccessory({ userId, accessories, token }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [awarding, setAwarding] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  async function award() {
    if (!selected) return
    setAwarding(true)
    setResult(null)

    const res = await fetch('/api/trainer/award-accessory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, accessoryId: selected }),
    })

    const json = await res.json()
    setAwarding(false)
    if (json.success) {
      setResult({ ok: true, msg: 'Awarded!' })
      setSelected(null)
    } else {
      setResult({ ok: false, msg: json.error ?? 'Something went wrong' })
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <h3 className="font-semibold text-sm">Award Accessory <span className="text-gray-400 font-normal">(7 days)</span></h3>

      <div className="grid grid-cols-3 gap-3">
        {accessories.map((a) => (
          <button
            key={a.id}
            onClick={() => { setSelected(a.id); setResult(null) }}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors ${
              selected === a.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <img src={a.svg_url} alt={a.name} className="w-12 h-12" />
            <span className="text-xs font-medium">{a.name}</span>
            <span className="text-xs text-gray-400">7 days</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={award}
          disabled={!selected || awarding}
          className="bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {awarding ? 'Awarding…' : 'Award'}
        </button>

        {result && (
          <span className={`text-sm font-medium ${result.ok ? 'text-green-600' : 'text-red-600'}`}>
            {result.msg}
          </span>
        )}
      </div>
    </div>
  )
}
