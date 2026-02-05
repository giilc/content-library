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
      const supabase = createClient()

      // Debug info
      const debugInfo: Record<string, string> = {
        hash: window.location.hash || '(empty)',
        search: window.location.search || '(empty)',
        pathname: window.location.pathname,
      }
      setDebug(JSON.stringify(debugInfo, null, 2))

      setStatus('Checking for existing session...')
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setStatus('Session found! Redirecting...')
        window.location.href = '/dashboard'
        return
      }

      // Handle hash fragment tokens (implicit flow)
      if (window.location.hash) {
        setStatus('Processing hash tokens...')
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (!sessionError) {
            window.location.href = '/dashboard'
            return
          }
          setError(`Hash token error: ${sessionError.message}`)
          return
        }
      }

      // Handle code parameter (PKCE flow)
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        setStatus('Exchanging PKCE code for session...')
        debugInfo.code = code.substring(0, 20) + '...'
        setDebug(JSON.stringify(debugInfo, null, 2))

        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (!exchangeError && data.session) {
          setStatus('Success! Session created. Redirecting...')
          // Use full page redirect to ensure cookies are properly set
          window.location.href = '/dashboard'
          return
        }
        setError(`PKCE error: ${exchangeError?.message || 'No session returned'}`)
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
          window.location.href = '/dashboard'
          return
        }
        setError(`OTP error: ${otpError.message}`)
        return
      }

      // Nothing worked
      setError('No authentication data found in URL. Make sure you click the magic link in the same browser where you requested it.')
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
