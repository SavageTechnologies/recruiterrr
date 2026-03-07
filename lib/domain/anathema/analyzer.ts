// ─── lib/domain/anathema/analyzer.ts ─────────────────────────────────────────
// The Anathema prediction engine — rebuilt clean.
//
// Replaces chain-resolver.ts and upline-hunter.ts entirely.
//
// Three steps, one pipeline:
//   1. gatherEvidence   — 4 parallel SERP/FB fetches → one evidence blob
//   2. analyzeEvidence  — one Sonnet call → tree + sub-IMO simultaneously
//   3. enrichFromDB     — pure lookup → attach UUID or write to discovered_fmos
//
// The DB never votes on the answer. It only recognizes it afterward.

import { getAnthropicClient } from '@/lib/ai'
import { supabase } from '@/lib/supabase.server'
import type { NetworkSignal } from './signals'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type AnalysisSignal = {
  tier: 'HIGH' | 'MED' | 'LOW'
  type: 'domain' | 'name' | 'comention' | 'relationship' | 'association' | 'brand_language'
  entity: string
  text: string
  source: 'serp' | 'facebook' | 'ai_inference'
}

export type AnalysisResult = {
  // Tree prediction
  predicted_tree: 'integrity' | 'amerilife' | 'sms' | 'unknown'
  tree_confidence: number
  tree_evidence: string
  signals_used: string[]
  reasoning: string
  prediction_source: 'brand_language' | 'ai_inference' | 'both' | null

  // Sub-IMO
  predicted_sub_imo: string | null
  predicted_sub_imo_confidence: number | null
  predicted_sub_imo_partner_id: string | null
  predicted_sub_imo_signals: AnalysisSignal[]
  predicted_sub_imo_is_new_discovery: boolean

  // Facebook
  facebook_profile_url: string | null
  facebook_about: string | null

  // Audit
  serp_debug: Array<{
    query: string
    source: string
    results: Array<{ title: string; url: string; snippet: string; signals_matched: string[] }>
  }>
}

// ─── STEP 1: GATHER EVIDENCE ─────────────────────────────────────────────────
// Fires 4 fetches in parallel. Never blocks on one failing.
// Returns a single evidence blob + raw debug for the audit trail.

export async function gatherEvidence(
  agentName: string,
  agentState: string,
  agentCity: string,
  serpKey: string,
  socialFbUrl: string | null,
): Promise<{
  evidenceBlob: string
  facebookProfileUrl: string | null
  facebookAbout: string | null
  facebookPostText: string
  serpDebug: AnalysisResult['serp_debug']
}> {
  const base = `https://serpapi.com/search.json?engine=google&num=8&api_key=${serpKey}`
  const timeout = { signal: AbortSignal.timeout(10000) }

  const q1 = `"${agentName}" insurance ${agentCity} ${agentState}`.trim()
  const q2 = `"${agentName}" FMO OR IMO OR appointed OR contracted OR upline`
  const q3 = `"${agentName}" Integrity OR AmeriLife OR "Senior Market Sales" OR "Family First Life" OR USABG`
  const q4 = `"${agentName}" site:facebook.com`

  const [r1, r2, r3, r4] = await Promise.all([
    fetch(`${base}&q=${encodeURIComponent(q1)}`, timeout).catch(() => null),
    fetch(`${base}&q=${encodeURIComponent(q2)}`, timeout).catch(() => null),
    fetch(`${base}&q=${encodeURIComponent(q3)}`, timeout).catch(() => null),
    fetch(`${base}&q=${encodeURIComponent(q4)}`, timeout).catch(() => null),
  ])

  const parse = async (res: Response | null, query: string, source: string) => {
    const results: any[] = res?.ok ? (await res.json().catch(() => ({}))).organic_results || [] : []
    return { query, source, results }
  }

  const [d1, d2, d3, d4] = await Promise.all([
    parse(r1, q1, 'broad'),
    parse(r2, q2, 'fmo_context'),
    parse(r3, q3, 'tree_brand'),
    parse(r4, q4, 'facebook_search'),
  ])

  // Build serpDebug audit trail
  const serpDebug: AnalysisResult['serp_debug'] = [d1, d2, d3, d4].map(d => ({
    query: d.query,
    source: d.source,
    results: d.results.slice(0, 6).map((r: any) => ({
      title: r.title || '',
      url: r.link || '',
      snippet: (r.snippet || '').slice(0, 200),
      signals_matched: [],
    })),
  }))

  // Extract Facebook profile URL
  let facebookProfileUrl = socialFbUrl
  let facebookAbout = ''
  let facebookPostText = ''

  const fbResult = d4.results.find((r: any) =>
    r.link?.includes('facebook.com') &&
    !r.link.includes('facebook.com/sharer') &&
    !r.link.includes('facebook.com/share')
  )

  if (fbResult?.link && !facebookProfileUrl) {
    facebookProfileUrl = fbResult.link
  }

  // Try to get Facebook profile content if we have a handle
  if (facebookProfileUrl) {
    try {
      const handleMatch = facebookProfileUrl.match(/facebook\.com\/([^/?&#]+)/)
      const handle = handleMatch?.[1]
      if (handle && handle !== 'pages' && handle !== 'groups') {
        const fbProfileRes = await fetch(
          `https://serpapi.com/search.json?engine=facebook_profile&profile_id=${handle}&api_key=${serpKey}`,
          { signal: AbortSignal.timeout(10000) }
        ).catch(() => null)
        if (fbProfileRes?.ok) {
          const fbData = await fbProfileRes.json().catch(() => ({}))
          facebookAbout = fbData?.about || fbData?.description || ''
          const posts: any[] = fbData?.posts || fbData?.updates || []
          facebookPostText = posts
            .slice(0, 10)
            .map((p: any) => p.snippet || p.text || p.description || '')
            .filter(Boolean)
            .join('\n')
          if (facebookAbout || facebookPostText) {
            serpDebug.push({
              query: `facebook_profile:${handle}`,
              source: 'facebook_profile',
              results: [{
                title: `Facebook — ${handle}`,
                url: facebookProfileUrl,
                snippet: [facebookAbout, facebookPostText].filter(Boolean).join(' ').slice(0, 200),
                signals_matched: [],
              }],
            })
          }
        }
      }
    } catch { /* Facebook content fetch failed — URL still valid for Apify */ }
  }

  // Flatten everything into one evidence blob for the AI
  const allSnippets: string[] = []
  for (const d of [d1, d2, d3, d4]) {
    for (const r of d.results) {
      const text = [r.title, r.snippet, r.link].filter(Boolean).join(' | ')
      if (text) allSnippets.push(text)
    }
  }
  if (facebookAbout) allSnippets.push(`Facebook About: ${facebookAbout}`)
  if (facebookPostText) allSnippets.push(`Facebook Posts: ${facebookPostText}`)

  const evidenceBlob = allSnippets.join('\n\n')

  return {
    evidenceBlob,
    facebookProfileUrl,
    facebookAbout: facebookAbout || null,
    facebookPostText,
    serpDebug,
  }
}

// ─── STEP 2: ANALYZE EVIDENCE ─────────────────────────────────────────────────
// One Sonnet call. Answers both questions simultaneously.
// Tree prediction and sub-IMO inference share the same evidence read —
// they inform each other, which is more accurate than two separate systems.

type AIAnalysis = {
  tree: 'integrity' | 'amerilife' | 'sms' | 'unknown'
  tree_confidence: number
  tree_evidence: string
  signals_used: string[]
  reasoning: string
  subimo: string | null
  subimo_confidence: 'HIGH' | 'MED' | 'LOW' | null
  subimo_evidence: string | null
  subimo_evidence_type: 'contracting_language' | 'association_event' | 'domain_signal' | 'comention' | 'brand_content' | null
}

export async function analyzeEvidence(
  agentName: string,
  agentState: string,
  evidenceBlob: string,
  networkSignals: NetworkSignal[],
  extraSignals: string[] = [], // pre-scored signals from SMS carrier check, profile scan, etc.
): Promise<AIAnalysis> {
  const fallback: AIAnalysis = {
    tree: 'unknown',
    tree_confidence: 0,
    tree_evidence: '',
    signals_used: extraSignals.slice(0, 4),
    reasoning: 'Insufficient signals to determine affiliation.',
    subimo: null,
    subimo_confidence: null,
    subimo_evidence: null,
    subimo_evidence_type: null,
  }

  // Build known partner hints for the AI — hints only, not constraints
  const integrityHints = networkSignals
    .filter(s => s.tree === 'integrity' && s.partner && !s.isAlias)
    .slice(0, 25).map(s => s.partner!.name).join(', ')
  const amerilifeHints = networkSignals
    .filter(s => s.tree === 'amerilife' && s.partner && !s.isAlias)
    .slice(0, 25).map(s => s.partner!.name).join(', ')
  const smsHints = networkSignals
    .filter(s => s.tree === 'sms' && s.partner && !s.isAlias)
    .slice(0, 25).map(s => s.partner!.name).join(', ')

  const prompt = `You are ANATHEMA — an intelligence system that identifies which insurance distribution tree an agent belongs to, and who their immediate upline organization is.

AGENT: "${agentName}" (${agentState})

PRE-SCORED SIGNALS (from carrier fingerprint and profile scan):
${extraSignals.length > 0 ? extraSignals.map(s => `- ${s}`).join('\n') : '- None'}

WEB EVIDENCE:
${evidenceBlob.slice(0, 6000)}

━━━ QUESTION 1: WHICH TREE? ━━━

Three possible trees:

INTEGRITY MARKETING GROUP
Brand language: "Integrity Marketing Group", "Family First Life", "FFL agent", "IntegrityCONNECT", "MedicareCENTER", "integrity.com"
Known sub-IMOs (hints only): ${integrityHints || 'none loaded'}

AMERILIFE  
Brand language: "AmeriLife", "USABG", "United Senior Benefits Group", "amerilife.com"
Known sub-IMOs (hints only): ${amerilifeHints || 'none loaded'}

SENIOR MARKET SALES (SMS)
Brand language: "Senior Market Sales", "SMS partner", "Rethinking Retirement", "seniormarketsales.com"
Exclusive carrier combo: Mutual of Omaha + Medico together
Known sub-IMOs (hints only): ${smsHints || 'none loaded'}

TREE RULES:
- Only predict a tree if there is EXPLICIT brand language or the SMS carrier combo
- Generic insurance language, location, or common carriers do NOT qualify
- If confidence < 40, use tree: "unknown"
- signals_used: 2-4 most compelling signals as short phrases
- reasoning: 1-2 sentences max

━━━ QUESTION 2: WHO IS THE SUB-IMO? ━━━

The sub-IMO is the named partner agency, FMO, or IMO sitting directly between this agent and the parent tree. Their immediate upline — not the tree itself.

SUB-IMO CONFIDENCE GUIDE:
- HIGH: Explicit contracting language ("appointed through X", "contracted with X", "writing under X"), agent on their leaderboard/award list, agent sharing their branded content
- MED: Co-mentioned in association context (trip, conference, award), domain co-appears with agent
- LOW: Name appears near agent but relationship unclear — only report if fairly confident

SUB-IMO RULES:
- Do NOT name the parent tree itself (Integrity/AmeriLife/SMS)
- Do NOT name generic carriers (Humana, Aetna, UnitedHealth, Cigna, etc.)
- The answer may be a company NOT in the known sub-IMO hints — that is fine and expected
- If you cannot identify a sub-IMO with at least LOW confidence, return null
- subimo_evidence_type options: "contracting_language" | "association_event" | "domain_signal" | "comention" | "brand_content"

━━━ RESPOND WITH ONLY THIS JSON ━━━

{
  "tree": "integrity" | "amerilife" | "sms" | "unknown",
  "tree_confidence": 0-100,
  "tree_evidence": "the single strongest signal",
  "signals_used": ["signal 1", "signal 2"],
  "reasoning": "1-2 sentences",
  "subimo": "exact org name as seen in evidence, or null",
  "subimo_confidence": "HIGH" | "MED" | "LOW" | null,
  "subimo_evidence": "the quote or context that reveals this, or null",
  "subimo_evidence_type": "contracting_language" | "association_event" | "domain_signal" | "comention" | "brand_content" | null
}`

  try {
    const anthropic = getAnthropicClient()
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = ((res.content[0] as any).text || '').replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(raw)

    return {
      tree: ['integrity', 'amerilife', 'sms', 'unknown'].includes(parsed.tree) ? parsed.tree : 'unknown',
      tree_confidence: typeof parsed.tree_confidence === 'number' ? Math.min(100, Math.max(0, parsed.tree_confidence)) : 0,
      tree_evidence: parsed.tree_evidence || '',
      signals_used: Array.isArray(parsed.signals_used) ? parsed.signals_used.slice(0, 4) : [],
      reasoning: parsed.reasoning || '',
      subimo: parsed.subimo || null,
      subimo_confidence: ['HIGH', 'MED', 'LOW'].includes(parsed.subimo_confidence) ? parsed.subimo_confidence : null,
      subimo_evidence: parsed.subimo_evidence || null,
      subimo_evidence_type: parsed.subimo_evidence_type || null,
    }
  } catch (err) {
    console.error('[analyzeEvidence] failed:', err instanceof Error ? err.message : err)
    return fallback
  }
}

// ─── STEP 3: ENRICH FROM DB ───────────────────────────────────────────────────
// Pure lookup. AI already made the call — this just attaches metadata.
// Fuzzy match handles "XYZ Insurance Group" vs "XYZ Insurance" etc.
// If unknown → writes to discovered_fmos (the learning loop).

export async function enrichFromDB(
  subimoName: string,
  tree: 'integrity' | 'amerilife' | 'sms' | 'unknown',
  agentName: string,
  agentState: string,
  evidence: string,
  confidence: 'HIGH' | 'MED' | 'LOW',
): Promise<{ id: string | null; isNewDiscovery: boolean }> {
  const nameLower = subimoName.toLowerCase().trim()

  // 1. Exact name match in network_partners
  const treeFilter = tree !== 'unknown' ? tree : undefined
  const query = supabase
    .from('network_partners')
    .select('id, name, aliases')
    .eq('status', 'active')
    .ilike('name', subimoName)
    .limit(1)

  if (treeFilter) query.eq('tree', treeFilter)
  const { data: exact } = await query
  if (exact && exact.length > 0) return { id: exact[0].id, isNewDiscovery: false }

  // 2. Alias + fuzzy match
  const allQuery = supabase
    .from('network_partners')
    .select('id, name, aliases')
    .eq('status', 'active')
  if (treeFilter) allQuery.eq('tree', treeFilter)
  const { data: all } = await allQuery

  for (const partner of all || []) {
    const partnerLower = partner.name.toLowerCase()
    if (nameLower.includes(partnerLower) || partnerLower.includes(nameLower)) {
      return { id: partner.id, isNewDiscovery: false }
    }
    for (const alias of partner.aliases || []) {
      const aliasLower = alias.toLowerCase()
      if (aliasLower.length >= 4 && (nameLower.includes(aliasLower) || aliasLower.includes(nameLower))) {
        return { id: partner.id, isNewDiscovery: false }
      }
    }
  }

  // 3. Check discovered_fmos
  const { data: discovered } = await supabase
    .from('discovered_fmos')
    .select('id, name')
    .ilike('name', subimoName)
    .limit(1)
  if (discovered && discovered.length > 0) return { id: discovered[0].id, isNewDiscovery: false }

  // 4. New discovery — write to discovered_fmos
  try {
    await supabase.rpc('upsert_discovered_fmo', {
      p_name: subimoName,
      p_evidence: {
        quote: evidence,
        source_url: '',
        agent_name: agentName,
        confidence,
        seen_at: new Date().toISOString(),
      },
      p_state: agentState || 'XX',
      p_confidence: confidence,
    })
  } catch (err) {
    console.warn('[analyzer] discovered_fmos write failed:', err)
  }

  return { id: null, isNewDiscovery: true }
}

// ─── CONFIDENCE → NUMERIC ─────────────────────────────────────────────────────

export function subimoConfidenceToNumber(
  tier: 'HIGH' | 'MED' | 'LOW',
  evidenceType: string | null,
  isKnown: boolean,
): number {
  const base = tier === 'HIGH' ? 85 : tier === 'MED' ? 65 : 45
  const typeBonus = evidenceType === 'contracting_language' ? 8 : evidenceType === 'brand_content' ? 5 : 0
  const knownBonus = isKnown ? 5 : 0
  return Math.min(96, base + typeBonus + knownBonus)
}
