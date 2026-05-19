'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard')
      } else {
        setChecking(false)
      }
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (checking) return null

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-sm w-full space-y-6 px-4">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold">Check your email</h1>
            <p className="text-gray-500">We sent a magic link to <strong>{email}</strong></p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-2 text-sm text-gray-600">
            <p className="font-medium text-gray-800">Not seeing it?</p>
            <p>Check your spam folder. If you use Outlook, add these to Safe Senders:</p>
            <p className="text-gray-500 text-xs">Settings → Mail → Junk email → Safe senders</p>
            <ul className="space-y-1 mt-1">
              <li className="font-mono text-xs bg-gray-50 rounded px-2 py-1">resend.com</li>
              <li className="font-mono text-xs bg-gray-50 rounded px-2 py-1">fittertrack.com</li>
              <li className="font-mono text-xs bg-gray-50 rounded px-2 py-1">tim@fittertrack.com</li>
            </ul>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-sm w-full space-y-6 px-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Welcome to Fitter</h1>
          <p className="text-gray-500">Enter your email to sign in or create an account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            {loading ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
      </div>
    </main>
  )
}
