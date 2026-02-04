export type Platform = 'youtube' | 'facebook' | 'instagram' | 'tiktok'
export type Status = 'idea' | 'draft' | 'posted'

export interface ContentItem {
  id: string
  created_at: string
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
