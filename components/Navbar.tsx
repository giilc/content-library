'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function Navbar() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              Content Library
            </Link>
            <div className="flex space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                href="/new"
                className="text-gray-600 hover:text-gray-900"
              >
                New Item
              </Link>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-gray-600 hover:text-gray-900"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
}
