'use client'

import { useState, Ref } from 'react'
import Link from 'next/link'
import { ContentItem, Platform, Status } from '@/lib/types'

interface ContentListProps {
  items: ContentItem[]
  searchInputRef?: Ref<HTMLInputElement>
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
}

const platformColors: Record<Platform, string> = {
  youtube: 'bg-red-100 text-red-800',
  facebook: 'bg-blue-100 text-blue-800',
  instagram: 'bg-pink-100 text-pink-800',
  tiktok: 'bg-gray-900 text-white',
}

const statusColors: Record<Status, string> = {
  idea: 'bg-yellow-100 text-yellow-800',
  draft: 'bg-blue-100 text-blue-800',
  posted: 'bg-green-100 text-green-800',
}

export default function ContentList({
  items,
  searchInputRef,
  selectedIds = [],
  onSelectionChange,
}: ContentListProps) {
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.notes?.toLowerCase().includes(search.toLowerCase()) ||
      item.tags?.toLowerCase().includes(search.toLowerCase())

    const matchesPlatform =
      platformFilter === 'all' || item.platform === platformFilter

    const matchesStatus =
      statusFilter === 'all' || item.status === statusFilter

    return matchesSearch && matchesPlatform && matchesStatus
  })

  const isAllSelected = filteredItems.length > 0 && filteredItems.every(item => selectedIds.includes(item.id))

  const handleSelectAll = () => {
    if (!onSelectionChange) return

    if (isAllSelected) {
      // Deselect all filtered items
      onSelectionChange(selectedIds.filter(id => !filteredItems.some(item => item.id === id)))
    } else {
      // Select all filtered items
      const filteredIds = filteredItems.map(item => item.id)
      const newIds = Array.from(new Set([...selectedIds, ...filteredIds]))
      onSelectionChange(newIds)
    }
  }

  const handleSelectItem = (itemId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!onSelectionChange) return

    if (selectedIds.includes(itemId)) {
      onSelectionChange(selectedIds.filter(id => id !== itemId))
    } else {
      onSelectionChange([...selectedIds, itemId])
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search by title, notes, or tags... (press /)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input flex-1"
        />

        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value as Platform | 'all')}
          className="input w-full sm:w-40"
        >
          <option value="all">All Platforms</option>
          <option value="youtube">YouTube</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Status | 'all')}
          className="input w-full sm:w-32"
        >
          <option value="all">All Status</option>
          <option value="idea">Idea</option>
          <option value="draft">Draft</option>
          <option value="posted">Posted</option>
        </select>
      </div>

      {/* Results count + Select all */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Showing {filteredItems.length} of {items.length} items
        </p>
        {onSelectionChange && filteredItems.length > 0 && (
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {isAllSelected ? 'Deselect all' : `Select all ${filteredItems.length}`}
          </button>
        )}
      </div>

      {/* List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {items.length === 0 ? (
            <div>
              <p className="text-lg mb-2">No content items yet</p>
              <Link href="/new" className="text-blue-600 hover:underline">
                Create your first item
              </Link>
            </div>
          ) : (
            <p>No items match your filters</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isSelected = selectedIds.includes(item.id)
            return (
              <div
                key={item.id}
                className={`card block hover:shadow-lg transition-all ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  {onSelectionChange && (
                    <div
                      onClick={(e) => handleSelectItem(item.id, e)}
                      className="flex-shrink-0 pt-1 cursor-pointer"
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Content - clickable to navigate */}
                  <Link href={`/item/${item.id}`} className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {item.title}
                        </h3>
                        {item.notes && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {item.notes}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              platformColors[item.platform]
                            }`}
                          >
                            {item.platform}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              statusColors[item.status]
                            }`}
                          >
                            {item.status}
                          </span>
                          {item.tags && (
                            <span className="text-xs text-gray-500">
                              {item.tags.split(',').slice(0, 3).join(', ')}
                              {item.tags.split(',').length > 3 && '...'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 ml-4">
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
