// ─── lib/domain/anathema/analyzer.ts ─────────────────────────────────────────
// The ANATHEMA prediction engine.
//
// Three steps, one pipeline:
//   1. gatherEvidence   — website crawl + social + SERP in parallel
//   2. analyzeEvidence  — one Sonnet call → find real named relationships
//   3. enrichFromDB     — pure lookup → attach UUID or write to discovered_fmos
//
// Philosophy: find evidence of a REAL relationship between this agent and any
// named FMO or wholesaler. Don't force a tree classification. Surface what
// actually exists in the public record — posts, trips, leaderboards, mentions.

import { getAnthropicClient } from '@/lib/ai'
import { supabase } from '@/lib/supabase.server'
import { crawlAgentSite } from './agentCrawler'
import type { NetworkSignal } from './signals'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type AnalysisSignal = {
  tier: 'HIGH' | 'MED' | 'LOW'
  type: 'domain' | 'name' | 'comention' | 'relationship' | 'association' | 'brand_language'
  entity: string
  text: string
  source: 'serp' | 'facebook' | 'website' | 'ai_inference'
}

export type AnalysisResult = {
  predicted_tree: 'integrity' | 'amerilife' | 'sms' | 'unknown'
  tree_confidence: number
  tree_evidence: string
  signals_used: string[]
  reasoning: string
  prediction_source: 'brand_language' | 'ai_inference' | 'both' | null

  predicted_sub_imo: string | null
  predicted_sub_imo_confidence: number | null
  predicted_sub_imo_partner_id: string | null
  predicted_sub_imo_signals: AnalysisSignal[]
  predicted_sub_imo_is_new_discovery: boolean

  facebook_profile_url: string | null
  facebook_about: string | null

  serp_debug: Array<{
    query: string
    source: string
    results: Array<{ title: string; url: string; snippet: string; signals_matched: string[] }>
  }>
}

// ─── STEP 1: GATHER EVIDENCE ─────────────────────────────────────────────────
// Runs three things in parallel:
//   A. Website crawl — sitemap-driven, extracts owner names + relationship signals
//   B. Apify social — Facebook posts + YouTube videos (runs first, not as fallback)
//   C. SERP — broad search + owner-name search + Facebook search
//
// Owner name from the website crawl feeds into a targeted SERP search.
// Social runs immediately alongside the crawl — not after AI analysis.

export async function gatherEvidence(
  agentName: string,
  agentState: string,
  agentCity: string,
  agentWebsite: string | null,
  serpKey: string,
  socialFbUrl: string | null,
  youtubeUrl: string | null,
): Promise<{
  evidenceBlob: string
  facebookProfileUrl: string | null
  facebookAbout: string | null
  facebookPostText: string
  serpDebug: AnalysisResult['serp_debug']
  ownerNames: string[]
  websitePagesFound: string[]
}> {
  const base = `https://serpapi.com/search.json?engine=google&num=8&api_key=${serpKey}`
  const timeout = { signal: AbortSignal.timeout(10000) }

  // ── A. Website crawl — runs immediately, gives us owner names for SERP ──────
  const websiteIntel = agentWebsite
    ? await crawlAgentSite(agentWebsite, agentName).catch(() => null)
    : null

  // Use social URLs found on website if we don't already have them
  const fbUrl = socialFbUrl || websiteIntel?.socialUrls.facebook || null
  const ytUrl = youtubeUrl || websiteIntel?.socialUrls.youtube || null
  const ownerNames = websiteIntel?.ownerNames || []
  const primaryOwner = ownerNames[0] || null

  // ── B + C. Social (Apify) + SERP fire in parallel ──────────────────────────
  // q1: broad local search for the agency
  const q1 = `"${agentName}" insurance ${agentCity} ${agentState}`.trim()
  // q2: owner person search — FMO/conference/relationship language
  const q2 = primaryOwner
    ? `"${primaryOwner}" insurance FMO OR IMO OR wholesaler OR "marketing organization" OR conference OR appointed OR trip`
    : `"${agentName}" FMO OR IMO OR "field marketing" OR "marketing organization" OR appointed OR contracted OR upline`
  // q3: agency + owner co-mention with any known distribution org
  const q3 = primaryOwner
    ? `"${primaryOwner}" OR "${agentName}" "field marketing" OR "marketing organization" OR upline OR leaderboard OR "top producer" OR "annual conference"`
    : `"${agentName}" upline OR leaderboard OR "top producer" OR "annual conference" OR "producer trip"`
  // q4: Facebook profile search
  const q4 = primaryOwner
    ? `"${primaryOwner}" OR "${agentName}" site:facebook.com`
    : `"${agentName}" site:facebook.com`

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
    parse(r2, q2, 'owner_relationship'),
    parse(r3, q3, 'distribution_signals'),
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

  // Extract Facebook profile URL from SERP
  let facebookProfileUrl = fbUrl
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

  // Try Facebook profile content via SerpAPI
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

  // ── Assemble evidence blob ────────────────────────────────────────────────
  const sections: string[] = []

  // Website content — highest trust, agent wrote this themselves
  if (websiteIntel?.fullText) {
    sections.push(`=== AGENT WEBSITE (${agentWebsite}) ===
Pages crawled: ${websiteIntel.pagesFound.join(', ')}
${websiteIntel.fullText}`)

    if (websiteIntel.ownerNames.length > 0)
      sections.push(`OWNER/PRINCIPAL NAMES FOUND ON SITE: ${websiteIntel.ownerNames.join(', ')}`)
    if (websiteIntel.carrierMentions.length > 0)
      sections.push(`CARRIERS MENTIONED ON SITE: ${websiteIntel.carrierMentions.join(', ')}`)
    if (websiteIntel.membershipOrgs.length > 0)
      sections.push(`ORGANIZATIONS/MEMBERSHIPS MENTIONED: ${websiteIntel.membershipOrgs.join(', ')}`)
    if (websiteIntel.relationshipPhrases.length > 0)
      sections.push(`RELATIONSHIP LANGUAGE FOUND:\n${websiteIntel.relationshipPhrases.map(p => `- ${p}`).join('\n')}`)
  }

  // SERP results
  const allSnippets: string[] = []
  for (const d of [d1, d2, d3, d4]) {
    for (const r of d.results) {
      const text = [r.title, r.snippet, r.link].filter(Boolean).join(' | ')
      if (text) allSnippets.push(`[${d.source}] ${text}`)
    }
  }
  if (allSnippets.length > 0)
    sections.push(`=== WEB SEARCH RESULTS ===\n${allSnippets.join('\n\n')}`)

  // Facebook content
  if (facebookAbout)
    sections.push(`=== FACEBOOK ABOUT ===\n${facebookAbout}`)
  if (facebookPostText)
    sections.push(`=== FACEBOOK POSTS ===\n${facebookPostText}`)

  const evidenceBlob = sections.join('\n\n').slice(0, 10000)

  return {
    evidenceBlob,
    facebookProfileUrl,
    facebookAbout: facebookAbout || null,
    facebookPostText,
    serpDebug,
    ownerNames,
    websitePagesFound: websiteIntel?.pagesFound || [],
  }
}

// ─── STEP 2: ANALYZE EVIDENCE ─────────────────────────────────────────────────
// One Sonnet call. Primary question: does any named organization have a real
// relationship with this agent? Describe the evidence. Don't guess.
// Tree classification is secondary and only returned when explicitly evidenced.

type AIAnalysis = {
  tree: 'integrity' | 'amerilife' | 'sms' | 'unknown'
  tree_confidence: number
  tree_evidence: string
  signals_used: string[]
  reasoning: string
  subimo: string | null
  subimo_confidence: 'HIGH' | 'MED' | 'LOW' | null
  subimo_evidence: string | null
  subimo_evidence_type: 'contracting_language' | 'association_event' | 'domain_signal' | 'comention' | 'brand_content' | 'website_mention' | 'social_post' | null
}

export async function analyzeEvidence(
  agentName: string,
  agentState: string,
  evidenceBlob: string,
  networkSignals: NetworkSignal[],
  extraSignals: string[] = [],
  ownerNames: string[] = [],
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

  // Known partner hints — for recognition only, not to bias the search
  const knownPartners = networkSignals
    .filter(s => s.partner && !s.isAlias)
    .slice(0, 60)
    .map(s => `${s.partner!.name} (${s.tree})`)
    .join(', ')

  const prompt = `You are ANATHEMA — an intelligence system that finds real business relationships between insurance agents and their upline organizations.

AGENT: "${agentName}"${ownerNames.length > 0 ? `\nOWNER/PRINCIPAL: ${ownerNames.join(', ')}` : ''}
STATE: ${agentState}

${extraSignals.length > 0 ? `PRE-SCORED SIGNALS:\n${extraSignals.map(s => `- ${s}`).join('\n')}\n` : ''}

EVIDENCE GATHERED:
${evidenceBlob.slice(0, 8000)}

━━━ YOUR JOB ━━━

Find any named FMO, IMO, wholesaler, or upline organization that has a REAL relationship with this agent or their owner. 

A real relationship means:
- They are mentioned on the agent's own website as a partner, upline, or affiliated org
- The agent or owner appears on the organization's leaderboard, award list, or trip roster
- The agent or owner posted about the organization (conference, trip, event, training)
- The agent or owner is tagged by or tags the organization on social media
- A YouTube video title or description mentions the organization in a relationship context
- The agent explicitly says "I work with", "appointed through", "contracted with", or similar

NOT a real relationship:
- Two names appearing in the same state insurance filing or directory (they just happen to be listed together)
- A SERP result that mentions both names but in different contexts
- Generic insurance education content that mentions carrier names
- Carrier names alone (Humana, Aetna, etc.) — those are products, not uplines
- The agent's name or agency name RESEMBLING a known sub-IMO name — name similarity is not a relationship signal under any circumstances
- The word "integrity", "amerilife", "senior", "marketing", or any tree-brand word appearing in a generic context (e.g. "we act with integrity", membership org text, educational content)

━━━ TREE CLASSIFICATION ━━━

Only classify a tree if you find EXPLICIT brand language — not inferred, not implied by name similarity:
- INTEGRITY: The exact phrases "Integrity Marketing Group", "Family First Life", "FFL agent", "IntegrityCONNECT", "MedicareCENTER", or a link/domain containing integrity.com. The word "integrity" alone does NOT count.
- AMERILIFE: The exact phrases "AmeriLife", "USABG", "United Senior Benefits Group", or amerilife.com domain. 
- SMS: The exact phrases "Senior Market Sales", "Rethinking Retirement", seniormarketsales.com domain — OR Mutual of Omaha + Medico both explicitly listed as carried products.

Known sub-IMOs for reference (may appear in evidence): ${knownPartners || 'none loaded'}

━━━ CONFIDENCE LEVELS ━━━

HIGH: Explicit contracting language, agent on their leaderboard/roster, agent sharing their branded content, website directly names them as upline
MED: Agent at their event or trip, co-mentioned in association context with relationship implied, owner personally tagged
LOW: Name appears near agent but relationship type unclear

If you cannot find a real relationship with at least LOW confidence — return subimo: null. 
"Unknown" is a valid and honest answer. A wrong confident answer is worse than no answer.

━━━ RESPOND WITH ONLY THIS JSON ━━━

{
  "tree": "integrity" | "amerilife" | "sms" | "unknown",
  "tree_confidence": 0-100,
  "tree_evidence": "the single strongest explicit signal, or empty string",
  "signals_used": ["signal 1", "signal 2"],
  "reasoning": "1-2 sentences explaining what you found and where",
  "subimo": "exact org name as seen in evidence, or null",
  "subimo_confidence": "HIGH" | "MED" | "LOW" | null,
  "subimo_evidence": "the specific quote, post text, page content, or context that shows this relationship",
  "subimo_evidence_type": "contracting_language" | "association_event" | "domain_signal" | "comention" | "brand_content" | "website_mention" | "social_post" | null
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

export async function enrichFromDB(
  subimoName: string,
  tree: 'integrity' | 'amerilife' | 'sms' | 'unknown',
  agentName: string,
  agentState: string,
  evidence: string,
  confidence: 'HIGH' | 'MED' | 'LOW',
): Promise<{ id: string | null; isNewDiscovery: boolean }> {
  const nameLower = subimoName.toLowerCase().trim()

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

  const { data: discovered } = await supabase
    .from('discovered_fmos')
    .select('id, name')
    .ilike('name', subimoName)
    .limit(1)
  if (discovered && discovered.length > 0) return { id: discovered[0].id, isNewDiscovery: false }

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
  const typeBonus = evidenceType === 'contracting_language' ? 8
    : evidenceType === 'brand_content' ? 5
    : evidenceType === 'website_mention' ? 6
    : evidenceType === 'social_post' ? 4
    : 0
  const knownBonus = isKnown ? 5 : 0
  return Math.min(96, base + typeBonus + knownBonus)
}
