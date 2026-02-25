import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
})

type AgentResult = {
  name: string
  type: string
  phone: string
  address: string
  rating: number
  reviews: number
  website: string | null
  carriers: string[]
  captive: boolean
  score: number
  flag: 'hot' | 'warm' | 'cold'
  notes: string
  years: number | null
}

async function fetchAgentsFromSerp(city: string, state: string): Promise<any[]> {
  const queries = [
    `Medicare insurance agent ${city} ${state}`,
    `health insurance agent ${city} ${state}`,
    `Medicare supplement agent ${city} ${state}`,
  ]

  const seen = new Set<string>()
  const results: any[] = []

  await Promise.all(queries.map(async (q) => {
    try {
      const url = `https://serpapi.com/search.json?engine=google_local&q=${encodeURIComponent(q)}&api_key=${process.env.SERPAPI_KEY}`
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      const locals = data.local_results || []
      for (const item of locals) {
        const key = item.title + item.address
        if (!seen.has(key)) {
          seen.add(key)
          results.push(item)
        }
      }
    } catch {
      // silently skip failed queries
    }
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
    // Strip HTML tags crudely for AI consumption
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 3000)
  } catch {
    return ''
  }
}

async function scoreAgent(raw: any, websiteText: string): Promise<AgentResult> {
  const prompt = `You are an expert Medicare insurance industry analyst helping FMO recruiters identify recruitable agents.

Analyze this agent's data and return a JSON object with recruitment intelligence.

AGENT DATA:
Name: ${raw.title || 'Unknown'}
Type: ${raw.type || 'Unknown'}
Phone: ${raw.phone || 'None'}
Address: ${raw.address || 'Unknown'}
Rating: ${raw.rating || 0}
Reviews: ${raw.reviews || 0}
Website: ${raw.website || 'None'}

WEBSITE TEXT (first 3000 chars):
${websiteText || 'No website data available'}

Return ONLY valid JSON with these exact fields:
{
  "carriers": ["list of insurance carriers mentioned, e.g. Aetna, Humana, UHC, Cigna, WellCare, Anthem, BCBS. Use 'Unknown' if none found"],
  "captive": boolean (true if they appear to only sell one carrier),
  "years": number or null (years in business if found),
  "score": number 0-100 (recruitability score),
  "flag": "hot" or "warm" or "cold",
  "notes": "2-3 sentence analyst note on why this agent is or isn't recruitable"
}

SCORING RULES:
- Independent + multiple carriers + 2-7 years in business = HIGH score (75-95)
- Independent + 1-2 carriers + newer agent = MEDIUM score (50-74)  
- Captive single carrier OR 15+ year tenure (very loyal) OR no web presence = LOW score (0-49)
- HOT = score >= 75, WARM = score 50-74, COLD = score < 50
- More carriers = more open to change = higher score
- New agents (under 3 years) score 60-75 — open to better deals but unproven
- Captives score 15-40 — very hard to recruit`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const parsed = JSON.parse(jsonMatch[0])

    return {
      name: raw.title || 'Unknown',
      type: raw.type || 'Insurance Agency',
      phone: raw.phone || '',
      address: raw.address || '',
      rating: raw.rating || 0,
      reviews: raw.reviews || 0,
      website: raw.website || null,
      carriers: parsed.carriers || ['Unknown'],
      captive: parsed.captive || false,
      years: parsed.years || null,
      score: Math.min(100, Math.max(0, parsed.score || 50)),
      flag: parsed.flag || 'warm',
      notes: parsed.notes || 'No analysis available.',
    }
  } catch {
    // Fallback scoring if AI fails
    const hasWebsite = !!raw.website
    const reviews = raw.reviews || 0
    const rating = raw.rating || 0
    const baseScore = hasWebsite ? 55 : 35
    const reviewBonus = Math.min(20, Math.floor(reviews / 10))
    const score = Math.min(85, baseScore + reviewBonus)

    return {
      name: raw.title || 'Unknown',
      type: raw.type || 'Insurance Agency',
      phone: raw.phone || '',
      address: raw.address || '',
      rating,
      reviews,
      website: raw.website || null,
      carriers: ['Unknown'],
      captive: false,
      years: null,
      score,
      flag: score >= 75 ? 'hot' : score >= 50 ? 'warm' : 'cold',
      notes: 'AI scoring unavailable. Manual review recommended.',
    }
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit: 10 searches per user per hour
  const { success, limit, remaining, reset } = await ratelimit.limit(userId)
  if (!success) {
    return NextResponse.json({
      error: `Rate limit exceeded. You have ${limit} searches per hour. Resets at ${new Date(reset).toLocaleTimeString()}.`
    }, { status: 429 })
  }

  try {
    const { city, state } = await req.json()
    if (!city || !state) return NextResponse.json({ error: 'City and state required' }, { status: 400 })

    // 1. Fetch from SerpAPI
    const rawAgents = await fetchAgentsFromSerp(city, state)

    if (!rawAgents.length) {
      return NextResponse.json({ agents: [] })
    }

    // 2. Limit to top 10 results to control API costs
    const top = rawAgents.slice(0, 10)

    // 3. Fetch websites + score in parallel
    const scored = await Promise.all(
      top.map(async (raw) => {
        const websiteText = raw.website ? await fetchWebsiteText(raw.website) : ''
        return scoreAgent(raw, websiteText)
      })
    )

    // 4. Sort by score descending
    const sorted = scored.sort((a, b) => b.score - a.score)

    return NextResponse.json({ agents: sorted })
  } catch (err: any) {
    console.error('Search error:', err)
    return NextResponse.json({ error: err.message || 'Search failed' }, { status: 500 })
  }
}
