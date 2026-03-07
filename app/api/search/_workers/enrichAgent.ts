// ─── enrichAgent.ts ───────────────────────────────────────────────────────────
// Main enrichment pipeline for a single agent.
// Orchestrates: preScore → crawl → enrichment deltas → Sonnet scoring.
// Fast-paths cold agents (captive or <40) before any network calls.

import { MODE_CONFIG } from './config'
import { preScore } from './preScore'
import { crawlWebsite } from './crawl'
import { sonnetScore } from './sonnetScore'
import type { AgentResult } from './types'

export async function enrichAgent(
  raw: any,
  mode: string,
): Promise<Omit<AgentResult, 'hiring' | 'hiring_roles' | 'youtube_channel' | 'youtube_subscribers' | 'youtube_video_count'> & {
  _youtubeLink: string | null
}> {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.medicare
  const { score: ps, captive: isCaptive } = preScore(raw, mode)

  // ── FAST PATH: captive or very low signal — no crawl, no LLM ────────────
  if (ps < 40) {
    return {
      name: raw.title || 'Unknown',
      type: raw.type || cfg.typeFallback,
      phone: raw.phone || '', address: raw.address || '',
      rating: raw.rating || 0, reviews: raw.reviews || 0,
      website: raw.website || null,
      carriers: ['Unknown'], captive: isCaptive, years: null,
      score: ps, flag: 'cold',
      notes: isCaptive ? 'Captive brand — not recruitable.' : 'Low signal — insufficient data to qualify.',
      about: null, contact_email: null, social_links: [],
      _preScore: ps, _enrichmentDelta: 0, _sonnetDelta: 0,
      _youtubeLink: null,
    }
  }

  // ── CRAWL WEBSITE ─────────────────────────────────────────────────────────
  const intel = raw.website
    ? await crawlWebsite(raw.website)
    : { fullText: '', email: null, socialLinks: [], youtubeLink: null }

  // ── ENRICHMENT DELTAS ─────────────────────────────────────────────────────
  // Applied to preScore BEFORE Sonnet sees it — Sonnet anchors on an already-enriched score.
  // Jobs/YouTube bonuses are NOT here — they run in backgroundEnrich.ts after response.
  let enrichmentDelta = 0
  if (intel.fullText.length > 200) enrichmentDelta += 3  // Real website content found
  if (intel.email)                 enrichmentDelta += 2  // Contact email found
  if (intel.socialLinks.length)    enrichmentDelta += 2  // Social presence confirmed
  if (intel.youtubeLink)           enrichmentDelta += 5  // YouTube found on site

  const anchorScore = Math.min(100, ps + enrichmentDelta)

  // ── SONNET: writes the recruiter snippet + adjusts score ±15 ─────────────
  // Only cold agents (<40) skip this — everything else gets the writeup.
  const sonnetResult = await sonnetScore(raw, intel, anchorScore, mode)
  const finalScore = Math.min(100, Math.max(0, anchorScore + sonnetResult.scoreDelta))

  return {
    name: raw.title || 'Unknown',
    type: raw.type || cfg.typeFallback,
    phone: raw.phone || '', address: raw.address || '',
    rating: raw.rating || 0, reviews: raw.reviews || 0,
    website: raw.website || null,
    carriers: sonnetResult.carriers,
    captive: sonnetResult.captive,
    years: sonnetResult.years,
    score: finalScore,
    flag: finalScore >= 75 ? 'hot' : finalScore >= 50 ? 'warm' : 'cold',
    notes: sonnetResult.notes || 'Scored from listing and website signals.',
    about: sonnetResult.about,
    contact_email: sonnetResult.contact_email || intel.email || null,
    social_links: intel.socialLinks,
    _preScore: ps,
    _enrichmentDelta: enrichmentDelta,
    _sonnetDelta: sonnetResult.scoreDelta,
    _youtubeLink: intel.youtubeLink,
  }
}
