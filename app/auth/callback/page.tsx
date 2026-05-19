'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Spinner from '@/components/Spinner'

function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function exchange() {
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          router.replace('/login')
          return
        }
      }
      const { data: { session } } = await supabase.auth.getSession()
      router.replace(session ? '/dashboard' : '/login')
    }
    exchange()
  }, [router, searchParams])

  return <Spinner />
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AuthCallback />
    </Suspense>
  )
}
