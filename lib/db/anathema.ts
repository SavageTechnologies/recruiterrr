// ─── lib/db/anathema.ts ───────────────────────────────────────────────────────
// All Supabase reads and writes for ANATHEMA scans.
// The route handler calls these — no raw Supabase queries in the route.

import { supabase } from '@/lib/supabase.server'
import { matchPartnerByName } from '@/lib/networks'
import type { ChainSignal } from '@/lib/anathema-types'
import type { DavidFactsResult } from '@/lib/domain/anathema/david-facts'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type SaveObservationInput = {
  userId: string
  agent_name: string
  city: string
  state: string
  agent_website?: string
  agent_address?: string
  predicted_tree: string
  predicted_confidence: number
  prediction_signals: string[]
  prediction_reasoning: string
  prediction_source: string | null
  facebook_profile_url: string | null
  facebook_about: string | null
  confirmed_tree?: string
  confirmed_tree_other?: string
  confirmed_sub_imo?: string
  recruiter_notes?: string
  predicted_sub_imo?: string | null
  predicted_sub_imo_confidence?: number | null
  predicted_sub_imo_signals?: ChainSignal[] | null
  predicted_sub_imo_partner_id?: number | null
  serp_debug?: any
  unresolved_upline?: string | null
  // DAVID — stored separately, never used by ANATHEMA scoring
  david_facts?: DavidFactsResult | null
}

// ─── SAVE OBSERVATION ─────────────────────────────────────────────────────────
// Upserts specimen + writes observation history + back-fills agent_profiles.

export async function saveObservation(input: SaveObservationInput): Promise<{ ok: boolean; id: string | null }> {
  const {
    userId,
    agent_name, city, state, agent_website, agent_address,
    predicted_tree, predicted_confidence, prediction_signals, prediction_reasoning,
    prediction_source, facebook_profile_url, facebook_about,
    confirmed_tree, confirmed_tree_other, confirmed_sub_imo, recruiter_notes,
    predicted_sub_imo, predicted_sub_imo_confidence, predicted_sub_imo_signals,
    predicted_sub_imo_partner_id, serp_debug, unresolved_upline,
    david_facts,
  } = input

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
        prediction_source, facebook_profile_url, facebook_about,
        confirmed_tree, confirmed_tree_other, confirmed_sub_imo, recruiter_notes,
        confirmed_sub_imo_partner_id,
        ...(predicted_sub_imo !== undefined && { predicted_sub_imo }),
        ...(predicted_sub_imo_confidence !== undefined && { predicted_sub_imo_confidence }),
        ...(predicted_sub_imo_signals !== undefined && { predicted_sub_imo_signals }),
        ...(predicted_sub_imo_partner_id !== undefined && { predicted_sub_imo_partner_id }),
        ...(serp_debug !== undefined && { serp_debug }),
        ...(david_facts !== undefined && { david_facts }),
      })
      .eq('id', existing.id)
  } else {
    const { data: inserted } = await supabase
      .from('anathema_specimens')
      .insert({
        clerk_id: userId,
        agent_name, city, state, agent_website, agent_address,
        predicted_tree, predicted_confidence, prediction_signals, prediction_reasoning,
        prediction_source, facebook_profile_url, facebook_about,
        confirmed_tree, confirmed_tree_other, confirmed_sub_imo, recruiter_notes,
        confirmed_sub_imo_partner_id,
        predicted_sub_imo: predicted_sub_imo || null,
        predicted_sub_imo_confidence: predicted_sub_imo_confidence || null,
        predicted_sub_imo_signals: predicted_sub_imo_signals || null,
        predicted_sub_imo_partner_id: predicted_sub_imo_partner_id || null,
        serp_debug: serp_debug || null,
        david_facts: david_facts || null,
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

  // Back-fill agent_profiles — awaited because scan results appear in the database view
  await supabase
    .from('agent_profiles')
    .update({
      anathema_run:         true,
      predicted_tree:       confirmed_tree || predicted_tree || null,
      predicted_confidence: predicted_confidence || null,
      predicted_sub_imo:    confirmed_sub_imo || predicted_sub_imo || null,
      unresolved_upline:    unresolved_upline || null,
      anathema_signals:     prediction_signals || null,
      anathema_scanned_at:  new Date().toISOString(),
    })
    .eq('clerk_id', userId)
    .ilike('name', `%${agent_name}%`)
    .ilike('city', `%${city}%`)
    .ilike('state', `%${state}%`)

  return { ok: true, id: specimenId || null }
}
// ─── CHECK EXISTING ───────────────────────────────────────────────────────────

export async function checkExistingSpecimen(
  userId: string,
  agent_name: string,
  city: string,
  state: string
) {
  const { data } = await supabase
    .from('anathema_specimens')
    .select('*')
    .eq('clerk_id', userId)
    .eq('agent_name', agent_name)
    .eq('city', city)
    .eq('state', state)
    .maybeSingle()
  return data || null
}

// ─── SAVE DAVID FACTS ─────────────────────────────────────────────────────────
// Upserts specimen with just david_facts — no observation log required.
// Called automatically on every scan so David data is never lost.

export async function saveDavidFacts(
  userId: string,
  agent_name: string,
  city: string,
  state: string,
  david_facts: DavidFactsResult
): Promise<void> {
  const { data: existing } = await supabase
    .from('anathema_specimens')
    .select('id')
    .eq('clerk_id', userId)
    .eq('agent_name', agent_name)
    .eq('city', city)
    .eq('state', state)
    .single()

  if (existing?.id) {
    await supabase
      .from('anathema_specimens')
      .update({ david_facts })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('anathema_specimens')
      .insert({
        clerk_id: userId,
        agent_name, city, state,
        david_facts,
        predicted_tree: 'unknown',
        predicted_confidence: 0,
        prediction_signals: [],
        prediction_reasoning: '',
        prediction_source: null,
        facebook_profile_url: null,
        facebook_about: null,
      })
  }
}

// ─── GET SPECIMEN ─────────────────────────────────────────────────────────────

export async function getSpecimen(userId: string, id: string) {
  const { data, error } = await supabase
    .from('anathema_specimens')
    .select('*')
    .eq('id', id)
    .eq('clerk_id', userId)
    .single()
  if (error || !data) return null
  return data
}

// ─── GET SCAN ─────────────────────────────────────────────────────────────────

export async function getScan(userId: string, id: string) {
  const { data, error } = await supabase
    .from('anathema_scans')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  if (error || !data) return null
  return data
}
