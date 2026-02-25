import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase.server'

const ALLOWED_ORIGINS = ['https://recruiterrr.com', 'http://localhost:3000']

export async function GET(req: NextRequest) {
  // CSRF check
  const origin = req.headers.get('origin')
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const { data, error } = await supabase
    .from('searches')
    .select('*')
    .eq('id', id)
    .eq('clerk_id', userId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ search: data })
}
