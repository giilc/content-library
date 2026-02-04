import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Content Library',
  description: 'Manage your content and generate posts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
