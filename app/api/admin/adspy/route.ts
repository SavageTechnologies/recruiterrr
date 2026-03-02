export const runtime = 'nodejs'
export const maxDuration = 120

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { isAdmin } from '@/lib/auth/access'

const APIFY_BASE = 'https://api.apify.com/v2'
const ACTOR_ID = 'curious_coder~facebook-ads-library-scraper'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type AdResult = {
  advertiser_name: string
  advertiser_page_url: string | null
  ad_text: string
  spend_range: string | null
  start_date: string | null
  is_active: boolean
  platforms: string[]
  ad_type: 'recruiting' | 'sales' | 'brand' | 'unknown'
  recruitable: boolean
  claude_take: string
}

// ─── APIFY RUNNER ─────────────────────────────────────────────────────────────

async function runApifyAdScraper(keyword: string, country: string): Promise<any[]> {
  const apiKey = process.env.APIFY_API_KEY
  if (!apiKey) throw new Error('APIFY_API_KEY not set')

  // Start the actor run
  const startRes = await fetch(
    `${APIFY_BASE}/acts/${ACTOR_ID}/runs?token=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        urls: [
          { url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&q=${encodeURIComponent(keyword)}&search_type=keyword_unordered&media_type=all` }
        ],
        count: 50,
      }),
    }
  )

  if (!startRes.ok) {
    const err = await startRes.text()
    throw new Error(`Apify start failed: ${err}`)
  }

  const { data: runData } = await startRes.json()
  const runId = runData.id

  // Poll until finished (max 90s)
  const MAX_POLLS = 30
  const POLL_INTERVAL = 3000

  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL))
    const statusRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${apiKey}`)
    if (!statusRes.ok) continue
    const { data: status } = await statusRes.json()
    if (status.status === 'SUCCEEDED') break
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status.status)) {
      throw new Error(`Apify run ${status.status}`)
    }
  }

  // Fetch dataset
  const datasetRes = await fetch(
    `${APIFY_BASE}/actor-runs/${runId}/dataset/items?token=${apiKey}&format=json&limit=50`
  )
  if (!datasetRes.ok) throw new Error('Failed to fetch dataset')
  return await datasetRes.json()
}

// ─── CLAUDE CLASSIFIER ────────────────────────────────────────────────────────

async function classifyAds(ads: any[], keyword: string): Promise<AdResult[]> {
  if (!ads.length) return []

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Extract text from whatever field the actor returns
  function extractAdText(ad: any): string {
    return (
      ad.adText ||
      ad.ad_text ||
      ad.body ||
      ad.caption ||
      ad.message ||
      ad.description ||
      ad.text ||
      ad.snapshot?.body?.markup?.__html ||
      ad.snapshot?.cards?.[0]?.body ||
      ad.ad_creative_bodies?.[0] ||
      ad.collationAdDetails?.ad_creative_bodies?.[0] ||
      (ad.snapshot?.videos?.[0]?.title) ||
      ''
    ).slice(0, 400)
  }

  function extractPageName(ad: any): string {
    return (
      ad.pageName ||
      ad.page_name ||
      ad.advertiserName ||
      ad.advertiser_name ||
      ad.byline ||
      ad.snapshot?.page_name ||
      ad.pageInfo?.name ||
      'Unknown'
    )
  }

  function extractPageUrl(ad: any): string | null {
    return (
      ad.pageUrl ||
      ad.page_url ||
      ad.advertiserUrl ||
      ad.pageInfo?.url ||
      ad.snapshot?.page_profile_uri ||
      null
    )
  }

  function extractSpend(ad: any): string | null {
    const s = ad.spendRange || ad.spend || ad.spend_range
    if (!s) return null
    if (typeof s === 'object') return `$${s.lower_bound || 0}–$${s.upper_bound || '?'}`
    return String(s)
  }

  // Batch classify up to 30 ads in one Claude call
  const batch = ads.slice(0, 30).map((ad, i) => ({
    index: i,
    advertiser: extractPageName(ad),
    page_url: extractPageUrl(ad),
    text: extractAdText(ad),
    spend: extractSpend(ad),
    start_date: ad.startDate || ad.start_date || ad.ad_delivery_start_time || null,
    platforms: ad.publisherPlatform || ad.platforms || ad.publisher_platforms || [],
  }))

  const prompt = `You are analyzing Facebook ads scraped from the Ad Library. The search keyword was "${keyword}". These are insurance-related ads. For each ad, determine:

1. ad_type: Is this ad RECRUITING agents/brokers ("join my team", "become an agent", "earn commissions") or SALES to consumers ("get Medicare coverage", "compare plans", "free consultation") or BRAND (general awareness) or UNKNOWN?
2. recruitable: true if this is an independent agent/agency running their own ads (NOT a big carrier like UnitedHealthcare, Humana, Aetna, BCBS, Cigna, WellCare, Devoted, Clover, Oscar). Small/mid agencies = recruitable. Big carriers = not recruitable.
3. claude_take: One sentence — what's interesting about this advertiser from a recruiting perspective. Be specific about what the ad signals.

ADS TO CLASSIFY:
${JSON.stringify(batch, null, 2)}

Return ONLY valid JSON array — one object per ad in the same order:
[
  {
    "index": 0,
    "ad_type": "recruiting"|"sales"|"brand"|"unknown",
    "recruitable": true|false,
    "claude_take": "one sentence"
  }
]`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array')
    const classifications = JSON.parse(jsonMatch[0])

    return batch.map((ad, i) => {
      const cls = classifications.find((c: any) => c.index === i) || {}
      return {
        advertiser_name: ad.advertiser,
        advertiser_page_url: ad.page_url,
        ad_text: ad.text,
        spend_range: ad.spend ? String(ad.spend) : null,
        start_date: ad.start_date,
        is_active: true,
        platforms: Array.isArray(ad.platforms) ? ad.platforms : [],
        ad_type: cls.ad_type || 'unknown',
        recruitable: cls.recruitable ?? true,
        claude_take: cls.claude_take || '',
      }
    })
  } catch {
    // Fallback — return raw without classification
    return batch.map(ad => ({
      advertiser_name: ad.advertiser,
      advertiser_page_url: ad.page_url,
      ad_text: ad.text,
      spend_range: ad.spend ? String(ad.spend) : null,
      start_date: ad.start_date,
      is_active: true,
      platforms: Array.isArray(ad.platforms) ? ad.platforms : [],
      ad_type: 'unknown' as const,
      recruitable: false,
      claude_take: 'Classification failed — check Anthropic API.',
    }))
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')
  const ALLOWED_ORIGINS = ['https://recruiterrr.com', 'http://localhost:3000']
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { keyword = 'Medicare', country = 'US' } = await req.json()

    console.log(`[/api/admin/adspy] Running: "${keyword}" / ${country}`)

    const rawAds = await runApifyAdScraper(keyword, country)

    if (!rawAds.length) {
      return NextResponse.json({ ads: [], total: 0, keyword, country })
    }

    const classified = await classifyAds(rawAds, keyword)

    // Sort: recruiting first, then by recruitable
    const sorted = classified.sort((a, b) => {
      if (a.ad_type === 'recruiting' && b.ad_type !== 'recruiting') return -1
      if (b.ad_type === 'recruiting' && a.ad_type !== 'recruiting') return 1
      if (a.recruitable && !b.recruitable) return -1
      if (b.recruitable && !a.recruitable) return 1
      return 0
    })

    return NextResponse.json({
      ads: sorted,
      total: sorted.length,
      recruitable_count: sorted.filter(a => a.recruitable).length,
      recruiting_count: sorted.filter(a => a.ad_type === 'recruiting').length,
      keyword,
      country,
      _debug_sample: rawAds[0] || null, // first raw ad so we can see field names
    })

  } catch (err: any) {
    console.error('[/api/admin/adspy] error:', err)
    return NextResponse.json({ error: err.message || 'Scan failed' }, { status: 500 })
  }
}
