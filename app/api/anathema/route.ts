export const runtime    = 'nodejs'
export const maxDuration = 180

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

import { gatherEvidence, analyzeEvidence, detectAffiliationSignal } from '@/lib/domain/anathema/analyzer'
import { supabase } from '@/lib/supabase.server'
import { hasActiveSubscription } from '@/lib/auth/access'
import { ALLOWED_ORIGINS } from '@/lib/config'

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await hasActiveSubscription(userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const nameParam = req.nextUrl.searchParams.get('name')
  if (nameParam !== null) {
    const city  = req.nextUrl.searchParams.get('city')  ?? ''
    const state = req.nextUrl.searchParams.get('state') ?? ''
    const { data } = await supabase
      .from('anathema_specimens')
      .select('id, agent_name, city, state, agent_website, analysis_json, recruiter_notes, created_at')
      .eq('clerk_id', userId)
      .ilike('agent_name', nameParam)
      .eq('city', city)
      .eq('state', state)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    return NextResponse.json({ specimen: data || null })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (id) {
    const { data } = await supabase
      .from('anathema_specimens')
      .select('*')
      .eq('id', id)
      .eq('clerk_id', userId)
      .single()
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ scan: data })
  }

  // List recent specimens
  const { data } = await supabase
    .from('anathema_specimens')
    .select('id, agent_name, city, state, agent_website, created_at, recruiter_notes, analysis_json')
    .eq('clerk_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ specimens: data || [] })
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

  const body         = await req.json()
  const { action }   = body

  // ─── SAVE NOTES ─────────────────────────────────────────────────────────────
  if (action === 'save_notes') {
    const { id, recruiter_notes } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await supabase
      .from('anathema_specimens')
      .update({ recruiter_notes })
      .eq('id', id)
      .eq('clerk_id', userId)
    return NextResponse.json({ ok: true })
  }

  // ─── RUN SCAN ───────────────────────────────────────────────────────────────
  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(20, '1 h'),
    analytics: true,
  })
  const { success } = await ratelimit.limit(userId)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const { agent } = body
  if (!agent) return NextResponse.json({ error: 'Missing agent' }, { status: 400 })

  const serpKey   = process.env.SERPAPI_KEY!
  const socialFbUrl = (agent.social_links || []).find((l: string) =>
    l.includes('facebook.com') &&
    !l.includes('facebook.com/sharer') &&
    !l.includes('facebook.com/share'),
  ) || null

  // ── STEP 1: Gather evidence ─────────────────────────────────────────────────
  const {
    evidenceBlob,
    facebookProfileUrl,
    ownerNames,
    websitePagesFound,
    serpDebug,
  } = await gatherEvidence(
    agent.name,
    agent.city    || '',
    agent.state   || '',
    agent.website || null,
    serpKey,
    socialFbUrl,
  )

  // ── STEP 2: Analyze — deep profile ─────────────────────────────────────────
  const profile = await analyzeEvidence(
    agent.name,
    agent.city    || '',
    agent.state   || '',
    agent.website || null,
    evidenceBlob,
    ownerNames,
    websitePagesFound,
  )

  // Attach FB URL from evidence gathering if AI didn't find it
  if (!profile.facebook_profile_url && facebookProfileUrl) {
    profile.facebook_profile_url = facebookProfileUrl
  }

  // Attach serp debug
  profile.serp_debug = serpDebug

  // ── STEP 3: Deterministic affiliation signal scan ───────────────────────────
  const affiliationSignal = detectAffiliationSignal(evidenceBlob)

  // ── STEP 4: Save specimen ───────────────────────────────────────────────────
  const { data: existing } = await supabase
    .from('anathema_specimens')
    .select('id')
    .eq('clerk_id', userId)
    .eq('agent_name', agent.name)
    .eq('city', agent.city || '')
    .eq('state', agent.state || '')
    .single()

  let specimenId: string | null = null

  const specimenPayload = {
    clerk_id:          userId,
    agent_name:        agent.name,
    city:              agent.city    || '',
    state:             agent.state   || '',
    agent_website:     agent.website || null,
    analysis_json:     { ...profile, serp_debug: undefined }, // don't bloat the main json
    serp_debug:        serpDebug,
    affiliation_signal: affiliationSignal,
    facebook_profile_url: profile.facebook_profile_url,
  }

  if (existing?.id) {
    await supabase
      .from('anathema_specimens')
      .update(specimenPayload)
      .eq('id', existing.id)
    specimenId = existing.id
  } else {
    const { data: inserted } = await supabase
      .from('anathema_specimens')
      .insert(specimenPayload)
      .select('id')
      .single()
    specimenId = inserted?.id || null
  }

  return NextResponse.json({
    id:                 specimenId,
    profile,
    affiliation_signal: affiliationSignal,
    serp_debug:         serpDebug,
  })
}
