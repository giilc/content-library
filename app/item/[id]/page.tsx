import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Navbar from '@/components/Navbar'
import ContentForm from '@/components/ContentForm'
import GeneratePanel from '@/components/GeneratePanel'
import { ContentItem } from '@/lib/types'

interface ItemPageProps {
  params: Promise<{ id: string }>
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: item, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !item) {
    notFound()
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Content</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card">
            <ContentForm item={item as ContentItem} mode="edit" />
          </div>

          <GeneratePanel item={item as ContentItem} />
        </div>
      </main>
    </div>
  )
}
