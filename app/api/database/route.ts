import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase.server'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const flag      = searchParams.get('flag') || 'all'
  const tree      = searchParams.get('tree') || 'all'
  const anathema  = searchParams.get('anathema') || 'all'
  const state     = searchParams.get('state') || 'all'
  const city      = searchParams.get('city') || 'all'
  const hasPhone  = searchParams.get('has_phone') === 'true'
  const search    = searchParams.get('search') || ''
  const sort      = searchParams.get('sort') || 'last_seen'
  const page      = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const perPage   = Math.min(100, Math.max(10, parseInt(searchParams.get('per_page') || '10')))
  const offset    = (page - 1) * perPage

  // ── Base query ─────────────────────────────────────────────────────────────
  let query = supabase
    .from('agent_profiles')
    .select('*', { count: 'exact' })
    .eq('clerk_id', userId)

  // ── Filters ────────────────────────────────────────────────────────────────
  if (flag !== 'all') query = query.eq('prometheus_flag', flag)
  if (tree !== 'all') query = query.eq('predicted_tree', tree)
  if (state !== 'all') query = query.eq('state', state.toUpperCase())
  if (city !== 'all') query = query.ilike('city', city)
  if (hasPhone) query = query.not('phone', 'is', null)
  if (anathema === 'scanned') query = query.eq('anathema_run', true)
  if (anathema === 'unscanned') query = query.eq('anathema_run', false)
  if (search.trim()) query = query.ilike('name', `%${search.trim()}%`)

  // ── Sort ───────────────────────────────────────────────────────────────────
  if (sort === 'score') {
    query = query.order('prometheus_score', { ascending: false, nullsFirst: false })
  } else if (sort === 'search_count') {
    query = query.order('search_count', { ascending: false })
  } else {
    query = query.order('last_seen', { ascending: false })
  }

  // ── Pagination ─────────────────────────────────────────────────────────────
  query = query.range(offset, offset + perPage - 1)

  const { data: agents, error, count } = await query

  if (error) {
    console.error('[/api/database] query error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  // ── Stats (always unfiltered) ──────────────────────────────────────────────
  const { data: allProfiles } = await supabase
    .from('agent_profiles')
    .select('prometheus_flag, anathema_run, state, city, hiring, phone')
    .eq('clerk_id', userId)

  const allStates = [...new Set(allProfiles?.map(a => a.state).filter(Boolean))].sort() as string[]
  const allCities = [...new Set(allProfiles?.map(a => a.city).filter(Boolean))].sort() as string[]

  const stats = {
    total:        allProfiles?.length ?? 0,
    hot:          allProfiles?.filter(a => a.prometheus_flag === 'hot').length ?? 0,
    anathema_run: allProfiles?.filter(a => a.anathema_run).length ?? 0,
    states:       allStates.length,
    hiring:       allProfiles?.filter(a => a.hiring).length ?? 0,
    with_phone:   allProfiles?.filter(a => a.phone).length ?? 0,
  }

  return NextResponse.json({
    agents: agents || [],
    stats,
    allStates,
    allCities,
    pagination: {
      total: count ?? 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count ?? 0) / perPage),
    },
  })
}
