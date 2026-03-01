import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase.server'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agents, error } = await supabase
    .from('agent_profiles')
    .select('*')
    .eq('clerk_id', userId)
    .order('last_seen', { ascending: false })
    .limit(10000)

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })

  const rows = agents || []

  const headers = [
    'Name', 'Agency Type', 'City', 'State', 'Address',
    'Phone', 'Email', 'Website',
    'Rating', 'Reviews',
    'Score', 'Flag',
    'Carriers',
    'Captive',
    'Hiring',
    'YouTube',
    'Times Seen',
    'First Seen', 'Last Seen',
  ]

  function escape(val: any): string {
    if (val === null || val === undefined) return ''
    const str = Array.isArray(val) ? val.join('; ') : String(val)
    // Wrap in quotes if it contains commas, quotes, or newlines
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csvRows = [
    headers.join(','),
    ...rows.map(a => [
      escape(a.name),
      escape(a.agency_type),
      escape(a.city),
      escape(a.state),
      escape(a.address),
      escape(a.phone),
      escape(a.contact_email),
      escape(a.website),
      escape(a.rating),
      escape(a.reviews),
      escape(a.prometheus_score),
      escape(a.prometheus_flag),
      escape(a.carriers),
      escape(a.captive ? 'Yes' : 'No'),
      escape(a.hiring ? 'Yes' : 'No'),
      escape(a.youtube_channel),
      escape(a.search_count),
      escape(a.first_seen ? new Date(a.first_seen).toLocaleDateString() : ''),
      escape(a.last_seen  ? new Date(a.last_seen).toLocaleDateString()  : ''),
    ].join(',')),
  ]

  const csv = csvRows.join('\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="recruiterrr-agents-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
