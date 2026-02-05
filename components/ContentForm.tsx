'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { ContentItem, ContentItemInsert, Platform, Status } from '@/lib/types'

interface ContentFormProps {
  item?: ContentItem
  mode: 'create' | 'edit'
}

const platforms: Platform[] = ['youtube', 'facebook', 'instagram', 'tiktok']
const statuses: Status[] = ['idea', 'draft', 'posted']

export default function ContentForm({ item, mode }: ContentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<ContentItemInsert>({
    title: item?.title ?? '',
    platform: item?.platform ?? 'youtube',
    status: item?.status ?? 'idea',
    notes: item?.notes ?? '',
    yt_link: item?.yt_link ?? '',
    tags: item?.tags ?? '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    if (mode === 'create') {
      // Try getUser first, fall back to getSession
      let userId: string | null = null

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userId = user.id
      } else {
        // Fallback: try getSession
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          userId = session.user.id
        }
      }

      if (!userId) {
        setError('You must be logged in. Please refresh the page and try again.')
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase
        .from('content_items')
        .insert({ ...formData, user_id: userId })

      if (insertError) {
        setError(`Failed to create: ${insertError.message}`)
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } else {
      const { error: updateError } = await supabase
        .from('content_items')
        .update(formData)
        .eq('id', item!.id)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      router.refresh()
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return

    setLoading(true)
    const supabase = createClient()

    const { error: deleteError } = await supabase
      .from('content_items')
      .delete()
      .eq('id', item!.id)

    if (deleteError) {
      setError(deleteError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="label">
          Title *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          className="input"
          placeholder="My awesome content idea"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="platform" className="label">
            Platform *
          </label>
          <select
            id="platform"
            name="platform"
            value={formData.platform}
            onChange={handleChange}
            className="input"
          >
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="label">
            Status *
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="input"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="label">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes ?? ''}
          onChange={handleChange}
          className="input min-h-[100px]"
          placeholder="Add any notes about this content..."
        />
      </div>

      <div>
        <label htmlFor="yt_link" className="label">
          YouTube Link
        </label>
        <input
          id="yt_link"
          name="yt_link"
          type="url"
          value={formData.yt_link ?? ''}
          onChange={handleChange}
          className="input"
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>

      <div>
        <label htmlFor="tags" className="label">
          Tags (comma-separated)
        </label>
        <input
          id="tags"
          name="tags"
          type="text"
          value={formData.tags ?? ''}
          onChange={handleChange}
          className="input"
          placeholder="tutorial, beginner, tips"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create Item' : 'Save Changes'}
        </button>

        {mode === 'edit' && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="btn btn-danger"
          >
            Delete
          </button>
        )}

        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
