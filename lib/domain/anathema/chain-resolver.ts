// ─── lib/domain/anathema/chain-resolver.ts ───────────────────────────────────
// Runs two SERP queries in parallel to find named partner agencies co-mentioned
// with the agent. Any partner that resolves in the network map feeds the parent
// tree prediction directly — the partner's tree IS the prediction source.

import { supabase } from '@/lib/supabase.server'
import type { NetworkPartner } from './signals'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type ChainSignal = {
  tier: 'HIGH' | 'MED' | 'LOW'
  type: 'domain' | 'name' | 'alias' | 'comention' | 'relationship' | 'association' | 'geographic'
  entity: string
  text: string
  source: 'partner_query' | 'relationship_query' | 'geographic'
}

export type ChainResult = {
  resolved_partner_name: string | null
  resolved_partner_id: string | null    // UUID — was number when backed by networks.ts
  resolved_partner_tree: 'integrity' | 'amerilife' | 'sms' | null
  resolved_confidence: number | null
  chain_signals: ChainSignal[]
} | null

// ─── KEYWORDS ─────────────────────────────────────────────────────────────────

const UPLINE_KEYWORDS = [
  'contracted through', 'appointed through', 'writing under', 'downline',
  'contracts through', 'appointed with', 'contracted with', 'under contract',
  'agent portal', 'producer portal', 'agent login',
]

const ASSOCIATION_KEYWORDS = [
  'trip', 'leaderboard', 'award', 'top producer', 'conference', 'convention',
  'achievement', 'partner', 'affiliated', 'proud member', 'proud partner',
  'thank you', 'thanks to', 'honored', 'recognition',
  'summit', 'incentive', 'qualifier', 'qualified', 'retreat',
]

// ─── CANDIDATE FETCHER ────────────────────────────────────────────────────────
// Replaces getCandidatePartners() from networks.ts.
// Queries network_partners for active partners in the agent's state + neighbors,
// falling back to the full tree if regional coverage is thin.

const STATE_NEIGHBORS: Record<string, string[]> = {
  AL: ['FL','GA','TN','MS'], AK: [], AZ: ['CA','NV','UT','CO','NM'],
  AR: ['MO','TN','MS','LA','TX','OK'], CA: ['OR','NV','AZ'],
  CO: ['WY','NE','KS','OK','NM','AZ','UT'], CT: ['NY','MA','RI'],
  DE: ['MD','PA','NJ'], FL: ['GA','AL'], GA: ['FL','AL','TN','NC','SC'],
  HI: [], ID: ['MT','WY','UT','NV','OR','WA'], IL: ['WI','IA','MO','KY','IN'],
  IN: ['MI','OH','KY','IL'], IA: ['MN','WI','IL','MO','NE','SD'],
  KS: ['NE','MO','OK','CO'], KY: ['OH','WV','VA','TN','MO','IL','IN'],
  LA: ['TX','AR','MS'], ME: ['NH'], MD: ['PA','DE','WV','VA'],
  MA: ['RI','CT','NY','NH','VT'], MI: ['OH','IN','WI'],
  MN: ['WI','IA','SD','ND'], MS: ['TN','AL','LA','AR'],
  MO: ['IA','IL','KY','TN','AR','OK','KS','NE'], MT: ['ID','WY','SD','ND'],
  NE: ['SD','IA','MO','KS','CO','WY'], NV: ['OR','ID','UT','AZ','CA'],
  NH: ['VT','ME','MA'], NJ: ['NY','PA','DE'], NM: ['CO','OK','TX','AZ'],
  NY: ['VT','MA','CT','NJ','PA'], NC: ['VA','TN','GA','SC'],
  ND: ['MT','SD','MN'], OH: ['PA','WV','KY','IN','MI'],
  OK: ['KS','MO','AR','TX','NM','CO'], OR: ['WA','ID','NV','CA'],
  PA: ['NY','NJ','DE','MD','WV','OH'], RI: ['CT','MA'], SC: ['NC','GA'],
  SD: ['ND','MN','IA','NE','WY','MT'], TN: ['KY','VA','NC','GA','AL','MS','AR','MO'],
  TX: ['NM','OK','AR','LA'], UT: ['ID','WY','CO','NM','AZ','NV'],
  VT: ['NY','NH','MA'], VA: ['MD','WV','KY','TN','NC'],
  WA: ['OR','ID'], WV: ['OH','PA','MD','VA','KY'], WI: ['MN','MI','IL','IA'],
  WY: ['MT','SD','NE','CO','UT','ID'], DC: ['MD','VA'],
}

async function getCandidatePartnersFromDB(
  tree: 'integrity' | 'amerilife' | 'sms',
  agentState: string
): Promise<NetworkPartner[]> {
  const state = agentState.toUpperCase()
  const neighbors = STATE_NEIGHBORS[state] || []
  const regionalStates = [state, ...neighbors]

  // Try regional first
  const { data: regional } = await supabase
    .from('network_partners')
    .select('id, name, aliases, tree, segment, city, state, coords, website, status, source')
    .eq('tree', tree)
    .eq('status', 'active')
    .in('state', regionalStates)
    .limit(20)

  if (regional && regional.length >= 5) {
    // Sort: same-state first, then neighbors
    return regional.sort((a, b) => {
      if (a.state === state && b.state !== state) return -1
      if (b.state === state && a.state !== state) return 1
      return 0
    })
  }

  // Fall back to full tree if regional coverage is thin
  const { data: full } = await supabase
    .from('network_partners')
    .select('id, name, aliases, tree, segment, city, state, coords, website, status, source')
    .eq('tree', tree)
    .eq('status', 'active')
    .limit(40)

  return full || []
}

// ─── RESOLVER ─────────────────────────────────────────────────────────────────

export async function resolveChain(
  agentName: string,
  agentState: string,
  tree: 'integrity' | 'amerilife' | 'sms',
  serpKey: string
): Promise<ChainResult> {
  try {
    const candidates = (await getCandidatePartnersFromDB(tree, agentState)).slice(0, 8)
    if (candidates.length === 0) return null

    const treeName = tree === 'integrity' ? 'Integrity Marketing Group'
      : tree === 'amerilife' ? 'AmeriLife'
      : 'Senior Market Sales'
    const treeShort = tree === 'integrity' ? 'Integrity'
      : tree === 'amerilife' ? 'AmeriLife'
      : 'SMS'

    const partnerTerms = candidates.flatMap(p => [
      `"${p.name}"`,
      ...(p.aliases || []).map((a: string) => `"${a}"`),
    ]).join(' OR ')

    const q1 = `"${agentName}" (${partnerTerms})`
    const q2 = `"${agentName}" "${treeShort}" trip OR leaderboard OR award OR appointed OR contracted OR partner OR "top producer" OR conference OR achievement OR recognition OR summit OR qualifier`

    const [res1, res2] = await Promise.all([
      fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q1)}&num=8&api_key=${serpKey}`, { signal: AbortSignal.timeout(7000) }).catch(() => null),
      fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q2)}&num=8&api_key=${serpKey}`, { signal: AbortSignal.timeout(7000) }).catch(() => null),
    ])

    const results1: any[] = res1?.ok ? (await res1.json()).organic_results || [] : []
    const results2: any[] = res2?.ok ? (await res2.json()).organic_results || [] : []

    const agentLower = agentName.toLowerCase()
    const allSignals: ChainSignal[] = []

    type CandidateScore = { partner: NetworkPartner; score: number }
    const candidateScores: CandidateScore[] = []

    for (const partner of candidates) {
      let score = 0
      const nameLower = partner.name.toLowerCase()
      const domainLower = (partner.website || '').toLowerCase().replace('www.', '')

      for (const r of results1.slice(0, 8)) {
        const combined = `${r.title || ''} ${r.snippet || ''} ${r.link || ''}`.toLowerCase()
        if (!combined.includes(agentLower)) continue

        if (domainLower && combined.includes(domainLower)) {
          score += 50
          allSignals.push({
            tier: 'HIGH', type: 'domain', entity: partner.name,
            text: `Domain ${partner.website} co-appears with agent in: "${(r.title || '').slice(0, 70)}"`,
            source: 'partner_query',
          })
          break
        }

        if (combined.includes(nameLower)) {
          score += 30
          const hasUpline = UPLINE_KEYWORDS.some(k => combined.includes(k))
          allSignals.push({
            tier: hasUpline ? 'HIGH' : 'MED',
            type: hasUpline ? 'relationship' : 'comention',
            entity: partner.name,
            text: `"${(r.title || '').slice(0, 70)}" — co-mentions agent and ${partner.name}${hasUpline ? ' with contracting language' : ''}`,
            source: 'partner_query',
          })
          break
        }

        for (const alias of partner.aliases || []) {
          const aliasLower = alias.toLowerCase()
          if (combined.includes(aliasLower)) {
            const isShort = alias.length <= 4
            score += isShort ? 15 : 30
            allSignals.push({
              tier: isShort ? 'LOW' : 'MED', type: 'alias', entity: partner.name,
              text: `Alias "${alias}" (${partner.name}) co-appears with agent in results`,
              source: 'partner_query',
            })
            break
          }
        }
      }

      if (score > 0) candidateScores.push({ partner, score })
    }

    for (const r of results2.slice(0, 6)) {
      const combined = `${r.title || ''} ${r.snippet || ''}`.toLowerCase()
      if (!combined.includes(agentLower)) continue

      const uplineMatch = UPLINE_KEYWORDS.find(k => combined.includes(k))
      if (uplineMatch) {
        allSignals.push({
          tier: 'HIGH', type: 'relationship', entity: treeName,
          text: `"${(r.title || '').slice(0, 70)}" — contains contracting language "${uplineMatch}"`,
          source: 'relationship_query',
        })
        for (const cs of candidateScores) {
          if (combined.includes(cs.partner.name.toLowerCase())) cs.score += 35
        }
        continue
      }

      const assocMatch = ASSOCIATION_KEYWORDS.find(k => combined.includes(k))
      if (assocMatch) {
        allSignals.push({
          tier: 'MED', type: 'association', entity: treeName,
          text: `"${(r.title || '').slice(0, 70)}" — association signal: "${assocMatch}"`,
          source: 'relationship_query',
        })
        for (const cs of candidateScores) {
          if (combined.includes(cs.partner.name.toLowerCase())) cs.score += 20
        }
      }
    }

    candidateScores.sort((a, b) => b.score - a.score)
    const best = candidateScores[0]

    const hasResolved = best && best.score >= 65
    const confidence = hasResolved
      ? Math.min(92, Math.round((best.score / 145) * 100))
      : null

    if (allSignals.length === 0 && !hasResolved) return null

    return {
      resolved_partner_name: hasResolved ? best.partner.name : null,
      resolved_partner_id: hasResolved ? best.partner.id : null,   // UUID string
      resolved_partner_tree: hasResolved ? best.partner.tree : null,
      resolved_confidence: confidence,
      chain_signals: allSignals,
    }
  } catch {
    return null
  }
}
