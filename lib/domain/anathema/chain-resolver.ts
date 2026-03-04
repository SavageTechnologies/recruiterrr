// ─── lib/domain/anathema/chain-resolver.ts ───────────────────────────────────
// Sub-IMO resolution — finds the named partner agency between the agent and
// the parent tree (Integrity, AmeriLife, SMS).
//
// ARCHITECTURE: AI-first, DB-second.
//
// The old design queried network_partners for known candidates and scored them.
// That made the DB a constraint — if the right answer wasn't in the list, the
// resolver would confidently pick a wrong answer that was.
//
// The new design:
//   1. Gather all available evidence (SERP snippets, Facebook text, domain signals)
//   2. Feed it to Claude Haiku — unconstrained, open world — and ask who sits
//      between this agent and the tree. No candidate list.
//   3. Take the AI's answer and look it up in network_partners + discovered_fmos
//      as an enrichment step (get the UUID if we know them).
//   4. If the answer isn't in the DB — that's a FIND, not a failure.
//      Surface it and write to discovered_fmos for the learning loop.
//
// The DB is a notebook, not a guest list.

import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase.server'
import type { NetworkSignal } from './signals'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type ChainSignal = {
  tier: 'HIGH' | 'MED' | 'LOW'
  type: 'domain' | 'name' | 'alias' | 'comention' | 'relationship' | 'association' | 'geographic'
  entity: string
  text: string
  source: 'partner_query' | 'relationship_query' | 'geographic' | 'ai_inference'
}

export type ChainResult = {
  resolved_partner_name: string | null
  resolved_partner_id: string | null       // UUID from network_partners if known, else null
  resolved_partner_tree: 'integrity' | 'amerilife' | 'sms' | null
  resolved_confidence: number | null
  chain_signals: ChainSignal[]
  is_new_discovery: boolean                // true = not in network_partners, written to discovered_fmos
} | null

// ─── EVIDENCE GATHERER ────────────────────────────────────────────────────────
// Runs two targeted SERP queries to pull fresh evidence for the AI.
// Q1: agent co-mentioned with the tree name + contracting/association language
// Q2: agent + tree name + known association context
// Returns raw snippets — the AI reads them, we don't score them.

async function gatherEvidence(
  agentName: string,
  agentState: string,
  tree: 'integrity' | 'amerilife' | 'sms',
  serpKey: string,
  existingSnippets: string[] = [],
): Promise<{ snippets: string[]; domainSignals: string[] }> {
  const treeShort =
    tree === 'integrity' ? 'Integrity'
    : tree === 'amerilife' ? 'AmeriLife'
    : 'SMS'

  const q1 = `"${agentName}" "${treeShort}" appointed OR contracted OR "writing under" OR upline OR FMO OR IMO OR partner`
  const q2 = `"${agentName}" "${treeShort}" trip OR leaderboard OR award OR "top producer" OR conference OR recognition OR summit`

  const headers = { signal: AbortSignal.timeout(7000) }
  const base = `https://serpapi.com/search.json?engine=google&num=8&api_key=${serpKey}`

  const [res1, res2] = await Promise.all([
    fetch(`${base}&q=${encodeURIComponent(q1)}`, headers).catch(() => null),
    fetch(`${base}&q=${encodeURIComponent(q2)}`, headers).catch(() => null),
  ])

  const results1: any[] = res1?.ok ? (await res1.json()).organic_results || [] : []
  const results2: any[] = res2?.ok ? (await res2.json()).organic_results || [] : []

  const snippets: string[] = [...existingSnippets]
  const domainSignals: string[] = []

  for (const r of [...results1, ...results2]) {
    const text = [r.title, r.snippet, r.link].filter(Boolean).join(' | ')
    if (text) snippets.push(text)
    // Pull any .com domains from URLs — might be sub-IMO sites
    const urlMatch = (r.link || '').match(/https?:\/\/(?:www\.)?([a-z0-9\-]+\.[a-z]{2,})/i)
    if (urlMatch) domainSignals.push(urlMatch[1].toLowerCase())
  }

  return { snippets, domainSignals }
}

// ─── AI RESOLVER ──────────────────────────────────────────────────────────────
// Feeds all evidence to Claude Haiku with no candidate list.
// Asks it to name whoever sits between the agent and the tree.
// Returns the name + confidence + evidence quote, or null.

type AIResolution = {
  name: string
  confidence: 'HIGH' | 'MED' | 'LOW'
  evidence: string
  evidenceType: 'contracting_language' | 'association_event' | 'domain_signal' | 'comention' | 'brand_content'
} | null

async function resolveWithAI(
  agentName: string,
  agentState: string,
  tree: 'integrity' | 'amerilife' | 'sms',
  snippets: string[],
  domainSignals: string[],
  networkSignals: NetworkSignal[],
): Promise<AIResolution> {
  if (snippets.length === 0 && domainSignals.length === 0) return null

  const treeName =
    tree === 'integrity' ? 'Integrity Marketing Group'
    : tree === 'amerilife' ? 'AmeriLife'
    : 'Senior Market Sales (SMS)'

  // Give the AI context about known partners as hints — NOT as the candidate list.
  // This helps it recognize names when they appear, but doesn't limit what it can return.
  const knownPartnerHints = networkSignals
    .filter(s => s.tree === tree && s.partner !== null && !s.isAlias)
    .slice(0, 30)
    .map(s => s.partner!.name)
    .join(', ')

  const evidenceText = snippets.slice(0, 20).join('\n\n')
  const domainContext = domainSignals.length > 0
    ? `\nDOMAINS FOUND IN RESULTS: ${[...new Set(domainSignals)].slice(0, 10).join(', ')}`
    : ''

  const prompt = `You are analyzing public web evidence to identify the sub-IMO or FMO sitting between an insurance agent and their parent distribution tree.

AGENT: "${agentName}" (${agentState})
PARENT TREE: ${treeName}

YOUR TASK: Identify the named partner agency, FMO, or IMO that sits directly between this agent and ${treeName}. This is the organization the agent is contracted through — their immediate upline, not the parent tree itself.

EVIDENCE:
${evidenceText}${domainContext}

KNOWN PARTNERS IN THIS TREE (for reference only — your answer is NOT limited to this list):
${knownPartnerHints || 'None loaded'}

CONFIDENCE GUIDE:
- HIGH: Explicit contracting language ("appointed through X", "contracted with X", "writing under X", "my upline is X"), or agent is on their leaderboard/award list, or they share branded content from X
- MED: Co-mentioned in an association context (trip, conference, award), or domain co-appears with agent, or agent appears in their agent portal
- LOW: Name appears near agent in results but relationship is unclear

RULES:
- Name only ONE organization — the most direct upline, not the parent tree itself
- Do NOT name ${treeName} itself — we already know the tree
- Do NOT name generic carriers (Humana, Aetna, UnitedHealth, etc.)
- Do NOT guess if there is no real evidence. Return found: false.
- If two candidates appear, pick the one with stronger/more explicit evidence
- The answer may be a company NOT in the known partners list — that is fine and expected

Respond with ONLY valid JSON:
{
  "found": true,
  "name": "exact organization name as it appears in the evidence",
  "confidence": "HIGH" | "MED" | "LOW",
  "evidence": "the exact quote or context that reveals this relationship",
  "evidenceType": "contracting_language" | "association_event" | "domain_signal" | "comention" | "brand_content"
}

OR if nothing clear found:
{ "found": false }`

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = ((res.content[0] as any).text || '').replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(raw)

    if (!parsed.found || !parsed.name) return null

    return {
      name: parsed.name,
      confidence: ['HIGH', 'MED', 'LOW'].includes(parsed.confidence) ? parsed.confidence : 'MED',
      evidence: parsed.evidence || '',
      evidenceType: parsed.evidenceType || 'comention',
    }
  } catch {
    return null
  }
}

// ─── DB ENRICHMENT ────────────────────────────────────────────────────────────
// Takes the AI's named answer and looks it up in network_partners + discovered_fmos.
// Returns the UUID if found, null if it's a new discovery.
// Fuzzy match — the AI may return a slightly different form of the name.

async function enrichFromDB(
  name: string,
  tree: 'integrity' | 'amerilife' | 'sms',
): Promise<{ id: string | null; isKnown: boolean }> {
  const nameLower = name.toLowerCase().trim()

  // Exact name match first
  const { data: exact } = await supabase
    .from('network_partners')
    .select('id, name, aliases')
    .eq('tree', tree)
    .eq('status', 'active')
    .ilike('name', name)
    .limit(1)

  if (exact && exact.length > 0) return { id: exact[0].id, isKnown: true }

  // Check aliases
  const { data: all } = await supabase
    .from('network_partners')
    .select('id, name, aliases')
    .eq('tree', tree)
    .eq('status', 'active')

  for (const partner of all || []) {
    for (const alias of partner.aliases || []) {
      if (alias.toLowerCase().includes(nameLower) || nameLower.includes(alias.toLowerCase())) {
        return { id: partner.id, isKnown: true }
      }
    }
    // Fuzzy: if the AI name contains the partner name or vice versa (handles "XYZ Insurance" vs "XYZ")
    const partnerLower = partner.name.toLowerCase()
    if (nameLower.includes(partnerLower) || partnerLower.includes(nameLower)) {
      return { id: partner.id, isKnown: true }
    }
  }

  // Check discovered_fmos too
  const { data: discovered } = await supabase
    .from('discovered_fmos')
    .select('id, name')
    .ilike('name', name)
    .limit(1)

  if (discovered && discovered.length > 0) return { id: discovered[0].id, isKnown: false }

  return { id: null, isKnown: false }
}

// ─── CONFIDENCE → NUMERIC ─────────────────────────────────────────────────────

function confidenceToNumber(
  tier: 'HIGH' | 'MED' | 'LOW',
  evidenceType: string,
  isKnown: boolean,
): number {
  const base =
    tier === 'HIGH' ? 85
    : tier === 'MED' ? 65
    : 45

  // Bonus for explicit contracting language
  const typeBonus = evidenceType === 'contracting_language' ? 8
    : evidenceType === 'brand_content' ? 5
    : 0

  // Slight boost if DB confirmed — validates the AI's read
  const knownBonus = isKnown ? 5 : 0

  return Math.min(96, base + typeBonus + knownBonus)
}

// ─── MAIN RESOLVER ────────────────────────────────────────────────────────────

export async function resolveChain(
  agentName: string,
  agentState: string,
  tree: 'integrity' | 'amerilife' | 'sms',
  serpKey: string,
  networkSignals: NetworkSignal[] = [],
  existingSnippets: string[] = [],  // pass in snippets already gathered in route.ts
): Promise<ChainResult> {
  try {
    // Step 1: Gather fresh evidence (+ any snippets already collected upstream)
    const { snippets, domainSignals } = await gatherEvidence(
      agentName, agentState, tree, serpKey, existingSnippets
    )

    if (snippets.length === 0) return null

    // Step 2: AI reads the evidence — no candidate list, fully open world
    const aiResult = await resolveWithAI(
      agentName, agentState, tree, snippets, domainSignals, networkSignals
    )

    if (!aiResult) return null

    // Step 3: DB enrichment — look up the AI's answer, get UUID if known
    const { id, isKnown } = await enrichFromDB(aiResult.name, tree)

    // Step 4: If it's new — write to discovered_fmos (the learning loop)
    let isNewDiscovery = false
    if (!isKnown) {
      isNewDiscovery = true
      try {
        await supabase.rpc('upsert_discovered_fmo', {
          p_name:       aiResult.name,
          p_evidence:   {
            quote:       aiResult.evidence,
            source_url:  '',
            agent_name:  agentName,
            confidence:  aiResult.confidence,
            seen_at:     new Date().toISOString(),
          },
          p_state:      agentState || 'XX',
          p_confidence: aiResult.confidence,
        })
      } catch (err) {
        console.warn('[chain-resolver] discovered_fmos write failed:', err)
      }
    }

    // Build chain signal for the UI
    const tierMap: Record<string, 'HIGH' | 'MED' | 'LOW'> = {
      contracting_language: 'HIGH',
      brand_content: 'HIGH',
      association_event: 'MED',
      domain_signal: 'MED',
      comention: 'LOW',
    }

    const typeMap: Record<string, ChainSignal['type']> = {
      contracting_language: 'relationship',
      brand_content: 'name',
      association_event: 'association',
      domain_signal: 'domain',
      comention: 'comention',
    }

    const chainSignals: ChainSignal[] = [{
      tier: tierMap[aiResult.evidenceType] || aiResult.confidence,
      type: typeMap[aiResult.evidenceType] || 'comention',
      entity: aiResult.name,
      text: aiResult.evidence,
      source: 'ai_inference',
    }]

    const numericConfidence = confidenceToNumber(aiResult.confidence, aiResult.evidenceType, isKnown)

    return {
      resolved_partner_name: aiResult.name,
      resolved_partner_id: id,
      resolved_partner_tree: tree,
      resolved_confidence: numericConfidence,
      chain_signals: chainSignals,
      is_new_discovery: isNewDiscovery,
    }
  } catch {
    return null
  }
}
