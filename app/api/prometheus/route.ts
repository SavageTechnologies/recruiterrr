export const runtime = 'nodejs'
export const maxDuration = 120  // crawl + SERP + Sonnet analysis

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAnthropicClient } from '@/lib/ai'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { supabase } from '@/lib/supabase.server'
import { isAdmin, hasActiveSubscription } from '@/lib/auth/access'
import { ALLOWED_ORIGINS } from '@/lib/config'

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
// Smart crawler: sitemap first → nav links from homepage → slug fallback.
// Finds real pages instead of hammering guesses.

const SLUG_FALLBACK = [
  '/', '/about', '/about-us', '/agents', '/for-agents', '/join', '/join-us',
  '/carriers', '/our-carriers', '/products', '/trips', '/incentive-trips',
  '/incentives', '/leads', '/lead-program', '/technology', '/tools',
  '/why-us', '/benefits', '/contact',
]

// Relevance keywords — pages with these in their URL get prioritized
const RELEVANT_KEYWORDS = [
  'agent', 'join', 'partner', 'carrier', 'product', 'trip', 'incentive',
  'lead', 'tech', 'tool', 'platform', 'crm', 'why', 'benefit', 'about',
  'resource', 'wholesal', 'advisor', 'recruit',
]

function scoreSlug(slug: string): number {
  const s = slug.toLowerCase()
  return RELEVANT_KEYWORDS.filter(k => s.includes(k)).length
}

async function parseSitemap(baseUrl: string): Promise<string[]> {
  const candidates = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap']
  for (const path of candidates) {
    try {
      const res = await fetch(baseUrl + path, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Recruiterrr/1.0)' },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) continue
      const xml = await res.text()
      // Extract <loc> URLs from sitemap
      const locs = [...xml.matchAll(/<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>/gi)]
        .map(m => m[1].trim())
      if (locs.length > 0) return locs
    } catch {}
  }
  return []
}

function extractNavLinks(html: string, baseUrl: string): string[] {
  // Pull hrefs from nav, header, footer — common nav patterns
  const navPattern = /<(?:nav|header|footer)[^>]*>([\s\S]*?)<\/(?:nav|header|footer)>/gi
  const hrefPattern = /href=["']([^"']+)["']/gi
  const links: string[] = []
  let navMatch
  while ((navMatch = navPattern.exec(html)) !== null) {
    let hrefMatch
    const section = navMatch[1]
    while ((hrefMatch = hrefPattern.exec(section)) !== null) {
      links.push(hrefMatch[1])
    }
  }
  // Also grab all internal links as fallback
  let hrefMatch
  while ((hrefMatch = hrefPattern.exec(html)) !== null) {
    links.push(hrefMatch[1])
  }
  const base = new URL(baseUrl)
  return [...new Set(links)]
    .filter(href => {
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false
      try {
        const u = new URL(href, baseUrl)
        return u.hostname === base.hostname && u.pathname !== '/'
      } catch { return false }
    })
    .map(href => {
      try { return new URL(href, baseUrl).pathname } catch { return null }
    })
    .filter((p): p is string => !!p)
}

async function crawlFMOSite(baseUrl: string): Promise<{ pages: Record<string, string>; foundPages: string[] }> {
  const pages: Record<string, string> = {}
  const foundPages: string[] = []
  const MAX_PAGES = 10

  // Step 1: Always grab homepage (needed for nav link extraction)
  const homepageHtml = await fetch(baseUrl + '/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Recruiterrr/1.0)' },
    signal: AbortSignal.timeout(7000),
  }).then(r => r.ok ? r.text() : '').catch(() => '')

  if (homepageHtml.length > 300) {
    const text = homepageHtml
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ').trim().slice(0, 6000)
    pages['/'] = text
    foundPages.push('/')
  }

  // Step 2: Discover real slugs via sitemap + nav links
  const [sitemapUrls, navSlugs] = await Promise.all([
    parseSitemap(baseUrl),
    Promise.resolve(homepageHtml ? extractNavLinks(homepageHtml, baseUrl) : []),
  ])

  // Convert sitemap URLs to slugs, filter to same domain
  const base = new URL(baseUrl)
  const sitemapSlugs = sitemapUrls
    .filter(u => { try { return new URL(u).hostname === base.hostname } catch { return false } })
    .map(u => { try { return new URL(u).pathname } catch { return null } })
    .filter((p): p is string => !!p && p !== '/')

  // Merge: sitemap + nav first. Only use fallback if we discovered nothing real.
  const discoveredSlugs = [...new Set([...sitemapSlugs, ...navSlugs])]
  const useFallback = discoveredSlugs.length < 3
  // Slugs to never crawl — auth pages, CMS internals, CDN, sitemaps, feeds
  const SKIP_PATTERNS = [
    /wp-login/, /wp-admin/, /wp-json/, /wp-content/, /wp-includes/,
    /cdn-cgi/, /email-protection/, /sitemap/, /\.xml$/, /feed\//,
    /login/, /admin/, /dashboard/, /privacy-policy/, /terms/, /cookie/,
    /author\//, /tag\//, /category\//, /page\/\d/, /\?/, /#/,
  ]

  const allSlugs = [...new Set([...discoveredSlugs, ...(useFallback ? SLUG_FALLBACK : [])])]
    .filter(s => s !== '/' && !foundPages.includes(s))
    .filter(s => !SKIP_PATTERNS.some(p => p.test(s)))
    .sort((a, b) => scoreSlug(b) - scoreSlug(a))
    .slice(0, 30)

  // Step 3: Crawl candidates in parallel batches of 4
  const BATCH = 4
  for (let i = 0; i < allSlugs.length && foundPages.length < MAX_PAGES; i += BATCH) {
    const batch = allSlugs.slice(i, i + BATCH)
    await Promise.all(batch.map(async slug => {
      if (foundPages.length >= MAX_PAGES) return
      const text = await fetchPageText(baseUrl + slug, 5000)
      if (text.length > 300) {
        pages[slug] = text
        foundPages.push(slug)
      }
    }))
    if (i + BATCH < allSlugs.length) await new Promise(r => setTimeout(r, 200))
  }

  return { pages, foundPages }
}

// ─── SERP INTEL ───────────────────────────────────────────────────────────────

// Stopwords to strip when building unique match tokens — generic industry words
// that appear in almost every insurance SERP result and cause false positives
const SERP_STOPWORDS = new Set([
  'insurance', 'agency', 'group', 'financial', 'services', 'associates',
  'advisors', 'advisor', 'partners', 'health', 'life', 'medicare', 'benefits',
  'solutions', 'general', 'national', 'american', 'united', 'independent',
  'brokerage', 'broker', 'planning', 'management', 'consulting', 'and', 'the',
])

function buildMatchTokens(fmoName: string, domain: string | null): string[] {
  const nameTokens = fmoName.toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 2 && !SERP_STOPWORDS.has(t))
  const domainToken = domain
    ? [domain.toLowerCase().replace(/^www\./, '').split('.')[0]]
    : []
  return [...new Set([...nameTokens, ...domainToken])].filter(t => t.length > 2)
}

function isResultRelevant(
  r: { title: string; snippet: string; link: string },
  tokens: string[]
): boolean {
  if (tokens.length === 0) return true
  const hay = `${r.title} ${r.snippet} ${r.link}`.toLowerCase()
  // For FMOs with 1-2 unique tokens, require ALL to match — avoids grabbing
  // results about a completely different "Premier" or "Apex" company.
  // For longer names (3+ tokens), require at least 2 to match.
  const required = tokens.length <= 2 ? tokens.length : 2
  const matched = tokens.filter(t => hay.includes(t)).length
  return matched >= required
}

async function fetchSerpIntel(fmoName: string, domain?: string | null): Promise<{ intel: Record<string, string>; serpDebug: SerpDebugEntry[] }> {
  // Quote the FMO name so Google treats it as a phrase — dramatically tighter results
  const q = `"${fmoName}"`
  const matchTokens = buildMatchTokens(fmoName, domain || null)

  const queries = [
    { key: 'carriers',      q: `${q} carrier contracts agents appointed` },
    { key: 'complaints',    q: `${q} agent complaint problem experience` },
    { key: 'trips',         q: `${q} incentive trip 2025 2026 destination` },
    { key: 'news',          q: `${q} insurance acquisition partnership announcement 2024 2025` },
    { key: 'agent_voice',   q: `${q} agent review site:reddit.com OR site:insuranceforums.net OR site:glassdoor.com` },
    { key: 'recruiting',    q: `${q} recruiting agents hiring grow downline join now` },
    { key: 'leadership',    q: `${q} CEO president founder owner director leadership team` },
    { key: 'technology',    q: `${q} CRM quoting platform technology tools software agents` },
  ]

  const intel: Record<string, string> = {}
  const serpDebug: SerpDebugEntry[] = []

  await Promise.all(queries.map(async ({ key, q }) => {
    const debugEntry: SerpDebugEntry = { query: q, key, results: [], signals_fired: [] }
    try {
      // Fetch 8 results — more headroom after filtering
      const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&num=8&api_key=${process.env.SERPAPI_KEY}`
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
      if (!res.ok) {
        debugEntry.signals_fired.push(`SERP failed: HTTP ${res.status}`)
        serpDebug.push(debugEntry)
        return
      }
      const data = await res.json()
      const allResults = (data.organic_results || []).slice(0, 8)

      // Filter irrelevant results at the source — nothing noise gets stored or sent to Claude
      const relevantResults = allResults.filter((r: any) => isResultRelevant(
        { title: r.title || '', snippet: r.snippet || '', link: r.link || '' },
        matchTokens
      ))
      const noiseCount = allResults.length - relevantResults.length

      debugEntry.results = relevantResults.map((r: any) => ({
        title: r.title || '',
        snippet: r.snippet || '',
        link: r.link || '',
      }))

      if (noiseCount > 0) {
        debugEntry.signals_fired.push(`Filtered ${noiseCount} irrelevant results`)
      }

      // Only pass relevant snippets to Claude — cleaner input = better analysis
      const snippets = relevantResults
        .map((r: any) => `${r.title}: ${r.snippet}`)
        .join('\n')

      if (snippets) {
        intel[key] = snippets
        debugEntry.signals_fired.push(`${relevantResults.length} relevant results passed to analysis`)
      } else {
        debugEntry.signals_fired.push('No relevant results found')
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

  const prompt = `You are a sales intelligence analyst. The person reading this works at Recruiterrr — a recruiting intelligence platform — and is about to call or email this FMO to pitch them on buying the tool. Your job is to extract FACTS that help them walk into that conversation already knowing this company. Extract only what the data explicitly supports. If a fact isn't in the data, say "Not found in scan" — never invent.

CRITICAL RULE: You are analyzing "${fmoName}" ONLY. Any content that does not explicitly mention "${fmoName}" or its confirmed website (${domain || 'unknown'}) must be completely ignored. Do not extract facts from content about other companies. If you cannot confirm a fact is specifically about "${fmoName}", return "Not found in scan".

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
RECRUITING ACTIVITY: ${serpIntel.recruiting || 'No data.'}
RECENT NEWS: ${serpIntel.news || 'No data.'}
LEADERSHIP / CONTACTS: ${serpIntel.leadership || 'No data.'}
TECHNOLOGY: ${serpIntel.technology || 'No data.'}

EXTRACTION RULES:
- contacts: look for named individuals with titles anywhere in the data — website team/about pages, SERP snippets, press releases, LinkedIn mentions. Capture name + title + any contact info found. Empty array if no named people found.
- recruiting_activity: signals the FMO is actively trying to grow their agent headcount right now — job postings, ads, "join our team" language, recent agent growth announcements, conference sponsorships focused on recruiting. Be specific.
- tech_stack: name actual tools mentioned. If no tools mentioned, note that explicitly — it's a sales signal.
- agent_complaints: specific pain points from agents. These are sales angles — each complaint is a problem Recruiterrr may solve.
- size_signal: use agent count, revenue hints, number of states, carrier count, and trip thresholds as signals. LARGE = 500+ agents or clear national presence. MID-SIZE = 50-500 agents or regional presence. SMALL = under 50 agents or single-state.
- data_confidence: HIGH = 5+ pages crawled + multiple SERP hits. MEDIUM = 1-4 pages OR solid SERP data. LOW = no site found or very sparse data.

Return ONLY valid JSON, no markdown, no backticks:
{
  "fmo_name": "<official name as found in data>",
  "website": "<domain or null>",
  "tree_affiliation": "<Integrity | AmeriLife | SMS | Independent | Unknown — only if determinable from data>",
  "size_signal": "LARGE" | "MID-SIZE" | "SMALL" | "UNKNOWN",
  "overview": "<2-3 sentences: who they are, how big, what market they serve, how long operating. Include specific numbers like agent count or states when found.>",
  "recent_news": "<specific acquisitions, new hires, rebrands, partnership announcements, or notable 2024-2025 events — or 'None found in scan'>",
  "contacts": [
    {
      "name": "<full name>",
      "title": "<exact title as found in data>",
      "email": "<email if found — or null>",
      "phone": "<phone if found — or null>",
      "linkedin": "<LinkedIn URL if found — or null>",
      "source": "<where this person was found: website team page | SERP snippet | press release | other>"
    }
  ],
  "recruiting_activity": {
    "actively_recruiting": true | false,
    "signals": ["specific evidence of active recruiting — job postings, ads, language found in data"],
    "target_agent_profile": "<what type of agent they're going after — from their website or SERP>",
    "recruiting_pitch_headline": "<the main hook they use to recruit agents>"
  },
  "what_they_offer": {
    "carriers": ["every carrier name found in data — empty array if none found"],
    "products": ["product lines: Medicare Advantage, Final Expense, Life, Annuities, ACA, etc."],
    "contract_terms": "<commission levels, release policy, vesting, ownership language — or 'Not found in scan'>",
    "lead_program": "<what they say about leads — cost, exclusivity, volume — or 'Not found in scan'>",
    "technology": ["specific tools, CRMs, quoting platforms named in data — empty array means no tech stack mentioned, which is a sales signal"],
    "training": "<training or onboarding specifics — or 'Not found in scan'>",
    "trip_current": "<2025 or 2026 trip destination — or 'Not found in scan'>",
    "trip_threshold": "<production threshold to qualify for trip — or 'Not found in scan'>",
    "trip_past": ["past trip destinations found in data"],
    "events": ["conferences, summits, or events they host or sponsor — include dates if found"]
  },
  "agent_sentiment": {
    "agent_quotes": [
      {
        "quote": "<verbatim or close paraphrase from an actual agent>",
        "sentiment": "positive" | "negative" | "mixed",
        "topic": "<commissions | leads | support | contracts | culture | trips | technology | recruiting>",
        "source": "<reddit | glassdoor | forum | google review | other>"
      }
    ],
    "common_praise": ["specific things agents praise — from found data only"],
    "common_complaints": ["specific complaints — these are your sales angles, be specific"],
    "contract_flags": ["specific contract terms agents flag — captive language, release issues, chargebacks"]
  },
  "sales_angles": {
    "tech_gap": "<is there a visible gap in their tech stack? No CRM mentioned? No quoting tool? Agents complaining about tools? Be specific about the gap and why it matters.>",
    "retention_problem": "<evidence agents are leaving or dissatisfied — churn signals from complaints, Glassdoor, SERP>",
    "recruiting_pain": "<are they struggling to grow, or growing fast and need better tools to manage it? What does the data suggest?>",
    "size_and_budget_read": "<based on size signal, trip thresholds, carrier count, and any revenue hints — can they afford a tool? Are they big enough to need one?>"
  },
  "pages_found": ${JSON.stringify(foundPages)},
  "data_confidence": "HIGH" | "MEDIUM" | "LOW",
  "confidence_note": "<honest summary of what data was and wasn't available>"
}`

    const anthropic = getAnthropicClient()
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 5000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to parse analysis')
  return JSON.parse(jsonMatch[0])
}

// Cache check removed — scans always run fresh. History is preserved in DB.

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

    // ── Discovery + crawl + SERP run in parallel ──────────────────────────────
    const [discoveryResult, serpResult] = await Promise.all([
      website
        ? Promise.resolve({ url: normalizeUrl(website), debug: { query: 'user-provided', key: 'website_discovery', results: [], signals_fired: ['User provided URL directly'] } as SerpDebugEntry })
        : discoverWebsite(fmo_name),
      fetchSerpIntel(fmo_name, website || null),
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

    // ── Extract top-level fields for dedicated columns ────────────────────────
    const contacts = Array.isArray(analysis.contacts) ? analysis.contacts : []
    const activelyRecruiting = analysis.recruiting_activity?.actively_recruiting === true
    const fmoSize = analysis.size_signal || 'UNKNOWN'

    // ── Save ──────────────────────────────────────────────────────────────────
    const { data: saved, error: saveError } = await supabase
      .from('prometheus_scans')
      .insert({
        clerk_id: userId,
        domain: fmo_name,
        score: groundTruthScore,
        verdict: fmoSize,            // kept for backwards compat
        vendor_tier: analysis.tree_affiliation || 'UNKNOWN',
        fmo_size: fmoSize,
        contacts: contacts,
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
    console.error('[/api/prometheus] error:', err)
    return NextResponse.json({ error: 'Scan failed. Please try again.' }, { status: 500 })
  }
}
