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
  const weekStart  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // All users who have completed Clerk signup
  const { data: users } = await supabase
    .from('users')
    .select('clerk_id, email, first_name, last_name, plan, subscription_status, stripe_customer_id, created_at')
    .not('clerk_id', 'is', null)
    .order('created_at', { ascending: false })

  const payingUsers = (users || []).filter(
    u => u.plan === 'pro' && u.subscription_status === 'active'
  )

  // Real total counts with no row limit
  const { count: totalSearchCount }    = await supabase.from('searches').select('*', { count: 'exact', head: true })
  const { count: totalAnathemaCount }  = await supabase.from('anathema_specimens').select('*', { count: 'exact', head: true })
  const { count: totalPrometheusCount }= await supabase.from('prometheus_scans').select('*', { count: 'exact', head: true })
  const { count: searchesTodayCount }  = await supabase.from('searches').select('*', { count: 'exact', head: true }).gte('created_at', todayStart)
  const { count: anathemaTodayCount }  = await supabase.from('anathema_specimens').select('*', { count: 'exact', head: true }).gte('updated_at', todayStart)
  const { count: searchesMonthCount }  = await supabase.from('searches').select('*', { count: 'exact', head: true }).gte('created_at', monthStart)
  const { count: anathemaMonthCount }  = await supabase.from('anathema_specimens').select('*', { count: 'exact', head: true }).gte('updated_at', monthStart)
  const { count: prometheusMonthCount }= await supabase.from('prometheus_scans').select('*', { count: 'exact', head: true }).gte('created_at', monthStart)

  // Per-user activity rows (higher limits for accuracy)
  const { data: allSearches }    = await supabase.from('searches').select('clerk_id, city, state, results_count, created_at').order('created_at', { ascending: false }).limit(2000)
  const { data: allScans }       = await supabase.from('anathema_specimens').select('clerk_id, agent_name, city, state, predicted_tree, confirmed_tree, created_at, updated_at').order('updated_at', { ascending: false }).limit(2000)
  const { data: allPrometheus }  = await supabase.from('prometheus_scans').select('clerk_id, domain, created_at').order('created_at', { ascending: false }).limit(1000)

  // Tree distribution — counted in DB, not pulled into JS memory
  const [
    { count: integrityCount },
    { count: ameriCount },
    { count: smsCount },
  ] = await Promise.all([
    supabase.from('anathema_specimens').select('*', { count: 'exact', head: true }).or('confirmed_tree.eq.integrity,predicted_tree.eq.integrity'),
    supabase.from('anathema_specimens').select('*', { count: 'exact', head: true }).or('confirmed_tree.eq.amerilife,predicted_tree.eq.amerilife'),
    supabase.from('anathema_specimens').select('*', { count: 'exact', head: true }).or('confirmed_tree.eq.sms,predicted_tree.eq.sms'),
  ])
  const treeCounts = {
    integrity_count: integrityCount ?? 0,
    amerilife_count: ameriCount    ?? 0,
    sms_count:       smsCount      ?? 0,
    unknown_count:   0, // derived below from total - known
  }
  treeCounts.unknown_count = Math.max(0, (totalAnathemaCount ?? 0) - treeCounts.integrity_count - treeCounts.amerilife_count - treeCounts.sms_count)

  // Per-user map
  type UserActivity = {
    searches_total: number; searches_today: number; searches_week: number; searches_month: number
    anathema_total: number; anathema_today: number; anathema_month: number
    prometheus_total: number; prometheus_month: number
    last_active: string | null
    recent_searches: Array<{ city: string; state: string; results: number; at: string }>
  }
  const userMap: Record<string, UserActivity> = {}
  for (const u of users || []) {
    if (!u.clerk_id) continue
    userMap[u.clerk_id] = {
      searches_total: 0, searches_today: 0, searches_week: 0, searches_month: 0,
      anathema_total: 0, anathema_today: 0, anathema_month: 0,
      prometheus_total: 0, prometheus_month: 0,
      last_active: null, recent_searches: [],
    }
  }

  for (const s of allSearches || []) {
    if (!userMap[s.clerk_id]) continue
    const u = userMap[s.clerk_id]
    u.searches_total++
    if (s.created_at >= todayStart) u.searches_today++
    if (s.created_at >= weekStart)  u.searches_week++
    if (s.created_at >= monthStart) u.searches_month++
    if (!u.last_active || s.created_at > u.last_active) u.last_active = s.created_at
    if (u.recent_searches.length < 5) u.recent_searches.push({ city: s.city, state: s.state, results: s.results_count, at: s.created_at })
  }

  for (const s of allScans || []) {
    if (!userMap[s.clerk_id]) continue
    const u = userMap[s.clerk_id]
    u.anathema_total++
    if (s.updated_at >= todayStart) u.anathema_today++
    if (s.updated_at >= monthStart) u.anathema_month++
    if (!u.last_active || s.updated_at > u.last_active) u.last_active = s.updated_at
  }

  for (const s of allPrometheus || []) {
    if (!userMap[s.clerk_id]) continue
    userMap[s.clerk_id].prometheus_total++
    if (s.created_at >= monthStart) userMap[s.clerk_id].prometheus_month++
  }

  const global = {
    total_users:      (users || []).length,
    paying_users:     payingUsers.length,
    total_searches:   totalSearchCount    ?? 0,
    searches_today:   searchesTodayCount  ?? 0,
    searches_week:    allSearches?.filter(s => s.created_at >= weekStart).length ?? 0,
    searches_month:   searchesMonthCount  ?? 0,
    total_anathema:   totalAnathemaCount  ?? 0,
    anathema_today:   anathemaTodayCount  ?? 0,
    anathema_month:   anathemaMonthCount  ?? 0,
    total_prometheus: totalPrometheusCount ?? 0,
    prometheus_month: prometheusMonthCount ?? 0,
    ...treeCounts,
  }

  // Activity feed — email lookup map built once to avoid O(n²) finds
  const emailByClerkId = Object.fromEntries((users || []).map(u => [u.clerk_id, u.email || 'unknown']))
  const recentActivity: Array<{ type: string; user_email: string; detail: string; at: string }> = []
  for (const s of (allSearches || []).slice(0, 15)) {
    recentActivity.push({ type: 'SEARCH', user_email: emailByClerkId[s.clerk_id] || 'unknown', detail: `${s.city}, ${s.state} — ${s.results_count} agents`, at: s.created_at })
  }
  for (const s of (allScans || []).slice(0, 15)) {
    recentActivity.push({ type: 'ANATHEMA', user_email: emailByClerkId[s.clerk_id] || 'unknown', detail: `${s.agent_name} — ${s.confirmed_tree || s.predicted_tree || 'unknown'}`, at: s.updated_at })
  }
  for (const s of (allPrometheus || []).slice(0, 10)) {
    recentActivity.push({ type: 'PROMETHEUS', user_email: emailByClerkId[s.clerk_id] || 'unknown', detail: s.domain, at: s.created_at })
  }
  recentActivity.sort((a, b) => b.at.localeCompare(a.at))

  const blank: UserActivity = { searches_total: 0, searches_today: 0, searches_week: 0, searches_month: 0, anathema_total: 0, anathema_today: 0, anathema_month: 0, prometheus_total: 0, prometheus_month: 0, last_active: null, recent_searches: [] }

  const userList = (users || []).map(u => ({
    clerk_id: u.clerk_id,
    email: u.email,
    name: [u.first_name, u.last_name].filter(Boolean).join(' ') || null,
    plan: u.plan,
    subscription_status: u.subscription_status,
    is_paying: u.plan === 'pro' && u.subscription_status === 'active',
    joined: u.created_at,
    ...(userMap[u.clerk_id] || blank),
  })).sort((a, b) => (b.last_active || '').localeCompare(a.last_active || ''))

  return NextResponse.json({ global, users: userList, recent_activity: recentActivity.slice(0, 30) })
}
