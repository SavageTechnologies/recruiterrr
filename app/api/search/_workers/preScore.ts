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

import { MODE_CONFIG, CAPTIVE_BRANDS } from './config'
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

  // ── Captive check: brand name OR captive domain in website URL ──────────────
  // Some captive agents (e.g. HealthMarkets) brand personally but their website
  // is a subdomain/path of the captive's domain — catch those too.
  const CAPTIVE_DOMAINS = [
    // P&C / Multi-line
    'statefarm.com', 'allstate.com', 'farmers.com', 'amfam.com', 'nationwide.com',
    'libertymutual.com', 'travelers.com', 'usaa.com', 'erieinsurance.com',
    'auto-owners.com', 'shelterinsurance.com', 'countryfinancial.com',
    'foremost.com', 'bristolwest.com', 'sentry.com', 'pemco.com',
    'pekininsurance.com', 'grinnellmutual.com',
    'geico.com', 'progressive.com', 'elephantinsurance.com',
    // AAA
    'aaa.com', 'csaa.com', 'autoclubgroup.aaa.com',
    // National health carriers
    'uhc.com', 'unitedhealthcare.com', 'humana.com', 'aetna.com',
    'cigna.com', 'molinahealthcare.com', 'kp.org', 'kaiserpermanente.org',
    'hioscar.com', 'brighthealthcare.com', 'cloverhealth.com',
    'alignmenthealthcare.com', 'devoted.com', 'zinghealth.com',
    // Centene
    'ambetterhealth.com', 'wellcare.com', 'health.net', 'centene.com',
    // BCBS
    'bcbs.com', 'anthem.com', 'floridablue.com', 'premera.com', 'regence.com',
    'blueshieldca.com', 'excellusbcbs.com', 'empireblue.com', 'horizonblue.com',
    'ibx.com', 'highmarkbcbs.com', 'carefirst.com', 'wellmark.com',
    'hmsa.com', 'selecthealth.org', 'deancare.com',
    // Life & annuity captives
    'newyorklife.com', 'northwesternmutual.com', 'massmutual.com',
    'prudential.com', 'metlife.com', 'guardianlife.com', 'pacificlife.com',
    'principal.com', 'lfg.com',
    // Supplemental / worksite / senior
    'aflac.com', 'coloniallife.com', 'unum.com', 'americanincome.com',
    'libertynational.com', 'familyheritagelife.com', 'unitedamerican.com',
    'globelife.com', 'bankerslife.com', 'washingtonnational.com',
    'americanfidelity.com', 'sunlife.com', 'voya.com',
    'mutualofomaha.com', 'trustage.com', 'cunamutual.com',
    'transamerica.com', 'worldfinancialgroup.com', 'primerica.com',
    'combinedinsurance.com', 'healthmarkets.com', 'bankerlife.com',
    // Wirehouses / broker-dealers
    'edwardjones.com', 'ameriprise.com', 'raymondjames.com',
    'ml.com', 'morganstanley.com', 'wellsfargoadvisors.com',
    'ubs.com', 'fidelity.com', 'vanguard.com', 'schwab.com',
    'tdameritrade.com', 'lpl.com', 'cetera.com', 'commonwealth.com',
  ]
  const websiteUrl = (raw.website || '').toLowerCase()
  const captiveByDomain = CAPTIVE_DOMAINS.some(domain => websiteUrl.includes(domain))
  const captiveByName = CAPTIVE_BRANDS.some(brand => {
    const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`\\b${escaped}\\b`, 'i').test(raw.title || '')
  })
  const captive = captiveByName || captiveByDomain
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
