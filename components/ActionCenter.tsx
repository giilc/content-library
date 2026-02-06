'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getActionCenterItems } from '@/lib/actions'
import { ContentItem, ActionCenterData, Platform, Status } from '@/lib/types'

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

interface ActionSectionProps {
  title: string
  items: ContentItem[]
  emptyMessage: string
  icon: string
  accentColor: string
}

function ActionSection({ title, items, emptyMessage, icon, accentColor }: ActionSectionProps) {
  const [expanded, setExpanded] = useState(true)

  if (items.length === 0) return null

  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-3 rounded-lg ${accentColor} transition-colors`}
      >
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="font-medium">{title}</span>
          <span className="text-sm opacity-75">({items.length})</span>
        </div>
        <span className="text-sm">{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {items.slice(0, 5).map((item) => (
            <Link
              key={item.id}
              href={`/item/${item.id}`}
              className="block p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs rounded ${platformColors[item.platform]}`}>
                      {item.platform}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded ${statusColors[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 ml-2">
                  {new Date(item.updated_at ?? item.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
          {items.length > 5 && (
            <p className="text-sm text-gray-500 text-center py-2">
              +{items.length - 5} more items
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function ActionCenter() {
  const [data, setData] = useState<ActionCenterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getActionCenterItems()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const totalItems = data
    ? new Set([
        ...data.ideasAndDrafts.map(i => i.id),
        ...data.recentlyCreated.map(i => i.id),
        ...data.stale.map(i => i.id),
      ]).size
    : 0

  if (loading) {
    return (
      <div className="card mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card mb-6 border-red-200 bg-red-50">
        <p className="text-red-600 text-sm">Failed to load Action Center: {error}</p>
      </div>
    )
  }

  if (!data || totalItems === 0) {
    return (
      <div className="card mb-6 bg-green-50 border-green-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <p className="font-medium text-green-800">All caught up!</p>
            <p className="text-sm text-green-600">No items need your attention right now.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card mb-6">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">📋</span>
          <h2 className="text-lg font-semibold text-gray-900">Action Center</h2>
          <span className="text-sm text-gray-500">({totalItems} items)</span>
        </div>
        <span className="text-gray-400 hover:text-gray-600">
          {collapsed ? '▼' : '▲'}
        </span>
      </button>

      {!collapsed && (
        <div>
          <ActionSection
            title="Ideas & Drafts"
            items={data.ideasAndDrafts}
            emptyMessage="No ideas or drafts"
            icon="💡"
            accentColor="bg-yellow-50 hover:bg-yellow-100"
          />

          <ActionSection
            title="New This Week"
            items={data.recentlyCreated}
            emptyMessage="Nothing new this week"
            icon="🆕"
            accentColor="bg-blue-50 hover:bg-blue-100"
          />

          <ActionSection
            title="Needs Attention"
            items={data.stale}
            emptyMessage="Nothing stale"
            icon="⏰"
            accentColor="bg-orange-50 hover:bg-orange-100"
          />
        </div>
      )}
    </div>
  )
}
