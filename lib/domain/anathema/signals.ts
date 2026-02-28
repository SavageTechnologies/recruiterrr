// ─── lib/domain/anathema/signals.ts ──────────────────────────────────────────
// Network signal index — built once at module load from networks.ts.
// Covers all 289 partners + aliases. Never hardcode partner names here.
// Add new partners to networks.ts instead.

import { INTEGRITY_PARTNERS, AMERILIFE_PARTNERS, SMS_PARTNERS, type NetworkPartner } from '@/lib/networks'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type NetworkSignal = {
  phrase: string
  tree: 'integrity' | 'amerilife' | 'sms'
  partner: NetworkPartner | null  // null = parent brand signal, not a specific partner
  weight: number
  isAlias: boolean
}

export type NetworkMatch = {
  signal: NetworkSignal
  proofUrl: string
  proofTitle: string
  proofSnippet: string
  matchedPhrase: string
}

// ─── PARENT BRAND SIGNALS ─────────────────────────────────────────────────────
// Unambiguous brand phrases that identify the tree but not a specific partner.
// These are exempt from the co-mention requirement — explicit brand language
// doesn't need the agent's name to be meaningful.

const PARENT_BRAND_SIGNALS: { phrase: string; tree: 'integrity' | 'amerilife' | 'sms' }[] = [
  { phrase: 'integrity marketing group', tree: 'integrity' },
  { phrase: 'integrity marketing',       tree: 'integrity' },
  { phrase: 'integrity partner',         tree: 'integrity' },
  { phrase: 'proud integrity partner',   tree: 'integrity' },
  { phrase: 'integrityconnect',          tree: 'integrity' },
  { phrase: 'integrity connect',         tree: 'integrity' },
  { phrase: 'medicarecenter',            tree: 'integrity' },
  { phrase: 'medicare center',           tree: 'integrity' },
  { phrase: 'integrity.com',             tree: 'integrity' },
  { phrase: 'ffl agent',                 tree: 'integrity' },
  { phrase: 'amerilife',                 tree: 'amerilife' },
  { phrase: 'amerilife affiliate',       tree: 'amerilife' },
  { phrase: 'amerilife partner',         tree: 'amerilife' },
  { phrase: 'amerilife.com',             tree: 'amerilife' },
  { phrase: 'senior market sales',       tree: 'sms' },
  { phrase: 'sms partner',               tree: 'sms' },
  { phrase: 'rethinking retirement',     tree: 'sms' },
  { phrase: 'seniormarketsales.com',     tree: 'sms' },
  { phrase: 'sms family',               tree: 'sms' },
  { phrase: 'sms affiliate',            tree: 'sms' },
]

// ─── SMS CARRIER COMBO ────────────────────────────────────────────────────────
// Still the only carrier signal worth using — the Mutual of Omaha + Medico
// combo is an SMS exclusive fingerprint.

const SMS_EXCLUSIVE_CARRIERS = ['mutual of omaha', 'medico', 'gpm life']

export function scoreSMSCarriers(carriers: string[]): { sms: number; signals: string[] } {
  const lower = carriers.map(c => c.toLowerCase())
  const smsMatches = lower.filter(c => SMS_EXCLUSIVE_CARRIERS.some(k => c.includes(k) || k.includes(c)))
  if (smsMatches.length >= 2) return { sms: 35, signals: [`Carrier combo: ${smsMatches.join(' + ')} — SMS exclusive fingerprint`] }
  if (smsMatches.length === 1) return { sms: 15, signals: [`Carrier: ${smsMatches[0]} — weak SMS signal`] }
  return { sms: 0, signals: [] }
}

// ─── INDEX BUILDER ────────────────────────────────────────────────────────────

function buildNetworkSignalIndex(): NetworkSignal[] {
  const signals: NetworkSignal[] = []
  const seen = new Set<string>()

  // Parent brand signals first — highest priority
  for (const b of PARENT_BRAND_SIGNALS) {
    if (!seen.has(b.phrase)) {
      signals.push({ phrase: b.phrase, tree: b.tree, partner: null, weight: 40, isAlias: false })
      seen.add(b.phrase)
    }
  }

  // Every partner: name + website domain + aliases
  const allPartners = [...INTEGRITY_PARTNERS, ...AMERILIFE_PARTNERS, ...SMS_PARTNERS]
  for (const partner of allPartners) {
    const nameLower = partner.name.toLowerCase()
    if (nameLower.length >= 4 && !seen.has(nameLower)) {
      signals.push({ phrase: nameLower, tree: partner.tree, partner, weight: 38, isAlias: false })
      seen.add(nameLower)
    }
    // Domain match is strongest — it's unambiguous
    const domain = partner.website.toLowerCase().replace('www.', '')
    if (domain && !seen.has(domain)) {
      signals.push({ phrase: domain, tree: partner.tree, partner, weight: 45, isAlias: false })
      seen.add(domain)
    }
    for (const alias of partner.aliases || []) {
      const aliasLower = alias.toLowerCase()
      if (aliasLower.length >= 4 && !seen.has(aliasLower)) {
        signals.push({ phrase: aliasLower, tree: partner.tree, partner, weight: aliasLower.length <= 4 ? 25 : 35, isAlias: true })
        seen.add(aliasLower)
      }
    }
  }
  return signals
}

// Built once at module load — not rebuilt per request
export const NETWORK_SIGNALS = buildNetworkSignalIndex()

// ─── SCANNER ──────────────────────────────────────────────────────────────────
// Scans a single SERP result against ALL signals simultaneously.
// Returns every match with the proof URL attached.

export function scanResultAgainstNetwork(
  title: string,
  snippet: string,
  url: string,
  agentName?: string
): NetworkMatch[] {
  const haystack = `${title} ${snippet} ${url}`.toLowerCase()
  const agentLower = agentName?.toLowerCase() || ''
  const matches: NetworkMatch[] = []
  const firedPhrases = new Set<string>()

  for (const signal of NETWORK_SIGNALS) {
    if (firedPhrases.has(signal.phrase)) continue
    if (!haystack.includes(signal.phrase)) continue

    // Co-mention requirement: for partner signals, agent name must appear in
    // the same result. Parent brand signals are exempt — they're explicit brand
    // language, not ambient SEO noise.
    if (signal.partner !== null && agentLower && !haystack.includes(agentLower)) continue

    // Domain matches link to the partner's site — unambiguous.
    // Name/alias matches link to the SERP result that contained both names.
    const isDomainSignal = signal.phrase.includes('.') && !signal.isAlias
    const proofUrl = isDomainSignal ? `https://${signal.phrase}` : url

    matches.push({
      signal,
      proofUrl,
      proofTitle: isDomainSignal ? signal.partner?.name || signal.phrase : title,
      proofSnippet: snippet.slice(0, 200),
      matchedPhrase: signal.phrase,
    })
    firedPhrases.add(signal.phrase)
  }
  return matches
}

// ─── AGGREGATOR ───────────────────────────────────────────────────────────────
// Aggregates matches from multiple results into tree scores + human-readable
// signals. Each phrase is counted only once even if it appears in 5 results.

export function aggregateMatches(matches: NetworkMatch[]): {
  integrity: number
  amerilife: number
  sms: number
  signals: string[]
  topPartnerMatch: NetworkMatch | null
} {
  let integrity = 0, amerilife = 0, sms = 0
  const signals: string[] = []
  let topPartnerMatch: NetworkMatch | null = null
  let topWeight = 0
  const counted = new Set<string>()

  for (const m of matches) {
    if (counted.has(m.matchedPhrase)) continue
    counted.add(m.matchedPhrase)
    const { signal } = m

    if (signal.tree === 'integrity') integrity += signal.weight
    else if (signal.tree === 'amerilife') amerilife += signal.weight
    else sms += signal.weight

    const label = signal.partner
      ? `${signal.partner.name} [${signal.tree.toUpperCase()} partner]`
      : `${signal.tree.toUpperCase()} brand language`
    signals.push(`"${m.matchedPhrase}" → ${label} · ↗ ${m.proofUrl}`)

    if (signal.partner && signal.weight > topWeight) {
      topWeight = signal.weight
      topPartnerMatch = m
    }
  }
  return { integrity, amerilife, sms, signals, topPartnerMatch }
}
