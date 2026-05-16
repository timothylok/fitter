'use client'

import { AVATAR_STYLES, AVATAR_SEEDS, avatarUrl } from '@/lib/avatars'

interface AvatarOption {
  style: string
  seed: string
}

interface Props {
  value: AvatarOption | null
  onChange: (avatar: AvatarOption) => void
}

const AVATARS = AVATAR_STYLES.flatMap(style =>
  AVATAR_SEEDS.map(seed => ({ style, seed, id: `${style}-${seed}` }))
)

export default function AvatarPicker({ value, onChange }: Props) {
  const selectedId = value ? `${value.style}-${value.seed}` : null

  return (
    <div className="grid grid-cols-5 gap-3">
      {AVATARS.map(a => {
        const active = selectedId === a.id
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onChange({ style: a.style, seed: a.seed })}
            className={`p-1.5 rounded-xl border-2 transition-colors ${
              active
                ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-1'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <img
              src={avatarUrl(a.style, a.seed)}
              alt={a.id}
              width={56}
              height={56}
              className="rounded-lg bg-gray-100 w-full"
            />
          </button>
        )
      })}
    </div>
  )
}
