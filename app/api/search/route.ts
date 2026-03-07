export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAnthropicClient } from '@/lib/ai'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { supabase } from '@/lib/supabase.server'
import { ALLOWED_ORIGINS } from '@/lib/config'
import { fetchPageText } from '@/lib/fetch'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type AgentResult = {
  name: string; type: string; phone: string; address: string
  rating: number; reviews: number; website: string | null
  carriers: string[]; captive: boolean; score: number
  flag: 'hot' | 'warm' | 'cold'; notes: string; years: number | null
  hiring: boolean; hiring_roles: string[]
  youtube_channel: string | null; youtube_subscribers: string | null; youtube_video_count: number
  about: string | null; contact_email: string | null; social_links: string[]
  // Score breakdown for transparency
  _preScore: number
  _enrichmentDelta: number
  _sonnetDelta: number
}

type WebsiteIntel = {
  fullText: string
  email: string | null
  socialLinks: string[]
  youtubeLink: string | null
}

// ─── MODE CONFIG ──────────────────────────────────────────────────────────────

const MODE_CONFIG: Record<string, {
  analyst: string
  queries: string[]
  captiveBrands: string[]
  independenceKeywords: string[]
  specialtyKeywords: string[]
  negativeKeywords?: string[]
  typeFallback: string
}> = {
  medicare: {
    analyst: 'Medicare/senior insurance FMO recruiter',
    queries: [
      'Medicare insurance agent',
      'Medicare supplement broker',
      'Medicare advantage agent',
      'senior health insurance agent',
      'health insurance broker',
      'independent insurance agent',
      'Medicare broker',
    ],
    captiveBrands: ['Bankers Life', 'State Farm', 'Farmers', 'Allstate', 'GEICO', 'New York Life', 'Northwestern'],
    independenceKeywords: ['independent', 'broker', 'agency', 'multi-carrier', 'multi carrier'],
    specialtyKeywords: ['medicare', 'supplement', 'advantage', 'medigap', 'pdp', 'senior', 'health'],
    typeFallback: 'Insurance Agency',
  },
  life: {
    analyst: 'life and final expense insurance FMO recruiter',
    queries: [
      'life insurance agent',
      'final expense insurance agent',
      'term life insurance broker',
      'burial insurance agent',
      'independent life insurance broker',
      'life insurance agency',
      'whole life insurance agent',
    ],
    captiveBrands: ['New York Life', 'Northwestern', 'Mass Mutual', 'Bankers Life', 'Globe Life'],
    independenceKeywords: ['independent', 'broker', 'agency', 'multi-carrier'],
    specialtyKeywords: ['life', 'final expense', 'burial', 'legacy', 'term', 'whole life', 'family protection'],
    typeFallback: 'Insurance Agency',
  },
  annuities: {
    analyst: 'fixed index annuity and MYGA specialist FMO recruiter',
    queries: [
      'fixed index annuity agent',
      'MYGA annuity specialist',
      'safe money advisor',
      'retirement income specialist',
      'independent annuity broker',
      'fixed annuity broker',
      'annuity advisor',
      'insurance and financial services',
    ],
    captiveBrands: ['Edward Jones', 'Ameriprise', 'Raymond James', 'Merrill Lynch', 'Morgan Stanley', 'Wells Fargo Advisors', 'Fidelity', 'Vanguard', 'Schwab', 'LPL Financial', 'Northwestern Mutual', 'New York Life'],
    independenceKeywords: ['independent', 'fixed annuity', 'fixed index', 'fia', 'myga', 'safe money', 'principal protection', 'guaranteed income'],
    specialtyKeywords: ['annuity', 'annuities', 'retirement income', 'indexed', 'myga', 'safe money', 'no market risk'],
    negativeKeywords: ['fee-only', 'assets under management', 'aum', 'investment management', 'registered investment advisor'],
    typeFallback: 'Financial Services',
  },
  financial: {
    analyst: 'financial advisory and wealth management recruiter',
    queries: [
      'financial advisor',
      'independent financial advisor',
      'wealth management advisor',
      'financial planner',
      'retirement planning advisor',
    ],
    captiveBrands: ['Edward Jones', 'Ameriprise', 'Raymond James', 'Merrill', 'Morgan Stanley', 'Wells Fargo Advisors'],
    independenceKeywords: ['independent', 'ria', 'fee-only', 'cfp', 'fiduciary', 'wealth management'],
    specialtyKeywords: ['financial', 'wealth', 'retirement', 'planning', 'investment', 'advisor', 'cfp'],
    typeFallback: 'Financial Advisory',
  },
}

// ─── SERP FETCH ───────────────────────────────────────────────────────────────

async function fetchAgentsFromSerp(city: string, state: string, limit: number, mode: string, query: string = ''): Promise<any[]> {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.medicare
  const cityPrefix = city.trim()

  const baseQueries = query.trim()
    ? [
      `${query.trim()} ${cityPrefix}`,
      `${query.trim()} insurance agent ${cityPrefix}`,
      `${query.trim()} broker ${cityPrefix}`,
      `${query.trim()} independent agent ${cityPrefix}`,
    ]
    : cfg.queries.map(q => `${q} ${cityPrefix}`)

  const STATE_FULL: Record<string, string> = {
    'AL':'Alabama','AK':'Alaska','AZ':'Arizona','AR':'Arkansas','CA':'California',
    'CO':'Colorado','CT':'Connecticut','DE':'Delaware','FL':'Florida','GA':'Georgia',
    'HI':'Hawaii','ID':'Idaho','IL':'Illinois','IN':'Indiana','IA':'Iowa',
    'KS':'Kansas','KY':'Kentucky','LA':'Louisiana','ME':'Maine','MD':'Maryland',
    'MA':'Massachusetts','MI':'Michigan','MN':'Minnesota','MS':'Mississippi','MO':'Missouri',
    'MT':'Montana','NE':'Nebraska','NV':'Nevada','NH':'New Hampshire','NJ':'New Jersey',
    'NM':'New Mexico','NY':'New York','NC':'North Carolina','ND':'North Dakota','OH':'Ohio',
    'OK':'Oklahoma','OR':'Oregon','PA':'Pennsylvania','RI':'Rhode Island','SC':'South Carolina',
    'SD':'South Dakota','TN':'Tennessee','TX':'Texas','UT':'Utah','VT':'Vermont',
    'VA':'Virginia','WA':'Washington','WV':'West Virginia','WI':'Wisconsin','WY':'Wyoming',
    'DC':'District of Columbia',
  }
  const stateAbbr = state.trim().toUpperCase()
  const stateFull = STATE_FULL[stateAbbr] || state
  const locationParam = encodeURIComponent(`${city}, ${stateFull}, United States`)

  const seen = new Set<string>()
  const results: any[] = []

  await Promise.all(baseQueries.map(async (q) => {
    try {
      const url = `https://serpapi.com/search.json?engine=google_local&q=${encodeURIComponent(q)}&location=${locationParam}&hl=en&gl=us&api_key=${process.env.SERPAPI_KEY}`
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      for (const item of (data.local_results || [])) {
        const addr = (item.address || '').toLowerCase()
        const stateLower = state.toLowerCase()
        const stateMatch =
          addr.includes(`, ${stateLower}`) || addr.includes(` ${stateLower}`) ||
          addr.endsWith(stateLower) || addr.includes(`, ${stateAbbr.toLowerCase()}`) ||
          addr.match(new RegExp(`\\b${stateAbbr.toLowerCase()}\\b`)) ||
          addr.match(new RegExp(`,\\s*${stateAbbr.toLowerCase()}\\s*(\\d{5})?$`))
        if (!item.address || item.address.length <= 5) continue
        if (!stateMatch) continue
        const key = item.title + item.address
        if (!seen.has(key)) {
          seen.add(key)
          item.website = item.links?.website || null
          results.push(item)
        }
      }
    } catch {}
  }))

  return results
}

// ─── PRE-SCORE: 4 INDEPENDENT SIGNAL BUCKETS ─────────────────────────────────
// Returns { score, captive } — captive is ONLY derived from brand name matching,
// never from the score itself.

type PreScoreResult = { score: number; captive: boolean }

function preScore(raw: any, mode: string): PreScoreResult {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.medicare
  const name = (raw.title || '').toLowerCase()
  const type = (raw.type || '').toLowerCase()
  const description = (raw.description || '').toLowerCase()
  const extensions = ((raw.extensions || []) as string[]).join(' ').toLowerCase()
  const allText = `${name} ${type} ${description} ${extensions}`
  const reviews = raw.reviews || 0
  const hasWebsite = !!raw.website

  // ── Captive check: brand name match only, never score-derived ──────────────
  const captive = cfg.captiveBrands.some(brand => {
    const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`\\b${escaped}\\b`, 'i').test(raw.title || '')
  })
  if (captive) return { score: 20, captive: true }

  // ── Bucket 1: Volume signal (review count) — 0 to 35 pts ─────────────────
  let volumeScore = 0
  if (reviews >= 200)     volumeScore = 35
  else if (reviews >= 100) volumeScore = 28
  else if (reviews >= 50)  volumeScore = 22
  else if (reviews >= 20)  volumeScore = 16
  else if (reviews >= 5)   volumeScore = 10
  else                     volumeScore = 5

  // ── Bucket 2: Independence signal — 0 to 25 pts ──────────────────────────
  let independenceScore = 15 // default: assume independent
  if (cfg.independenceKeywords.some(kw => allText.includes(kw))) {
    independenceScore = 25 // explicit independence signal
  }
  if (cfg.negativeKeywords?.some(kw => allText.includes(kw))) {
    independenceScore = 5  // explicit negative signal
  }

  // ── Bucket 3: Specialty/relevance signal — 0 to 25 pts ───────────────────
  const specialtyMatches = cfg.specialtyKeywords.filter(kw => allText.includes(kw)).length
  const specialtyScore = Math.min(25, specialtyMatches * 8)

  // ── Bucket 4: Presence signal — 0 to 15 pts ──────────────────────────────
  let presenceScore = 0
  if (hasWebsite)         presenceScore += 8
  if (raw.rating >= 4.0)  presenceScore += 4
  if (raw.phone)          presenceScore += 3

  const total = volumeScore + independenceScore + specialtyScore + presenceScore
  return { score: Math.min(100, total), captive: false }
}

// ─── WEBSITE CRAWL ────────────────────────────────────────────────────────────
// Homepage + /about in parallel. Extract text, email, socials, YouTube link.
// Jobs and YouTube SERP lookups are NOT here — they run in the background after response.

function extractEmails(text: string): string[] {
  const matches = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || []
  return [...new Set(matches)].filter(e =>
    !e.includes('noreply') && !e.includes('no-reply') && !e.includes('@sentry') &&
    !e.includes('@example') && !e.includes('@schema') && e.length < 60
  ).slice(0, 3)
}

function extractSocialLinks(html: string): string[] {
  const links: string[] = []
  const patterns = [
    /https?:\/\/(?:www\.)?facebook\.com\/[^"'\s>]+/g,
    /https?:\/\/(?:www\.)?linkedin\.com\/(?:in|company)\/[^"'\s>]+/g,
    /https?:\/\/(?:www\.)?instagram\.com\/[^"'\s>]+/g,
    /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"'\s>]+/g,
  ]
  for (const p of patterns) {
    for (const m of (html.match(p) || [])) {
      const clean = m.replace(/['",>]+$/, '')
      if (!links.includes(clean) && !clean.includes('sharer') && !clean.includes('intent')) {
        links.push(clean)
      }
    }
  }
  return links.slice(0, 4)
}

function extractYouTubeLink(html: string): string | null {
  const pattern = /https?:\/\/(?:www\.)?youtube\.com\/(channel\/[A-Za-z0-9_-]+|@[A-Za-z0-9_.-]+|c\/[A-Za-z0-9_-]+|user\/[A-Za-z0-9_-]+)/g
  for (const m of (html.match(pattern) || [])) {
    const clean = m.replace(/['",>]+$/, '')
    if (!clean.includes('/embed') && !clean.includes('youtube.com/t/') && !clean.includes('youtube.com/about')) {
      return clean
    }
  }
  return null
}

async function crawlWebsite(rawUrl: string): Promise<WebsiteIntel> {
  const empty: WebsiteIntel = { fullText: '', email: null, socialLinks: [], youtubeLink: null }
  try {
    const parsed = new URL(rawUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) return empty
    const base = `${parsed.protocol}//${parsed.hostname}`

    // Fetch homepage HTML (raw, for social/email/youtube extraction) + about text in parallel
    const [homeHtml, aboutText] = await Promise.all([
      (async () => {
        try {
          const res = await fetch(rawUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Recruiterrr/1.0)' },
            signal: AbortSignal.timeout(5000),
            redirect: 'follow',
          })
          if (!res.ok) return ''
          const reader = res.body?.getReader()
          if (!reader) return ''
          let html = ''; let bytes = 0
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            bytes += value.length
            html += new TextDecoder().decode(value)
            if (bytes > 400_000) { reader.cancel(); break }
          }
          return html
        } catch { return '' }
      })(),
      Promise.all([
        fetchPageText(`${base}/about`, 2000, 4000),
        fetchPageText(`${base}/about-us`, 2000, 4000),
      ]).then(([a, b]) => a || b || ''),
    ])

    const homeText = homeHtml
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000)

    const allText = homeText + ' ' + aboutText
    const email = extractEmails(allText)[0] || null
    const socialLinks = extractSocialLinks(homeHtml)
    const youtubeLink = extractYouTubeLink(homeHtml)

    const fullText = [
      homeText ? `HOMEPAGE: ${homeText}` : '',
      aboutText ? `ABOUT: ${aboutText}` : '',
    ].filter(Boolean).join('\n\n').slice(0, 4000)

    return { fullText, email, socialLinks, youtubeLink }
  } catch { return empty }
}

// ─── BACKGROUND ENRICHMENT: Jobs + YouTube ───────────────────────────────────
// These run AFTER the response is returned. They update agent_profiles in place.
// NOT on the critical path — never blocks the user.

function nameTokens(name: string): string[] {
  const STOP = new Set(['insurance','agency','group','llc','inc','co','corp','the','and','of','a','an','broker','services','solutions','associates','financial','advisor','advisors'])
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 2 && !STOP.has(t))
}

function nameMatchesChannel(businessName: string, candidate: string): boolean {
  const bizTokens = nameTokens(businessName)
  if (bizTokens.length === 0) return false
  const candidateLower = candidate.toLowerCase()
  const matchCount = bizTokens.filter(t => candidateLower.includes(t)).length
  return matchCount >= Math.max(1, Math.ceil(bizTokens.length * 0.5))
}

async function backgroundEnrichAgent(
  clerkId: string,
  agentName: string,
  city: string,
  state: string,
  mode: string,
  youtubeLink: string | null,
): Promise<void> {
  try {
    const modeJobTerms: Record<string, string> = {
      medicare: 'insurance agent',
      life: 'insurance agent',
      annuities: 'financial advisor',
      financial: 'financial advisor',
    }
    const jobTerm = modeJobTerms[mode] || 'insurance agent'

    const [jobData, ytData] = await Promise.all([
      // Job postings
      (async () => {
        try {
          const q = `"${agentName}" ${jobTerm} ${city} ${state}`
          const url = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(q)}&location=${encodeURIComponent(`${city}, ${state}`)}&api_key=${process.env.SERPAPI_KEY}`
          const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
          if (!res.ok) return { hiring: false, roles: [] as string[] }
          const data = await res.json()
          const nameLower = agentName.toLowerCase()
          const relevant = (data.jobs_results || []).filter((j: any) => {
            const companyMatch = j.company_name?.toLowerCase().includes(nameLower.split(' ')[0]) ||
              nameLower.includes((j.company_name?.toLowerCase() || '').split(' ')[0])
            const recent = ['hour', 'day', 'week', 'month'].some(t => j.detected_extensions?.posted_at?.includes(t))
            return companyMatch && recent
          })
          return { hiring: relevant.length > 0, roles: relevant.map((j: any) => j.title).slice(0, 3) as string[] }
        } catch { return { hiring: false, roles: [] as string[] } }
      })(),
      // YouTube
      (async () => {
        try {
          if (youtubeLink) {
            const handleMatch = youtubeLink.match(/youtube\.com\/((@[A-Za-z0-9_.-]+)|channel\/[A-Za-z0-9_-]+|c\/[A-Za-z0-9_-]+|user\/[A-Za-z0-9_-]+)/)
            if (handleMatch) {
              const handle = handleMatch[1]
              const searchUrl = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(handle)}&api_key=${process.env.SERPAPI_KEY}`
              const res = await fetch(searchUrl, { signal: AbortSignal.timeout(6000) })
              if (res.ok) {
                const data = await res.json()
                const matched = (data.channel_results || []).find((c: any) => nameMatchesChannel(agentName, c.title || ''))
                if (matched) return { channel: matched.link || youtubeLink, subscribers: matched.subscribers || null, videoCount: 1 }
              }
            }
            return { channel: youtubeLink, subscribers: null as string | null, videoCount: 0 }
          }
          // No site link — search by name
          const searchUrl = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent('"' + agentName + '"')}&api_key=${process.env.SERPAPI_KEY}`
          const res = await fetch(searchUrl, { signal: AbortSignal.timeout(6000) })
          if (!res.ok) return { channel: null as string | null, subscribers: null as string | null, videoCount: 0 }
          const data = await res.json()
          const matchedChannel = (data.channel_results || []).find((c: any) => nameMatchesChannel(agentName, c.title || ''))
          if (matchedChannel) return { channel: matchedChannel.link, subscribers: matchedChannel.subscribers || null, videoCount: 1 }
          const matchedVideo = (data.video_results || []).find((v: any) => nameMatchesChannel(agentName, v.channel?.name || ''))
          if (matchedVideo?.channel?.link) return { channel: matchedVideo.channel.link, subscribers: null as string | null, videoCount: 1 }
          return { channel: null as string | null, subscribers: null as string | null, videoCount: 0 }
        } catch { return { channel: null as string | null, subscribers: null as string | null, videoCount: 0 } }
      })(),
    ])

    // Update the agent_profiles row with hiring + youtube data
    await supabase
      .from('agent_profiles')
      .update({
        hiring: jobData.hiring,
        hiring_roles: jobData.roles.length ? jobData.roles : null,
        youtube_channel: ytData.channel,
        youtube_subscribers: ytData.subscribers,
      })
      .eq('clerk_id', clerkId)
      .eq('name', agentName)
      .eq('city', city)
      .eq('state', state)
  } catch (err) {
    console.error('[backgroundEnrichAgent] error:', err)
  }
}

// ─── SONNET SCORING ───────────────────────────────────────────────────────────
// Anchored to preScore. Sonnet can adjust ±15 max and must explain why.
// Primary job: write the recruiter-facing snippet + confirm captive/carriers.

async function sonnetScore(
  raw: any,
  intel: WebsiteIntel,
  anchorScore: number,
  mode: string,
): Promise<{
  scoreDelta: number
  carriers: string[]
  captive: boolean
  years: number | null
  notes: string
  about: string | null
  contact_email: string | null
}> {
  const anthropic = getAnthropicClient()
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.medicare
  const name = raw.title || 'Unknown'

  const prompt = `You are an expert ${cfg.analyst}. Your job is to review an insurance agent listing and website, then:
1. Write a recruiter-facing snippet (the "notes" and "about" fields) — this is the PRIMARY deliverable.
2. Adjust the pre-computed anchor score by at most ±15 points based on what the website reveals.
3. Identify carriers/product lines and confirm captive status.

ANCHOR SCORE: ${anchorScore}/100 (computed from: review volume, independence signals, specialty keywords, web presence)
Your adjusted score must stay within ${Math.max(0, anchorScore - 15)}–${Math.min(100, anchorScore + 15)}.
Only move the needle if the website content gives you a clear reason to.

GOOGLE LISTING:
Name: ${name}
Type: ${raw.type || ''}
Description: ${raw.description || ''}
Tags: ${(raw.extensions || []).join(' ')}
Rating: ${raw.rating || 0} stars / ${raw.reviews || 0} reviews
Website: ${raw.website || 'None'}

WEBSITE CONTENT:
${intel.fullText
    ? intel.fullText
    : raw.website
      ? 'Website exists but could not be scraped (JS-rendered). Score on listing signals only — do NOT penalize.'
      : 'No website.'
  }

CAPTIVE BRANDS — only mark captive:true if one of these appears explicitly: ${cfg.captiveBrands.join(', ')}.
Assume INDEPENDENT unless you see a brand name above.

SCORING CONTEXT FOR ${mode.toUpperCase()}:
- Independent signals: ${cfg.independenceKeywords.join(', ')}
- Specialty signals: ${cfg.specialtyKeywords.join(', ')}
${cfg.negativeKeywords ? `- Negative signals (score down): ${cfg.negativeKeywords.join(', ')}` : ''}

Return ONLY valid JSON — no markdown, no preamble:
{
  "scoreDelta": number between -15 and +15,
  "carriers": ["carrier or product line names — infer from specialty if not explicit"],
  "captive": boolean,
  "years": number or null,
  "notes": "2-3 sentences for the recruiter explaining WHY this agent is worth calling (or not). Be specific — mention what the website revealed. If website was unscrapable, say so.",
  "about": "1-2 sentence plain-English summary of who this agency is and who they serve. null if no content.",
  "contact_email": "best contact email found, or null"
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    const parsed = JSON.parse(jsonMatch[0])
    return {
      scoreDelta: Math.max(-15, Math.min(15, parsed.scoreDelta || 0)),
      carriers: parsed.carriers || ['Unknown'],
      captive: parsed.captive || false,
      years: parsed.years || null,
      notes: parsed.notes || '',
      about: parsed.about || null,
      contact_email: parsed.contact_email || null,
    }
  } catch {
    return { scoreDelta: 0, carriers: ['Unknown'], captive: false, years: null, notes: '', about: null, contact_email: null }
  }
}

// ─── MAIN ENRICHMENT PIPELINE ─────────────────────────────────────────────────

async function enrichAgent(raw: any, mode: string): Promise<Omit<AgentResult, 'hiring' | 'hiring_roles' | 'youtube_channel' | 'youtube_subscribers' | 'youtube_video_count'> & {
  _youtubeLink: string | null
}> {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.medicare
  const { score: ps, captive: isCaptive } = preScore(raw, mode)

  // ── FAST PATH: clear cold (captive or very low signal) ───────────────────
  if (ps < 40) {
    return {
      name: raw.title || 'Unknown',
      type: raw.type || cfg.typeFallback,
      phone: raw.phone || '', address: raw.address || '',
      rating: raw.rating || 0, reviews: raw.reviews || 0,
      website: raw.website || null,
      carriers: ['Unknown'], captive: isCaptive, years: null,
      score: ps, flag: 'cold',
      notes: isCaptive ? 'Captive brand — not recruitable.' : 'Low signal — insufficient data to qualify.',
      about: null, contact_email: null, social_links: [],
      _preScore: ps, _enrichmentDelta: 0, _sonnetDelta: 0,
      _youtubeLink: null,
    }
  }

  // ── CRAWL WEBSITE ─────────────────────────────────────────────────────────
  const intel = raw.website
    ? await crawlWebsite(raw.website)
    : { fullText: '', email: null, socialLinks: [], youtubeLink: null }

  // ── ENRICHMENT DELTAS ─────────────────────────────────────────────────────
  // Applied to preScore BEFORE Sonnet sees it, so Sonnet's anchor is already enriched.
  // Jobs/YouTube bonuses are NOT here — they run in background.
  let enrichmentDelta = 0
  if (intel.fullText.length > 200) enrichmentDelta += 3   // Real website content found
  if (intel.email)                 enrichmentDelta += 2   // Contact email found
  if (intel.socialLinks.length)    enrichmentDelta += 2   // Social presence confirmed
  if (intel.youtubeLink)           enrichmentDelta += 5   // YouTube found on site

  const anchorScore = Math.min(100, ps + enrichmentDelta)

  // ── FAST PATH: clear hot (80+) — still goes to Sonnet for the writeup ────
  // But if it's 90+, the writeup is the only thing we need — score is locked.
  // We always Sonnet hot agents because the snippet IS the product.

  // ── SONNET: ambiguous (40-79) OR hot (80+) for snippet ───────────────────
  // The only skip is cold (<40), handled above.
  const sonnetResult = await sonnetScore(raw, intel, anchorScore, mode)

  const finalScore = Math.min(100, Math.max(0, anchorScore + sonnetResult.scoreDelta))

  return {
    name: raw.title || 'Unknown',
    type: raw.type || cfg.typeFallback,
    phone: raw.phone || '', address: raw.address || '',
    rating: raw.rating || 0, reviews: raw.reviews || 0,
    website: raw.website || null,
    carriers: sonnetResult.carriers,
    captive: sonnetResult.captive,
    years: sonnetResult.years,
    score: finalScore,
    flag: finalScore >= 75 ? 'hot' : finalScore >= 50 ? 'warm' : 'cold',
    notes: sonnetResult.notes || 'Scored from listing and website signals.',
    about: sonnetResult.about,
    contact_email: sonnetResult.contact_email || intel.email || null,
    social_links: intel.socialLinks,
    _preScore: ps,
    _enrichmentDelta: enrichmentDelta,
    _sonnetDelta: sonnetResult.scoreDelta,
    _youtubeLink: intel.youtubeLink,
  }
}

// ─── UPSERT ───────────────────────────────────────────────────────────────────

async function upsertAgentProfiles(
  clerkId: string,
  city: string,
  state: string,
  agents: AgentResult[],
): Promise<void> {
  if (!agents.length) return
  const rows = agents.map(a => ({
    clerk_id: clerkId,
    name: a.name,
    agency_type: a.type,
    city, state,
    address: a.address || null,
    phone: a.phone || null,
    website: a.website || null,
    contact_email: a.contact_email || null,
    social_links: a.social_links?.length ? a.social_links : null,
    rating: a.rating || null,
    reviews: a.reviews || null,
    carriers: a.carriers?.length ? a.carriers : null,
    captive: a.captive || false,
    prometheus_score: a.score,
    prometheus_flag: a.flag,
    prometheus_notes: a.notes,
    prometheus_about: a.about || null,
    hiring: a.hiring || false,
    hiring_roles: a.hiring_roles?.length ? a.hiring_roles : null,
    youtube_channel: a.youtube_channel || null,
    youtube_subscribers: a.youtube_subscribers || null,
    last_seen: new Date().toISOString(),
  }))

  await supabase.from('agent_profiles').upsert(rows, {
    onConflict: 'clerk_id,name,city,state',
    ignoreDuplicates: false,
  })

  void supabase.rpc('increment_agent_search_count', {
    p_clerk_id: clerkId,
    p_names: agents.map(a => a.name),
    p_city: city,
    p_state: state,
  })
}

// ─── ROUTE HANDLER ────────────────────────────────────────────────────────────

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
        clerk_id: userId, city, state,
        results_count: 0, hot_count: 0, warm_count: 0, cold_count: 0, agents_json: [],
      })
      return NextResponse.json({ agents: [] })
    }

    // ── Pre-score all candidates (instant) ───────────────────────────────────
    const prescored = rawAgents
      .slice(0, clampedLimit)
      .map(raw => ({ raw, ps: preScore(raw, mode) }))
      .sort((a, b) => b.ps.score - a.ps.score)

    // ── Enrich hot/warm (≥40) with concurrency 6 ─────────────────────────────
    // Cold (<40) get returned as-is — no crawl, no LLM.
    const { default: pLimit } = await import('p-limit')
    const limiter = pLimit(6)

    const toEnrich = prescored.filter(x => x.ps.score >= 40)
    const coldTail  = prescored.filter(x => x.ps.score < 40)

    const enrichedRaw = await Promise.all(
      toEnrich.map(({ raw }) => limiter(() => enrichAgent(raw, mode)))
    )

    // ── Cold tail: shape into AgentResult with no enrichment ─────────────────
    const cfg = MODE_CONFIG[mode] || MODE_CONFIG.medicare
    const coldResults: AgentResult[] = coldTail.map(({ raw, ps }) => ({
      name: raw.title || 'Unknown',
      type: raw.type || cfg.typeFallback,
      phone: raw.phone || '', address: raw.address || '',
      rating: raw.rating || 0, reviews: raw.reviews || 0,
      website: raw.website || null,
      carriers: ['Unknown'], captive: ps.captive, years: null,
      score: ps.score, flag: 'cold' as const,
      notes: ps.captive ? 'Captive brand — not recruitable.' : 'Low signal — not enriched.',
      hiring: false, hiring_roles: [],
      youtube_channel: null, youtube_subscribers: null, youtube_video_count: 0,
      about: null, contact_email: null, social_links: [],
      _preScore: ps.score, _enrichmentDelta: 0, _sonnetDelta: 0,
    }))

    // ── Merge enriched + cold, sort by final score ────────────────────────────
    const enrichedResults: AgentResult[] = enrichedRaw.map(e => ({
      ...e,
      hiring: false,          // will be filled in by background job
      hiring_roles: [],
      youtube_channel: null,
      youtube_subscribers: null,
      youtube_video_count: 0,
    }))

    const sorted = [...enrichedResults, ...coldResults].sort((a, b) => b.score - a.score)

    // ── Persist + kick off background enrichment ─────────────────────────────
    void Promise.all([
      upsertAgentProfiles(userId, city, state, sorted).catch(err =>
        console.error('[/api/search] upsert error:', err)
      ),
      Promise.resolve(supabase.from('searches').insert({
        clerk_id: userId, city, state,
        results_count: sorted.length,
        hot_count: sorted.filter(a => a.flag === 'hot').length,
        warm_count: sorted.filter(a => a.flag === 'warm').length,
        cold_count: sorted.filter(a => a.flag === 'cold').length,
        agents_json: sorted,
      })).catch((err: unknown) => console.error('[/api/search] searches insert error:', err)),
      // Background: jobs + YouTube for hot/warm agents only
      ...enrichedRaw
        .filter(e => e.flag !== 'cold')
        .map(e =>
          backgroundEnrichAgent(userId, e.name, city, state, mode, e._youtubeLink)
            .catch(err => console.error('[backgroundEnrichAgent]', e.name, err))
        ),
    ])

    // Strip internal debug fields before sending to client
    const clientResults = sorted.map(({ _preScore, _enrichmentDelta, _sonnetDelta, ...rest }: any) => rest)
    return NextResponse.json({ agents: clientResults })

  } catch (err) {
    console.error('[/api/search] error:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
