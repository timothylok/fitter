import { avatarUrl } from '@/lib/avatars'

interface Props {
  style?: string | null
  seed?: string | null
  name: string
  size?: number
}

export default function Avatar({ style, seed, name, size = 40 }: Props) {
  const src = avatarUrl(style ?? 'adventurer', seed ?? name)
  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className="rounded-full bg-gray-100"
    />
  )
}
