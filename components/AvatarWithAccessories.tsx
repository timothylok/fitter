import { avatarUrl } from '@/lib/avatars'
import type { Accessory } from '@/lib/accessories'

interface Props {
  style?: string | null
  seed?: string | null
  name: string
  accessories: Accessory[]
  size?: number
}

export default function AvatarWithAccessories({ style, seed, name, accessories, size = 40 }: Props) {
  const src = avatarUrl(style ?? 'adventurer', seed ?? name)
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full bg-gray-100"
      />
      {accessories.map((acc) => (
        <img
          key={acc.id}
          src={acc.svg_url}
          alt={acc.name}
          width={size}
          height={size}
          className="absolute top-0 left-0 pointer-events-none"
        />
      ))}
    </div>
  )
}
