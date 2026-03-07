// ─── lib/domain/anathema/signals.ts ──────────────────────────────────────────
// Network signal index — built from network_partners DB table on each scan.
// Covers all active partners + aliases + discovered FMOs with times_seen >= 3.
// Never hardcode partner names here. Add via admin UI or promote from discovered_fmos.

import { supabase } from '@/lib/supabase.server'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type NetworkPartner = {
  id: string           // UUID — was number in networks.ts
  name: string
  aliases: string[]
  tree: 'integrity' | 'amerilife' | 'sms'
  segment?: string | null
  city: string
  state: string
  coords?: number[] | null
  website: string
  status: string
  source: string
}

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
// Exempt from the co-mention requirement — explicit brand language doesn't need
// the agent's name to be meaningful.

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

const SMS_EXCLUSIVE_CARRIERS = ['mutual of omaha', 'medico', 'gpm life']

export function scoreSMSCarriers(carriers: string[]): { sms: number; signals: string[] } {
  const lower = carriers.map(c => c.toLowerCase())
  const smsMatches = lower.filter(c => SMS_EXCLUSIVE_CARRIERS.some(k => c.includes(k) || k.includes(c)))
  if (smsMatches.length >= 2) return { sms: 35, signals: [`Carrier combo: ${smsMatches.join(' + ')} — SMS exclusive fingerprint`] }
  if (smsMatches.length === 1) return { sms: 15, signals: [`Carrier: ${smsMatches[0]} — weak SMS signal`] }
  return { sms: 0, signals: [] }
}

// ─── INDEX BUILDER ────────────────────────────────────────────────────────────
// Queries network_partners (active) + discovered_fmos (times_seen >= 3, not dismissed).
// Discovered FMOs without a confirmed tree are treated as unknown — they still
// generate signals but don't contribute to tree scores until promoted.

// ─── MODULE-LEVEL CACHE ───────────────────────────────────────────────────────
// The signal index changes at most a few times a day (new partners, promoted FMOs).
// Re-fetching on every scan burns two unnecessary Supabase round trips.
// 5-minute TTL balances freshness with efficiency.

let _cachedSignals: NetworkSignal[] | null = null
let _cacheExpiry = 0
const CACHE_TTL_MS = 5 * 60 * 1000

async function _buildFresh(): Promise<NetworkSignal[]> {
  const signals: NetworkSignal[] = []
  const seen = new Set<string>()

  // Parent brand signals first — highest priority, always included
  for (const b of PARENT_BRAND_SIGNALS) {
    if (!seen.has(b.phrase)) {
      signals.push({ phrase: b.phrase, tree: b.tree, partner: null, weight: 40, isAlias: false })
      seen.add(b.phrase)
    }
  }

  // ── Active network partners from DB ─────────────────────────────────────
  const { data: partners, error: partnersError } = await supabase
    .from('network_partners')
    .select('id, name, aliases, tree, segment, city, state, coords, website, status, source')
    .eq('status', 'active')

  if (partnersError) {
    console.error('[signals] Failed to load network_partners:', partnersError.message)
  }

  for (const partner of partners || []) {
    const nameLower = partner.name.toLowerCase()
    if (nameLower.length >= 4 && !seen.has(nameLower)) {
      signals.push({ phrase: nameLower, tree: partner.tree, partner, weight: 38, isAlias: false })
      seen.add(nameLower)
    }

    const domain = (partner.website || '').toLowerCase().replace('www.', '')
    if (domain && domain.includes('.') && !seen.has(domain)) {
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

  // ── Discovered FMOs — seen 3+ times, not dismissed, not yet promoted ────
  // These get lower weight than confirmed partners since they're unverified.
  // They don't have a confirmed tree yet so we use a placeholder — the upline
  // hunter downstream will still surface them by name.
  const { data: discovered } = await supabase
    .from('discovered_fmos')
    .select('id, name, name_variants, tree, website')
    .gte('times_seen', 3)
    .not('status', 'eq', 'dismissed')
    .not('status', 'eq', 'promoted')   // promoted ones are already in network_partners

  for (const fmo of discovered || []) {
    // Only add to signal index if we have a confirmed tree — otherwise
    // there's no tree to score against and it would corrupt predictions
    if (!fmo.tree || fmo.tree === 'unknown') continue

    const nameLower = fmo.name.toLowerCase()
    if (nameLower.length >= 4 && !seen.has(nameLower)) {
      // Shape into NetworkPartner-compatible object for downstream consumers
      const partnerProxy: NetworkPartner = {
        id: fmo.id,
        name: fmo.name,
        aliases: fmo.name_variants || [],
        tree: fmo.tree as 'integrity' | 'amerilife' | 'sms',
        city: '',
        state: '',
        website: fmo.website || '',
        status: 'discovered',
        source: 'discovered',
      }
      signals.push({ phrase: nameLower, tree: fmo.tree as 'integrity' | 'amerilife' | 'sms', partner: partnerProxy, weight: 30, isAlias: false })
      seen.add(nameLower)
    }

    for (const variant of fmo.name_variants || []) {
      const variantLower = variant.toLowerCase()
      if (variantLower.length >= 4 && !seen.has(variantLower)) {
        signals.push({ phrase: variantLower, tree: fmo.tree as 'integrity' | 'amerilife' | 'sms', partner: null, weight: 25, isAlias: true })
        seen.add(variantLower)
      }
    }
  }

  return signals
}

export async function buildNetworkSignalIndex(): Promise<NetworkSignal[]> {
  const now = Date.now()
  if (_cachedSignals && now < _cacheExpiry) return _cachedSignals
  const signals = await _buildFresh()
  _cachedSignals = signals
  _cacheExpiry = now + CACHE_TTL_MS
  return signals
}

// ─── SCANNER ──────────────────────────────────────────────────────────────────
// Scans a single result against the signal index.
// Takes the pre-built index as a parameter — caller builds it once per scan
// and reuses it across all SERP results, Facebook content, and website text.

export function scanResultAgainstNetwork(
  title: string,
  snippet: string,
  url: string,
  agentName?: string,
  networkSignals?: NetworkSignal[]   // pre-built index; falls back gracefully if not provided
): NetworkMatch[] {
  if (!networkSignals || networkSignals.length === 0) return []

  const haystack = `${title} ${snippet} ${url}`.toLowerCase()
  const agentLower = agentName?.toLowerCase() || ''
  const matches: NetworkMatch[] = []
  const firedPhrases = new Set<string>()

  for (const signal of networkSignals) {
    if (firedPhrases.has(signal.phrase)) continue
    if (!haystack.includes(signal.phrase)) continue

    // Co-mention requirement: for partner signals, agent name must appear in
    // the same result. Parent brand signals are exempt.
    if (signal.partner !== null && agentLower && !haystack.includes(agentLower)) continue

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
