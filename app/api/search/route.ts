export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { supabase } from '@/lib/supabase.server'

const ALLOWED_ORIGINS = ['https://recruiterrr.com', 'http://localhost:3000']
const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', '::1']

type AgentResult = {
  name: string; type: string; phone: string; address: string
  rating: number; reviews: number; website: string | null
  carriers: string[]; captive: boolean; score: number
  flag: 'hot' | 'warm' | 'cold'; notes: string; years: number | null
  hiring: boolean; hiring_roles: string[]
  youtube_channel: string | null; youtube_subscribers: string | null; youtube_video_count: number
  about: string | null; contact_email: string | null; social_links: string[]
}

async function fetchAgentsFromSerp(city: string, state: string, limit: number, mode: string, query: string = ''): Promise<any[]> {
  const base: string[] = []

  // Mode controls WHAT type of agent we're looking for.
  // IMPORTANT: google_local engine needs the city IN the query string to produce local results.
  // Using only the `location` param is not sufficient — Google local search requires the
  // geographic context in `q` as well, or it returns zero/sparse results for smaller markets.
  // We still use the `location` param for radius targeting, but always include city in q.
  //
  // If the user typed a free-text query (e.g. "Medicare supplement", "final expense"),
  // use that directly as the first and primary search term instead of the mode defaults.
  const prefix = query.trim()
  // cityPrefix is appended to every query so SerpAPI google_local finds results
  const cityPrefix = city.trim()

  if (prefix) {
    base.push(`${prefix} ${cityPrefix}`)
    base.push(`${prefix} insurance agent ${cityPrefix}`)
    base.push(`${prefix} broker ${cityPrefix}`)
    base.push(`${prefix} independent agent ${cityPrefix}`)
  } else {
    if (mode === 'medicare') {
      base.push(`Medicare insurance agent ${cityPrefix}`)
      base.push(`Medicare supplement broker ${cityPrefix}`)
      base.push(`Medicare advantage agent ${cityPrefix}`)
      base.push(`senior health insurance agent ${cityPrefix}`)
      base.push(`health insurance broker ${cityPrefix}`)
      base.push(`independent insurance agent ${cityPrefix}`)
      base.push(`Medicare broker ${cityPrefix}`)
    }
    if (mode === 'life') {
      base.push(`life insurance agent ${cityPrefix}`)
      base.push(`final expense insurance agent ${cityPrefix}`)
      base.push(`term life insurance broker ${cityPrefix}`)
      base.push(`burial insurance agent ${cityPrefix}`)
    }
    if (mode === 'annuities') {
      base.push(`annuity agent ${cityPrefix}`)
      base.push(`annuity advisor ${cityPrefix}`)
      base.push(`fixed indexed annuity broker ${cityPrefix}`)
      base.push(`retirement income advisor ${cityPrefix}`)
      base.push(`independent annuity agent ${cityPrefix}`)
    }
    if (mode === 'financial') {
      base.push(`financial advisor ${cityPrefix}`)
      base.push(`independent financial advisor ${cityPrefix}`)
      base.push(`wealth management advisor ${cityPrefix}`)
      base.push(`financial planner ${cityPrefix}`)
      base.push(`retirement planning advisor ${cityPrefix}`)
    }
  }

  // Run all queries — don't scale down based on limit, let dedup handle it
  const queries = base

  const STATE_FULL: Record<string, string> = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
    'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
    'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
    'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
    'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
    'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
    'DC': 'District of Columbia',
  }
  const stateAbbr = state.trim().toUpperCase()
  const stateFull = STATE_FULL[stateAbbr] || state
  // SerpAPI requires full state name: "City, State, United States"
  const locationParam = encodeURIComponent(`${city}, ${stateFull}, United States`)

  const seen = new Set<string>()
  const results: any[] = []

  await Promise.all(queries.map(async (q) => {
    try {
      const url = `https://serpapi.com/search.json?engine=google_local&q=${encodeURIComponent(q)}&location=${locationParam}&hl=en&gl=us&api_key=${process.env.SERPAPI_KEY}`
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      for (const item of (data.local_results || [])) {
        // Post-fetch filter: only drop results that are clearly in a different state.
        // Don't filter by city — Google often shows agents with abbreviated or
        // slightly different city formats (KC, K.C., suburb names, etc.)
        const addr = (item.address || '').toLowerCase()
        const stateAbbr = state.toUpperCase()
        const stateLower = state.toLowerCase()
        // Match state abbreviation (KS) OR full name (kansas) — both formats appear in Google results
        const stateMatch = addr.includes(`, ${stateLower}`) ||
          addr.includes(` ${stateLower}`) ||
          addr.endsWith(stateLower) ||
          addr.includes(`, ${stateAbbr.toLowerCase()}`) ||
          addr.match(new RegExp(`\\b${stateAbbr.toLowerCase()}\\b`)) ||
          addr.match(new RegExp(`,\\s*${stateAbbr.toLowerCase()}\\s*(\\d{5})?$`))
        // Only drop if address is present AND clearly wrong state — be permissive
        if (item.address && item.address.length > 5 && !stateMatch) return

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

// Fetch and clean a single URL, returning up to maxChars of text
async function fetchPageText(rawUrl: string, maxChars = 3000): Promise<string> {
  try {
    const parsed = new URL(rawUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) return ''
    if (BLOCKED_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith('.local'))) return ''
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(parsed.hostname)) return ''

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
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxChars)
  } catch { return '' }
}

// Extract emails from text
function extractEmails(text: string): string[] {
  const matches = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || []
  // Filter out noreply, support@ style emails and obvious false positives
  return [...new Set(matches)].filter(e =>
    !e.includes('noreply') && !e.includes('no-reply') && !e.includes('@sentry') &&
    !e.includes('@example') && !e.includes('@schema') && e.length < 60
  ).slice(0, 3)
}

// Extract social links from HTML (excludes YouTube — handled separately)
function extractSocialLinks(html: string): string[] {
  const links: string[] = []
  const socialPatterns = [
    /https?:\/\/(?:www\.)?facebook\.com\/[^"'\s>]+/g,
    /https?:\/\/(?:www\.)?linkedin\.com\/(?:in|company)\/[^"'\s>]+/g,
    /https?:\/\/(?:www\.)?instagram\.com\/[^"'\s>]+/g,
    /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"'\s>]+/g,
  ]
  for (const pattern of socialPatterns) {
    const matches = html.match(pattern) || []
    for (const m of matches) {
      const clean = m.replace(/['">,]+$/, '')
      if (!links.includes(clean) && !clean.includes('sharer') && !clean.includes('intent')) {
        links.push(clean)
      }
    }
  }
  return links.slice(0, 4)
}

// Extract the agent's own YouTube channel link from their website HTML.
// A link on their own site is the highest-confidence signal we have.
function extractYouTubeLink(html: string): string | null {
  // Match channel URLs: /channel/ID, /@handle, /c/name, /user/name
  const pattern = /https?:\/\/(?:www\.)?youtube\.com\/(channel\/[A-Za-z0-9_-]+|@[A-Za-z0-9_.-]+|c\/[A-Za-z0-9_-]+|user\/[A-Za-z0-9_-]+)/g
  const matches = html.match(pattern) || []
  for (const m of matches) {
    const clean = m.replace(/['">,]+$/, '')
    // Skip YouTube's own embed/share infrastructure links
    if (clean.includes('/embed') || clean.includes('youtube.com/t/') || clean.includes('youtube.com/about')) continue
    return clean
  }
  return null
}

type WebsiteIntel = {
  homeText: string
  aboutText: string
  contactText: string
  email: string | null
  socialLinks: string[]
  youtubeLink: string | null  // extracted directly from their website — highest confidence
  fullText: string // combined for Claude scoring
}

async function fetchWebsiteText(rawUrl: string): Promise<WebsiteIntel> {
  const empty: WebsiteIntel = { homeText: '', aboutText: '', contactText: '', email: null, socialLinks: [], youtubeLink: null, fullText: '' }
  try {
    const parsed = new URL(rawUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) return empty

    const base = `${parsed.protocol}//${parsed.hostname}`

    // Crawl homepage, /about, and /contact in parallel
    const [homeHtml, aboutText, contactText] = await Promise.all([
      // For homepage we keep the raw HTML to extract socials/emails from links
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
      fetchPageText(`${base}/about`, 2000)
        .then(t => t || fetchPageText(`${base}/about-us`, 2000))
        .then(t => t || fetchPageText(`${base}/our-story`, 1500)),
      fetchPageText(`${base}/contact`, 1500)
        .then(t => t || fetchPageText(`${base}/contact-us`, 1500)),
    ])

    const homeText = homeHtml
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000)

    const socialLinks = extractSocialLinks(homeHtml)
    const allText = homeText + ' ' + aboutText + ' ' + contactText
    const emails = extractEmails(allText)
    const email = emails[0] || null

    // Build a structured summary for Claude
    const fullText = [
      homeText ? `HOMEPAGE: ${homeText}` : '',
      aboutText ? `ABOUT PAGE: ${aboutText}` : '',
      contactText ? `CONTACT PAGE: ${contactText}` : '',
    ].filter(Boolean).join('\n\n').slice(0, 6000)

    const youtubeLink = extractYouTubeLink(homeHtml)
    return { homeText, aboutText, contactText, email, socialLinks, youtubeLink, fullText }
  } catch { return empty }
}

async function fetchJobPostings(name: string, city: string, state: string, mode: string = 'medicare'): Promise<{ hiring: boolean; roles: string[] }> {
  const modeJobTerms: Record<string, string> = {
    medicare:  'insurance agent',
    life:      'insurance agent',
    annuities: 'financial advisor',
    financial: 'financial advisor',
  }
  const jobTerm = modeJobTerms[mode] || 'insurance agent'
  try {
    const q = `"${name}" ${jobTerm} ${city} ${state}`
    const url = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(q)}&location=${encodeURIComponent(`${city}, ${state}`)}&api_key=${process.env.SERPAPI_KEY}`
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return { hiring: false, roles: [] }
    const data = await res.json()
    const nameLower = name.toLowerCase()
    const relevant = (data.jobs_results || []).filter((j: any) => {
      const companyMatch = j.company_name?.toLowerCase().includes(nameLower.split(' ')[0]) ||
        nameLower.includes((j.company_name?.toLowerCase() || '').split(' ')[0])
      const recent = ['hour', 'day', 'week', 'month'].some(t => j.detected_extensions?.posted_at?.includes(t))
      return companyMatch && recent
    })
    return { hiring: relevant.length > 0, roles: relevant.map((j: any) => j.title).slice(0, 3) }
  } catch { return { hiring: false, roles: [] } }
}

// Tokenize a business name into meaningful words, stripping legal/generic suffixes
function nameTokens(name: string): string[] {
  const STOP = new Set(['insurance', 'agency', 'group', 'llc', 'inc', 'co', 'corp', 'the', 'and', 'of', 'a', 'an', 'broker', 'services', 'solutions', 'associates', 'financial', 'advisor', 'advisors'])
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 2 && !STOP.has(t))
}

// Returns true if candidate string shares enough meaningful tokens with the business name
function nameMatchesChannel(businessName: string, candidate: string): boolean {
  const bizTokens = nameTokens(businessName)
  if (bizTokens.length === 0) return false
  const candidateLower = candidate.toLowerCase()
  const matchCount = bizTokens.filter(t => candidateLower.includes(t)).length
  // Require at least half the meaningful tokens to match, and at least 1
  return matchCount >= Math.max(1, Math.ceil(bizTokens.length * 0.5))
}

// Validate a YouTube link found on the agent's own website by confirming via SerpAPI
// that the channel handle/ID actually belongs to this business — not an embedded video
// from another creator or a YouTube share widget.
async function validateYouTubeLink(link: string, businessName: string): Promise<{ channel: string | null; subscribers: string | null; videoCount: number }> {
  try {
    const handleMatch = link.match(/youtube\.com\/((@[A-Za-z0-9_.-]+)|channel\/[A-Za-z0-9_-]+|c\/[A-Za-z0-9_-]+|user\/[A-Za-z0-9_-]+)/)
    if (!handleMatch) return { channel: null, subscribers: null, videoCount: 0 }
    const handle = handleMatch[1]

    const searchUrl = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(handle)}&api_key=${process.env.SERPAPI_KEY}`
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return { channel: null, subscribers: null, videoCount: 0 }
    const data = await res.json()

    // The site-extracted link IS the ground truth — it's on their own page.
    // SERP is used only to enrich with subscriber/video metadata, not to gatekeep.
    // If SERP finds a name-matching channel, use its canonical link + metadata.
    // Otherwise, still trust the site link — just without subscriber metadata.
    const matched = (data.channel_results || []).find((c: any) =>
      nameMatchesChannel(businessName, c.title || '')
    )
    if (matched) {
      return { channel: matched.link || link, subscribers: matched.subscribers || null, videoCount: 1 }
    }

    // SERP couldn't confirm name match — trust the site link anyway, no metadata
    return { channel: link, subscribers: null, videoCount: 0 }
  } catch { return { channel: null, subscribers: null, videoCount: 0 } }
}

// Only called when we have NO website-found YouTube link.
// Searches YouTube by the exact business name and requires a strict name match on the
// channel/uploader — never returns a result just because the topic is Medicare/insurance.
async function fetchYouTube(name: string): Promise<{ channel: string | null; subscribers: string | null; videoCount: number }> {
  try {
    // Quoted name search to find THEIR channel specifically
    const channelSearchUrl = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent('"' + name + '"')}&api_key=${process.env.SERPAPI_KEY}`
    const channelRes = await fetch(channelSearchUrl, { signal: AbortSignal.timeout(6000) })
    if (!channelRes.ok) return { channel: null, subscribers: null, videoCount: 0 }
    const channelData = await channelRes.json()

    // STRICT: channel title must match the business name meaningfully
    const matchedChannel = (channelData.channel_results || []).find((c: any) =>
      nameMatchesChannel(name, c.title || '')
    )
    if (matchedChannel) {
      return { channel: matchedChannel.link, subscribers: matchedChannel.subscribers || null, videoCount: 1 }
    }

    // Fallback: video uploader channel name must match the business name
    const matchedVideo = (channelData.video_results || []).find((v: any) =>
      nameMatchesChannel(name, v.channel?.name || '')
    )
    if (matchedVideo?.channel?.link) {
      return {
        channel: matchedVideo.channel.link,
        subscribers: null,
        videoCount: (channelData.video_results || []).filter((v: any) =>
          v.channel?.link === matchedVideo.channel.link
        ).length,
      }
    }

    return { channel: null, subscribers: null, videoCount: 0 }
  } catch { return { channel: null, subscribers: null, videoCount: 0 } }
}

async function scoreAgent(raw: any, intel: WebsiteIntel, jobData: { hiring: boolean; roles: string[] }, ytData: { channel: string | null; subscribers: string | null; videoCount: number }, mode: string = 'medicare'): Promise<AgentResult> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const name = raw.title || 'Unknown'
  const type = raw.type || ''
  const reviews = raw.reviews || 0
  const rating = raw.rating || 0
  const hasWebsite = !!raw.website

  const modeTypeFallback: Record<string, string> = {
    medicare:  'Insurance Agency',
    life:      'Insurance Agency',
    annuities: 'Financial Services',
    financial: 'Financial Advisory',
  }

  const modeContext: Record<string, { analyst: string; keywords: string[]; captive: string[]; signals: string }> = {
    medicare:   { analyst: 'Medicare/senior insurance', keywords: ['Medicare','Senior','Supplement','Advantage','Medigap','PDP'], captive: ['Bankers Life','State Farm','Farmers','Allstate','GEICO','New York Life','Northwestern'], signals: 'Medicare, Supplement, Advantage, Senior, Medigap = strong positive' },
    life:       { analyst: 'life and final expense insurance', keywords: ['Life','Final Expense','Burial','Legacy','Family Protection','Term','Whole Life'], captive: ['New York Life','Northwestern','Mass Mutual','Bankers Life','Globe Life'], signals: 'Final Expense, Burial, Life, Legacy, Family = strong positive' },
    annuities:  { analyst: 'annuity and retirement income', keywords: ['Annuity','Retirement','Fixed Indexed','MYGA','Income','Wealth','Estate'], captive: ['Edward Jones','Ameriprise','Raymond James'], signals: 'Annuity, Retirement Income, Fixed Indexed, Wealth, Estate Planning = strong positive' },
    financial:  { analyst: 'financial advisory and wealth management', keywords: ['Financial','Wealth','Retirement','Planning','Investment','Advisor','CFP'], captive: ['Edward Jones','Ameriprise','Raymond James','Merrill','Morgan Stanley','Wells Fargo Advisors'], signals: 'Financial Advisor, Wealth Management, CFP, Retirement Planning, Investment = strong positive' },
  }
  const ctx = modeContext[mode] || modeContext['medicare']

  const prompt = `You are an expert ${ctx.analyst} industry analyst helping FMO/IMO recruiters identify recruitable independent agents.

CORE ASSUMPTION: In the Medicare/senior insurance market, the vast majority of agents are INDEPENDENT brokers who can be recruited. Assume INDEPENDENT unless you find explicit evidence of a captive brand. Do NOT penalize agents because you can't confirm independence — absence of captive signals IS itself a positive signal.

CAPTIVE = unrecruitable. Only flag captive if you see these specific brand names explicitly in the listing or website: ${ctx.captive.join(', ')}. Generic insurance language, multi-carrier mentions, Medicare/senior specialty focus all point AWAY from captive.

GOOGLE LISTING DATA:
Name: ${name}
Business Type: ${type}
Description: ${raw.description || ''}
Tags/Extensions: ${(raw.extensions || []).join(' ')}
Phone: ${raw.phone || 'None'}
Address: ${raw.address || 'Unknown'}
Rating: ${rating} stars / ${reviews} reviews
Has Website: ${hasWebsite ? 'YES — ' + raw.website : 'NO'}

WEBSITE INTELLIGENCE:
${intel.fullText
  ? intel.fullText
  : hasWebsite
    ? `Website exists at ${raw.website} but content could not be extracted (JavaScript-rendered site). Do NOT penalize for this — treat as neutral and score on listing data and name signals only.`
    : 'No website available.'
}

JOB POSTINGS:
${jobData.hiring ? `ACTIVELY HIRING — Roles: ${jobData.roles.join(', ')}` : 'No active job postings found'}

YOUTUBE PRESENCE:
${ytData.channel ? `HAS YOUTUBE CHANNEL — ${ytData.subscribers || 'unknown subscribers'}, ${ytData.videoCount} video(s) found` : 'No YouTube presence found'}

SEARCH LINE: ${mode.toUpperCase()}

SCORING RULES:
1. DEFAULT is INDEPENDENT and recruitable. Only mark captive:true and score 15-35 if a known captive brand is explicitly present: ${ctx.captive.join(', ')}.
2. Medicare/senior/supplement/health specialty name or description = strong independent signal. Score 65+ baseline.
3. Multi-carrier mentions, "broker", "independent", specialty product focus (Medicare Advantage, Supplement, Annuities, Final Expense) = score 70-80.
4. Reviews signal production volume: 50+ = established producer (score boost), 100+ = well-established, 200+ = dominant. High reviews + independent signals = HOT.
5. ACTIVELY HIRING for agents = +8 points. They are growing and likely frustrated with upline support.
6. HAS YOUTUBE = +7 points. Building a personal brand means they are thinking beyond their current upline.
7. Website exists but content could not be scraped = completely neutral. Do NOT dock points.
8. HOT = 75+, WARM = 50-74, COLD = 0-49.
9. When in doubt score HIGHER. A missed HOT agent costs a recruit. An extra call costs nothing.

Return ONLY valid JSON:
{
  "carriers": ["carriers or product lines identified — infer from specialty focus if not explicitly listed"],
  "captive": boolean,
  "years": number or null,
  "score": 0-100,
  "flag": "hot"|"warm"|"cold",
  "notes": "2-3 sentences explaining the score. If website was unscrapable say so and explain what you scored on instead.",
  "about": "1-2 sentence plain-English summary of who this agency is. null if no content found.",
  "contact_email": "primary contact email if found on website, else null"
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    const parsed = JSON.parse(jsonMatch[0])
    return {
      name, type: type || modeTypeFallback[mode] || 'Insurance Agency',
      phone: raw.phone || '', address: raw.address || '',
      rating, reviews, website: raw.website || null,
      carriers: parsed.carriers || ['Unknown'],
      captive: parsed.captive || false,
      years: parsed.years || null,
      score: Math.min(100, Math.max(0, parsed.score || 50)),
      flag: parsed.flag || 'warm',
      notes: parsed.notes || 'No analysis available.',
      hiring: jobData.hiring, hiring_roles: jobData.roles,
      youtube_channel: ytData.channel, youtube_subscribers: ytData.subscribers, youtube_video_count: ytData.videoCount,
      about: parsed.about || null,
      contact_email: parsed.contact_email || intel.email || null,
      social_links: intel.socialLinks || [],
    }
  } catch {
    const nl = name.toLowerCase()
    const modeKeywords: Record<string, string[]> = {
      medicare:  ['medicare','senior','supplement','advantage','medigap','health','insurance','broker'],
      life:      ['life','final expense','burial','legacy','term','whole life'],
      annuities: ['annuity','annuities','retirement','indexed','myga','income'],
      financial: ['financial','wealth','planning','advisor','investment','cfp'],
    }
    const modeCapt: Record<string, string[]> = {
      medicare:  ['bankers life','state farm','farmers','allstate','geico'],
      life:      ['new york life','northwestern','mass mutual','globe life'],
      annuities: ['edward jones','ameriprise','raymond james'],
      financial: ['edward jones','ameriprise','raymond james','merrill','morgan stanley'],
    }
    const keywords = modeKeywords[mode] || modeKeywords['medicare']
    const captiveNames = modeCapt[mode] || modeCapt['medicare']
    // Only flag captive if an explicit captive brand is found
    const isCaptive = captiveNames.some(c => nl.includes(c))
    // Default assumption: independent and recruitable
    // Start at 60 and work up from there
    let score = isCaptive ? 25 : 60
    if (!isCaptive) {
      if (reviews >= 200) score = 82
      else if (reviews >= 100) score = 76
      else if (reviews >= 50) score = 70
      else if (reviews >= 20) score = 65
      if (hasWebsite) score = Math.min(100, score + 3)
    }
    if (jobData.hiring) score = Math.min(100, score + 8)
    if (ytData.channel) score = Math.min(100, score + 7)
    return {
      name, type: type || modeTypeFallback[mode] || 'Insurance Agency',
      phone: raw.phone || '', address: raw.address || '',
      rating, reviews, website: raw.website || null,
      carriers: ['Unknown'], captive: isCaptive, years: null, score,
      flag: score >= 75 ? 'hot' : score >= 50 ? 'warm' : 'cold',
      notes: 'Fallback score based on name, review, and enrichment signals.',
      hiring: jobData.hiring, hiring_roles: jobData.roles,
      youtube_channel: ytData.channel, youtube_subscribers: ytData.subscribers, youtube_video_count: ytData.videoCount,
      about: null,
      contact_email: intel.email || null,
      social_links: intel.socialLinks || [],
    }
  }
}

// ─── AGENT PROFILE UPSERT ────────────────────────────────────────────────────
// Called after every search. Writes each enriched agent to agent_profiles.
// On conflict (same clerk_id + name + city + state): update enrichment fields,
// bump last_seen, increment search_count. ANATHEMA fields are never overwritten here.

async function upsertAgentProfiles(
  clerkId: string,
  city: string,
  state: string,
  agents: AgentResult[]
): Promise<void> {
  if (!agents.length) return

  const rows = agents.map(a => ({
    clerk_id:           clerkId,
    name:               a.name,
    agency_type:        a.type,
    city:               city,
    state:              state,
    address:            a.address || null,
    phone:              a.phone || null,
    website:            a.website || null,
    contact_email:      a.contact_email || null,
    social_links:       a.social_links?.length ? a.social_links : null,
    rating:             a.rating || null,
    reviews:            a.reviews || null,
    carriers:           a.carriers?.length ? a.carriers : null,
    captive:            a.captive || false,
    prometheus_score:   a.score,
    prometheus_flag:    a.flag,
    prometheus_notes:   a.notes,
    prometheus_about:   a.about || null,
    hiring:             a.hiring || false,
    hiring_roles:       a.hiring_roles?.length ? a.hiring_roles : null,
    youtube_channel:    a.youtube_channel || null,
    youtube_subscribers: a.youtube_subscribers || null,
    last_seen:          new Date().toISOString(),
  }))

  // Upsert in one batch — on conflict update enrichment, bump counters
  await supabase
    .from('agent_profiles')
    .upsert(rows, {
      onConflict: 'clerk_id,name,city,state',
      ignoreDuplicates: false,
    })

  // Increment search_count for any that already existed
  // (Supabase upsert doesn't support expressions like search_count + 1 directly)
  // We do a separate update for records that just got upserted and already had data
  Promise.resolve(
    supabase.rpc('increment_agent_search_count', {
      p_clerk_id: clerkId,
      p_names: agents.map(a => a.name),
      p_city: city,
      p_state: state,
    })
  ).catch(() => {})
}

export async function POST(req: NextRequest) {
  // CSRF check
  const origin = req.headers.get('origin')
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(15, '1 h'), analytics: true })
  // const { success, limit, reset } = await ratelimit.limit(userId)
  // if (!success) return NextResponse.json({ error: `Rate limit exceeded. Resets at ${new Date(reset).toLocaleTimeString()}.` }, { status: 429 })

  try {
    const { city, state, limit: resultLimit = 10, mode = 'medicare', query = '' } = await req.json()
    if (!city || !state) return NextResponse.json({ error: 'City and state required' }, { status: 400 })

    const clampedLimit = Math.min(50, Math.max(10, Number(resultLimit)))
    const rawAgents = await fetchAgentsFromSerp(city, state, clampedLimit, mode, query)

    if (!rawAgents.length) {
      await supabase.from('searches').insert({ clerk_id: userId, city, state, results_count: 0, hot_count: 0, warm_count: 0, cold_count: 0, agents_json: [] })
      return NextResponse.json({ agents: [] })
    }

    const top = rawAgents.slice(0, clampedLimit)
    const scored = await Promise.all(top.map(async (raw) => {
      const reviews = raw.reviews || 0
      const intel = raw.website ? await fetchWebsiteText(raw.website) : { homeText: '', aboutText: '', contactText: '', email: null, socialLinks: [], youtubeLink: null, fullText: '' }
      const jobData = await fetchJobPostings(raw.title, city, state, mode)
      // YouTube priority:
      // YouTube strategy — strictest possible to avoid false attributions:
      // 1. Found a YouTube link on their own website → validate it via SerpAPI to confirm
      //    the channel handle/name actually matches this business (not an embedded video)
      // 2. No site link → search YouTube by exact quoted business name, require name match
      // 3. No confirmed match either way → no badge, period
      let ytData: { channel: string | null; subscribers: string | null; videoCount: number }
      if (intel.youtubeLink) {
        ytData = await validateYouTubeLink(intel.youtubeLink, raw.title)
      } else if (raw.website) {
        ytData = await fetchYouTube(raw.title)
      } else {
        ytData = { channel: null, subscribers: null, videoCount: 0 }
      }
      return scoreAgent(raw, intel, jobData, ytData, mode)
    }))

    const sorted = scored.sort((a, b) => b.score - a.score)

    // ── Persist to agent_profiles database ───────────────────────────────────
    // Fire and forget — don't block the response. Every enriched agent gets a
    // permanent record. Same agent searched twice = upsert, search_count++.
    upsertAgentProfiles(userId, city, state, sorted).catch(err =>
      console.error('[/api/search] upsert error:', err)
    )

    await supabase.from('searches').insert({
      clerk_id: userId, city, state,
      results_count: sorted.length,
      hot_count: sorted.filter(a => a.flag === 'hot').length,
      warm_count: sorted.filter(a => a.flag === 'warm').length,
      cold_count: sorted.filter(a => a.flag === 'cold').length,
      agents_json: sorted,
    })

    return NextResponse.json({ agents: sorted })
  } catch (err) {
    console.error('[/api/search] error:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
