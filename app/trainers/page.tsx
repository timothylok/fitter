import type { Metadata } from 'next'
import TrainerProfile from '@/components/TrainerProfile'

export const metadata: Metadata = {
  title: 'Jordan Kane — Strength & Performance Coach | Fitter',
  description: 'Book a session with Jordan Kane, certified strength and performance coach.',
}

export default function TrainerProfilePage() {
  return <TrainerProfile />
}
