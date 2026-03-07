// ─── lib/domain/anathema/david-facts.ts ──────────────────────────────────────
// Extracts actionable personal facts from public business page content.
// Runs as a parallel Claude call — zero additional SERP queries.
//
// PHILOSOPHY: Apify gives you data. DAVID gives you judgment.
// Anyone can scrape a Facebook page. The value here is knowing which facts
// would make a recruiter sound like they did their homework — vs. which facts
// make them sound like a bot that read a Wikipedia page about Medicare.
//
// CRITICAL: This function must NEVER influence ANATHEMA's tree prediction,
// confidence score, or signals. It reads from the same data, writes to a
// separate field (david_facts on anathema_specimens), and sits dormant until
// DAVID is ready to query it.

import { getAnthropicClient } from '@/lib/ai'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type DavidFact = {
  source: 'FACEBOOK' | 'YOUTUBE' | 'GOOGLE_REVIEW' | 'SERP' | 'WEBSITE' | 'LINKEDIN' | 'OTHER'
  fact: string          // plain English — what a recruiter would actually say
  raw_quote: string     // exact text or OCR from the source (under 200 chars)
  usability: 'HIGH' | 'MED' | 'LOW'
  recency: 'RECENT' | 'DATED' | 'UNKNOWN'
  // HIGH    = would make a producer stop and wonder how you found it
  // MED     = good context, usable to support a message but not lead with
  // LOW     = logged for completeness, not worth using in outreach
  // RECENT  = happened in last ~90 days, can reference directly
  // DATED   = 90 days to 12 months, use carefully
  // UNKNOWN = no timestamp available
}

export type DavidFactsResult = {
  facts: DavidFact[]
  extracted_at: string
  scan_sources_used: string[]
}

// ─── INPUT ────────────────────────────────────────────────────────────────────

export type DavidFactsInput = {
  agentName: string
  serpSnippets: Array<{ title: string; url: string; snippet: string }>
  facebookAbout: string | null
  facebookPostText: string | null
  facebookProfileUrl: string | null
  agentWebsite: string | null
  agentNotes: string | null
  agentAbout: string | null
  apifyFacebookPostCount?: number
  apifyYouTubeVideoCount?: number
  scanDate?: string  // ISO date — for relative recency judgment
}

// ─── EXTRACTOR ────────────────────────────────────────────────────────────────

export async function extractDavidFacts(
  input: DavidFactsInput
): Promise<DavidFactsResult | null> {
  const sourcesUsed: string[] = []
  const sections: string[] = []

  const scanDate = input.scanDate || new Date().toISOString()

  if (input.facebookAbout || input.facebookPostText) {
    const fbText = [input.facebookAbout, input.facebookPostText].filter(Boolean).join('\n')
    if (fbText.trim()) {
      sections.push(`=== FACEBOOK (${input.facebookProfileUrl || 'profile'}) ===\n${fbText}`)
      sourcesUsed.push('FACEBOOK')
    }
  }

  const serpText = input.serpSnippets
    .filter(r => r.snippet?.trim())
    .map(r => `[${r.title}] (${r.url})\n${r.snippet}`)
    .join('\n\n')
  if (serpText.trim()) {
    sections.push(`=== SERP / APIFY CONTENT ===\n${serpText}`)
    sourcesUsed.push('SERP')
  }

  if (input.agentNotes || input.agentAbout) {
    const profileText = [input.agentNotes, input.agentAbout].filter(Boolean).join('\n')
    if (profileText.trim()) {
      sections.push(`=== AGENT WEBSITE / PROFILE ===\n${profileText}`)
      sourcesUsed.push('WEBSITE')
    }
  }

  if (input.apifyFacebookPostCount && input.apifyFacebookPostCount > 0) {
    sourcesUsed.push(`APIFY_FACEBOOK:${input.apifyFacebookPostCount}`)
  }
  if (input.apifyYouTubeVideoCount && input.apifyYouTubeVideoCount > 0) {
    sourcesUsed.push(`APIFY_YOUTUBE:${input.apifyYouTubeVideoCount}`)
  }

  if (sections.length === 0) return null

  const allContent = sections.join('\n\n')

  try {
    const anthropic = getAnthropicClient()
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `You are DAVID — a recruiting intelligence system that extracts personal facts from insurance agents' public business page content.

Today's date: ${scanDate}
Agent name: "${input.agentName}"

YOUR ONLY JOB: Find facts that would make a recruiter sound like they genuinely did their homework on this specific person — not like a bot that scraped their page.

CONTENT TO ANALYZE:
${allContent}

━━━ WHAT TO KEEP ━━━

KEEP facts that are personal, specific, and give a recruiter a real conversation opener:
- Community events they hosted, attended, or sponsored RECENTLY (last 3 months especially)
- Awards, recognitions, or local features (Best of [City], chamber recognition, press mention)
- YouTube videos they published on NICHE topics (veterans benefits, specific compliance issues) — NOT generic Medicare explainers everyone posts
- Event photos that reveal personality — Christmas party, golf tournament, team lunch, charity work
- A client review with SPECIFIC memorable language ("walked me through every option" — not just "great service")
- Something personal from their bio that is unusual — military background, specific community tie, bilingual, unusual career path
- Recent accomplishments — hired staff, opened second location, earned a new credential
- Anything that makes them look community-embedded (YMCA partnership, school sponsorship, local nonprofit)

━━━ WHAT TO THROW AWAY ━━━

DISCARD anything that is:
- Generic insurance education content — Medicare Advantage explainers, ACA enrollment reminders, prescription tip posts, "5 reasons you need health insurance." This is their JOB. Everyone posts this. It says nothing personal about them.
- Regulatory boilerplate — disclaimer language, HIPAA notices, "not affiliated with government agency" footers
- Seasonal/holiday posts with no personal hook — generic "Happy New Year" with a stock photo
- Old news — hired someone 2+ years ago, attended a conference 18+ months ago. Stale hooks are WORSE than no hook.
- Re-shares of someone else's content with no original commentary
- Generic business claims — "I provide personalized service," "I work with multiple carriers," "call me for a free quote"
- Anything that could describe ANY insurance agent in ANY market

━━━ RECENCY RULES ━━━

Posts include timestamps like [posted: 2025-12-15] or [published: Jan 2025].
- RECENT = within last 90 days of today (${scanDate})
- DATED = 90 days to 12 months old — usable with care
- UNKNOWN = no timestamp available
- Anything over 12 months old: discard unless it is a permanent fact (award they still display, bio detail)

━━━ IMAGE/OCR TEXT ━━━

Content marked [image text: ...] is OCR-extracted from photos they posted.
This is gold — awards plaques, event banners, recognition certificates, conference badges.
Treat OCR text as high-signal if it reveals an award, event, or recognition.
Ignore OCR text that is just generic insurance marketing graphics.

━━━ OUTPUT FORMAT ━━━

Return ONLY a JSON array. No markdown, no preamble, no explanation.

[
  {
    "source": "FACEBOOK" | "YOUTUBE" | "GOOGLE_REVIEW" | "SERP" | "WEBSITE" | "LINKEDIN" | "OTHER",
    "fact": "plain English — what a recruiter would actually say: 'Saw you just got the Best Agency recognition in Moore'",
    "raw_quote": "exact text or OCR that surfaced this (under 200 chars)",
    "usability": "HIGH" | "MED" | "LOW",
    "recency": "RECENT" | "DATED" | "UNKNOWN"
  }
]

If nothing passes the filter, return: []

Return ONLY the JSON array.`,
      }],
    })

    const raw = ((res.content[0] as any).text || '').replace(/```json|```/g, '').trim()
    const parsed: DavidFact[] = JSON.parse(raw)

    if (!Array.isArray(parsed)) return null
    if (parsed.length === 0) return { facts: [], extracted_at: new Date().toISOString(), scan_sources_used: sourcesUsed }

    const valid = parsed.filter(f =>
      typeof f.fact === 'string' &&
      typeof f.raw_quote === 'string' &&
      ['FACEBOOK', 'YOUTUBE', 'GOOGLE_REVIEW', 'SERP', 'WEBSITE', 'LINKEDIN', 'OTHER'].includes(f.source) &&
      ['HIGH', 'MED', 'LOW'].includes(f.usability) &&
      ['RECENT', 'DATED', 'UNKNOWN'].includes(f.recency)
    )

    return {
      facts: valid,
      extracted_at: new Date().toISOString(),
      scan_sources_used: sourcesUsed,
    }
  } catch (err) {
    console.error('[extractDavidFacts] failed:', err instanceof Error ? err.message : err)
    return null
  }
}
