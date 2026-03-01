// ─── app/api/david/enrich/route.ts ────────────────────────────────────────────
// Dedicated enrichment worker for deep Apify + David facts extraction.
//
// WHY THIS EXISTS AS A SEPARATE ROUTE:
// Vercel serverless functions die the moment a response is sent. The ANATHEMA
// route was firing Apify as a background .then() after returning — Vercel was
// tearing down the function mid-run. Nothing got saved. No error. Just silence.
//
// This route runs as its own function with maxDuration = 300 (Vercel Pro max).
// ANATHEMA calls it fire-and-forget via fetch() with no await — the response
// comes back instantly, this route does the heavy work in its own lifetime.
//
// SECURITY: Internal-only. Requires ENRICHMENT_SECRET header matching env var.
// Never exposed to the client. Called only from the ANATHEMA route.
//
// TIMEOUT BUDGET (total must stay under 280s with margin):
//   Apify Facebook actor:  120s max
//   Apify YouTube actor:   120s max  (parallel with FB)
//   Claude Haiku call:      15s max
//   DB write:               5s max
//   ─────────────────────────────
//   Parallel total:        ~145s — well within 300s

export const runtime = 'nodejs'
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { enrichWithApify, apifyToSerpSnippets } from '@/lib/domain/anathema/apify'
import { extractDavidFacts } from '@/lib/domain/anathema/david-facts'
import type { DavidFactsInput } from '@/lib/domain/anathema/david-facts'
import { saveDavidFacts } from '@/lib/db/anathema'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type EnrichRequest = {
  userId: string
  agentName: string
  agentCity: string
  agentState: string
  facebookProfileUrl: string | null
  youtubeChannelUrl: string | null
  // Base context from the ANATHEMA scan — passed in so we don't re-fetch
  serpSnippets: Array<{ title: string; url: string; snippet: string }>
  facebookAbout: string | null
  facebookPostText: string | null
  agentWebsite: string | null
  agentNotes: string | null
  agentAbout: string | null
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Auth: internal secret only ────────────────────────────────────────────
  const secret = req.headers.get('x-enrichment-secret')
  if (!secret || secret !== process.env.ENRICHMENT_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: EnrichRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    userId,
    agentName,
    agentCity,
    agentState,
    facebookProfileUrl,
    youtubeChannelUrl,
    serpSnippets,
    facebookAbout,
    facebookPostText,
    agentWebsite,
    agentNotes,
    agentAbout,
  } = body

  if (!userId || !agentName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Respond immediately — Vercel needs the response open to keep running,
  // but we want the caller to move on. We'll do the work below.
  // Note: unlike fire-and-forget .then(), this route STAYS ALIVE until
  // the handler returns, giving us the full maxDuration budget.

  try {
    // ── Step 1: Apify enrichment — FB + YT in parallel ──────────────────────
    // Both actors have 120s internal timeout. Running parallel keeps total
    // wall time at ~120s rather than ~240s.
    const hasTargets = !!(facebookProfileUrl || youtubeChannelUrl)
    if (!hasTargets || !process.env.APIFY_API_KEY) {
      return NextResponse.json({ ok: true, skipped: 'no targets or no api key' })
    }

    const apifyEnrichment = await enrichWithApify({
      facebookProfileUrl,
      youtubeChannelUrl,
    })

    const hasContent =
      apifyEnrichment.facebookPosts.length > 0 ||
      apifyEnrichment.youtubVideos.length > 0

    if (!hasContent) {
      return NextResponse.json({ ok: true, skipped: 'apify returned no content' })
    }

    // ── Step 2: Build enriched David facts input ──────────────────────────
    const apifySnippets = apifyToSerpSnippets(apifyEnrichment)

    const enrichedInput: DavidFactsInput = {
      agentName,
      serpSnippets: [
        ...(serpSnippets || []),
        ...apifySnippets,
      ],
      facebookAbout,
      facebookPostText: [facebookPostText, apifyEnrichment.facebookText]
        .filter(Boolean)
        .join('\n') || null,
      facebookProfileUrl,
      agentWebsite,
      agentNotes,
      agentAbout,
      apifyFacebookPostCount: apifyEnrichment.facebookPosts.length,
      apifyYouTubeVideoCount: apifyEnrichment.youtubVideos.length,
      scanDate: new Date().toISOString(),
    }

    // ── Step 3: Claude Haiku extraction — 15s timeout guard ──────────────
    const factsPromise = extractDavidFacts(enrichedInput)
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 15_000)
    )

    const enrichedFacts = await Promise.race([factsPromise, timeoutPromise])

    if (!enrichedFacts) {
      console.warn(`[david/enrich] Facts extraction timed out or returned null for ${agentName}`)
      return NextResponse.json({ ok: true, skipped: 'extraction timeout or empty' })
    }

    // ── Step 4: Save to DB ────────────────────────────────────────────────
    await saveDavidFacts(userId, agentName, agentCity, agentState, enrichedFacts)

    return NextResponse.json({
      ok: true,
      factsCount: enrichedFacts.facts.length,
      fbPosts: apifyEnrichment.facebookPosts.length,
      ytVideos: apifyEnrichment.youtubVideos.length,
    })

  } catch (err) {
    console.error('[david/enrich] Enrichment failed:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
