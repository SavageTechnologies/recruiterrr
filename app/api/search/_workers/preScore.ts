// ─── preScore.ts ──────────────────────────────────────────────────────────────
// Deterministic pre-scoring — no LLM, no network calls.
// Edit this file to tune scoring bucket weights and thresholds.
//
// Score breakdown (max 100):
//   Bucket 1 — Volume (reviews):     0–35 pts
//   Bucket 2 — Independence signals: 0–25 pts
//   Bucket 3 — Specialty/relevance:  0–25 pts
//   Bucket 4 — Presence:             0–15 pts
//
// Captive is ONLY derived from brand name matching — never from score.

import { MODE_CONFIG } from './config'
import type { PreScoreResult } from './types'

export function preScore(raw: any, mode: string): PreScoreResult {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.medicare
  const name = (raw.title || '').toLowerCase()
  const type = (raw.type || '').toLowerCase()
  const description = (raw.description || '').toLowerCase()
  const extensions = ((raw.extensions || []) as string[]).join(' ').toLowerCase()
  const allText = `${name} ${type} ${description} ${extensions}`
  const reviews = raw.reviews || 0
  const hasWebsite = !!raw.website

  // ── Captive check: brand name match only, never score-derived ──────────────
  const captive = cfg.captiveBrands.some(brand => {
    const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`\\b${escaped}\\b`, 'i').test(raw.title || '')
  })
  if (captive) return { score: 20, captive: true }

  // ── Bucket 1: Volume signal (review count) — 0 to 35 pts ─────────────────
  let volumeScore = 0
  if (reviews >= 200)      volumeScore = 35
  else if (reviews >= 100) volumeScore = 28
  else if (reviews >= 50)  volumeScore = 22
  else if (reviews >= 20)  volumeScore = 16
  else if (reviews >= 5)   volumeScore = 10
  else                     volumeScore = 5

  // ── Bucket 2: Independence signal — 0 to 25 pts ──────────────────────────
  let independenceScore = 15 // default: assume independent
  if (cfg.independenceKeywords.some(kw => allText.includes(kw))) {
    independenceScore = 25   // explicit independence signal
  }
  if (cfg.negativeKeywords?.some(kw => allText.includes(kw))) {
    independenceScore = 5    // explicit negative/off-mode signal
  }

  // ── Bucket 3: Specialty/relevance signal — 0 to 25 pts ───────────────────
  const specialtyMatches = cfg.specialtyKeywords.filter(kw => allText.includes(kw)).length
  const specialtyScore = Math.min(25, specialtyMatches * 8)

  // ── Bucket 4: Presence signal — 0 to 15 pts ──────────────────────────────
  let presenceScore = 0
  if (hasWebsite)        presenceScore += 8
  if (raw.rating >= 4.0) presenceScore += 4
  if (raw.phone)         presenceScore += 3

  const total = volumeScore + independenceScore + specialtyScore + presenceScore
  return { score: Math.min(100, total), captive: false }
}
