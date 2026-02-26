import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { supabase } from '@/lib/supabase.server'
import { getCandidatePartners, type NetworkPartner } from '@/lib/networks'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  analytics: true,
})

const ALLOWED_ORIGINS = ['https://recruiterrr.com', 'http://localhost:3000']

// ─── CARRIER FINGERPRINTS ────────────────────────────────────────────────────
const INTEGRITY_CARRIERS = ['humana', 'aetna', 'cigna', 'wellcare', 'devoted health', 'devoted', 'ffl', 'family first life']
const AMERILIFE_CARRIERS = ['humana', 'aetna', 'unitedhealthcare', 'united health', 'uhc', 'cigna', 'wellcare']
const SMS_CARRIERS = ['mutual of omaha', 'medico', 'gpm life', 'american equity', 'north american', 'north american company']

// ─── LANGUAGE FINGERPRINTS ───────────────────────────────────────────────────
const INTEGRITY_SIGNALS = [
  'integrity partner', 'integrity marketing', 'ffl agent', 'family first life',
  'integrityconnect', 'medicarecenter', 'life of the southwest', 'integrity connect',
  'integrity.com', 'integrity-partner', 'proud integrity'
]
const AMERILIFE_SIGNALS = [
  'amerilife', 'usabg', 'amerilife affiliate', 'amerilife partner',
  'amerilife.com', 'united senior benefits group'
]
const SMS_SIGNALS = [
  'senior market sales', 'sms partner', 'rethinking retirement',
  'seniormarketsales.com', 'sms family', 'sms affiliate'
]

function extractFacebookHandle(url: string): string | null {
  try {
    const match = url.match(/facebook\.com\/([^/?&#]+)/)
    if (match && match[1] && match[1] !== 'pages' && match[1] !== 'groups') {
      return match[1]
    }
  } catch {}
  return null
}

function scoreCarriers(carriers: string[]): { integrity: number; amerilife: number; sms: number; signals: string[] } {
  const lower = carriers.map(c => c.toLowerCase())
  const signals: string[] = []
  let integrity = 0, amerilife = 0, sms = 0

  // Count matching carriers per tree
  const integrityMatches = lower.filter(c => INTEGRITY_CARRIERS.some(k => c.includes(k) || k.includes(c)))
  const amerilifeMatches = lower.filter(c => AMERILIFE_CARRIERS.some(k => c.includes(k) || k.includes(c)))
  const smsMatches = lower.filter(c => SMS_CARRIERS.some(k => c.includes(k) || k.includes(c)))

  if (integrityMatches.length >= 2) { integrity += 20; signals.push(`Carrier mix: ${integrityMatches.join(' + ')} [INTEGRITY pattern]`) }
  else if (integrityMatches.length === 1) { integrity += 8 }

  if (smsMatches.length >= 1) { sms += 25; signals.push(`Carrier: ${smsMatches.join(', ')} [SMS fingerprint]`) }

  // AmeriLife shares carriers with Integrity — only signal if no SMS match
  if (amerilifeMatches.length >= 2 && smsMatches.length === 0) { amerilife += 15; signals.push(`Carrier mix: ${amerilifeMatches.join(' + ')} [AmeriLife compatible]`) }

  return { integrity, amerilife, sms, signals }
}

function scoreText(text: string): { integrity: number; amerilife: number; sms: number; signals: string[] } {
  const lower = text.toLowerCase()
  const signals: string[] = []
  let integrity = 0, amerilife = 0, sms = 0

  for (const s of INTEGRITY_SIGNALS) {
    if (lower.includes(s)) { integrity += 30; signals.push(`Text: "${s}" language detected [INTEGRITY]`); break }
  }
  for (const s of AMERILIFE_SIGNALS) {
    if (lower.includes(s)) { amerilife += 35; signals.push(`Text: "${s}" language detected [AMERILIFE]`); break }
  }
  for (const s of SMS_SIGNALS) {
    if (lower.includes(s)) { sms += 35; signals.push(`Text: "${s}" language detected [SMS]`); break }
  }

  return { integrity, amerilife, sms, signals }
}

// ─── CHAIN RESOLVER ──────────────────────────────────────────────────────────
// Second-pass function that runs after tree prediction.
// Takes the predicted tree + agent state, pulls geo-filtered candidate partners
// from the network library, runs a single targeted SERP query against them,
// and returns the best sub-IMO match with confidence + signals.
// Only fires when tree confidence >= 40. Returns null if no match clears threshold.

type ChainResult = {
  predicted_sub_imo: string
  predicted_sub_imo_confidence: number
  predicted_sub_imo_signals: string[]
  predicted_sub_imo_partner_id: number
} | null

async function resolveChain(
  agentName: string,
  agentState: string,
  tree: 'integrity' | 'amerilife' | 'sms',
  serpKey: string
): Promise<ChainResult> {
  try {
    // Get geo-filtered candidates (same state first, then neighbors, fallback national)
    const candidates = getCandidatePartners(tree, agentState).slice(0, 8)
    if (candidates.length === 0) return null

    // Build a single batched SERP query: agent name + OR list of candidate names/aliases
    const partnerTerms = candidates.flatMap(p => [
      `"${p.name}"`,
      ...(p.aliases || []).map(a => `"${a}"`),
    ]).join(' OR ')

    const q = `"${agentName}" (${partnerTerms})`
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&num=8&api_key=${serpKey}`
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) })
    if (!res.ok) return null

    const data = await res.json()
    const results = data.organic_results || []
    if (results.length === 0) return null

    // Score each candidate against the snippets
    const snippetBlob = results
      .map((r: any) => `${r.title || ''} ${r.snippet || ''} ${r.link || ''}`)
      .join(' ')
      .toLowerCase()

    type CandidateScore = { partner: NetworkPartner; score: number; signals: string[] }
    const scored: CandidateScore[] = []

    for (const partner of candidates) {
      let score = 0
      const signals: string[] = []
      const nameLower = partner.name.toLowerCase()
      const websiteLower = partner.website.toLowerCase().replace('www.', '')

      // Name hit in snippets
      if (snippetBlob.includes(nameLower)) {
        score += 40
        signals.push(`SERP: "${partner.name}" found in search results`)
      }

      // Alias hits
      for (const alias of partner.aliases || []) {
        if (snippetBlob.includes(alias.toLowerCase())) {
          score += 35
          signals.push(`SERP: alias "${alias}" found in results`)
          break
        }
      }

      // Website domain hit (strong signal — means agent is actually linked to them)
      if (snippetBlob.includes(websiteLower)) {
        score += 50
        signals.push(`SERP: domain "${partner.website}" found in results`)
      }

      // Boost for same-state match (candidate's HQ state matches agent state)
      if (partner.state === agentState.toUpperCase()) {
        score += 15
        signals.push(`Geographic: ${partner.name} headquartered in same state (${agentState.toUpperCase()})`)
      }

      // Check individual result pages for direct co-mentions
      for (const r of results.slice(0, 4)) {
        const combined = `${r.title || ''} ${r.snippet || ''} ${r.link || ''}`.toLowerCase()
        const nameHit = combined.includes(nameLower)
        const agentHit = combined.includes(agentName.toLowerCase())
        if (nameHit && agentHit) {
          score += 25
          signals.push(`SERP: "${r.title?.slice(0, 60)}" co-mentions agent + ${partner.name}`)
          break
        }
      }

      if (score > 0) scored.push({ partner, score, signals })
    }

    if (scored.length === 0) return null

    // Sort by score, take the best
    scored.sort((a, b) => b.score - a.score)
    const best = scored[0]

    // Minimum threshold — don't return noise
    if (best.score < 40) return null

    // Map raw score to a 0-100 confidence. Cap at 92 — we never claim certainty from SERP alone
    const confidence = Math.min(92, Math.round((best.score / 130) * 100))

    return {
      predicted_sub_imo: best.partner.name,
      predicted_sub_imo_confidence: confidence,
      predicted_sub_imo_signals: best.signals.slice(0, 4),
      predicted_sub_imo_partner_id: best.partner.id,
    }
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Try anathema_specimens first (logged observations from dashboard table)
  const { data: specimen, error: specimenError } = await supabase
    .from('anathema_specimens')
    .select('*')
    .eq('id', id)
    .eq('clerk_id', userId)
    .single()

  if (specimen && !specimenError) {
    // Reconstruct the scan shape the page expects
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
          // Chain resolver fields — null-safe for specimens logged before this feature
          predicted_sub_imo: specimen.predicted_sub_imo || null,
          predicted_sub_imo_confidence: specimen.predicted_sub_imo_confidence || null,
          predicted_sub_imo_signals: specimen.predicted_sub_imo_signals || [],
          predicted_sub_imo_partner_id: specimen.predicted_sub_imo_partner_id || null,
        },
      }
    })
  }

  // Fall back to anathema_scans table
  const { data, error } = await supabase
    .from('anathema_scans')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ scan: data })
}

export async function POST(req: NextRequest) {
  // CSRF check
  const origin = req.headers.get('origin')
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Auth
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit
  const { success } = await ratelimit.limit(userId)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const body = await req.json()
  const { action } = body

  // ─── SAVE OBSERVATION ─────────────────────────────────────────────────────
  if (action === 'log_observation') {
    const {
      agent_name, city, state,
      predicted_tree, predicted_confidence, prediction_signals, prediction_reasoning,
      facebook_profile_url, facebook_about,
      confirmed_tree, confirmed_tree_other, confirmed_sub_imo, recruiter_notes,
      agent_website, agent_address,
      // Chain resolver fields — optional, present on scans after this feature shipped
      predicted_sub_imo, predicted_sub_imo_confidence, predicted_sub_imo_signals, predicted_sub_imo_partner_id,
    } = body

    // Check for existing specimen (upsert by agent+user)
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
          facebook_profile_url, facebook_about,
          confirmed_tree, confirmed_tree_other, confirmed_sub_imo, recruiter_notes,
          // Chain fields — only update if present (don't overwrite with undefined)
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
          facebook_profile_url, facebook_about,
          confirmed_tree, confirmed_tree_other, confirmed_sub_imo, recruiter_notes,
          // Chain fields — nullable, gracefully absent on pre-feature logs
          predicted_sub_imo: predicted_sub_imo || null,
          predicted_sub_imo_confidence: predicted_sub_imo_confidence || null,
          predicted_sub_imo_signals: predicted_sub_imo_signals || null,
          predicted_sub_imo_partner_id: predicted_sub_imo_partner_id || null,
        })
        .select('id')
        .single()
      specimenId = inserted?.id
    }

    // Always write a history entry so every change is tracked over time
    await supabase.from('anathema_observation_history').insert({
      specimen_id: specimenId,
      clerk_id: userId,
      agent_name, city, state,
      confirmed_tree, confirmed_tree_other, confirmed_sub_imo, recruiter_notes,
      predicted_tree, predicted_confidence,
    })

    return NextResponse.json({ ok: true })
  }

  // ─── CHECK EXISTING SPECIMEN ──────────────────────────────────────────────
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

  // ─── RUN SCAN ─────────────────────────────────────────────────────────────
  const { agent } = body
  if (!agent) return NextResponse.json({ error: 'Missing agent' }, { status: 400 })

  const serpKey = process.env.SERPAPI_KEY
  let integrityScore = 0, amerilifeScore = 0, smsScore = 0
  const allSignals: string[] = []
  let facebookProfileUrl: string | null = null
  let facebookAbout: string | null = null

  // TIER 1 — Carrier match
  if (agent.carriers?.length > 0) {
    const carrierResult = scoreCarriers(agent.carriers)
    integrityScore += carrierResult.integrity
    amerilifeScore += carrierResult.amerilife
    smsScore += carrierResult.sms
    allSignals.push(...carrierResult.signals)
  }

  // TIER 1 — Text grep (website content, notes, about)
  const textBlob = [agent.notes || '', agent.about || ''].join(' ')
  if (textBlob.trim()) {
    const textResult = scoreText(textBlob)
    integrityScore += textResult.integrity
    amerilifeScore += textResult.amerilife
    smsScore += textResult.sms
    allSignals.push(...textResult.signals)
  }

  // TIER 2 — SerpAPI Google affiliation search
  try {
    const q = `"${agent.name}" integrity OR amerilife OR "senior market sales" OR "FMO partner"`
    const serpUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&num=5&api_key=${serpKey}`
    const serpRes = await fetch(serpUrl, { signal: AbortSignal.timeout(6000) })
    if (serpRes.ok) {
      const serpData = await serpRes.json()
      const results = serpData.organic_results || []
      const snippets = results.map((r: any) => `${r.title || ''} ${r.snippet || ''}`.toLowerCase()).join(' ')

      if (results.length > 0) {
        const googleResult = scoreText(snippets)
        integrityScore += googleResult.integrity
        amerilifeScore += googleResult.amerilife
        smsScore += googleResult.sms

        // Surface specific Google evidence
        for (const r of results.slice(0, 3)) {
          const combined = `${r.title || ''} ${r.snippet || ''}`.toLowerCase()
          if (combined.includes('integrity')) allSignals.push(`Google: "${r.title}" — Integrity reference found`)
          else if (combined.includes('amerilife')) allSignals.push(`Google: "${r.title}" — AmeriLife reference found`)
          else if (combined.includes('senior market sales') || combined.includes('sms partner')) allSignals.push(`Google: "${r.title}" — SMS reference found`)
        }
      }
    }
  } catch {}

  // TIER 3 — Facebook profile
  try {
    const fbSearchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(`"${agent.name}" site:facebook.com`)}&num=3&api_key=${serpKey}`
    const fbSearchRes = await fetch(fbSearchUrl, { signal: AbortSignal.timeout(5000) })
    if (fbSearchRes.ok) {
      const fbSearchData = await fbSearchRes.json()
      const fbResult = (fbSearchData.organic_results || []).find((r: any) => r.link?.includes('facebook.com'))
      if (fbResult?.link) {
        const handle = extractFacebookHandle(fbResult.link)
        if (handle) {
          facebookProfileUrl = fbResult.link
          try {
            const fbProfileUrl = `https://serpapi.com/search.json?engine=facebook_profile&profile_id=${handle}&api_key=${serpKey}`
            const fbProfileRes = await fetch(fbProfileUrl, { signal: AbortSignal.timeout(5000) })
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
                  allSignals.push(`Facebook profile found — no direct affiliation language`)
                }
              } else {
                allSignals.push(`Facebook: Profile located — about section empty`)
              }
            }
          } catch {}
        }
      } else {
        allSignals.push(`Facebook: No profile located`)
      }
    }
  } catch {
    allSignals.push(`Facebook: Search unavailable`)
  }

  if (allSignals.length === 0) {
    allSignals.push('No affiliation signals detected in available data')
  }

  // ─── CLAUDE HAIKU PREDICTION ──────────────────────────────────────────────
  const prompt = `You are ANATHEMA, a pathogen analysis system for the US insurance distribution market. Your job is to predict which of three major distribution trees an insurance agent belongs to, based on collected signals.

THE THREE TREES:
1. INTEGRITY MARKETING GROUP — Carriers: Humana, Aetna, Cigna, WellCare, Devoted Health. Language: "FFL", "Family First Life", "IntegrityCONNECT", "MedicareCENTER". Geographic: TX, OK, Southeast. Acquisition-heavy with many branded affiliates.
2. AMERILIFE — Carriers: Humana, Aetna, UnitedHealthcare, Cigna, WellCare. Language: "AmeriLife affiliate", "USABG". Geographic: FL (Clearwater HQ), Southeast, Midwest. Many affiliates hosted on AmeriLife subdomains.
3. SENIOR MARKET SALES (SMS) — Carriers: Mutual of Omaha, Medico, GPM Life, American Equity, North American Company. Language: "SMS partner", "Senior Market Sales", "Rethinking Retirement". Geographic: NE (Omaha HQ), IA, MN, NJ, SC. Long-standing family-owned agencies.

AGENT: ${agent.name}
Location: ${agent.city || ''}, ${agent.state || ''}
Carriers: ${(agent.carriers || []).join(', ') || 'Unknown'}
Pre-scored signals: Integrity=${integrityScore}, AmeriLife=${amerilifeScore}, SMS=${smsScore}

RAW SIGNALS COLLECTED:
${allSignals.map(s => `- ${s}`).join('\n')}

Based on these signals, provide a JSON prediction. Rules:
- If confidence < 35, use predicted_tree: "unknown"
- signals_used should be the 2-4 most compelling specific signals
- reasoning should be 1-2 sentences maximum

Respond with ONLY valid JSON, no markdown:
{
  "predicted_tree": "integrity" | "amerilife" | "sms" | "unknown",
  "confidence": 0-100,
  "signals_used": ["signal 1", "signal 2"],
  "reasoning": "1-2 sentences"
}`

  let prediction = {
    predicted_tree: 'unknown',
    confidence: 0,
    signals_used: allSignals.slice(0, 4),
    reasoning: 'Insufficient signals to determine affiliation.'
  }

  try {
    const claudeRes = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = (claudeRes.content[0] as any).text || ''
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    prediction = parsed
  } catch {}

  // ─── CHAIN RESOLVER ───────────────────────────────────────────────────────
  // Only run if the tree prediction cleared the confidence threshold.
  // Fires concurrently — doesn't block the response if it times out.
  let chainResult: ChainResult = null
  if (
    prediction.predicted_tree !== 'unknown' &&
    prediction.confidence >= 40 &&
    agent.state &&
    serpKey
  ) {
    chainResult = await resolveChain(
      agent.name,
      agent.state,
      prediction.predicted_tree as 'integrity' | 'amerilife' | 'sms',
      serpKey
    )
  }

  return NextResponse.json({
    predicted_tree: prediction.predicted_tree,
    confidence: prediction.confidence,
    signals_used: prediction.signals_used,
    reasoning: prediction.reasoning,
    facebook_profile_url: facebookProfileUrl,
    facebook_about: facebookAbout,
    // Chain resolver results — null if tree confidence too low or no match found
    predicted_sub_imo: chainResult?.predicted_sub_imo ?? null,
    predicted_sub_imo_confidence: chainResult?.predicted_sub_imo_confidence ?? null,
    predicted_sub_imo_signals: chainResult?.predicted_sub_imo_signals ?? [],
    predicted_sub_imo_partner_id: chainResult?.predicted_sub_imo_partner_id ?? null,
  })
}
