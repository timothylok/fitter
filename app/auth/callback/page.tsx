'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
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
          Sentry.captureException(error, { tags: { flow: 'signup' } })
          router.replace('/login')
          return
        }
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        Sentry.captureMessage('Auth callback: no session after exchange', {
          level: 'warning',
          tags: { flow: 'signup' },
        })
      }
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
