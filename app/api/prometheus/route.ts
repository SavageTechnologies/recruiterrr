export const runtime = 'nodejs'
export const maxDuration = 120  // crawl + SERP + Sonnet analysis

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { supabase } from '@/lib/supabase.server'
import { hasActiveSubscription } from '@/lib/auth/access'
import { ALLOWED_ORIGINS } from '@/lib/config'

import type { SerpDebugEntry } from '@/lib/domain/prometheus/types'
import { normalizeUrl, discoverWebsite } from '@/lib/domain/prometheus/discovery'
import { crawlFMOSite } from '@/lib/domain/prometheus/crawler'
import { fetchSerpIntel } from '@/lib/domain/prometheus/serp'
import { runClaudeAnalysis } from '@/lib/domain/prometheus/analyzer'

// Re-export so existing imports from this route still work
export type { SerpDebugEntry }

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await hasActiveSubscription(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (id) {
    const { data, error } = await supabase
      .from('prometheus_scans')
      .select('*')
      .eq('id', id)
      .eq('clerk_id', userId)
      .single()
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ scan: data })
  }

  const { data, error } = await supabase
    .from('prometheus_scans')
    .select('id, domain, score, verdict, fmo_size, vendor_tier, actively_recruiting, has_contacts, contacts, is_shared_lead, pages_scanned, created_at')
    .eq('clerk_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  return NextResponse.json({ scans: data || [] })
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await hasActiveSubscription(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(20, '1 h'), analytics: true })
  const { success, reset } = await ratelimit.limit(userId)
  if (!success) return NextResponse.json({ error: `Rate limit exceeded. Resets at ${new Date(reset).toLocaleTimeString()}.` }, { status: 429 })

  try {
    const { fmo_name, website } = await req.json()
    if (!fmo_name || typeof fmo_name !== 'string') {
      return NextResponse.json({ error: 'FMO name required' }, { status: 400 })
    }

    const [discoveryResult, serpResult] = await Promise.all([
      website
        ? Promise.resolve({ url: normalizeUrl(website), debug: { query: 'user-provided', key: 'website_discovery', results: [], signals_fired: ['User provided URL directly'] } as SerpDebugEntry })
        : discoverWebsite(fmo_name),
      fetchSerpIntel(fmo_name, website || null),
    ])

    const baseUrl = discoveryResult.url
    const domain = baseUrl ? baseUrl.replace('https://', '').replace('http://', '') : null
    const crawlResult = baseUrl ? await crawlFMOSite(baseUrl) : { pages: {}, foundPages: [] }
    const analysis = await runClaudeAnalysis(fmo_name, domain, crawlResult.pages, serpResult.intel, crawlResult.foundPages)

    const serpDebug = [discoveryResult.debug, ...serpResult.serpDebug]
    const pagesCount = crawlResult.foundPages.length
    const groundTruthScore = pagesCount >= 5 ? 90 : pagesCount >= 3 ? 65 : pagesCount >= 1 ? 40 : 15
    const contacts = Array.isArray(analysis.contacts) ? analysis.contacts : []
    const activelyRecruiting = analysis.recruiting_activity?.actively_recruiting === true
    const fmoSize = analysis.size_signal || 'UNKNOWN'

    const { data: saved, error: saveError } = await supabase
      .from('prometheus_scans')
      .insert({
        clerk_id: userId,
        domain: fmo_name,
        score: groundTruthScore,
        verdict: fmoSize,
        vendor_tier: analysis.tree_affiliation || 'UNKNOWN',
        fmo_size: fmoSize,
        contacts,
        actively_recruiting: activelyRecruiting,
        has_contacts: contacts.length > 0,
        is_shared_lead: false,
        pages_scanned: crawlResult.foundPages,
        analysis_json: analysis,
        serp_debug: serpDebug,
      })
      .select('id')
      .single()

    if (saveError) console.error('[/api/prometheus] save error:', saveError)

    return NextResponse.json({
      id: saved?.id || null,
      fmo_name,
      domain,
      pages: crawlResult.foundPages,
      analysis,
      serp_debug: serpDebug,
      cached: false,
    })

  } catch (err) {
    console.error('[/api/prometheus] scan failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Scan failed. Please try again.' }, { status: 500 })
  }
}
