import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { supabase } from '@/lib/supabase.server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
})

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
  // We intentionally omit city/state from the query string because we enforce location
  // via the SerpAPI `location` param below — mixing both causes Google to widen the
  // search area or return national directory results instead of true local listings.
  //
  // If the user typed a free-text query (e.g. "Medicare supplement", "final expense"),
  // use that directly as the first and primary search term instead of the mode defaults.
  const prefix = query.trim()

  if (prefix) {
    // User-supplied query is always the primary search
    base.push(prefix)
    base.push(`${prefix} insurance agent`)
    if (limit >= 20) base.push(`${prefix} broker`)
  } else {
    if (mode === 'medicare' || mode === 'all') {
      base.push(`Medicare insurance agent`)
      base.push(`Medicare supplement broker`)
      if (limit >= 20 || mode === 'all') base.push(`Medicare advantage agent`)
      if (limit >= 30 || mode === 'all') base.push(`senior health insurance agent`)
    }
    if (mode === 'life' || mode === 'all') {
      base.push(`life insurance agent`)
      base.push(`final expense insurance agent`)
      if (limit >= 20 || mode === 'all') base.push(`term life insurance broker`)
    }
    if (mode === 'aca' || mode === 'all') {
      base.push(`health insurance agent`)
      base.push(`ACA marketplace broker`)
      if (limit >= 20 || mode === 'all') base.push(`marketplace insurance agent`)
    }
    if (mode === 'all') {
      base.push(`independent insurance agent`)
    }
  }

  // Run all queries — don't scale down based on limit, let dedup handle it
  const queries = base

  // SerpAPI google_local accepts a `location` string AND `q` separately.
  // Passing city+state here pins the Google Maps local pack to that exact market.
  // We also pass `hl=en` and `gl=us` to prevent locale drift on the API side.
  const locationParam = encodeURIComponent(`${city}, ${state}`)

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
        const stateLower = state.toLowerCase()
        const stateMatch = addr.includes(stateLower) || 
          addr.includes(`, ${state.toLowerCase()}`) ||
          addr.includes(` ${state.toLowerCase()} `) ||
          addr.endsWith(state.toLowerCase())
        // Only filter if we have an address AND it clearly belongs to a different state
        if (item.address && !stateMatch) return

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

async function fetchJobPostings(name: string, city: string, state: string): Promise<{ hiring: boolean; roles: string[] }> {
  try {
    const q = `"${name}" insurance agent ${city} ${state}`
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

async function fetchYouTube(name: string, city: string): Promise<{ channel: string | null; subscribers: string | null; videoCount: number }> {
  try {
    // Search by the business name directly — not by topic — to find THEIR channel
    const channelSearchUrl = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(name + ' insurance')}&api_key=${process.env.SERPAPI_KEY}`
    const channelRes = await fetch(channelSearchUrl, { signal: AbortSignal.timeout(6000) })
    if (!channelRes.ok) return { channel: null, subscribers: null, videoCount: 0 }
    const channelData = await channelRes.json()

    // Check channel_results first — these are actual YouTube channels.
    // STRICT: the channel title must match the business name, not just the topic.
    const matchedChannel = (channelData.channel_results || []).find((c: any) =>
      nameMatchesChannel(name, c.title || '')
    )
    if (matchedChannel) {
      return {
        channel: matchedChannel.link,
        subscribers: matchedChannel.subscribers || null,
        videoCount: 1,
      }
    }

    // Fallback: check video_results, but only accept if the uploading channel's name
    // matches the business — prevents attributing a random Medicare educator's channel.
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

async function scoreAgent(raw: any, intel: WebsiteIntel, jobData: { hiring: boolean; roles: string[] }, ytData: { channel: string | null; subscribers: string | null; videoCount: number }, mode: string = 'all'): Promise<AgentResult> {
  const name = raw.title || 'Unknown'
  const type = raw.type || ''
  const reviews = raw.reviews || 0
  const rating = raw.rating || 0
  const hasWebsite = !!raw.website

  const prompt = `You are an expert Medicare insurance industry analyst helping FMO recruiters identify recruitable independent agents.

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
${intel.fullText || 'No website available'}

JOB POSTINGS:
${jobData.hiring ? `ACTIVELY HIRING — Roles: ${jobData.roles.join(', ')}` : 'No active job postings found'}

YOUTUBE PRESENCE:
${ytData.channel ? `HAS YOUTUBE CHANNEL — ${ytData.subscribers || 'unknown subscribers'}, ${ytData.videoCount} Medicare-related video(s) found` : 'No YouTube presence found'}

SEARCH MODE: ${mode.toUpperCase()}

SCORING RULES:
1. NAME is primary signal — look for focus keywords matching the search mode:
   - Medicare/Senior mode: "Medicare","Senior","Supplement","Advantage" = strong positive
   - Life/Final Expense mode: "Life","Final Expense","Burial","Legacy","Family" = strong positive
   - ACA/Health mode: "Health","Benefits","Marketplace","Group","ACA" = strong positive
   - All Lines mode: any insurance focus keyword = positive
2. Reviews: 50+=established, 100+=well-established, 200+=dominant
3. High reviews + no website = strong referral-based independent, do NOT penalize
4. CAPTIVE (score 15-35): "Bankers Life","State Farm","Farmers","Allstate","GEICO","New York Life","Northwestern" in name
5. INDEPENDENT (score 65-95): multiple carriers, "independent" in description, broker language
6. ACTIVELY HIRING for agents = +5 to +10 points
7. HAS YOUTUBE with relevant insurance content = +5 points
8. HOT=75+, WARM=50-74, COLD=0-49

Using the ABOUT PAGE and CONTACT PAGE content, extract a concise company description and any contact details.

Return ONLY valid JSON:
{
  "carriers": ["array"],
  "captive": boolean,
  "years": number or null,
  "score": 0-100,
  "flag": "hot"|"warm"|"cold",
  "notes": "2-3 sentences with specific data points including job/youtube signals if present",
  "about": "1-2 sentence plain-English summary of who this agency is and what they focus on, drawn from their About page. null if no about content found.",
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
      name, type: type || 'Insurance Agency',
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
    const isMedicare = nl.includes('medicare') || nl.includes('senior') || nl.includes('health')
    const isCaptive = ['bankers life', 'state farm', 'farmers', 'allstate'].some(c => nl.includes(c))
    let score = 45
    if (isCaptive) score = 25
    else if (isMedicare && reviews >= 100) score = 70
    else if (isMedicare && reviews >= 50) score = 62
    else if (isMedicare) score = 55
    else if (reviews >= 100) score = 60
    else if (hasWebsite) score = 52
    if (jobData.hiring) score = Math.min(100, score + 7)
    if (ytData.channel) score = Math.min(100, score + 5)
    return {
      name, type: type || 'Insurance Agency',
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

export async function POST(req: NextRequest) {
  // CSRF check
  const origin = req.headers.get('origin')
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { success, limit, reset } = await ratelimit.limit(userId)
  if (!success) return NextResponse.json({ error: `Rate limit exceeded. Resets at ${new Date(reset).toLocaleTimeString()}.` }, { status: 429 })

  try {
    const { city, state, limit: resultLimit = 10, mode = 'all', query = '' } = await req.json()
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
      const jobData = await fetchJobPostings(raw.title, city, state)
      // YouTube priority:
      // 1. Link found on their own website — definitive, use it directly
      // 2. SerpAPI name-match — only if no site link found AND name matches confidently
      // 3. Nothing — don't show a YouTube badge at all rather than show wrong channel
      let ytData: { channel: string | null; subscribers: string | null; videoCount: number }
      if (intel.youtubeLink) {
        ytData = { channel: intel.youtubeLink, subscribers: null, videoCount: 1 }
      } else if (reviews >= 50 || !!raw.website) {
        ytData = await fetchYouTube(raw.title, city)
      } else {
        ytData = { channel: null, subscribers: null, videoCount: 0 }
      }
      return scoreAgent(raw, intel, jobData, ytData, mode)
    }))

    const sorted = scored.sort((a, b) => b.score - a.score)
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
