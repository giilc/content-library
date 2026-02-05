'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuth = async () => {
      const supabase = createClient()
      
      // First check if we already have a session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        router.push('/dashboard')
        return
      }

      // Handle hash fragment tokens (implicit flow)
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          
          if (!sessionError) {
            router.push('/dashboard')
            return
          }
          setError(sessionError.message)
          return
        }
      }

      // Handle code parameter (PKCE flow)
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (!exchangeError) {
          router.push('/dashboard')
          return
        }
        setError(exchangeError.message)
        return
      }

      // Handle token_hash parameter
      const tokenHash = params.get('token_hash')
      const type = params.get('type')
      
      if (tokenHash && type) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as 'email' | 'magiclink',
        })
        if (!otpError) {
          router.push('/dashboard')
          return
        }
        setError(otpError.message)
        return
      }

      // Nothing worked
      setError('No authentication data found. Please try logging in again.')
    }

    handleAuth()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
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
        <p className="text-gray-600">Please wait while we confirm your authentication.</p>
      </div>
    </div>
  )
}
