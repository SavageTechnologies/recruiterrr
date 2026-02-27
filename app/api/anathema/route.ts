export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { supabase } from '@/lib/supabase.server'
import { getCandidatePartners, matchPartnerByName, INTEGRITY_PARTNERS, AMERILIFE_PARTNERS, SMS_PARTNERS, type NetworkPartner } from '@/lib/networks'

const ALLOWED_ORIGINS = ['https://recruiterrr.com', 'http://localhost:3000']

// ─── NETWORK SIGNAL INDEX ────────────────────────────────────────────────────
// Auto-built from networks.ts at startup — covers ALL 289 partners + aliases.
// Never hardcode partner names here — add them to networks.ts instead.
// Each signal carries: phrase, tree, partner reference, weight, and isAlias flag.

type NetworkSignal = {
  phrase: string
  tree: 'integrity' | 'amerilife' | 'sms'
  partner: NetworkPartner | null  // null = parent brand signal, not a specific partner
  weight: number
  isAlias: boolean
}

// Unambiguous parent-brand phrases that identify the tree but not a specific partner
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

// SMS carrier combo — still the only carrier signal worth using
const SMS_EXCLUSIVE_CARRIERS = ['mutual of omaha', 'medico', 'gpm life']

function scoreSMSCarriers(carriers: string[]): { sms: number; signals: string[] } {
  const lower = carriers.map(c => c.toLowerCase())
  const smsMatches = lower.filter(c => SMS_EXCLUSIVE_CARRIERS.some(k => c.includes(k) || k.includes(c)))
  if (smsMatches.length >= 2) return { sms: 35, signals: [`Carrier combo: ${smsMatches.join(' + ')} — SMS exclusive fingerprint`] }
  if (smsMatches.length === 1) return { sms: 15, signals: [`Carrier: ${smsMatches[0]} — weak SMS signal`] }
  return { sms: 0, signals: [] }
}

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
const NETWORK_SIGNALS = buildNetworkSignalIndex()

// ─── FULL NETWORK SCANNER ─────────────────────────────────────────────────────
// Scans a single SERP result against ALL signals simultaneously.
// Returns every match with the proof URL attached — no more discarding the source.

type NetworkMatch = {
  signal: NetworkSignal
  proofUrl: string
  proofTitle: string
  proofSnippet: string
  matchedPhrase: string
}

function scanResultAgainstNetwork(title: string, snippet: string, url: string, agentName?: string): NetworkMatch[] {
  const haystack = `${title} ${snippet} ${url}`.toLowerCase()
  const agentLower = agentName?.toLowerCase() || ''
  const matches: NetworkMatch[] = []
  const firedPhrases = new Set<string>()

  for (const signal of NETWORK_SIGNALS) {
    if (firedPhrases.has(signal.phrase)) continue
    if (!haystack.includes(signal.phrase)) continue

    // ── Co-mention requirement ───────────────────────────────────────────────
    // For partner name/alias/domain signals: the agent's name must also appear
    // in this result. If Ritter ranks for every KC insurance search, that's
    // Ritter's SEO — not evidence of this agent's affiliation.
    // Parent brand signals (amerilife, integrity marketing group, etc.) are
    // exempt — those are explicit brand language, not ambient SEO noise.
    if (signal.partner !== null && agentLower && !haystack.includes(agentLower)) continue

    // ── Proof URL ────────────────────────────────────────────────────────────
    // Domain matches: link directly to the partner's site — unambiguous.
    // Name/alias matches: link to the SERP result that contained both names.
    const isDomainSignal = signal.phrase.includes('.') && !signal.isAlias
    const proofUrl = isDomainSignal
      ? `https://${signal.phrase}`
      : url

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

// Aggregate matches from multiple results into scores + human-readable signals
// Each phrase is counted only once even if it appears in 5 results.
function aggregateMatches(matches: NetworkMatch[]): {
  integrity: number; amerilife: number; sms: number
  signals: string[]
  topPartnerMatch: NetworkMatch | null  // highest-weight partner-specific match
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

function extractFacebookHandle(url: string): string | null {
  try {
    const match = url.match(/facebook\.com\/([^/?&#]+)/)
    if (match && match[1] && match[1] !== 'pages' && match[1] !== 'groups') return match[1]
  } catch {}
  return null
}


// ─── CHAIN SIGNAL TYPES ───────────────────────────────────────────────────────

export type ChainSignal = {
  tier: 'HIGH' | 'MED' | 'LOW'
  type: 'domain' | 'name' | 'alias' | 'comention' | 'relationship' | 'association' | 'geographic'
  entity: string
  text: string
  source: 'partner_query' | 'relationship_query' | 'geographic'
}

export type ChainResult = {
  // The resolved partner, if one clears the threshold
  resolved_partner_name: string | null
  resolved_partner_id: number | null
  resolved_partner_tree: 'integrity' | 'amerilife' | 'sms' | null
  resolved_confidence: number | null
  // All signals collected regardless of whether a partner resolved
  chain_signals: ChainSignal[]
} | null

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

// ─── CHAIN RESOLVER ───────────────────────────────────────────────────────────
// Runs two SERP queries in parallel to find named partner agencies co-mentioned
// with the agent. Any partner that resolves in the network map feeds the parent
// tree prediction directly — the partner's tree IS the prediction source.
// Geographic signals removed entirely. Carrier signals not used here.

async function resolveChain(
  agentName: string,
  agentState: string,
  tree: 'integrity' | 'amerilife' | 'sms',
  serpKey: string
): Promise<ChainResult> {
  try {
    const candidates = getCandidatePartners(tree, agentState).slice(0, 8)
    if (candidates.length === 0) return null

    const treeName = tree === 'integrity' ? 'Integrity Marketing Group' : tree === 'amerilife' ? 'AmeriLife' : 'Senior Market Sales'
    const treeShort = tree === 'integrity' ? 'Integrity' : tree === 'amerilife' ? 'AmeriLife' : 'SMS'

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

      // ── Per-result matching — both partner AND agent must be in the same result ──
      // Old approach concatenated all results into one blob, which let partner
      // appearing in result #6 and agent in result #2 count as a co-mention.
      // Now each result is checked independently.

      for (const r of results1.slice(0, 8)) {
        const combined = `${r.title || ''} ${r.snippet || ''} ${r.link || ''}`.toLowerCase()

        // Agent must be present in this result for any signal to fire
        if (!combined.includes(agentLower)) continue

        // Domain match — strongest signal
        if (combined.includes(domainLower)) {
          score += 50
          allSignals.push({
            tier: 'HIGH', type: 'domain', entity: partner.name,
            text: `Domain ${partner.website} co-appears with agent in: "${(r.title || '').slice(0, 70)}"`,
            source: 'partner_query',
          })
          break
        }

        // Name co-mention
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

        // Alias co-mention
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
        allSignals.push({ tier: 'HIGH', type: 'relationship', entity: treeName, text: `"${(r.title || '').slice(0, 70)}" — contains contracting language "${uplineMatch}"`, source: 'relationship_query' })
        for (const cs of candidateScores) { if (combined.includes(cs.partner.name.toLowerCase())) cs.score += 35 }
        continue
      }

      const assocMatch = ASSOCIATION_KEYWORDS.find(k => combined.includes(k))
      if (assocMatch) {
        allSignals.push({ tier: 'MED', type: 'association', entity: treeName, text: `"${(r.title || '').slice(0, 70)}" — association signal: "${assocMatch}"`, source: 'relationship_query' })
        for (const cs of candidateScores) { if (combined.includes(cs.partner.name.toLowerCase())) cs.score += 20 }
      }
    }

    candidateScores.sort((a, b) => b.score - a.score)
    const best = candidateScores[0]

    // Score >= 65 required to name a resolved partner
    const hasResolved = best && best.score >= 65
    const confidence = hasResolved ? Math.min(92, Math.round((best.score / 145) * 100)) : null

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

// ─── UNRESOLVED UPLINE HUNTER ─────────────────────────────────────────────────
// When the network scanner and chain resolver both come up empty or low-confidence,
// this runs against Facebook post content and SERP snippets using Claude to hunt
// for FMO/IMO entities that aren't in the 286-partner network map.
//
// Returns a detected upline name + evidence quote + source URL, or null.
// This is what catches Compass Health Consultants from a Punta Cana trip post.

type UnresolvedUpline = {
  name: string           // extracted entity name e.g. "Compass Health Consultants"
  evidence: string       // the quote that revealed it e.g. "CHC's Annual Sales Trip in Punta Cana"
  sourceUrl: string      // where we found it
  confidence: 'HIGH' | 'MED'
}

async function huntUnresolvedUpline(
  agentName: string,
  facebookPostText: string,
  facebookProfileUrl: string,
  serpSnippets: string[],
): Promise<UnresolvedUpline | null> {
  // Combine all available text
  const allText = [facebookPostText, ...serpSnippets].filter(Boolean).join('\n\n')
  if (!allText.trim()) return null

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are analyzing public web content about an insurance agent named "${agentName}" to find their upline FMO or IMO organization.

CONTENT TO ANALYZE:
${allText.slice(0, 3000)}

Look for any of these signals that would identify an upline FMO/IMO:
- Sales trip or incentive trip announcements ("sales trip to X sponsored by Y", "Y's annual trip")
- Logo mentions or company names on swag/merchandise
- "Appointed through", "contracted with", "writing under", "my upline", "my FMO", "my IMO"
- Leaderboard or award mentions from a specific company
- Company-branded content they are posting/sharing

If you find a clear FMO/IMO organization name, respond with ONLY this JSON:
{
  "found": true,
  "name": "exact organization name",
  "evidence": "the exact quote or context that reveals this",
  "confidence": "HIGH" or "MED"
}

If nothing clear found, respond with ONLY:
{ "found": false }

Do NOT guess. Do NOT include generic insurance companies (Humana, Aetna, UnitedHealth). Only name an FMO/IMO upline organization you can clearly identify from the text.`,
      }],
    })

    const raw = ((res.content[0] as any).text || '').replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(raw)

    if (!parsed.found || !parsed.name) return null

    return {
      name: parsed.name,
      evidence: parsed.evidence || '',
      sourceUrl: facebookProfileUrl || '',
      confidence: parsed.confidence === 'HIGH' ? 'HIGH' : 'MED',
    }
  } catch {
    return null
  }
}



export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data: specimen, error: specimenError } = await supabase
    .from('anathema_specimens')
    .select('*')
    .eq('id', id)
    .eq('clerk_id', userId)
    .single()

  if (specimen && !specimenError) {
    return NextResponse.json({
      scan: {
        id: specimen.id,
        agent_name: specimen.agent_name,
        url: specimen.agent_website,
        city: specimen.city,
        state: specimen.state,
        confirmed_tree: specimen.confirmed_tree,
        confirmed_tree_other: specimen.confirmed_tree_other,
        sub_imo: specimen.confirmed_sub_imo,
        recruiter_notes: specimen.recruiter_notes,
        analysis_json: {
          predicted_tree: specimen.predicted_tree || 'unknown',
          confidence: specimen.predicted_confidence || 0,
          signals_used: specimen.prediction_signals || [],
          reasoning: specimen.prediction_reasoning || '',
          facebook_profile_url: specimen.facebook_profile_url || null,
          facebook_about: specimen.facebook_about || null,
          predicted_sub_imo: specimen.predicted_sub_imo || null,
          predicted_sub_imo_confidence: specimen.predicted_sub_imo_confidence || null,
          predicted_sub_imo_signals: specimen.predicted_sub_imo_signals || [],
          predicted_sub_imo_partner_id: specimen.predicted_sub_imo_partner_id || null,
          prediction_source: specimen.prediction_source || null,
          serp_debug: specimen.serp_debug || null,
        },
      }
    })
  }

  const { data, error } = await supabase
    .from('anathema_scans')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ scan: data })
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(20, '1 h'), analytics: true })
  const { success } = await ratelimit.limit(userId)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const body = await req.json()
  const { action } = body

  // ─── SAVE OBSERVATION ───────────────────────────────────────────────────────
  if (action === 'log_observation') {
    const {
      agent_name, city, state,
      predicted_tree, predicted_confidence, prediction_signals, prediction_reasoning,
      prediction_source,
      facebook_profile_url, facebook_about,
      confirmed_tree, confirmed_tree_other, confirmed_sub_imo, recruiter_notes,
      agent_website, agent_address,
      predicted_sub_imo, predicted_sub_imo_confidence, predicted_sub_imo_signals, predicted_sub_imo_partner_id,
      serp_debug,
    } = body

    // Resolve confirmed_sub_imo free text against the network map
    let confirmed_sub_imo_partner_id: number | null = null
    if (confirmed_sub_imo?.trim()) {
      const matched = matchPartnerByName(confirmed_sub_imo)
      if (matched) confirmed_sub_imo_partner_id = matched.id
    }

    const { data: existing } = await supabase
      .from('anathema_specimens')
      .select('id')
      .eq('clerk_id', userId)
      .eq('agent_name', agent_name)
      .eq('city', city)
      .eq('state', state)
      .single()

    let specimenId = existing?.id

    if (existing?.id) {
      await supabase
        .from('anathema_specimens')
        .update({
          predicted_tree, predicted_confidence, prediction_signals, prediction_reasoning,
          prediction_source,
          facebook_profile_url, facebook_about,
          confirmed_tree, confirmed_tree_other, confirmed_sub_imo, recruiter_notes,
          confirmed_sub_imo_partner_id,
          ...(predicted_sub_imo !== undefined && { predicted_sub_imo }),
          ...(predicted_sub_imo_confidence !== undefined && { predicted_sub_imo_confidence }),
          ...(predicted_sub_imo_signals !== undefined && { predicted_sub_imo_signals }),
          ...(predicted_sub_imo_partner_id !== undefined && { predicted_sub_imo_partner_id }),
          ...(serp_debug !== undefined && { serp_debug }),
        })
        .eq('id', existing.id)
    } else {
      const { data: inserted } = await supabase
        .from('anathema_specimens')
        .insert({
          clerk_id: userId,
          agent_name, city, state, agent_website, agent_address,
          predicted_tree, predicted_confidence, prediction_signals, prediction_reasoning,
          prediction_source,
          facebook_profile_url, facebook_about,
          confirmed_tree, confirmed_tree_other, confirmed_sub_imo, recruiter_notes,
          confirmed_sub_imo_partner_id,
          predicted_sub_imo: predicted_sub_imo || null,
          predicted_sub_imo_confidence: predicted_sub_imo_confidence || null,
          predicted_sub_imo_signals: predicted_sub_imo_signals || null,
          predicted_sub_imo_partner_id: predicted_sub_imo_partner_id || null,
          serp_debug: serp_debug || null,
        })
        .select('id')
        .single()
      specimenId = inserted?.id
    }

    await supabase.from('anathema_observation_history').insert({
      specimen_id: specimenId,
      clerk_id: userId,
      agent_name, city, state,
      confirmed_tree, confirmed_tree_other, confirmed_sub_imo, recruiter_notes,
      predicted_tree, predicted_confidence,
    })

// ── Write ANATHEMA results back to agent_profiles ─────────────────────────
    // If this agent exists in the database (was surfaced by a search), update
    // their record with the ANATHEMA intelligence. Non-blocking.
    void supabase
      .from('agent_profiles')
      .update({
        anathema_run:         true,
        predicted_tree:       confirmed_tree || predicted_tree || null,
        predicted_confidence: predicted_confidence || null,
        predicted_sub_imo:    confirmed_sub_imo || predicted_sub_imo || null,
        unresolved_upline:    body.unresolved_upline || null,
        anathema_signals:     prediction_signals || null,
        anathema_scanned_at:  new Date().toISOString(),
      })
      .eq('clerk_id', userId)
      .ilike('name', agent_name)
      .eq('city', city)
      .eq('state', state)

    return NextResponse.json({ ok: true })
  }

  // ─── CHECK EXISTING ──────────────────────────────────────────────────────────
  if (action === 'check_existing') {
    const { agent_name, city, state } = body
    const { data } = await supabase
      .from('anathema_specimens')
      .select('*')
      .eq('clerk_id', userId)
      .eq('agent_name', agent_name)
      .eq('city', city)
      .eq('state', state)
      .single()
    return NextResponse.json({ specimen: data || null })
  }

  // ─── RUN SCAN ────────────────────────────────────────────────────────────────
  const { agent } = body
  if (!agent) return NextResponse.json({ error: 'Missing agent' }, { status: 400 })

  const serpKey = process.env.SERPAPI_KEY
  let integrityScore = 0, amerilifeScore = 0, smsScore = 0
  const allSignals: string[] = []
  let facebookProfileUrl: string | null = null
  let facebookAbout: string | null = null
  let autoDetectedSubImo: NetworkMatch | null = null  // highest-weight partner match found during scanning

  // ── serp_debug: audit trail of every query run and every match found ──────
  // Stored as jsonb on the specimen so any result can be traced back to its
  // exact source. Each entry records: the query string, the raw result titles
  // and snippets, and which signals fired from that result.
  const serpDebug: Array<{
    query: string
    source: string
    results: Array<{ title: string; url: string; snippet: string; signals_matched: string[] }>
  }> = []

  // ── SMS carrier check ─────────────────────────────────────────────────────
  if (agent.carriers?.length > 0) {
    const smsCarriers = scoreSMSCarriers(agent.carriers)
    smsScore += smsCarriers.sms
    allSignals.push(...smsCarriers.signals)
  }

  // ── Scan agent notes/about against full network ───────────────────────────
  // Agent's own text fields — scan against all 289 partners
  const textBlob = [agent.notes || '', agent.about || ''].join(' ')
  if (textBlob.trim()) {
    const textMatches = scanResultAgainstNetwork('', textBlob, agent.website || '')
    const agg = aggregateMatches(textMatches)
    integrityScore += agg.integrity
    amerilifeScore += agg.amerilife
    smsScore += agg.sms
    allSignals.push(...agg.signals.map(s => `Profile: ${s}`))
    if (agg.topPartnerMatch && !autoDetectedSubImo) {
      autoDetectedSubImo = agg.topPartnerMatch
    }
  }

  // ── SERP Pass 1: broad agent search — full network scan ───────────────────
  // Simple agent name query — get back 8 results and scan ALL of them against
  // the complete 289-partner network index. No pre-filtering by brand phrase.
  const allNetworkMatches: NetworkMatch[] = []
  try {
    const q1 = `"${agent.name}" insurance ${agent.city || ''} ${agent.state || ''}`
    const res1 = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q1)}&num=8&api_key=${serpKey}`,
      { signal: AbortSignal.timeout(6000) }
    )
    if (res1.ok) {
      const data1 = await res1.json()
      const results1 = data1.organic_results || []
      const debugEntry: typeof serpDebug[0] = { query: q1, source: 'pass1_broad', results: [] }

      for (const r of results1) {
        const matches = scanResultAgainstNetwork(r.title || '', r.snippet || '', r.link || '', agent.name)
        allNetworkMatches.push(...matches)
        debugEntry.results.push({
          title: r.title || '',
          url: r.link || '',
          snippet: (r.snippet || '').slice(0, 200),
          signals_matched: matches.map(m => `"${m.matchedPhrase}" → ${m.signal.partner?.name || m.signal.tree}`),
        })
      }
      serpDebug.push(debugEntry)
    }
  } catch {}

  // ── SERP Pass 2: FMO/IMO context search — full network scan ──────────────
  // Second query adds FMO/IMO/agent context to surface affiliation pages
  // that don't show up in a generic name search.
  try {
    const q2 = `"${agent.name}" FMO OR IMO OR "insurance agent" OR "appointed" OR "contracted"`
    const res2 = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q2)}&num=8&api_key=${serpKey}`,
      { signal: AbortSignal.timeout(6000) }
    )
    if (res2.ok) {
      const data2 = await res2.json()
      const results2 = data2.organic_results || []
      const debugEntry: typeof serpDebug[0] = { query: q2, source: 'pass2_fmo', results: [] }

      for (const r of results2) {
        const matches = scanResultAgainstNetwork(r.title || '', r.snippet || '', r.link || '', agent.name)
        allNetworkMatches.push(...matches)
        debugEntry.results.push({
          title: r.title || '',
          url: r.link || '',
          snippet: (r.snippet || '').slice(0, 200),
          signals_matched: matches.map(m => `"${m.matchedPhrase}" → ${m.signal.partner?.name || m.signal.tree}`),
        })
      }
      serpDebug.push(debugEntry)
    }
  } catch {}

  // Aggregate all SERP matches into scores
  if (allNetworkMatches.length > 0) {
    const agg = aggregateMatches(allNetworkMatches)
    integrityScore += agg.integrity
    amerilifeScore += agg.amerilife
    smsScore += agg.sms
    allSignals.push(...agg.signals.map(s => `Google: ${s}`))
    if (agg.topPartnerMatch && !autoDetectedSubImo) {
      autoDetectedSubImo = agg.topPartnerMatch
    }
  }

  // ── SERP Pass 3: Facebook ─────────────────────────────────────────────────
  let facebookPostText = ''  // collected post content for unresolved upline hunter
  const serpSnippetsForHunter: string[] = []  // SERP snippets for hunter fallback

  // Collect SERP snippets from both passes for hunter use
  for (const entry of serpDebug) {
    for (const r of entry.results) {
      if (r.snippet) serpSnippetsForHunter.push(r.snippet)
    }
  }

  try {
    const fbQ = `"${agent.name}" site:facebook.com`
    const fbSearchRes = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(fbQ)}&num=3&api_key=${serpKey}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (fbSearchRes.ok) {
      const fbSearchData = await fbSearchRes.json()
      const fbResult = (fbSearchData.organic_results || []).find((r: any) => r.link?.includes('facebook.com'))

      serpDebug.push({
        query: fbQ,
        source: 'facebook_search',
        results: (fbSearchData.organic_results || []).slice(0, 3).map((r: any) => ({
          title: r.title || '',
          url: r.link || '',
          snippet: (r.snippet || '').slice(0, 200),
          signals_matched: [],
        })),
      })

      if (fbResult?.link) {
        const handle = extractFacebookHandle(fbResult.link)
        if (handle) {
          facebookProfileUrl = fbResult.link
          try {
            const fbProfileRes = await fetch(
              `https://serpapi.com/search.json?engine=facebook_profile&profile_id=${handle}&api_key=${serpKey}`,
              { signal: AbortSignal.timeout(5000) }
            )
            if (fbProfileRes.ok) {
              const fbProfile = await fbProfileRes.json()
              const about = fbProfile?.about || fbProfile?.description || ''

              // Collect posts for the unresolved upline hunter
              const posts: any[] = fbProfile?.posts || fbProfile?.updates || []
              const postText = posts
                .slice(0, 10)
                .map((p: any) => p.snippet || p.text || p.description || '')
                .filter(Boolean)
                .join('\n')

              facebookPostText = [about, postText].filter(Boolean).join('\n')

              const allFbText = facebookPostText
              if (allFbText) {
                facebookAbout = about || postText.slice(0, 500)
                const fbMatches = scanResultAgainstNetwork('', allFbText, facebookProfileUrl || '', agent.name)
                const fbAgg = aggregateMatches(fbMatches)
                integrityScore += fbAgg.integrity
                amerilifeScore += fbAgg.amerilife
                smsScore += fbAgg.sms

                serpDebug.push({
                  query: `facebook_profile:${handle}`,
                  source: 'facebook_profile',
                  results: [{
                    title: `Facebook profile — ${handle}`,
                    url: facebookProfileUrl || '',
                    snippet: allFbText.slice(0, 200),
                    signals_matched: fbMatches.map(m => `"${m.matchedPhrase}" → ${m.signal.partner?.name || m.signal.tree}`),
                  }],
                })

                if (fbAgg.signals.length > 0) {
                  allSignals.push(...fbAgg.signals.map(s => `Facebook: ${s}`))
                  if (fbAgg.topPartnerMatch && !autoDetectedSubImo) autoDetectedSubImo = fbAgg.topPartnerMatch
                } else {
                  allSignals.push('Facebook profile found — no network affiliation detected')
                }
              } else {
                allSignals.push('Facebook: Profile located — no readable content')
              }
            }
          } catch {}
        }
      } else {
        allSignals.push('Facebook: No profile located')
      }
    }
  } catch {
    allSignals.push('Facebook: Search unavailable')
  }

  if (allSignals.length === 0) allSignals.push('No affiliation signals detected in available data')

  // ── Haiku tree prediction ─────────────────────────────────────────────────
  const prompt = `You are ANATHEMA, a pathogen analysis system for the US insurance distribution market. Predict which of three major consolidation trees an agent belongs to.

THE THREE TREES:
1. INTEGRITY MARKETING GROUP — Brand language: "Integrity Marketing Group", "Family First Life", "FFL agent", "IntegrityCONNECT", "MedicareCENTER". Do NOT classify based on the word "integrity" alone.
2. AMERILIFE — Brand language: "AmeriLife", "USABG", "United Senior Benefits Group". Domain: amerilife.com.
3. SENIOR MARKET SALES (SMS) — Brand language: "Senior Market Sales", "SMS partner", "Rethinking Retirement". Exclusive carriers: Mutual of Omaha + Medico together.

AGENT: ${agent.name}
Location: ${agent.city || ''}, ${agent.state || ''}
Pre-scored signals: Integrity=${integrityScore}, AmeriLife=${amerilifeScore}, SMS=${smsScore}

RAW SIGNALS:
${allSignals.map(s => `- ${s}`).join('\n')}

Rules:
- Only predict a tree if there is EXPLICIT brand language or the SMS carrier combo. Generic insurance language, location, or common carriers do NOT qualify.
- If confidence < 40, use predicted_tree: "unknown"
- signals_used: 2-4 most compelling signals
- reasoning: 1-2 sentences

Respond with ONLY valid JSON:
{
  "predicted_tree": "integrity" | "amerilife" | "sms" | "unknown",
  "confidence": 0-100,
  "signals_used": ["signal 1", "signal 2"],
  "reasoning": "1-2 sentences"
}`

  let prediction: { predicted_tree: string; confidence: number; signals_used: string[]; reasoning: string } = {
    predicted_tree: 'unknown',
    confidence: 0,
    signals_used: allSignals.filter(s => !s.startsWith('Facebook: No') && !s.startsWith('No affiliation')).slice(0, 4),
    reasoning: 'Insufficient signals to determine affiliation.',
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const claudeRes = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })
    const parsed = JSON.parse(((claudeRes.content[0] as any).text || '').replace(/```json|```/g, '').trim())
    prediction = parsed
  } catch {}

  // ── Chain resolver ────────────────────────────────────────────────────────
  // Now runs as a fallback — the full network scanner above catches most agents
  // directly. Chain resolver fires when we have a tree but no specific partner,
  // or when still unknown after both SERP passes.

  let chainResult: ChainResult = null
  const treesToTry: Array<'integrity' | 'amerilife' | 'sms'> =
    prediction.predicted_tree !== 'unknown'
      ? [prediction.predicted_tree as 'integrity' | 'amerilife' | 'sms']
      : ['integrity', 'amerilife', 'sms']

  if (agent.state && serpKey) {
    for (const tree of treesToTry) {
      const result = await resolveChain(agent.name, agent.state, tree, serpKey)
      if (result && (result.resolved_partner_name || result.chain_signals.length > 0)) {
        chainResult = result
        break
      }
    }
  }

  // ── Synthesize final prediction ───────────────────────────────────────────
  let finalTree = prediction.predicted_tree
  let finalConfidence = prediction.confidence
  let finalSignals = prediction.signals_used
  let finalReasoning = prediction.reasoning
  let predictionSource: 'brand_language' | 'chain_resolver' | 'both' | null = null

  if (prediction.predicted_tree !== 'unknown') {
    predictionSource = 'brand_language'
  }

  if (chainResult?.resolved_partner_name && chainResult.resolved_partner_tree) {
    const chainTree = chainResult.resolved_partner_tree
    if (finalTree === 'unknown') {
      finalTree = chainTree
      finalConfidence = chainResult.resolved_confidence ?? 50
      finalSignals = [`${chainResult.resolved_partner_name} identified as ${chainTree === 'integrity' ? 'Integrity Marketing Group' : chainTree === 'amerilife' ? 'AmeriLife' : 'Senior Market Sales'} partner`]
      finalReasoning = `${chainResult.resolved_partner_name} was found co-mentioned with this agent and is a known ${chainTree === 'integrity' ? 'Integrity Marketing Group' : chainTree === 'amerilife' ? 'AmeriLife' : 'Senior Market Sales'} partner.`
      predictionSource = 'chain_resolver'
    } else if (finalTree === chainTree) {
      finalConfidence = Math.min(92, finalConfidence + 15)
      finalSignals = [...finalSignals, `Chain: ${chainResult.resolved_partner_name} confirmed as ${chainTree} partner`]
      predictionSource = 'both'
    }
  }

  // ── Sub-IMO resolution ────────────────────────────────────────────────────
  const subImoPartner = chainResult?.resolved_partner_name
    ? {
        name: chainResult.resolved_partner_name,
        id: chainResult.resolved_partner_id,
        confidence: chainResult.resolved_confidence,
        signals: chainResult.chain_signals,
        proofUrl: null,
      }
    : autoDetectedSubImo
    ? {
        name: autoDetectedSubImo.signal.partner!.name,
        id: autoDetectedSubImo.signal.partner!.id,
        confidence: Math.min(88, Math.round(autoDetectedSubImo.signal.weight * 2)),
        signals: [{
          tier: 'HIGH' as const,
          type: 'name' as const,
          entity: autoDetectedSubImo.signal.partner!.name,
          text: `"${autoDetectedSubImo.matchedPhrase}" found in search results — direct partner identification`,
          source: 'partner_query' as const,
        }],
        proofUrl: autoDetectedSubImo.proofUrl,
      }
    : null

  // ── Unresolved upline hunter ──────────────────────────────────────────────
  // Runs when: tree is unknown OR confidence < 50 AND no sub-IMO detected yet.
  // Reads Facebook posts + SERP snippets through Claude to find entities
  // that aren't in the 286-partner network — Compass Health Consultants,
  // any FMO we haven't mapped yet. Auto-logs without recruiter action.

  let unresolvedUpline: UnresolvedUpline | null = null
  const shouldHunt = (
    (finalTree === 'unknown' || finalConfidence < 50) &&
    !subImoPartner &&
    (facebookPostText || serpSnippetsForHunter.length > 0)
  )

  if (shouldHunt) {
    unresolvedUpline = await huntUnresolvedUpline(
      agent.name,
      facebookPostText,
      facebookProfileUrl || '',
      serpSnippetsForHunter,
    )

    if (unresolvedUpline) {
      allSignals.push(`Unresolved upline detected: "${unresolvedUpline.name}" — "${unresolvedUpline.evidence}"`)
    }
  }

  return NextResponse.json({
    predicted_tree: finalTree,
    confidence: finalConfidence,
    signals_used: finalSignals,
    reasoning: finalReasoning,
    prediction_source: predictionSource,
    facebook_profile_url: facebookProfileUrl,
    facebook_about: facebookAbout,
    predicted_sub_imo: subImoPartner?.name ?? null,
    predicted_sub_imo_confidence: subImoPartner?.confidence ?? null,
    predicted_sub_imo_signals: subImoPartner?.signals ?? [],
    predicted_sub_imo_partner_id: subImoPartner?.id ?? null,
    predicted_sub_imo_proof_url: subImoPartner?.proofUrl ?? null,
    // Unresolved upline — entity found but not in network map
    unresolved_upline: unresolvedUpline?.name ?? null,
    unresolved_upline_evidence: unresolvedUpline?.evidence ?? null,
    unresolved_upline_source_url: unresolvedUpline?.sourceUrl ?? null,
    unresolved_upline_confidence: unresolvedUpline?.confidence ?? null,
    serp_debug: serpDebug,
  })
}
