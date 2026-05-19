import type { Metadata } from 'next'
import AaronBrownProfile from '@/components/AaronBrownProfile'

export const metadata: Metadata = {
  title: 'Aaron Brown — Strength & Performance Coach | Fitter',
  description: 'Book a session with Aaron Brown, elite strength coach with 12+ years experience.',
}

const SUPABASE = 'https://dkckxmvwnxaqvcsevrvd.supabase.co/storage/v1/object/public/trainer-photos'

export default function AaronBrownPage() {
  return (
    <AaronBrownProfile
      heroImageUrl={`${SUPABASE}/aaron-brown/hero.jpg`}
      avatarUrl={`${SUPABASE}/aaron-brown/avatar.jpg`}
    />
  )
}
