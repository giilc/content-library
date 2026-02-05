'use client'

import { useState } from 'react'
import { ContentItem, GeneratedContent } from '@/lib/types'

interface GeneratePanelProps {
  item: ContentItem
}

export default function GeneratePanel({ item }: GeneratePanelProps) {
  const [generated, setGenerated] = useState<GeneratedContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          platform: item.platform,
          notes: item.notes,
          tags: item.tags,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Generation failed')
      }

      const content = await res.json()
      setGenerated(content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="card bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Generate Content
          <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
            AI Powered
          </span>
        </h2>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {!generated && !loading ? (
        <p className="text-gray-500 text-sm">
          Click "Generate" to create AI-powered title ideas, description,
          hashtags, and a pinned comment based on your content details.
        </p>
      ) : loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-2">AI is generating your content...</p>
        </div>
      ) : generated ? (
        <div className="space-y-6">
          {/* Title Ideas */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-800">Title Ideas</h3>
              <button
                onClick={() =>
                  copyToClipboard(generated.titleIdeas.join('\n'), 'titles')
                }
                className="text-sm text-blue-600 hover:underline"
              >
                {copied === 'titles' ? 'Copied!' : 'Copy All'}
              </button>
            </div>
            <ul className="space-y-1">
              {generated.titleIdeas.map((title, i) => (
                <li
                  key={i}
                  className="p-2 bg-white rounded border text-sm cursor-pointer hover:bg-gray-50"
                  onClick={() => copyToClipboard(title, `title-${i}`)}
                  title="Click to copy"
                >
                  {copied === `title-${i}` ? 'Copied!' : title}
                </li>
              ))}
            </ul>
          </section>

          {/* Description */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-800">Description</h3>
              <button
                onClick={() =>
                  copyToClipboard(generated.description, 'description')
                }
                className="text-sm text-blue-600 hover:underline"
              >
                {copied === 'description' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="p-3 bg-white rounded border text-sm whitespace-pre-wrap font-sans">
              {generated.description}
            </pre>
          </section>

          {/* Hashtags */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-800">Hashtags</h3>
              <button
                onClick={() =>
                  copyToClipboard(generated.hashtags.join(' '), 'hashtags')
                }
                className="text-sm text-blue-600 hover:underline"
              >
                {copied === 'hashtags' ? 'Copied!' : 'Copy All'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {generated.hashtags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded cursor-pointer hover:bg-blue-200"
                  onClick={() => copyToClipboard(tag, `tag-${i}`)}
                  title="Click to copy"
                >
                  {copied === `tag-${i}` ? 'Copied!' : tag}
                </span>
              ))}
            </div>
          </section>

          {/* Pinned Comment */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-800">Pinned Comment</h3>
              <button
                onClick={() =>
                  copyToClipboard(generated.pinnedComment, 'comment')
                }
                className="text-sm text-blue-600 hover:underline"
              >
                {copied === 'comment' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="p-3 bg-white rounded border text-sm">
              {generated.pinnedComment}
            </p>
          </section>

          {/* Regenerate hint */}
          <p className="text-xs text-gray-400 text-center">
            Click "Generate" again for different AI-generated variations
          </p>
        </div>
      ) : null}
    </div>
  )
}
