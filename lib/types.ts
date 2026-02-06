export type Platform = 'youtube' | 'facebook' | 'instagram' | 'tiktok'
export type Status = 'idea' | 'draft' | 'posted'
export type SlotType = 'title' | 'description' | 'hashtags' | 'pinned_comment'

export interface ContentItem {
  id: string
  created_at: string
  updated_at?: string // Optional until migration is run
  user_id: string
  title: string
  platform: Platform
  status: Status
  notes: string | null
  yt_link: string | null
  tags: string | null
}

export interface ContentItemInsert {
  title: string
  platform: Platform
  status: Status
  notes?: string | null
  yt_link?: string | null
  tags?: string | null
}

export interface ContentItemUpdate extends Partial<ContentItemInsert> {}

export interface GeneratedContent {
  titleIdeas: string[]
  description: string
  hashtags: string[]
  pinnedComment: string
}

// Saved Views
export interface SavedViewFilters {
  platform?: Platform | 'all'
  status?: Status | 'all'
  search?: string
  dateRange?: 'all' | '7days' | '30days'
  isStale?: boolean
  isActionCenter?: boolean
}

export interface SavedView {
  id: string
  user_id: string
  name: string
  filters: SavedViewFilters
  is_default: boolean
  created_at: string
}

export interface SavedViewInsert {
  name: string
  filters: SavedViewFilters
  is_default?: boolean
}

// Output Slots (versioned AI outputs)
export interface OutputSlot {
  id: string
  content_item_id: string
  user_id: string
  slot_type: SlotType
  variant: string
  content: string
  is_pinned: boolean
  created_at: string
}

export interface OutputSlotInsert {
  content_item_id: string
  slot_type: SlotType
  variant: string
  content: string
  is_pinned?: boolean
}

// Action Center
export interface ActionCenterData {
  ideasAndDrafts: ContentItem[]
  recentlyCreated: ContentItem[]
  stale: ContentItem[]
}
