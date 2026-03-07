// ─── enrichAgent.ts ───────────────────────────────────────────────────────────
// Main enrichment pipeline for a single agent.
// Orchestrates: preScore → crawl → enrichment deltas → Sonnet scoring.
// Fast-paths cold agents (captive or <40) before any network calls.
//
// Flag logic:
//   captive:true   → cold, "Captive brand — not recruitable."
//   wrongLine:true → cold, "Wrong line of business — confirmed [X], not [mode]."
//   score < 40     → cold, low signal (no penalty for unknown)
//   otherwise      → hot/warm/cold by score threshold

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
      carriers: ['Unknown'], captive: isCaptive, wrongLine: false, years: null,
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
  let enrichmentDelta = 0
  if (intel.fullText.length > 200) enrichmentDelta += 3
  if (intel.email)                 enrichmentDelta += 2
  if (intel.socialLinks.length)    enrichmentDelta += 2
  if (intel.youtubeLink)           enrichmentDelta += 5

  const anchorScore = Math.min(100, ps + enrichmentDelta)

  // ── SONNET: writes the recruiter snippet + adjusts score ±15 ─────────────
  const sonnetResult = await sonnetScore(raw, intel, anchorScore, mode)

  // ── SONNET-CONFIRMED CAPTIVE: escaped preScore brand check but caught by crawl ──
  // Treat identically to preScore captive — not recruitable, hard cold, no score.
  if (sonnetResult.captive) {
    return {
      name: raw.title || 'Unknown',
      type: raw.type || cfg.typeFallback,
      phone: raw.phone || '', address: raw.address || '',
      rating: raw.rating || 0, reviews: raw.reviews || 0,
      website: raw.website || null,
      carriers: sonnetResult.carriers,
      captive: true,
      wrongLine: false,
      years: sonnetResult.years,
      score: 20,
      flag: 'cold',
      notes: 'Captive brand — not recruitable.',
      about: sonnetResult.about,
      contact_email: sonnetResult.contact_email || intel.email || null,
      social_links: intel.socialLinks,
      _preScore: ps,
      _enrichmentDelta: enrichmentDelta,
      _sonnetDelta: sonnetResult.scoreDelta,
      _youtubeLink: intel.youtubeLink,
    }
  }

  // ── WRONG LINE: confirmed mismatch → hard cold, bypass score threshold ────
  // This is not a score penalty — it's a known fact. Treat it the same as captive.
  if (sonnetResult.wrongLine) {
    return {
      name: raw.title || 'Unknown',
      type: raw.type || cfg.typeFallback,
      phone: raw.phone || '', address: raw.address || '',
      rating: raw.rating || 0, reviews: raw.reviews || 0,
      website: raw.website || null,
      carriers: sonnetResult.carriers,
      captive: sonnetResult.captive,
      wrongLine: true,
      years: sonnetResult.years,
      score: Math.min(39, anchorScore), // cap below warm threshold for consistency
      flag: 'cold',
      notes: sonnetResult.notes,
      about: sonnetResult.about,
      contact_email: sonnetResult.contact_email || intel.email || null,
      social_links: intel.socialLinks,
      _preScore: ps,
      _enrichmentDelta: enrichmentDelta,
      _sonnetDelta: sonnetResult.scoreDelta,
      _youtubeLink: intel.youtubeLink,
    }
  }

  // ── NORMAL PATH: score determines flag ───────────────────────────────────
  const finalScore = Math.min(100, Math.max(0, anchorScore + sonnetResult.scoreDelta))

  return {
    name: raw.title || 'Unknown',
    type: raw.type || cfg.typeFallback,
    phone: raw.phone || '', address: raw.address || '',
    rating: raw.rating || 0, reviews: raw.reviews || 0,
    website: raw.website || null,
    carriers: sonnetResult.carriers,
    captive: sonnetResult.captive,
    wrongLine: false,
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
