// ─── lib/domain/anathema/chain-resolver.ts ───────────────────────────────────
// Runs two SERP queries in parallel to find named partner agencies co-mentioned
// with the agent. Any partner that resolves in the network map feeds the parent
// tree prediction directly — the partner's tree IS the prediction source.
// Geographic signals removed entirely. Carrier signals not used here.

import { getCandidatePartners, type NetworkPartner } from '@/lib/networks'

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
  resolved_partner_id: number | null
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

// ─── RESOLVER ─────────────────────────────────────────────────────────────────

export async function resolveChain(
  agentName: string,
  agentState: string,
  tree: 'integrity' | 'amerilife' | 'sms',
  serpKey: string
): Promise<ChainResult> {
  try {
    const candidates = getCandidatePartners(tree, agentState).slice(0, 8)
    if (candidates.length === 0) return null

    const treeName = tree === 'integrity' ? 'Integrity Marketing Group'
      : tree === 'amerilife' ? 'AmeriLife'
      : 'Senior Market Sales'
    const treeShort = tree === 'integrity' ? 'Integrity'
      : tree === 'amerilife' ? 'AmeriLife'
      : 'SMS'

    const partnerTerms = candidates.flatMap(p => [
      `"${p.name}"`,
      ...(p.aliases || []).map(a => `"${a}"`),
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
      const domainLower = partner.website.toLowerCase().replace('www.', '')

      // Per-result matching — both partner AND agent must be in the same result.
      // Old approach concatenated all results into one blob, which let a partner
      // in result #6 and agent in result #2 count as a co-mention.
      for (const r of results1.slice(0, 8)) {
        const combined = `${r.title || ''} ${r.snippet || ''} ${r.link || ''}`.toLowerCase()
        if (!combined.includes(agentLower)) continue

        if (combined.includes(domainLower)) {
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

    // Score >= 65 required to name a resolved partner
    const hasResolved = best && best.score >= 65
    const confidence = hasResolved
      ? Math.min(92, Math.round((best.score / 145) * 100))
      : null

    if (allSignals.length === 0 && !hasResolved) return null

    return {
      resolved_partner_name: hasResolved ? best.partner.name : null,
      resolved_partner_id: hasResolved ? best.partner.id : null,
      resolved_partner_tree: hasResolved ? best.partner.tree : null,
      resolved_confidence: confidence,
      chain_signals: allSignals,
    }
  } catch {
    return null
  }
}
