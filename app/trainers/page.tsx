import type { Metadata } from 'next'
import TrainerProfile from '@/components/TrainerProfile'

export const metadata: Metadata = {
  title: 'Jordan Kane — Strength & Performance Coach | Fitter',
  description: 'Book a session with Jordan Kane, certified strength and performance coach.',
}

export default function TrainerProfilePage() {
  return (
    <TrainerProfile
      heroImageUrl="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800"
      avatarUrl="https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300"
    />
  )
}
