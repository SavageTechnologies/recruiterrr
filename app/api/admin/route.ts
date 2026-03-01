import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase.server'
import { isAdmin } from '@/lib/auth/access'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // ── All users ──────────────────────────────────────────────────────────────
  const { data: users } = await supabase
    .from('users')
    .select('clerk_id, email, first_name, last_name, created_at')
    .order('created_at', { ascending: false })

  // ── Searches ──────────────────────────────────────────────────────────────
  const { data: allSearches } = await supabase
    .from('searches')
    .select('clerk_id, city, state, results_count, hot_count, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  // ── ANATHEMA scans ─────────────────────────────────────────────────────────
  const { data: allScans } = await supabase
    .from('anathema_specimens')
    .select('clerk_id, agent_name, city, state, predicted_tree, confirmed_tree, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(500)

  // ── Prometheus scans ───────────────────────────────────────────────────────
  const { data: allPrometheus } = await supabase
    .from('prometheus_scans')
    .select('clerk_id, domain, score, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  // ── Agent profiles ─────────────────────────────────────────────────────────
  const { data: profileStats } = await supabase
    .from('agent_profiles')
    .select('clerk_id, prometheus_flag, anathema_run, state, created_at')

  // ── Build per-user activity map ────────────────────────────────────────────
  const userMap: Record<string, {
    searches_total: number
    searches_today: number
    searches_week: number
    anathema_total: number
    anathema_today: number
    prometheus_total: number
    profiles_total: number
    last_active: string | null
    recent_searches: Array<{ city: string; state: string; results: number; at: string }>
  }> = {}

  for (const u of users || []) {
    userMap[u.clerk_id] = {
      searches_total: 0, searches_today: 0, searches_week: 0,
      anathema_total: 0, anathema_today: 0,
      prometheus_total: 0, profiles_total: 0,
      last_active: null, recent_searches: [],
    }
  }

  for (const s of allSearches || []) {
    if (!userMap[s.clerk_id]) continue
    const u = userMap[s.clerk_id]
    u.searches_total++
    if (s.created_at >= todayStart) u.searches_today++
    if (s.created_at >= weekStart) u.searches_week++
    if (!u.last_active || s.created_at > u.last_active) u.last_active = s.created_at
    if (u.recent_searches.length < 5) {
      u.recent_searches.push({ city: s.city, state: s.state, results: s.results_count, at: s.created_at })
    }
  }

  for (const s of allScans || []) {
    if (!userMap[s.clerk_id]) continue
    const u = userMap[s.clerk_id]
    u.anathema_total++
    if (s.updated_at >= todayStart) u.anathema_today++
    if (!u.last_active || s.updated_at > u.last_active) u.last_active = s.updated_at
  }

  for (const s of allPrometheus || []) {
    if (!userMap[s.clerk_id]) continue
    userMap[s.clerk_id].prometheus_total++
  }

  for (const p of profileStats || []) {
    if (!userMap[p.clerk_id]) continue
    userMap[p.clerk_id].profiles_total++
  }

  // ── Global stats ───────────────────────────────────────────────────────────
  const global = {
    total_users:       users?.length ?? 0,
    total_searches:    allSearches?.length ?? 0,
    searches_today:    allSearches?.filter(s => s.created_at >= todayStart).length ?? 0,
    searches_week:     allSearches?.filter(s => s.created_at >= weekStart).length ?? 0,
    total_anathema:    allScans?.length ?? 0,
    anathema_today:    allScans?.filter(s => s.updated_at >= todayStart).length ?? 0,
    total_prometheus:  allPrometheus?.length ?? 0,
    total_profiles:    profileStats?.length ?? 0,
    profiles_with_anathema: profileStats?.filter(p => p.anathema_run).length ?? 0,
    // Tree distribution
    integrity_count:   allScans?.filter(s => (s.confirmed_tree || s.predicted_tree) === 'integrity').length ?? 0,
    amerilife_count:   allScans?.filter(s => (s.confirmed_tree || s.predicted_tree) === 'amerilife').length ?? 0,
    sms_count:         allScans?.filter(s => (s.confirmed_tree || s.predicted_tree) === 'sms').length ?? 0,
    unknown_count:     allScans?.filter(s => (s.confirmed_tree || s.predicted_tree) === 'unknown' || (!s.confirmed_tree && !s.predicted_tree)).length ?? 0,
  }

  // ── Recent activity feed (last 20 events across all users) ─────────────────
  const recentActivity: Array<{ type: string; user_email: string; detail: string; at: string }> = []

  for (const s of (allSearches || []).slice(0, 10)) {
    const user = users?.find(u => u.clerk_id === s.clerk_id)
    recentActivity.push({
      type: 'SEARCH',
      user_email: user?.email || s.clerk_id.slice(0, 12),
      detail: `${s.city}, ${s.state} — ${s.results_count} agents`,
      at: s.created_at,
    })
  }

  for (const s of (allScans || []).slice(0, 10)) {
    const user = users?.find(u => u.clerk_id === s.clerk_id)
    recentActivity.push({
      type: 'ANATHEMA',
      user_email: user?.email || s.clerk_id.slice(0, 12),
      detail: `${s.agent_name} — ${s.confirmed_tree || s.predicted_tree || 'unknown'}`,
      at: s.updated_at,
    })
  }

  recentActivity.sort((a, b) => b.at.localeCompare(a.at))

  // ── Assemble user list ─────────────────────────────────────────────────────
  const userList = (users || []).map(u => ({
    clerk_id: u.clerk_id,
    email: u.email,
    name: [u.first_name, u.last_name].filter(Boolean).join(' ') || null,
    joined: u.created_at,
    ...userMap[u.clerk_id],
  })).sort((a, b) => (b.last_active || '').localeCompare(a.last_active || ''))

  return NextResponse.json({ global, users: userList, recent_activity: recentActivity.slice(0, 20) })
}
