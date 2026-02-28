export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { supabase } from '@/lib/supabase.server'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type SerpDebugEntry = {
  query: string
  key: string
  results: { title: string; snippet: string; link: string }[]
  signals_fired: string[]
}

// ─── URL UTILS ────────────────────────────────────────────────────────────────

function normalizeUrl(url: string): string {
  let u = url.trim().toLowerCase()
  if (!u.startsWith('http')) u = `https://${u}`
  try {
    const parsed = new URL(u)
    return `${parsed.protocol}//${parsed.hostname}`
  } catch {
    return `https://${u.replace(/^https?:\/\//, '').split('/')[0]}`
  }
}

// ─── PAGE FETCHER ─────────────────────────────────────────────────────────────

async function fetchPageText(url: string, timeout = 8000): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Recruiterrr/1.0)' },
      signal: AbortSignal.timeout(timeout),
      redirect: 'follow',
    })
    if (!res.ok) return ''
    const html = await res.text()
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 6000)
  } catch {
    return ''
  }
}

// ─── WEBSITE DISCOVERY ────────────────────────────────────────────────────────
// FIX: Much more careful domain matching to avoid grabbing wrong sites.
// Strategy:
//   1. Score each result — exact domain match > partial match > skip
//   2. Reject known non-FMO domains (news sites, LinkedIn, etc.)
//   3. Only fall back to result[0] if it passes a minimum confidence check

const REJECT_DOMAINS = [
  'linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com',
  'wikipedia.org', 'investopedia.com', 'indeed.com', 'glassdoor.com',
  'yelp.com', 'bbb.org', 'bloomberg.com', 'reuters.com', 'wsj.com',
  'businesswire.com', 'prnewswire.com', 'businessinsider.com',
  'insurancenewsnet.com', 'insurancejournal.com', 'lifehealthpro.com',
]

async function discoverWebsite(fmoName: string): Promise<{ url: string | null; debug: SerpDebugEntry }> {
  const query = `${fmoName} insurance FMO IMO official website`
  const debugEntry: SerpDebugEntry = { query, key: 'website_discovery', results: [], signals_fired: [] }

  try {
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&num=8&api_key=${process.env.SERPAPI_KEY}`
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return { url: null, debug: debugEntry }

    const data = await res.json()
    const results = data.organic_results || []

    // Log raw results for debug
    debugEntry.results = results.slice(0, 8).map((r: any) => ({
      title: r.title || '',
      snippet: r.snippet || '',
      link: r.link || '',
    }))

    // Build tokens from FMO name for scoring
    // e.g. "Brokers Alliance" → ['brokers', 'alliance']
    // e.g. "Senior Market Sales" → ['senior', 'market', 'sales']
    const nameTokens = fmoName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2 && !['fmo', 'imo', 'the', 'and', 'for', 'insurance', 'group', 'inc', 'llc'].includes(t))

    // Score each result
    type Scored = { link: string; domain: string; score: number; reason: string }
    const scored: Scored[] = []

    for (const r of results) {
      if (!r.link) continue
      try {
        const parsed = new URL(r.link)
        const hostname = parsed.hostname.replace('www.', '')

        // Reject known non-FMO domains
        if (REJECT_DOMAINS.some(d => hostname.includes(d))) continue

        const domainRoot = hostname.split('.')[0] // e.g. "brokersalliance" from "brokersalliance.com"
        const domainClean = domainRoot.replace(/[^a-z0-9]/g, '')

        let score = 0
        let reason = ''

        // Check how many name tokens appear in the domain
        const matchedTokens = nameTokens.filter(t => domainClean.includes(t))
        if (matchedTokens.length === nameTokens.length) {
          score = 100
          reason = `Exact match: all tokens [${matchedTokens.join(', ')}] in domain`
        } else if (matchedTokens.length >= 2) {
          score = 70
          reason = `Strong match: [${matchedTokens.join(', ')}] in domain`
        } else if (matchedTokens.length === 1 && nameTokens.length <= 2) {
          score = 40
          reason = `Partial match: [${matchedTokens[0]}] in domain`
        } else if (matchedTokens.length === 1) {
          score = 20
          reason = `Weak match: only [${matchedTokens[0]}] in domain`
        }

        // Bonus: domain is on first result position
        if (score > 0 && results.indexOf(r) === 0) score += 10

        if (score > 0) {
          scored.push({ link: r.link, domain: hostname, score, reason })
        }
      } catch {}
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score)

    if (scored.length > 0 && scored[0].score >= 40) {
      debugEntry.signals_fired.push(`Selected domain: ${scored[0].domain} (score ${scored[0].score} — ${scored[0].reason})`)
      return { url: normalizeUrl(scored[0].domain), debug: debugEntry }
    }

    // No confident match found
    debugEntry.signals_fired.push('No confident domain match found — scan will rely on SERP intel only')
    return { url: null, debug: debugEntry }

  } catch {
    debugEntry.signals_fired.push('Website discovery failed — SERP error')
    return { url: null, debug: debugEntry }
  }
}

// ─── SITE CRAWLER ─────────────────────────────────────────────────────────────
// FIX: Batched crawling instead of all parallel to avoid getting rate-limited
// by the target domain. Groups fire in parallel, slugs within a group are serial.

async function crawlFMOSite(baseUrl: string): Promise<{ pages: Record<string, string>; foundPages: string[] }> {
  const slugGroups = [
    ['/', '/home'],
    ['/about', '/about-us', '/who-we-are', '/our-story'],
    ['/agents', '/for-agents', '/join', '/join-us', '/become-an-agent', '/agent-partners', '/partner-with-us'],
    ['/carriers', '/our-carriers', '/carrier-partners', '/products', '/our-products'],
    ['/trips', '/incentive-trips', '/incentives', '/awards', '/rewards', '/events', '/conferences'],
    ['/leads', '/lead-program', '/lead-programs', '/marketing', '/marketing-support'],
    ['/technology', '/tech', '/tools', '/platform', '/crm', '/resources'],
    ['/why-us', '/why-join', '/benefits', '/agent-benefits', '/advantages'],
    ['/contact', '/contact-us'],
  ]

  const pages: Record<string, string> = {}
  const foundPages: string[] = []

  // Batch into groups of 3 to avoid hammering the domain
  const BATCH_SIZE = 3
  for (let i = 0; i < slugGroups.length; i += BATCH_SIZE) {
    const batch = slugGroups.slice(i, i + BATCH_SIZE)
    await Promise.all(batch.map(async (slugs) => {
      for (const slug of slugs) {
        const text = await fetchPageText(baseUrl + slug, 6000)
        if (text.length > 300) {
          pages[slug] = text
          foundPages.push(slug)
          break
        }
      }
    }))
    // Small delay between batches
    if (i + BATCH_SIZE < slugGroups.length) {
      await new Promise(r => setTimeout(r, 300))
    }
  }

  return { pages, foundPages }
}

// ─── SERP INTEL ───────────────────────────────────────────────────────────────
// FIX: Unquoted fallback queries for typo resilience.
// FIX: Added Reddit/forum queries to surface real agent complaints.
// FIX: Returns serp_debug alongside results.

async function fetchSerpIntel(fmoName: string): Promise<{ intel: Record<string, string>; serpDebug: SerpDebugEntry[] }> {
  const queries = [
    { key: 'trips',     q: `${fmoName} incentive trip 2025 2026 destination` },
    { key: 'carriers',  q: `${fmoName} carrier contracts agents appointed` },
    { key: 'reviews',   q: `${fmoName} agent review site:reddit.com OR site:insuranceforums.net OR site:glassdoor.com` },
    { key: 'complaints',q: `${fmoName} agent complaint problem experience` },
    { key: 'recruiting', q: `${fmoName} join commission override release policy` },
    { key: 'news',      q: `${fmoName} insurance acquisition partnership 2024 2025` },
  ]

  const intel: Record<string, string> = {}
  const serpDebug: SerpDebugEntry[] = []

  await Promise.all(queries.map(async ({ key, q }) => {
    const debugEntry: SerpDebugEntry = { query: q, key, results: [], signals_fired: [] }
    try {
      const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&num=5&api_key=${process.env.SERPAPI_KEY}`
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
      if (!res.ok) {
        debugEntry.signals_fired.push(`SERP failed: HTTP ${res.status}`)
        serpDebug.push(debugEntry)
        return
      }
      const data = await res.json()
      const results = (data.organic_results || []).slice(0, 5)

      debugEntry.results = results.map((r: any) => ({
        title: r.title || '',
        snippet: r.snippet || '',
        link: r.link || '',
      }))

      const snippets = results
        .map((r: any) => `${r.title}: ${r.snippet}`)
        .join('\n')

      if (snippets) {
        intel[key] = snippets
        debugEntry.signals_fired.push(`${results.length} results found`)
      } else {
        debugEntry.signals_fired.push('No results')
      }
    } catch (e: any) {
      debugEntry.signals_fired.push(`Error: ${e.message}`)
    }
    serpDebug.push(debugEntry)
  }))

  return { intel, serpDebug }
}

// ─── CLAUDE ANALYSIS ──────────────────────────────────────────────────────────

async function runClaudeAnalysis(
  fmoName: string,
  domain: string | null,
  pages: Record<string, string>,
  serpIntel: Record<string, string>,
  foundPages: string[]
): Promise<any> {
  const pageContent = Object.entries(pages)
    .map(([slug, text]) => `PAGE: ${slug}\n${text}`)
    .join('\n\n---\n\n')
    .slice(0, 18000)

  const prompt = `You are a competitive intelligence analyst for an insurance recruiter. Extract FACTS from the raw data below — not scripts, not coaching, not arguments. The recruiter decides how to use the intel. If a fact isn't in the data, say "Not found in scan" — never invent.

FMO/IMO: ${fmoName}
WEBSITE: ${domain || 'Not found'}
PAGES CRAWLED: ${foundPages.join(', ') || 'None'}

WEBSITE CONTENT:
${pageContent || 'No website content available.'}

SERP INTELLIGENCE:
TRIPS: ${serpIntel.trips || 'No data.'}
CARRIERS: ${serpIntel.carriers || 'No data.'}
AGENT VOICE (Reddit/Forums): ${serpIntel.agent_voice || 'No data.'}
AGENT COMPLAINTS: ${serpIntel.complaints || 'No data.'}
CONTRACT INTEL: ${serpIntel.contracts || 'No data.'}
RECENT NEWS: ${serpIntel.news || 'No data.'}
GLASSDOOR: ${serpIntel.glassdoor || 'No data.'}

EXTRACTION RULES:
- agent_quotes: pull verbatim or close paraphrase from SERP data. Include source. Empty array if none found.
- contract_flags: specific clauses or terms agents flag — captive language, release issues, chargebacks. Not generic warnings.
- carriers: actual names found in data only. Empty array if none.
- missing_carriers: carriers commonly sought by agents in this market that don't appear in their lineup.
- recent_news: actual events found in news SERP — acquisitions, ownership, rebrands. Not guesses.
- data_confidence: HIGH = 5+ pages + SERP hits. MEDIUM = 1-4 pages OR solid SERP. LOW = no site found.

Return ONLY valid JSON, no markdown, no backticks:
{
  "fmo_name": "<official name as found in data>",
  "website": "<domain or null>",
  "tree_affiliation": "<Integrity | AmeriLife | SMS | Independent | Unknown — only if determinable from data>",
  "size_signal": "LARGE" | "MID-SIZE" | "SMALL" | "UNKNOWN",
  "overview": "<2-3 sentences: who they are, size, market focus, how long operating. Specific numbers when found in data.>",
  "recent_news": "<specific acquisitions, ownership changes, rebrands, or notable 2024-2025 events found — or 'None found in scan'>",
  "what_they_offer": {
    "carriers": ["every carrier name found in data — empty array if none found"],
    "products": ["product lines they work: Medicare Advantage, Final Expense, Life, Annuities, etc."],
    "contract_terms": "<specific commission levels, release policy wording, vesting schedule, ownership language found in data — or 'Not found in scan'>",
    "lead_program": "<exactly what they say about leads — cost, exclusivity, volume, quality claims found in data — or 'Not found in scan'>",
    "technology": ["specific tools, CRMs, quoting platforms named in data"],
    "training": "<training or onboarding specifics found — or 'Not found in scan'>",
    "trip_current": "<2025 or 2026 trip destination found in data — or 'Not found in scan'>",
    "trip_threshold": "<production threshold or qualification criteria for trip found in data — or 'Not found in scan'>",
    "trip_past": ["past trip destinations mentioned in data"]
  },
  "agent_sentiment": {
    "agent_quotes": [
      {
        "quote": "<verbatim or close paraphrase of what an actual agent said>",
        "sentiment": "positive" | "negative" | "mixed",
        "topic": "<commissions | leads | support | contracts | culture | trips | technology>",
        "source": "<reddit | glassdoor | forum | google review | other>"
      }
    ],
    "common_praise": ["specific things agents praise — only from found data"],
    "common_complaints": ["specific complaints — only from found data"],
    "contract_flags": ["specific contract terms agents flag as problems — from found data only"]
  },
  "recruiting_pitch": {
    "headline": "<the main hook they use to recruit agents — from their website or SERP>",
    "claims": ["specific claims they make — pulled directly from data, not inferred"],
    "target_agent": "<what type of agent they pursue>"
  },
  "gaps": {
    "missing_carriers": ["carriers commonly sought that don't appear in their lineup"],
    "weak_areas": "<specific weaknesses based on what's absent or complained about in data>",
    "ownership_risk": "<specific captive, non-vested, or release concerns found in data — or 'None found in scan'>"
  },
  "pages_found": ${JSON.stringify(foundPages)},
  "data_confidence": "HIGH" | "MEDIUM" | "LOW",
  "confidence_note": "<honest summary of what data was available and what wasn't>"
}`

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to parse analysis')
  return JSON.parse(jsonMatch[0])
}

// ─── CACHE CHECK ──────────────────────────────────────────────────────────────
// FIX: Check for a recent scan of the same FMO before running the full pipeline.
// "Recent" = within 7 days. Recruiters can force a fresh scan by appending " refresh".

async function checkRecentScan(userId: string, fmoName: string): Promise<any | null> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('prometheus_scans')
    .select('*')
    .eq('clerk_id', userId)
    .ilike('domain', fmoName.trim())
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data || null
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
    .select('id, domain, score, verdict, vendor_tier, is_shared_lead, pages_scanned, created_at')
    .eq('clerk_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  return NextResponse.json({ scans: data || [] })
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

  const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(20, '1 h'), analytics: true })
  const { success, reset } = await ratelimit.limit(userId)
  if (!success) return NextResponse.json({ error: `Rate limit exceeded. Resets at ${new Date(reset).toLocaleTimeString()}.` }, { status: 429 })

  try {
    const { fmo_name, website, force_refresh } = await req.json()
    if (!fmo_name || typeof fmo_name !== 'string') {
      return NextResponse.json({ error: 'FMO name required' }, { status: 400 })
    }

    // ── Cache check ──────────────────────────────────────────────────────────
    if (!force_refresh) {
      const cached = await checkRecentScan(userId, fmo_name)
      if (cached) {
        console.log(`[/api/prometheus] cache hit for "${fmo_name}"`)
        return NextResponse.json({
          id: cached.id,
          fmo_name,
          domain: cached.analysis_json?.website || null,
          pages: cached.pages_scanned || [],
          analysis: cached.analysis_json,
          cached: true,
          cached_at: cached.created_at,
        })
      }
    }

    // ── Discovery + crawl + SERP run in parallel ──────────────────────────────
    const [discoveryResult, serpResult] = await Promise.all([
      website
        ? Promise.resolve({ url: normalizeUrl(website), debug: { query: 'user-provided', key: 'website_discovery', results: [], signals_fired: ['User provided URL directly'] } as SerpDebugEntry })
        : discoverWebsite(fmo_name),
      fetchSerpIntel(fmo_name),
    ])

    const baseUrl = discoveryResult.url
    const domain = baseUrl ? baseUrl.replace('https://', '').replace('http://', '') : null

    const crawlResult = baseUrl
      ? await crawlFMOSite(baseUrl)
      : { pages: {}, foundPages: [] }

    // ── Claude analysis ───────────────────────────────────────────────────────
    const analysis = await runClaudeAnalysis(fmo_name, domain, crawlResult.pages, serpResult.intel, crawlResult.foundPages)

    // ── Compile serp_debug ────────────────────────────────────────────────────
    const serpDebug = [discoveryResult.debug, ...serpResult.serpDebug]

    // ── Score: ground-truth pages crawled, not Claude's self-assessment ───────
    const pagesCount = crawlResult.foundPages.length
    const groundTruthScore = pagesCount >= 5 ? 90 : pagesCount >= 3 ? 65 : pagesCount >= 1 ? 40 : 15

    // ── Save ──────────────────────────────────────────────────────────────────
    const { data: saved, error: saveError } = await supabase
      .from('prometheus_scans')
      .insert({
        clerk_id: userId,
        domain: fmo_name,
        score: groundTruthScore,
        verdict: analysis.size_signal || 'UNKNOWN',
        vendor_tier: analysis.competitive_intel?.tree_affiliation || 'UNKNOWN',
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
    console.error('[/api/prometheus] error:', err)
    return NextResponse.json({ error: 'Scan failed. Please try again.' }, { status: 500 })
  }
}
