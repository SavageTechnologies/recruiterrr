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
          // Website lives in links.website in google_local responses
          item.website = item.links?.website || null
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
  const name = raw.title || 'Unknown'
  const type = raw.type || ''
  const description = raw.description || ''
  const extensions = (raw.extensions || []).join(' ')
  const reviews = raw.reviews || 0
  const rating = raw.rating || 0
  const hasWebsite = !!raw.website

  const prompt = `You are an expert Medicare insurance industry analyst helping FMO recruiters identify recruitable independent agents.

Analyze ALL available data and return recruitment intelligence. Use every signal available.

GOOGLE LISTING DATA:
Name: ${name}
Business Type: ${type}
Description: ${description}
Tags/Extensions: ${extensions}
Phone: ${raw.phone || 'None'}
Address: ${raw.address || 'Unknown'}
Rating: ${rating} stars
Review Count: ${reviews} reviews
Has Website: ${hasWebsite ? 'YES — ' + raw.website : 'NO'}

WEBSITE TEXT:
${websiteText || 'No website available — rely on name, type, description, and review signals'}

SCORING RULES — READ CAREFULLY:
1. Business NAME is a primary signal. "Medicare" or "Senior" in the name = Medicare-focused independent = higher score
2. Review count signals establishment: 50+ = established, 100+ = well-established, 200+ = dominant local player
3. High reviews + no website = strong referral-based independent agent. Do NOT penalize for missing website if reviews are high
4. CAPTIVE indicators (score 15-35): "Bankers Life", "State Farm", "Farmers", "Allstate", "GEICO" in name
5. INDEPENDENT indicators (score 65-95): multiple carriers mentioned, "independent" in description, Medicare/Senior focus
6. Agents with 100+ reviews and Medicare focus but no website = score 65-75 (established independent, just not digital)
7. Agents with website + multiple carriers + Medicare focus = score 80-95
8. Unknown carrier mix + moderate reviews = score 50-65

SCALE: HOT = 75+, WARM = 50-74, COLD = 0-49

Return ONLY valid JSON:
{
  "carriers": ["carriers found or 'Unknown'"],
  "captive": boolean,
  "years": number or null,
  "score": number 0-100,
  "flag": "hot" or "warm" or "cold",
  "notes": "2-3 sentences using SPECIFIC data points from this listing — name, review count, rating, carriers found"
}`

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
      name,
      type: type || 'Insurance Agency',
      phone: raw.phone || '',
      address: raw.address || '',
      rating,
      reviews,
      website: raw.website || null,
      carriers: parsed.carriers || ['Unknown'],
      captive: parsed.captive || false,
      years: parsed.years || null,
      score: Math.min(100, Math.max(0, parsed.score || 50)),
      flag: parsed.flag || 'warm',
      notes: parsed.notes || 'No analysis available.',
    }
  } catch {
    const nameLower = name.toLowerCase()
    const isMedicareNamed = nameLower.includes('medicare') || nameLower.includes('senior') || nameLower.includes('health')
    const isCaptive = ['bankers life', 'state farm', 'farmers', 'allstate'].some(c => nameLower.includes(c))
    let score = 45
    if (isCaptive) score = 25
    else if (isMedicareNamed && reviews >= 100) score = 70
    else if (isMedicareNamed && reviews >= 50) score = 62
    else if (isMedicareNamed) score = 55
    else if (reviews >= 100) score = 60
    else if (hasWebsite) score = 52

    return {
      name,
      type: type || 'Insurance Agency',
      phone: raw.phone || '',
      address: raw.address || '',
      rating,
      reviews,
      website: raw.website || null,
      carriers: ['Unknown'],
      captive: isCaptive,
      years: null,
      score,
      flag: score >= 75 ? 'hot' : score >= 50 ? 'warm' : 'cold',
      notes: 'AI scoring unavailable. Fallback score based on name and review signals.',
    }
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { success, limit, reset } = await ratelimit.limit(userId)
  if (!success) {
    return NextResponse.json({
      error: `Rate limit exceeded. You have ${limit} searches per hour. Resets at ${new Date(reset).toLocaleTimeString()}.`
    }, { status: 429 })
  }

  try {
    const { city, state } = await req.json()
    if (!city || !state) return NextResponse.json({ error: 'City and state required' }, { status: 400 })

    const rawAgents = await fetchAgentsFromSerp(city, state)

    if (!rawAgents.length) {
      return NextResponse.json({ agents: [] })
    }

    const top = rawAgents.slice(0, 10)

    const scored = await Promise.all(
      top.map(async (raw) => {
        const websiteText = raw.website ? await fetchWebsiteText(raw.website) : ''
        return scoreAgent(raw, websiteText)
      })
    )

    const sorted = scored.sort((a, b) => b.score - a.score)

    return NextResponse.json({ agents: sorted })
  } catch (err: any) {
    console.error('Search error:', err)
    return NextResponse.json({ error: err.message || 'Search failed' }, { status: 500 })
  }
}
