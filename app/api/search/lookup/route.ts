// app/api/search/lookup/route.ts
// Agent Lookup — find and score a single named agent via web search.
// Different from /api/search which uses google_local for market sweeps.
// This uses google organic SERP to find the agent's website, then runs
// the same enrichment + scoring pipeline used in market search.

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAnthropicClient } from '@/lib/ai'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { supabase } from '@/lib/supabase.server'

import { ALLOWED_ORIGINS } from '@/lib/config'
import { fetchPageText, safeFetch, extractPageText } from '@/lib/fetch'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type LookupResult = {
  name: string
  type: string
  phone: string
  address: string
  website: string | null
  score: number
  flag: 'hot' | 'warm' | 'cold'
  notes: string
  about: string | null
  carriers: string[]
  captive: boolean
  hiring: boolean
  hiring_roles: string[]
  youtube_channel: string | null
  youtube_subscribers: string | null
  contact_email: string | null
  social_links: string[]
  // Lookup-specific — where we found them
  source_url: string | null
  source_title: string | null
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  confidence_note: string
}

// ─── FIND AGENT VIA ORGANIC SERP ─────────────────────────────────────────────
// Runs 3 queries in parallel — name only, name + location, name + industry —
// then picks the best match across all results. This way a CEO, agency owner,
// or recruiter who isn't literally an "insurance agent" still gets found.
// Mode only affects scoring, NOT the search queries.

async function findAgentWebsite(
  name: string,
  city: string,
  state: string,
  mode: string
): Promise<{ url: string | null; title: string | null; snippet: string | null; confidence: 'HIGH' | 'MEDIUM' | 'LOW'; note: string }> {
  const location = [city, state].filter(Boolean).join(', ')

  // Three query angles — cast wide, let the match logic pick the best result
  const queries = [
    `"${name}"${location ? ` ${location}` : ''}`,                          // name + location (most targeted)
    `"${name}" insurance`,                                                   // name + industry (no role assumption)
    `"${name}" ${location ? `${location} ` : ''}site:linkedin.com OR Medicare OR IMO OR FMO OR insurance`, // broader net
  ]

  try {
    // Run all queries in parallel
    const allResults = await Promise.all(queries.map(async (q) => {
      try {
        const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&gl=us&hl=en&num=5&api_key=${process.env.SERPAPI_KEY}`
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
        if (!res.ok) return []
        const data = await res.json()
        return data.organic_results || []
      } catch { return [] }
    }))

    // Deduplicate across all query results by URL
    const seen = new Set<string>()
    const results: any[] = []
    for (const batch of allResults) {
      for (const r of batch) {
        if (r.link && !seen.has(r.link)) {
          seen.add(r.link)
          results.push(r)
        }
      }
    }

    if (!results.length) return { url: null, title: null, snippet: null, confidence: 'LOW', note: 'No web results found for this name' }

    const nameLower = name.toLowerCase()
    const nameParts = nameLower.split(/\s+/).filter(p => p.length > 1)

    const nameMatches = (r: any) => {
      const t = (r.title || '').toLowerCase()
      const s = (r.snippet || '').toLowerCase()
      return nameParts.filter(p => t.includes(p) || s.includes(p)).length >= Math.ceil(nameParts.length * 0.6)
    }

    const locMatches = (r: any) => {
      if (!location) return true
      const t = (r.title || '').toLowerCase()
      const s = (r.snippet || '').toLowerCase()
      return t.includes(city.toLowerCase()) || s.includes(city.toLowerCase()) || s.includes(state.toLowerCase())
    }

    const insuranceMatches = (r: any) => {
      const combined = ((r.title || '') + ' ' + (r.snippet || '')).toLowerCase()
      return /insurance|medicare|imo|fmo|annuity|broker|agent|health plan|carrier|senior|financial/.test(combined)
    }

    // Tier 1: name + location + insurance context — highest confidence
    const tier1 = results.find(r => nameMatches(r) && locMatches(r) && insuranceMatches(r))
    if (tier1) return { url: tier1.link, title: tier1.title, snippet: tier1.snippet, confidence: 'HIGH', note: 'Name + location + industry context matched' }

    // Tier 2: name + location (no insurance context required — they may be a CEO/exec)
    const tier2 = results.find(r => nameMatches(r) && locMatches(r))
    if (tier2) return { url: tier2.link, title: tier2.title, snippet: tier2.snippet, confidence: 'HIGH', note: 'Name + location matched in top result' }

    // Tier 3: name + insurance context (no location)
    const tier3 = results.find(r => nameMatches(r) && insuranceMatches(r))
    if (tier3) return { url: tier3.link, title: tier3.title, snippet: tier3.snippet, confidence: 'MEDIUM', note: 'Name + industry matched but location not confirmed' }

    // Tier 4: name match only
    const tier4 = results.find(r => nameMatches(r))
    if (tier4) return { url: tier4.link, title: tier4.title, snippet: tier4.snippet, confidence: 'MEDIUM', note: 'Name matched — verify this is the right person' }

    // Tier 5: take first result across all queries, flag as low confidence
    const first = results[0]
    return { url: first.link, title: first.title, snippet: first.snippet, confidence: 'LOW', note: 'Could not confirm name match — review result carefully' }
  } catch {
    return { url: null, title: null, snippet: null, confidence: 'LOW', note: 'Search failed' }
  }
}

// ─── WEBSITE CRAWL (shared logic mirrored from /api/search) ──────────────────


function extractEmails(text: string): string[] {
  const matches = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || []
  return [...new Set(matches)].filter(e =>
    !e.includes('noreply') && !e.includes('no-reply') && !e.includes('@sentry') &&
    !e.includes('@example') && !e.includes('@schema') && e.length < 60
  ).slice(0, 2)
}

function extractSocialLinks(html: string): string[] {
  const links: string[] = []
  const patterns = [
    /https?:\/\/(?:www\.)?facebook\.com\/[^"'\s>]+/g,
    /https?:\/\/(?:www\.)?linkedin\.com\/(?:in|company)\/[^"'\s>]+/g,
    /https?:\/\/(?:www\.)?instagram\.com\/[^"'\s>]+/g,
  ]
  for (const p of patterns) {
    for (const m of html.match(p) || []) {
      const clean = m.replace(/['">,.]+$/, '')
      if (!links.includes(clean) && !clean.includes('sharer')) links.push(clean)
    }
  }
  return links.slice(0, 3)
}

function extractYouTubeLink(html: string): string | null {
  const pattern = /https?:\/\/(?:www\.)?youtube\.com\/(channel\/[A-Za-z0-9_-]+|@[A-Za-z0-9_.-]+|c\/[A-Za-z0-9_-]+|user\/[A-Za-z0-9_-]+)/g
  for (const m of html.match(pattern) || []) {
    const clean = m.replace(/['">,.]+$/, '')
    if (!clean.includes('/embed') && !clean.includes('youtube.com/t/')) return clean
  }
  return null
}

async function fetchWebsiteIntel(rawUrl: string) {
  const empty = { homeText: '', aboutText: '', fullText: '', email: null as string | null, socialLinks: [] as string[], youtubeLink: null as string | null }
  try {
    const parsed = new URL(rawUrl)
    const base = `${parsed.protocol}//${parsed.hostname}`
    const [homeHtml, aboutText] = await Promise.all([
      safeFetch(rawUrl, { timeoutMs: 5000 }).then(async r => {
        if (!r.ok) return ''
        const reader = r.body?.getReader(); if (!reader) return ''
        let html = ''; let bytes = 0
        while (true) {
          const { done, value } = await reader.read(); if (done) break
          bytes += value.length; html += new TextDecoder().decode(value)
          if (bytes > 400_000) { reader.cancel(); break }
        }
        return html
      }).catch(() => ''),
      fetchPageText(`${base}/about`, 2000).then(t => t || fetchPageText(`${base}/about-us`, 2000)),
    ])
    const homeText = extractPageText(homeHtml, 2000)
    const allText = homeText + ' ' + aboutText
    const emails = extractEmails(allText)
    const fullText = [homeText ? `HOMEPAGE: ${homeText}` : '', aboutText ? `ABOUT PAGE: ${aboutText}` : ''].filter(Boolean).join('\n\n').slice(0, 5000)
    return { homeText, aboutText, fullText, email: emails[0] || null, socialLinks: extractSocialLinks(homeHtml), youtubeLink: extractYouTubeLink(homeHtml) }
  } catch { return empty }
}

// ─── SCORE SINGLE AGENT ───────────────────────────────────────────────────────
// Reuses the same Claude scoring logic as /api/search but adapted for
// web-sourced data (no Google rating/reviews available).

async function scoreLookupAgent(
  name: string,
  websiteUrl: string | null,
  intel: Awaited<ReturnType<typeof fetchWebsiteIntel>>,
  serpTitle: string | null,
  serpSnippet: string | null,
  city: string,
  state: string,
  mode: string
): Promise<Omit<LookupResult, 'source_url' | 'source_title' | 'confidence' | 'confidence_note'>> {
  const anthropic = getAnthropicClient()

  const modeContext: Record<string, { analyst: string; captive: string[]; coreAssumption: string; signals: string }> = {
    medicare: {
      analyst: 'Medicare/senior insurance',
      captive: ['Bankers Life', 'State Farm', 'Farmers', 'Allstate', 'GEICO', 'New York Life', 'Northwestern'],
      coreAssumption: 'Most agents are independent brokers. Only flag captive if an explicit captive brand name appears.',
      signals: 'Medicare, Supplement, Advantage, Senior, Medigap specialty = strong independent signal.',
    },
    life: {
      analyst: 'life and final expense insurance',
      captive: ['New York Life', 'Northwestern', 'Mass Mutual', 'Bankers Life', 'Globe Life'],
      coreAssumption: 'Independent life agents are common. Generic "life insurance agency" without a known captive brand = assume independent.',
      signals: 'Final Expense, Burial, Life, Legacy, Family = strong positive.',
    },
    annuities: {
      analyst: 'fixed index annuity (FIA) and MYGA',
      captive: ['Edward Jones', 'Ameriprise', 'Raymond James', 'Merrill Lynch', 'Morgan Stanley', 'Wells Fargo Advisors', 'Northwestern Mutual'],
      coreAssumption: 'Best FIA producers hide as "retirement planners". Assume recruitable unless you find wirehouse/fee-only/AUM signals.',
      signals: 'Fixed Index Annuity, MYGA, Safe Money, Principal Protection, Guaranteed Income = strong FIA signals.',
    },
    financial: {
      analyst: 'financial advisory',
      captive: ['Edward Jones', 'Ameriprise', 'Raymond James', 'Merrill', 'Morgan Stanley'],
      coreAssumption: 'Independent RIAs are highly recruitable. Generic "financial advisor" without wirehouse = assume independent.',
      signals: 'Independent RIA, CFP, wealth management focus = positive.',
    },
  }
  const ctx = modeContext[mode] || modeContext['medicare']

  const prompt = `You are an expert ${ctx.analyst} industry analyst scoring an insurance industry contact for recruitability or competitive intelligence.

SUBJECT: ${name}
LOCATION: ${[city, state].filter(Boolean).join(', ') || 'Unknown'}
WEBSITE: ${websiteUrl || 'None found'}
SEARCH RESULT TITLE: ${serpTitle || 'N/A'}
SEARCH SNIPPET: ${serpSnippet || 'N/A'}

WEBSITE CONTENT:
${intel.fullText || (websiteUrl ? 'Website found but content could not be extracted — score on name and snippet only.' : 'No website available — score on name and search snippet only.')}

CORE ASSUMPTION: ${ctx.coreAssumption}
KEY SIGNALS: ${ctx.signals}
CAPTIVE BRANDS (only flag if explicitly present): ${ctx.captive.join(', ')}

CRITICAL — THIS IS A NAMED LOOKUP, NOT A MARKET SWEEP:
- The subject may be a street-level agent, agency owner, IMO executive, call center CEO, or industry figure — not necessarily a field agent.
- If the subject appears to be an executive or company leader at an insurance organization, that IS relevant — score them accordingly and note their role clearly.
- If the content is completely unrelated to insurance (wrong person, name collision, yearbook, etc.) return score 0, flag "cold", and say so explicitly in notes.
- Score what you find. Be honest about data quality. Never hallucinate signals.

SCORING: HOT = 75+, WARM = 50-74, COLD = 0-49.
Default WARM (55) when data is thin. Score 0 if clearly wrong person or no insurance connection.
Boost for: independent signals, multi-carrier, YouTube, hiring activity, executive role at insurance org.

Return ONLY valid JSON:
{
  "carriers": ["carriers identified — only what you actually found, not guesses"],
  "captive": boolean,
  "score": 0-100,
  "flag": "hot"|"warm"|"cold",
  "notes": "2-3 sentences. Be explicit about what data you scored on and what's missing.",
  "about": "1-2 sentence plain-English summary. null if insufficient data.",
  "contact_email": "primary contact email if found, else null",
  "type": "business type inferred from content"
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON')
    const parsed = JSON.parse(match[0])
    return {
      name,
      type: parsed.type || 'Insurance Agent',
      phone: '',
      address: [city, state].filter(Boolean).join(', '),
      website: websiteUrl,
      score: Math.min(100, Math.max(0, parsed.score || 50)),
      flag: parsed.flag || 'warm',
      notes: parsed.notes || 'No analysis available.',
      about: parsed.about || null,
      carriers: parsed.carriers || [],
      captive: parsed.captive || false,
      hiring: false,
      hiring_roles: [],
      youtube_channel: intel.youtubeLink,
      youtube_subscribers: null,
      contact_email: parsed.contact_email || intel.email || null,
      social_links: intel.socialLinks,
    }
  } catch {
    return {
      name, type: 'Insurance Agent', phone: '', address: [city, state].filter(Boolean).join(', '),
      website: websiteUrl, score: 50, flag: 'warm',
      notes: 'Could not complete scoring. Limited data available for this agent.',
      about: null, carriers: [], captive: false, hiring: false, hiring_roles: [],
      youtube_channel: intel.youtubeLink, youtube_subscribers: null,
      contact_email: intel.email || null, social_links: intel.socialLinks,
    }
  }
}

// ─── ROUTE HANDLER ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(30, '1 h'), analytics: true })
  const { success } = await ratelimit.limit(userId)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  try {
    const { name, city = '', state = '', mode = 'medicare' } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Agent name required' }, { status: 400 })

    // Step 1: find their website via organic SERP
    const found = await findAgentWebsite(name.trim(), city.trim(), state.trim(), mode)

    // Step 2: crawl the website if we found one
    const intel = found.url ? await fetchWebsiteIntel(found.url) : { homeText: '', aboutText: '', fullText: '', email: null, socialLinks: [], youtubeLink: null }

    // Step 3: score
    const scored = await scoreLookupAgent(name.trim(), found.url, intel, found.title, found.snippet, city.trim(), state.trim(), mode)

    const result: LookupResult = {
      ...scored,
      source_url: found.url,
      source_title: found.title,
      confidence: found.confidence,
      confidence_note: found.note,
    }

    // Persist to agent_profiles — fire and forget, same as market sweep.
    // Wrapped in an async IIFE so we can await the Supabase call without
    // blocking the response — Supabase queries are lazy and must be awaited.
    ;(async () => {
      try {
        await supabase
          .from('agent_profiles')
          .upsert({
            clerk_id:            userId,
            name:                scored.name,
            agency_type:         scored.type,
            city:                city.trim(),
            state:               state.trim(),
            address:             scored.address || null,
            phone:               scored.phone   || null,
            website:             scored.website || null,
            contact_email:       scored.contact_email || null,
            social_links:        scored.social_links?.length ? scored.social_links : null,
            carriers:            scored.carriers?.length ? scored.carriers : null,
            captive:             scored.captive || false,
            prometheus_score:    scored.score,
            prometheus_flag:     scored.flag,
            prometheus_notes:    scored.notes,
            prometheus_about:    scored.about || null,
            hiring:              scored.hiring || false,
            hiring_roles:        scored.hiring_roles?.length ? scored.hiring_roles : null,
            youtube_channel:     scored.youtube_channel || null,
            youtube_subscribers: scored.youtube_subscribers || null,
            last_seen:           new Date().toISOString(),
          }, {
            onConflict: 'clerk_id,name,city,state',
            ignoreDuplicates: false,
          })
        Promise.resolve(
          supabase.rpc('increment_agent_search_count', {
            p_clerk_id: userId,
            p_names: [scored.name],
            p_city: city.trim(),
            p_state: state.trim(),
          })
        ).catch(() => {})
      } catch (err: unknown) {
        console.error('[/api/search/lookup] upsert error:', err)
      }
    })()

    return NextResponse.json({ agent: result })
  } catch (err) {
    console.error('[/api/search/lookup] error:', err)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
