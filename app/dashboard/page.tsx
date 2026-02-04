import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import Navbar from '@/components/Navbar'
import ContentList from '@/components/ContentList'
import { ContentItem } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: items, error } = await supabase
    .from('content_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching items:', error)
  }

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

        <ContentList items={(items as ContentItem[]) || []} />
      </main>
    </div>
  )
}
