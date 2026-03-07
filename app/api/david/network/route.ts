// ─── app/api/david/network/route.ts ───────────────────────────────────────────
// Returns all ANATHEMA specimens for the current user, shaped for the
// David network visualization. Lightweight — no serp_debug, no full facts.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase.server'
import { isAdmin } from '@/lib/auth/access'
import { ALLOWED_ORIGINS } from '@/lib/config'

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin')
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('anathema_specimens')
    .select(`
      id,
      agent_name,
      city,
      state,
      predicted_tree,
      predicted_confidence,
      confirmed_tree,
      predicted_sub_imo,
      predicted_sub_imo_confidence,
      unresolved_upline,
      facebook_profile_url,
      david_facts,
      created_at
    `)
    .eq('clerk_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Shape for the network — only what the visualization needs
  const nodes = (data || []).map(s => {
    const facts = s.david_facts?.facts || []
    const tree = s.confirmed_tree || s.predicted_tree || 'unknown'
    const upline = s.predicted_sub_imo || s.unresolved_upline || null

    return {
      id:           s.id,
      name:         s.agent_name,
      city:         s.city,
      state:        s.state,
      tree:         tree.toUpperCase(),
      confidence:   s.predicted_confidence || 0,
      upline:       upline,
      facts:        facts.length,
      highFacts:    facts.filter((f: { usability: string }) => f.usability === 'HIGH').length,
      factsList:    facts.slice(0, 12).map((f: { fact: string; usability: string; source_type: string }) => ({
        fact:     f.fact,
        usability: f.usability,
        source:   f.source_type,
      })),
      hasFacebook:  !!s.facebook_profile_url,
      apifyEnriched: (s.david_facts?.scan_sources_used || []).some((src: string) =>
        src.startsWith('APIFY_')
      ),
      scannedAt:    s.created_at,
    }
  })

  return NextResponse.json({ nodes })
}
