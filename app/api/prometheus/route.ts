import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { supabase } from '@/lib/supabase.server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  analytics: true,
})

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

  const prompt = `You are an elite insurance industry competitive intelligence analyst. A recruiter is on a call with an agent who works with this FMO/IMO. Give the recruiter a complete intelligence briefing so they know exactly what they're up against and how to win.

FMO/IMO NAME: ${fmoName}
WEBSITE: ${domain || 'Not found'}
PAGES CRAWLED: ${foundPages.join(', ') || 'None accessible'}

WEBSITE CONTENT:
${pageContent || 'No website content available.'}

SERP INTELLIGENCE:
TRIPS/INCENTIVES: ${serpIntel.trips || 'No data found.'}
CARRIERS/CONTRACTS: ${serpIntel.carriers || 'No data found.'}
AGENT REVIEWS: ${serpIntel.reviews || 'No data found.'}
AGENT COMPLAINTS: ${serpIntel.complaints || 'No data found.'}
RECRUITING PITCH: ${serpIntel.recruiting || 'No data found.'}
RECENT NEWS: ${serpIntel.news || 'No data found.'}

CRITICAL RULES:
- Be specific — name actual carriers, actual trip destinations, actual tools, actual dollar amounts when found in the data above.
- If a piece of data (carriers, trips, etc.) is NOT present in the content above, say "Not found in scan" — do NOT guess or invent.
- Never fabricate. If you don't have it, say so.
- data_confidence should be LOW if website wasn't found or fewer than 2 pages were crawled.

Return ONLY valid JSON — no markdown, no backticks:
{
  "fmo_name": "<official name as found>",
  "website": "<domain>",
  "overview": "<2-3 sentence summary of who this FMO is, how big, what market, how long operating>",
  "size_signal": "LARGE" | "MID-SIZE" | "SMALL" | "UNKNOWN",
  "what_they_offer": {
    "carriers": ["specific carrier names — every one you can identify. If none found, empty array."],
    "contract_highlights": "<specific contract terms, commission levels, release policies, ownership language found — or 'Not found in scan'>",
    "lead_program": "<exactly what they offer for leads — or 'Not found in scan'>",
    "technology": ["specific tools, CRMs, portals, quoting platforms mentioned"],
    "training": "<training or onboarding they advertise — or 'Not found in scan'>",
    "marketing_support": "<marketing co-op, materials, or support mentioned — or 'Not found in scan'>"
  },
  "incentive_trips": {
    "current_trip": "<2025 or 2026 trip destination if found — or 'Not found in scan'>",
    "past_trips": ["past destinations mentioned"],
    "qualification": "<threshold or criteria to qualify if mentioned — or 'Not found in scan'>",
    "trip_intel": "<additional context about their trip program>"
  },
  "their_pitch": {
    "headline_claim": "<the #1 thing they tell agents about why to join>",
    "key_selling_points": ["specific claims they make to agents"],
    "target_agent": "<what type of agent they recruit>",
    "differentiators": "<what they claim makes them different>"
  },
  "weak_points": {
    "agent_complaints": "<complaints, negative reviews, or agent frustrations found in reviews/complaints data — or 'None found in scan'>",
    "gaps": "<what they don't offer or are weak on>",
    "red_flags": "<contract ownership, captive language, release issues, anything agents complain about — or 'None found in scan'>"
  },
  "competitive_intel": {
    "tree_affiliation": "<which of the three major trees — Integrity, AmeriLife, SMS — this FMO rolls up through if determinable — or 'Unknown'>",
    "recent_changes": "<acquisitions, rebrands, ownership changes, news in 2024-2025 — or 'None found'>",
    "market_position": "<how they position themselves>"
  },
  "your_counter": {
    "opening_line": "<single best opening line to say to an agent at this FMO — specific, not generic>",
    "key_angles": ["3-5 specific angles based on their weak points"],
    "trip_angle": "<how to use their trip program in conversation — tactical>",
    "carrier_angle": "<what to say about carriers — what they're missing>",
    "close": "<most compelling reason for this specific agent to have the conversation>"
  },
  "pages_found": ${JSON.stringify(foundPages)},
  "data_confidence": "HIGH" | "MEDIUM" | "LOW",
  "confidence_note": "<why the confidence level is what it is — be honest about what data was and wasn't available>"
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 3000,
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
    .single()
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
