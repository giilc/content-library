'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function AuthConfirmPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuth = async () => {
      const supabase = createClient()
      
      // Check if we have a session from the hash fragment
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        setError(error.message)
        return
      }
      
      if (session) {
        router.push('/dashboard')
        return
      }

      // If no session, try to get it from URL hash (for implicit flow)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error: setError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        
        if (setError) {
          setError(setError.message)
          return
        }
        
        router.push('/dashboard')
        return
      }

      // No auth found
      setError('Authentication failed. Please try again.')
    }

    handleAuth()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <a href="/login" className="btn btn-primary">
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
