// ─── upsert.ts ────────────────────────────────────────────────────────────────
// Writes enriched agent results to agent_profiles in Supabase.
// On conflict (same clerk_id + name + city + state): updates enrichment fields.
// Anathema/David fields are never touched here.

import { supabase } from '@/lib/supabase.server'
import type { AgentResult } from './types'

export async function upsertAgentProfiles(
  clerkId: string,
  city: string,
  state: string,
  agents: AgentResult[],
): Promise<void> {
  if (!agents.length) return

  const rows = agents.map(a => ({
    clerk_id: clerkId,
    name: a.name,
    agency_type: a.type,
    city, state,
    address: a.address || null,
    phone: a.phone || null,
    website: a.website || null,
    contact_email: a.contact_email || null,
    social_links: a.social_links?.length ? a.social_links : null,
    rating: a.rating || null,
    reviews: a.reviews || null,
    carriers: a.carriers?.length ? a.carriers : null,
    captive: a.captive || false,
    wrong_line: a.wrongLine || false,
    prometheus_score: a.score,
    prometheus_flag: a.flag,
    prometheus_notes: a.notes,
    prometheus_about: a.about || null,
    hiring: a.hiring || false,
    hiring_roles: a.hiring_roles?.length ? a.hiring_roles : null,
    youtube_channel: a.youtube_channel || null,
    youtube_subscribers: a.youtube_subscribers || null,
    last_seen: new Date().toISOString(),
  }))

  await supabase.from('agent_profiles').upsert(rows, {
    onConflict: 'clerk_id,name,city,state',
    ignoreDuplicates: false,
  })

  void supabase.rpc('increment_agent_search_count', {
    p_clerk_id: clerkId,
    p_names: agents.map(a => a.name),
    p_city: city,
    p_state: state,
  })
}
