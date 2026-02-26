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
}

async function fetchAgentsFromSerp(city: string, state: string, limit: number, mode: string): Promise<any[]> {
  const base: string[] = []

  // Mode controls WHAT type of agent we're looking for.
  // We intentionally omit city/state from the query string because we enforce location
  // via the SerpAPI `location` param below — mixing both causes Google to widen the
  // search area or return national directory results instead of true local listings.
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

  // Scale up for larger limits
  const queries = limit >= 30 ? base : base.slice(0, Math.max(3, Math.ceil(base.length * 0.6)))

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
        // Post-fetch filter: drop results whose address clearly doesn't match the
        // searched city/state. This catches edge cases where Google returns nearby
        // market results even when a location param is set (e.g. national chains).
        const addr = (item.address || '').toLowerCase()
        const cityLower = city.toLowerCase()
        const stateLower = state.toLowerCase()
        const cityWords = cityLower.split(' ').filter((w: string) => w.length > 2)
        const cityMatch = cityWords.some((w: string) => addr.includes(w))
        const stateMatch = addr.includes(stateLower) || addr.includes(`, ${state.toLowerCase()}`)
        if (!cityMatch && !stateMatch) return // skip results from wrong market

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

async function fetchWebsiteText(rawUrl: string): Promise<string> {
  try {
    const parsed = new URL(rawUrl)

    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) return ''

    // Block internal/metadata hosts
    if (BLOCKED_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith('.local'))) return ''

    // Block private IP ranges
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(parsed.hostname)) return ''

    const res = await fetch(rawUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Recruiterrr/1.0)' },
      signal: AbortSignal.timeout(5000),
      redirect: 'follow',
    })

    // Cap response size — read max 500KB
    const reader = res.body?.getReader()
    if (!reader) return ''
    let html = ''
    let bytes = 0
    const MAX = 500_000
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.length
      html += new TextDecoder().decode(value)
      if (bytes > MAX) { reader.cancel(); break }
    }

    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 3000)
  } catch { return '' }
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

async function scoreAgent(raw: any, websiteText: string, jobData: { hiring: boolean; roles: string[] }, ytData: { channel: string | null; subscribers: string | null; videoCount: number }, mode: string = 'all'): Promise<AgentResult> {
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

WEBSITE TEXT:
${websiteText || 'No website available'}

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

Return ONLY valid JSON:
{
  "carriers": ["array"],
  "captive": boolean,
  "years": number or null,
  "score": 0-100,
  "flag": "hot"|"warm"|"cold",
  "notes": "2-3 sentences with specific data points including job/youtube signals if present"
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
    const { city, state, limit: resultLimit = 10, mode = 'all' } = await req.json()
    if (!city || !state) return NextResponse.json({ error: 'City and state required' }, { status: 400 })

    const clampedLimit = Math.min(50, Math.max(10, Number(resultLimit)))
    const rawAgents = await fetchAgentsFromSerp(city, state, clampedLimit, mode)

    if (!rawAgents.length) {
      await supabase.from('searches').insert({ clerk_id: userId, city, state, results_count: 0, hot_count: 0, warm_count: 0, cold_count: 0, agents_json: [] })
      return NextResponse.json({ agents: [] })
    }

    const top = rawAgents.slice(0, clampedLimit)
    const scored = await Promise.all(top.map(async (raw) => {
      const reviews = raw.reviews || 0
      const websiteText = raw.website ? await fetchWebsiteText(raw.website) : ''
      const jobData = await fetchJobPostings(raw.title, city, state)
      const ytData = (reviews >= 50 || !!raw.website) ? await fetchYouTube(raw.title, city) : { channel: null, subscribers: null, videoCount: 0 }
      return scoreAgent(raw, websiteText, jobData, ytData, mode)
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
