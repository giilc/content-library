'use server'

import { createClient } from '@/lib/supabase-server'
import {
  ContentItem,
  ActionCenterData,
  Status,
  SavedView,
  SavedViewInsert,
  OutputSlot,
  OutputSlotInsert
} from '@/lib/types'

// =============================================
// ACTION CENTER
// =============================================

export async function getActionCenterItems(): Promise<ActionCenterData> {
  const supabase = await createClient()

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  // Fetch all user's content items
  // Try with updated_at first, fallback to created_at if column doesn't exist
  let data, error

  const result = await supabase
    .from('content_items')
    .select('*')
    .order('created_at', { ascending: false })

  data = result.data
  error = result.error

  if (error) {
    throw new Error(error.message)
  }

  const items = (data || []) as ContentItem[]

  // Categorize items
  const ideasAndDrafts = items.filter(
    item => item.status === 'idea' || item.status === 'draft'
  )

  const recentlyCreated = items.filter(
    item => new Date(item.created_at) >= sevenDaysAgo
  )

  // Use updated_at if available, otherwise fallback to created_at
  const stale = items.filter(item => {
    const lastModified = item.updated_at || item.created_at
    return new Date(lastModified) < fourteenDaysAgo
  })

  return {
    ideasAndDrafts,
    recentlyCreated,
    stale,
  }
}

// =============================================
// GLOBAL SEARCH
// =============================================

export async function searchContent(query: string): Promise<ContentItem[]> {
  const supabase = await createClient()

  if (!query.trim()) {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw new Error(error.message)
    return (data || []) as ContentItem[]
  }

  // Search across title, notes, tags, and yt_link
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .or(`title.ilike.%${query}%,notes.ilike.%${query}%,tags.ilike.%${query}%,yt_link.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return (data || []) as ContentItem[]
}

// =============================================
// BULK ACTIONS
// =============================================

export async function bulkUpdateStatus(
  ids: string[],
  status: Status
): Promise<{ success: boolean; count: number }> {
  const supabase = await createClient()

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('[bulkUpdateStatus] Auth error:', authError)
    throw new Error('Not authenticated')
  }

  console.log('[bulkUpdateStatus] User:', user.id)
  console.log('[bulkUpdateStatus] Updating', ids.length, 'items to status:', status)
  console.log('[bulkUpdateStatus] IDs:', ids)

  const { data, error } = await supabase
    .from('content_items')
    .update({ status, updated_at: new Date().toISOString() })
    .in('id', ids)
    .eq('user_id', user.id)  // Explicitly filter by user for safety
    .select()

  console.log('[bulkUpdateStatus] Result:', { dataCount: data?.length, error })

  if (error) {
    console.error('[bulkUpdateStatus] Error:', error)
    throw new Error(error.message)
  }

  // Check if update actually happened
  if (!data || data.length === 0) {
    console.error('[bulkUpdateStatus] No rows updated - RLS may be blocking')
    throw new Error('Update failed - no items were modified')
  }

  return { success: true, count: data.length }
}

export async function bulkAddTags(
  ids: string[],
  newTags: string
): Promise<{ success: boolean; count: number }> {
  const supabase = await createClient()

  // Fetch current items to merge tags
  const { data: items, error: fetchError } = await supabase
    .from('content_items')
    .select('id, tags')
    .in('id', ids)

  if (fetchError) throw new Error(fetchError.message)

  // Update each item with merged tags
  let updatedCount = 0
  for (const item of items || []) {
    const existingTags = item.tags ? item.tags.split(',').map((t: string) => t.trim()) : []
    const tagsToAdd = newTags.split(',').map(t => t.trim())
    const uniqueTags = Array.from(new Set([...existingTags, ...tagsToAdd]))
    const mergedTags = uniqueTags.join(', ')

    const { error } = await supabase
      .from('content_items')
      .update({ tags: mergedTags })
      .eq('id', item.id)

    if (!error) updatedCount++
  }

  return { success: true, count: updatedCount }
}

export async function bulkDelete(
  ids: string[]
): Promise<{ success: boolean; count: number }> {
  const supabase = await createClient()

  const { error, count } = await supabase
    .from('content_items')
    .delete()
    .in('id', ids)

  if (error) throw new Error(error.message)
  return { success: true, count: count || ids.length }
}

export async function exportContentItems(
  ids?: string[]
): Promise<string> {
  const supabase = await createClient()

  let query = supabase.from('content_items').select('*')

  if (ids?.length) {
    query = query.in('id', ids)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  // Generate CSV
  const headers = ['title', 'platform', 'status', 'notes', 'tags', 'yt_link', 'created_at', 'updated_at']
  const csvRows = [
    headers.join(','),
    ...(data || []).map(item =>
      headers.map(h => {
        const value = (item as Record<string, unknown>)[h]
        const strValue = value?.toString() || ''
        // Escape quotes and wrap in quotes
        return `"${strValue.replace(/"/g, '""')}"`
      }).join(',')
    )
  ]

  return csvRows.join('\n')
}

// =============================================
// SAVED VIEWS
// =============================================

export async function getSavedViews(): Promise<SavedView[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('saved_views')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []) as SavedView[]
}

export async function createSavedView(
  view: SavedViewInsert
): Promise<SavedView> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // If setting as default, unset other defaults first
  if (view.is_default) {
    await supabase
      .from('saved_views')
      .update({ is_default: false })
      .eq('user_id', user.id)
  }

  const { data, error } = await supabase
    .from('saved_views')
    .insert({
      ...view,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as SavedView
}

export async function updateSavedView(
  id: string,
  updates: Partial<SavedViewInsert>
): Promise<SavedView> {
  const supabase = await createClient()

  // If setting as default, unset other defaults first
  if (updates.is_default) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('saved_views')
        .update({ is_default: false })
        .eq('user_id', user.id)
    }
  }

  const { data, error } = await supabase
    .from('saved_views')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as SavedView
}

export async function deleteSavedView(id: string): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('saved_views')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  return { success: true }
}

export async function getDefaultView(): Promise<SavedView | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('saved_views')
    .select('*')
    .eq('is_default', true)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(error.message)
  }

  return data as SavedView | null
}

// =============================================
// OUTPUT SLOTS
// =============================================

export async function getOutputSlots(contentItemId: string): Promise<OutputSlot[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('output_slots')
    .select('*')
    .eq('content_item_id', contentItemId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []) as OutputSlot[]
}

export async function createOutputSlot(
  slot: OutputSlotInsert
): Promise<OutputSlot> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('output_slots')
    .insert({
      ...slot,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as OutputSlot
}

export async function updateOutputSlot(
  id: string,
  updates: Partial<Pick<OutputSlot, 'content' | 'is_pinned'>>
): Promise<OutputSlot> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('output_slots')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as OutputSlot
}

export async function deleteOutputSlot(id: string): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('output_slots')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  return { success: true }
}

export async function pinOutputSlot(
  contentItemId: string,
  slotType: string,
  slotId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  // Unpin all slots of this type for this item
  await supabase
    .from('output_slots')
    .update({ is_pinned: false })
    .eq('content_item_id', contentItemId)
    .eq('slot_type', slotType)

  // Pin the selected slot
  const { error } = await supabase
    .from('output_slots')
    .update({ is_pinned: true })
    .eq('id', slotId)

  if (error) throw new Error(error.message)
  return { success: true }
}
