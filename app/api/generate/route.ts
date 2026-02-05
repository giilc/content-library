import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { title, platform, notes, tags } = await request.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `You are a social media content expert. Generate content for a ${platform} post.

Title/Topic: ${title}
Platform: ${platform}
Additional Notes: ${notes || 'None provided'}
Tags/Keywords: ${tags || 'None provided'}

Generate the following in JSON format (no markdown, just pure JSON):
{
  "titleIdeas": ["5 engaging title variations for this content"],
  "description": "A compelling description/caption for ${platform} (include relevant emojis, call-to-action)",
  "hashtags": ["15 relevant hashtags without the # symbol"],
  "pinnedComment": "An engaging pinned comment to boost engagement"
}

Make the content:
- Platform-appropriate (${platform} style and best practices)
- Engaging and attention-grabbing
- Include relevant emojis where appropriate
- Optimized for the platform's algorithm

Return ONLY the JSON object, no other text.`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Parse the JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }

    const generated = JSON.parse(jsonMatch[0])

    // Add # to hashtags if not present
    generated.hashtags = generated.hashtags.map((tag: string) =>
      tag.startsWith('#') ? tag : `#${tag}`
    )

    return NextResponse.json(generated)
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
