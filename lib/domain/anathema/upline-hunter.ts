// ─── lib/domain/anathema/upline-hunter.ts ────────────────────────────────────
// When the network scanner and chain resolver both come up empty or
// low-confidence, this runs against Facebook post content and SERP snippets
// using Claude to hunt for FMO/IMO entities that aren't in the network map.
//
// Returns a detected upline name + evidence quote + source URL, or null.
// This is what catches Compass Health Consultants from a Punta Cana trip post.

import Anthropic from '@anthropic-ai/sdk'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type UnresolvedUpline = {
  name: string        // e.g. "Compass Health Consultants"
  evidence: string    // e.g. "CHC's Annual Sales Trip in Punta Cana"
  sourceUrl: string
  confidence: 'HIGH' | 'MED'
}

// ─── HUNTER ───────────────────────────────────────────────────────────────────

export async function huntUnresolvedUpline(
  agentName: string,
  facebookPostText: string,
  facebookProfileUrl: string,
  serpSnippets: string[],
): Promise<UnresolvedUpline | null> {
  const allText = [facebookPostText, ...serpSnippets].filter(Boolean).join('\n\n')
  if (!allText.trim()) return null

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are analyzing public web content about an insurance agent named "${agentName}" to find their upline FMO or IMO organization.

CONTENT TO ANALYZE:
${allText.slice(0, 3000)}

Look for any of these signals that would identify an upline FMO/IMO:
- Sales trip or incentive trip announcements ("sales trip to X sponsored by Y", "Y's annual trip")
- Logo mentions or company names on swag/merchandise
- "Appointed through", "contracted with", "writing under", "my upline", "my FMO", "my IMO"
- Leaderboard or award mentions from a specific company
- Company-branded content they are posting/sharing

If you find a clear FMO/IMO organization name, respond with ONLY this JSON:
{
  "found": true,
  "name": "exact organization name",
  "evidence": "the exact quote or context that reveals this",
  "confidence": "HIGH" or "MED"
}

If nothing clear found, respond with ONLY:
{ "found": false }

Do NOT guess. Do NOT include generic insurance companies (Humana, Aetna, UnitedHealth). Only name an FMO/IMO upline organization you can clearly identify from the text.`,
      }],
    })

    const raw = ((res.content[0] as any).text || '').replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(raw)
    if (!parsed.found || !parsed.name) return null

    return {
      name: parsed.name,
      evidence: parsed.evidence || '',
      sourceUrl: facebookProfileUrl || '',
      confidence: parsed.confidence === 'HIGH' ? 'HIGH' : 'MED',
    }
  } catch {
    return null
  }
}
