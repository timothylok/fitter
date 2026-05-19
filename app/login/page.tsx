'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { supabase } from '@/lib/supabase'

type Stage = 'checking' | 'email' | 'code'

export default function LoginPage() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('checking')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard')
      } else {
        setStage('email')
      }
    })
  }, [router])

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const json = await res.json()

      if (!json.success) {
        setError('Something went wrong. Please try again.')
      } else {
        setStage('code')
      }
    } catch (err) {
      Sentry.captureException(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: code }),
      })
      const json = await res.json()

      if (!json.success) {
        setError(json.error ?? 'Invalid code or code expired')
        setLoading(false)
        return
      }

      // Exchange the token_hash for a real Supabase session.
      // No URL is involved — Outlook Safe Links cannot interfere.
      const { error: sessionError } = await supabase.auth.verifyOtp({
        token_hash: json.token_hash,
        type: json.type,
      })

      if (sessionError) {
        Sentry.captureException(sessionError, { tags: { flow: 'otp-login' } })
        setError('Could not create session. Please request a new code.')
        setLoading(false)
        return
      }

      router.replace('/dashboard')
    } catch (err) {
      Sentry.captureException(err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (stage === 'checking') return null

  if (stage === 'email') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-sm w-full space-y-6 px-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Welcome to Fitter</h1>
            <p className="text-gray-500">
              Enter your email to sign in or create an account.
            </p>
          </div>

          <form onSubmit={handleRequestOtp} className="space-y-4">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Sending…' : 'Send login code'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-sm w-full space-y-6 px-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Enter your code</h1>
          <p className="text-gray-500">
            We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.
          </p>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          {/* Hidden username field so password managers associate the OTP with this account */}
          <input type="hidden" value={email} autoComplete="username" readOnly />

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            pattern="\d{6}"
            required
            placeholder="123456"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            autoComplete="one-time-code"
            autoFocus
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-gray-900 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Verifying…' : 'Sign in'}
          </button>
          <button
            type="button"
            onClick={() => { setStage('email'); setCode(''); setError('') }}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Use a different email
          </button>
        </form>
      </div>
    </main>
  )
}
