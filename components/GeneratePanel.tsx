'use client'

import { useState } from 'react'
import { ContentItem, GeneratedContent } from '@/lib/types'
import { generateContent } from '@/lib/generator'

interface GeneratePanelProps {
  item: ContentItem
}

export default function GeneratePanel({ item }: GeneratePanelProps) {
  const [generated, setGenerated] = useState<GeneratedContent | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const handleGenerate = () => {
    const content = generateContent(item)
    setGenerated(content)
  }

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="card bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Generate Content</h2>
        <button onClick={handleGenerate} className="btn btn-primary">
          Generate
        </button>
      </div>

      {!generated ? (
        <p className="text-gray-500 text-sm">
          Click "Generate" to create title ideas, description, hashtags, and a
          pinned comment based on your content details.
        </p>
      ) : (
        <div className="space-y-6">
          {/* Title Ideas */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-800">Title Ideas (5)</h3>
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
              <h3 className="font-medium text-gray-800">Hashtags (15)</h3>
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
            Click "Generate" again for different variations
          </p>
        </div>
      )}
    </div>
  )
}
