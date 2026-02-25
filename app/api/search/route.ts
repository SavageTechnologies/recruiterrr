import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
})

type AgentResult = {
  name: string; type: string; phone: string; address: string
  rating: number; reviews: number; website: string | null
  carriers: string[]; captive: boolean; score: number
  flag: 'hot' | 'warm' | 'cold'; notes: string; years: number | null
  hiring: boolean; hiring_roles: string[]
  youtube_channel: string | null; youtube_subscribers: string | null; youtube_video_count: number
}

async function fetchAgentsFromSerp(city: string, state: string, limit: number): Promise<any[]> {
  const queries = [
    `Medicare insurance agent ${city} ${state}`,
    `health insurance agent ${city} ${state}`,
    `Medicare supplement agent ${city} ${state}`,
  ]
  if (limit >= 20) queries.push(`independent insurance agent ${city} ${state}`)
  if (limit >= 30) {
    queries.push(`life health insurance agent ${city} ${state}`)
    queries.push(`senior health insurance ${city} ${state}`)
  }
  if (limit >= 40) {
    queries.push(`ACA health insurance broker ${city} ${state}`)
    queries.push(`Medicare advantage broker ${city} ${state}`)
  }

  const seen = new Set<string>()
  const results: any[] = []

  await Promise.all(queries.map(async (q) => {
    try {
      const url = `https://serpapi.com/search.json?engine=google_local&q=${encodeURIComponent(q)}&api_key=${process.env.SERPAPI_KEY}`
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      for (const item of (data.local_results || [])) {
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

async function fetchWebsiteText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Recruiterrr/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    const html = await res.text()
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

async function fetchYouTube(name: string, city: string): Promise<{ channel: string | null; subscribers: string | null; videoCount: number }> {
  try {
    const q = `${name} Medicare insurance ${city}`
    const url = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(q)}&api_key=${process.env.SERPAPI_KEY}`
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return { channel: null, subscribers: null, videoCount: 0 }
    const data = await res.json()
    const nameLower = name.toLowerCase().split(' ')[0]

    const matchedChannel = (data.channel_results || []).find((c: any) =>
      c.title?.toLowerCase().includes(nameLower) ||
      c.description?.toLowerCase().includes('medicare') ||
      c.description?.toLowerCase().includes('insurance')
    )
    if (matchedChannel) return { channel: matchedChannel.link, subscribers: matchedChannel.subscribers || null, videoCount: 1 }

    const matchedVideos = (data.video_results || []).filter((v: any) =>
      v.channel?.name?.toLowerCase().includes(nameLower)
    )
    if (matchedVideos.length > 0) return { channel: matchedVideos[0].channel?.link || null, subscribers: null, videoCount: matchedVideos.length }

    return { channel: null, subscribers: null, videoCount: 0 }
  } catch { return { channel: null, subscribers: null, videoCount: 0 } }
}

async function scoreAgent(raw: any, websiteText: string, jobData: { hiring: boolean; roles: string[] }, ytData: { channel: string | null; subscribers: string | null; videoCount: number }): Promise<AgentResult> {
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

SCORING RULES:
1. NAME is primary signal: "Medicare","Senior","Health" in name = independent focus
2. Reviews: 50+=established, 100+=well-established, 200+=dominant
3. High reviews + no website = strong referral-based independent, do NOT penalize
4. CAPTIVE (score 15-35): "Bankers Life","State Farm","Farmers","Allstate","GEICO" in name
5. INDEPENDENT (score 65-95): multiple carriers, "independent" in description, Medicare focus
6. ACTIVELY HIRING for agents = +5 to +10 points
7. HAS YOUTUBE with Medicare content = +5 points
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
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { success, limit, reset } = await ratelimit.limit(userId)
  if (!success) return NextResponse.json({ error: `Rate limit exceeded. Resets at ${new Date(reset).toLocaleTimeString()}.` }, { status: 429 })

  try {
    const { city, state, limit: resultLimit = 10 } = await req.json()
    if (!city || !state) return NextResponse.json({ error: 'City and state required' }, { status: 400 })

    const clampedLimit = Math.min(50, Math.max(10, Number(resultLimit)))
    const rawAgents = await fetchAgentsFromSerp(city, state, clampedLimit)

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
      return scoreAgent(raw, websiteText, jobData, ytData)
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
  } catch (err: any) {
    console.error('Search error:', err)
    return NextResponse.json({ error: err.message || 'Search failed' }, { status: 500 })
  }
}
