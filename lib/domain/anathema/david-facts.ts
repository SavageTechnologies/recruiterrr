// ─── lib/domain/anathema/david-facts.ts ──────────────────────────────────────
// Extracts personal facts from the same raw data ANATHEMA already collected.
// Runs as a parallel Claude call — zero additional SERP queries, zero cost
// beyond one Haiku call per scan.
//
// CRITICAL: This function must NEVER influence ANATHEMA's tree prediction,
// confidence score, or signals. It reads from the same data, writes to a
// separate field (david_facts on anathema_specimens), and sits dormant until
// DAVID is ready to query it.
//
// When DAVID launches, query david_facts across all specimens to get a dataset
// that was being built in parallel since day one — no re-scanning required.

import Anthropic from '@anthropic-ai/sdk'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type DavidFact = {
  source: 'FACEBOOK' | 'YOUTUBE' | 'GOOGLE_REVIEW' | 'SERP' | 'WEBSITE' | 'LINKEDIN' | 'OTHER'
  fact: string          // the human-readable personal fact
  raw_quote: string     // exact text from the source that surfaced this fact
  usability: 'HIGH' | 'MED' | 'LOW'
  // HIGH = would make a recruiter's outreach feel like they did their homework
  // MED  = interesting context, usable in the right message
  // LOW  = logged for completeness, probably not worth leading with
}

export type DavidFactsResult = {
  facts: DavidFact[]
  extracted_at: string
  scan_sources_used: string[]   // which sources had content to analyze
}

// ─── INPUT ────────────────────────────────────────────────────────────────────
// Everything ANATHEMA already collected — passed in, not re-fetched.

export type DavidFactsInput = {
  agentName: string
  serpSnippets: Array<{ title: string; url: string; snippet: string }>   // from SERP passes 1+2
  facebookAbout: string | null
  facebookPostText: string | null
  facebookProfileUrl: string | null
  agentWebsite: string | null
  agentNotes: string | null
  agentAbout: string | null
}

// ─── EXTRACTOR ────────────────────────────────────────────────────────────────

export async function extractDavidFacts(
  input: DavidFactsInput
): Promise<DavidFactsResult | null> {
  // Assemble all available text — labelled by source so Claude can assign
  // the right source field to each fact it finds.
  const sourcesUsed: string[] = []
  const sections: string[] = []

  if (input.facebookAbout || input.facebookPostText) {
    const fbText = [input.facebookAbout, input.facebookPostText].filter(Boolean).join('\n')
    if (fbText.trim()) {
      sections.push(`=== FACEBOOK (${input.facebookProfileUrl || 'profile'}) ===\n${fbText.slice(0, 1500)}`)
      sourcesUsed.push('FACEBOOK')
    }
  }

  const serpText = input.serpSnippets
    .filter(r => r.snippet?.trim())
    .map(r => `[${r.title}] (${r.url})\n${r.snippet}`)
    .join('\n\n')
  if (serpText.trim()) {
    sections.push(`=== SERP RESULTS ===\n${serpText.slice(0, 2000)}`)
    sourcesUsed.push('SERP')
  }

  if (input.agentNotes || input.agentAbout) {
    const profileText = [input.agentNotes, input.agentAbout].filter(Boolean).join('\n')
    if (profileText.trim()) {
      sections.push(`=== AGENT WEBSITE / PROFILE ===\n${profileText.slice(0, 800)}`)
      sourcesUsed.push('WEBSITE')
    }
  }

  if (sections.length === 0) return null

  const allContent = sections.join('\n\n')

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `You are extracting personal facts about an insurance agent named "${input.agentName}" from public web content.

These facts will be stored for future use in personalized recruiter outreach — not analyzed now.
Your job is ONLY to find and extract facts. Do not evaluate or score the agent.

CONTENT TO ANALYZE:
${allContent}

Extract personal facts that would make a recruiter's outreach feel like they actually did their homework on this specific agent. Look for:

- YouTube video titles they published (exact title if visible)
- Blog posts or articles they wrote (exact title)
- Public social media posts or comments that reveal personality, opinions, or affiliations
- Press mentions, awards, local features, chamber recognitions
- Specific language from Google reviews that reveals how clients describe them
- Conference appearances, speaking slots, event attendances
- Any other public facts specific to this individual (not generic insurance info)

DO NOT extract:
- Generic insurance industry information
- Their carrier names or product lines (ANATHEMA handles this)
- Their predicted tree/upline (ANATHEMA handles this)
- Anything that requires inference — only extract explicit stated facts

For each fact found, respond with ONLY this JSON array (no markdown, no preamble):
[
  {
    "source": "FACEBOOK" | "YOUTUBE" | "GOOGLE_REVIEW" | "SERP" | "WEBSITE" | "LINKEDIN" | "OTHER",
    "fact": "plain English description of the fact",
    "raw_quote": "the exact text from the source that reveals this fact (under 150 chars)",
    "usability": "HIGH" | "MED" | "LOW"
  }
]

Usability guide:
- HIGH: Would make an agent stop and wonder how you found it (specific video title, Facebook comment, press mention, review quote)
- MED: Useful context, could support a message (general website claim, vague social activity)
- LOW: Worth logging but probably not worth leading with

If no personal facts found, return: []

Return ONLY the JSON array.`,
      }],
    })

    const raw = ((res.content[0] as any).text || '').replace(/```json|```/g, '').trim()
    const parsed: DavidFact[] = JSON.parse(raw)

    if (!Array.isArray(parsed)) return null
    if (parsed.length === 0) return { facts: [], extracted_at: new Date().toISOString(), scan_sources_used: sourcesUsed }

    // Validate shape — don't let malformed Claude output poison the DB
    const valid = parsed.filter(f =>
      typeof f.fact === 'string' &&
      typeof f.raw_quote === 'string' &&
      ['FACEBOOK', 'YOUTUBE', 'GOOGLE_REVIEW', 'SERP', 'WEBSITE', 'LINKEDIN', 'OTHER'].includes(f.source) &&
      ['HIGH', 'MED', 'LOW'].includes(f.usability)
    )

    return {
      facts: valid,
      extracted_at: new Date().toISOString(),
      scan_sources_used: sourcesUsed,
    }
  } catch {
    return null
  }
}
