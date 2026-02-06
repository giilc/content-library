'use client'

import { useState, useRef, useEffect } from 'react'
import { Status } from '@/lib/types'
import { bulkUpdateStatus, bulkDelete } from '@/lib/actions'

interface BulkActionsBarProps {
  selectedIds: string[]
  onClearSelection: () => void
  onActionComplete: () => void
}

export default function BulkActionsBar({
  selectedIds,
  onClearSelection,
  onActionComplete,
}: BulkActionsBarProps) {
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  if (selectedIds.length === 0) return null

  const handleStatusChange = async (status: Status) => {
    const count = selectedIds.length
    setLoading(true)
    try {
      await bulkUpdateStatus(selectedIds, status)
      setToast(`Updated ${count} item${count > 1 ? 's' : ''} to "${status}"`)
      onClearSelection()
      onActionComplete()
    } catch (err) {
      console.error('Failed to update status:', err)
      setToast('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await bulkDelete(selectedIds)
      setShowDeleteConfirm(false)
      onClearSelection()
      onActionComplete()
    } catch (err) {
      console.error('Failed to delete:', err)
      alert('Failed to delete items')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `content-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Failed to export:', err)
      alert('Failed to export items')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating action bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-4 z-50">
        <div className="flex items-center gap-2 pr-4 border-r border-gray-700">
          <span className="font-medium">{selectedIds.length}</span>
          <span className="text-gray-400">selected</span>
          <button
            onClick={onClearSelection}
            className="ml-2 text-gray-400 hover:text-white"
            title="Clear selection"
          >
            ✕
          </button>
        </div>

        {/* Status dropdown */}
        <div className="relative" ref={statusMenuRef}>
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            disabled={loading}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
          >
            Status {showStatusMenu ? '▴' : '▾'}
          </button>
          {showStatusMenu && (
            <div className="absolute bottom-full left-0 mb-2">
              <div className="bg-gray-800 rounded-lg shadow-xl py-1 min-w-[120px]">
                <button
                  onClick={() => { handleStatusChange('idea'); setShowStatusMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                  Idea
                </button>
                <button
                  onClick={() => { handleStatusChange('draft'); setShowStatusMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  Draft
                </button>
                <button
                  onClick={() => { handleStatusChange('posted'); setShowStatusMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  Posted
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          disabled={loading}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm disabled:opacity-50"
        >
          Export CSV
        </button>

        {/* Delete */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={loading}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm disabled:opacity-50"
        >
          Delete
        </button>

        {loading && (
          <div className="absolute inset-0 bg-gray-900/80 rounded-xl flex items-center justify-center">
            <span className="text-sm">Processing...</span>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''}?
            </h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. The selected items will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          {toast}
        </div>
      )}
    </>
  )
}
