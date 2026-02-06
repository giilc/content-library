'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import ContentList from '@/components/ContentList'
import ActionCenter from '@/components/ActionCenter'
import BulkActionsBar from '@/components/BulkActionsBar'
import { ContentItem } from '@/lib/types'
import { useKeyboardShortcuts, KeyboardHints } from '@/hooks/useKeyboardShortcuts'

export default function DashboardPage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const fetchItems = useCallback(async () => {
    const supabase = createClient()

    console.log('[Dashboard] Fetching items...')
    const { data, error: fetchError } = await supabase
      .from('content_items')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('[Dashboard] Fetch result:', { data, error: fetchError })

    if (fetchError) {
      console.error('[Dashboard] Fetch error:', fetchError)
      setError(fetchError.message)
    } else {
      console.log('[Dashboard] Items count:', data?.length || 0)
      setItems(data as ContentItem[] || [])
    }
    setLoading(false)
  }, [])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => {
      searchInputRef.current?.focus()
    },
  })

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleClearSelection = () => {
    setSelectedIds([])
  }

  const handleActionComplete = () => {
    // Refresh the list and Action Center after bulk action
    fetchItems()
    setRefreshKey(k => k + 1)
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Your Content</h1>
          <Link href="/new" className="btn btn-primary">
            + New Item
            <kbd className="ml-2 text-xs opacity-60 bg-blue-700 px-1.5 py-0.5 rounded">N</kbd>
          </Link>
        </div>

        {/* Action Center */}
        <ActionCenter key={refreshKey} />

        {loading ? (
          <div className="card">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : error ? (
          <div className="card border-red-200 bg-red-50">
            <p className="text-red-500">Error: {error}</p>
          </div>
        ) : (
          <ContentList
            items={items}
            searchInputRef={searchInputRef}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        )}
      </main>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedIds={selectedIds}
        onClearSelection={handleClearSelection}
        onActionComplete={handleActionComplete}
      />

      {/* Keyboard hints - hide when bulk actions bar is visible */}
      {selectedIds.length === 0 && <KeyboardHints />}
    </div>
  )
}
