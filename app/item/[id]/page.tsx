'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import ContentForm from '@/components/ContentForm'
import GeneratePanel from '@/components/GeneratePanel'
import { ContentItem } from '@/lib/types'

export default function ItemPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [item, setItem] = useState<ContentItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchItem = async () => {
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('content_items')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        setError(fetchError.message)
      } else if (!data) {
        setError('Item not found')
      } else {
        setItem(data as ContentItem)
      }
      setLoading(false)
    }

    if (id) {
      fetchItem()
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-gray-500">Loading...</p>
        </main>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-red-500">{error || 'Item not found'}</p>
          <button onClick={() => router.push('/dashboard')} className="btn btn-primary mt-4">
            Back to Dashboard
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Content</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card">
            <ContentForm item={item} mode="edit" />
          </div>

          <GeneratePanel item={item} />
        </div>
      </main>
    </div>
  )
}
