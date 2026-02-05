'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import ContentList from '@/components/ContentList'
import { ContentItem } from '@/lib/types'

export default function DashboardPage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchItems = async () => {
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('content_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setItems(data as ContentItem[] || [])
      }
      setLoading(false)
    }

    fetchItems()
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Your Content</h1>
          <Link href="/new" className="btn btn-primary">
            + New Item
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <ContentList items={items} />
        )}
      </main>
    </div>
  )
}
