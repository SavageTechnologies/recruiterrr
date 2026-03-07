// ─── sonnetScore.ts ───────────────────────────────────────────────────────────
// Calls Sonnet with the crawled website intel and an anchor score.
// Sonnet's job: write the recruiter snippet + adjust score ±15 max.
// It does NOT produce a score from scratch — it refines the preScore anchor.

import { getAnthropicClient } from '@/lib/ai'
import { MODE_CONFIG } from './config'
import type { WebsiteIntel } from './types'

export async function sonnetScore(
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
