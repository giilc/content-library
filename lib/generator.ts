import { ContentItem, GeneratedContent, Platform } from './types'

const platformHashtags: Record<Platform, string[]> = {
  youtube: ['youtube', 'youtuber', 'subscribe', 'video', 'viral', 'trending', 'creator', 'content'],
  facebook: ['facebook', 'fbpost', 'socialmedia', 'share', 'community', 'viral', 'trending'],
  instagram: ['instagram', 'instagood', 'instadaily', 'reels', 'explore', 'viral', 'trending', 'photooftheday'],
  tiktok: ['tiktok', 'fyp', 'foryou', 'foryoupage', 'viral', 'trending', 'tiktokviral', 'tiktoktrend'],
}

const titleTemplates = [
  "How to {topic} (Complete Guide)",
  "{topic} - What You Need to Know",
  "The Truth About {topic}",
  "{topic} Explained in Simple Terms",
  "Why {topic} Matters More Than You Think",
  "{topic}: Tips That Actually Work",
  "Stop Making These {topic} Mistakes",
  "The Ultimate {topic} Tutorial",
  "I Tried {topic} For a Week - Here's What Happened",
  "{topic} 101: Everything Beginners Should Know",
]

const descriptionTemplates: Record<Platform, string> = {
  youtube: `In this video, I dive deep into {title}.

{notes}

Make sure to LIKE, SUBSCRIBE, and hit the notification bell to stay updated!

{tags}

#shorts #viral`,
  facebook: `{title}

{notes}

What do you think? Drop your thoughts in the comments!

{tags}`,
  instagram: `{title}

{notes}

Double tap if you agree! Save this for later.

{tags}`,
  tiktok: `{title}

{notes}

Follow for more content like this!

{tags}`,
}

const commentTemplates: Record<Platform, string[]> = {
  youtube: [
    "Want more content like this? Let me know in the replies!",
    "Which part was most helpful? Comment below!",
    "Drop a comment if you learned something new today!",
    "Questions? Ask below and I'll reply!",
  ],
  facebook: [
    "Share this with someone who needs to see it!",
    "Tag a friend who would love this!",
    "What's your experience with this? Let me know!",
  ],
  instagram: [
    "Save this post for later!",
    "Tag someone who needs to see this!",
    "Drop an emoji if this resonated with you!",
  ],
  tiktok: [
    "Follow for Part 2!",
    "Save this for later!",
    "Stitch this with your thoughts!",
    "Duet this with your reaction!",
  ],
}

function extractTopic(title: string): string {
  // Remove common prefixes/suffixes
  return title
    .replace(/^(how to|why|what|the|a|an)\s+/i, '')
    .replace(/\s*[-:]\s*.*/i, '')
    .trim()
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function generateContent(item: ContentItem): GeneratedContent {
  const topic = extractTopic(item.title)
  const userTags = item.tags?.split(',').map(t => t.trim().toLowerCase()) || []

  // Generate 5 title ideas
  const shuffledTemplates = shuffleArray(titleTemplates)
  const titleIdeas = shuffledTemplates.slice(0, 5).map(template =>
    template.replace(/{topic}/g, topic)
  )

  // Generate hashtags (15 total)
  const platformTags = platformHashtags[item.platform]
  const combinedTags = [...new Set([...userTags, ...platformTags])]
  const selectedTags = shuffleArray(combinedTags).slice(0, 15)
  const hashtags = selectedTags.map(tag => `#${tag.replace(/^#/, '')}`)

  // Generate description
  const descTemplate = descriptionTemplates[item.platform]
  const description = descTemplate
    .replace(/{title}/g, item.title)
    .replace(/{notes}/g, item.notes || 'Check out this content!')
    .replace(/{tags}/g, hashtags.join(' '))

  // Generate pinned comment
  const comments = commentTemplates[item.platform]
  const pinnedComment = comments[Math.floor(Math.random() * comments.length)]

  return {
    titleIdeas,
    description,
    hashtags,
    pinnedComment,
  }
}
