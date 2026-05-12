'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const TABS = [
  { href: '/dashboard', label: 'Home', icon: '⊞' },
  { href: '/workouts', label: 'Workouts', icon: '↑' },
  { href: '/goals', label: 'Goals', icon: '◎' },
  { href: '/trainer', label: 'Trainer', icon: '♟' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      supabase.from('profiles').select('role').eq('id', session.user.id).single()
        .then(({ data }) => setIsAdmin(data?.role === 'admin'))
    })
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center z-40">
      {[...TABS, ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: '⚙' }] : [])].map(t => {
        const active = pathname === t.href
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex-1 flex flex-col items-center py-3 text-xs gap-0.5 transition-colors ${
              active ? 'text-gray-900 font-medium' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="text-lg leading-none">{t.icon}</span>
            {t.label}
          </Link>
        )
      })}
      <button
        onClick={handleSignOut}
        className="flex-1 flex flex-col items-center py-3 text-xs gap-0.5 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <span className="text-lg leading-none">→</span>
        Sign out
      </button>
    </nav>
  )
}
