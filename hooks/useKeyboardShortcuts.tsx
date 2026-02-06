'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface KeyboardShortcutsOptions {
  onSearch?: () => void
  onGenerate?: () => void
  onCopyLatest?: () => void
  enableNavigation?: boolean
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const router = useRouter()
  const { onSearch, onGenerate, onCopyLatest, enableNavigation = true } = options

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      // Don't trigger shortcuts when typing in input fields
      // Exception: Cmd/Ctrl combos should still work
      if (isInputField && !e.metaKey && !e.ctrlKey) {
        return
      }

      // N = New item (only when not in input)
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !isInputField && enableNavigation) {
        e.preventDefault()
        router.push('/new')
      }

      // / = Focus search
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !isInputField) {
        e.preventDefault()
        onSearch?.()
      }

      // Cmd/Ctrl + Enter = Generate
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onGenerate?.()
      }

      // Cmd/Ctrl + Shift + C = Copy latest output (when no text selected)
      if (
        e.key === 'c' &&
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        !window.getSelection()?.toString()
      ) {
        e.preventDefault()
        onCopyLatest?.()
      }

      // Escape = Go back to dashboard (when not in input)
      if (e.key === 'Escape' && !isInputField && enableNavigation) {
        // Only navigate if we're on a detail page
        if (window.location.pathname.startsWith('/item/')) {
          e.preventDefault()
          router.push('/dashboard')
        }
      }
    },
    [router, onSearch, onGenerate, onCopyLatest, enableNavigation]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Keyboard shortcut hints component
export function KeyboardHints() {
  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-75 hover:opacity-100 transition-opacity">
      <div className="flex gap-4">
        <span><kbd className="bg-gray-700 px-1.5 py-0.5 rounded">N</kbd> New</span>
        <span><kbd className="bg-gray-700 px-1.5 py-0.5 rounded">/</kbd> Search</span>
        <span><kbd className="bg-gray-700 px-1.5 py-0.5 rounded">⌘↵</kbd> Generate</span>
      </div>
    </div>
  )
}
