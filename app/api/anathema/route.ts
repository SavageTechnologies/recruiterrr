import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { supabase } from '@/lib/supabase.server'
import { getCandidatePartners, matchPartnerByName, type NetworkPartner } from '@/lib/networks'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  analytics: true,
})

const ALLOWED_ORIGINS = ['https://recruiterrr.com', 'http://localhost:3000']

// ─── LANGUAGE FINGERPRINTS ───────────────────────────────────────────────────
// These are explicit brand phrases — not generic words.
// "integrity" alone is NOT here. Only compound phrases that can only mean one thing.

const INTEGRITY_SIGNALS = [
  'integrity marketing group',
  'integrity marketing',
  'integrity partner',
  'ffl agent',
  'family first life',
  'integrityconnect',
  'integrity connect',
  'medicarecenter',
  'medicare center',
  'life of the southwest',
  'integrity.com',
  'integrity-partner',
  'proud integrity partner',
]

const AMERILIFE_SIGNALS = [
  'amerilife',
  'usabg',
  'amerilife affiliate',
  'amerilife partner',
  'amerilife.com',
  'united senior benefits group',
]

const SMS_SIGNALS = [
  'senior market sales',
  'sms partner',
  'rethinking retirement',
  'seniormarketsales.com',
  'sms family',
  'sms affiliate',
]

// ─── CARRIER FINGERPRINTS ────────────────────────────────────────────────────
// Only SMS has carriers exclusive enough to be a real signal.
// Integrity and AmeriLife share all major carriers — removed.

const SMS_EXCLUSIVE_CARRIERS = ['mutual of omaha', 'medico', 'gpm life']

function extractFacebookHandle(url: string): string | null {
  try {
    const match = url.match(/facebook\.com\/([^/?&#]+)/)
    if (match && match[1] && match[1] !== 'pages' && match[1] !== 'groups') return match[1]
  } catch {}
  return null
}

// SMS-only carrier scoring
function scoreSMSCarriers(carriers: string[]): { sms: number; signals: string[] } {
  const lower = carriers.map(c => c.toLowerCase())
  const smsMatches = lower.filter(c => SMS_EXCLUSIVE_CARRIERS.some(k => c.includes(k) || k.includes(c)))
  if (smsMatches.length >= 2) {
    return { sms: 35, signals: [`Carrier combo: ${smsMatches.join(' + ')} — SMS exclusive fingerprint`] }
  }
  if (smsMatches.length === 1) {
    return { sms: 15, signals: [`Carrier: ${smsMatches[0]} — weak SMS signal`] }
  }
  return { sms: 0, signals: [] }
}

// Explicit brand language matching — compound phrases only
function scoreText(text: string): { integrity: number; amerilife: number; sms: number; signals: string[] } {
  const lower = text.toLowerCase()
  const signals: string[] = []
  let integrity = 0, amerilife = 0, sms = 0

  for (const s of INTEGRITY_SIGNALS) {
    if (lower.includes(s)) { integrity += 40; signals.push(`Text: "${s}" [INTEGRITY brand language]`); break }
  }
  for (const s of AMERILIFE_SIGNALS) {
    if (lower.includes(s)) { amerilife += 40; signals.push(`Text: "${s}" [AMERILIFE brand language]`); break }
  }
  for (const s of SMS_SIGNALS) {
    if (lower.includes(s)) { sms += 40; signals.push(`Text: "${s}" [SMS brand language]`); break }
  }

  return { integrity, amerilife, sms, signals }
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

    const blob1 = results1.map((r: any) => `${r.title || ''} ${r.snippet || ''} ${r.link || ''}`).join(' ').toLowerCase()
    const agentLower = agentName.toLowerCase()
    const allSignals: ChainSignal[] = []

    type CandidateScore = { partner: NetworkPartner; score: number }
    const candidateScores: CandidateScore[] = []

    for (const partner of candidates) {
      let score = 0
      const nameLower = partner.name.toLowerCase()
      const domainLower = partner.website.toLowerCase().replace('www.', '')

      if (blob1.includes(domainLower)) {
        score += 50
        allSignals.push({ tier: 'HIGH', type: 'domain', entity: partner.name, text: `Domain ${partner.website} appears in search results alongside agent`, source: 'partner_query' })
      }

      for (const r of results1.slice(0, 5)) {
        const combined = `${r.title || ''} ${r.snippet || ''} ${r.link || ''}`.toLowerCase()
        if (combined.includes(nameLower) && combined.includes(agentLower)) {
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
      }

      if (blob1.includes(nameLower) && score === 0) {
        score += 25
        allSignals.push({ tier: 'LOW', type: 'name', entity: partner.name, text: `"${partner.name}" appears in search results near agent`, source: 'partner_query' })
      }

      for (const alias of partner.aliases || []) {
        const aliasLower = alias.toLowerCase()
        if (blob1.includes(aliasLower)) {
          const isShort = alias.length <= 4
          score += isShort ? 15 : 30
          allSignals.push({ tier: isShort ? 'LOW' : 'MED', type: 'alias', entity: partner.name, text: `Alias "${alias}" (${partner.name}) appears in search results`, source: 'partner_query' })
          break
        }
      }

      // No geographic scoring — location doesn't imply relationship

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

// ─── GET ──────────────────────────────────────────────────────────────────────

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

  // ── SMS carrier check (only meaningful carrier signal) ────────────────────
  if (agent.carriers?.length > 0) {
    const smsCarriers = scoreSMSCarriers(agent.carriers)
    smsScore += smsCarriers.sms
    allSignals.push(...smsCarriers.signals)
  }

  // ── Explicit brand language on website/about ──────────────────────────────
  const textBlob = [agent.notes || '', agent.about || ''].join(' ')
  if (textBlob.trim()) {
    const textResult = scoreText(textBlob)
    integrityScore += textResult.integrity
    amerilifeScore += textResult.amerilife
    smsScore += textResult.sms
    allSignals.push(...textResult.signals)
  }

  // ── SERP: explicit brand phrase search ───────────────────────────────────
  // Using quoted multi-word phrases only — no bare single words like "integrity"
  try {
    const q = `"${agent.name}" "Integrity Marketing Group" OR "family first life" OR "integrityconnect" OR "medicarecenter" OR "amerilife" OR "USABG" OR "senior market sales" OR "rethinking retirement"`
    const serpRes = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&num=5&api_key=${serpKey}`,
      { signal: AbortSignal.timeout(6000) }
    )
    if (serpRes.ok) {
      const serpData = await serpRes.json()
      const results = serpData.organic_results || []
      for (const r of results.slice(0, 4)) {
        const combined = `${r.title || ''} ${r.snippet || ''}`.toLowerCase()
        const textResult = scoreText(combined)
        integrityScore += textResult.integrity
        amerilifeScore += textResult.amerilife
        smsScore += textResult.sms
        allSignals.push(...textResult.signals.map(s => `Google: ${s}`))
      }
    }
  } catch {}

  // ── Facebook profile ──────────────────────────────────────────────────────
  try {
    const fbSearchRes = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(`"${agent.name}" site:facebook.com`)}&num=3&api_key=${serpKey}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (fbSearchRes.ok) {
      const fbSearchData = await fbSearchRes.json()
      const fbResult = (fbSearchData.organic_results || []).find((r: any) => r.link?.includes('facebook.com'))
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
              if (about) {
                facebookAbout = about
                const fbResult2 = scoreText(about)
                integrityScore += fbResult2.integrity
                amerilifeScore += fbResult2.amerilife
                smsScore += fbResult2.sms
                if (fbResult2.signals.length > 0) {
                  allSignals.push(...fbResult2.signals.map(s => `Facebook: ${s}`))
                } else {
                  allSignals.push('Facebook profile found — no affiliation language detected')
                }
              } else {
                allSignals.push('Facebook: Profile located — about section empty')
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
    const claudeRes = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })
    const parsed = JSON.parse(((claudeRes.content[0] as any).text || '').replace(/```json|```/g, '').trim())
    prediction = parsed
  } catch {}

  // ── Chain resolver ────────────────────────────────────────────────────────
  // Runs against whatever tree Haiku predicted. If Haiku said unknown, we try
  // all three trees and take the first that finds a resolved partner.
  // A resolved partner SETS or OVERRIDES the tree prediction — the chain feeds
  // the parent.

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
  // Chain resolver finding a named partner that resolves in the network map
  // is treated as a stronger signal than Haiku's text analysis alone.

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
      // Chain found something Haiku missed — chain sets the prediction
      finalTree = chainTree
      finalConfidence = chainResult.resolved_confidence ?? 50
      finalSignals = [`${chainResult.resolved_partner_name} identified as ${chainTree === 'integrity' ? 'Integrity Marketing Group' : chainTree === 'amerilife' ? 'AmeriLife' : 'Senior Market Sales'} partner`]
      finalReasoning = `${chainResult.resolved_partner_name} was found co-mentioned with this agent and is a known ${chainTree === 'integrity' ? 'Integrity Marketing Group' : chainTree === 'amerilife' ? 'AmeriLife' : 'Senior Market Sales'} partner.`
      predictionSource = 'chain_resolver'
    } else if (finalTree === chainTree) {
      // Chain agrees with Haiku — boost confidence
      finalConfidence = Math.min(92, finalConfidence + 15)
      finalSignals = [...finalSignals, `Chain: ${chainResult.resolved_partner_name} confirmed as ${chainTree} partner`]
      predictionSource = 'both'
    }
    // If chain disagrees with Haiku — keep Haiku's prediction, note the conflict silently
    // (the chain signals are still stored for recruiter review)
  }

  return NextResponse.json({
    predicted_tree: finalTree,
    confidence: finalConfidence,
    signals_used: finalSignals,
    reasoning: finalReasoning,
    prediction_source: predictionSource,
    facebook_profile_url: facebookProfileUrl,
    facebook_about: facebookAbout,
    // Chain resolver output — always included for storage and UI
    predicted_sub_imo: chainResult?.resolved_partner_name ?? null,
    predicted_sub_imo_confidence: chainResult?.resolved_confidence ?? null,
    predicted_sub_imo_signals: chainResult?.chain_signals ?? [],
    predicted_sub_imo_partner_id: chainResult?.resolved_partner_id ?? null,
  })
}
