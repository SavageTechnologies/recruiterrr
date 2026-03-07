// ─── route.ts ─────────────────────────────────────────────────────────────────
// Search agent route handler — orchestration only.
// All logic lives in the workers imported below.
//
// Worker files:
//   config.ts          ← keywords, captive brands, queries per mode  (tune this)
//   preScore.ts        ← deterministic scoring buckets               (tune this)
//   serp.ts            ← SerpAPI google_local fetch + dedup
//   crawl.ts           ← website crawler (homepage + /about)
//   sonnetScore.ts     ← Sonnet prompt + ±15 delta scoring
//   enrichAgent.ts     ← pipeline: preScore → crawl → deltas → Sonnet
//   backgroundEnrich.ts← jobs + YouTube (runs after response)
//   upsert.ts          ← Supabase agent_profiles upsert

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { supabase } from '@/lib/supabase.server'
import { ALLOWED_ORIGINS } from '@/lib/config'

import { MODE_CONFIG } from './_workers/config'
import { fetchAgentsFromSerp } from './_workers/serp'
import { preScore } from './_workers/preScore'
import { enrichAgent } from './_workers/enrichAgent'
import { backgroundEnrichAgent } from './_workers/backgroundEnrich'
import { upsertAgentProfiles } from './_workers/upsert'
import type { AgentResult } from './_workers/types'

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(15, '1 h'),
    analytics: true,
  })
  const { success, reset } = await ratelimit.limit(userId)
  if (!success) return NextResponse.json({
    error: `Rate limit exceeded. Resets at ${new Date(reset).toLocaleTimeString()}.`,
  }, { status: 429 })

  try {
    const { city, state, limit: resultLimit = 10, mode = 'medicare', query = '' } = await req.json()
    if (!city || !state) return NextResponse.json({ error: 'City and state required' }, { status: 400 })

    const clampedLimit = Math.min(50, Math.max(10, Number(resultLimit)))
    const rawAgents = await fetchAgentsFromSerp(city, state, clampedLimit, mode, query)

    if (!rawAgents.length) {
      void supabase.from('searches').insert({
        clerk_id: userId, city, state, mode,
        results_count: 0, hot_count: 0, warm_count: 0, cold_count: 0, agents_json: [],
      })
      return NextResponse.json({ agents: [] })
    }

    // ── Pre-score all candidates (instant, no network) ───────────────────────
    const prescored = rawAgents
      .map(raw => ({ raw, ps: preScore(raw, mode) }))
      .sort((a, b) => b.ps.score - a.ps.score)
      .slice(0, clampedLimit)  // limit applied after sort, not before — preserves best candidates

    // ── Triage: captives and low signal skip enrichment entirely ─────────────
    const { default: pLimit } = await import('p-limit')
    const limiter = pLimit(6)

    const toEnrich = prescored.filter(x => !x.ps.captive && x.ps.score >= 40)
    const coldTail  = prescored.filter(x => x.ps.captive || x.ps.score < 40)

    // ── Enrich qualifying agents: crawl → deltas → Sonnet ───────────────────
    const enrichedRaw = await Promise.all(
      toEnrich.map(({ raw }) => limiter(() => enrichAgent(raw, mode)))
    )

    // ── Cold tail: shape without enrichment ──────────────────────────────────
    const cfg = MODE_CONFIG[mode] || MODE_CONFIG.medicare
    const coldResults: AgentResult[] = coldTail.map(({ raw, ps }) => ({
      name: raw.title || 'Unknown',
      type: raw.type || cfg.typeFallback,
      phone: raw.phone || '', address: raw.address || '',
      rating: raw.rating || 0, reviews: raw.reviews || 0,
      website: raw.website || null,
      carriers: ['Unknown'], captive: ps.captive, wrongLine: false, years: null,
      score: ps.score, flag: 'cold' as const,
      notes: ps.captive ? 'Captive brand — not recruitable.' : 'Low signal — not enriched.',
      hiring: false, hiring_roles: [],
      youtube_channel: null, youtube_subscribers: null, youtube_video_count: 0,
      about: null, contact_email: null, social_links: [],
      _preScore: ps.score, _enrichmentDelta: 0, _sonnetDelta: 0,
    }))

    const enrichedResults: AgentResult[] = enrichedRaw.map(e => ({
      ...e,
      hiring: false,           // populated by background job
      hiring_roles: [],
      youtube_channel: null,
      youtube_subscribers: null,
      youtube_video_count: 0,
    }))

    const sorted = [...enrichedResults, ...coldResults].sort((a, b) => b.score - a.score)

    // ── Persist to DB — awaited so Vercel doesn't kill before writes complete ──
    await Promise.all([
      upsertAgentProfiles(userId, city, state, sorted).catch(err =>
        console.error('[/api/search] upsert error:', err)
      ),
      Promise.resolve(supabase.from('searches').insert({
        clerk_id: userId, city, state, mode,
        results_count: sorted.length,
        hot_count: sorted.filter(a => a.flag === 'hot').length,
        warm_count: sorted.filter(a => a.flag === 'warm').length,
        cold_count: sorted.filter(a => a.flag === 'cold').length,
        agents_json: sorted,
      })).catch((err: unknown) => console.error('[/api/search] searches insert error:', err)),
    ])

    // ── Background enrichment — truly detached, runs after response ──────────
    // After jobs + YouTube resolve, patch searches.agents_json so saved-search
    // views reflect the enriched data instead of the pre-enrichment snapshot.
    const searchInsert = await supabase
      .from('searches')
      .select('id')
      .eq('clerk_id', userId)
      .eq('city', city)
      .eq('state', state)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    const searchId = searchInsert.data?.id ?? null

    enrichedRaw
      .filter(e => e.flag !== 'cold')
      .forEach(e =>
        backgroundEnrichAgent(userId, e.name, city, state, mode, e._youtubeLink)
          .then(async (enriched) => {
            if (!searchId || !enriched) return
            // Re-fetch the current agents_json and patch matching agent
            const { data: saved } = await supabase
              .from('searches')
              .select('agents_json')
              .eq('id', searchId)
              .single()
            if (!saved?.agents_json) return
            const patched = (saved.agents_json as any[]).map((a: any) =>
              a.name === e.name
                ? { ...a, hiring: enriched.hiring, hiring_roles: enriched.hiring_roles,
                    youtube_channel: enriched.youtube_channel, youtube_subscribers: enriched.youtube_subscribers }
                : a
            )
            await supabase.from('searches').update({ agents_json: patched }).eq('id', searchId)
          })
          .catch(err => console.error('[backgroundEnrichAgent]', e.name, err))
      )

    // Strip internal debug fields before sending to client
    const clientResults = sorted.map(({ _preScore, _enrichmentDelta, _sonnetDelta, ...rest }: any) => rest)
    return NextResponse.json({ agents: clientResults })

  } catch (err) {
    console.error('[/api/search] error:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
