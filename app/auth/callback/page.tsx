'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [debug, setDebug] = useState<string>('')
  const [status, setStatus] = useState<string>('Initializing...')

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const supabase = createClient()

        // Debug info
        const debugInfo: Record<string, string> = {
          hash: window.location.hash ? '(has tokens)' : '(empty)',
          search: window.location.search || '(empty)',
          pathname: window.location.pathname,
        }
        setDebug(JSON.stringify(debugInfo, null, 2))

        // Handle hash fragment tokens FIRST (implicit flow)
        if (window.location.hash && window.location.hash.includes('access_token')) {
          setStatus('Processing tokens from URL...')
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (sessionError) {
              setError(`Token error: ${sessionError.message}`)
              return
            }

            // Set a session marker cookie that middleware can read
            document.cookie = `auth-session=active; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`

            setStatus('Success! Redirecting to dashboard...')
            window.location.href = '/dashboard'
            return
          }
        }

        // Check for existing session
        setStatus('Checking for existing session...')
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          setStatus('Session found! Redirecting...')
          document.cookie = `auth-session=active; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
          window.location.href = '/dashboard'
          return
        }

        // Handle PKCE code if present (fallback)
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')

        if (code) {
          setStatus('Exchanging code for session...')
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (!exchangeError && data.session) {
            setStatus('Session created! Redirecting...')
            document.cookie = `auth-session=active; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
            window.location.href = '/dashboard'
            return
          }
          setError(`Code exchange failed: ${exchangeError?.message || 'No session'}`)
          return
        }

        // Handle token_hash parameter
        const tokenHash = params.get('token_hash')
        const type = params.get('type')

        if (tokenHash && type) {
          setStatus('Verifying OTP...')
          const { error: otpError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'email' | 'magiclink',
          })
          if (!otpError) {
            document.cookie = `auth-session=active; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
            window.location.href = '/dashboard'
            return
          }
          setError(`OTP error: ${otpError.message}`)
          return
        }

        // Nothing worked
        setError('No authentication data found. Please request a new magic link.')
      } catch (err) {
        setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    handleAuth()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <pre className="text-left text-xs bg-gray-100 p-2 rounded mb-4 overflow-auto">{debug}</pre>
          <a href="/login" className="btn btn-primary inline-block">
            Back to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Signing you in...</h1>
        <p className="text-gray-600 mb-2">{status}</p>
        <pre className="text-left text-xs bg-gray-100 p-2 rounded mb-4 overflow-auto max-h-40">{debug || 'Loading...'}</pre>
      </div>
    </div>
  )
}
