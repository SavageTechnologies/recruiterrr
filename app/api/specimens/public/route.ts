import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase.server'

export async function GET(req: NextRequest) {
  // Public endpoint — no auth required, but only return confirmed specimens
  // and strip any personally identifying recruiter data
  const { data, error } = await supabase
    .from('anathema_specimens')
    .select('id, city, state, confirmed_tree, created_at')
    .not('confirmed_tree', 'is', null)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Strip all identifying info — public map only gets location + strain
  const redacted = (data || []).map((s, i) => ({
    id: s.id,
    specimen_number: String(i + 1).padStart(4, '0'),
    city: s.city,
    state: s.state,
    confirmed_tree: s.confirmed_tree,
    created_at: s.created_at,
  }))

  return NextResponse.json({ specimens: redacted })
}
