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

async function discoverWebsite(fmoName: string): Promise<string | null> {
  try {
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(fmoName + ' insurance FMO IMO official website')}&num=5&api_key=${process.env.SERPAPI_KEY}`
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return null
    const data = await res.json()
    const results = data.organic_results || []
    const nameLower = fmoName.toLowerCase().replace(/[^a-z0-9]/g, '')
    for (const r of results) {
      try {
        const domain = new URL(r.link).hostname.replace('www.', '')
        const domainClean = domain.replace(/[^a-z0-9]/g, '')
        if (domainClean.includes(nameLower.slice(0, 6)) || nameLower.includes(domainClean.split('.')[0])) {
          return normalizeUrl(domain)
        }
      } catch {}
    }
    if (results[0]?.link) {
      return normalizeUrl(new URL(results[0].link).hostname)
    }
    return null
  } catch {
    return null
  }
}

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

  await Promise.all(slugGroups.map(async (slugs) => {
    for (const slug of slugs) {
      const text = await fetchPageText(baseUrl + slug, 6000)
      if (text.length > 300) {
        pages[slug] = text
        foundPages.push(slug)
        break
      }
    }
  }))

  return { pages, foundPages }
}

async function fetchSerpIntel(fmoName: string): Promise<Record<string, string>> {
  const queries = [
    { key: 'trips', q: `"${fmoName}" incentive trip 2025 2026 destination` },
    { key: 'carriers', q: `"${fmoName}" carriers agents contracts insurance` },
    { key: 'reviews', q: `"${fmoName}" agent review complaint experience` },
    { key: 'recruiting', q: `"${fmoName}" join FMO IMO commission override` },
    { key: 'news', q: `"${fmoName}" insurance news acquisition partnership 2024 2025` },
  ]

  const results: Record<string, string> = {}
  await Promise.all(queries.map(async ({ key, q }) => {
    try {
      const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&num=5&api_key=${process.env.SERPAPI_KEY}`
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
      if (!res.ok) return
      const data = await res.json()
      const snippets = (data.organic_results || [])
        .slice(0, 5)
        .map((r: any) => `${r.title}: ${r.snippet}`)
        .join('\n')
      if (snippets) results[key] = snippets
    } catch {}
  }))

  return results
}

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
RECRUITING PITCH: ${serpIntel.recruiting || 'No data found.'}
RECENT NEWS: ${serpIntel.news || 'No data found.'}

Be specific — name actual carriers, actual trip destinations, actual tools, actual dollar amounts when found. Never be vague when specific data exists. Never fabricate.

Return ONLY valid JSON — no markdown, no backticks:
{
  "fmo_name": "<official name as found>",
  "website": "<domain>",
  "overview": "<2-3 sentence summary of who this FMO is, how big, what market, how long operating>",
  "size_signal": "LARGE" | "MID-SIZE" | "SMALL" | "UNKNOWN",
  "what_they_offer": {
    "carriers": ["specific carrier names — every one you can identify"],
    "contract_highlights": "<specific contract terms, commission levels, release policies, ownership language found>",
    "lead_program": "<exactly what they offer for leads — be specific>",
    "technology": ["specific tools, CRMs, portals, quoting platforms mentioned"],
    "training": "<training or onboarding they advertise>",
    "marketing_support": "<marketing co-op, materials, or support mentioned>"
  },
  "incentive_trips": {
    "current_trip": "<2025 or 2026 trip destination if found, otherwise most recent known>",
    "past_trips": ["past destinations mentioned"],
    "qualification": "<threshold or criteria to qualify if mentioned>",
    "trip_intel": "<additional context about their trip program>"
  },
  "their_pitch": {
    "headline_claim": "<the #1 thing they tell agents about why to join>",
    "key_selling_points": ["specific claims they make to agents"],
    "target_agent": "<what type of agent they recruit>",
    "differentiators": "<what they claim makes them different>"
  },
  "weak_points": {
    "agent_complaints": "<complaints, negative reviews, or agent frustrations found>",
    "gaps": "<what they don't offer or are weak on>",
    "red_flags": "<contract ownership, captive language, release issues, anything agents complain about>"
  },
  "competitive_intel": {
    "tree_affiliation": "<which of the three major trees — Integrity, AmeriLife, SMS — this FMO rolls up through if determinable>",
    "recent_changes": "<acquisitions, rebrands, ownership changes, news in 2024-2025>",
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
  "confidence_note": "<why the confidence level is what it is>"
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
    const { fmo_name, website } = await req.json()
    if (!fmo_name || typeof fmo_name !== 'string') {
      return NextResponse.json({ error: 'FMO name required' }, { status: 400 })
    }

    const baseUrl = website ? normalizeUrl(website) : await discoverWebsite(fmo_name)
    const domain = baseUrl ? baseUrl.replace('https://', '').replace('http://', '') : null

    const [crawlResult, serpIntel] = await Promise.all([
      baseUrl ? crawlFMOSite(baseUrl) : Promise.resolve({ pages: {}, foundPages: [] }),
      fetchSerpIntel(fmo_name),
    ])

    const analysis = await runClaudeAnalysis(fmo_name, domain, crawlResult.pages, serpIntel, crawlResult.foundPages)

    const { data: saved, error: saveError } = await supabase
      .from('prometheus_scans')
      .insert({
        clerk_id: userId,
        domain: fmo_name,
        score: analysis.data_confidence === 'HIGH' ? 90 : analysis.data_confidence === 'MEDIUM' ? 60 : 30,
        verdict: analysis.size_signal || 'UNKNOWN',
        vendor_tier: analysis.competitive_intel?.tree_affiliation || 'UNKNOWN',
        is_shared_lead: false,
        pages_scanned: crawlResult.foundPages,
        analysis_json: analysis,
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
    })
  } catch (err) {
    console.error('[/api/prometheus] error:', err)
    return NextResponse.json({ error: 'Scan failed. Please try again.' }, { status: 500 })
  }
}
