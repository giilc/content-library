import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const ids: string[] | undefined = body.ids

    let query = supabase.from('content_items').select('*')

    if (ids?.length) {
      query = query.in('id', ids)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

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

    const csv = csvRows.join('\n')
    const filename = `content-export-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (err) {
    console.error('Export error:', err)
    return NextResponse.json(
      { error: 'Failed to export content' },
      { status: 500 }
    )
  }
}
