export const runtime = 'nodejs'
export const maxDuration = 180

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

import { scoreSMSCarriers, buildNetworkSignalIndex } from '@/lib/domain/anathema/signals'
import { enrichWithApify, apifyToSerpSnippets } from '@/lib/domain/anathema/apify'
import { gatherEvidence, analyzeEvidence, enrichFromDB, subimoConfidenceToNumber } from '@/lib/domain/anathema/analyzer'
import { extractDavidFacts } from '@/lib/domain/anathema/david-facts'
import type { DavidFactsInput } from '@/lib/domain/anathema/david-facts'
import { saveObservation, checkExistingSpecimen, getSpecimen, getScan, saveDavidFacts } from '@/lib/db/anathema'
import { hasActiveSubscription } from '@/lib/auth/access'
import { supabase } from '@/lib/supabase.server'

import { ALLOWED_ORIGINS } from '@/lib/config'

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await hasActiveSubscription(userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // ─── CHECK EXISTING (moved from POST) ───────────────────────────────────────
  // GET /api/anathema?name=...&city=...&state=...
  const nameParam = req.nextUrl.searchParams.get('name')
  if (nameParam !== null) {
    const cityParam  = req.nextUrl.searchParams.get('city')  ?? ''
    const stateParam = req.nextUrl.searchParams.get('state') ?? ''
    const specimen = await checkExistingSpecimen(userId, nameParam, cityParam, stateParam)
    return NextResponse.json({ specimen })
  }

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
  if (!(await hasActiveSubscription(userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { action } = body

  // ─── SAVE OBSERVATION ───────────────────────────────────────────────────────
  // These actions don't call external APIs — skip rate limiter
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

    // If recruiter manually confirmed an unknown tree, write to discovered_fmos
    if (body.confirmed_tree === 'other' && body.confirmed_tree_other?.trim()) {
      try {
        await supabase.rpc('upsert_discovered_fmo', {
          p_name: body.confirmed_tree_other.trim(),
          p_evidence: {
            quote: `Manually confirmed by recruiter for agent ${body.agent_name}`,
            source_url: body.agent_website || '',
            agent_name: body.agent_name,
            confidence: 'HIGH',
            seen_at: new Date().toISOString(),
          },
          p_state: body.state || '',
          p_confidence: 'HIGH',
        })
      } catch (err) {
        console.warn('[discovered_fmos] manual upsert failed:', err)
      }
    }

    return NextResponse.json({ ok: true, id: saved.id })
  }

  // ─── SAVE DAVID FACTS ───────────────────────────────────────────────────────
  if (action === 'save_david_facts') {
    let specimenId: string | null = null
    if (body.david_facts) {
      await saveDavidFacts(userId, body.agent_name, body.city, body.state, body.david_facts)
      // Return the specimen id so the client can skip a follow-up check_existing call
      const specimen = await checkExistingSpecimen(userId, body.agent_name, body.city, body.state)
      specimenId = specimen?.id ?? null
    }
    return NextResponse.json({ ok: true, id: specimenId })
  }

  // ─── RUN SCAN ───────────────────────────────────────────────────────────────
  // Only scans hit external APIs — apply rate limit here
  const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(20, '1 h'), analytics: true })
  const { success } = await ratelimit.limit(userId)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  const { agent } = body
  if (!agent) return NextResponse.json({ error: 'Missing agent' }, { status: 400 })

  const serpKey = process.env.SERPAPI_KEY!

  // ── Build network signal index — used as hints for the AI, not constraints ──
  const networkSignals = await buildNetworkSignalIndex()

  // ── Pre-scored signals from carrier fingerprint + profile text ──────────────
  const extraSignals: string[] = []

  if (agent.carriers?.length > 0) {
    const smsCarriers = scoreSMSCarriers(agent.carriers)
    if (smsCarriers.signals.length > 0) extraSignals.push(...smsCarriers.signals)
  }

  const textBlob = [agent.notes || '', agent.about || ''].join(' ').trim()
  if (textBlob) extraSignals.push(`Profile text: ${textBlob.slice(0, 300)}`)

  // ── Social FB URL from website crawl (higher confidence than SERP guess) ────
  const socialFbUrl = (agent.social_links || []).find((l: string) =>
    l.includes('facebook.com') &&
    !l.includes('facebook.com/sharer') &&
    !l.includes('facebook.com/share')
  ) || null

  // ─── STEP 1: Gather evidence — 4 parallel fetches ───────────────────────────
  const {
    evidenceBlob,
    facebookProfileUrl,
    facebookAbout,
    facebookPostText,
    serpDebug,
  } = await gatherEvidence(
    agent.name,
    agent.state || '',
    agent.city || '',
    serpKey,
    socialFbUrl,
  )

  // ── Prometheus cross-reference ───────────────────────────────────────────────
  // Check if any Prometheus-profiled FMO appears in the evidence we just gathered.
  // If found, inject intel as extra signals for the AI.
  try {
    const evidenceLower = evidenceBlob.toLowerCase()
    const { data: prometheusScans } = await supabase
      .from('prometheus_scans')
      .select('domain, verdict, vendor_tier, actively_recruiting, analysis_json, score')
      .order('created_at', { ascending: false })
      .limit(200)

    if (prometheusScans) {
      for (const scan of prometheusScans) {
        const fmoName = (scan.domain || '').toLowerCase().trim()
        if (!fmoName || fmoName.length < 4) continue
        if (!evidenceLower.includes(fmoName)) continue

        const aj = scan.analysis_json as any
        const tree = aj?.tree_affiliation || scan.vendor_tier || null
        const recruiting = scan.actively_recruiting
        const sentiment = aj?.agent_sentiment?.common_complaints?.join('; ') || null
        const salesAngle = aj?.sales_angles?.recruiting_pain || null

        let prometheusSignal = `Prometheus DB match: "${scan.domain}" (${scan.verdict || 'UNKNOWN'} agency`
        if (tree && tree !== 'Independent') prometheusSignal += `, tree: ${tree}`
        if (recruiting) prometheusSignal += `, actively recruiting`
        if (sentiment) prometheusSignal += `. Agent complaints: ${sentiment.slice(0, 100)}`
        if (salesAngle) prometheusSignal += `. Recruiting pain: ${salesAngle.slice(0, 100)}`
        prometheusSignal += `)`
        extraSignals.push(prometheusSignal)

        break // First/strongest match only
      }
    }
  } catch {
    // Prometheus lookup failed — continue without it
  }

  // ── Apify enrichment — only if confidence will be low ────────────────────────
  // We don't know confidence yet, so run a quick pre-check:
  // If we have a FB URL and Apify is available, fire it now in parallel
  // with the AI analysis call below. We'll merge the results after.
  let apifyEvidenceExtra = ''
  let apifyPostCount = 0
  let apifyVideoCount = 0
  let apifyUsed = false

  const hasApifyTargets = !!(facebookProfileUrl || agent.youtube_channel)
  const apifyAvailable = !!(hasApifyTargets && process.env.APIFY_API_KEY && process.env.ENRICHMENT_SECRET)

  // ─── STEP 2: Analyze evidence — one Sonnet call ──────────────────────────────
  // Run AI analysis. If result comes back low confidence AND Apify is available,
  // we'll run Apify and do a second AI call with the enriched evidence.
  let analysis = await analyzeEvidence(
    agent.name,
    agent.state || '',
    evidenceBlob,
    networkSignals,
    extraSignals,
  )

  // ── Apify enrichment on low confidence ──────────────────────────────────────
  if (apifyAvailable && analysis.tree_confidence < 55) {
    try {
      const apifyEnrichment = await enrichWithApify({
        facebookProfileUrl,
        youtubeChannelUrl: agent.youtube_channel || null,
      })

      apifyPostCount = apifyEnrichment.facebookPosts.length
      apifyVideoCount = apifyEnrichment.youtubeVideos.length

      if (apifyPostCount > 0 || apifyVideoCount > 0) {
        apifyUsed = true
        apifyEvidenceExtra = [apifyEnrichment.facebookText, apifyEnrichment.youtubeText]
          .filter(Boolean).join('\n')

        // Add Apify snippets to debug trail
        const apifySnippets = apifyToSerpSnippets(apifyEnrichment)
        serpDebug.push({
          query: `apify_facebook:${facebookProfileUrl || 'n/a'}`,
          source: 'apify_facebook_posts',
          results: apifySnippets.filter(s => s.title.startsWith('Facebook')).slice(0, 5).map(s => ({
            title: s.title, url: s.url, snippet: s.snippet.slice(0, 200), signals_matched: [],
          })),
        })

        // Re-analyze with richer evidence
        analysis = await analyzeEvidence(
          agent.name,
          agent.state || '',
          [evidenceBlob, apifyEvidenceExtra].join('\n\n'),
          networkSignals,
          extraSignals,
        )
      }
    } catch {
      // Apify failed — use first analysis result
    }
  }

  // ─── STEP 3: DB enrichment ───────────────────────────────────────────────────
  let subimoPartnerId: string | null = null
  let subimoIsNewDiscovery = false
  let subimoNumericConfidence: number | null = null

  if (analysis.subimo && analysis.subimo_confidence) {
    const { id, isNewDiscovery } = await enrichFromDB(
      analysis.subimo,
      analysis.tree !== 'unknown' ? analysis.tree : 'integrity', // best guess tree for lookup
      agent.name,
      agent.state || '',
      analysis.subimo_evidence || '',
      analysis.subimo_confidence,
    )
    subimoPartnerId = id
    subimoIsNewDiscovery = isNewDiscovery
    subimoNumericConfidence = subimoConfidenceToNumber(
      analysis.subimo_confidence,
      analysis.subimo_evidence_type,
      !isNewDiscovery,
    )
  }

  // Build sub-IMO signals for the UI
  const subimoSignals = analysis.subimo ? [{
    tier: analysis.subimo_confidence === 'HIGH' ? 'HIGH' as const
      : analysis.subimo_confidence === 'MED' ? 'MED' as const
      : 'LOW' as const,
    type: analysis.subimo_evidence_type === 'contracting_language' ? 'relationship' as const
      : analysis.subimo_evidence_type === 'domain_signal' ? 'domain' as const
      : analysis.subimo_evidence_type === 'association_event' ? 'association' as const
      : 'comention' as const,
    entity: analysis.subimo,
    text: analysis.subimo_evidence || '',
    source: 'ai_inference' as const,
  }] : []

  // Prediction source label
  const predictionSource: 'brand_language' | 'chain_resolver' | 'both' | null = analysis.tree !== 'unknown'
    ? (analysis.subimo ? 'both' : 'brand_language')
    : analysis.subimo
    ? 'chain_resolver'
    : null

  // ── DAVID facts extraction ───────────────────────────────────────────────────
  const davidFactsInput: DavidFactsInput = {
    agentName: agent.name,
    serpSnippets: serpDebug.flatMap(e => e.results.map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
    }))),
    facebookAbout,
    facebookPostText: facebookPostText || null,
    facebookProfileUrl,
    agentWebsite: agent.website || null,
    agentNotes: agent.notes || null,
    agentAbout: agent.about || null,
    apifyFacebookPostCount: apifyPostCount,
    apifyYouTubeVideoCount: apifyVideoCount,
  }

  const davidFacts = await extractDavidFacts(davidFactsInput)

  // ── Apify fire-and-forget for David enrichment — fast path only ──────────────
  // intentional: fire-and-forget — Vercel worker handles this in its own function lifetime
  if (!apifyUsed && hasApifyTargets && process.env.APIFY_API_KEY && process.env.ENRICHMENT_SECRET) {
    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`
    fetch(`${baseUrl}/api/david/enrich`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-enrichment-secret': process.env.ENRICHMENT_SECRET,
      },
      body: JSON.stringify({
        userId,
        agentName: agent.name,
        agentCity: agent.city,
        agentState: agent.state,
        facebookProfileUrl: facebookProfileUrl || null,
        youtubeChannelUrl: agent.youtube_channel || null,
        serpSnippets: serpDebug.flatMap(e => e.results.map(r => ({
          title: r.title, url: r.url, snippet: r.snippet,
        }))),
        facebookAbout: facebookAbout || null,
        facebookPostText: facebookPostText || null,
        agentWebsite: agent.website || null,
        agentNotes: agent.notes || null,
        agentAbout: agent.about || null,
      }),
    }).catch(err => console.warn('[Apify enrich] fire-and-forget failed:', err))
  }

  // ─── Return ──────────────────────────────────────────────────────────────────
  return NextResponse.json({
    predicted_tree: analysis.tree,
    confidence: analysis.tree_confidence,
    signals_used: analysis.signals_used,
    reasoning: analysis.reasoning,
    prediction_source: predictionSource,
    facebook_profile_url: facebookProfileUrl,
    facebook_about: facebookAbout,
    predicted_sub_imo: analysis.subimo ?? null,
    predicted_sub_imo_confidence: subimoNumericConfidence,
    predicted_sub_imo_signals: subimoSignals,
    predicted_sub_imo_partner_id: subimoPartnerId,
    predicted_sub_imo_proof_url: null,
    predicted_sub_imo_is_new_discovery: subimoIsNewDiscovery,
    unresolved_upline: subimoIsNewDiscovery ? analysis.subimo : null,
    unresolved_upline_evidence: subimoIsNewDiscovery ? analysis.subimo_evidence : null,
    unresolved_upline_source_url: null,
    unresolved_upline_confidence: subimoIsNewDiscovery ? analysis.subimo_confidence : null,
    apify_used_in_prediction: apifyUsed,
    serp_debug: serpDebug,
    david_facts: davidFacts,
  })
}
