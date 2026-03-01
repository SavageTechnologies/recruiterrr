export const runtime = 'nodejs'
export const maxDuration = 60  // ANATHEMA scan: SERP + Claude + FB fetch, no Apify

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

import { scoreSMSCarriers, scanResultAgainstNetwork, aggregateMatches } from '@/lib/domain/anathema/signals'
import type { NetworkMatch } from '@/lib/domain/anathema/signals'
import { resolveChain } from '@/lib/domain/anathema/chain-resolver'
import type { ChainResult } from '@/lib/domain/anathema/chain-resolver'
import { huntUnresolvedUpline } from '@/lib/domain/anathema/upline-hunter'
import { fetchFacebookProfile } from '@/lib/domain/anathema/facebook'
import { extractDavidFacts } from '@/lib/domain/anathema/david-facts'
import type { DavidFactsInput } from '@/lib/domain/anathema/david-facts'
import { saveObservation, checkExistingSpecimen, getSpecimen, getScan, saveDavidFacts } from '@/lib/db/anathema'


const ALLOWED_ORIGINS = ['https://recruiterrr.com', 'http://localhost:3000']

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

const specimen = await getSpecimen(userId, id)
  if (specimen) {
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
        david_facts: specimen.david_facts || null,
      }
    })
  }

  const scan = await getScan(userId, id)
  if (!scan) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ scan })
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(20, '1 h'), analytics: true })
  // const { success } = await ratelimit.limit(userId)
  // if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const body = await req.json()
  const { action } = body

 // ─── SAVE OBSERVATION ─────────────────────────────────────────────────────
  if (action === 'log_observation') {
    const saved = await saveObservation({
      userId,
      agent_name: body.agent_name,
      city: body.city,
      state: body.state,
      agent_website: body.agent_website,
      agent_address: body.agent_address,
      predicted_tree: body.predicted_tree,
      predicted_confidence: body.predicted_confidence,
      prediction_signals: body.prediction_signals,
      prediction_reasoning: body.prediction_reasoning,
      prediction_source: body.prediction_source,
      facebook_profile_url: body.facebook_profile_url,
      facebook_about: body.facebook_about,
      confirmed_tree: body.confirmed_tree,
      confirmed_tree_other: body.confirmed_tree_other,
      confirmed_sub_imo: body.confirmed_sub_imo,
      recruiter_notes: body.recruiter_notes,
      predicted_sub_imo: body.predicted_sub_imo,
      predicted_sub_imo_confidence: body.predicted_sub_imo_confidence,
      predicted_sub_imo_signals: body.predicted_sub_imo_signals,
      predicted_sub_imo_partner_id: body.predicted_sub_imo_partner_id,
      serp_debug: body.serp_debug,
      unresolved_upline: body.unresolved_upline,
      david_facts: body.david_facts,
    })
    return NextResponse.json({ ok: true, id: saved.id })
  }

    // ─── SAVE DAVID FACTS ─────────────────────────────────────────────────────
    if (action === 'save_david_facts') {
        if (body.david_facts) {
          await saveDavidFacts(userId, body.agent_name, body.city, body.state, body.david_facts)
        }
        return NextResponse.json({ ok: true })
      }

      // ─── CHECK EXISTING ───────────────────────────────────────────────────────
      if (action === 'check_existing') {
        const specimen = await checkExistingSpecimen(userId, body.agent_name, body.city, body.state)
        return NextResponse.json({ specimen })
      }

  // ─── RUN SCAN ─────────────────────────────────────────────────────────────
  const { agent } = body
  if (!agent) return NextResponse.json({ error: 'Missing agent' }, { status: 400 })

  const serpKey = process.env.SERPAPI_KEY
  let integrityScore = 0, amerilifeScore = 0, smsScore = 0
  const allSignals: string[] = []
  let facebookProfileUrl: string | null = null
  let facebookAbout: string | null = null
  let facebookPostText = ''
  let autoDetectedSubImo: NetworkMatch | null = null

  // Audit trail of every query + match — stored as jsonb for full traceability
  const serpDebug: Array<{
    query: string
    source: string
    results: Array<{ title: string; url: string; snippet: string; signals_matched: string[] }>
  }> = []

  // ── SMS carrier check ───────────────────────────────────────────────────
  if (agent.carriers?.length > 0) {
    const smsCarriers = scoreSMSCarriers(agent.carriers)
    smsScore += smsCarriers.sms
    allSignals.push(...smsCarriers.signals)
  }

  // ── Profile text scan ───────────────────────────────────────────────────
  const textBlob = [agent.notes || '', agent.about || ''].join(' ')
  if (textBlob.trim()) {
    const textMatches = scanResultAgainstNetwork('', textBlob, agent.website || '')
    const agg = aggregateMatches(textMatches)
    integrityScore += agg.integrity
    amerilifeScore += agg.amerilife
    smsScore += agg.sms
    allSignals.push(...agg.signals.map(s => `Profile: ${s}`))
    if (agg.topPartnerMatch && !autoDetectedSubImo) autoDetectedSubImo = agg.topPartnerMatch
  }

  // ── SERP Pass 1: broad agent search ────────────────────────────────────
  const allNetworkMatches: NetworkMatch[] = []
  try {
    const q1 = `"${agent.name}" insurance ${agent.city || ''} ${agent.state || ''}`
    const res1 = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q1)}&num=8&api_key=${serpKey}`,
      { signal: AbortSignal.timeout(12000) }
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

  // ── SERP Pass 2: FMO/IMO context search ────────────────────────────────
  try {
    const q2 = `"${agent.name}" FMO OR IMO OR "insurance agent" OR "appointed" OR "contracted"`
    const res2 = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q2)}&num=8&api_key=${serpKey}`,
      { signal: AbortSignal.timeout(12000) }
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

  // Aggregate all SERP matches
  if (allNetworkMatches.length > 0) {
    const agg = aggregateMatches(allNetworkMatches)
    integrityScore += agg.integrity
    amerilifeScore += agg.amerilife
    smsScore += agg.sms
    allSignals.push(...agg.signals.map(s => `Google: ${s}`))
    if (agg.topPartnerMatch && !autoDetectedSubImo) autoDetectedSubImo = agg.topPartnerMatch
  }

  // Collect snippets for the unresolved upline hunter
  const serpSnippetsForHunter: string[] = []
  for (const entry of serpDebug) {
    for (const r of entry.results) {
      if (r.snippet) serpSnippetsForHunter.push(r.snippet)
    }
  }

  // ── SERP Pass 3: Facebook ───────────────────────────────────────────────
  // Check agent.social_links first — website crawl already found FB URL for
  // many agents. Use it as a seed so Apify fires even when SerpAPI FB fails.
  const socialFbUrl = (agent.social_links || []).find((l: string) =>
    l.includes('facebook.com') &&
    !l.includes('facebook.com/sharer') &&
    !l.includes('facebook.com/share')
  ) || null
  if (socialFbUrl) facebookProfileUrl = socialFbUrl

  const { result: fbResult, searchResults: fbSearchResults } = await fetchFacebookProfile(agent.name, serpKey!)

  serpDebug.push({
    query: `"${agent.name}" site:facebook.com`,
    source: 'facebook_search',
    results: fbSearchResults.slice(0, 3).map((r: any) => ({
      title: r.title || '',
      url: r.link || '',
      snippet: (r.snippet || '').slice(0, 200),
      signals_matched: [],
    })),
  })

  if (fbResult) {
    // Only use the SERP-found URL if we didn't already find one directly on their site.
    // The website-extracted URL is higher confidence than a SERP name-match guess.
    if (!facebookProfileUrl) facebookProfileUrl = fbResult.profileUrl
    facebookAbout = fbResult.about || fbResult.postText.slice(0, 500)
    facebookPostText = fbResult.allText

    const fbMatches = scanResultAgainstNetwork('', fbResult.allText, fbResult.profileUrl, agent.name)
    const fbAgg = aggregateMatches(fbMatches)
    integrityScore += fbAgg.integrity
    amerilifeScore += fbAgg.amerilife
    smsScore += fbAgg.sms

    serpDebug.push({
      query: `facebook_profile:${fbResult.handle}`,
      source: 'facebook_profile',
      results: [{
        title: `Facebook profile — ${fbResult.handle}`,
        url: fbResult.profileUrl,
        snippet: fbResult.allText.slice(0, 200),
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
    allSignals.push('Facebook: No profile located')
  }

  if (allSignals.length === 0) allSignals.push('No affiliation signals detected in available data')

  // ── Haiku tree prediction ───────────────────────────────────────────────
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

  // ── Chain resolver ──────────────────────────────────────────────────────
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

  // ── Synthesize final prediction ─────────────────────────────────────────
  let finalTree = prediction.predicted_tree
  let finalConfidence = prediction.confidence
  let finalSignals = prediction.signals_used
  let finalReasoning = prediction.reasoning
  let predictionSource: 'brand_language' | 'chain_resolver' | 'both' | null = null

  if (prediction.predicted_tree !== 'unknown') predictionSource = 'brand_language'

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

  // ── Sub-IMO resolution ──────────────────────────────────────────────────
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

  // ── Unresolved upline hunter ────────────────────────────────────────────
  let unresolvedUpline = null
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

  // ── DAVID facts extraction (SERP-only, fast) ────────────────────────────
  // Runs immediately so the response is never blocked.
  // Apify deep enrichment runs in the background after response is sent
  // and overwrites david_facts in the DB — client picks it up on next load.
  const davidFactsInput: DavidFactsInput = {
    agentName: agent.name,
    serpSnippets: serpDebug.flatMap(e => e.results.map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
    }))),
    facebookAbout: facebookAbout,
    facebookPostText: facebookPostText || null,
    facebookProfileUrl: facebookProfileUrl,
    agentWebsite: agent.website || null,
    agentNotes: agent.notes || null,
    agentAbout: agent.about || null,
    apifyFacebookPostCount: 0,
    apifyYouTubeVideoCount: 0,
  }

  const davidFacts = await extractDavidFacts(davidFactsInput)

  // ── Apify deep enrichment — fire and forget to dedicated route ──────────
  // WHY: Vercel kills the function the moment this response is sent.
  // A .then() block after NextResponse.json() silently dies mid-execution.
  // The /api/david/enrich route has its own maxDuration = 300 budget and
  // stays alive independently. We fire it and don't wait.
  const hasApifyTargets = !!(facebookProfileUrl || agent.youtube_channel)
  if (hasApifyTargets && process.env.APIFY_API_KEY && process.env.ENRICHMENT_SECRET) {
    const enrichPayload = {
      userId,
      agentName: agent.name,
      agentCity: agent.city,
      agentState: agent.state,
      facebookProfileUrl: facebookProfileUrl || null,
      youtubeChannelUrl: agent.youtube_channel || null,
      serpSnippets: serpDebug.flatMap(e => e.results.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
      }))),
      facebookAbout: facebookAbout || null,
      facebookPostText: facebookPostText || null,
      agentWebsite: agent.website || null,
      agentNotes: agent.notes || null,
      agentAbout: agent.about || null,
    }

    // Derive base URL from the incoming request — works on prod, preview, and local
    // without relying on NEXT_PUBLIC_BASE_URL being set in the environment.
    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`

    // Fire-and-forget: no await, no catch needed — enrich route handles its own errors
    fetch(`${baseUrl}/api/david/enrich`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-enrichment-secret': process.env.ENRICHMENT_SECRET,
      },
      body: JSON.stringify(enrichPayload),
    }).catch(err => console.warn('[Apify enrich] fire-and-forget failed to dispatch:', err))
  }

  // ── Return ──────────────────────────────────────────────────────────────
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
    unresolved_upline: unresolvedUpline?.name ?? null,
    unresolved_upline_evidence: unresolvedUpline?.evidence ?? null,
    unresolved_upline_source_url: unresolvedUpline?.sourceUrl ?? null,
    unresolved_upline_confidence: unresolvedUpline?.confidence ?? null,
    serp_debug: serpDebug,
    david_facts: davidFacts,
  })
}
